CREATE TABLE "metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_id" varchar(128) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rows" jsonb NOT NULL,
	"row_count" integer NOT NULL,
	"duration_ms" integer,
	"error" text
);
--> statement-breakpoint
CREATE INDEX "metric_snapshots_metric_generated_idx" ON "metric_snapshots" USING btree ("metric_id","generated_at");
