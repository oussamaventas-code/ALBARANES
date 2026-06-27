/**
 * Servicio de clientes para GS AUTOBAT - Albaranes Inteligentes
 *
 * CRUD de clientes (empresas) que reciben albaranes a través de sus talleres.
 */

import { supabase } from '@/lib/supabase';
import type { Cliente, ClienteFormData } from '@/types/database';

/** Obtiene todos los clientes ordenados por nombre */
export async function getClientes(soloActivos = false): Promise<Cliente[]> {
  let query = supabase.from('clientes').select('*').order('nombre', { ascending: true });
  if (soloActivos) query = query.eq('activo', true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Obtiene un cliente por su ID */
export async function getCliente(id: string): Promise<Cliente> {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

/**
 * Busca clientes por nombre o código (búsqueda en servidor).
 * Pensado para el buscador del formulario cuando hay miles de clientes:
 * en vez de cargarlos todos, consulta sólo los que coinciden.
 */
export async function searchClientes(query: string, limit = 30): Promise<Cliente[]> {
  let q = supabase.from('clientes').select('*').eq('activo', true).order('nombre').limit(limit);
  const term = query.trim();
  if (term) {
    // Coincidencia por nombre o por código de cliente del proveedor
    q = q.or(`nombre.ilike.%${term}%,codigo_externo.ilike.%${term}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** Busca un cliente por su código externo exacto (ej: "C00022615"), para el OCR. */
export async function getClienteByCodigoExterno(codigo: string): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .ilike('codigo_externo', codigo)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Crea un nuevo cliente */
export async function createCliente(formData: ClienteFormData): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: formData.nombre,
      cif: formData.cif || null,
      telefono: formData.telefono || null,
      direccion: formData.direccion || null,
      email: formData.email || null,
      codigo_externo: formData.codigo_externo || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Actualiza un cliente existente */
export async function updateCliente(id: string, formData: Partial<ClienteFormData & { activo: boolean }>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Elimina un cliente (falla si tiene talleres/albaranes asociados) */
export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}
