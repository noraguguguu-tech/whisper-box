import { type NextRequest, NextResponse } from "next/server";
import {
  addVisitorTurn,
  getMessageByReceipt,
  listTurns,
} from "@/lib/db/queries";
import { toReceiptView } from "@/lib/whisper/serialize";

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
 * Allowed only after the owner has replied. No auth; the unguessable
 * receiptId is the visitor's key.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { receiptId } = await params;
  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const row = await addVisitorTurn(receiptId, text);
  if (!row) return NextResponse.json({ error: "not_allowed" }, { status: 400 });
  const turns = await listTurns(row.id);
  return NextResponse.json({ receipt: toReceiptView(row, turns) });
}
