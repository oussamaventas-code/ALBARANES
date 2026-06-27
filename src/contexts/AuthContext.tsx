/**
 * Contexto de autenticación para GS AUTOBAT - Albaranes Inteligentes
 *
 * Mantiene en memoria la sesión de Supabase y el perfil del usuario,
 * y se re-sincroniza automáticamente ante cambios de sesión (login/logout/refresh).
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile, signIn as signInService, signOut as signOutService } from '@/services/auth.service';
import type { AuthState } from '@/types/auth';

interface AuthContextValue extends AuthState {
  signIn: (codigo: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  async function loadProfile() {
    try {
      const profile = await getCurrentProfile();
      setState((prev) => ({ ...prev, profile, isAuthenticated: !!profile }));
    } catch {
      setState((prev) => ({ ...prev, profile: null, isAuthenticated: false }));
    }
  }

  useEffect(() => {
    // Cargar la sesión inicial al montar la app
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setState((prev) => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) await loadProfile();
      setState((prev) => ({ ...prev, isLoading: false }));
    });

    // Escuchar cambios de sesión (login, logout, token refresh)
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setState((prev) => ({ ...prev, session, user: session?.user ?? null }));
      if (session?.user) {
        await loadProfile();
      } else {
        setState((prev) => ({ ...prev, profile: null, isAuthenticated: false }));
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signIn(codigo: string, password: string) {
    await signInService(codigo, password);
  }

  async function signOut() {
    await signOutService();
    setState({ user: null, profile: null, session: null, isLoading: false, isAuthenticated: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshProfile: loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para acceder al estado de autenticación y sus acciones */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
