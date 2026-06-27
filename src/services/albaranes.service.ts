/**
 * Servicio de albaranes para GS AUTOBAT - Albaranes Inteligentes
 *
 * CRUD completo de albaranes con:
 * - Listado con filtros dinámicos y paginación
 * - Detalle con relaciones expandidas
 * - Creación con subida de archivo al storage
 * - Actualización con registro en historial
 * - Eliminación con limpieza de archivo en storage
 * - Estadísticas para el dashboard
 */

import { supabase } from '@/lib/supabase';
import { generateStoragePath, getFileExtension } from '@/lib/utils';
import { uploadFile } from '@/services/storage.service';
import { registrarAccion } from '@/services/historial.service';
import type {
  Albaran,
  AlbaranWithRelations,
  AlbaranFormData,
  AlbaranFilters,
  AlbaranEstado,
  DashboardStats,
  PaginatedResponse,
} from '@/types/database';

// ─── Consulta: select base con joins ─────────────────────────────────────────

/** Select con relaciones comunes para evitar duplicación */
const ALBARAN_SELECT = `
  *,
  cliente:clientes(id, nombre),
  taller:talleres(id, nombre),
  usuario:profiles(id, nombre, codigo),
  delegacion:delegaciones(id, nombre)
`;

// ─── Listado con filtros y paginación ────────────────────────────────────────

/**
 * Obtiene albaranes con filtrado dinámico y paginación.
 * Los filtros se aplican condicionalmente solo si tienen valor.
 *
 * @param filters - Filtros opcionales (estado, cliente, usuario, fechas, búsqueda)
 * @param page - Número de página (1-indexed)
 * @param pageSize - Cantidad de registros por página
 * @returns Objeto con los datos paginados y el total de registros
 */
export async function getAlbaranes(
  filters: AlbaranFilters = {},
  page: number = 1,
  pageSize: number = 20,
  orden: 'desc' | 'asc' = 'desc'
): Promise<PaginatedResponse<AlbaranWithRelations>> {
  // Calcular rango para paginación (Supabase usa 0-indexed)
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Construir query base con conteo exacto para paginación
  let query = supabase
    .from('albaranes')
    .select(ALBARAN_SELECT, { count: 'exact' });

  // Aplicar filtros dinámicamente — solo los que tienen valor
  if (filters.estado) {
    query = query.eq('estado', filters.estado);
  }

  if (filters.cliente_id) {
    query = query.eq('cliente_id', filters.cliente_id);
  }

  if (filters.usuario_id) {
    query = query.eq('usuario_id', filters.usuario_id);
  }

  if (filters.taller_id) {
    query = query.eq('taller_id', filters.taller_id);
  }

  if (filters.delegacion_id) {
    query = query.eq('delegacion_id', filters.delegacion_id);
  }

  // Filtro por rango de fechas
  if (filters.fecha_desde) {
    query = query.gte('fecha', filters.fecha_desde);
  }

  if (filters.fecha_hasta) {
    query = query.lte('fecha', filters.fecha_hasta);
  }

  // Búsqueda por texto: busca en el número de albarán
  if (filters.search) {
    query = query.ilike('numero', `%${filters.search}%`);
  }

  // Ordenar por fecha/hora de creación (desc = más reciente primero) y paginar
  const { data, error, count } = await query
    .order('created_at', { ascending: orden === 'asc' })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data as AlbaranWithRelations[]) || [],
    count: count || 0,
  };
}

// ─── Búsqueda rápida (Call Center) ───────────────────────────────────────────

/**
 * Búsqueda en una sola caja para atención telefónica: encuentra albaranes por
 * número, o por el nombre/código del cliente, sin tener que elegir filtros.
 * Pensada para "alguien llama preguntando por un albarán" — resultado rápido.
 *
 * @param query - Texto a buscar (número de albarán, nombre o código de cliente)
 * @param fechaDesde - Filtro opcional de fecha desde
 * @param fechaHasta - Filtro opcional de fecha hasta
 */
export async function busquedaRapida(
  query: string,
  fechaDesde?: string,
  fechaHasta?: string,
  limit: number = 30
): Promise<AlbaranWithRelations[]> {
  const term = query.trim();

  let q = supabase.from('albaranes').select(ALBARAN_SELECT);

  if (term) {
    // Primero, clientes cuyo nombre o código coincide
    const { data: clientesMatch } = await supabase
      .from('clientes')
      .select('id')
      .or(`nombre.ilike.%${term}%,codigo_externo.ilike.%${term}%`)
      .limit(50);

    const clienteIds = (clientesMatch || []).map((c) => c.id);

    if (clienteIds.length > 0) {
      q = q.or(`numero.ilike.%${term}%,cliente_id.in.(${clienteIds.join(',')})`);
    } else {
      q = q.ilike('numero', `%${term}%`);
    }
  }

  if (fechaDesde) q = q.gte('fecha', fechaDesde);
  if (fechaHasta) q = q.lte('fecha', fechaHasta);

  const { data, error } = await q.order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data as AlbaranWithRelations[]) || [];
}

// ─── Detalle de un albarán ───────────────────────────────────────────────────

/**
 * Obtiene un albarán por su ID con todas las relaciones expandidas.
 * Incluye cliente, taller y usuario (repartidor).
 */
export async function getAlbaran(id: string): Promise<AlbaranWithRelations> {
  const { data, error } = await supabase
    .from('albaranes')
    .select(ALBARAN_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as AlbaranWithRelations;
}

// ─── Creación de albarán ─────────────────────────────────────────────────────

/**
 * Crea un nuevo albarán completo:
 * 1. Genera la ruta de almacenamiento organizada por año/mes/cliente
 * 2. Sube el archivo (foto/PDF) al bucket de Supabase Storage
 * 3. Inserta el registro del albarán con la URL del archivo
 * 4. Registra la acción "Albarán creado" en el historial
 *
 * @param formData - Datos del formulario del albarán
 * @param file - Archivo adjunto (foto o PDF del albarán)
 * @param clienteNombre - Nombre del cliente (para organizar la ruta de storage)
 * @returns El albarán recién creado
 */
export async function createAlbaran(
  formData: AlbaranFormData,
  file: File,
  clienteNombre: string
): Promise<Albaran> {
  // Obtener usuario actual para asignar como creador
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión para crear un albarán');

  // Se copia automáticamente la delegación del repartidor al albarán (no se
  // elige a mano): así cada albarán queda etiquetado con su delegación de origen.
  const { data: perfilCreador } = await supabase
    .from('profiles')
    .select('delegacion_id')
    .eq('id', user.id)
    .single();

  // 1. Generar ruta de almacenamiento: /2026/Junio/ClienteX/00025488.pdf
  const extension = getFileExtension(file);
  const storagePath = generateStoragePath(
    formData.fecha,
    clienteNombre,
    formData.numero,
    extension
  );

  // 2. Subir archivo al bucket (con validación de tipo y tamaño)
  // El bucket es privado: archivo_url guarda la RUTA del archivo, no una URL pública.
  // Para visualizarlo se genera una URL firmada con getSignedUrl().
  const archivoPath = await uploadFile(file, storagePath);

  // 3. Insertar el albarán en la base de datos
  const { data, error } = await supabase
    .from('albaranes')
    .insert({
      numero: formData.numero,
      cliente_id: formData.cliente_id,
      taller_id: formData.taller_id || null,
      usuario_id: user.id,
      fecha: formData.fecha,
      observaciones: formData.observaciones || null,
      archivo_url: archivoPath,
      archivo_nombre: file.name,
      estado: 'pendiente' as AlbaranEstado,
      delegacion_id: perfilCreador?.delegacion_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // 4. Registrar la creación en el historial de auditoría
  await registrarAccion(data.id, 'Albarán creado', {
    numero: formData.numero,
    cliente: clienteNombre,
    archivo: file.name,
  });

  return data as Albaran;
}

// ─── Actualización de albarán ────────────────────────────────────────────────

/**
 * Actualiza un albarán existente y registra los cambios en el historial.
 * Solo se actualizan los campos proporcionados (partial update).
 */
export async function updateAlbaran(
  id: string,
  updateData: Partial<AlbaranFormData & { estado: AlbaranEstado }>
): Promise<Albaran> {
  const { data, error } = await supabase
    .from('albaranes')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Construir descripción de los cambios para el historial
  const camposModificados = Object.keys(updateData).join(', ');
  await registrarAccion(id, `Albarán actualizado (${camposModificados})`, updateData);

  return data as Albaran;
}

// ─── Eliminación de albarán ──────────────────────────────────────────────────

/**
 * Elimina un albarán y su archivo asociado del storage.
 * Primero obtiene la URL del archivo para poder eliminarlo del bucket.
 */
export async function deleteAlbaran(id: string): Promise<void> {
  // Obtener el albarán para saber la ruta del archivo
  const { data: albaran, error: fetchError } = await supabase
    .from('albaranes')
    .select('archivo_url')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Si tiene archivo, eliminarlo del storage (archivo_url es la ruta dentro del bucket)
  if (albaran?.archivo_url) {
    const { error: removeError } = await supabase.storage.from('albaranes').remove([albaran.archivo_url]);
    if (removeError) {
      // Si falla la eliminación del archivo, continuamos con la del registro
      console.warn('No se pudo eliminar el archivo del storage:', removeError.message);
    }
  }

  // Eliminar el registro de la base de datos
  // Las entradas de historial se eliminan en cascada (FK con ON DELETE CASCADE)
  const { error } = await supabase
    .from('albaranes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Estadísticas del dashboard ──────────────────────────────────────────────

/**
 * Calcula las estadísticas generales para el panel de control:
 * - Total de albaranes
 * - Albaranes creados hoy
 * - Total de clientes activos
 * - Total de repartidores activos
 */
export async function getAlbaranStats(): Promise<DashboardStats> {
  // Fecha de hoy en formato ISO para el filtro
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyISO = hoy.toISOString();

  // Ejecutar todas las queries en paralelo para mejor rendimiento
  const [totalRes, hoyRes, clientesRes, repartidoresRes] = await Promise.all([
    // Total de albaranes
    supabase
      .from('albaranes')
      .select('*', { count: 'exact', head: true }),

    // Albaranes creados hoy
    supabase
      .from('albaranes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoyISO),

    // Total de clientes activos
    supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true),

    // Total de repartidores activos
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'repartidor')
      .eq('activo', true),
  ]);

  // Verificar errores en cualquiera de las queries
  if (totalRes.error) throw totalRes.error;
  if (hoyRes.error) throw hoyRes.error;
  if (clientesRes.error) throw clientesRes.error;
  if (repartidoresRes.error) throw repartidoresRes.error;

  return {
    totalAlbaranes: totalRes.count || 0,
    albaranesHoy: hoyRes.count || 0,
    totalClientes: clientesRes.count || 0,
    totalRepartidores: repartidoresRes.count || 0,
  };
}

// ─── Albaranes recientes ────────────────────────────────────────────────────

/**
 * Obtiene los N albaranes más recientes con relaciones expandidas.
 * Se usa en el dashboard para mostrar la actividad reciente.
 */
export async function getRecentAlbaranes(
  limit: number = 5
): Promise<AlbaranWithRelations[]> {
  const { data, error } = await supabase
    .from('albaranes')
    .select(ALBARAN_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as AlbaranWithRelations[]) || [];
}
