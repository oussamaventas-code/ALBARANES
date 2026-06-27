/**
 * Servicio de almacenamiento para GS AUTOBAT - Albaranes Inteligentes
 *
 * Gestiona la subida, descarga y eliminación de archivos
 * en el bucket 'albaranes' de Supabase Storage.
 */

import { supabase } from '@/lib/supabase';
import { isValidFileType, isValidFileSize, formatFileSize } from '@/lib/utils';

/** Nombre del bucket de Supabase Storage donde se guardan los albaranes */
const BUCKET_NAME = 'albaranes';

/** Tamaño máximo permitido para archivos (15 MB) */
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// ─── Subida de archivos ──────────────────────────────────────────────────────

/**
 * Sube un archivo al bucket de albaranes.
 * Valida tipo MIME y tamaño antes de subir.
 *
 * El bucket 'albaranes' es privado, por lo que esta función devuelve la
 * ruta del archivo (no una URL pública). Para visualizarlo o descargarlo
 * hay que generar una URL firmada con getSignedUrl().
 *
 * @param file - Archivo a subir
 * @param path - Ruta dentro del bucket (ej: "2026/Junio/ClienteX/00025488.pdf")
 * @returns Ruta del archivo dentro del bucket
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  // Validar tipo de archivo (solo JPEG, PNG, PDF)
  if (!isValidFileType(file)) {
    throw new Error(
      'Tipo de archivo no permitido. Solo se aceptan archivos JPEG, PNG o PDF.'
    );
  }

  // Validar tamaño máximo
  if (!isValidFileSize(file)) {
    throw new Error(
      `El archivo es demasiado grande (${formatFileSize(file.size)}). ` +
      `El tamaño máximo permitido es ${formatFileSize(MAX_FILE_SIZE)}.`
    );
  }

  // Subir archivo al bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      // Sobreescribir si ya existe un archivo con la misma ruta
      upsert: true,
      // Respetar el tipo MIME original del archivo
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  return path;
}

// ─── URLs firmadas ───────────────────────────────────────────────────────────

/**
 * Genera una URL firmada con tiempo de expiración para descargar un archivo.
 * Útil cuando el bucket no es público y se necesita acceso temporal.
 *
 * @param path - Ruta del archivo dentro del bucket
 * @param expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns URL firmada temporal
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Error al generar URL firmada: ${error.message}`);
  }

  return data.signedUrl;
}

// ─── Eliminación de archivos ─────────────────────────────────────────────────

/**
 * Elimina un archivo del bucket de albaranes.
 *
 * @param path - Ruta del archivo dentro del bucket
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error(`Error al eliminar el archivo: ${error.message}`);
  }
}
