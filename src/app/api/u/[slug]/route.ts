import { type NextRequest, NextResponse } from "next/server";
import { createMessage, getInboxBySlug, listPublicMessagesBySlug } from "@/lib/db/queries";
import { toPublicEntry } from "@/lib/whisper/serialize";
import { screenContent } from "@/lib/whisper/moderation";
import { allowWrite } from "@/lib/whisper/rate-limit";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/u/[slug] — public: inbox prompt + public wall. No auth. */
export async function GET(_request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const inbox = await getInboxBySlug(slug);
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const publicRows = await listPublicMessagesBySlug(slug);
  return NextResponse.json({
    prompt: inbox.prompt,
    wall: publicRows.map(toPublicEntry),
  });
}

/** POST /api/u/[slug] — visitor sends an anonymous letter. No auth. */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const inbox = await getInboxBySlug(slug);
  if (!inbox) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  // Basic keyword screen (not AI). Blocked content never reaches the inbox.
  const screen = screenContent(text);
  if (!screen.ok) {
    return NextResponse.json(
      { error: "blocked_content", category: screen.category },
      { status: 422 },
    );
  }

  // Anti-flood throttle (no login, opaque IP hash).
  if (!(await allowWrite(request, "write"))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const row = await createMessage(inbox.id, text);
  return NextResponse.json({ receiptId: row.receiptId });
}
