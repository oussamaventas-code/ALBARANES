/**
 * Hooks de React Query para talleres — GS AUTOBAT
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTalleres, getTaller, createTaller, updateTaller, deleteTaller } from '@/services/talleres.service';
import type { TallerFormData } from '@/types/database';

export function useTalleres(clienteId?: string, soloActivos = false) {
  return useQuery({
    queryKey: ['talleres', clienteId, soloActivos],
    queryFn: () => getTalleres(clienteId, soloActivos),
  });
}

export function useTaller(id: string | undefined) {
  return useQuery({
    queryKey: ['taller', id],
    queryFn: () => getTaller(id as string),
    enabled: !!id,
  });
}

export function useCreateTaller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaller,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['talleres'] }),
  });
}

export function useUpdateTaller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TallerFormData & { activo: boolean }> }) =>
      updateTaller(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['talleres'] }),
  });
}

export function useDeleteTaller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaller,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['talleres'] }),
  });
}
