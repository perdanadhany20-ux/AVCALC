# PROMPT: AV Proposal & BOM Generator (MVP lengkap)

Kamu adalah Senior Full-Stack Engineer. Bangun aplikasi ini dari nol sampai berjalan, secara mandiri.

## ATURAN KERJA (WAJIB)

1. **Jangan bertanya ke user.** Semua keputusan sudah ditentukan di dokumen ini. Jika ada hal yang tidak tercakup, pilih opsi paling sederhana dan umum di industri, lalu catat di `DECISIONS.md` (format: keputusan, alasan, cara mengubah). Lanjutkan tanpa berhenti.
2. Kerjakan **semua fase berurutan** sampai selesai. Jangan berhenti setelah analisis atau setelah satu fase.
3. Setiap akhir fase jalankan: `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build`. Perbaiki semua error sebelum lanjut.
4. Jangan pernah menaruh service-role key di kode client. Rahasia hanya di `.env.local` dan diakses dari server.
5. Jika perintah gagal karena environment (misalnya Docker tidak ada untuk Supabase lokal), tetap selesaikan kode, tulis langkah manual di README, dan lanjutkan.
6. Commit git per fase dengan pesan yang jelas.

## STACK (FINAL, JANGAN DIGANTI)

- Next.js 15 App Router, TypeScript `strict`, pnpm
- Supabase: Auth (email + password), Postgres, RLS, Storage; Supabase CLI untuk migration lokal; `@supabase/ssr`
- Tailwind CSS + shadcn/ui, lucide-react
- zod + react-hook-form untuk form & validasi
- TanStack Table untuk tabel
- `@react-pdf/renderer` untuk PDF (render di server route)
- papaparse untuk import CSV
- date-fns
- Vitest untuk unit test logika kalkulasi

## LOKALISASI

- Bahasa UI: Bahasa Indonesia.
- Mata uang: IDR, format `Rp 12.500.000` (tanpa desimal).
- Zona waktu: Asia/Jakarta. Format tanggal: `27 Sep 2026`.
- PPN: default 11%, bisa diubah per company di Settings.

## PRODUK

Integrator AV memakai app ini untuk membuat daftar perangkat (BOM) per ruang, menghitung harga dan margin, lalu menghasilkan proposal PDF bermerek dalam hitungan menit.

## ROLE & TENANT

- Multi-tenant: setiap data milik satu `company`.
- Role: `owner`, `presales`, `sales`, `engineer`.
- Sign up pertama → onboarding membuat company baru, user menjadi `owner`.
- Owner mengundang user lewat email (server action memakai service-role key di server) dan memilih role.

Hak akses:

| Aksi | owner | presales | sales | engineer |
|---|---|---|---|---|
| Kelola katalog & harga | ✓ | ✓ | – | – |
| Lihat harga beli & margin | ✓ | ✓ | – | – |
| Buat/edit project & BOM | ✓ | ✓ | ✓ | ✓ |
| Generate & kirim proposal | ✓ | ✓ | ✓ | – |
| Kelola user & settings | ✓ | – | – | – |

Harga beli dan margin **harus disembunyikan di level database** (lihat Keamanan), bukan hanya di UI.

## SKEMA DATABASE

Semua tabel memiliki `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz` (trigger), dan `company_id uuid not null` (kecuali `companies`).

- `companies`: name, logo_path, address, phone, email, npwp, ppn_percent numeric default 11, min_margin_percent numeric default 20, proposal_terms text, proposal_validity_days int default 30
- `profiles`: id = auth.users.id, company_id, full_name, role (enum di atas), is_active bool
- `product_categories`: name, sort_order. Seed: Display, LED Video Wall, Projector, Screen, IFP, Kamera PTZ, Video Conference, Audio - Mikrofon, Audio - Speaker, Audio - DSP & Amplifier, Matrix & Switcher, Extender & Kabel, Control System, Rack & Mounting, Aksesori
- `products`: category_id, brand, model, description, unit (default 'unit'), cost_price numeric, sell_price numeric, datasheet_url, is_active
- `room_templates`: name, description, min_people, max_people
- `room_template_items`: template_id, product_id, qty, qty_rule text nullable (lihat aturan qty)
- `clients`: name, contact_name, email, phone, address
- `projects`: client_id, name, status enum (`draft`, `sent`, `won`, `lost`), owner_id, notes, install_fee_type enum (`percent`, `lump_sum`), install_fee_value numeric, discount_percent numeric default 0
- `project_rooms`: project_id, name, template_id nullable, length_m, width_m, height_m, people int, sort_order
- `bom_items`: project_room_id, product_id nullable, custom_name nullable, qty numeric, unit_cost numeric, unit_price numeric (snapshot saat item ditambahkan), sort_order
- `proposals`: project_id, version int, pdf_path, totals jsonb (snapshot), created_by, sent_at nullable

Aturan qty template (`qty_rule`): null = qty tetap; `per_10_people` = ceil(people / 10) × qty; `per_20_m2` = ceil(luas / 20) × qty.

## KEAMANAN (RLS)

- Buat fungsi SQL `auth_company_id()` dan `auth_role()` (security definer, membaca `profiles`).
- Semua tabel: select/insert/update/delete hanya jika `company_id = auth_company_id()`.
- Kolom `products.cost_price` dan `bom_items.unit_cost`: role `sales` dan `engineer` tidak boleh membacanya. Implementasi: revoke select langsung pada tabel untuk role authenticated, sediakan view `products_public` dan `bom_items_public` tanpa kolom biaya, serta view lengkap yang hanya bisa diakses lewat fungsi yang mengecek `auth_role() in ('owner','presales')`. Frontend memakai view sesuai role.
- Mutasi katalog hanya untuk owner/presales (cek di RLS policy).
- Storage bucket `logos` dan `proposals`: private, path diawali `company_id/`, policy berdasarkan prefix tersebut. Unduhan PDF memakai signed URL.

## KALKULASI (buat di `lib/pricing.ts` + unit test)

Per ruang: `room_subtotal = Σ(qty × unit_price)`, `room_cost = Σ(qty × unit_cost)`.

Project:
1. `equipment_subtotal = Σ room_subtotal`
2. `install_fee = percent ? equipment_subtotal × value/100 : value`
3. `subtotal = equipment_subtotal + install_fee`
4. `discount = subtotal × discount_percent/100`
5. `dpp = subtotal − discount`
6. `ppn = dpp × ppn_percent/100`
7. `grand_total = dpp + ppn`
8. `margin_percent = (dpp − Σ room_cost) / dpp × 100` (jasa instalasi dianggap tanpa biaya)

Pembulatan ke rupiah terdekat hanya di tampilan dan snapshot final. Tampilkan badge peringatan jika `margin_percent < min_margin_percent` (hanya untuk role yang boleh melihat margin).

## HALAMAN & ROUTE

- `/login`, `/signup`, `/onboarding`
- `/dashboard`: jumlah proposal bulan ini, win rate (won / (won+lost)), nilai pipeline (grand_total project `draft`+`sent`), 5 project terbaru
- `/catalog`: tabel produk (filter kategori, search), tambah/edit, import CSV (kolom: category, brand, model, description, unit, cost_price, sell_price, datasheet_url; baris error ditampilkan, baris valid disimpan)
- `/templates`: kelola template ruang & itemnya
- `/clients`: CRUD klien
- `/projects`: daftar + filter status
- `/projects/new`: wizard 3 langkah: (1) pilih/buat klien & nama project, (2) tambah ruang (nama, dimensi, jumlah orang, template), (3) review BOM
- `/projects/[id]`: tab per ruang dengan BOM yang bisa diedit (tambah dari katalog lewat command palette, ubah qty, hapus, item custom), panel ringkasan harga di kanan (sticky; di mobile menjadi bottom sheet), ubah status, tombol "Buat proposal"
- `/projects/[id]/proposals`: daftar versi, unduh PDF, tandai terkirim
- `/settings`: profil company, logo, PPN, margin minimum, syarat & ketentuan, masa berlaku; kelola user & undangan

Saat template dipilih untuk ruang, BOM terisi otomatis sesuai aturan qty dengan snapshot harga saat itu.

## PDF PROPOSAL

Halaman: (1) cover dengan logo, nama project, klien, tanggal, nomor proposal `PRO/{YYYY}/{MM}/{urut 4 digit}-v{versi}`; (2) ringkasan: daftar ruang dan total per ruang; (3+) BOM per ruang (No, Brand, Model, Deskripsi, Qty, Harga Satuan, Total); halaman terakhir berisi rincian harga (subtotal, jasa, diskon, DPP, PPN, grand total), syarat & ketentuan, masa berlaku, dan area tanda tangan. Harga beli dan margin tidak pernah muncul di PDF. Setiap generate membuat versi baru dan menyimpan snapshot totals.

## DESAIN UI

- Nuansa: alat kerja teknis yang padat dan tenang, bukan landing page.
- Font: IBM Plex Sans (UI), IBM Plex Mono hanya untuk angka di tabel harga.
- Warna: latar `#F7F8FA`, surface `#FFFFFF`, teks `#1B2230`, primary `#1F4FD8`, sukses `#1E8E5A`, peringatan `#C77700`, bahaya `#C8322B`, border `#E3E6EC`. Sediakan dark mode.
- Sidebar kiri di desktop, bottom nav di mobile. Tabel rapat, angka rata kanan.
- Empty state selalu berisi aksi utama (misalnya "Tambah produk pertama").

## SEED DATA

Buat `supabase/seed.sql`: 1 company demo, 1 owner (`owner@demo.test` / `demo12345`), ±40 produk AV umum dengan merek generik yang realistis dan harga IDR wajar, 5 template (Huddle 2–4, Meeting 6–8, Boardroom 10–16, Training 20–40, Auditorium 50+), 2 klien, dan 2 project contoh.

## FASE

1. Setup project, Supabase, migration skema + RLS + seed, auth & onboarding.
2. Katalog + import CSV + template.
3. Klien, project wizard, editor BOM, `lib/pricing.ts` + test.
4. PDF proposal + versioning + storage.
5. Dashboard, settings, undangan user, polish UI & mobile.
6. README (setup, env, perintah), `.env.example`, `DECISIONS.md`.

## KRITERIA SELESAI

- Owner demo bisa login, membuat project dengan 3 ruang dari template, mengedit BOM, dan menghasilkan PDF proposal v1 dan v2.
- User role `sales` tidak bisa membaca `cost_price`, termasuk lewat query langsung ke Supabase dari browser (buktikan dengan test SQL/RLS di `supabase/tests`).
- Semua test kalkulasi lulus, `pnpm build` sukses tanpa error.

## DI LUAR SCOPE

Pembayaran/billing SaaS, integrasi email pengiriman proposal, multi-bahasa, dan multi-currency.
