-- Lista completa de usuarios para ver el estado real antes de limpiar.

select id, email, email_confirmed_at is not null as confirmado, created_at
from auth.users
order by created_at;

select id, codigo, nombre, email, rol, activo
from public.profiles
order by created_at;
