/**
 * Servicio de talleres para GS AUTOBAT - Albaranes Inteligentes
 *
 * CRUD de talleres (puntos de entrega) asociados a un cliente.
 */

import { supabase } from '@/lib/supabase';
import type { Taller, TallerFormData, TallerWithCliente } from '@/types/database';

/** Obtiene todos los talleres con el nombre de su cliente, opcionalmente filtrados por cliente */
export async function getTalleres(clienteId?: string, soloActivos = false): Promise<TallerWithCliente[]> {
  let query = supabase
    .from('talleres')
    .select('*, cliente:clientes(id, nombre)')
    .order('nombre', { ascending: true });

  if (clienteId) query = query.eq('cliente_id', clienteId);
  if (soloActivos) query = query.eq('activo', true);

  const { data, error } = await query;
  if (error) throw error;
  return (data as TallerWithCliente[]) || [];
}

/** Obtiene un taller por su ID */
export async function getTaller(id: string): Promise<Taller> {
  const { data, error } = await supabase.from('talleres').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

/** Crea un nuevo taller */
export async function createTaller(formData: TallerFormData): Promise<Taller> {
  const { data, error } = await supabase
    .from('talleres')
    .insert({
      nombre: formData.nombre,
      cliente_id: formData.cliente_id,
      direccion: formData.direccion || null,
      telefono: formData.telefono || null,
      contacto: formData.contacto || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Actualiza un taller existente */
export async function updateTaller(id: string, formData: Partial<TallerFormData & { activo: boolean }>): Promise<Taller> {
  const { data, error } = await supabase
    .from('talleres')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Elimina un taller (falla si tiene albaranes asociados) */
export async function deleteTaller(id: string): Promise<void> {
  const { error } = await supabase.from('talleres').delete().eq('id', id);
  if (error) throw error;
}
