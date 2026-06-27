/**
 * Administración de clientes — GS AUTOBAT
 *
 * CRUD completo de clientes (empresas que reciben albaranes).
 */
import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/hooks/useClientes';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import type { Cliente, ClienteFormData } from '@/types/database';

const EMPTY_FORM: ClienteFormData = { nombre: '', cif: '', telefono: '', direccion: '', email: '', codigo_externo: '' };

export default function ClientesPage() {
  const { data: clientes, isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteFormData>(EMPTY_FORM);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setForm({
      nombre: cliente.nombre,
      cif: cliente.cif ?? '',
      telefono: cliente.telefono ?? '',
      direccion: cliente.direccion ?? '',
      email: cliente.email ?? '',
      codigo_externo: cliente.codigo_externo ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateCliente.mutateAsync({ id: editing.id, data: form });
        toast('Cliente actualizado', { variant: 'success' });
      } else {
        await createCliente.mutateAsync(form);
        toast('Cliente creado', { variant: 'success' });
      }
      setOpen(false);
    } catch (err) {
      toast('Error', { description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  }

  async function handleDelete(cliente: Cliente) {
    if (!confirm(`¿Eliminar el cliente "${cliente.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteCliente.mutateAsync(cliente.id);
      toast('Cliente eliminado', { variant: 'success' });
    } catch {
      toast('No se pudo eliminar', { description: 'Es posible que tenga talleres o albaranes asociados.', variant: 'error' });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">{clientes?.length ?? 0} clientes registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Nuevo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cif">CIF / NIF</Label>
                <Input id="cif" value={form.cif} onChange={(e) => setForm({ ...form, cif: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="codigo_externo">Código de cliente (OCR)</Label>
                <Input
                  id="codigo_externo"
                  placeholder="C00022615"
                  value={form.codigo_externo}
                  onChange={(e) => setForm({ ...form, codigo_externo: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Código del albarán del proveedor. Si coincide, el cliente se autoselecciona al escanear.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createCliente.isPending || updateCliente.isPending}>Guardar</Button>
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
              <TableHead>CIF</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Cargando…</TableCell></TableRow>}
            {!isLoading && clientes?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                <Building2 className="size-8 mx-auto mb-2 opacity-40" />
                No hay clientes todavía.
              </TableCell></TableRow>
            )}
            {clientes?.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nombre}</TableCell>
                <TableCell>{cliente.cif || '—'}</TableCell>
                <TableCell>{cliente.telefono || '—'}</TableCell>
                <TableCell>
                  <Badge variant={cliente.activo ? 'default' : 'secondary'}>{cliente.activo ? 'Activo' : 'Inactivo'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cliente)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente)}><Trash2 className="size-4 text-destructive" /></Button>
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
