/**
 * Administración de delegaciones — GS AUTOBAT (solo admin)
 *
 * CRUD de las delegaciones de la red de reparto. Cada repartidor pertenece
 * a una; cada usuario de oficina puede ser nacional (sin delegación, ve
 * todas) o local (atado a una sola).
 */
import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { useDelegaciones, useCreateDelegacion, useUpdateDelegacion, useDeleteDelegacion } from '@/hooks/useDelegaciones';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import type { Delegacion } from '@/types/database';

export default function DelegacionesPage() {
  const { data: delegaciones, isLoading } = useDelegaciones();
  const createDelegacion = useCreateDelegacion();
  const updateDelegacion = useUpdateDelegacion();
  const deleteDelegacion = useDeleteDelegacion();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Delegacion | null>(null);
  const [nombre, setNombre] = useState('');

  function openCreate() {
    setEditing(null);
    setNombre('');
    setOpen(true);
  }

  function openEdit(d: Delegacion) {
    setEditing(d);
    setNombre(d.nombre);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateDelegacion.mutateAsync({ id: editing.id, data: { nombre } });
        toast('Delegación actualizada', { variant: 'success' });
      } else {
        await createDelegacion.mutateAsync({ nombre });
        toast('Delegación creada', { variant: 'success' });
      }
      setOpen(false);
    } catch (err) {
      toast('Error', { description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  }

  async function handleDelete(d: Delegacion) {
    if (!confirm(`¿Eliminar la delegación "${d.nombre}"?`)) return;
    try {
      await deleteDelegacion.mutateAsync(d.id);
      toast('Delegación eliminada', { variant: 'success' });
    } catch {
      toast('No se pudo eliminar', { description: 'Tiene usuarios o albaranes asociados.', variant: 'error' });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delegaciones</h1>
          <p className="text-muted-foreground text-sm">{delegaciones?.length ?? 0} delegaciones de la red</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Nueva delegación</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar delegación' : 'Nueva delegación'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" placeholder="Madrid, Murcia, Valencia…" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createDelegacion.isPending || updateDelegacion.isPending}>Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Cargando…</TableCell></TableRow>}
            {!isLoading && delegaciones?.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                <MapPin className="size-8 mx-auto mb-2 opacity-40" />
                No hay delegaciones todavía.
              </TableCell></TableRow>
            )}
            {delegaciones?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.nombre}</TableCell>
                <TableCell>
                  <Badge variant={d.activo ? 'default' : 'secondary'}>{d.activo ? 'Activa' : 'Inactiva'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d)}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
