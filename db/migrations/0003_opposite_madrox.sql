CREATE TABLE "entry_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"problem" text,
	"explanation" text,
	"best_practices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"anti_patterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"refactoring_guidance" text,
	"related_concepts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text NOT NULL,
	"category_id" uuid,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"saved_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entry_versions" ADD CONSTRAINT "entry_versions_entry_id_knowledge_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."knowledge_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_versions" ADD CONSTRAINT "entry_versions_saved_by_users_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;