// Shared domain types for the anonymous whisper box.

export type MessageStatus = "unread" | "read" | "replied";

/** A single anonymous conversation: visitor message + optional owner reply. */
export interface WhisperMessage {
  id: string;
  body: string;
  reply: string | null;
  status: MessageStatus;
  isPublic: boolean;
  receiptId: string;
  createdAt: string; // ISO
  repliedAt: string | null; // ISO
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
}

/** Deterministic pastel note tint palette (from the gummy design). */
export const NOTE_TINTS = [
  "#FFE0E6", // rose
  "#DDF5E9", // mint
  "#FFE9D6", // peach
  "#E8E4FF", // lilac
  "#FFF3C9", // butter
  "#DDEEFF", // sky
] as const;

export function tintForId(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return NOTE_TINTS[sum % NOTE_TINTS.length];
}
