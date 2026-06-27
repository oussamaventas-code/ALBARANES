/**
 * Cliente de Supabase — singleton compartido por toda la aplicación
 *
 * Requiere las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
 * definidas en el archivo .env del proyecto.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación temprana: si faltan las variables, el error se lanza al cargar el módulo
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. ' +
    'Asegúrate de tener un archivo .env con ambas variables configuradas.'
  );
}

/** Instancia única del cliente de Supabase para toda la app */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
