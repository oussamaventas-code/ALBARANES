/**
 * Servicio de OCR para GS AUTOBAT - Albaranes Inteligentes
 *
 * Extrae texto de la foto o PDF del albarán usando Tesseract.js (100% en el
 * navegador, sin servidor ni claves API) y deduce los campos clave para
 * autorrellenar el formulario: número de albarán, código de cliente y fecha.
 *
 * - Imágenes (JPG/PNG): se pasan directamente a Tesseract.
 * - PDF: se renderiza la primera página a un canvas con pdf.js y se hace OCR
 *   sobre esa imagen.
 *
 * Ajustado al formato de los albaranes de SILVESTRE AUTO PARTS, donde la
 * referencia única tiene forma de prefijo de letras + dígitos (ej:
 * "ESPAV261036739") y el código de cliente empieza por "C" (ej: "C00022615").
 */
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
// El worker de pdf.js se importa como URL para que Vite lo empaquete bien.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Resultado del OCR: texto completo + campos deducidos del albarán */
export interface OcrResult {
  texto: string;
  /** Referencia única del albarán (ej: "ESPAV261036739") */
  numero: string | null;
  /** Código de cliente del proveedor (ej: "C00022615") */
  codCliente: string | null;
  /** Fecha detectada en formato YYYY-MM-DD (ej: "2026-06-26") */
  fecha: string | null;
}

/**
 * Renderiza la primera página de un PDF a un canvas y devuelve un dataURL PNG.
 * Se escala a un ancho objetivo para que el OCR tenga suficiente resolución.
 */
async function pdfPrimeraPaginaADataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);

  // Escalar para obtener ~1500px de ancho (buen equilibrio nitidez/rendimiento)
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(3, 1500 / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d')!;

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/png');
}

/**
 * Deduce el NÚMERO de albarán (referencia única) del texto reconocido.
 * Estrategia, de más fiable a menos:
 *   1. Código alfanumérico entre paréntesis: "(ESPAV261036739)".
 *   2. Token con 3-6 letras seguidas de 6+ dígitos (excluye el cód. cliente "C...").
 *   3. Tras una etiqueta "Albarán/Nº/Número ...".
 *   4. Fallback: secuencia de dígitos más larga (>= 5 cifras).
 */
function deducirNumero(texto: string): string | null {
  const t = texto.replace(/\s+/g, ' ');

  const parentesis = t.match(/\(\s*([A-Z]{2,6}\d{6,})\s*\)/i);
  if (parentesis) return parentesis[1].toUpperCase();

  const refs = [...t.matchAll(/\b([A-Z]{3,6}\d{6,})\b/gi)].map((m) => m[1].toUpperCase());
  const refValida = refs.find((r) => !/^C0*\d+$/.test(r));
  if (refValida) return refValida;

  const etiqueta = t.match(/(?:albar[aá]n|n[º°o.]{0,3}|n[uú]mero)\s*[:#-]?\s*([A-Z0-9][A-Z0-9.\-/]{4,})/i);
  if (etiqueta) return etiqueta[1].replace(/[.\-/]/g, '').toUpperCase();

  const secuencias = t.match(/\d{5,}/g);
  if (secuencias?.length) return secuencias.sort((a, b) => b.length - a.length)[0];

  return null;
}

/** Deduce el CÓDIGO DE CLIENTE del proveedor (formato "C" + dígitos, ej "C00022615"). */
function deducirCodCliente(texto: string): string | null {
  const m = texto.match(/\bC0*\d{4,}\b/i);
  return m ? m[0].toUpperCase() : null;
}

/** Deduce la FECHA (dd/mm/yy o dd/mm/yyyy) y la devuelve como YYYY-MM-DD. */
function deducirFecha(texto: string): string | null {
  const m = texto.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (!m) return null;
  const dia = m[1].padStart(2, '0');
  const mes = m[2].padStart(2, '0');
  let anio = m[3];
  if (anio.length === 2) anio = '20' + anio;
  const d = Number(dia), mm = Number(mes);
  if (d < 1 || d > 31 || mm < 1 || mm > 12) return null;
  return `${anio}-${mes}-${dia}`;
}

/**
 * Ejecuta el OCR sobre el archivo del albarán y devuelve el texto y los campos
 * deducidos. `onProgress` recibe un valor 0–1 para mostrar progreso en la UI.
 */
export async function extraerDatosAlbaran(
  file: File,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  let imagen: string | File = file;

  if (file.type === 'application/pdf') {
    imagen = await pdfPrimeraPaginaADataUrl(file);
  }

  const { data } = await Tesseract.recognize(imagen, 'spa', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(m.progress);
    },
  });

  return {
    texto: data.text,
    numero: deducirNumero(data.text),
    codCliente: deducirCodCliente(data.text),
    fecha: deducirFecha(data.text),
  };
}
