-- audit_log was created in 0006 after 0004 enabled RLS on the other 8 tables,
-- so it shipped with RLS disabled and was exposed to PostgREST (advisor ERROR
-- rls_disabled_in_public). Enable RLS and allow reads only to admins.
-- Server writes go through the Drizzle service-role connection, which bypasses
-- RLS, so logAudit() keeps working. No INSERT/UPDATE/DELETE policies exist, so
-- anon/authenticated PostgREST clients can neither read (non-admin) nor write.
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "audit_log_admin_read"
  ON "audit_log" FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
