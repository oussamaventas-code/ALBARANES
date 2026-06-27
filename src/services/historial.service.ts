/**
 * Servicio de historial para GS AUTOBAT - Albaranes Inteligentes
 *
 * Registra y consulta el historial de acciones realizadas sobre cada albarán.
 * Cada cambio de estado, edición o creación queda auditado en la tabla `historial`.
 */

import { supabase } from '@/lib/supabase';
import type { HistorialWithUsuario } from '@/types/database';

// ─── Consultas ───────────────────────────────────────────────────────────────

/**
 * Obtiene el historial de acciones de un albarán específico.
 * Incluye los datos del usuario que realizó cada acción (join con profiles).
 * Ordenado por fecha descendente (más reciente primero).
 */
export async function getHistorial(albaranId: string): Promise<HistorialWithUsuario[]> {
  const { data, error } = await supabase
    .from('historial')
    .select(`
      *,
      usuario:profiles(id, nombre, codigo)
    `)
    .eq('albaran_id', albaranId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as HistorialWithUsuario[];
}

// ─── Registro de acciones ────────────────────────────────────────────────────

/**
 * Registra una nueva acción en el historial de un albarán.
 * Se asocia automáticamente al usuario autenticado actual.
 *
 * @param albaranId - ID del albarán afectado
 * @param accion - Descripción de la acción (ej: "Albarán creado", "Estado cambiado a validado")
 * @param detalles - Datos adicionales opcionales en formato JSON
 */
export async function registrarAccion(
  albaranId: string,
  accion: string,
  detalles?: Record<string, unknown>
): Promise<void> {
  // Obtener el usuario actual para asociar la acción
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No hay usuario autenticado para registrar la acción');

  const { error } = await supabase
    .from('historial')
    .insert({
      albaran_id: albaranId,
      usuario_id: user.id,
      accion,
      detalles: detalles || null,
    });

  if (error) throw error;
}
