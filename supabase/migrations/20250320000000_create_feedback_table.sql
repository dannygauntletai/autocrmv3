create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) not null,
  customer_email text not null,
  rating smallint check (rating >= 1 and rating <= 5) not null,
  status text check (status in ('sent', 'completed')) not null default 'sent',
  created_at timestamp with time zone default now() not null
);