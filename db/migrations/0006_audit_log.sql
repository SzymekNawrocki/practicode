-- Append-only audit log for admin actions (publish, delete, role changes)
CREATE TABLE "audit_log" (
  "id"          uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_id"    uuid         REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "action"      varchar(64)  NOT NULL,
  "target_type" varchar(64),
  "target_id"   text,
  "metadata"    jsonb,
  "created_at"  timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx"      ON "audit_log" ("actor_id");
--> statement-breakpoint
CREATE INDEX "audit_log_action_idx"     ON "audit_log" ("action");
--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" ("created_at" DESC);
