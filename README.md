# AVCalc: kalkulator desain ruang AV

Kalkulator gratis tanpa login untuk desainer dan integrator AV, plus tier Pro untuk menyimpan project per ruang, ekspor PDF bermerek, dan link berbagi ke klien.

Kalkulator: ukuran layar & jarak pandang, LED video wall, jarak proyeksi & lumen proyektor, kamera PTZ / FOV, cakupan speaker plafon, dan konversi satuan. Setiap kalkulator punya diagram gambar kerja, bagian "Rumus & asumsi", label Estimasi, toggle metrik/imperial, dan input yang tersinkron ke URL.

## Stack

Next.js 15 (App Router, TypeScript strict), Supabase (Auth, Postgres + RLS, Storage) lewat `@supabase/ssr`, Tailwind CSS 4 + komponen gaya shadcn, zod + react-hook-form, `@react-pdf/renderer`, Vitest, pnpm.

## Menjalankan

Prasyarat: Node.js 20+ dan pnpm 9 (`npm i -g pnpm@9`).

```bash
pnpm install
cp .env.example .env.local
pnpm dev            # http://localhost:3000
```

Tanpa variabel Supabase, keenam kalkulator tetap berfungsi penuh. Halaman akun akan menampilkan pesan bahwa Supabase belum dikonfigurasi.

### Menyiapkan Supabase

**Opsi A, Supabase cloud (tanpa Docker)**

1. Buat project di supabase.com.
2. Jalankan migration dengan salah satu cara berikut:
   - `supabase link --project-ref <ref>` lalu `supabase db push`, atau
   - salin isi `supabase/migrations/20260927000000_init.sql` ke SQL Editor lalu Run.
3. Isi `.env.local` dari Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Di Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (atau domain produksi).
   - Redirect URL: `http://localhost:3000/auth/callback` (dan versi produksinya).
   Ini dibutuhkan untuk magic link dan konfirmasi email.

**Opsi B, Supabase lokal (butuh Docker)**

```bash
supabase start          # menjalankan Postgres, Auth, Storage + migration
supabase status         # salin API URL, anon key, service_role key ke .env.local
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Development, build produksi, server produksi |
| `pnpm lint` / `pnpm typecheck` | ESLint dan `tsc --noEmit` |
| `pnpm test` | Unit test: rumus keenam kalkulator (contoh angka spec), registry, URL, PDF, slug, pro:grant |
| `pnpm test:rls` | Test RLS pgTAP (`supabase test db`, butuh `supabase start`) |
| `pnpm test:rls:local` | Test RLS yang sama di Postgres 16 biasa tanpa Docker (butuh `postgresql-16-pgtap`; koneksi lewat `PGHOST`/`PGPORT`/`PGUSER`) |
| `pnpm pro:grant <email> <bulan>` | Aktifkan/perpanjang Pro. Membaca `.env.local` (butuh service role key) |

Contoh: `pnpm pro:grant budi@contoh.co.id 12`. Jika Pro masih aktif, masa berlaku diperpanjang dari tanggal akhir yang ada.

## Akun gratis vs Pro

| | Gratis | Pro |
|---|---|---|
| Kalkulator & link URL | Ya | Ya |
| Project | 1 | Tanpa batas |
| PDF | Tanda air "AVCalc versi gratis" | Logo + nama perusahaan sendiri |
| Link berbagi `/s/<slug>` | Tidak | Ya (7/30/90 hari atau tanpa batas) |

Semua batas ditegakkan di database, bukan hanya di UI:
- trigger `enforce_project_limit` untuk batas project;
- policy `share_links_insert_pro` untuk share link;
- hak UPDATE `profiles` dibatasi ke kolom profil, sehingga user tidak bisa mengubah `plan` sendiri.

Halaman share membaca data lewat server dengan service role setelah memvalidasi slug (aktif, belum kedaluwarsa, pemilik masih Pro). Tabel tidak dibuka ke publik.

Pembayaran di luar scope. `/upgrade` berisi tombol "Hubungi kami" (mailto ke `CONTACT_EMAIL`), lalu admin menjalankan `pnpm pro:grant`.

## Uji manual kriteria selesai

1. Tanpa login, buka keenam kalkulator di `/kalkulator/*`. Ubah input, salin URL, lalu buka di jendela lain: hasilnya sama.
2. Daftar, buka kalkulator, tekan **Simpan ke project**, lalu buat project dan ruang. Simpan kalkulasi kedua ke project baru: muncul dialog upgrade.
3. Buka project, tekan **Ekspor PDF**: PDF bertanda air.
4. `pnpm pro:grant <email> 1`, unggah logo dan isi nama perusahaan di `/settings`, lalu ekspor ulang: PDF bermerek tanpa tanda air.
5. Di halaman project, **Buat link berbagi**, lalu buka link di jendela incognito (tanpa login).
6. `pnpm test:rls`: user A tidak bisa membaca project user B, dan seterusnya (22 assertion).

## Struktur kode

```
lib/calc/<nama>.ts        Fungsi murni calculate(input) + skema zod (tanpa UI) + <nama>.test.ts
lib/present/<nama>.ts     Field form, ringkasan hasil, diagram, rumus per kalkulator
lib/present/registry.ts   Daftar kalkulator, validasi + eksekusi, format baris
lib/diagram/              Primitif diagram netral (dirender ke SVG web dan PDF)
lib/pdf/                  Dokumen PDF project (react-pdf) + font
components/calc/          Form, panel hasil, dialog simpan (generik)
app/kalkulator/[slug]     Halaman kalkulator (statis, SEO)
app/projects, app/settings, app/upgrade, app/s/[slug], app/api/projects/[id]/pdf
supabase/migrations       Skema, RLS, storage
supabase/tests            Test RLS pgTAP
scripts/pro-grant.ts      Script admin aktivasi Pro
```

Lihat `DECISIONS.md` untuk keputusan yang tidak diatur spec dan cara mengubahnya.

## Deploy (misalnya Vercel)

1. Isi semua variabel di `.env.example` di environment hosting. `NEXT_PUBLIC_SITE_URL` diisi dengan domain produksi.
2. Tambahkan `<domain>/auth/callback` ke Redirect URL Supabase.
3. File font PDF di `assets/fonts` ikut ter-deploy lewat `outputFileTracingIncludes` di `next.config.ts`.

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di kode server (`lib/supabase/admin.ts`, `lib/share.ts`, `scripts/`) dan tidak pernah di-bundle ke browser.

## Di luar scope

Payment gateway, kalkulator akustik lanjutan (RT60, STI), bandwidth AV-over-IP, dan multi-bahasa.
