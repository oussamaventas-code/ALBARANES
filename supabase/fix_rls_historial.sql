-- ============================================================================
-- FIX RLS de historial — GS AUTOBAT
-- ============================================================================
-- Permite a cualquier usuario autenticado registrar acciones a su nombre,
-- y leer el historial de los albaranes que puede ver.
-- ============================================================================

-- INSERT: registrar acción propia
drop policy if exists historial_insert_self on public.historial;
create policy historial_insert_self on public.historial
  for insert to authenticated
  with check (usuario_id = auth.uid());

-- SELECT: ves el historial de tus albaranes; admin/oficina ven todo
drop policy if exists historial_select_v2 on public.historial;
create policy historial_select_v2 on public.historial
  for select to authenticated
  using (
    exists (select 1 from public.albaranes a
            where a.id = albaran_id and a.usuario_id = auth.uid())
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.rol in ('admin','oficina'))
  );
