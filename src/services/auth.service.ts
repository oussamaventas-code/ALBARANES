/**
 * Servicio de autenticación para GS AUTOBAT - Albaranes Inteligentes
 *
 * Login simplificado: el repartidor introduce su código y contraseña.
 * Internamente se mapea el código a un email sintético para Supabase Auth.
 */

import { supabase } from '@/lib/supabase';
import { codigoToEmail } from '@/lib/utils';
import type { Profile } from '@/types/database';

// ─── Login / Logout ──────────────────────────────────────────────────────────

/**
 * Inicia sesión con código de usuario y contraseña.
 * El código se transforma internamente a un email sintético (ej: "juan01@gsautobat.app")
 * porque Supabase Auth requiere email + password.
 */
export async function signIn(codigo: string, password: string) {
  const email = codigoToEmail(codigo);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Cierra la sesión del usuario actual */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Obtiene la sesión activa (null si no hay sesión) */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ─── Perfil ──────────────────────────────────────────────────────────────────

/**
 * Obtiene el perfil completo del usuario actualmente autenticado.
 * Consulta la tabla `profiles` con el ID del usuario de auth.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

// ─── Gestión de usuarios (solo admin) ────────────────────────────────────────

/**
 * Crea un nuevo usuario en el sistema.
 * 1. Crea la cuenta en Supabase Auth con email sintético
 * 2. Actualiza el perfil con los datos adicionales (nombre, código, rol)
 *
 * NOTA: En producción, la creación de usuarios debería hacerse
 * mediante una Edge Function con privilegios de service_role
 * para evitar que el admin pierda su propia sesión al hacer signUp.
 */
export async function createUser(data: {
  nombre: string;
  codigo: string;
  rol: string;
  password: string;
  email?: string;
  /** Vacío/null = alcance nacional (ve todas las delegaciones) */
  delegacion_id?: string | null;
}) {
  const syntheticEmail = codigoToEmail(data.codigo);

  // Crear cuenta en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: syntheticEmail,
    password: data.password,
    options: {
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        rol: data.rol,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No se pudo crear el usuario');

  // Completar el perfil con datos adicionales
  // El trigger de Supabase ya crea la fila en profiles, aquí solo actualizamos
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      nombre: data.nombre,
      codigo: data.codigo,
      rol: data.rol,
      email: data.email || null,
      delegacion_id: data.delegacion_id || null,
    })
    .eq('id', authData.user.id);

  if (profileError) throw profileError;
  return authData;
}
