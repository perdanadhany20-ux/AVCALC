-- Test RLS. Jalankan: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- User A dan B
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', '{"full_name":"User A"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', '{"full_name":"User B"}');

select is((select count(*) from public.profiles)::int, 2, 'profil dibuat otomatis saat sign up');

create or replace function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- ───── User A membuat project, ruang, kalkulasi ─────
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select lives_ok($$ insert into public.projects (id, name, client_name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Kantor A', 'Klien A') $$, 'A membuat project pertama');
select lives_ok($$ insert into public.rooms (id, project_id, name) values ('aaaaaaaa-0000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'Boardroom') $$, 'A menambah ruang');
select lives_ok($$ insert into public.calculations (room_id, calculator, input, output) values ('aaaaaaaa-0000-0000-0000-0000000000a1', 'screen', '{}', '{}') $$, 'A menyimpan kalkulasi');
select is((select count(*) from public.projects)::int, 1, 'A melihat project miliknya');

-- Batas akun gratis
select throws_ok($$ insert into public.projects (name) values ('Project kedua') $$, 'P0001', 'FREE_PROJECT_LIMIT', 'user free tidak bisa membuat project kedua');
-- Tidak bisa menaikkan plan sendiri
select throws_ok($$ update public.profiles set plan = 'pro' where id = auth.uid() $$, '42501', null, 'user tidak bisa mengubah plan sendiri');
select lives_ok($$ update public.profiles set company_name = 'PT A' where id = auth.uid() $$, 'user bisa mengubah nama perusahaan');
select lives_ok($$ update public.profiles set logo_path = '11111111-1111-1111-1111-111111111111/logo-1.png' where id = auth.uid() $$, 'user bisa memakai logo di foldernya sendiri');
select throws_ok($$ update public.profiles set logo_path = '22222222-2222-2222-2222-222222222222/logo-1.png' where id = auth.uid() $$, '23514', null, 'user tidak bisa memakai logo milik user lain');
-- Share link hanya untuk Pro
select throws_ok($$ insert into public.share_links (project_id, slug) values ('aaaaaaaa-0000-0000-0000-000000000001', 'AbCdEf1234') $$, '42501', null, 'user free tidak bisa membuat share link');

-- ───── User B tidak bisa membaca / mengubah data A ─────
select pg_temp.logout();
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is((select count(*) from public.projects)::int, 0, 'B tidak melihat project A');
select is((select count(*) from public.rooms)::int, 0, 'B tidak melihat ruang A');
select is((select count(*) from public.calculations)::int, 0, 'B tidak melihat kalkulasi A');
select is((select count(*) from public.profiles)::int, 1, 'B hanya melihat profilnya sendiri');
select throws_ok($$ insert into public.rooms (project_id, name) values ('aaaaaaaa-0000-0000-0000-000000000001', 'Susupan') $$, '42501', null, 'B tidak bisa menambah ruang ke project A');
update public.projects set name = 'Diretas' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from public.projects where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select pg_temp.logout();
select is((select name from public.projects where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Kantor A', 'update/delete oleh B tidak berpengaruh');

-- ───── Anonim tidak punya akses tabel ─────
set local role anon;
select throws_ok($$ select * from public.projects $$, '42501', null, 'anon tidak bisa membaca projects');
select throws_ok($$ select public.is_pro('11111111-1111-1111-1111-111111111111') $$, '42501', null, 'anon tidak bisa memanggil is_pro');
reset role;

-- ───── Setelah Pro: project kedua & share link diizinkan ─────
update public.profiles set plan = 'pro', pro_until = now() + interval '1 month' where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select lives_ok($$ insert into public.projects (name) values ('Project kedua') $$, 'user Pro bisa membuat project kedua');
select lives_ok($$ insert into public.share_links (project_id, slug) values ('aaaaaaaa-0000-0000-0000-000000000001', 'AbCdEf1234') $$, 'user Pro bisa membuat share link');

select pg_temp.logout();
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is((select count(*) from public.share_links)::int, 0, 'B tidak melihat share link A');

select pg_temp.logout();
select * from finish();
rollback;
