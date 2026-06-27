-- Arregla la ÚNICA cuenta existente para que coincida con el esquema de login
-- por código (codigoToEmail) y le asigna una contraseña conocida.

update auth.users
set
  email = 'oussamaamah+admin01@gmail.com',
  encrypted_password = crypt('Demo#2026!', gen_salt('bf')),
  email_confirmed_at = now()
where id = '037e5724-e2d2-4a92-bb07-9636e5466c45';

update auth.identities
set identity_data = jsonb_set(identity_data, '{email}', '"oussamaamah+admin01@gmail.com"')
where user_id = '037e5724-e2d2-4a92-bb07-9636e5466c45';

update public.profiles
set codigo = 'ADMIN-01', rol = 'admin', activo = true
where id = '037e5724-e2d2-4a92-bb07-9636e5466c45';
