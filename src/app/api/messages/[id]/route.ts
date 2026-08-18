import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  addOwnerTurn,
  deleteMessage,
  listTurns,
  markMessageRead,
  replyToMessage,
  setMessageBlocked,
  setMessagePublic,
} from "@/lib/db/queries";
import { toOwnerMessage } from "@/lib/whisper/serialize";
import type { MessageRow } from "@/lib/db/schema/whisper";

type Params = { params: Promise<{ id: string }> };

/** Serialize a message row with its current thread turns. */
async function respond(row: MessageRow) {
  const turns = await listTurns(row.id);
  return NextResponse.json({ message: toOwnerMessage(row, turns) });
}

/**
 * PATCH /api/messages/[id]
 * Owner actions on one message: read, reply, follow up, public, or block/mute.
 * Ownership is enforced in the query layer via inbox ownership.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { action?: unknown; reply?: unknown; isPublic?: unknown; blocked?: unknown }
    | null;
  const action = body?.action;

  if (action === "read") {
    const row = await markMessageRead(auth.user.id, id);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return respond(row);
  }

  if (action === "reply") {
    const reply = typeof body?.reply === "string" ? body.reply.trim().slice(0, 1000) : "";
    if (!reply) return NextResponse.json({ error: "empty_reply" }, { status: 400 });
    const row = await replyToMessage(auth.user.id, id, reply);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return respond(row);
  }

  if (action === "followup") {
    const reply = typeof body?.reply === "string" ? body.reply.trim().slice(0, 1000) : "";
    if (!reply) return NextResponse.json({ error: "empty_reply" }, { status: 400 });
    const row = await addOwnerTurn(auth.user.id, id, reply);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return respond(row);
  }

  if (action === "public") {
    const isPublic = body?.isPublic === true;
    const row = await setMessagePublic(auth.user.id, id, isPublic);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return respond(row);
  }

  if (action === "block") {
    const blocked = body?.blocked === true;
    const row = await setMessageBlocked(auth.user.id, id, blocked);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return respond(row);
  }

  return NextResponse.json({ error: "bad_action" }, { status: 400 });
}

/** DELETE /api/messages/[id] — owner deletes a letter and its whole thread. */
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const ok = await deleteMessage(auth.user.id, id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
