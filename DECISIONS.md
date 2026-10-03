# DECISIONS

Keputusan yang tidak ditentukan di spesifikasi. Format: keputusan, alasan, cara mengubah.

| # | Keputusan | Alasan | Cara mengubah |
|---|---|---|---|
| 1 | Nama produk **AVCalc** | Spec tidak memberi nama; pendek dan jelas. | Ganti teks di `components/site-header.tsx`, `app/layout.tsx`, `app/opengraph-image.tsx`, `lib/pdf/project-pdf.tsx`. |
| 2 | Komponen UI gaya shadcn ditulis manual (`components/ui/*`) di atas Radix (Dialog, Slot); select memakai `<select>` native | CLI shadcn butuh akses ke registry online yang tidak tersedia saat build; select native lebih ringan dan aksesibel di mobile. | Jalankan `pnpm dlx shadcn@latest add button dialog select` dan ganti import di `components/ui`. |
| 3 | Font web dari paket `@fontsource-variable/*`, bukan `next/font/google` | Build tidak bergantung pada akses ke Google Fonts. | Ganti import di `app/layout.tsx` dengan `next/font/google`. |
| 4 | Form & panel hasil dibangkitkan dari definisi di `lib/present/<nama>.ts` (field, ringkasan, diagram, rumus); `components/calc/*` generik | Enam kalkulator konsisten; definisi yang sama dipakai web, PDF, dan halaman share. | Tambah kalkulator: buat `lib/calc/<nama>.ts` + test, `lib/present/<nama>.ts`, daftarkan di `lib/present/registry.ts`, tambahkan nama di check constraint `calculations.calculator`. |
| 5 | Diagram didefinisikan sebagai daftar bentuk netral (`lib/diagram`) lalu dirender ke SVG DOM dan ke `Svg` react-pdf | Satu sumber gambar untuk layar dan PDF. | Ubah builder di `lib/present/*.ts`; renderer di `components/diagram/diagram-svg.tsx` dan `lib/pdf/project-pdf.tsx`. |
| 6 | Angka memakai format Indonesia (koma desimal); input menerima koma maupun titik | UI berbahasa Indonesia. | `formatNumber`/`parseNumber` di `lib/units.ts`. |
| 7 | Query string hanya menyimpan nilai yang berbeda dari default, selalu dalam satuan metrik | URL pendek; link tetap benar apa pun pilihan unit penerima. | `lib/query.ts`. |
| 8 | Toggle imperial mengonversi m→ft, mm→in, m²→ft², lux→fc. Pixel pitch, sudut, W, kg, inci diagonal tidak dikonversi | Pitch dan diagonal di industri selalu mm/inci; W dan kg tidak disebut di spec. | `Quantity` di `lib/units.ts` dan properti `quantity` per field/baris. |
| 9 | Pembulatan kolom/baris LED memakai `Math.round` (.5 ke atas), sesuai contoh spec (4,5 → 5) | Spec. | `lib/calc/led.ts`. |
| 10 | Peringatan LED > 4K muncul jika lebar > 3840, tinggi > 2160, **atau** total piksel > 3840×2160 | Satu sisi melebihi 3840/2160 sudah tidak muat di satu output 4K. | `calculate()` di `lib/calc/led.ts`. |
| 11 | Lumen proyektor bernilai 0 jika cahaya ambien 0 lux, dengan peringatan | Rumus spec menghasilkan 0; dijelaskan ke user daripada diberi angka karangan. | `lib/calc/projector.ts`. |
| 12 | Kalkulator kamera juga menampilkan rentang jarak kamera yang memungkinkan (dari HFOV wide & tele) | Membantu menjawab "dimundurkan sejauh apa". Tidak mengubah rumus spec. | Hapus baris di `lib/present/camera.ts`. |
| 13 | Diagram speaker memakai grid rata: posisi di tengah sel `panjang/kolom × lebar/baris` | Cara umum layout plafon; jarak aktual ≤ jarak maksimum. | `positions` di `lib/calc/ceiling-speaker.ts`. |
| 14 | Batas 1 project untuk akun gratis ditegakkan oleh trigger database `enforce_project_limit` (dengan advisory lock) | Tidak bisa dilewati lewat query langsung dari browser. | Ubah angka di migration. |
| 15 | User tidak bisa mengubah `plan`/`pro_until` sendiri (hak UPDATE hanya pada kolom profil) | Mencegah self-upgrade. | `grant update (...) on public.profiles` di migration. |
| 16 | Share link hanya bisa dibuat akun Pro (policy RLS) dan hanya tampil selama pemiliknya masih Pro | Share link adalah fitur Pro. Link dari akun yang Pro-nya habis berhenti tampil, tidak dihapus. | `loadSharedProject()` di `lib/share.ts`. |
| 17 | Pilihan masa berlaku share link: 7/30/90 hari atau tanpa batas (default 30) | `expires_at` nullable di spec. | `EXPIRY_DAYS` di `app/projects/actions.ts`. |
| 18 | Output kalkulasi dihitung ulang di server saat disimpan; output dari browser diabaikan | Data di DB selalu konsisten dengan input. | `saveCalculation()` di `app/projects/actions.ts`. |
| 19 | Tampilan project/share/PDF memakai `output` yang tersimpan (snapshot), bukan menghitung ulang | Hasil yang dikirim ke klien tidak berubah diam-diam jika rumus diperbarui. | Ganti `output` dengan `run(def, input).output` di `components/projects/calc-card.tsx` dan PDF. |
| 20 | PDF selalu dalam satuan metrik | Unit toggle tersimpan di browser (localStorage), bukan di akun. | Tambah kolom unit di `profiles` dan teruskan ke `ProjectPdf`. |
| 21 | Font PDF: DejaVu Sans (isi) + Space Grotesk (judul), file ada di `assets/fonts` | react-pdf hanya mendukung TTF/WOFF, dan Helvetica bawaan tidak punya simbol ≥ √ → ₁₀. | `lib/pdf/fonts.ts`. |
| 22 | Logo disimpan di bucket privat `logos/<user_id>/...`, PNG/JPG maks. 1 MB; bisa diunggah akun gratis tapi hanya dipakai di PDF Pro | Spec: PDF bermerek untuk Pro. | `components/settings/logo-upload.tsx`, migration (bucket). |
| 23 | Konfirmasi email signup dimatikan di `supabase/config.toml` lokal | Mempercepat pengujian lokal. Di Supabase cloud ikuti setelan project. | `[auth.email] enable_confirmations`. |
| 24 | Tema gelap mengikuti sistem secara default, bisa diubah lewat tombol dan disimpan di localStorage | Spec meminta dark mode tanpa menentukan default. | `THEME_SCRIPT` di `components/toggles.tsx`. |
| 25 | Script `scripts/ci/test-rls-local.sh` + `supabase-stub.sql` untuk menjalankan test RLS di Postgres biasa tanpa Docker | Docker tidak selalu tersedia; test resmi tetap `supabase test db`. | Hapus folder `scripts/ci` jika tidak dipakai. |
| 26 | `profiles.logo_path` dibatasi check constraint ke folder `<id>/...`; `lib/share.ts` juga mengecek prefix sebelum membuat signed URL | Kolom bisa di-update langsung via PostgREST, dan halaman share memakai service role (lewat RLS storage). | Migration `20261003000000_harden_logo_path_and_fn_grants.sql`. |
| 27 | EXECUTE `is_pro`/`owns_project`/`owns_room` dicabut dari `PUBLIC` dan `anon`, diberi eksplisit ke `authenticated` | Default Postgres memberi EXECUTE ke PUBLIC, jadi revoke dari anon saja tidak cukup. | Migration yang sama. |
| 28 | Override pnpm `postcss@<8.5.23` → `^8.5.23` | `next` membawa postcss 8.4.31 yang punya 4 advisory (2 high). | Hapus `pnpm.overrides` setelah `next` memperbarui dependensinya. |
