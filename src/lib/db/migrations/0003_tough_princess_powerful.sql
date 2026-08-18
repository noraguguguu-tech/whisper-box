ALTER TABLE "inboxes" ADD COLUMN "closed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inboxes" ADD COLUMN "moderation_mode" varchar(16) DEFAULT 'suspicious' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "pending" boolean DEFAULT false NOT NULL;