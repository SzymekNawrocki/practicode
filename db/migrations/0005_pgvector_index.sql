-- IVFFlat index for faster cosine similarity search on embeddings.
-- Run ANALYZE after backfilling embeddings so the query planner uses this index.
-- Building an ivfflat index with lists=100 on 1536-dim vectors needs ~61 MB, but
-- this instance's default maintenance_work_mem is 32 MB. Raise it transaction-locally
-- for the build (drizzle wraps the migration in a single transaction, so SET LOCAL
-- covers the CREATE INDEX below and reverts on commit).
SET LOCAL maintenance_work_mem = '128MB';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS knowledge_entries_embedding_idx
  ON knowledge_entries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
