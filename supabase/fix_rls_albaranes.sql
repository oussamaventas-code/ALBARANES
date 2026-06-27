-- ============================================================================
-- FIX RLS de albaranes (sin depender de is_admin) + diagnóstico — GS AUTOBAT
-- ============================================================================

-- 1. Función de diagnóstico: devuelve qué "ve" el usuario autenticado.
create or replace function public.debug_auth()
returns json language sql security definer stable set search_path = public
as $$
  select json_build_object(
    'uid', auth.uid(),
    'is_admin', public.is_admin(),
    'role', public.get_user_role(),
    'mi_perfil', (select json_build_object('codigo', codigo, 'rol', rol)
                  from public.profiles where id = auth.uid())
  );
$$;
grant execute on function public.debug_auth() to authenticated, anon;

-- 2. Políticas directas para albaranes (subconsulta al propio perfil, que SÍ
--    es legible gracias a profiles_select_self). Esto evita la dependencia de
--    is_admin() que estaba bloqueando.

-- INSERT: cualquier usuario autenticado puede crear un albarán a su nombre
drop policy if exists albaranes_insert_self on public.albaranes;
create policy albaranes_insert_self on public.albaranes
  for insert to authenticated
  with check (usuario_id = auth.uid());

-- SELECT: ves los tuyos siempre; admin/oficina ven todos
drop policy if exists albaranes_select_v2 on public.albaranes;
create policy albaranes_select_v2 on public.albaranes
  for select to authenticated
  using (
    usuario_id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.rol in ('admin','oficina'))
  );

-- UPDATE: admin/oficina pueden actualizar (validar/rechazar) cualquiera
drop policy if exists albaranes_update_v2 on public.albaranes;
create policy albaranes_update_v2 on public.albaranes
  for update to authenticated
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.rol in ('admin','oficina')))
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.rol in ('admin','oficina')));

-- DELETE: admin
drop policy if exists albaranes_delete_v2 on public.albaranes;
create policy albaranes_delete_v2 on public.albaranes
  for delete to authenticated
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.rol = 'admin'));
