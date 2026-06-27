# GS AUTOBAT — Albaranes Inteligentes

Aplicación web para digitalizar el archivo de albaranes firmados de una empresa de recambios de automoción. Sustituye el archivo físico en papel por un registro digital donde cualquier albarán puede encontrarse en segundos, con un flujo de captura pensado para que un repartidor registre un albarán desde el móvil en menos de 10 segundos.

## Stack

React 19 + Vite + TypeScript · Tailwind CSS v4 + shadcn/ui · React Router · TanStack Query · Supabase (Auth, Postgres, Storage) · Deploy en Vercel.

## Estructura del proyecto

```
src/
  components/ui/       Componentes shadcn/ui (Button, Card, Dialog, Table, Select…)
  components/layout/   AppLayout (sidebar + barra inferior móvil)
  contexts/            AuthContext, ThemeContext, ToastContext
  hooks/                Hooks de React Query (useAlbaranes, useClientes…)
  services/             Acceso a Supabase (albaranes, clientes, talleres, storage, auth…)
  pages/                Páginas de la app (Dashboard, Nuevo albarán, Listado, Detalle, Admin)
  types/                Tipos TypeScript de la base de datos y autenticación
  lib/                  Cliente de Supabase y utilidades compartidas
supabase/
  schema.sql            Tablas, índices, triggers
  rls_policies.sql       Row Level Security por rol
  storage_policies.sql   Bucket 'albaranes' y políticas de Storage
  seed.sql               Datos de ejemplo (opcional)
```

## Roles

- **Administrador**: control total (usuarios, clientes, talleres, albaranes).
- **Oficina**: gestión de clientes, talleres y albaranes (sin eliminar).
- **Repartidor**: solo ve y crea sus propios albaranes.

El acceso usa un **código de usuario** (ej. `REP-001`) en vez de un email; internamente se mapea a un email sintético para Supabase Auth.

## Manual de instalación

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en este orden:
   1. `supabase/schema.sql`
   2. `supabase/rls_policies.sql`
   3. `supabase/storage_policies.sql`
   4. (opcional) `supabase/seed.sql` para datos de prueba.
3. Crea el primer usuario administrador:
   - En **Authentication > Users**, crea un usuario con email `admin01@gsautobat.app` (el trigger creará su perfil automáticamente con rol `repartidor`).
   - En **Table Editor > profiles**, edita esa fila y cambia `rol` a `admin` y `codigo` a algo memorable (ej. `ADMIN-01`).
   - Inicia sesión en la app con código `ADMIN-01` y la contraseña que definiste.

### 2. Configurar variables de entorno

Copia `.env.example` como `.env.local` y rellena con los valores de tu proyecto (**Project Settings > API**):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Instalar y ejecutar en local

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`.

### 4. Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Type-check + build de producción
npm run preview   # Sirve el build de producción localmente
npm run lint       # Linter (oxlint)
```

## Manual de despliegue en Vercel

1. Sube el proyecto a un repositorio Git (GitHub/GitLab/Bitbucket).
2. En [vercel.com](https://vercel.com), importa el repositorio.
3. Framework preset: **Vite** (detectado automáticamente).
4. Añade las variables de entorno en **Settings > Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Despliega. El archivo `vercel.json` ya incluye el rewrite necesario para que las rutas de React Router funcionen correctamente en producción (SPA fallback a `index.html`).

## Seguridad

- **Row Level Security** activado en todas las tablas (`profiles`, `clientes`, `talleres`, `albaranes`, `historial`), con políticas diferenciadas por rol.
- El bucket `albaranes` de Storage es **privado**: los archivos se sirven mediante URLs firmadas con expiración (`getSignedUrl`), nunca con URLs públicas.
- Validación de archivos en el cliente: solo JPEG, PNG y PDF, máximo 15 MB.
- Cada acción sobre un albarán (creación, edición, validación) queda registrada en la tabla `historial` para auditoría.

## Flujo de registro de un albarán (repartidor)

1. Iniciar sesión con el código de usuario.
2. Pulsar **Nuevo albarán** (acceso directo en la barra inferior).
3. Hacer una foto con la cámara del móvil o subir un PDF.
4. Introducir el número de albarán y seleccionar cliente/taller.
5. Pulsar **Guardar** — el formulario se reinicia automáticamente para encadenar el siguiente registro.

## Próximas mejoras (arquitectura preparada para)

La tabla `albaranes` ya reserva columnas para `firma_url`, `latitud` y `longitud`, pensadas para:

- OCR (Google Vision / Tesseract) para autocompletar el número de albarán.
- Lectura de QR / código de barras.
- Firma digital del receptor.
- Geolocalización de la entrega.
- Integración con ERP, notificaciones y exportación masiva.
- Multiempresa (multi-tenant).

<!-- deploy trigger 1782582707 -->
