-- Create HNSW index for vector search optimization
CREATE INDEX ON "DecisionEmbedding" USING hnsw (embedding vector_cosine_ops);