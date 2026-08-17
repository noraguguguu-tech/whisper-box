CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(256),
	"name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "inboxes" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"owner_user_id" varchar(128) NOT NULL,
	"slug" varchar(32) NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inboxes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"inbox_id" varchar(32) NOT NULL,
	"body" text NOT NULL,
	"reply" text,
	"status" varchar(16) DEFAULT 'unread' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"receipt_id" varchar(40) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"replied_at" timestamp,
	CONSTRAINT "messages_receipt_id_unique" UNIQUE("receipt_id")
);
--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inboxes_owner_idx" ON "inboxes" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "inboxes_slug_idx" ON "inboxes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "messages_inbox_idx" ON "messages" USING btree ("inbox_id");--> statement-breakpoint
CREATE INDEX "messages_receipt_idx" ON "messages" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");