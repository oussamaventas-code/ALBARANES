/**
 * Búsqueda rápida para Call Center — GS AUTOBAT
 *
 * Pantalla pensada para "alguien llama por teléfono preguntando por un
 * albarán": una sola caja de búsqueda (número, nombre o código de cliente),
 * resultado inmediato, y acceso directo a ver/descargar el documento.
 * Sin pasos intermedios ni filtros que rellenar antes de poder buscar.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, Search, Eye, Download, FileX } from 'lucide-react';
import { useBusquedaRapida } from '@/hooks/useAlbaranes';
import { getSignedUrl } from '@/services/storage.service';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ESTADO_CONFIG, formatFecha, formatFechaHora } from '@/lib/utils';

export default function CallCenterPage() {
  const [query, setQuery] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const { toast } = useToast();

  const { data: resultados, isFetching } = useBusquedaRapida(query, fechaDesde, fechaHasta);
  const huboBusqueda = query.trim().length > 0 || !!fechaDesde || !!fechaHasta;

  async function handleDownload(path: string) {
    try {
      const url = await getSignedUrl(path);
      window.open(url, '_blank');
    } catch {
      toast('No se pudo abrir el documento', { variant: 'error' });
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <PhoneCall className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Búsqueda rápida</h1>
          <p className="text-muted-foreground text-sm">Para atención telefónica — busca por número, cliente o código</p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Número de albarán, nombre o código de cliente…"
            className="pl-10 h-12 text-base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
        </div>
      </Card>

      {!huboBusqueda && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Escribe algo para buscar, o elige un rango de fechas.
        </p>
      )}

      {huboBusqueda && isFetching && (
        <p className="text-center text-sm text-muted-foreground py-8">Buscando…</p>
      )}

      {huboBusqueda && !isFetching && resultados?.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <FileX className="size-8 mx-auto mb-2 opacity-40" />
          No se encontró ningún albarán con esos datos.
        </div>
      )}

      <div className="space-y-2">
        {resultados?.map((albaran) => (
          <Card key={albaran.id} className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{albaran.numero}</p>
              <p className="text-sm text-muted-foreground truncate">{albaran.cliente?.nombre}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFecha(albaran.fecha)} · subido {formatFechaHora(albaran.created_at)}
                {albaran.usuario?.nombre ? ` · ${albaran.usuario.nombre}` : ''}
              </p>
            </div>
            <Badge variant="outline" className={ESTADO_CONFIG[albaran.estado].color}>
              {ESTADO_CONFIG[albaran.estado].label}
            </Badge>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" asChild>
                <Link to={`/albaranes/${albaran.id}`}><Eye className="size-4" /></Link>
              </Button>
              {albaran.archivo_url && (
                <Button variant="ghost" size="icon" onClick={() => handleDownload(albaran.archivo_url!)}>
                  <Download className="size-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
