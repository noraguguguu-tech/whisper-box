import { type NextRequest, NextResponse } from "next/server";
import { getMessageByReceipt } from "@/lib/db/queries";
import { toReceiptView } from "@/lib/whisper/serialize";

type Params = { params: Promise<{ receiptId: string }> };

/** GET /api/r/[receiptId] — visitor checks their letter + any reply. No auth. */
export async function GET(_request: NextRequest, { params }: Params) {
  const { receiptId } = await params;
  const row = await getMessageByReceipt(receiptId);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ receipt: toReceiptView(row) });
}
