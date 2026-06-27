-- ============================================================================
-- GS AUTOBAT - Albaranes Inteligentes
-- Políticas de Row Level Security (RLS)
-- ============================================================================
-- Descripción: Define todas las políticas de seguridad a nivel de fila.
-- Cada tabla tiene políticas diferenciadas según el rol del usuario:
--   - admin:      Acceso total a todo el sistema
--   - oficina:    Gestión completa de datos excepto eliminación
--   - repartidor: Solo acceso a sus propios albaranes y datos activos
-- ============================================================================

-- ============================================================================
-- 1. FUNCIONES AUXILIARES DE SEGURIDAD
-- ============================================================================
-- Estas funciones se usan en las políticas RLS para verificar el rol
-- del usuario autenticado. Se ejecutan con SECURITY DEFINER para
-- poder acceder a la tabla profiles sin importar las políticas RLS.
-- STABLE indica que la función retorna el mismo resultado para la misma
-- sesión SQL (mejora rendimiento en caché de PostgreSQL).

-- Obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT rol FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_role IS 'Retorna el rol del usuario autenticado actual';

-- Verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin IS 'Retorna true si el usuario autenticado es admin';

-- Verificar si el usuario es oficina o administrador
CREATE OR REPLACE FUNCTION public.is_oficina_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND rol IN ('admin', 'oficina')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_oficina_or_admin IS 'Retorna true si el usuario autenticado es admin u oficina';

-- ============================================================================
-- 2. ACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================================
-- IMPORTANTE: Sin RLS activado, cualquier usuario autenticado puede
-- acceder a todos los datos. Activarlo es el primer paso de seguridad.

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talleres  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albaranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLÍTICAS DE SEGURIDAD: PROFILES
-- ============================================================================
-- Admin:      Ve y edita todos los perfiles, puede desactivar usuarios
-- Oficina:    Ve todos los perfiles, edita solo el suyo
-- Repartidor: Solo ve y edita su propio perfil (campos limitados)

-- --- SELECT ---

-- Admin puede ver todos los perfiles
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Oficina puede ver todos los perfiles (necesario para asignar albaranes)
CREATE POLICY profiles_select_oficina ON public.profiles
  FOR SELECT
  USING (public.get_user_role() = 'oficina');

-- Repartidor solo ve su propio perfil
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (
    public.get_user_role() = 'repartidor'
    AND id = (SELECT auth.uid())
  );

-- --- UPDATE ---

-- Admin puede actualizar cualquier perfil (cambiar roles, desactivar, etc.)
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Oficina solo puede actualizar su propio perfil
CREATE POLICY profiles_update_oficina ON public.profiles
  FOR UPDATE
  USING (
    public.get_user_role() = 'oficina'
    AND id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.get_user_role() = 'oficina'
    AND id = (SELECT auth.uid())
  );

-- Repartidor solo puede actualizar su propio perfil
-- NOTA: La restricción de campos (solo nombre, avatar_url) se controla
-- desde la aplicación frontend, ya que RLS no permite limitar columnas.
CREATE POLICY profiles_update_repartidor ON public.profiles
  FOR UPDATE
  USING (
    public.get_user_role() = 'repartidor'
    AND id = (SELECT auth.uid())
  )
  WITH CHECK (
    public.get_user_role() = 'repartidor'
    AND id = (SELECT auth.uid())
  );

-- --- DELETE ---

-- Solo admin puede eliminar perfiles (desactivar es preferible)
CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 4. POLÍTICAS DE SEGURIDAD: CLIENTES
-- ============================================================================
-- Admin:      Control total (CRUD completo)
-- Oficina:    Puede ver, crear y editar clientes
-- Repartidor: Solo ve clientes activos (necesita los datos para el albarán)

-- --- SELECT ---

-- Admin ve todos los clientes (incluidos inactivos)
CREATE POLICY clientes_select_admin ON public.clientes
  FOR SELECT
  USING (public.is_admin());

-- Oficina ve todos los clientes
CREATE POLICY clientes_select_oficina ON public.clientes
  FOR SELECT
  USING (public.get_user_role() = 'oficina');

-- Repartidor solo ve clientes activos
CREATE POLICY clientes_select_repartidor ON public.clientes
  FOR SELECT
  USING (
    public.get_user_role() = 'repartidor'
    AND activo = true
  );

-- --- INSERT ---

-- Admin puede crear clientes
CREATE POLICY clientes_insert_admin ON public.clientes
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Oficina puede crear clientes
CREATE POLICY clientes_insert_oficina ON public.clientes
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'oficina');

-- --- UPDATE ---

-- Admin puede actualizar cualquier cliente
CREATE POLICY clientes_update_admin ON public.clientes
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Oficina puede actualizar clientes
CREATE POLICY clientes_update_oficina ON public.clientes
  FOR UPDATE
  USING (public.get_user_role() = 'oficina')
  WITH CHECK (public.get_user_role() = 'oficina');

-- --- DELETE ---

-- Solo admin puede eliminar clientes
CREATE POLICY clientes_delete_admin ON public.clientes
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 5. POLÍTICAS DE SEGURIDAD: TALLERES
-- ============================================================================
-- Misma lógica que clientes: admin todo, oficina gestión, repartidor lectura

-- --- SELECT ---

CREATE POLICY talleres_select_admin ON public.talleres
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY talleres_select_oficina ON public.talleres
  FOR SELECT
  USING (public.get_user_role() = 'oficina');

-- Repartidor solo ve talleres activos
CREATE POLICY talleres_select_repartidor ON public.talleres
  FOR SELECT
  USING (
    public.get_user_role() = 'repartidor'
    AND activo = true
  );

-- --- INSERT ---

CREATE POLICY talleres_insert_admin ON public.talleres
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY talleres_insert_oficina ON public.talleres
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'oficina');

-- --- UPDATE ---

CREATE POLICY talleres_update_admin ON public.talleres
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY talleres_update_oficina ON public.talleres
  FOR UPDATE
  USING (public.get_user_role() = 'oficina')
  WITH CHECK (public.get_user_role() = 'oficina');

-- --- DELETE ---

CREATE POLICY talleres_delete_admin ON public.talleres
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 6. POLÍTICAS DE SEGURIDAD: ALBARANES
-- ============================================================================
-- Admin:      Control total
-- Oficina:    Ve todos, puede crear y editar (validar/rechazar)
-- Repartidor: Solo ve y crea los suyos (usuario_id = auth.uid())

-- --- SELECT ---

CREATE POLICY albaranes_select_admin ON public.albaranes
  FOR SELECT
  USING (public.is_admin());

-- Oficina ve todos los albaranes (necesario para validar/gestionar)
CREATE POLICY albaranes_select_oficina ON public.albaranes
  FOR SELECT
  USING (public.get_user_role() = 'oficina');

-- Repartidor solo ve sus propios albaranes
CREATE POLICY albaranes_select_repartidor ON public.albaranes
  FOR SELECT
  USING (
    public.get_user_role() = 'repartidor'
    AND usuario_id = (SELECT auth.uid())
  );

-- --- INSERT ---

-- Admin puede crear albaranes (asignándolos a cualquier usuario)
CREATE POLICY albaranes_insert_admin ON public.albaranes
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Oficina puede crear albaranes
CREATE POLICY albaranes_insert_oficina ON public.albaranes
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'oficina');

-- Repartidor solo puede crear albaranes asignados a sí mismo
CREATE POLICY albaranes_insert_repartidor ON public.albaranes
  FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'repartidor'
    AND usuario_id = (SELECT auth.uid())
  );

-- --- UPDATE ---

-- Admin puede actualizar cualquier albarán
CREATE POLICY albaranes_update_admin ON public.albaranes
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Oficina puede actualizar cualquier albarán (validar, rechazar, etc.)
CREATE POLICY albaranes_update_oficina ON public.albaranes
  FOR UPDATE
  USING (public.get_user_role() = 'oficina')
  WITH CHECK (public.get_user_role() = 'oficina');

-- --- DELETE ---

-- Solo admin puede eliminar albaranes
CREATE POLICY albaranes_delete_admin ON public.albaranes
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 7. POLÍTICAS DE SEGURIDAD: HISTORIAL
-- ============================================================================
-- Solo lectura para todos los roles (la escritura se hace vía triggers
-- o funciones del backend). Cada rol ve el historial según sus permisos.

-- --- SELECT ---

-- Admin ve todo el historial
CREATE POLICY historial_select_admin ON public.historial
  FOR SELECT
  USING (public.is_admin());

-- Oficina ve todo el historial
CREATE POLICY historial_select_oficina ON public.historial
  FOR SELECT
  USING (public.get_user_role() = 'oficina');

-- Repartidor solo ve historial de sus propios albaranes
CREATE POLICY historial_select_repartidor ON public.historial
  FOR SELECT
  USING (
    public.get_user_role() = 'repartidor'
    AND albaran_id IN (
      SELECT id FROM public.albaranes
      WHERE usuario_id = (SELECT auth.uid())
    )
  );

-- --- INSERT ---
-- Permitir inserción desde la aplicación para registrar acciones
-- (el control de quién puede insertar se maneja desde el backend)

CREATE POLICY historial_insert_authenticated ON public.historial
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
