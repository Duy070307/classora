-- Batch 81: fix teacher visibility for Soạn Lab system question bank.
-- Run in Supabase SQL Editor after backing up the project.

alter table public.question_bank
  alter column user_id drop not null;

alter table public.question_bank
  add column if not exists bank_scope text not null default 'user';

alter table public.question_bank
  add column if not exists book_series text;

alter table public.question_bank
  add column if not exists source_type text;

alter table public.question_bank
  add column if not exists content_type text;

alter table public.question_bank
  add column if not exists needs_review boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'question_bank_bank_scope_check'
      and conrelid = 'public.question_bank'::regclass
  ) then
    alter table public.question_bank
      add constraint question_bank_bank_scope_check
      check (bank_scope in ('system', 'user'));
  end if;
end $$;

-- Backfill physical metadata columns from legacy JSON metadata.
update public.question_bank
set
  book_series = coalesce(book_series, metadata->>'bookSeries'),
  source_type = coalesce(source_type, metadata->>'sourceType'),
  content_type = coalesce(content_type, metadata->>'contentType'),
  needs_review = coalesce(needs_review, true);

-- Existing Soạn Lab / Kết nối tri thức seeded rows become system-wide.
-- This intentionally targets rows carrying seed markers or deterministic seed keys.
update public.question_bank
set
  bank_scope = 'system',
  user_id = null,
  book_series = coalesce(book_series, metadata->>'bookSeries', 'Kết nối tri thức'),
  source_type = 'Soạn Lab seed',
  content_type = coalesce(content_type, metadata->>'contentType', 'Lý thuyết'),
  needs_review = true,
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'bookSeries', coalesce(book_series, metadata->>'bookSeries', 'Kết nối tri thức'),
      'sourceType', 'Soạn Lab seed',
      'contentType', coalesce(content_type, metadata->>'contentType', 'Lý thuyết'),
      'generatedBy', 'Soạn Lab seed',
      'needsReview', true
    ),
  updated_at = now()
where
  source_type = 'Soạn Lab seed'
  or metadata->>'generatedBy' = 'Soạn Lab seed'
  or metadata->>'sourceType' = 'Soạn Lab seed'
  or metadata ? 'seedKey';

-- Keep all non-system rows private to their owning teacher/admin user.
update public.question_bank
set
  bank_scope = 'user',
  source_type = coalesce(source_type, metadata->>'sourceType', 'teacher_created'),
  needs_review = coalesce(needs_review, true),
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'bookSeries', coalesce(book_series, metadata->>'bookSeries'),
      'sourceType', coalesce(source_type, metadata->>'sourceType', 'teacher_created'),
      'contentType', coalesce(content_type, metadata->>'contentType'),
      'needsReview', coalesce(needs_review, true)
    ),
  updated_at = now()
where bank_scope is null or bank_scope <> 'system';

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'question_bank_scope_owner_check'
      and conrelid = 'public.question_bank'::regclass
  ) then
    alter table public.question_bank
      drop constraint question_bank_scope_owner_check;
  end if;

  alter table public.question_bank
    add constraint question_bank_scope_owner_check
    check (
      (bank_scope = 'system' and user_id is null)
      or (bank_scope = 'user' and user_id is not null)
    ) not valid;
end $$;

alter table public.question_bank validate constraint question_bank_scope_owner_check;

alter table public.question_bank enable row level security;

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
  public.is_admin()
  or (bank_scope = 'user' and user_id = auth.uid())
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

-- Optional manual repair if older KNTT seed rows were inserted without seed metadata.
-- Review matching rows first, then run this block only for confirmed Soạn Lab seed data:
--
-- update public.question_bank
-- set
--   bank_scope = 'system',
--   user_id = null,
--   book_series = 'Kết nối tri thức',
--   source_type = 'Soạn Lab seed',
--   content_type = coalesce(content_type, 'Lý thuyết'),
--   needs_review = true,
--   metadata = coalesce(metadata, '{}'::jsonb)
--     || jsonb_build_object(
--       'bookSeries', 'Kết nối tri thức',
--       'sourceType', 'Soạn Lab seed',
--       'contentType', coalesce(content_type, 'Lý thuyết'),
--       'generatedBy', 'Soạn Lab seed',
--       'needsReview', true
--     ),
--   updated_at = now()
-- where subject in ('Vật lí', 'Hóa học')
--   and grade in ('10', '11', '12')
--   and coalesce(book_series, metadata->>'bookSeries') = 'Kết nối tri thức';
