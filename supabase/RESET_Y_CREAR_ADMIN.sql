-- ============================================================================
-- RESET TOTAL DE USUARIOS + CREAR ADMIN LIMPIO
-- ============================================================================
-- Borra TODOS los usuarios y crea uno solo: el administrador.
-- Todo en un único bloque atómico: o se hace entero, o no se hace nada.
-- NO lleva ningún SELECT al final (eso era lo que rompía la ejecución).
--
-- Credenciales resultantes para entrar en la app:
--   Código de usuario: ADMIN-01
--   Contraseña:        Demo1234
-- ============================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := 'oussamaamah+admin01@gmail.com';
  v_pass  text := 'Demo1234';
begin
  -- 1. Borrar todo lo existente (perfiles caen en cascada al borrar auth.users)
  delete from auth.users;
  delete from public.profiles;  -- por si quedó algún perfil huérfano

  -- 2. Crear el usuario en auth.users con contraseña bcrypt
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
    '{"nombre":"Administrador Demo"}',
    '', '', '', '',
    false, false
  );

  -- 3. Crear la identidad asociada (obligatoria para que el login funcione)
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  -- 4. Crear/ajustar el perfil con rol admin
  --    (el trigger handle_new_user pudo crear uno; lo forzamos con upsert)
  insert into public.profiles (id, nombre, email, rol, codigo, activo)
  values (v_id, 'Administrador Demo', v_email, 'admin', 'ADMIN-01', true)
  on conflict (id) do update
    set rol = 'admin', codigo = 'ADMIN-01', nombre = 'Administrador Demo', activo = true;
end $$;
