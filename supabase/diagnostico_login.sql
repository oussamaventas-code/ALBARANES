-- Diagnóstico: comprueba si el usuario existe y si el hash de la contraseña
-- coincide con 'Demo#2026!' usando la misma función crypt() de Postgres.

select
  id,
  email,
  aud,
  role,
  email_confirmed_at is not null as confirmado,
  encrypted_password is not null and encrypted_password <> '' as tiene_password,
  (encrypted_password = crypt('Demo#2026!', encrypted_password)) as password_coincide,
  banned_until,
  deleted_at
from auth.users
where email = 'oussamaaamahm+admin01@gmail.com';

-- También comprueba que existe la identidad asociada (necesaria para el login)
select i.provider, i.user_id, u.email
from auth.identities i
join auth.users u on u.id = i.user_id
where u.email = 'oussamaaamahm+admin01@gmail.com';
