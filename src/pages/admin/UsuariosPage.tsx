/**
 * Administración de usuarios — GS AUTOBAT (solo admin)
 *
 * Permite crear repartidores/oficina/admin, gestionar su rol, estado y
 * delegación. Para admin/oficina, "Nacional" (sin delegación) significa que
 * ve todas las delegaciones; si se asigna una delegación concreta, ese
 * usuario solo verá los datos de la suya.
 */
import { useState, type FormEvent } from 'react';
import { Plus, Pencil, UserX } from 'lucide-react';
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDesactivarUsuario } from '@/hooks/useUsuarios';
import { useDelegaciones } from '@/hooks/useDelegaciones';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ROL_CONFIG } from '@/lib/utils';
import type { UserRole } from '@/types/database';
import type { ProfileWithDelegacion } from '@/services/usuarios.service';

const NACIONAL = 'nacional';

interface CreateForm {
  nombre: string;
  codigo: string;
  rol: UserRole;
  password: string;
  email: string;
  delegacion_id: string;
}

interface EditForm {
  nombre: string;
  codigo: string;
  rol: UserRole;
  delegacion_id: string;
}

const EMPTY_CREATE: CreateForm = { nombre: '', codigo: '', rol: 'repartidor', password: '', email: '', delegacion_id: '' };

export default function UsuariosPage() {
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: delegaciones } = useDelegaciones();
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const desactivar = useDesactivarUsuario();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileWithDelegacion | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: '', codigo: '', rol: 'repartidor', delegacion_id: '' });

  function openCreate() {
    setEditing(null);
    setCreateForm(EMPTY_CREATE);
    setOpen(true);
  }

  function openEdit(usuario: ProfileWithDelegacion) {
    setEditing(usuario);
    setEditForm({
      nombre: usuario.nombre,
      codigo: usuario.codigo,
      rol: usuario.rol,
      delegacion_id: usuario.delegacion_id || '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateUsuario.mutateAsync({
          id: editing.id,
          data: { ...editForm, delegacion_id: editForm.delegacion_id || null },
        });
        toast('Usuario actualizado', { variant: 'success' });
      } else {
        await createUsuario.mutateAsync({
          ...createForm,
          delegacion_id: createForm.delegacion_id || null,
        });
        toast('Usuario creado', { variant: 'success' });
      }
      setOpen(false);
    } catch (err) {
      toast('Error', { description: err instanceof Error ? err.message : undefined, variant: 'error' });
    }
  }

  async function handleDesactivar(usuario: ProfileWithDelegacion) {
    if (!confirm(`¿Desactivar a "${usuario.nombre}"? No podrá iniciar sesión.`)) return;
    await desactivar.mutateAsync(usuario.id);
    toast('Usuario desactivado', { variant: 'success' });
  }

  /** Selector de delegación: para repartidor es obligatoria; para admin/oficina, vacío = nacional */
  function DelegacionSelect({ value, onChange, rol }: { value: string; onChange: (v: string) => void; rol: UserRole }) {
    const esRepartidor = rol === 'repartidor';
    return (
      <div className="space-y-1.5">
        <Label>Delegación</Label>
        <Select value={value || NACIONAL} onValueChange={(v) => onChange(v === NACIONAL ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
          <SelectContent>
            {!esRepartidor && <SelectItem value={NACIONAL}>Nacional (ve todas)</SelectItem>}
            {delegaciones?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {esRepartidor && (
          <p className="text-xs text-muted-foreground">Un repartidor siempre pertenece a una delegación.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm">{usuarios?.length ?? 0} usuarios del sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Nuevo usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {editing ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-nombre">Nombre</Label>
                    <Input id="e-nombre" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} required autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-codigo">Código</Label>
                    <Input id="e-codigo" value={editForm.codigo} onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Select value={editForm.rol} onValueChange={(v) => setEditForm({ ...editForm, rol: v as UserRole })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="repartidor">Repartidor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DelegacionSelect value={editForm.delegacion_id} onChange={(v) => setEditForm({ ...editForm, delegacion_id: v })} rol={editForm.rol} />
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-nombre">Nombre completo</Label>
                    <Input id="c-nombre" value={createForm.nombre} onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })} required autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-codigo">Código de acceso</Label>
                    <Input id="c-codigo" placeholder="REP-005" value={createForm.codigo} onChange={(e) => setCreateForm({ ...createForm, codigo: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-password">Contraseña</Label>
                    <Input id="c-password" type="password" minLength={6} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email">Email (opcional)</Label>
                    <Input id="c-email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Select value={createForm.rol} onValueChange={(v) => setCreateForm({ ...createForm, rol: v as UserRole })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="repartidor">Repartidor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DelegacionSelect value={createForm.delegacion_id} onChange={(v) => setCreateForm({ ...createForm, delegacion_id: v })} rol={createForm.rol} />
                </>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createUsuario.isPending || updateUsuario.isPending}>Guardar</Button>
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
              <TableHead>Código</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Delegación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Cargando…</TableCell></TableRow>}
            {usuarios?.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nombre}</TableCell>
                <TableCell>{usuario.codigo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={ROL_CONFIG[usuario.rol].color}>{ROL_CONFIG[usuario.rol].label}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {usuario.delegacion?.nombre ?? (usuario.rol === 'repartidor' ? '—' : 'Nacional')}
                </TableCell>
                <TableCell>
                  <Badge variant={usuario.activo ? 'default' : 'secondary'}>{usuario.activo ? 'Activo' : 'Inactivo'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(usuario)}><Pencil className="size-4" /></Button>
                    {usuario.activo && (
                      <Button variant="ghost" size="icon" onClick={() => handleDesactivar(usuario)}><UserX className="size-4 text-destructive" /></Button>
                    )}
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
