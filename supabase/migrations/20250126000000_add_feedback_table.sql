create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade,
  customer_email text not null,
  rating integer,
  comments text,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.feedback enable row level security;

create policy "Enable read access for authenticated users" on public.feedback
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for service role" on public.feedback
  for insert with check (auth.jwt()->>'role' = 'service_role');

create policy "Enable update for service role or matching customer email" on public.feedback
  for update using (
    auth.jwt()->>'role' = 'service_role' or
    auth.jwt()->>'email' = customer_email
  );

-- Add updated_at trigger
create trigger handle_updated_at before update on public.feedback
  for each row execute procedure moddatetime (updated_at); 