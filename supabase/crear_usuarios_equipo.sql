-- ============================================================================
-- Crear los usuarios del equipo Silvestre (ejemplos) — GS AUTOBAT
-- ============================================================================
-- Bloque atómico, sin SELECT final (evita rollback del editor).
-- Contraseña para TODOS: Demo1234
--
--   OFI-01  Juan Aguilera      (oficina)   — encargado de reparto
--   OFI-02  Carlos             (oficina)   — sustituto de Juan
--   OFI-03  Campillo           (oficina)
--   OFI-04  Call Center        (oficina)
--   REP-01  Repartidor Uno     (repartidor)
--   REP-02  Repartidor Dos     (repartidor)
--
-- Emails: alias "+codigo" sobre el Gmail real (oussamaamah), validados por
-- Supabase y sin envío de correo (creados ya confirmados).
-- Ajusta nombres/contraseñas luego desde Administración → Usuarios.
-- ============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_base text := 'oussamaamah';   -- parte local del Gmail
  v_pass text := 'Demo1234';
  v_id uuid;
  v_email text;
  rec record;
begin
  for rec in
    select * from (values
      ('ofi01', 'oficina',    'OFI-01', 'Juan Aguilera'),
      ('ofi02', 'oficina',    'OFI-02', 'Carlos'),
      ('ofi03', 'oficina',    'OFI-03', 'Campillo'),
      ('ofi04', 'oficina',    'OFI-04', 'Call Center'),
      ('rep01', 'repartidor', 'REP-01', 'Repartidor Uno'),
      ('rep02', 'repartidor', 'REP-02', 'Repartidor Dos')
    ) as t(sufijo, rol, codigo, nombre)
  loop
    v_email := v_base || '+' || rec.sufijo || '@gmail.com';
    if exists (select 1 from auth.users where email = v_email) then
      continue;  -- ya existe, no duplicar
    end if;
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_email, crypt(v_pass, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nombre', rec.nombre),
      '', '', '', '', false, false
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_id, v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', v_email),
      'email', now(), now(), now()
    );

    -- El trigger ya creó un perfil; lo completamos con rol/código/nombre
    update public.profiles
    set rol = rec.rol::user_role, codigo = rec.codigo, nombre = rec.nombre
    where id = v_id;
  end loop;
end $$;
