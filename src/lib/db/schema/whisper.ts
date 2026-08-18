import type { InferSelectModel } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * One inbox per owner (Eazo user). `slug` is the public link segment used at
 * /u/[slug]. `prompt` is the owner's guiding line shown to visitors.
 */
export const inboxes = pgTable(
  "inboxes",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    ownerUserId: varchar("owner_user_id", { length: 128 }).notNull(),
    slug: varchar("slug", { length: 32 }).notNull().unique(),
    prompt: text("prompt").notNull().default(""),
    // Emergency valve — when true, the inbox refuses all new letters.
    closed: boolean("closed").notNull().default(false),
    // "suspicious" = only flagged letters go to review; "all" = every new letter.
    moderationMode: varchar("moderation_mode", { length: 16 }).notNull().default("suspicious"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    ownerIdx: index("inboxes_owner_idx").on(table.ownerUserId),
    slugIdx: index("inboxes_slug_idx").on(table.slug),
  }),
);

export type Inbox = InferSelectModel<typeof inboxes>;

/**
 * An anonymous letter to an inbox, plus the owner's optional reply.
 * `receiptId` is the visitor's private key to check back at /r/[receiptId];
 * visitors are never identified — no visitor identity is stored.
 */
export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    inboxId: varchar("inbox_id", { length: 32 }).notNull(),
    body: text("body").notNull(),
    reply: text("reply"),
    status: varchar("status", { length: 16 }).notNull().default("unread"),
    isPublic: boolean("is_public").notNull().default(false),
    // Owner "mute" — when true, visitors can no longer add follow-up turns.
    blocked: boolean("blocked").notNull().default(false),
    // Visitor-flagged as harmful/harassment; surfaced to the owner.
    reported: boolean("reported").notNull().default(false),
    // Held for owner review — not in the unread count, not on the public wall,
    // until the owner approves it.
    pending: boolean("pending").notNull().default(false),
    receiptId: varchar("receipt_id", { length: 40 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    repliedAt: timestamp("replied_at"),
  },
  (table) => ({
    inboxIdx: index("messages_inbox_idx").on(table.inboxId),
    receiptIdx: index("messages_receipt_idx").on(table.receiptId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  }),
);

export type MessageRow = InferSelectModel<typeof messages>;

/**
 * Follow-up turns in an ongoing anonymous conversation, created AFTER the
 * initial letter (messages.body) and first reply (messages.reply). Each turn
 * belongs to one message thread and records who wrote it. Visitors stay
 * anonymous — a turn only stores the author role, never an identity.
 */
export const turns = pgTable(
  "turns",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    messageId: varchar("message_id", { length: 32 }).notNull(),
    author: varchar("author", { length: 8 }).notNull(), // "visitor" | "owner"
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    messageIdx: index("turns_message_idx").on(table.messageId),
    createdAtIdx: index("turns_created_at_idx").on(table.createdAt),
  }),
);

export type TurnRow = InferSelectModel<typeof turns>;

/**
 * Durable rate-limit ledger for anonymous writes. One row per accepted write,
 * keyed by an opaque `bucket` (hashed IP + action). We count rows in a recent
 * time window to throttle floods. Holds no message content and no raw IP.
 */
export const rateHits = pgTable(
  "rate_hits",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    bucket: varchar("bucket", { length: 80 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    bucketIdx: index("rate_hits_bucket_idx").on(table.bucket),
    createdAtIdx: index("rate_hits_created_at_idx").on(table.createdAt),
  }),
);

export type RateHitRow = InferSelectModel<typeof rateHits>;
