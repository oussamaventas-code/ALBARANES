-- Estado real (el SQL Editor usa rol postgres y NO aplica RLS)
select u.id as user_id, u.email, p.id as profile_id, p.codigo, p.rol, p.activo
from auth.users u
left join public.profiles p on p.id = u.id;
