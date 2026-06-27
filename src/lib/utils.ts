/**
 * Utilidades compartidas para GS AUTOBAT - Albaranes Inteligentes
 *
 * Incluye helpers para:
 * - Clases CSS (Tailwind merge)
 * - Formateo de fechas en español
 * - Rutas de almacenamiento en Supabase Storage
 * - Validación de archivos
 * - Mapeo de código de usuario a email sintético
 * - Configuración visual de estados y roles
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Clases CSS ──────────────────────────────────────────────────────────────

/**
 * Combina clases de Tailwind con resolución de conflictos.
 * Usa clsx para condicionales y twMerge para evitar duplicados.
 *
 * @example cn('px-4 py-2', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formateo de fechas ─────────────────────────────────────────────────────

/** Formatea fecha como "26/06/2026" */
export function formatFecha(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
}

/** Formatea fecha y hora como "26/06/2026 a las 14:30" */
export function formatFechaHora(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
}

/** Formatea fecha corta como "26 jun 2026" */
export function formatFechaCorta(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: es });
}

/** Devuelve la fecha actual en formato YYYY-MM-DD para valores por defecto de formularios */
export function hoy(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ─── Rutas de almacenamiento ─────────────────────────────────────────────────

/**
 * Genera la ruta de almacenamiento en Supabase Storage para un archivo de albarán.
 *
 * Patrón: /2026/Junio/ClienteNombre/00025488.pdf
 *
 * Se sanitiza el nombre del cliente para evitar caracteres problemáticos en la ruta.
 */
export function generateStoragePath(
  fecha: Date | string,
  clienteNombre: string,
  numero: string,
  extension: string
): string {
  const d = new Date(fecha);
  const year = d.getFullYear().toString();
  const month = format(d, 'MMMM', { locale: es });

  // Capitalizar primera letra del mes (ej: "junio" → "Junio")
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

  // Sanitizar nombre del cliente para uso seguro en rutas de archivo
  const safeClientName = clienteNombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-zA-Z0-9\s]/g, '')  // Eliminar caracteres especiales
    .replace(/\s+/g, '_')            // Reemplazar espacios por guiones bajos
    .substring(0, 50);               // Limitar longitud para evitar paths muy largos

  return `${year}/${monthCapitalized}/${safeClientName}/${numero}.${extension}`;
}

// ─── Validación de archivos ──────────────────────────────────────────────────

/** Tipos MIME permitidos para subir archivos de albarán */
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

/** Tamaño máximo de archivo: 15 MB */
const MAX_FILE_SIZE = 15 * 1024 * 1024;

/** Verifica que el archivo sea de un tipo permitido (JPEG, PNG o PDF) */
export function isValidFileType(file: File): boolean {
  return VALID_FILE_TYPES.includes(file.type);
}

/** Verifica que el archivo no exceda el tamaño máximo (15 MB) */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/** Obtiene la extensión del archivo basándose en su tipo MIME */
export function getFileExtension(file: File): string {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  // Fallback: extraer del nombre del archivo
  return file.name.split('.').pop() || 'bin';
}

/** Formatea el tamaño de un archivo para mostrar al usuario (ej: "2.5 MB") */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── Autenticación ──────────────────────────────────────────────────────────

/**
 * Email base de la cuenta Gmail del administrador/propietario del sistema.
 * Se usa como dominio de los emails sintéticos (ver codigoToEmail) aprovechando
 * que Gmail ignora cualquier sufijo "+alias" y entrega todo a esta bandeja real.
 * Configúralo mediante VITE_AUTH_EMAIL_BASE en el .env si cambia de propietario.
 */
const AUTH_EMAIL_BASE = import.meta.env.VITE_AUTH_EMAIL_BASE || 'oussamaamah@gmail.com';

/**
 * Genera un email sintético a partir del código de usuario.
 *
 * Login simplificado: el usuario inicia sesión con su código (ej: "JUAN01"),
 * que internamente se mapea a un alias "+" del Gmail real configurado en
 * AUTH_EMAIL_BASE (ej: "usuario+juan01@gmail.com"). Esto cumple la validación
 * de dominio con MX válido que exige Supabase Auth, y además garantiza que
 * cualquier email del sistema (confirmaciones, resets) llegue a una bandeja real.
 */
export function codigoToEmail(codigo: string): string {
  const [user, domain] = AUTH_EMAIL_BASE.split('@');
  const sufijo = codigo.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${user}+${sufijo}@${domain}`;
}

// ─── Configuración visual de estados ─────────────────────────────────────────

/**
 * Etiquetas y clases CSS para cada estado de albarán.
 * Se usa en badges y filtros de la interfaz.
 */
export const ESTADO_CONFIG = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  validado: {
    label: 'Validado',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  rechazado: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  archivado: {
    label: 'Archivado',
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  },
} as const;

// ─── Configuración visual de roles ──────────────────────────────────────────

/**
 * Etiquetas y clases CSS para cada rol de usuario.
 * Se usa en badges y listados de usuarios.
 */
export const ROL_CONFIG = {
  admin: {
    label: 'Administrador',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  oficina: {
    label: 'Oficina',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  repartidor: {
    label: 'Repartidor',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
} as const;
