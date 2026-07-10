alter table public.beta_requests
add column if not exists updated_at timestamptz not null default now();

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
