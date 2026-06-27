select u.id, u.email, p.codigo, p.rol
from public.profiles p
join auth.users u on u.id = p.id
where p.id = '037e5724-e2d2-4a92-bb07-9636e5466c45';
