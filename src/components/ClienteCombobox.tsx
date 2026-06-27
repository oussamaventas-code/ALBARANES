/**
 * Buscador de clientes — GS AUTOBAT
 *
 * Selector con búsqueda en servidor, pensado para miles de clientes.
 * Abre un diálogo a pantalla (ideal en móvil) con un campo de búsqueda
 * que filtra por nombre o código de cliente.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { searchClientes } from '@/services/clientes.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  /** Nombre del cliente seleccionado, para mostrarlo en el botón sin recargarlo */
  selectedNombre?: string;
  onSelect: (id: string, nombre: string) => void;
  placeholder?: string;
}

export function ClienteCombobox({ value, selectedNombre, onSelect, placeholder = 'Selecciona un cliente' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  // Debounce de la búsqueda para no consultar en cada tecla
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: resultados, isFetching } = useQuery({
    queryKey: ['clientes-search', debounced],
    queryFn: () => searchClientes(debounced),
    enabled: open,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {value ? selectedNombre || 'Cliente seleccionado' : placeholder}
        </span>
        <ChevronDown className="size-4 opacity-50 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar cliente</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Nombre o código (ej: DIMOVIL, C00000008)…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto -mx-2">
            {isFetching && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Buscando…
              </div>
            )}
            {!isFetching && resultados?.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">Sin resultados. Prueba con otro nombre o código.</p>
            )}
            {resultados?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c.id, c.nombre); setOpen(false); setQuery(''); }}
                className="flex w-full items-start justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.nombre}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.codigo_externo || 'sin código'}{c.direccion ? ` · ${c.direccion}` : ''}
                  </span>
                </span>
                {value === c.id && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
