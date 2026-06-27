/**
 * Administración de talleres — GS AUTOBAT
 *
 * CRUD completo de talleres (puntos de entrega de cada cliente).
 */
import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { useTalleres, useCreateTaller, useUpdateTaller, useDeleteTaller } from '@/hooks/useTalleres';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import type { Taller, TallerFormData } from '@/types/database';

const EMPTY_FORM: TallerFormData = { nombre: '', cliente_id: '', direccion: '', telefono: '', contacto: '' };

export default function TalleresPage() {
  const { data: clientes } = useClientes();
  const { data: talleres, isLoading } = useTalleres();
  const createTaller = useCreateTaller();
  const updateTaller = useUpdateTaller();
  const deleteTaller = useDeleteTaller();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Taller | null>(null);
  const [form, setForm] = useState<TallerFormData>(EMPTY_FORM);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(taller: Taller) {
    setEditing(taller);
    setForm({
      nombre: taller.nombre,
      cliente_id: taller.cliente_id,
      direccion: taller.direccion ?? '',
      telefono: taller.telefono ?? '',
      contacto: taller.contacto ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateTaller.mutateAsync({ id: editing.id, data: form });
        toast('Taller actualizado', { variant: 'success' });
      } else {
        await createTaller.mutateAsync(form);
        toast('Taller creado', { variant: 'success' });
      }
      setOpen(false);
    } catch (err) {
      toast('Error', { description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  }

  async function handleDelete(taller: Taller) {
    if (!confirm(`¿Eliminar el taller "${taller.nombre}"?`)) return;
    try {
      await deleteTaller.mutateAsync(taller.id);
      toast('Taller eliminado', { variant: 'success' });
    } catch {
      toast('No se pudo eliminar', { description: 'Es posible que tenga albaranes asociados.', variant: 'error' });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Talleres</h1>
          <p className="text-muted-foreground text-sm">{talleres?.length ?? 0} talleres registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Nuevo taller</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar taller' : 'Nuevo taller'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contacto">Contacto</Label>
                <Input id="contacto" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={!form.cliente_id || createTaller.isPending || updateTaller.isPending}>Guardar</Button>
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
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Cargando…</TableCell></TableRow>}
            {!isLoading && talleres?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                <Wrench className="size-8 mx-auto mb-2 opacity-40" />
                No hay talleres todavía.
              </TableCell></TableRow>
            )}
            {talleres?.map((taller) => (
              <TableRow key={taller.id}>
                <TableCell className="font-medium">{taller.nombre}</TableCell>
                <TableCell>{taller.cliente?.nombre}</TableCell>
                <TableCell>{taller.contacto || '—'}</TableCell>
                <TableCell>
                  <Badge variant={taller.activo ? 'default' : 'secondary'}>{taller.activo ? 'Activo' : 'Inactivo'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(taller)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(taller)}><Trash2 className="size-4 text-destructive" /></Button>
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
