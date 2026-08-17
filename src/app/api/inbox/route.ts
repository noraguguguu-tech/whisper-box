import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateInbox,
  listMessagesForOwner,
  updateInboxPrompt,
} from "@/lib/db/queries";
import { inboxPublic, toOwnerMessage } from "@/lib/whisper/serialize";

/** GET /api/inbox — owner's inbox + all messages (newest first). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const inbox = await getOrCreateInbox(auth.user.id);
  const rows = await listMessagesForOwner(auth.user.id);
  return NextResponse.json({
    inbox: inboxPublic(inbox),
    messages: rows.map(toOwnerMessage),
  });
}

/** PATCH /api/inbox — update the owner's guiding prompt. */
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as { prompt?: unknown } | null;
  const prompt = typeof body?.prompt === "string" ? body.prompt.slice(0, 200) : "";
  const updated = await updateInboxPrompt(auth.user.id, prompt);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ inbox: inboxPublic(updated) });
}
