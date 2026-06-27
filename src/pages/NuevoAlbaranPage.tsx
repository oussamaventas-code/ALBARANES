/**
 * Página de creación de albarán — GS AUTOBAT
 *
 * Diseñada para que un repartidor complete el registro en pocos segundos:
 * foto/PDF + número + cliente/taller + guardar. El formulario se reinicia
 * tras cada guardado para encadenar varios registros rápidamente.
 */
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileUp, Loader2, X, ImageIcon, FileText as FileIcon, Sparkles } from 'lucide-react';
import { useCreateAlbaran } from '@/hooks/useAlbaranes';
import { useToast } from '@/contexts/ToastContext';
import { extraerDatosAlbaran } from '@/services/ocr.service';
import { getClienteByCodigoExterno } from '@/services/clientes.service';
import { ClienteCombobox } from '@/components/ClienteCombobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { hoy } from '@/lib/utils';

export default function NuevoAlbaranPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createAlbaran = useCreateAlbaran();

  const [numero, setNumero] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [observaciones, setObservaciones] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // Estado del OCR: idle | reconociendo (con progreso 0–1) | terminado
  const [ocrEstado, setOcrEstado] = useState<'idle' | 'leyendo' | 'ok' | 'sin-resultado'>('idle');
  const [ocrProgreso, setOcrProgreso] = useState(0);
  // Código de cliente leído del documento, cuando no coincide con ningún cliente
  const [codClienteDetectado, setCodClienteDetectado] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(selected: File | undefined) {
    if (!selected) return;
    setFile(selected);
    if (selected.type === 'application/pdf') {
      setPreview(null);
    } else {
      setPreview(URL.createObjectURL(selected));
    }
    void ejecutarOcr(selected);
  }

  /**
   * Lanza el OCR sobre el documento y, si encuentra un número, autorrellena
   * el campo "Número de albarán". No bloquea: el repartidor puede seguir
   * rellenando el formulario mientras se procesa.
   */
  async function ejecutarOcr(selected: File) {
    setOcrEstado('leyendo');
    setOcrProgreso(0);
    setCodClienteDetectado(null);
    try {
      const { numero: detectado, codCliente, fecha: fechaDetectada } = await extraerDatosAlbaran(selected, setOcrProgreso);

      if (detectado) setNumero(detectado);
      if (fechaDetectada) setFecha(fechaDetectada);

      // Intentar autoseleccionar el cliente por su código externo (del proveedor)
      let clienteAuto: string | null = null;
      if (codCliente) {
        setCodClienteDetectado(codCliente);
        try {
          const match = await getClienteByCodigoExterno(codCliente);
          if (match) {
            setClienteId(match.id);
            setClienteNombre(match.nombre);
            clienteAuto = match.nombre;
            setCodClienteDetectado(null);
          }
        } catch {
          // Si la búsqueda falla, dejamos el código detectado como aviso
        }
      }

      if (detectado || clienteAuto) {
        setOcrEstado('ok');
        const partes = [
          detectado ? `Nº ${detectado}` : null,
          clienteAuto ? `Cliente: ${clienteAuto}` : null,
        ].filter(Boolean).join(' · ');
        toast('Datos detectados', { description: `${partes}. Revísalos por si acaso.`, variant: 'success' });
      } else {
        setOcrEstado('sin-resultado');
      }
    } catch {
      setOcrEstado('sin-resultado');
    }
  }

  function resetForm() {
    setNumero('');
    setClienteId('');
    setClienteNombre('');
    setFecha(hoy());
    setObservaciones('');
    setFile(null);
    setPreview(null);
    setOcrEstado('idle');
    setOcrProgreso(0);
    setCodClienteDetectado(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      toast('Falta el documento', { description: 'Haz una foto o sube un PDF del albarán.', variant: 'error' });
      return;
    }
    if (!clienteId) {
      toast('Falta el cliente', { description: 'Busca y selecciona el cliente.', variant: 'error' });
      return;
    }

    try {
      await createAlbaran.mutateAsync({
        formData: { numero, cliente_id: clienteId, fecha, observaciones },
        file,
        clienteNombre,
      });
      toast('Albarán guardado', { description: `Nº ${numero} registrado correctamente.`, variant: 'success' });
      resetForm();
    } catch (err) {
      toast('Error al guardar', { description: err instanceof Error ? err.message : 'Inténtalo de nuevo.', variant: 'error' });
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Nuevo albarán</h1>
        <p className="text-muted-foreground text-sm">Escanea o sube el documento y rellena los datos básicos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Captura de documento */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {!file && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 py-8 text-primary hover:bg-primary/10 transition-colors"
                >
                  <Camera className="size-7" />
                  <span className="text-sm font-medium">Hacer foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-8 text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <FileUp className="size-7" />
                  <span className="text-sm font-medium">Subir PDF</span>
                </button>
              </div>
            )}

            {file && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                {preview ? (
                  <img src={preview} alt="Vista previa" className="size-16 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="size-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <FileIcon className="size-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5">
                    {preview ? <ImageIcon className="size-3.5 shrink-0" /> : null}
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => { setFile(null); setPreview(null); setOcrEstado('idle'); }}>
                  <X className="size-4" />
                </Button>
              </div>
            )}

            {/* Indicador de OCR */}
            {ocrEstado === 'leyendo' && (
              <div className="space-y-1.5">
                <p className="text-xs text-primary flex items-center gap-1.5">
                  <Sparkles className="size-3.5 animate-pulse-soft" />
                  Leyendo el documento… {Math.round(ocrProgreso * 100)}%
                </p>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${ocrProgreso * 100}%` }} />
                </div>
              </div>
            )}
            {ocrEstado === 'sin-resultado' && (
              <p className="text-xs text-muted-foreground">No se pudo leer el número automáticamente. Escríbelo a mano.</p>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
          </CardContent>
        </Card>

        {/* Datos del albarán */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="numero" className="flex items-center gap-1.5">
                Número de albarán
                {ocrEstado === 'ok' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-primary">
                    <Sparkles className="size-3" /> detectado
                  </span>
                )}
              </Label>
              <Input
                id="numero"
                placeholder="ESPAV261036739"
                value={numero}
                onChange={(e) => { setNumero(e.target.value); if (ocrEstado === 'ok') setOcrEstado('idle'); }}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Cliente
                {clienteId && ocrEstado === 'ok' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-primary">
                    <Sparkles className="size-3" /> detectado
                  </span>
                )}
              </Label>
              <ClienteCombobox
                value={clienteId}
                selectedNombre={clienteNombre}
                onSelect={(id, nombre) => { setClienteId(id); setClienteNombre(nombre); setCodClienteDetectado(null); }}
              />
              {codClienteDetectado && !clienteId && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Código detectado: <strong>{codClienteDetectado}</strong> — no coincide con ningún cliente. Búscalo a mano o añade ese código en Administración → Clientes.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Textarea
                id="observaciones"
                placeholder="Incidencias, notas para oficina…"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={createAlbaran.isPending}>
            {createAlbaran.isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </div>
  );
}
