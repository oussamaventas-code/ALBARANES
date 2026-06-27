-- ============================================================================
-- Delegaciones reales de Grupo Silvestre / GS AUTOBAT
-- ============================================================================
-- Extraídas del listado oficial de delegaciones (capturas del 27-jun-2026).
-- Formato "Ciudad (Provincia)" para evitar nombres duplicados.
-- "Espinardo (Central)" es la sede central, distinta de la delegación
-- "Murcia (Murcia)".
-- ============================================================================

insert into public.delegaciones (nombre) values
  -- Andalucía
  ('Huércal de Almería (Almería)'),
  ('Córdoba (Córdoba)'),
  ('Jerez de la Frontera (Cádiz)'),
  ('Granada (Granada)'),
  ('Huelva (Huelva)'),
  ('Jaén (Jaén)'),
  ('Málaga (Málaga)'),
  ('Sevilla (Sevilla)'),
  ('Palomares del Aljarafe (Sevilla)'),
  -- Aragón
  ('Zaragoza (Aragón)'),
  -- Castilla La Mancha
  ('Albacete (Albacete)'),
  ('Ciudad Real (Ciudad Real)'),
  -- Castilla y León
  ('Salamanca (Salamanca)'),
  ('Valladolid (Valladolid)'),
  -- Cataluña
  ('Barcelona (Barcelona)'),
  ('Hospitalet de Llobregat (Barcelona)'),
  ('Barberà del Vallès (Barcelona)'),
  ('Lleida (Lleida)'),
  ('Tarragona (Tarragona)'),
  -- Comunidad Valenciana
  ('Alicante (Alicante)'),
  ('Elche (Alicante)'),
  ('Orihuela (Alicante)'),
  ('Valencia (Valencia)'),
  -- Madrid
  ('Alcobendas (Madrid)'),
  ('Humanes (Madrid)'),
  ('Madrid (Madrid)'),
  ('San Fernando de Henares (Madrid)'),
  -- Murcia
  ('Cartagena (Murcia)'),
  ('Lorca (Murcia)'),
  ('Murcia (Murcia)'),
  -- Central
  ('Espinardo (Central)')
on conflict (nombre) do nothing;
