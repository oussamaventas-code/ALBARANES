-- ============================================================================
-- FIX RLS: permitir que cada usuario lea SU PROPIO perfil
-- ============================================================================
-- El login funciona, pero la app no podía leer el perfil del usuario tras
-- autenticarse (las políticas dependían de is_admin()/get_user_role()).
-- Esta política directa compara id = auth.uid() sin funciones intermedias,
-- garantizando que getCurrentProfile() siempre obtenga el perfil propio.
-- ============================================================================

drop policy if exists profiles_select_self on public.profiles;

create policy profiles_select_self on public.profiles
  for select
  using (id = (select auth.uid()));
