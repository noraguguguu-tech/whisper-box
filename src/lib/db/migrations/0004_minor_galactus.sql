CREATE TABLE "moderation_logs" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"actor" varchar(16) NOT NULL,
	"actor_id" varchar(128) DEFAULT '' NOT NULL,
	"action" varchar(32) NOT NULL,
	"target_type" varchar(24) NOT NULL,
	"target_ref" varchar(64) NOT NULL,
	"reason" varchar(64) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "takedown_requests" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"target_type" varchar(24) NOT NULL,
	"target_ref" varchar(64) NOT NULL,
	"reason" varchar(32) NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"contact" varchar(200) DEFAULT '' NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "modlog_target_idx" ON "moderation_logs" USING btree ("target_ref");--> statement-breakpoint
CREATE INDEX "modlog_action_idx" ON "moderation_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "modlog_created_at_idx" ON "moderation_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "takedown_status_idx" ON "takedown_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "takedown_target_idx" ON "takedown_requests" USING btree ("target_ref");--> statement-breakpoint
CREATE INDEX "takedown_created_at_idx" ON "takedown_requests" USING btree ("created_at");