-- ============================================================================
-- GS AUTOBAT - Albaranes Inteligentes
-- Usuarios de demo creados directamente vía SQL (sin pasar por el Dashboard)
-- ============================================================================
-- Crea 4 usuarios falsos directamente en auth.users + auth.identities,
-- y ajusta su perfil (rol, código, nombre) en public.profiles.
--
-- Contraseña para TODOS: Demo#2026!
--
-- Códigos de acceso:
--   ADMIN-01  → Administrador Demo   (rol: admin)
--   OFI-01    → Oficina Demo          (rol: oficina)
--   REP-01    → Juan Repartidor       (rol: repartidor)
--   REP-02    → María Repartidora     (rol: repartidor)
--
-- Los emails usan el alias "+codigo" sobre un Gmail real para cumplir la
-- validación de dominio de Supabase Auth (ver codigoToEmail en lib/utils.ts).
-- Cambia 'oussamaaamahm' por la parte local de tu propio Gmail si es distinto.
-- ============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_base text := 'oussamaaamahm';      -- ⚠️ cambia esto si tu Gmail es otro
  v_domain text := 'gmail.com';
  v_password text := 'Demo#2026!';
  v_id uuid;
  v_email text;
  rec record;
begin
  for rec in
    select * from (values
      ('admin01', 'admin',      'ADMIN-01', 'Administrador Demo'),
      ('ofi01',   'oficina',    'OFI-01',   'Oficina Demo'),
      ('rep01',   'repartidor', 'REP-01',   'Juan Repartidor'),
      ('rep02',   'repartidor', 'REP-02',   'María Repartidora')
    ) as t(sufijo, rol, codigo, nombre)
  loop
    v_email := v_base || '+' || rec.sufijo || '@' || v_domain;
    v_id := gen_random_uuid();

    -- Evitar duplicados si el script se ejecuta más de una vez
    if exists (select 1 from auth.users where email = v_email) then
      continue;
    end if;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nombre', rec.nombre),
      '', '', '', '',
      false, false
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', now(), now(), now()
    );

    -- El trigger on_auth_user_created ya generó el perfil; lo completamos
    update public.profiles
    set rol = rec.rol::user_role, codigo = rec.codigo, nombre = rec.nombre
    where id = v_id;
  end loop;
end $$;

-- Verificación rápida
select codigo, nombre, rol, email, activo from public.profiles order by rol, codigo;
