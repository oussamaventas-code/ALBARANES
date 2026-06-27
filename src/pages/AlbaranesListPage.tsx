/**
 * Listado de albaranes — GS AUTOBAT
 *
 * Tabla con búsqueda y filtros combinables, pensada para oficina/call center:
 *   - Búsqueda por número de albarán
 *   - Filtro por cliente (nombre o código, buscando entre miles)
 *   - Rango de fechas (desde / hasta)
 *   - Estado
 *   - Orden por fecha/hora de subida (reciente o antiguo)
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Download, ChevronLeft, ChevronRight, X, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { useAlbaranes } from '@/hooks/useAlbaranes';
import { useDelegaciones } from '@/hooks/useDelegaciones';
import { getSignedUrl } from '@/services/storage.service';
import { useToast } from '@/contexts/ToastContext';
import { ClienteCombobox } from '@/components/ClienteCombobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ESTADO_CONFIG, formatFecha, formatFechaHora } from '@/lib/utils';
import type { AlbaranEstado, AlbaranFilters } from '@/types/database';

const PAGE_SIZE = 15;

export default function AlbaranesListPage() {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<AlbaranEstado | 'all'>('all');
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [delegacionId, setDelegacionId] = useState('');
  const [orden, setOrden] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  // Solo se muestra el filtro de delegación si hay más de una (alcance nacional)
  const { data: delegaciones } = useDelegaciones(true);

  // Cualquier cambio de filtro vuelve a la primera página
  function update<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  const filters: AlbaranFilters = {
    search: search || undefined,
    estado: estado === 'all' ? undefined : estado,
    cliente_id: clienteId || undefined,
    delegacion_id: delegacionId || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  };

  const { data, isLoading } = useAlbaranes(filters, page, PAGE_SIZE, orden);
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  const hayFiltros = search || estado !== 'all' || clienteId || delegacionId || fechaDesde || fechaHasta;

  function limpiarFiltros() {
    setSearch(''); setEstado('all'); setClienteId(''); setClienteNombre('');
    setDelegacionId(''); setFechaDesde(''); setFechaHasta(''); setPage(1);
  }

  async function handleDownload(path: string) {
    try {
      const url = await getSignedUrl(path);
      window.open(url, '_blank');
    } catch {
      toast('No se pudo abrir el documento', { variant: 'error' });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Albaranes</h1>
        <p className="text-muted-foreground text-sm">{data?.count ?? 0} albaranes encontrados</p>
      </div>

      {/* Filtros */}
      <Card className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Número de albarán</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="ESPAV261036739…" className="pl-9" value={search} onChange={(e) => update(setSearch)(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cliente (nombre o código)</Label>
            <ClienteCombobox
              value={clienteId}
              selectedNombre={clienteNombre}
              placeholder="Todos los clientes"
              onSelect={(id, nombre) => { setClienteId(id); setClienteNombre(nombre); setPage(1); }}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={fechaDesde} onChange={(e) => update(setFechaDesde)(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={fechaHasta} onChange={(e) => update(setFechaHasta)(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estado</Label>
            <Select value={estado} onValueChange={update((v: string) => setEstado(v as AlbaranEstado | 'all'))}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {delegaciones && delegaciones.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Delegación</Label>
              <Select value={delegacionId || 'all'} onValueChange={update((v: string) => setDelegacionId(v === 'all' ? '' : v))}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las delegaciones</SelectItem>
                  {delegaciones.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button variant="outline" size="sm" onClick={() => setOrden((o) => (o === 'desc' ? 'asc' : 'desc'))}>
            {orden === 'desc' ? <ArrowDownWideNarrow className="size-4" /> : <ArrowUpNarrowWide className="size-4" />}
            {orden === 'desc' ? 'Más recientes primero' : 'Más antiguos primero'}
          </Button>
          {hayFiltros && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              <X className="size-4" /> Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Subido (hora)</TableHead>
              <TableHead>Usuario</TableHead>
              {delegaciones && delegaciones.length > 1 && <TableHead>Delegación</TableHead>}
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Cargando…</TableCell></TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No se encontraron albaranes con esos filtros.</TableCell></TableRow>
            )}
            {data?.data.map((albaran) => (
              <TableRow key={albaran.id}>
                <TableCell className="font-medium">{albaran.numero}</TableCell>
                <TableCell>{albaran.cliente?.nombre}</TableCell>
                <TableCell>{formatFecha(albaran.fecha)}</TableCell>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatFechaHora(albaran.created_at)}</TableCell>
                <TableCell>{albaran.usuario?.nombre}</TableCell>
                {delegaciones && delegaciones.length > 1 && (
                  <TableCell className="text-muted-foreground">{albaran.delegacion?.nombre ?? '—'}</TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className={ESTADO_CONFIG[albaran.estado].color}>
                    {ESTADO_CONFIG[albaran.estado].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/albaranes/${albaran.id}`}><Eye className="size-4" /></Link>
                    </Button>
                    {albaran.archivo_url && (
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(albaran.archivo_url!)}>
                        <Download className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-4" /> Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
