-- IVFFlat index for faster cosine similarity search on embeddings.
-- Run ANALYZE after backfilling embeddings so the query planner uses this index.
CREATE INDEX IF NOT EXISTS knowledge_entries_embedding_idx
  ON knowledge_entries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
