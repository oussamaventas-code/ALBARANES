/**
 * Tipos de base de datos para GS AUTOBAT - Albaranes Inteligentes
 *
 * Define los tipos TypeScript que mapean directamente a las tablas de Supabase,
 * así como tipos derivados para relaciones, formularios y filtros.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

/** Roles de usuario en el sistema */
export type UserRole = 'admin' | 'oficina' | 'repartidor';

/** Estados posibles de un albarán en su ciclo de vida */
export type AlbaranEstado = 'pendiente' | 'validado' | 'rechazado' | 'archivado';

// ─── Tipos de fila (Row Types) ───────────────────────────────────────────────
// Mapean 1:1 con las tablas de Supabase

/** Perfil de usuario vinculado a auth.users */
export interface Profile {
  id: string;
  nombre: string;
  email: string | null;
  rol: UserRole;
  /** Código único de acceso del usuario (ej: "JUAN01") */
  codigo: string;
  avatar_url: string | null;
  /** Delegación a la que pertenece. NULL en admin/oficina = alcance nacional (ve todas) */
  delegacion_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/** Delegación/sucursal de la red de reparto */
export interface Delegacion {
  id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/** Cliente principal (empresa) */
export interface Cliente {
  id: string;
  nombre: string;
  cif: string | null;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  /** Código de cliente del proveedor (ej: "C00022615"), usado para autoseleccionar por OCR */
  codigo_externo: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/** Taller asociado a un cliente (punto de entrega) */
export interface Taller {
  id: string;
  nombre: string;
  /** FK: referencia al cliente propietario del taller */
  cliente_id: string;
  direccion: string | null;
  telefono: string | null;
  contacto: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/** Albarán de entrega — entidad principal del sistema */
export interface Albaran {
  id: string;
  /** Número secuencial del albarán (ej: "00025488") */
  numero: string;
  cliente_id: string;
  taller_id: string;
  /** FK: repartidor que registró el albarán */
  usuario_id: string;
  /** Fecha de entrega en formato ISO (YYYY-MM-DD) */
  fecha: string;
  observaciones: string | null;
  /** Ruta del archivo (foto/PDF) dentro del bucket privado 'albaranes'. Requiere getSignedUrl() para visualizarlo */
  archivo_url: string | null;
  archivo_nombre: string | null;
  estado: AlbaranEstado;
  /** Delegación del repartidor que lo creó; se asigna automáticamente al guardar */
  delegacion_id: string | null;
  /** URL de la firma digital capturada */
  firma_url: string | null;
  /** Coordenadas GPS de la entrega */
  latitud: number | null;
  longitud: number | null;
  created_at: string;
  updated_at: string;
}

/** Entrada del historial de cambios de un albarán */
export interface HistorialEntry {
  id: string;
  albaran_id: string;
  usuario_id: string;
  /** Acción realizada (ej: "creado", "validado", "rechazado") */
  accion: string;
  /** Detalles adicionales de la acción en formato JSON */
  detalles: Record<string, unknown> | null;
  created_at: string;
}

// ─── Tipos con relaciones (Joins) ────────────────────────────────────────────
// Se usan en queries con select que incluyen tablas relacionadas

/** Albarán con datos resumidos de cliente, taller y repartidor */
export interface AlbaranWithRelations extends Albaran {
  cliente: Pick<Cliente, 'id' | 'nombre'>;
  taller: Pick<Taller, 'id' | 'nombre'> | null;
  usuario: Pick<Profile, 'id' | 'nombre' | 'codigo'>;
  delegacion: Pick<Delegacion, 'id' | 'nombre'> | null;
}

/** Taller con datos resumidos de su cliente */
export interface TallerWithCliente extends Taller {
  cliente: Pick<Cliente, 'id' | 'nombre'>;
}

/** Entrada de historial con datos del usuario que realizó la acción */
export interface HistorialWithUsuario extends HistorialEntry {
  usuario: Pick<Profile, 'id' | 'nombre' | 'codigo'>;
}

// ─── Tipos de formulario (Form Data) ────────────────────────────────────────
// Datos necesarios para crear o actualizar registros

/** Datos del formulario de creación/edición de albarán */
export interface AlbaranFormData {
  numero: string;
  cliente_id: string;
  /** Opcional: muchos clientes no tienen talleres separados (el cliente es el punto de entrega) */
  taller_id?: string;
  fecha: string;
  observaciones?: string;
}

/** Datos del formulario de creación/edición de cliente */
export interface ClienteFormData {
  nombre: string;
  cif?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  /** Código de cliente del proveedor (ej: "C00022615") para autoselección por OCR */
  codigo_externo?: string;
}

/** Datos del formulario de creación/edición de taller */
export interface TallerFormData {
  nombre: string;
  cliente_id: string;
  direccion?: string;
  telefono?: string;
  contacto?: string;
}

/** Datos del formulario de creación/edición de perfil de usuario */
export interface ProfileFormData {
  nombre: string;
  email?: string;
  rol: UserRole;
  codigo: string;
  /** Solo requerido al crear un nuevo usuario */
  password?: string;
  /** Vacío/null = alcance nacional (ve todas las delegaciones) */
  delegacion_id?: string | null;
}

/** Datos del formulario de creación/edición de delegación */
export interface DelegacionFormData {
  nombre: string;
}

// ─── Tipos de filtrado ──────────────────────────────────────────────────────

/** Filtros disponibles para la búsqueda de albaranes */
export interface AlbaranFilters {
  /** Búsqueda por texto libre (número, cliente, etc.) */
  search?: string;
  cliente_id?: string;
  taller_id?: string;
  usuario_id?: string;
  /** Filtrar por delegación (solo relevante para usuarios con alcance nacional) */
  delegacion_id?: string;
  estado?: AlbaranEstado;
  /** Rango de fechas para filtrar */
  fecha_desde?: string;
  fecha_hasta?: string;
}

// ─── Paginación ─────────────────────────────────────────────────────────────

/** Respuesta paginada genérica usada por los servicios de listado */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

// ─── Tipos de dashboard ─────────────────────────────────────────────────────

/** Estadísticas resumidas para el panel de control */
export interface DashboardStats {
  totalAlbaranes: number;
  albaranesHoy: number;
  totalClientes: number;
  totalRepartidores: number;
}
