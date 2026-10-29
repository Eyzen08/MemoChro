begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 80)
);
create table public.places (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200), description text not null default '' check (length(description) <= 5000),
  address text not null default '' check (length(address) <= 500), latitude double precision check (latitude between -90 and 90), longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.people (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200), relationship text not null default '' check (length(relationship) <= 100), note text not null default '' check (length(note) <= 5000),
  created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.memories (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200), memory_date date not null, memory_time time,
  description text not null default '' check (length(description) <= 20000), mood text not null default '' check (length(mood) <= 60), favorite boolean not null default false,
  place_id uuid, created_at timestamptz not null default now(), unique(id,user_id),
  foreign key (place_id,user_id) references public.places(id,user_id) on delete set null (place_id),
  search_document tsvector generated always as (to_tsvector('english', title || ' ' || description)) stored
);
create index memories_owner_date on public.memories(user_id,memory_date desc,id);
create index memories_place on public.memories(place_id,user_id);
create index memories_search on public.memories using gin(search_document);
create table public.memory_media (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  memory_id uuid not null, path text not null unique check (path ~ '^[0-9a-f-]+/[0-9a-f-]+/[0-9a-f]+\.(jpg|png|webp)$'),
  caption text not null default '' check (length(caption) <= 500), position integer not null default 0, created_at timestamptz not null default now(), unique(id,user_id),
  foreign key(memory_id,user_id) references public.memories(id,user_id) on delete cascade,
  check(split_part(path,'/',1)=user_id::text and split_part(path,'/',2)=memory_id::text)
);
create index media_memory on public.memory_media(memory_id,user_id);
create table public.albums (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  title text not null check(length(trim(title)) between 1 and 200), description text not null default '' check(length(description)<=5000),
  cover_media_id uuid, created_at timestamptz not null default now(), unique(id,user_id),
  foreign key(cover_media_id,user_id) references public.memory_media(id,user_id) on delete set null(cover_media_id)
);
create table public.stories (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  title text not null check(length(trim(title)) between 1 and 200), body text not null default '' check(length(body)<=100000),
  status text not null default 'draft' check(status in ('draft','saved')), cover_media_id uuid,
  created_at timestamptz not null default now(), unique(id,user_id),
  foreign key(cover_media_id,user_id) references public.memory_media(id,user_id) on delete set null(cover_media_id),
  search_document tsvector generated always as (to_tsvector('english', title || ' ' || body)) stored
);
create index stories_search on public.stories using gin(search_document);
create table public.tags (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  name text not null check(length(trim(name)) between 1 and 50), unique(user_id,name), unique(id,user_id)
);
create table public.album_memories (
  user_id uuid not null references auth.users on delete cascade, album_id uuid not null, memory_id uuid not null, position integer not null default 0,
  primary key(album_id,memory_id),
  foreign key(album_id,user_id) references public.albums(id,user_id) on delete cascade,
  foreign key(memory_id,user_id) references public.memories(id,user_id) on delete cascade
);
create table public.story_memories (
  user_id uuid not null references auth.users on delete cascade, story_id uuid not null, memory_id uuid not null, primary key(story_id,memory_id),
  foreign key(story_id,user_id) references public.stories(id,user_id) on delete cascade,
  foreign key(memory_id,user_id) references public.memories(id,user_id) on delete cascade
);
create table public.memory_people (
  user_id uuid not null references auth.users on delete cascade, memory_id uuid not null, person_id uuid not null, primary key(memory_id,person_id),
  foreign key(memory_id,user_id) references public.memories(id,user_id) on delete cascade,
  foreign key(person_id,user_id) references public.people(id,user_id) on delete cascade
);
create table public.memory_tags (
  user_id uuid not null references auth.users on delete cascade, memory_id uuid not null, tag_id uuid not null, primary key(memory_id,tag_id),
  foreign key(memory_id,user_id) references public.memories(id,user_id) on delete cascade,
  foreign key(tag_id,user_id) references public.tags(id,user_id) on delete cascade
);

do $$ declare t text; begin
  foreach t in array array['profiles','memories','memory_media','albums','album_memories','stories','story_memories','places','people','memory_people','tags','memory_tags'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy owner_access on public.%I to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
    if t <> 'profiles' then execute format('create index on public.%I(user_id)',t); end if;
  end loop;
end $$;
create index on public.album_memories(memory_id,user_id);
create index on public.story_memories(memory_id,user_id);
create index on public.memory_people(person_id,user_id);
create index on public.memory_tags(tag_id,user_id);
create index on public.albums(cover_media_id,user_id);
create index on public.stories(cover_media_id,user_id);

create function public.save_memory(p_id uuid, p_data jsonb, p_people uuid[] default '{}', p_albums uuid[] default '{}', p_tags text[] default '{}') returns uuid
language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid(); tag_name text; tag_id uuid;
begin
  if owner is null then raise exception 'Authentication required'; end if;
  if cardinality(p_people)>50 or cardinality(p_albums)>50 or cardinality(p_tags)>20 then raise exception 'Too many associations'; end if;
  insert into public.memories(id,user_id,title,memory_date,memory_time,description,mood,favorite,place_id)
  values(p_id,owner,p_data->>'title',(p_data->>'memory_date')::date,(p_data->>'memory_time')::time,coalesce(p_data->>'description',''),coalesce(p_data->>'mood',''),coalesce((p_data->>'favorite')::boolean,false),(p_data->>'place_id')::uuid)
  on conflict(id) do update set title=excluded.title,memory_date=excluded.memory_date,memory_time=excluded.memory_time,description=excluded.description,mood=excluded.mood,favorite=excluded.favorite,place_id=excluded.place_id;
  delete from public.memory_people where memory_id=p_id;
  insert into public.memory_people(user_id,memory_id,person_id) select owner,p_id,x from unnest(p_people) x;
  delete from public.album_memories where memory_id=p_id;
  insert into public.album_memories(user_id,album_id,memory_id) select owner,x,p_id from unnest(p_albums) x;
  delete from public.memory_tags where memory_id=p_id;
  foreach tag_name in array p_tags loop
    insert into public.tags(user_id,name) values(owner,lower(trim(tag_name))) on conflict(user_id,name) do update set name=excluded.name returning id into tag_id;
    insert into public.memory_tags(user_id,memory_id,tag_id) values(owner,p_id,tag_id) on conflict do nothing;
  end loop;
  return p_id;
end $$;

create function public.save_collection(p_kind text, p_id uuid, p_data jsonb, p_memories uuid[] default '{}') returns uuid
language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid(); begin
  if owner is null then raise exception 'Authentication required'; end if;
  if cardinality(p_memories)>500 then raise exception 'Choose at most 500 memories'; end if;
  if p_kind='albums' then
    insert into public.albums(id,user_id,title,description,cover_media_id) values(p_id,owner,p_data->>'title',coalesce(p_data->>'description',''),(p_data->>'cover_media_id')::uuid)
    on conflict(id) do update set title=excluded.title,description=excluded.description,cover_media_id=excluded.cover_media_id;
    delete from public.album_memories where album_id=p_id;
    insert into public.album_memories(user_id,album_id,memory_id,position) select owner,p_id,x,ordinality from unnest(p_memories) with ordinality as u(x,ordinality);
  elsif p_kind='stories' then
    insert into public.stories(id,user_id,title,body,status,cover_media_id) values(p_id,owner,p_data->>'title',coalesce(p_data->>'body',''),coalesce(p_data->>'status','draft'),(p_data->>'cover_media_id')::uuid)
    on conflict(id) do update set title=excluded.title,body=excluded.body,status=excluded.status,cover_media_id=excluded.cover_media_id;
    delete from public.story_memories where story_id=p_id;
    insert into public.story_memories(user_id,story_id,memory_id) select owner,p_id,x from unnest(p_memories) x;
  else raise exception 'Invalid collection'; end if;
  return p_id;
end $$;

create function public.search_memories(q text default '', after_date date default null, before_date date default null, only_favorites boolean default false, filter_place uuid default null, filter_person uuid default null, filter_album uuid default null, filter_tag uuid default null, filter_type text default '') returns setof public.memories
language sql stable security invoker set search_path = '' as $$
  select m.* from public.memories m
  where (after_date is null or m.memory_date>=after_date) and (before_date is null or m.memory_date<=before_date)
  and (not only_favorites or m.favorite) and (filter_place is null or m.place_id=filter_place)
  and (filter_person is null or exists(select 1 from public.memory_people mp where mp.memory_id=m.id and mp.person_id=filter_person))
  and (filter_album is null or exists(select 1 from public.album_memories am where am.memory_id=m.id and am.album_id=filter_album))
  and (filter_tag is null or exists(select 1 from public.memory_tags mt where mt.memory_id=m.id and mt.tag_id=filter_tag))
  and (filter_type='' or (filter_type='photos' and exists(select 1 from public.memory_media mm where mm.memory_id=m.id)) or (filter_type='written' and not exists(select 1 from public.memory_media mm where mm.memory_id=m.id)))
  and (q='' or m.search_document @@ websearch_to_tsquery('english',q)
    or exists(select 1 from public.places p where p.id=m.place_id and p.name ilike '%'||q||'%')
    or exists(select 1 from public.memory_tags mt join public.tags t on t.id=mt.tag_id where mt.memory_id=m.id and t.name ilike '%'||q||'%')
    or exists(select 1 from public.memory_people mp join public.people p on p.id=mp.person_id where mp.memory_id=m.id and p.name ilike '%'||q||'%')
    or exists(select 1 from public.album_memories am join public.albums a on a.id=am.album_id where am.memory_id=m.id and a.title ilike '%'||q||'%'));
$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('memory-media','memory-media',false,10485760,array['image/jpeg','image/png','image/webp']);
create policy private_memory_media on storage.objects to authenticated
using (bucket_id='memory-media' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='memory-media' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.memories m where m.id::text=(storage.foldername(name))[2] and m.user_id=(select auth.uid())));

-- A fresh password authentication is required, including for direct RPC calls.
create function public.delete_own_account() returns void language plpgsql security definer set search_path = '' as $$
declare owner uuid := auth.uid(); recent_password boolean; begin
  select exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a where a->>'method'='password' and to_timestamp((a->>'timestamp')::double precision)>now()-interval '5 minutes') into recent_password;
  if owner is null or not recent_password then raise exception 'Sign in with your password again before deleting your account'; end if;
  if exists(select 1 from storage.objects where bucket_id='memory-media' and (storage.foldername(name))[1]=owner::text) then raise exception 'Remove account media before deleting the account'; end if;
  delete from auth.users where id=owner;
end $$;
revoke all on function public.save_memory(uuid,jsonb,uuid[],uuid[],text[]), public.save_collection(text,uuid,jsonb,uuid[]), public.search_memories(text,date,date,boolean,uuid,uuid,uuid,uuid,text), public.delete_own_account() from public, anon;
grant execute on function public.save_memory(uuid,jsonb,uuid[],uuid[],text[]), public.save_collection(text,uuid,jsonb,uuid[]), public.search_memories(text,date,date,boolean,uuid,uuid,uuid,uuid,text), public.delete_own_account() to authenticated;
commit;
