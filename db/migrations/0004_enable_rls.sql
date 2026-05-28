-- Enable Row-Level Security on all application tables.
-- The Drizzle server connection (DATABASE_URL / pooler with postgres role) bypasses RLS for writes.
-- Read-side service filters remain in place as defence-in-depth.

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_drafts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags               ENABLE ROW LEVEL SECURITY;

-- categories: public read
CREATE POLICY "categories_read_public"
  ON categories FOR SELECT USING (true);

-- tags: public read
CREATE POLICY "tags_read_public"
  ON tags FOR SELECT USING (true);

-- knowledge_entries: anon can only see published; authenticated can also see own non-published; admin sees all
CREATE POLICY "entries_read_published"
  ON knowledge_entries FOR SELECT
  USING (status = 'published');

CREATE POLICY "entries_read_own"
  ON knowledge_entries FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "entries_admin_all"
  ON knowledge_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- entry_tags: follow entry visibility
CREATE POLICY "entry_tags_read"
  ON entry_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_entries e
      WHERE e.id = entry_tags.entry_id
        AND (e.status = 'published' OR e.created_by = auth.uid())
    )
  );

-- entry_relationships: follow entry visibility
CREATE POLICY "entry_relationships_read"
  ON entry_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_entries e
      WHERE e.id = entry_relationships.source_id
        AND (e.status = 'published' OR e.created_by = auth.uid())
    )
  );

-- entry_versions: authenticated, own entries only; admin all
CREATE POLICY "entry_versions_read_own"
  ON entry_versions FOR SELECT
  TO authenticated
  USING (saved_by = auth.uid());

CREATE POLICY "entry_versions_admin"
  ON entry_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ai_drafts: authenticated own rows; admin all
CREATE POLICY "drafts_read_own"
  ON ai_drafts FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "drafts_admin"
  ON ai_drafts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- users: own row; admin all
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_admin"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
