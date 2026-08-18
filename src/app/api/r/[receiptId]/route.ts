import { type NextRequest, NextResponse } from "next/server";
import {
  addVisitorTurn,
  getMessageByReceipt,
  listTurns,
  reportMessageByReceipt,
} from "@/lib/db/queries";
import { toReceiptView } from "@/lib/whisper/serialize";
import { screenContent } from "@/lib/whisper/moderation";
import { allowWrite } from "@/lib/whisper/rate-limit";

type Params = { params: Promise<{ receiptId: string }> };

/** GET /api/r/[receiptId] — visitor checks their letter, reply, and thread. */
export async function GET(_request: NextRequest, { params }: Params) {
  const { receiptId } = await params;
  const row = await getMessageByReceipt(receiptId);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const turns = await listTurns(row.id);
  return NextResponse.json({ receipt: toReceiptView(row, turns) });
}

/**
 * POST /api/r/[receiptId] — visitor sends a follow-up in the same thread.
 * Allowed only after the owner has replied and the thread is not muted.
 * No auth; the unguessable receiptId is the visitor's key.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { receiptId } = await params;
  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const screen = screenContent(text);
  if (!screen.ok) {
    return NextResponse.json(
      { error: "blocked_content", category: screen.category },
      { status: 422 },
    );
  }

  if (!(await allowWrite(request, "followup"))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await addVisitorTurn(receiptId, text);
  if (result.status === "blocked") {
    return NextResponse.json({ error: "thread_closed" }, { status: 403 });
  }
  if (result.status !== "ok") {
    return NextResponse.json({ error: "not_allowed" }, { status: 400 });
  }
  const turns = await listTurns(result.row.id);
  return NextResponse.json({ receipt: toReceiptView(result.row, turns) });
}

/** PATCH /api/r/[receiptId] — visitor flags this thread as harmful. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { receiptId } = await params;
  const body = (await request.json().catch(() => null)) as { action?: unknown } | null;
  if (body?.action !== "report") {
    return NextResponse.json({ error: "bad_action" }, { status: 400 });
  }
  const ok = await reportMessageByReceipt(receiptId);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
