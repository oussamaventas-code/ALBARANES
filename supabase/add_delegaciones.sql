-- ============================================================================
-- Delegaciones — GS AUTOBAT / Grupo Silvestre
-- ============================================================================
-- Modela la red de 34 delegaciones. Cada repartidor pertenece a una.
-- Cada usuario de oficina/admin puede ser:
--   - "Nacional": delegacion_id = NULL  -> ve TODAS las delegaciones
--   - "Local":    delegacion_id = X     -> ve solo esa delegación
-- Cada albarán queda etiquetado con la delegación de quien lo creó (se
-- copia automáticamente al guardar, no hay que elegirla a mano).
-- ============================================================================

create table if not exists public.delegaciones (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  activo     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.delegaciones is 'Delegaciones/sucursales de Grupo Silvestre (red de reparto)';

drop trigger if exists set_delegaciones_updated_at on public.delegaciones;
create trigger set_delegaciones_updated_at
  before update on public.delegaciones
  for each row execute function public.handle_updated_at();

-- Columna en profiles: NULL = alcance nacional (ve todo); valor = solo esa delegación
alter table public.profiles
  add column if not exists delegacion_id uuid references public.delegaciones(id);

create index if not exists idx_profiles_delegacion_id on public.profiles (delegacion_id);

-- Columna en albaranes: se rellena automáticamente con la delegación del creador
alter table public.albaranes
  add column if not exists delegacion_id uuid references public.delegaciones(id);

create index if not exists idx_albaranes_delegacion_id on public.albaranes (delegacion_id);

-- RLS de delegaciones: lectura para cualquier autenticado (necesario para
-- desplegables); escritura solo admin.
alter table public.delegaciones enable row level security;

drop policy if exists delegaciones_select_auth on public.delegaciones;
create policy delegaciones_select_auth on public.delegaciones
  for select to authenticated using (auth.uid() is not null);

drop policy if exists delegaciones_write_admin on public.delegaciones;
create policy delegaciones_write_admin on public.delegaciones
  for all to authenticated
  using (public.mi_rol() = 'admin')
  with check (public.mi_rol() = 'admin');

-- ============================================================================
-- RLS actualizado: alcance por delegación para profiles y albaranes
-- ============================================================================
-- Sustituye las políticas "ve todo" de admin/oficina por una que respeta el
-- alcance: nacional (delegacion_id NULL) ve todo; local solo su delegación.
-- Usa una función SECURITY DEFINER (igual que mi_rol()) para evitar la
-- recursión infinita de consultar profiles dentro de su propia política.

create or replace function public.mi_delegacion()
returns uuid
language sql security definer stable set search_path = public
as $$ select delegacion_id from public.profiles where id = auth.uid(); $$;

drop policy if exists profiles_select_admin_oficina_v3 on public.profiles;
create policy profiles_select_admin_oficina_v4 on public.profiles
  for select to authenticated
  using (
    public.mi_rol() in ('admin', 'oficina')
    and (public.mi_delegacion() is null or delegacion_id = public.mi_delegacion())
  );

drop policy if exists albaranes_select_v2 on public.albaranes;
create policy albaranes_select_v3 on public.albaranes
  for select to authenticated
  using (
    usuario_id = auth.uid()
    or (
      public.mi_rol() in ('admin', 'oficina')
      and (public.mi_delegacion() is null or delegacion_id = public.mi_delegacion())
    )
  );
