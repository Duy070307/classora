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
  check ((bank_scope = 'system' and user_id is null) or (bank_scope = 'user' and user_id is not null))
);

create index if not exists tikz_bank_scope_idx on public.tikz_bank (bank_scope);
create index if not exists tikz_bank_user_idx on public.tikz_bank (user_id);
create index if not exists tikz_bank_created_idx on public.tikz_bank (created_at desc);
create unique index if not exists tikz_bank_system_title_unique on public.tikz_bank (lower(title)) where bank_scope = 'system';

alter table public.tikz_bank enable row level security;

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
