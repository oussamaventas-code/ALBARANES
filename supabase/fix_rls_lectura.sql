-- ============================================================================
-- FIX RLS definitivo de lectura — GS AUTOBAT
-- ============================================================================
-- 1) Reaplica las funciones de seguridad con search_path (idempotente).
-- 2) Añade políticas DIRECTAS de lectura (sin depender de funciones) para que
--    cualquier usuario autenticado pueda leer clientes y talleres: son datos
--    necesarios para los desplegables/buscadores de todos los roles.
-- ============================================================================

-- 1. Funciones de seguridad robustas ----------------------------------------
create or replace function public.get_user_role()
returns user_role language sql security definer stable set search_path = public
as $$ select rol from public.profiles where id = auth.uid(); $$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin'); $$;

create or replace function public.is_oficina_or_admin()
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','oficina')); $$;

-- 2. Lectura directa para autenticados --------------------------------------
drop policy if exists clientes_select_auth on public.clientes;
create policy clientes_select_auth on public.clientes
  for select using (auth.uid() is not null);

drop policy if exists talleres_select_auth on public.talleres;
create policy talleres_select_auth on public.talleres
  for select using (auth.uid() is not null);
