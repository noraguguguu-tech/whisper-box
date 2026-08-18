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
    blocked: row.blocked,
    reported: row.reported,
    pending: row.pending,
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
    // A visitor may continue the thread only once the owner has replied AND the
    // owner has not muted the thread.
    canFollowUp: row.status === "replied" && !row.blocked,
    // Surfaced so the visitor sees a clear "closed" state instead of a failure.
    closed: row.blocked,
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

export function inboxPublic(
  row: InboxRow,
): { slug: string; prompt: string; closed: boolean; moderationMode: "suspicious" | "all" } {
  return {
    slug: row.slug,
    prompt: row.prompt,
    closed: row.closed,
    moderationMode: row.moderationMode === "all" ? "all" : "suspicious",
  };
}
