-- Copilote de candidature : schéma minimal + RLS
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  cv_json jsonb, locale text default 'fr', created_at timestamptz default now()
);
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text, content jsonb not null, created_at timestamptz default now()
);
create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text, company text, description text not null, url text, created_at timestamptz default now()
);
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  job_id uuid references jobs on delete set null, resume_id uuid references resumes on delete set null,
  score int check (score between 0 and 100), missing_keywords text[], corrections jsonb, created_at timestamptz default now()
);
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  job_id uuid references jobs on delete cascade, resume_id uuid references resumes,
  status text not null default 'saved' check (status in ('saved','applied','followed_up','interview','offer','rejected')),
  applied_at timestamptz, proof jsonb, created_at timestamptz default now()
);
create table passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  starts_at timestamptz not null default now(), ends_at timestamptz not null,
  cancelled_at timestamptz, reminder_sent boolean default false
);
create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null, granted boolean not null, created_at timestamptz default now()
);
do $$ declare t text; begin
  foreach t in array array['resumes','jobs','analyses','applications','passes','consents'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
