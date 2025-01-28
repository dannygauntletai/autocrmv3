-- Create kb_categories table
create table if not exists public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create kb_articles table
create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  tags text[] default array[]::text[],
  category_id uuid references public.kb_categories(id),
  ticket_id uuid references public.tickets(id),
  created_by uuid references public.employees(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;

-- Categories can be read by all authenticated users
create policy "Categories are viewable by all authenticated users"
  on public.kb_categories for select
  to authenticated
  using (true);

-- Articles can be read by all authenticated users
create policy "Articles are viewable by all authenticated users"
  on public.kb_articles for select
  to authenticated
  using (true);

-- Articles can be created by employees
create policy "Articles can be created by employees"
  on public.kb_articles for insert
  to authenticated
  with check (exists (
    select 1 from public.employees
    where id = auth.uid()
  ));

-- Add some basic functions
create or replace function public.search_kb_articles(search_query text)
returns setof public.kb_articles
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.kb_articles
  where
    to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', search_query)
  order by created_at desc;
$$; 