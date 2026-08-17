import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markMessageRead, replyToMessage, setMessagePublic } from "@/lib/db/queries";
import { toOwnerMessage } from "@/lib/whisper/serialize";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/messages/[id]
 * Owner actions on one message: mark read, reply, or toggle public.
 * Ownership is enforced in the query layer via inbox ownership.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; reply?: unknown; isPublic?: unknown }
    | null;
  const action = body?.action;

  if (action === "read") {
    const row = await markMessageRead(auth.user.id, id);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ message: toOwnerMessage(row) });
  }

  if (action === "reply") {
    const reply = typeof body?.reply === "string" ? body.reply.trim().slice(0, 1000) : "";
    if (!reply) return NextResponse.json({ error: "empty_reply" }, { status: 400 });
    const row = await replyToMessage(auth.user.id, id, reply);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ message: toOwnerMessage(row) });
  }

  if (action === "public") {
    const isPublic = body?.isPublic === true;
    const row = await setMessagePublic(auth.user.id, id, isPublic);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ message: toOwnerMessage(row) });
  }

  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}
