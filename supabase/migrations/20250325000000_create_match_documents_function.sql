-- Create a function to match document chunks using vector similarity
create or replace function match_document_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  team_id uuid
)
returns table (
  content text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    fe.content,
    1 - (fe.embedding <=> query_embedding) as similarity,
    fe.metadata
  from
    file_embeddings fe
    join files f on f.id = fe.file_id
  where
    f.team_id = match_document_chunks.team_id
    and 1 - (fe.embedding <=> query_embedding) > match_threshold
  order by fe.embedding <=> query_embedding
  limit match_count;
end;
$$; 