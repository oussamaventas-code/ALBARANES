/**
 * Servicio de delegaciones para GS AUTOBAT - Albaranes Inteligentes
 *
 * CRUD de delegaciones (sucursales de la red de reparto, ej: 34 delegaciones
 * de Grupo Silvestre). Cada repartidor pertenece a una; cada usuario de
 * oficina/admin puede ser nacional (sin delegación) o local (atado a una).
 */

import { supabase } from '@/lib/supabase';
import type { Delegacion, DelegacionFormData } from '@/types/database';

/** Obtiene todas las delegaciones ordenadas por nombre */
export async function getDelegaciones(soloActivas = false): Promise<Delegacion[]> {
  let query = supabase.from('delegaciones').select('*').order('nombre');
  if (soloActivas) query = query.eq('activo', true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Crea una nueva delegación */
export async function createDelegacion(formData: DelegacionFormData): Promise<Delegacion> {
  const { data, error } = await supabase
    .from('delegaciones')
    .insert({ nombre: formData.nombre })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Actualiza una delegación existente */
export async function updateDelegacion(
  id: string,
  formData: Partial<DelegacionFormData & { activo: boolean }>
): Promise<Delegacion> {
  const { data, error } = await supabase
    .from('delegaciones')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Elimina una delegación (falla si tiene usuarios/albaranes asociados) */
export async function deleteDelegacion(id: string): Promise<void> {
  const { error } = await supabase.from('delegaciones').delete().eq('id', id);
  if (error) throw error;
}
