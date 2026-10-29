alter table public.memory_media add column preview_path text;
alter table public.memory_media add constraint private_preview_path check(preview_path is null or (preview_path ~ '^[0-9a-f-]+/[0-9a-f-]+/[0-9a-f]+\.webp$' and split_part(preview_path,'/',1)=user_id::text and split_part(preview_path,'/',2)=memory_id::text));
