-- ============================================================================
-- GS AUTOBAT - Albaranes Inteligentes
-- Datos de semilla (Seed Data)
-- ============================================================================
-- Descripción: Inserta datos iniciales de prueba para el sistema.
-- Incluye clientes ficticios (empresas de recambios de automoción) y
-- talleres asociados con datos realistas del sector.
-- ============================================================================

-- ============================================================================
-- ⚠️  NOTA IMPORTANTE SOBRE USUARIOS Y PERFILES
-- ============================================================================
-- Los usuarios (auth.users) y perfiles (public.profiles) NO se crean aquí.
-- Deben crearse exclusivamente a través de:
--
--   1. Supabase Auth API (supabase.auth.signUp)
--   2. Dashboard de Supabase (Authentication > Users > Add User)
--   3. Invitación por email (supabase.auth.admin.inviteUserByEmail)
--
-- Al crear un usuario en auth.users, el trigger 'on_auth_user_created'
-- genera automáticamente el perfil en public.profiles con rol 'repartidor'.
-- El administrador debe cambiar el rol manualmente después si es necesario.
--
-- FLUJO RECOMENDADO PARA CONFIGURACIÓN INICIAL:
--   1. Ejecutar schema.sql (estructura de tablas)
--   2. Ejecutar rls_policies.sql (políticas de seguridad)
--   3. Ejecutar storage_policies.sql (políticas de almacenamiento)
--   4. Ejecutar seed.sql (este archivo - datos de prueba)
--   5. Crear el primer usuario admin desde el Dashboard de Supabase
--   6. Cambiar manualmente su rol a 'admin' y su código a 'GS-001':
--      UPDATE public.profiles SET rol = 'admin', codigo = 'GS-001'
--      WHERE email = 'admin@gsautobat.com';
-- ============================================================================

-- ============================================================================
-- 1. CLIENTES: Empresas de recambios de automoción
-- ============================================================================
-- Empresas ficticias pero con nombres y CIFs realistas del sector
-- de distribución de piezas de automóvil en España.

INSERT INTO public.clientes (id, nombre, cif, telefono, direccion, email, activo)
VALUES
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Recambios Martínez e Hijos S.L.',
    'B12345678',
    '961 234 567',
    'Polígono Industrial El Oliveral, Nave 12, 46190 Riba-roja de Túria, Valencia',
    'pedidos@recambiosmartinez.es',
    true
  ),
  (
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'Autorecambios Levante S.A.',
    'A87654321',
    '963 456 789',
    'Av. de la Constitución, 45, 46900 Torrent, Valencia',
    'info@autorecambioslevante.com',
    true
  ),
  (
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'Distribuciones AutoParts Mediterráneo S.L.',
    'B23456789',
    '962 567 890',
    'C/ de les Barraques, 8, 46470 Catarroja, Valencia',
    'logistica@autopartsmed.es',
    true
  ),
  (
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    'Suministros Ibéricos del Motor S.L.',
    'B34567890',
    '964 678 901',
    'Pol. Ind. Fuente del Jarro, C/ Ciudad de Elda, 22, 46988 Paterna, Valencia',
    'ventas@suministrosibericos.es',
    true
  ),
  (
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'Grupo Repuestos Valencia S.A.',
    'A45678901',
    '960 789 012',
    'C/ dels Traginers, 15, 46014 Valencia',
    'compras@gruporepuestosvalencia.com',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. TALLERES: Puntos de entrega asociados a cada cliente
-- ============================================================================
-- Cada cliente tiene entre 1 y 3 talleres/sucursales donde se realizan
-- las entregas de recambios. Datos ficticios pero realistas.

INSERT INTO public.talleres (id, nombre, cliente_id, direccion, telefono, contacto, activo)
VALUES
  -- ---- Talleres de "Recambios Martínez e Hijos" (2 talleres) ----
  (
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'Taller Central Martínez',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'C/ Mayor, 23, 46100 Burjassot, Valencia',
    '961 111 222',
    'Antonio Martínez',
    true
  ),
  (
    'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    'Taller Martínez - Sucursal Manises',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Av. de Amado Granell Mesado, 5, 46940 Manises, Valencia',
    '961 333 444',
    'José Luis García',
    true
  ),

  -- ---- Talleres de "Autorecambios Levante" (2 talleres) ----
  (
    'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    'AutoTaller Levante - Torrent',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'C/ Gómez Ferrer, 18, 46900 Torrent, Valencia',
    '963 555 666',
    'María del Carmen Ruiz',
    true
  ),
  (
    'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
    'AutoTaller Levante - Aldaia',
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'C/ La Constitución, 30, 46960 Aldaia, Valencia',
    '963 777 888',
    'Francisco Sánchez',
    true
  ),

  -- ---- Talleres de "Distribuciones AutoParts Mediterráneo" (2 talleres) ----
  (
    'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
    'Taller AutoParts Catarroja',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'C/ San Antonio, 12, 46470 Catarroja, Valencia',
    '962 111 333',
    'Pedro Navarro',
    true
  ),
  (
    'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    'Taller AutoParts Albal',
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'Av. País Valencià, 67, 46470 Albal, Valencia',
    '962 222 444',
    'Laura Fernández',
    true
  ),

  -- ---- Talleres de "Suministros Ibéricos del Motor" (2 talleres) ----
  (
    'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c',
    'Taller Ibérico Paterna',
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    'C/ Valencia, 42, 46980 Paterna, Valencia',
    '964 333 555',
    'Raúl Ibáñez',
    true
  ),
  (
    'a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d',
    'Taller Ibérico Godella',
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    'C/ Major, 15, 46110 Godella, Valencia',
    '964 444 666',
    'Carmen López',
    true
  ),

  -- ---- Talleres de "Grupo Repuestos Valencia" (2 talleres) ----
  (
    'b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e',
    'Taller Repuestos Valencia Centro',
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'C/ Colón, 72, 46004 Valencia',
    '960 555 777',
    'Javier Moreno',
    true
  ),
  (
    'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f',
    'Taller Repuestos Valencia - Campanar',
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'Av. de las Cortes Valencianas, 58, 46015 Valencia',
    '960 666 888',
    'Ana Belén Torres',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RESUMEN DE DATOS INSERTADOS
-- ============================================================================
-- Clientes: 5 empresas de recambios de automoción
--   1. Recambios Martínez e Hijos S.L.          → 2 talleres
--   2. Autorecambios Levante S.A.               → 2 talleres
--   3. Distribuciones AutoParts Mediterráneo    → 2 talleres
--   4. Suministros Ibéricos del Motor S.L.      → 2 talleres
--   5. Grupo Repuestos Valencia S.A.            → 2 talleres
--                                          Total: 10 talleres
--
-- Para verificar la inserción ejecutar:
--   SELECT c.nombre, COUNT(t.id) as talleres
--   FROM clientes c LEFT JOIN talleres t ON t.cliente_id = c.id
--   GROUP BY c.nombre ORDER BY c.nombre;
-- ============================================================================
