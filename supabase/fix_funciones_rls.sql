-- ============================================================================
-- FIX definitivo de las funciones de seguridad RLS
-- ============================================================================
-- Recrea is_admin() / get_user_role() / is_oficina_or_admin() añadiendo
-- "set search_path = public" (su ausencia hacía que devolvieran NULL/false
-- dentro de las políticas, bloqueando al admin para ver/insertar datos).
-- ============================================================================

create or replace function public.get_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function public.is_oficina_or_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol in ('admin', 'oficina')
  );
$$;
