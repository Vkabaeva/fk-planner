-- FK Planner private user data. Run in Supabase SQL Editor.
create table if not exists public.planner_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{"seasons":[],"projects":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planner_data enable row level security;
revoke all on table public.planner_data from anon, authenticated;
grant select, insert, update, delete on table public.planner_data to authenticated;

drop policy if exists "Users can read their planner data" on public.planner_data;
create policy "Users can read their planner data" on public.planner_data
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their planner data" on public.planner_data;
create policy "Users can create their planner data" on public.planner_data
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their planner data" on public.planner_data;
create policy "Users can update their planner data" on public.planner_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their planner data" on public.planner_data;
create policy "Users can delete their planner data" on public.planner_data
  for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fk-planner-images', 'fk-planner-images', false, 10485760, array['image/jpeg','image/png','image/gif','image/webp','image/avif'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/gif','image/webp','image/avif'];

drop policy if exists "Users can read their planner images" on storage.objects;
create policy "Users can read their planner images" on storage.objects
  for select to authenticated using (bucket_id = 'fk-planner-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can upload their planner images" on storage.objects;
create policy "Users can upload their planner images" on storage.objects
  for insert to authenticated with check (bucket_id = 'fk-planner-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can update their planner images" on storage.objects;
create policy "Users can update their planner images" on storage.objects
  for update to authenticated using (bucket_id = 'fk-planner-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'fk-planner-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their planner images" on storage.objects;
create policy "Users can delete their planner images" on storage.objects
  for delete to authenticated using (bucket_id = 'fk-planner-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
