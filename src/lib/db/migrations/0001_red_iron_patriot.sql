CREATE TABLE "turns" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"message_id" varchar(32) NOT NULL,
	"author" varchar(8) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "turns_message_idx" ON "turns" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "turns_created_at_idx" ON "turns" USING btree ("created_at");