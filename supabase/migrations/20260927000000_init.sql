-- AVCalc: skema tier Pro (profiles, projects, rooms, calculations, share_links) + RLS.

create extension if not exists pgcrypto with schema extensions;

create type public.plan as enum ('free', 'pro');

-- ─────────────────────────── Tabel ───────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  company_name text check (char_length(company_name) <= 120),
  logo_path text,
  plan public.plan not null default 'free',
  pro_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  client_name text check (char_length(client_name) <= 120),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_id_idx on public.projects (user_id);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);
create index rooms_project_id_idx on public.rooms (project_id);

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  calculator text not null check (calculator in ('screen', 'led', 'projector', 'camera', 'ceiling-speaker', 'convert')),
  input jsonb not null,
  output jsonb not null,
  created_at timestamptz not null default now()
);
create index calculations_room_id_idx on public.calculations (room_id);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  slug text not null unique check (slug ~ '^[A-Za-z0-9]{10}$'),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index share_links_project_id_idx on public.share_links (project_id);

-- ─────────────────────────── Fungsi bantu ───────────────────────────

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- Profil dibuat otomatis saat user mendaftar.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_pro(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.plan = 'pro' and (p.pro_until is null or p.pro_until > now())
  );
$$;

create or replace function public.owns_project(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = pid and p.user_id = auth.uid());
$$;

create or replace function public.owns_room(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rooms r join public.projects p on p.id = r.project_id
    where r.id = rid and p.user_id = auth.uid()
  );
$$;

-- Batas akun gratis: 1 project. Ditegakkan di database, bukan hanya di UI.
create or replace function public.enforce_project_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  if not public.is_pro(new.user_id)
     and (select count(*) from public.projects where user_id = new.user_id) >= 1 then
    raise exception 'FREE_PROJECT_LIMIT'
      using errcode = 'P0001', hint = 'Akun gratis hanya bisa memiliki 1 project. Upgrade ke Pro.';
  end if;
  return new;
end $$;

create trigger projects_enforce_limit before insert on public.projects
  for each row execute function public.enforce_project_limit();

revoke execute on function public.is_pro(uuid) from anon;
revoke execute on function public.owns_project(uuid) from anon;
revoke execute on function public.owns_room(uuid) from anon;

-- ─────────────────────────── Hak akses & RLS ───────────────────────────

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.rooms enable row level security;
alter table public.calculations enable row level security;
alter table public.share_links enable row level security;

-- Pengunjung anonim tidak pernah membaca tabel langsung; halaman share memakai server route.
revoke all on public.profiles, public.projects, public.rooms, public.calculations, public.share_links from anon;

-- profiles: user hanya boleh mengubah kolom profil, bukan plan / pro_until.
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, company_name, logo_path) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

grant select, insert, update, delete on public.projects, public.rooms, public.calculations, public.share_links to authenticated;

create policy projects_select_own on public.projects for select to authenticated
  using (user_id = auth.uid());
create policy projects_insert_own on public.projects for insert to authenticated
  with check (user_id = auth.uid());
create policy projects_update_own on public.projects for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy projects_delete_own on public.projects for delete to authenticated
  using (user_id = auth.uid());

create policy rooms_all_own on public.rooms for all to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create policy calculations_all_own on public.calculations for all to authenticated
  using (public.owns_room(room_id)) with check (public.owns_room(room_id));

create policy share_links_select_own on public.share_links for select to authenticated
  using (public.owns_project(project_id));
create policy share_links_insert_pro on public.share_links for insert to authenticated
  with check (public.owns_project(project_id) and public.is_pro(auth.uid()));
create policy share_links_update_own on public.share_links for update to authenticated
  using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy share_links_delete_own on public.share_links for delete to authenticated
  using (public.owns_project(project_id));

-- ─────────────────────────── Storage: logo ───────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 1048576, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy logos_select_own on storage.objects for select to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy logos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy logos_update_own on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy logos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
