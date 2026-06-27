/**
 * Servicio de usuarios (perfiles) para GS AUTOBAT - Albaranes Inteligentes
 *
 * Gestión de perfiles desde el panel de administración.
 * La creación de usuarios (con Auth) se gestiona en auth.service.ts.
 */

import { supabase } from '@/lib/supabase';
import type { Profile, UserRole, Delegacion } from '@/types/database';

export interface ProfileWithDelegacion extends Profile {
  delegacion: Pick<Delegacion, 'id' | 'nombre'> | null;
}

/** Obtiene todos los perfiles ordenados por nombre, con el nombre de su delegación */
export async function getUsuarios(): Promise<ProfileWithDelegacion[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, delegacion:delegaciones(id, nombre)')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return (data as ProfileWithDelegacion[]) || [];
}

/** Obtiene solo los repartidores activos (para filtros) */
export async function getRepartidores(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'repartidor')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Actualiza datos de un perfil (rol, nombre, código, delegación, estado activo) */
export async function updateUsuario(
  id: string,
  data: Partial<{ nombre: string; codigo: string; rol: UserRole; activo: boolean; email: string; delegacion_id: string | null }>
): Promise<Profile> {
  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/** Desactiva un usuario (no se elimina para preservar la integridad del historial) */
export async function desactivarUsuario(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ activo: false }).eq('id', id);
  if (error) throw error;
}
