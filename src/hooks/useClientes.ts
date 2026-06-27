/**
 * Hooks de React Query para clientes — GS AUTOBAT
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getClientes, getCliente, createCliente, updateCliente, deleteCliente } from '@/services/clientes.service';
import type { Cliente, ClienteFormData } from '@/types/database';

export function useClientes(soloActivos = false) {
  return useQuery({
    queryKey: ['clientes', soloActivos],
    queryFn: () => getClientes(soloActivos),
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getCliente(id as string),
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCliente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClienteFormData & { activo: boolean }> }) =>
      updateCliente(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export type { Cliente };
