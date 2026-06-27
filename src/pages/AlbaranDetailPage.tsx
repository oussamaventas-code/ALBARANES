/**
 * Detalle de un albarán — GS AUTOBAT
 *
 * Muestra todos los datos, el documento adjunto (imagen o PDF)
 * y el historial de acciones (auditoría).
 */
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useAlbaran } from '@/hooks/useAlbaranes';
import { useHistorial } from '@/hooks/useHistorial';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ESTADO_CONFIG, formatFecha, formatFechaHora } from '@/lib/utils';

export default function AlbaranDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: albaran, isLoading } = useAlbaran(id);
  const { data: historial } = useHistorial(id);
  const { data: signedUrl } = useSignedUrl(albaran?.archivo_url);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!albaran) {
    return <p className="text-center text-muted-foreground py-16">Albarán no encontrado.</p>;
  }

  const isPdf = albaran.archivo_url?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/albaranes"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Albarán {albaran.numero}</h1>
          <p className="text-sm text-muted-foreground">Subido el {formatFechaHora(albaran.created_at)} por {albaran.usuario?.nombre}</p>
        </div>
        <Badge variant="outline" className={ESTADO_CONFIG[albaran.estado].color}>
          {ESTADO_CONFIG[albaran.estado].label}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del albarán</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Número" value={albaran.numero} />
            <Row label="Cliente" value={albaran.cliente?.nombre} />
            <Row label="Taller" value={albaran.taller?.nombre} />
            <Row label="Fecha" value={formatFecha(albaran.fecha)} />
            <Row label="Repartidor" value={`${albaran.usuario?.nombre} (${albaran.usuario?.codigo})`} />
            {albaran.observaciones && <Row label="Observaciones" value={albaran.observaciones} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Documento</CardTitle>
            {signedUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={signedUrl} target="_blank" rel="noreferrer" download>
                  <Download className="size-4" /> Descargar
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!albaran.archivo_url && <p className="text-sm text-muted-foreground">Sin documento adjunto.</p>}
            {albaran.archivo_url && !signedUrl && <p className="text-sm text-muted-foreground">Cargando documento…</p>}
            {signedUrl && isPdf && (
              <iframe src={signedUrl} title="Albarán PDF" className="w-full h-72 rounded-md border" />
            )}
            {signedUrl && !isPdf && (
              <a href={signedUrl} target="_blank" rel="noreferrer">
                <img src={signedUrl} alt={`Albarán ${albaran.numero}`} className="w-full rounded-md border object-contain max-h-72" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {historial?.length === 0 && <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>}
          {historial?.map((entry) => (
            <div key={entry.id} className="flex justify-between gap-3 text-sm border-b last:border-0 pb-2 last:pb-0">
              <div>
                <p className="font-medium">{entry.accion}</p>
                <p className="text-xs text-muted-foreground">{entry.usuario?.nombre}</p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">{formatFechaHora(entry.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || '—'}</span>
    </div>
  );
}
