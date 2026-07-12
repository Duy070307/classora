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
