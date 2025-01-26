-- Enable the vector extension
create extension if not exists vector with schema extensions;

-- Create a table for storing ticket message embeddings
create table if not exists public.ticket_message_embeddings (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  message_id uuid references public.ticket_messages(id) on delete cascade,
  embedding vector(1536), -- OpenAI's text-embedding-ada-002 uses 1536 dimensions
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for faster similarity searches
create index on public.ticket_message_embeddings using ivfflat (embedding vector_cosine_ops); 