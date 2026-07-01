-- Storage buckets for customer photos, voice tags, and voice notes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('customer-photos', 'customer-photos', true, 524288,  array['image/jpeg','image/png','image/webp']),
  ('voice-tags',      'voice-tags',      true, 5242880, array['audio/m4a','audio/mpeg','audio/mp4','audio/aac']),
  ('voice-notes',     'voice-notes',     true, 5242880, array['audio/m4a','audio/mpeg','audio/mp4','audio/aac'])
on conflict (id) do nothing;

-- RLS policies: owners can only upload to their own folder (path starts with their profile id)
drop policy if exists "owners upload their own customer photos" on storage.objects;
create policy "owners upload their own customer photos"
  on storage.objects for insert
  with check (
    bucket_id = 'customer-photos'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

drop policy if exists "owners upload their own voice tags" on storage.objects;
create policy "owners upload their own voice tags"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-tags'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

drop policy if exists "owners upload their own voice notes" on storage.objects;
create policy "owners upload their own voice notes"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-notes'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Public read access (photos/audio are served via public URL)
drop policy if exists "public read customer photos" on storage.objects;
create policy "public read customer photos"
  on storage.objects for select
  using (bucket_id = 'customer-photos');

drop policy if exists "public read voice tags" on storage.objects;
create policy "public read voice tags"
  on storage.objects for select
  using (bucket_id = 'voice-tags');

drop policy if exists "public read voice notes" on storage.objects;
create policy "public read voice notes"
  on storage.objects for select
  using (bucket_id = 'voice-notes');
