alter table public.tikz_bank
add column if not exists slug text,
add column if not exists subcategory text,
add column if not exists grades text[],
add column if not exists complexity text,
add column if not exists package_dependencies text[],
add column if not exists source_name text,
add column if not exists source_url text,
add column if not exists source_author text,
add column if not exists source_license text,
add column if not exists originality_mode text,
add column if not exists sha256 text,
add column if not exists imported_by uuid references auth.users(id) on delete set null,
add column if not exists imported_at timestamptz,
add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists tikz_bank_system_slug_unique
on public.tikz_bank (slug)
where bank_scope = 'system' and slug is not null;

create index if not exists tikz_bank_system_sha256_idx
on public.tikz_bank (sha256)
where bank_scope = 'system' and sha256 is not null;

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

alter table public.tikz_imports enable row level security;

drop policy if exists "tikz_imports_admin_all" on public.tikz_imports;
create policy "tikz_imports_admin_all" on public.tikz_imports
for all to authenticated using (public.is_admin()) with check (public.is_admin());
