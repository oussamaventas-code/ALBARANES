/**
 * Hooks de React Query para albaranes — GS AUTOBAT
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAlbaranes,
  getAlbaran,
  createAlbaran,
  updateAlbaran,
  deleteAlbaran,
  getAlbaranStats,
  getRecentAlbaranes,
  busquedaRapida,
} from '@/services/albaranes.service';
import type { AlbaranFilters, AlbaranFormData, AlbaranEstado } from '@/types/database';

export function useAlbaranes(filters: AlbaranFilters, page: number, pageSize = 20, orden: 'desc' | 'asc' = 'desc') {
  return useQuery({
    queryKey: ['albaranes', filters, page, pageSize, orden],
    queryFn: () => getAlbaranes(filters, page, pageSize, orden),
  });
}

export function useAlbaran(id: string | undefined) {
  return useQuery({
    queryKey: ['albaran', id],
    queryFn: () => getAlbaran(id as string),
    enabled: !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['albaranes', 'stats'],
    queryFn: getAlbaranStats,
  });
}

export function useRecentAlbaranes(limit = 5) {
  return useQuery({
    queryKey: ['albaranes', 'recent', limit],
    queryFn: () => getRecentAlbaranes(limit),
  });
}

export function useBusquedaRapida(query: string, fechaDesde?: string, fechaHasta?: string) {
  return useQuery({
    queryKey: ['albaranes', 'busqueda-rapida', query, fechaDesde, fechaHasta],
    queryFn: () => busquedaRapida(query, fechaDesde, fechaHasta),
    enabled: query.trim().length > 0 || !!fechaDesde || !!fechaHasta,
  });
}

export function useCreateAlbaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, file, clienteNombre }: { formData: AlbaranFormData; file: File; clienteNombre: string }) =>
      createAlbaran(formData, file, clienteNombre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albaranes'] });
    },
  });
}

export function useUpdateAlbaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlbaranFormData & { estado: AlbaranEstado }> }) =>
      updateAlbaran(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['albaranes'] });
      queryClient.invalidateQueries({ queryKey: ['albaran', variables.id] });
    },
  });
}

export function useDeleteAlbaran() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlbaran,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albaranes'] });
    },
  });
}
