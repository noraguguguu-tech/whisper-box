// Shared domain types for the anonymous whisper box.

export type MessageStatus = "unread" | "read" | "replied";

/** One follow-up turn in an ongoing anonymous conversation. */
export interface ConversationTurn {
  id: string;
  author: "visitor" | "owner";
  body: string;
  createdAt: string; // ISO
}

/** A single anonymous conversation: visitor message + optional owner reply. */
export interface WhisperMessage {
  id: string;
  body: string;
  reply: string | null;
  status: MessageStatus;
  isPublic: boolean;
  blocked: boolean;
  reported: boolean;
  pending: boolean;
  receiptId: string;
  createdAt: string; // ISO
  repliedAt: string | null; // ISO
  turns: ConversationTurn[];
}

/** Owner-facing inbox view. */
export interface Inbox {
  slug: string;
  prompt: string;
  messages: WhisperMessage[];
}

/** Public wall entry shown to visitors on the owner's link page. */
export interface PublicEntry {
  id: string;
  body: string;
  reply: string;
  repliedAt: string;
}

/** Visitor receipt view. */
export interface ReceiptView {
  id: string;
  body: string;
  reply: string | null;
  status: MessageStatus;
  createdAt: string;
  repliedAt: string | null;
  turns: ConversationTurn[];
  canFollowUp: boolean;
  closed: boolean;
}

/** Deterministic aged-paper note tint palette (letter-paper look). */
export const NOTE_TINTS = [
  "#F6EFDD", // cream
  "#F0E7D2", // ivory
  "#EDE4CE", // parchment
  "#F3EBD6", // warm sand
  "#E9E7DA", // pale linen
  "#F1E6CE", // aged buff
] as const;

export function tintForId(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return NOTE_TINTS[sum % NOTE_TINTS.length];
}
