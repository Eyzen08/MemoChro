begin;
create index on public.album_memories(album_id,user_id);
create index on public.story_memories(story_id,user_id);
create index on public.memory_people(memory_id,user_id);
create index on public.memory_tags(memory_id,user_id);

alter table public.memories add column deleting boolean not null default false;
create policy active_photo_insert on public.memory_media as restrictive for insert to authenticated
with check(exists(select 1 from public.memories m where m.id=memory_id and m.user_id=(select auth.uid()) and not m.deleting));
create policy active_object_insert on storage.objects as restrictive for insert to authenticated
with check(bucket_id<>'memory-media' or exists(select 1 from public.memories m where m.id::text=(storage.foldername(name))[2] and m.user_id=(select auth.uid()) and not m.deleting));
create policy active_object_update on storage.objects as restrictive for update to authenticated
with check(bucket_id<>'memory-media' or exists(select 1 from public.memories m where m.id::text=(storage.foldername(name))[2] and m.user_id=(select auth.uid()) and not m.deleting));

create or replace function public.delete_own_account() returns void language plpgsql security definer set search_path = '' as $$
declare v_owner uuid := auth.uid(); recent_password boolean; begin
  select exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a where a->>'method'='password' and to_timestamp((a->>'timestamp')::double precision)>now()-interval '5 minutes') into recent_password;
  if v_owner is null or not recent_password then raise exception 'Sign in with your password again before deleting your account'; end if;
  if exists(select 1 from storage.objects o where o.bucket_id='memory-media' and (storage.foldername(o.name))[1]=v_owner::text) then raise exception 'Remove account media before deleting the account'; end if;
  delete from auth.users where id=v_owner;
end $$;
revoke all on function public.delete_own_account() from public,anon;
grant execute on function public.delete_own_account() to authenticated;
commit;
