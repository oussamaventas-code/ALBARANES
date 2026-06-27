-- ============================================================================
-- GS AUTOBAT - Albaranes Inteligentes
-- Políticas de Storage (Supabase Storage)
-- ============================================================================
-- Descripción: Configura el bucket de almacenamiento para archivos de
-- albaranes (fotos, PDFs) con políticas de acceso basadas en autenticación.
-- ============================================================================

-- ============================================================================
-- 1. CREACIÓN DEL BUCKET
-- ============================================================================
-- Bucket privado: los archivos NO son accesibles públicamente.
-- Solo usuarios autenticados con las políticas correctas pueden acceder.
--
-- CONFIGURACIÓN RECOMENDADA EN EL DASHBOARD DE SUPABASE:
--   - Tamaño máximo de archivo: 15 MB (15728640 bytes)
--   - Tipos MIME permitidos:
--       • image/jpeg  (fotos de albaranes desde el móvil)
--       • image/png   (capturas de pantalla)
--       • application/pdf (albaranes digitalizados)
--
-- NOTA: La restricción de tamaño y tipos MIME se configura mejor desde
-- el Dashboard de Supabase (Storage > albaranes > Settings) ya que las
-- funciones de SQL para esto pueden variar entre versiones.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'albaranes',
  'albaranes',
  false,  -- Bucket privado
  15728640,  -- 15 MB en bytes
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- ============================================================================
-- 2. POLÍTICAS DE ACCESO AL STORAGE
-- ============================================================================
-- Estructura de rutas recomendada para los archivos:
--   albaranes/{usuario_id}/{albaran_numero}/{archivo}
--
-- Ejemplo: albaranes/550e8400-.../ALB-2026-000001/foto_entrega.jpg

-- --------------------------------------------------------------------------
-- UPLOAD (INSERT): Cualquier usuario autenticado puede subir archivos
-- --------------------------------------------------------------------------
-- Los repartidores suben fotos de albaranes desde la app móvil.
-- La oficina puede subir PDFs de albaranes escaneados.
CREATE POLICY storage_albaranes_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'albaranes');

-- --------------------------------------------------------------------------
-- DOWNLOAD (SELECT): Cualquier usuario autenticado puede descargar archivos
-- --------------------------------------------------------------------------
-- Necesario para que todos los roles puedan ver los albaranes subidos.
-- La restricción de qué albaranes puede ver cada usuario se controla
-- a nivel de la tabla 'albaranes' con RLS, no aquí.
CREATE POLICY storage_albaranes_select ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'albaranes');

-- --------------------------------------------------------------------------
-- UPDATE: Usuarios autenticados pueden actualizar sus propios archivos
-- --------------------------------------------------------------------------
-- Permite resubir/reemplazar un archivo (ej: nueva foto del albarán).
CREATE POLICY storage_albaranes_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'albaranes')
  WITH CHECK (bucket_id = 'albaranes');

-- --------------------------------------------------------------------------
-- DELETE: Solo administradores pueden eliminar archivos
-- --------------------------------------------------------------------------
-- Protege contra borrado accidental de documentos importantes.
-- Solo el admin puede purgar archivos del storage.
CREATE POLICY storage_albaranes_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'albaranes'
    AND public.is_admin()
  );
