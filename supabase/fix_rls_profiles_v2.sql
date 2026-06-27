-- ============================================================================
-- FIX RLS profiles v2: arregla la recursión infinita del intento anterior
-- ============================================================================
-- El intento anterior (profiles_select_admin_oficina_v2) consultaba
-- public.profiles DENTRO de una política de public.profiles -> Postgres
-- detecta esto como recursión infinita y bloquea TODO acceso a la tabla
-- (incluido el propio, por eso "undefined" en todos los roles).
--
-- Solución: una función SECURITY DEFINER. Estas funciones se ejecutan con
-- los permisos de su propietario y NO vuelven a evaluar RLS sobre la fila
-- que consultan, así que no hay bucle. Es el patrón correcto en Postgres/
-- Supabase para "¿qué rol tiene el usuario actual?".
-- ============================================================================

-- 1. Quitar la política rota
drop policy if exists profiles_select_admin_oficina_v2 on public.profiles;

-- 2. Función segura para obtener el rol del usuario SIN pasar por RLS
create or replace function public.mi_rol()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

-- 3. Política de lectura usando la función (sin auto-referencia recursiva)
create policy profiles_select_admin_oficina_v3 on public.profiles
  for select to authenticated
  using (public.mi_rol() in ('admin', 'oficina'));
