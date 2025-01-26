-- Create a function to match similar ticket messages using vector similarity
create or replace function match_ticket_messages (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  message_body text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    tm.message_body,
    1 - (tme.embedding <=> query_embedding) as similarity
  from
    ticket_message_embeddings tme
    join ticket_messages tm on tm.id = tme.message_id
  where 1 - (tme.embedding <=> query_embedding) > match_threshold
  order by tme.embedding <=> query_embedding
  limit match_count;
end;
$$; 