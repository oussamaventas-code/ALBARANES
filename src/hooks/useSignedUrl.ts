/**
 * Hook para obtener una URL firmada temporal de un archivo del bucket privado.
 */
import { useQuery } from '@tanstack/react-query';
import { getSignedUrl } from '@/services/storage.service';

export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-url', path],
    queryFn: () => getSignedUrl(path as string),
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  });
}
