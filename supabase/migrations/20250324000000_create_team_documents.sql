-- Enable the vector extension if not already enabled
create extension if not exists vector with schema extensions;

-- Create the files table
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_type text not null,
  size integer not null,
  description text,
  uploaded_by uuid references public.employees(id) on delete set null,
  team_id uuid references public.teams(id) on delete cascade,
  bucket_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Create the file_embeddings table
create table if not exists public.file_embeddings (
  id uuid primary key default gen_random_uuid(),
  file_id uuid references public.files(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for faster similarity searches
create index on public.file_embeddings using ivfflat (embedding vector_cosine_ops);

-- Add RLS policies
alter table public.files enable row level security;
alter table public.file_embeddings enable row level security;

-- Files policies
create policy "Allow team members to view files"
  on public.files for select
  using (
    auth.uid() in (
      select employee_id from employee_teams where team_id = files.team_id
    )
  );

create policy "Allow team supervisors to insert files"
  on public.files for insert
  with check (
    auth.uid() in (
      select e.id from employees e
      inner join employee_teams et on et.employee_id = e.id
      where et.team_id = files.team_id 
      and e.role = 'supervisor'
    )
  );

create policy "Allow team supervisors to delete files"
  on public.files for delete
  using (
    auth.uid() in (
      select e.id from employees e
      inner join employee_teams et on et.employee_id = e.id
      where et.team_id = files.team_id 
      and e.role = 'supervisor'
    )
  );

-- File embeddings policies
create policy "Allow team members to view file embeddings"
  on public.file_embeddings for select
  using (
    exists (
      select 1 from files
      where files.id = file_embeddings.file_id
      and auth.uid() in (
        select employee_id from employee_teams where team_id = files.team_id
      )
    )
  );

create policy "Allow service role to manage file embeddings"
  on public.file_embeddings
  using (auth.jwt()->>'role' = 'service_role');

-- Create storage bucket
insert into storage.buckets (id, name)
values ('team_documents', 'team_documents')
on conflict do nothing;

-- Storage bucket policies
create policy "Allow team members to view documents"
  on storage.objects for select
  using (
    bucket_id = 'team_documents'
    and auth.uid() in (
      select employee_id from employee_teams
      where team_id = (
        select team_id from files
        where bucket_path = storage.objects.name
      )
    )
  );

create policy "Allow team supervisors to upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'team_documents'
    and auth.uid() in (
      select e.id from employees e
      inner join employee_teams et on et.employee_id = e.id
      where e.role = 'supervisor'
    )
  );

create policy "Allow team supervisors to delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'team_documents'
    and auth.uid() in (
      select e.id from employees e
      inner join employee_teams et on et.employee_id = e.id
      where e.role = 'supervisor'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 