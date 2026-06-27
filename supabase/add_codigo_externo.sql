-- ============================================================================
-- Añade el código de cliente del proveedor a la tabla clientes
-- ============================================================================
-- Permite que el OCR autoseleccione el cliente al escanear un albarán:
-- si el "COD. CLIENTE" leído (ej: C00022615) coincide con codigo_externo,
-- el formulario "Nuevo albarán" rellena el cliente automáticamente.
-- ============================================================================

alter table public.clientes
  add column if not exists codigo_externo varchar(30);

create index if not exists idx_clientes_codigo_externo
  on public.clientes (codigo_externo);

comment on column public.clientes.codigo_externo is
  'Código de cliente del proveedor (ej: C00022615) para autoselección por OCR';
