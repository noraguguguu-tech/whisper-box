import type {
  MessageRow,
  Inbox as InboxRow,
  TurnRow,
} from "@/lib/db/schema/whisper";
import type {
  MessageStatus,
  WhisperMessage,
  ReceiptView,
  PublicEntry,
  ConversationTurn,
} from "@/lib/whisper/types";

function toTurn(row: TurnRow): ConversationTurn {
  return {
    id: row.id,
    author: row.author === "owner" ? "owner" : "visitor",
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Owner-facing message DTO (safe to send the owner). */
export function toOwnerMessage(
  row: MessageRow,
  turns: TurnRow[] = [],
): WhisperMessage {
  return {
    id: row.id,
    body: row.body,
    reply: row.reply,
    status: row.status as MessageStatus,
    isPublic: row.isPublic,
    receiptId: row.receiptId,
    createdAt: row.createdAt.toISOString(),
    repliedAt: row.repliedAt ? row.repliedAt.toISOString() : null,
    turns: turns.map(toTurn),
  };
}

/** Visitor receipt DTO — no receiptId echoed, no owner internals. */
export function toReceiptView(
  row: MessageRow,
  turns: TurnRow[] = [],
): ReceiptView {
  return {
    id: row.id,
    body: row.body,
    reply: row.reply,
    status: row.status as MessageStatus,
    createdAt: row.createdAt.toISOString(),
    repliedAt: row.repliedAt ? row.repliedAt.toISOString() : null,
    turns: turns.map(toTurn),
    // A visitor may continue the thread only once the owner has replied.
    canFollowUp: row.status === "replied",
  };
}

/** Public wall entry DTO — only body + reply, never receiptId. */
export function toPublicEntry(row: MessageRow): PublicEntry {
  return {
    id: row.id,
    body: row.body,
    reply: row.reply ?? "",
    repliedAt: row.repliedAt ? row.repliedAt.toISOString() : row.createdAt.toISOString(),
  };
}

export function inboxPublic(row: InboxRow): { slug: string; prompt: string } {
  return { slug: row.slug, prompt: row.prompt };
}
