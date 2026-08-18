CREATE TABLE "rate_hits" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"bucket" varchar(80) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "blocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reported" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "rate_hits_bucket_idx" ON "rate_hits" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX "rate_hits_created_at_idx" ON "rate_hits" USING btree ("created_at");