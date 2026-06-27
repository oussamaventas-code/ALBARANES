-- ============================================================================
-- Asignación del piloto: Espinardo (Central) — GS AUTOBAT
-- ============================================================================
-- Durante el piloto, Juan Aguilera (OFI-01), Carlos (OFI-02), Campillo
-- (OFI-03) y Call Center (OFI-04) deben ver SOLO los albaranes de la
-- delegación "Espinardo (Central)", no el resto. Se les quita el alcance
-- nacional asignándoles esa delegación.
--
-- Requiere haber ejecutado antes add_delegaciones.sql y
-- seed_delegaciones_reales.sql (la delegación "Espinardo (Central)" debe
-- existir ya).
-- ============================================================================

do $$
declare
  v_delegacion_id uuid;
begin
  select id into v_delegacion_id from public.delegaciones where nombre = 'Espinardo (Central)';

  if v_delegacion_id is null then
    raise exception 'No existe la delegación "Espinardo (Central)". Ejecuta primero seed_delegaciones_reales.sql';
  end if;

  update public.profiles
  set delegacion_id = v_delegacion_id
  where codigo in ('OFI-01', 'OFI-02', 'OFI-03', 'OFI-04');
end $$;
