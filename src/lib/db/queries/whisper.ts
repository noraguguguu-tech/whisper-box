import { and, asc, desc, eq, gt, lt, inArray, sql } from "drizzle-orm";
import { db } from "../client";
import {
  inboxes,
  messages,
  turns,
  rateHits,
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

/** Owner opens/closes the inbox (emergency valve). */
export async function setInboxClosed(
  ownerUserId: string,
  closed: boolean,
): Promise<Inbox | undefined> {
  const rows = await db
    .update(inboxes)
    .set({ closed })
    .where(eq(inboxes.ownerUserId, ownerUserId))
    .returning();
  return rows[0];
}

/** Owner switches review mode: "suspicious" (default) or "all". */
export async function setModerationMode(
  ownerUserId: string,
  mode: "suspicious" | "all",
): Promise<Inbox | undefined> {
  const rows = await db
    .update(inboxes)
    .set({ moderationMode: mode })
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
    .where(
      and(
        eq(messages.inboxId, inbox.id),
        eq(messages.isPublic, true),
        eq(messages.pending, false),
      ),
    )
    .orderBy(desc(messages.repliedAt));
}

/** Visitor creates an anonymous letter. Returns the receiptId to keep. */
export async function createMessage(
  inboxId: string,
  body: string,
  pending = false,
): Promise<MessageRow> {
  const row = {
    id: randId(16),
    inboxId,
    body,
    reply: null,
    status: "unread",
    isPublic: false,
    pending,
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

// ---- conversation turns (follow-ups after the first reply) ----

/** All follow-up turns for one message thread, oldest first. */
export async function listTurns(messageId: string): Promise<TurnRow[]> {
  return db
    .select()
    .from(turns)
    .where(eq(turns.messageId, messageId))
    .orderBy(asc(turns.createdAt));
}

/** Follow-up turns for many threads at once (owner inbox), oldest first. */
export async function listTurnsForMessages(
  messageIds: string[],
): Promise<TurnRow[]> {
  if (messageIds.length === 0) return [];
  return db
    .select()
    .from(turns)
    .where(inArray(turns.messageId, messageIds))
    .orderBy(asc(turns.createdAt));
}

async function insertTurn(
  messageId: string,
  author: "visitor" | "owner",
  body: string,
): Promise<TurnRow> {
  const inserted = await db
    .insert(turns)
    .values({ id: randId(16), messageId, author, body })
    .returning();
  return inserted[0];
}

/**
 * Visitor adds a follow-up, addressed only by the unguessable receiptId.
 * Allowed only once the owner has replied (status "replied") — otherwise there
 * is nothing to continue. Re-marks the thread unread so the owner sees it.
 * Returns the updated message row, or undefined if not permitted.
 */
export async function addVisitorTurn(
  receiptId: string,
  body: string,
): Promise<{ status: "ok"; row: MessageRow } | { status: "blocked" | "not_allowed" }> {
  const msg = await getMessageByReceipt(receiptId);
  if (!msg) return { status: "not_allowed" };
  if (msg.blocked) return { status: "blocked" };
  if (msg.status !== "replied") return { status: "not_allowed" };
  await insertTurn(msg.id, "visitor", body);
  const rows = await db
    .update(messages)
    .set({ status: "unread" })
    .where(eq(messages.id, msg.id))
    .returning();
  return { status: "ok", row: rows[0] };
}

/**
 * Owner adds a follow-up on a thread they own. Marks the thread replied.
 * Returns the updated message row, or undefined if not owned.
 */
export async function addOwnerTurn(
  ownerUserId: string,
  messageId: string,
  body: string,
): Promise<MessageRow | undefined> {
  const owned = await ownsMessage(ownerUserId, messageId);
  if (!owned) return undefined;
  await insertTurn(messageId, "owner", body);
  const rows = await db
    .update(messages)
    .set({ status: "replied", repliedAt: new Date() })
    .where(eq(messages.id, messageId))
    .returning();
  return rows[0];
}

// ---- owner moderation: delete, block/mute ----

/** Owner deletes a letter and its whole thread. Returns true if deleted. */
export async function deleteMessage(
  ownerUserId: string,
  messageId: string,
): Promise<boolean> {
  const owned = await ownsMessage(ownerUserId, messageId);
  if (!owned) return false;
  await db.delete(turns).where(eq(turns.messageId, messageId));
  await db.delete(messages).where(eq(messages.id, messageId));
  return true;
}

/** Owner mutes/unmutes a thread — muted threads reject visitor follow-ups. */
export async function setMessageBlocked(
  ownerUserId: string,
  messageId: string,
  blocked: boolean,
): Promise<MessageRow | undefined> {
  const owned = await ownsMessage(ownerUserId, messageId);
  if (!owned) return undefined;
  const rows = await db
    .update(messages)
    .set({ blocked })
    .where(eq(messages.id, messageId))
    .returning();
  return rows[0];
}

/** Visitor flags a thread as harmful (no auth; by receiptId). */
export async function reportMessageByReceipt(receiptId: string): Promise<boolean> {
  const rows = await db
    .update(messages)
    .set({ reported: true })
    .where(eq(messages.receiptId, receiptId))
    .returning();
  return rows.length > 0;
}

/** Owner approves a pending letter — it leaves review and enters the inbox. */
export async function approveMessage(
  ownerUserId: string,
  messageId: string,
): Promise<MessageRow | undefined> {
  const owned = await ownsMessage(ownerUserId, messageId);
  if (!owned) return undefined;
  const rows = await db
    .update(messages)
    .set({ pending: false })
    .where(eq(messages.id, messageId))
    .returning();
  return rows[0];
}

// ---- rate limiting (durable, IP-hash bucket) ----

/**
 * Record one accepted write and return whether the caller is now over the
 * limit within the window. `bucket` is an opaque hashed key (never a raw IP).
 * Returns true when the write should be ALLOWED, false when throttled.
 */
export async function checkAndRecordRate(
  bucket: string,
  windowSeconds: number,
  maxInWindow: number,
): Promise<boolean> {
  if (await isRateExceeded(bucket, windowSeconds, maxInWindow)) return false;
  await recordRateHit(bucket);
  return true;
}

/** Count-only check: true when the bucket is AT or OVER the limit in-window. */
export async function isRateExceeded(
  bucket: string,
  windowSeconds: number,
  maxInWindow: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000);
  const recent = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateHits)
    .where(and(eq(rateHits.bucket, bucket), gt(rateHits.createdAt, since)));
  return Number(recent[0]?.n ?? 0) >= maxInWindow;
}

/** Record a single accepted write for a bucket. */
export async function recordRateHit(bucket: string): Promise<void> {
  await db.insert(rateHits).values({ id: randId(16), bucket });
  // Opportunistic TTL cleanup — no cron needed. We only prune on a fraction of
  // writes to avoid write amplification; the created_at index keeps it cheap.
  if (Math.random() < RATE_HIT_PRUNE_PROBABILITY) {
    await pruneExpiredRateHits().catch(() => undefined);
  }
}

// Anti-abuse tokens must not be retained long-term (see Privacy Policy). The
// longest counting window is the daily cap (86400s); anything older carries no
// counting value, so we keep a small buffer beyond it and delete the rest.
export const RATE_HIT_TTL_SECONDS = 2 * 86400; // 2 days
const RATE_HIT_PRUNE_PROBABILITY = 0.1; // prune on ~10% of writes

/**
 * Delete rate-limit tokens older than the TTL. Safe to call anytime; returns
 * the number of rows removed. Can also be wired to a scheduled job later.
 */
export async function pruneExpiredRateHits(): Promise<number> {
  const cutoff = new Date(Date.now() - RATE_HIT_TTL_SECONDS * 1000);
  const deleted = await db
    .delete(rateHits)
    .where(lt(rateHits.createdAt, cutoff))
    .returning({ id: rateHits.id });
  return deleted.length;
}
