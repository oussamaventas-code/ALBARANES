-- ============================================================================
-- Migración para importar los 14.000 clientes reales de SILVESTRE
-- ============================================================================
-- 1. Añade codigo_externo (código de cliente del proveedor, para OCR).
-- 2. Quita la restricción ÚNICA del CIF (hay CIFs repetidos en la lista real).
-- 3. Hace codigo_externo único (es la verdadera clave de cada cliente).
-- 4. Hace el TALLER opcional en los albaranes (los clientes no tienen talleres
--    separados: el cliente es el punto de entrega).
-- Ejecutar ANTES de importar el CSV en Table Editor.
-- ============================================================================

-- 1. Columna de código externo
alter table public.clientes
  add column if not exists codigo_externo varchar(30);

-- 2. Quitar UNIQUE del CIF (el nombre del constraint suele ser clientes_cif_key)
alter table public.clientes drop constraint if exists clientes_cif_key;

-- 3. codigo_externo único (clave real del cliente)
create unique index if not exists idx_clientes_codigo_externo_uq
  on public.clientes (codigo_externo);

-- 4. Taller opcional en albaranes
alter table public.albaranes alter column taller_id drop not null;

comment on column public.clientes.codigo_externo is
  'Código de cliente del proveedor (ej: C00022615) para autoselección por OCR';
