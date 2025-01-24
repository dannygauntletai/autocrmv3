create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.customers enable row level security;

-- Allow anyone to insert (needed for customer registration)
create policy "Allow anyone to insert customers"
  on public.customers for insert
  with check (true);

-- Allow customers to view their own data
create policy "Allow customers to view their own data"
  on public.customers for select
  using (email = current_setting('app.customer_email', true)::text);

-- Create index on email for faster lookups
create index if not exists customers_email_idx on public.customers (email); 