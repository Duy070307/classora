-- Private source and derived assets for confirmed TikZ diagrams.
-- Apply through the normal Supabase migration workflow; do not make this bucket public.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tikz-assets',
  'tikz-assets',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tikz_assets_select_own_or_admin" on storage.objects;
create policy "tikz_assets_select_own_or_admin" on storage.objects
for select to authenticated using (
  bucket_id = 'tikz-assets'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "tikz_assets_insert_own_or_admin" on storage.objects;
create policy "tikz_assets_insert_own_or_admin" on storage.objects
for insert to authenticated with check (
  bucket_id = 'tikz-assets'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "tikz_assets_update_own_or_admin" on storage.objects;
create policy "tikz_assets_update_own_or_admin" on storage.objects
for update to authenticated using (
  bucket_id = 'tikz-assets'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
) with check (
  bucket_id = 'tikz-assets'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "tikz_assets_delete_own_or_admin" on storage.objects;
create policy "tikz_assets_delete_own_or_admin" on storage.objects
for delete to authenticated using (
  bucket_id = 'tikz-assets'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
