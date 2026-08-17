import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import {
  inboxes,
  messages,
  turns,
  type Inbox,
  type MessageRow,
  type TurnRow,
} from "../schema/whisper";

// ---- id helpers ----
function randId(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// ---- inbox ----

/** Get an owner's inbox, creating it (with a random slug) on first access. */
export async function getOrCreateInbox(ownerUserId: string): Promise<Inbox> {
  const existing = await db
    .select()
    .from(inboxes)
    .where(eq(inboxes.ownerUserId, ownerUserId))
    .limit(1);
  if (existing[0]) return existing[0];

  const row = {
    id: randId(16),
    ownerUserId,
    slug: randId(8),
    prompt: "",
  };
  const inserted = await db.insert(inboxes).values(row).returning();
  return inserted[0];
}

export async function getInboxBySlug(slug: string): Promise<Inbox | undefined> {
  const rows = await db.select().from(inboxes).where(eq(inboxes.slug, slug)).limit(1);
  return rows[0];
}

export async function updateInboxPrompt(
  ownerUserId: string,
  prompt: string,
): Promise<Inbox | undefined> {
  const rows = await db
    .update(inboxes)
    .set({ prompt })
    .where(eq(inboxes.ownerUserId, ownerUserId))
    .returning();
  return rows[0];
}

// ---- messages ----

/** Owner's full message list (newest first). Scoped by owner via the inbox. */
export async function listMessagesForOwner(ownerUserId: string): Promise<MessageRow[]> {
  const inbox = await getOrCreateInbox(ownerUserId);
  return db
    .select()
    .from(messages)
    .where(eq(messages.inboxId, inbox.id))
    .orderBy(desc(messages.createdAt));
}

/** Public replied conversations for a slug's wall (newest replied first). */
export async function listPublicMessagesBySlug(slug: string): Promise<MessageRow[]> {
  const inbox = await getInboxBySlug(slug);
  if (!inbox) return [];
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.inboxId, inbox.id), eq(messages.isPublic, true)))
    .orderBy(desc(messages.repliedAt));
}

/** Visitor creates an anonymous letter. Returns the receiptId to keep. */
export async function createMessage(
  inboxId: string,
  body: string,
): Promise<MessageRow> {
  const row = {
    id: randId(16),
    inboxId,
    body,
    reply: null,
    status: "unread",
    isPublic: false,
    receiptId: randId(32),
  };
  const inserted = await db.insert(messages).values(row).returning();
  return inserted[0];
}

/** Visitor view by receipt — no auth, only the unguessable receiptId. */
export async function getMessageByReceipt(
  receiptId: string,
): Promise<MessageRow | undefined> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.receiptId, receiptId))
    .limit(1);
  return rows[0];
}

/** Confirm a message belongs to the owner (via inbox ownership). */
async function ownsMessage(ownerUserId: string, messageId: string): Promise<MessageRow | undefined> {
  const rows = await db
    .select({ msg: messages })
    .from(messages)
    .innerJoin(inboxes, eq(messages.inboxId, inboxes.id))
    .where(and(eq(messages.id, messageId), eq(inboxes.ownerUserId, ownerUserId)))
    .limit(1);
  return rows[0]?.msg;
}

export async function markMessageRead(
  ownerUserId: string,
  messageId: string,
): Promise<MessageRow | undefined> {
  const owned = await ownsMessage(ownerUserId, messageId);
  if (!owned) return undefined;
  if (owned.status !== "unread") return owned;
  const rows = await db
    .update(messages)
    .set({ status: "read" })
    .where(eq(messages.id, messageId))
    .returning();
  return rows[0];
}

export async function replyToMessage(
  ownerUserId: string,
  messageId: string,
  reply: string,
): Promise<MessageRow | undefined> {
  const owned = await ownsMessage(ownerUserId, messageId);
  if (!owned) return undefined;
  const rows = await db
    .update(messages)
    .set({ reply, status: "replied", repliedAt: new Date() })
    .where(eq(messages.id, messageId))
    .returning();
  return rows[0];
}

export async function setMessagePublic(
  ownerUserId: string,
  messageId: string,
  isPublic: boolean,
): Promise<MessageRow | undefined> {
  const owned = await ownsMessage(ownerUserId, messageId);
  if (!owned) return undefined;
  const rows = await db
    .update(messages)
    .set({ isPublic })
    .where(eq(messages.id, messageId))
    .returning();
  return rows[0];
}
