/**
 * Tipos de autenticación para GS AUTOBAT - Albaranes Inteligentes
 *
 * El sistema usa un login simplificado por código de usuario.
 * Internamente se mapea el código a un email sintético para Supabase Auth.
 */

import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from './database';

/** Estado global de autenticación del usuario */
export interface AuthState {
  /** Usuario de Supabase Auth (null si no autenticado) */
  user: User | null;
  /** Perfil completo del usuario desde la tabla profiles */
  profile: Profile | null;
  /** Sesión activa de Supabase */
  session: Session | null;
  /** Indica si se está verificando la sesión inicial */
  isLoading: boolean;
  /** Derivado: true si hay sesión y perfil cargado */
  isAuthenticated: boolean;
}

/** Credenciales para el formulario de inicio de sesión */
export interface LoginCredentials {
  /** Código único del usuario (ej: "JUAN01") */
  codigo: string;
  password: string;
}
