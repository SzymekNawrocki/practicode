-- GDPR Article 17: allow account deletion while retaining anonymised public entries.
-- Makes created_by nullable in both tables so a user row can be deleted
-- without deleting their published content.

ALTER TABLE "knowledge_entries" DROP CONSTRAINT "knowledge_entries_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "knowledge_entries" ALTER COLUMN "created_by" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "knowledge_entries"
  ADD CONSTRAINT "knowledge_entries_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

--> statement-breakpoint
ALTER TABLE "ai_drafts" DROP CONSTRAINT "ai_drafts_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_drafts" ALTER COLUMN "created_by" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "ai_drafts"
  ADD CONSTRAINT "ai_drafts_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
