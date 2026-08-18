import { type NextRequest, NextResponse } from "next/server";
import { createMessage, getInboxBySlug, listPublicMessagesBySlug } from "@/lib/db/queries";
import { toPublicEntry } from "@/lib/whisper/serialize";
import { screenContent } from "@/lib/whisper/moderation";
import { truncateByCodePoints } from "@/lib/whisper/text";
import { allowRead, allowWrite } from "@/lib/whisper/rate-limit";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/u/[slug] — public: inbox prompt + public wall. No auth. */
export async function GET(request: NextRequest, { params }: Params) {
  // Enumeration guard first — a scanner sweeping many slugs is refused before
  // we ever touch the database. Fails open if the limiter itself errors.
  let allowed = true;
  try {
    allowed = await allowRead(request);
  } catch {
    allowed = true;
  }
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { slug } = await params;

  // Wall pagination. First page (offset 0) also carries inbox prompt/closed so
  // the initial visit is a single round-trip; "load more" requests pass a
  // positive offset and get back only the next wall slice.
  const offsetParam = Number(request.nextUrl.searchParams.get("wallOffset") ?? "0");
  const offset = Number.isFinite(offsetParam) ? Math.max(0, Math.trunc(offsetParam)) : 0;
  const PAGE_SIZE = 20;

  if (offset > 0) {
    const page = await listPublicMessagesBySlug(slug, { limit: PAGE_SIZE, offset });
    return NextResponse.json({
      wall: page.rows.map(toPublicEntry),
      wallHasMore: page.hasMore,
      wallTotal: page.total,
    });
  }

  const inbox = await getInboxBySlug(slug);
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const page = await listPublicMessagesBySlug(slug, { limit: PAGE_SIZE, offset: 0 });
  return NextResponse.json({
    prompt: inbox.prompt,
    closed: inbox.closed,
    wall: page.rows.map(toPublicEntry),
    wallHasMore: page.hasMore,
    wallTotal: page.total,
  });
}

/** POST /api/u/[slug] — visitor sends an anonymous letter. No auth. */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const inbox = await getInboxBySlug(slug);
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Emergency valve — the owner has temporarily closed the inbox.
  if (inbox.closed) {
    return NextResponse.json({ error: "inbox_closed" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const text = typeof body?.body === "string" ? truncateByCodePoints(body.body.trim(), 500) : "";
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  // Tiered keyword screen (not AI). Hard hits (block) never enter the inbox.
  const screen = screenContent(text);
  if (!screen.ok) {
    return NextResponse.json(
      { error: "blocked_content", category: screen.category },
      { status: 422 },
    );
  }

  // Anti-flood throttle (no login, opaque IP hash). Scoped per target inbox so
  // one busy inbox can't exhaust a visitor's budget for writing to others.
  if (!(await allowWrite(request, `write:${slug}`))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Held for review when the owner reviews everything, or when this letter
  // tripped a weak signal. Otherwise it goes straight to the inbox.
  const pending = inbox.moderationMode === "all" || screen.level === "review";

  const row = await createMessage(inbox.id, text, pending);
  return NextResponse.json({ receiptId: row.receiptId });
}
