-- Soạn Lab Supabase schema v1
-- Run this file in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'teacher' check (role in ('admin', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  tool text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  structured_data jsonb default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  bank_scope text not null default 'user' check (bank_scope in ('system', 'user')),
  subject text,
  grade text,
  topic text,
  question_type text,
  difficulty text,
  content text not null,
  options jsonb default null,
  answer text,
  explanation text,
  metadata jsonb default '{}'::jsonb,
  book_series text,
  source_type text,
  content_type text,
  needs_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (bank_scope = 'system' and user_id is null)
    or (bank_scope = 'user' and user_id is not null)
  )
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_role text,
  category text not null,
  tool text not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  message text not null check (char_length(message) <= 3000),
  contact text,
  path text,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'ignored')),
  admin_note text
);

create table if not exists public.beta_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text check (phone is null or char_length(phone) <= 40),
  subject text not null check (char_length(subject) between 1 and 120),
  teaching_level text not null check (char_length(teaching_level) between 1 and 120),
  school text check (school is null or char_length(school) <= 180),
  purpose text not null check (char_length(purpose) between 1 and 1200),
  note text check (note is null or char_length(note) <= 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);

create unique index if not exists beta_requests_email_unique on public.beta_requests (lower(email));
create index if not exists beta_requests_created_at_idx on public.beta_requests (created_at desc);
create index if not exists beta_requests_status_idx on public.beta_requests (status);

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.templates enable row level security;
alter table public.question_bank enable row level security;
alter table public.user_settings enable row level security;
alter table public.feedback enable row level security;
alter table public.beta_requests enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_limited" on public.profiles;
create policy "profiles_update_own_limited" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "documents_own_all" on public.documents;
create policy "documents_own_all" on public.documents
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "templates_own_all" on public.templates;
create policy "templates_own_all" on public.templates
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "question_bank_own_all" on public.question_bank;
drop policy if exists "question_bank_select_own_seed_or_admin" on public.question_bank;
drop policy if exists "question_bank_select_system_own_or_admin" on public.question_bank;
drop policy if exists "question_bank_insert_own_or_admin_system" on public.question_bank;
drop policy if exists "question_bank_update_own_or_admin" on public.question_bank;
drop policy if exists "question_bank_delete_own_or_admin" on public.question_bank;
create policy "question_bank_select_system_own_or_admin" on public.question_bank
for select using (
  public.is_admin()
  or bank_scope = 'system'
  or (bank_scope = 'user' and user_id = auth.uid())
);

create policy "question_bank_insert_own_or_admin_system" on public.question_bank
for insert with check (
  (bank_scope = 'user' and user_id = auth.uid())
  or public.is_admin()
);

create policy "question_bank_update_own_or_admin" on public.question_bank
for update using (
  public.is_admin()
  or (bank_scope = 'user' and user_id = auth.uid())
)
with check (
  public.is_admin()
  or (bank_scope = 'user' and user_id = auth.uid())
);

create policy "question_bank_delete_own_or_admin" on public.question_bank
for delete using (
  public.is_admin()
  or (bank_scope = 'user' and user_id = auth.uid())
);

drop policy if exists "user_settings_own_all" on public.user_settings;
create policy "user_settings_own_all" on public.user_settings
for all using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback
for insert with check (user_id = auth.uid());

drop policy if exists "feedback_select_own_or_admin" on public.feedback;
create policy "feedback_select_own_or_admin" on public.feedback
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "feedback_admin_update" on public.feedback;
create policy "feedback_admin_update" on public.feedback
for update using (public.is_admin())
with check (public.is_admin());

drop policy if exists "beta_requests_public_insert" on public.beta_requests;
create policy "beta_requests_public_insert" on public.beta_requests
for insert to anon, authenticated
with check (status = 'pending' and admin_note is null and approved_at is null and approved_by is null);

drop policy if exists "beta_requests_admin_select" on public.beta_requests;
create policy "beta_requests_admin_select" on public.beta_requests
for select to authenticated using (public.is_admin());

drop policy if exists "beta_requests_admin_update" on public.beta_requests;
create policy "beta_requests_admin_update" on public.beta_requests
for update to authenticated using (public.is_admin())
with check (public.is_admin());

drop policy if exists "beta_requests_admin_delete" on public.beta_requests;
create policy "beta_requests_admin_delete" on public.beta_requests
for delete to authenticated using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'teacher'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Admin setup:
-- 1. Create admin user in Supabase Auth.
-- 2. Run: update public.profiles set role = 'admin' where email = 'admin@example.com';
