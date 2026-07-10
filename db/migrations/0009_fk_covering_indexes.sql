-- Covering indexes for unindexed foreign keys (Supabase performance advisor INFO).
-- Hand-written to match the 0004-0008 migration style; CREATE INDEX is deterministic
-- and identical to what drizzle-kit would emit for these schema-side index definitions.
CREATE INDEX IF NOT EXISTS "ke_category_id_idx"              ON "knowledge_entries"   ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_drafts_entry_id_idx"          ON "ai_drafts"           ("entry_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_drafts_created_by_idx"        ON "ai_drafts"           ("created_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entry_relationships_target_id_idx" ON "entry_relationships" ("target_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entry_tags_tag_id_idx"           ON "entry_tags"          ("tag_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entry_versions_entry_id_idx"     ON "entry_versions"      ("entry_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entry_versions_saved_by_idx"     ON "entry_versions"      ("saved_by");
