-- ============================================================================
-- FIX RLS: admin/oficina deben ver TODOS los perfiles (no solo el suyo)
-- ============================================================================
-- Bug encontrado en auditoría: ADMIN-01 solo veía su propia fila en profiles,
-- y OFI-01 (Juan) lo mismo. Esto rompe la pantalla de Administración →
-- Usuarios, y también hace que el nombre del repartidor no aparezca bien en
-- los listados de albaranes para oficina/admin.
--
-- Causa: las políticas antiguas (profiles_select_admin/oficina) dependían de
-- is_admin()/get_user_role(), que en este proyecto no estaban resolviendo
-- bien dentro de las políticas. Esta política nueva usa una subconsulta
-- directa a profiles (igual que el fix de albaranes/historial que ya
-- funcionó), sin depender de esas funciones.
-- ============================================================================

drop policy if exists profiles_select_admin_oficina_v2 on public.profiles;
create policy profiles_select_admin_oficina_v2 on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.rol in ('admin', 'oficina')
    )
  );
