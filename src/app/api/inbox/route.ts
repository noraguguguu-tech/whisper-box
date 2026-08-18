import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getOrCreateInbox,
  listMessagesForOwner,
  listTurnsForMessages,
  updateInboxPrompt,
  setInboxClosed,
  setModerationMode,
} from "@/lib/db/queries";
import { inboxPublic, toOwnerMessage } from "@/lib/whisper/serialize";

/** GET /api/inbox — owner's inbox + all messages (newest first). */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const inbox = await getOrCreateInbox(auth.user.id);
  const rows = await listMessagesForOwner(auth.user.id);
  const allTurns = await listTurnsForMessages(rows.map((r) => r.id));
  const byMessage = new Map<string, typeof allTurns>();
  for (const turn of allTurns) {
    const list = byMessage.get(turn.messageId) ?? [];
    list.push(turn);
    byMessage.set(turn.messageId, list);
  }
  return NextResponse.json({
    inbox: inboxPublic(inbox),
    messages: rows.map((r) => toOwnerMessage(r, byMessage.get(r.id) ?? [])),
  });
}

/** PATCH /api/inbox — update prompt, toggle closed, or switch review mode. */
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | { prompt?: unknown; closed?: unknown; moderationMode?: unknown }
    | null;

  // Toggle emergency close.
  if (typeof body?.closed === "boolean") {
    const updated = await setInboxClosed(auth.user.id, body.closed);
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ inbox: inboxPublic(updated) });
  }

  // Switch review mode.
  if (body?.moderationMode === "suspicious" || body?.moderationMode === "all") {
    const updated = await setModerationMode(auth.user.id, body.moderationMode);
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ inbox: inboxPublic(updated) });
  }

  // Otherwise update the guiding prompt.
  const prompt = typeof body?.prompt === "string" ? body.prompt.slice(0, 200) : "";
  const updated = await updateInboxPrompt(auth.user.id, prompt);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ inbox: inboxPublic(updated) });
}
