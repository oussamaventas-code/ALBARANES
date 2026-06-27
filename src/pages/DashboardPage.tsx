/**
 * Dashboard principal — GS AUTOBAT
 *
 * Vista de resumen con estadísticas clave y la actividad más reciente.
 */
import { Link } from 'react-router-dom';
import { FileText, CalendarCheck, Building2, Users, PlusCircle, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats, useRecentAlbaranes } from '@/hooks/useAlbaranes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFechaHora, ESTADO_CONFIG } from '@/lib/utils';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recientes, isLoading: recentesLoading } = useRecentAlbaranes(6);

  const cards = [
    { label: 'Total albaranes', value: stats?.totalAlbaranes, icon: FileText },
    { label: 'Subidos hoy', value: stats?.albaranesHoy, icon: CalendarCheck },
    { label: 'Clientes', value: stats?.totalClientes, icon: Building2 },
    { label: 'Repartidores', value: stats?.totalRepartidores, icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hola, {profile?.nombre?.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">Resumen de actividad del sistema</p>
        </div>
        <Button asChild size="lg">
          <Link to="/albaranes/nuevo">
            <PlusCircle className="size-4" />
            Nuevo albarán
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <card.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{statsLoading ? '—' : card.value ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimos albaranes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/albaranes">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentesLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {!recentesLoading && recientes?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Todavía no hay albaranes registrados.</p>
          )}
          {recientes?.map((albaran) => (
            <Link
              key={albaran.id}
              to={`/albaranes/${albaran.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{albaran.numero} — {albaran.cliente?.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {albaran.taller?.nombre} · {formatFechaHora(albaran.created_at)} · {albaran.usuario?.nombre}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={ESTADO_CONFIG[albaran.estado].color} variant="outline">
                  {ESTADO_CONFIG[albaran.estado].label}
                </Badge>
                <Eye className="size-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
