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

create table if not exists public.exam_blueprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  subject text,
  grade text,
  source_type text not null check (source_type in ('matrix', 'specification', 'previous_exam', 'lesson_material')),
  blueprint jsonb not null,
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

create table if not exists public.tikz_bank (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade,
  bank_scope text not null default 'user' check (bank_scope in ('system', 'user')),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  category text,
  subject text,
  grade text,
  tags text[],
  tikz_code text not null check (char_length(tikz_code) between 1 and 30000),
  full_latex text,
  preview_note text,
  source_type text,
  needs_review boolean not null default true,
  slug text,
  subcategory text,
  grades text[],
  complexity text,
  package_dependencies text[],
  source_name text,
  source_url text,
  source_author text,
  source_license text,
  originality_mode text,
  sha256 text,
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  check ((bank_scope = 'system' and user_id is null) or (bank_scope = 'user' and user_id is not null))
);

create table if not exists public.tikz_imports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  version text,
  total_items integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  invalid_count integer not null default 0
);

create unique index if not exists beta_requests_email_unique on public.beta_requests (lower(email));
create index if not exists beta_requests_created_at_idx on public.beta_requests (created_at desc);
create index if not exists beta_requests_status_idx on public.beta_requests (status);
create index if not exists tikz_bank_scope_idx on public.tikz_bank (bank_scope);
create index if not exists tikz_bank_user_idx on public.tikz_bank (user_id);
create index if not exists tikz_bank_created_idx on public.tikz_bank (created_at desc);
create unique index if not exists tikz_bank_system_title_unique on public.tikz_bank (lower(title)) where bank_scope = 'system';
create unique index if not exists tikz_bank_system_slug_unique on public.tikz_bank (slug) where bank_scope = 'system' and slug is not null;
create index if not exists tikz_bank_system_sha256_idx on public.tikz_bank (sha256) where bank_scope = 'system' and sha256 is not null;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.templates enable row level security;
alter table public.question_bank enable row level security;
alter table public.user_settings enable row level security;
alter table public.feedback enable row level security;
alter table public.beta_requests enable row level security;
alter table public.tikz_bank enable row level security;
alter table public.tikz_imports enable row level security;

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

alter table public.exam_blueprints enable row level security;
drop policy if exists "exam_blueprints_own_or_admin" on public.exam_blueprints;
create policy "exam_blueprints_own_or_admin" on public.exam_blueprints
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

drop policy if exists "tikz_bank_select_system_own_or_admin" on public.tikz_bank;
create policy "tikz_bank_select_system_own_or_admin" on public.tikz_bank
for select to authenticated using (
  public.is_admin() or bank_scope = 'system' or (bank_scope = 'user' and user_id = auth.uid())
);

drop policy if exists "tikz_bank_insert_own_or_admin" on public.tikz_bank;
create policy "tikz_bank_insert_own_or_admin" on public.tikz_bank
for insert to authenticated with check (
  public.is_admin() or (bank_scope = 'user' and user_id = auth.uid())
);

drop policy if exists "tikz_bank_update_own_or_admin" on public.tikz_bank;
create policy "tikz_bank_update_own_or_admin" on public.tikz_bank
for update to authenticated using (
  public.is_admin() or (bank_scope = 'user' and user_id = auth.uid())
) with check (
  public.is_admin() or (bank_scope = 'user' and user_id = auth.uid())
);

drop policy if exists "tikz_bank_delete_own_or_admin" on public.tikz_bank;
create policy "tikz_bank_delete_own_or_admin" on public.tikz_bank
for delete to authenticated using (
  public.is_admin() or (bank_scope = 'user' and user_id = auth.uid())
);

drop policy if exists "tikz_imports_admin_all" on public.tikz_imports;
create policy "tikz_imports_admin_all" on public.tikz_imports
for all to authenticated using (public.is_admin()) with check (public.is_admin());

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

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.system_settings enable row level security;

drop policy if exists "system_settings_authenticated_read" on public.system_settings;
create policy "system_settings_authenticated_read" on public.system_settings
for select to authenticated
using (key = 'maintenance');

insert into public.system_settings (key, value)
values (
  'maintenance',
  jsonb_build_object(
    'enabled', false,
    'message', 'SOẠN LAB đang bảo trì để nâng cấp hệ thống. Tài khoản dùng thử tạm thời chưa thể sử dụng. Thầy cô vui lòng quay lại sau.'
  )
)
on conflict (key) do nothing;

-- Admin setup:
-- 1. Create admin user in Supabase Auth.
-- 2. Run: update public.profiles set role = 'admin' where email = 'admin@example.com';

-- Private TikZ source/derived assets. Kept private and owned by the first path segment.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tikz-assets', 'tikz-assets', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tikz_assets_select_own_or_admin" on storage.objects;
create policy "tikz_assets_select_own_or_admin" on storage.objects for select to authenticated using (
  bucket_id = 'tikz-assets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
drop policy if exists "tikz_assets_insert_own_or_admin" on storage.objects;
create policy "tikz_assets_insert_own_or_admin" on storage.objects for insert to authenticated with check (
  bucket_id = 'tikz-assets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
drop policy if exists "tikz_assets_update_own_or_admin" on storage.objects;
create policy "tikz_assets_update_own_or_admin" on storage.objects for update to authenticated using (
  bucket_id = 'tikz-assets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
) with check (
  bucket_id = 'tikz-assets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
drop policy if exists "tikz_assets_delete_own_or_admin" on storage.objects;
create policy "tikz_assets_delete_own_or_admin" on storage.objects for delete to authenticated using (
  bucket_id = 'tikz-assets' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
