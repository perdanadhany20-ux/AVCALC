-- Hardening hasil audit.
-- 1) logo_path wajib berada di folder milik user sendiri. Sebelumnya hanya dicek di server action,
--    padahal user bisa meng-update kolom ini langsung lewat PostgREST. Halaman share (service role)
--    lalu akan menandatangani URL logo milik user lain.
alter table public.profiles add constraint profiles_logo_path_own
  check (logo_path is null or logo_path ~ ('^' || id::text || '/[A-Za-z0-9._-]+$'));

-- 2) Fungsi bantu: Postgres memberi EXECUTE ke PUBLIC secara default, jadi revoke dari anon saja
--    tidak cukup. Cabut dari PUBLIC dan anon, beri eksplisit ke authenticated (dipakai policy RLS).
revoke execute on function public.is_pro(uuid), public.owns_project(uuid), public.owns_room(uuid) from public, anon;
grant execute on function public.is_pro(uuid), public.owns_project(uuid), public.owns_room(uuid) to authenticated;
