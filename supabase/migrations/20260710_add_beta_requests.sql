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

create unique index if not exists beta_requests_email_unique
on public.beta_requests (lower(email));

create index if not exists beta_requests_created_at_idx
on public.beta_requests (created_at desc);

create index if not exists beta_requests_status_idx
on public.beta_requests (status);

alter table public.beta_requests enable row level security;

drop policy if exists "beta_requests_public_insert" on public.beta_requests;
create policy "beta_requests_public_insert" on public.beta_requests
for insert to anon, authenticated
with check (status = 'pending' and admin_note is null and approved_at is null and approved_by is null);

drop policy if exists "beta_requests_admin_select" on public.beta_requests;
create policy "beta_requests_admin_select" on public.beta_requests
for select to authenticated
using (public.is_admin());

drop policy if exists "beta_requests_admin_update" on public.beta_requests;
create policy "beta_requests_admin_update" on public.beta_requests
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "beta_requests_admin_delete" on public.beta_requests;
create policy "beta_requests_admin_delete" on public.beta_requests
for delete to authenticated
using (public.is_admin());
