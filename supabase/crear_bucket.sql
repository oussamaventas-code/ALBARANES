-- ============================================================================
-- Crear el bucket de Storage 'albaranes' + permisos — GS AUTOBAT
-- ============================================================================
-- Bucket privado (los archivos se sirven con URLs firmadas).
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

-- 1. Crear/actualizar el bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('albaranes', 'albaranes', false, 15728640,
        array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'];

-- 2. Políticas de acceso (cualquier usuario autenticado sube/lee/actualiza)
drop policy if exists storage_albaranes_insert on storage.objects;
create policy storage_albaranes_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'albaranes');

drop policy if exists storage_albaranes_select on storage.objects;
create policy storage_albaranes_select on storage.objects
  for select to authenticated using (bucket_id = 'albaranes');

drop policy if exists storage_albaranes_update on storage.objects;
create policy storage_albaranes_update on storage.objects
  for update to authenticated using (bucket_id = 'albaranes') with check (bucket_id = 'albaranes');

drop policy if exists storage_albaranes_delete on storage.objects;
create policy storage_albaranes_delete on storage.objects
  for delete to authenticated using (bucket_id = 'albaranes');
