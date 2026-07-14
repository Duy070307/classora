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

create index if not exists exam_blueprints_user_updated_idx on public.exam_blueprints (user_id, updated_at desc);

alter table public.exam_blueprints enable row level security;

drop policy if exists "exam_blueprints_own_or_admin" on public.exam_blueprints;
create policy "exam_blueprints_own_or_admin" on public.exam_blueprints
for all to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

