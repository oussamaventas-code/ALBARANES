/**
 * Hook de React Query para el historial de un albarán — GS AUTOBAT
 */
import { useQuery } from '@tanstack/react-query';
import { getHistorial } from '@/services/historial.service';

export function useHistorial(albaranId: string | undefined) {
  return useQuery({
    queryKey: ['historial', albaranId],
    queryFn: () => getHistorial(albaranId as string),
    enabled: !!albaranId,
  });
}
