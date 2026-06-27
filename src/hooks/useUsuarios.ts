/**
 * Hooks de React Query para usuarios (perfiles) — GS AUTOBAT
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsuarios, getRepartidores, updateUsuario, desactivarUsuario } from '@/services/usuarios.service';
import { createUser } from '@/services/auth.service';
import type { UserRole } from '@/types/database';

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios,
  });
}

export function useRepartidores() {
  return useQuery({
    queryKey: ['usuarios', 'repartidores'],
    queryFn: getRepartidores,
  });
}

export function useCreateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useUpdateUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ nombre: string; codigo: string; rol: UserRole; activo: boolean; email: string; delegacion_id: string | null }>;
    }) => updateUsuario(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: desactivarUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}
