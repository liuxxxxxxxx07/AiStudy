-- ============================================================
-- Storage Buckets
-- Run in Supabase SQL Editor after schema migration
-- ============================================================

-- Create bucket for user file uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-files',
  'user-files',
  false,
  10485760, -- 10MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do nothing;

-- RLS: users can only access their own files
create policy "Users can read own files"
  on storage.objects for select
  using (bucket_id = 'user-files' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own files"
  on storage.objects for insert
  with check (bucket_id = 'user-files' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own files"
  on storage.objects for delete
  using (bucket_id = 'user-files' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);