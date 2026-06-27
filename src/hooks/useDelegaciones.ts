/**
 * Hooks de React Query para delegaciones — GS AUTOBAT
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDelegaciones, createDelegacion, updateDelegacion, deleteDelegacion } from '@/services/delegaciones.service';
import type { DelegacionFormData } from '@/types/database';

export function useDelegaciones(soloActivas = false) {
  return useQuery({
    queryKey: ['delegaciones', soloActivas],
    queryFn: () => getDelegaciones(soloActivas),
  });
}

export function useCreateDelegacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDelegacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delegaciones'] }),
  });
}

export function useUpdateDelegacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DelegacionFormData & { activo: boolean }> }) =>
      updateDelegacion(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delegaciones'] }),
  });
}

export function useDeleteDelegacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDelegacion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delegaciones'] }),
  });
}
