-- ============================================================================
-- GS AUTOBAT - Albaranes Inteligentes
-- Esquema completo de base de datos (Supabase/PostgreSQL)
-- ============================================================================
-- Descripción: Define toda la estructura de la base de datos incluyendo
-- tipos personalizados, tablas, índices, triggers y funciones auxiliares.
-- ============================================================================

-- ============================================================================
-- 1. TIPOS PERSONALIZADOS (ENUMs)
-- ============================================================================

-- Rol del usuario en el sistema: admin (control total), oficina (gestión),
-- repartidor (solo sus propios albaranes)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'oficina', 'repartidor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Estado del ciclo de vida de un albarán:
-- pendiente → validado/rechazado → archivado
DO $$ BEGIN
  CREATE TYPE albaran_estado AS ENUM ('pendiente', 'validado', 'rechazado', 'archivado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TABLAS
-- ============================================================================

-- --------------------------------------------------------------------------
-- PROFILES: Extensión de auth.users con datos del sistema
-- Cada usuario de Supabase Auth tiene un perfil asociado con su rol,
-- código interno y estado de activación.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  email      TEXT,
  rol        user_role NOT NULL DEFAULT 'repartidor',
  codigo     VARCHAR(20) UNIQUE NOT NULL,  -- Código interno: 'GS-001', 'REP-045', etc.
  avatar_url TEXT,
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentario de tabla para documentación interna
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario del sistema GS AUTOBAT, vinculados a auth.users';
COMMENT ON COLUMN public.profiles.codigo IS 'Código interno único del empleado (ej: GS-001, REP-045)';
COMMENT ON COLUMN public.profiles.rol IS 'Rol que determina permisos: admin, oficina o repartidor';

-- --------------------------------------------------------------------------
-- CLIENTES: Empresas/particulares que reciben albaranes
-- Representan las empresas de recambios, distribuidoras, etc.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  cif        VARCHAR(20) UNIQUE,             -- CIF/NIF de la empresa
  telefono   VARCHAR(20),
  direccion  TEXT,
  email      TEXT,
  activo     BOOLEAN NOT NULL DEFAULT true,  -- Permite desactivar sin borrar
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clientes IS 'Clientes/empresas del sistema de albaranes';
COMMENT ON COLUMN public.clientes.cif IS 'CIF o NIF fiscal de la empresa';

-- --------------------------------------------------------------------------
-- TALLERES: Puntos de entrega asociados a un cliente
-- Un cliente puede tener múltiples talleres/sucursales donde se entregan
-- los pedidos y se generan albaranes.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.talleres (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  direccion  TEXT,
  telefono   VARCHAR(20),
  contacto   TEXT,                           -- Persona de contacto en el taller
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.talleres IS 'Talleres/sucursales asociados a cada cliente';
COMMENT ON COLUMN public.talleres.contacto IS 'Nombre de la persona de contacto en el taller';

-- --------------------------------------------------------------------------
-- ALBARANES: Documento principal del sistema
-- Cada albarán registra una entrega realizada por un repartidor a un taller
-- específico. Incluye campos preparados para futuras funcionalidades
-- (firma digital y geolocalización).
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.albaranes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          VARCHAR(50) NOT NULL UNIQUE,   -- Número secuencial único del albarán
  cliente_id      UUID NOT NULL REFERENCES public.clientes(id),
  taller_id       UUID NOT NULL REFERENCES public.talleres(id),
  usuario_id      UUID NOT NULL REFERENCES public.profiles(id),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  observaciones   TEXT,
  archivo_url     TEXT,                          -- URL del archivo subido (foto/PDF)
  archivo_nombre  TEXT,                          -- Nombre original del archivo
  estado          albaran_estado NOT NULL DEFAULT 'pendiente',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ========================================================================
  -- Columnas reservadas para futuras funcionalidades (Phase 2+)
  -- NO se aplican restricciones para mantener flexibilidad
  -- ========================================================================
  firma_url  TEXT,                               -- URL de la imagen de firma digital
  latitud    DECIMAL(10, 8),                     -- Coordenada GPS de la entrega
  longitud   DECIMAL(11, 8)                      -- Coordenada GPS de la entrega
);

COMMENT ON TABLE public.albaranes IS 'Albaranes de entrega - documento principal del sistema';
COMMENT ON COLUMN public.albaranes.numero IS 'Número único del albarán (ej: ALB-2026-000001)';
COMMENT ON COLUMN public.albaranes.firma_url IS '[FUTURO] URL de la firma digital del receptor';
COMMENT ON COLUMN public.albaranes.latitud IS '[FUTURO] Latitud GPS donde se realizó la entrega';
COMMENT ON COLUMN public.albaranes.longitud IS '[FUTURO] Longitud GPS donde se realizó la entrega';

-- --------------------------------------------------------------------------
-- HISTORIAL: Auditoría de acciones sobre albaranes
-- Registra cada cambio de estado, edición o acción relevante para
-- mantener trazabilidad completa.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historial (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  albaran_id UUID NOT NULL REFERENCES public.albaranes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id),
  accion     VARCHAR(100) NOT NULL,             -- Tipo de acción: 'creado', 'validado', etc.
  detalles   JSONB,                             -- Datos adicionales del cambio en formato JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.historial IS 'Registro de auditoría de todas las acciones sobre albaranes';
COMMENT ON COLUMN public.historial.accion IS 'Tipo de acción realizada (creado, validado, rechazado, editado, etc.)';
COMMENT ON COLUMN public.historial.detalles IS 'Datos adicionales en JSON (ej: campos modificados, motivo de rechazo)';

-- ============================================================================
-- 3. ÍNDICES
-- ============================================================================
-- Los índices aceleran las consultas más frecuentes del sistema.
-- Se usan en filtros, búsquedas y ordenamientos habituales.

-- Índices de PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_codigo ON public.profiles(codigo);
CREATE INDEX IF NOT EXISTS idx_profiles_rol    ON public.profiles(rol);

-- Índices de CLIENTES
CREATE INDEX IF NOT EXISTS idx_clientes_cif    ON public.clientes(cif);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);

-- Índices de TALLERES
CREATE INDEX IF NOT EXISTS idx_talleres_cliente_id ON public.talleres(cliente_id);
CREATE INDEX IF NOT EXISTS idx_talleres_nombre     ON public.talleres(nombre);

-- Índices de ALBARANES (tabla más consultada del sistema)
CREATE INDEX IF NOT EXISTS idx_albaranes_numero     ON public.albaranes(numero);
CREATE INDEX IF NOT EXISTS idx_albaranes_cliente_id  ON public.albaranes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_albaranes_taller_id   ON public.albaranes(taller_id);
CREATE INDEX IF NOT EXISTS idx_albaranes_usuario_id  ON public.albaranes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_albaranes_fecha       ON public.albaranes(fecha);
CREATE INDEX IF NOT EXISTS idx_albaranes_estado      ON public.albaranes(estado);
CREATE INDEX IF NOT EXISTS idx_albaranes_created_at  ON public.albaranes(created_at);

-- Índices de HISTORIAL
CREATE INDEX IF NOT EXISTS idx_historial_albaran_id ON public.historial(albaran_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON public.historial(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_created_at ON public.historial(created_at);

-- ============================================================================
-- 4. TRIGGERS: Actualización automática de updated_at
-- ============================================================================

-- Función reutilizable que actualiza el campo updated_at automáticamente
-- cada vez que se modifica una fila en cualquier tabla que la use.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_updated_at IS 'Trigger function que actualiza updated_at en cada UPDATE';

-- Aplicar trigger de updated_at a todas las tablas con ese campo
DO $$ BEGIN
  -- Profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  -- Clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_clientes_updated_at'
  ) THEN
    CREATE TRIGGER set_clientes_updated_at
      BEFORE UPDATE ON public.clientes
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  -- Talleres
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_talleres_updated_at'
  ) THEN
    CREATE TRIGGER set_talleres_updated_at
      BEFORE UPDATE ON public.talleres
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;

  -- Albaranes
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_albaranes_updated_at'
  ) THEN
    CREATE TRIGGER set_albaranes_updated_at
      BEFORE UPDATE ON public.albaranes
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 5. TRIGGER: Auto-creación de perfil al registrar usuario
-- ============================================================================
-- Cuando se crea un usuario en auth.users (vía signup o invitación),
-- se crea automáticamente un perfil con datos básicos.
-- El código se genera con prefijo 'REP-' + número secuencial.
-- El administrador debe ajustar rol y código después si es necesario.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _nombre TEXT;
  _codigo TEXT;
  _count  INT;
BEGIN
  -- Intentar extraer el nombre de los metadatos del usuario
  _nombre := COALESCE(
    NEW.raw_user_meta_data ->> 'nombre',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)  -- Fallback: parte local del email
  );

  -- Generar código secuencial único para el nuevo repartidor
  SELECT COUNT(*) + 1 INTO _count FROM public.profiles;
  _codigo := 'REP-' || LPAD(_count::TEXT, 3, '0');

  -- Asegurar unicidad del código generado (por si hay huecos en la secuencia)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE codigo = _codigo) LOOP
    _count := _count + 1;
    _codigo := 'REP-' || LPAD(_count::TEXT, 3, '0');
  END LOOP;

  -- Insertar el perfil del nuevo usuario
  INSERT INTO public.profiles (id, nombre, email, rol, codigo)
  VALUES (
    NEW.id,
    _nombre,
    NEW.email,
    'repartidor',  -- Rol por defecto; el admin lo cambia después
    _codigo
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS 'Crea automáticamente un perfil cuando se registra un nuevo usuario en auth.users';

-- Crear trigger solo si no existe
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
