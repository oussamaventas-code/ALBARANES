-- Limpia cualquier usuario/perfil previo que choque con los códigos de demo
-- (ADMIN-01, OFI-01, REP-01, REP-02) antes de volver a ejecutar seed_usuarios_demo.sql.
-- Al borrar de auth.users, el perfil se elimina en cascada (FK ON DELETE CASCADE).

delete from auth.users
where id in (
  select id from public.profiles
  where codigo in ('ADMIN-01', 'OFI-01', 'REP-01', 'REP-02')
);

-- Verifica que ya no quedan filas con esos códigos
select codigo, nombre, rol, email from public.profiles
where codigo in ('ADMIN-01', 'OFI-01', 'REP-01', 'REP-02');
