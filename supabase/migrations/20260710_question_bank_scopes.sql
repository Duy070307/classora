-- Batch 80: separate Soạn Lab system question bank from teacher personal question bank.
-- Run in Supabase SQL Editor after backing up the project.

alter table public.question_bank
  alter column user_id drop not null;

alter table public.question_bank
  add column if not exists bank_scope text not null default 'user';

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

-- Existing Soạn Lab seed rows become system-wide, read-only for teachers.
update public.question_bank
set
  bank_scope = 'system',
  user_id = null,
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'bookSeries', coalesce(metadata->>'bookSeries', 'Kết nối tri thức'),
      'sourceType', coalesce(metadata->>'sourceType', 'tham khảo'),
      'contentType', coalesce(metadata->>'contentType', 'Lý thuyết'),
      'generatedBy', 'Soạn Lab seed',
      'needsReview', true
    ),
  updated_at = now()
where
  metadata->>'generatedBy' = 'Soạn Lab seed'
  or metadata->>'sourceType' = 'Soạn Lab seed'
  or metadata ? 'seedKey';

-- All remaining rows are teacher-owned personal rows.
update public.question_bank
set
  bank_scope = 'user',
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'sourceType', coalesce(metadata->>'sourceType', 'teacher_created'),
      'needsReview', coalesce((metadata->>'needsReview')::boolean, true)
    ),
  updated_at = now()
where bank_scope is null or bank_scope <> 'system';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'question_bank_scope_owner_check'
      and conrelid = 'public.question_bank'::regclass
  ) then
    alter table public.question_bank
      add constraint question_bank_scope_owner_check
      check (
        (bank_scope = 'system' and user_id is null)
        or (bank_scope = 'user' and user_id is not null)
      ) not valid;
  end if;
end $$;

alter table public.question_bank validate constraint question_bank_scope_owner_check;

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
