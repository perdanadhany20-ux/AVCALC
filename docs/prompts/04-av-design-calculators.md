# PROMPT: AV Room Design Calculators (MVP lengkap)

Kamu adalah Senior Full-Stack Engineer. Bangun aplikasi ini dari nol sampai berjalan, secara mandiri.

## ATURAN KERJA (WAJIB)

1. **Jangan bertanya ke user.** Semua keputusan dan rumus sudah ditentukan di dokumen ini. Jika ada hal yang tidak tercakup, pilih opsi paling sederhana dan umum, lalu catat di `DECISIONS.md` (keputusan, alasan, cara mengubah). Lanjutkan tanpa berhenti.
2. Kerjakan **semua fase berurutan** sampai selesai.
3. Setiap akhir fase jalankan `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, lalu perbaiki semua error.
4. Gunakan rumus **persis** seperti tertulis di bawah. Setiap rumus wajib memiliki unit test dengan contoh angka yang dihitung manual.
5. Service-role key hanya di server. Jika environment tidak mendukung sebuah perintah, selesaikan kode, tulis langkah manual di README, dan lanjutkan. Commit git per fase.

## STACK (FINAL)

- Next.js 15 App Router, TypeScript `strict`, pnpm
- Supabase Auth (email + password dan magic link), Postgres, RLS, Storage; `@supabase/ssr`
- Tailwind CSS + shadcn/ui, lucide-react
- zod + react-hook-form
- Diagram: SVG yang digambar sendiri di React (tanpa library chart)
- `@react-pdf/renderer` untuk export PDF
- Vitest

## LOKALISASI & UNIT

- Bahasa UI: Bahasa Indonesia.
- Unit default metrik (m, mm, lux). Toggle ke imperial (ft, in, fc) disimpan di localStorage (dibungkus try/catch). Semua perhitungan internal memakai metrik.
- Angka ditampilkan dengan 2 desimal kecuali dinyatakan lain; ukuran diagonal display dalam inci dibulatkan ke 1 desimal.

## PRODUK

Kalkulator gratis tanpa login untuk desainer dan integrator AV (sumber lead), ditambah tier Pro untuk menyimpan project, export PDF bermerek, dan membagikan hasil ke klien.

## STRUKTUR KODE

- `lib/calc/<nama>.ts`: fungsi murni `calculate(input) → output` + skema zod input. Tidak ada kode UI di sini.
- `lib/calc/<nama>.test.ts`: unit test.
- `components/calc/<nama>/`: form, panel hasil, diagram SVG.
- Setiap halaman kalkulator memiliki: form input di kiri, hasil + diagram di kanan (bertumpuk di mobile), bagian "Rumus & asumsi" yang bisa dibuka, dan label "Estimasi" pada nilai yang merupakan perkiraan.
- Input tersinkron ke URL query string sehingga hasil bisa dibagikan tanpa login.

## KALKULATOR & RUMUS

### 1. Ukuran layar & jarak pandang (`/kalkulator/ukuran-layar`)

Input: jarak penonton terjauh D (m), jarak penonton terdekat (m), aspect ratio (16:9 default, 16:10, 21:9, 4:3), jenis tampilan: `adm` (detail/analitis), `bdm` (presentasi umum), `passive` (signage/video).

- Faktor rule-of-thumb: adm = 4, bdm = 6, passive = 8 (bisa diubah di "Pengaturan lanjut").
- Tinggi gambar minimum `H = D / faktor`.
- Lebar `W = H × (rasio lebar / rasio tinggi)`. Diagonal `= √(W² + H²)` dalam m dan inci (÷ 0.0254).
- Rekomendasi: ukuran display standar terkecil ≥ diagonal (daftar: 43, 50, 55, 65, 75, 86, 98, 100, 110 inci); jika > 110 inci, sarankan LED atau proyektor.
- Cek jarak terdekat: peringatan jika jarak terdekat < 1 × lebar gambar.
- Mode terbalik: input ukuran diagonal → jarak penonton terjauh maksimum untuk ketiga jenis tampilan.
- Tampilkan catatan: "Rule of thumb 4/6/8. Untuk desain final, gunakan standar AVIXA DISCAS."

Test: D = 6 m, bdm, 16:9 → H = 1.00 m, W = 1.78 m, diagonal = 2.04 m = 80.3 inci → rekomendasi 86 inci.

### 2. LED video wall (`/kalkulator/led`)

Input: pixel pitch (mm), ukuran kabinet lebar × tinggi (mm; preset 500×500, 500×1000, 600×337.5, 640×480), resolusi kabinet (px, terisi otomatis = ukuran / pitch dan dibulatkan, bisa diubah), target lebar & tinggi dinding (m), daya maksimum & rata-rata per kabinet (W), berat per kabinet (kg).

- Kolom `= round(target_lebar_mm / kabinet_lebar)`, baris `= round(target_tinggi_mm / kabinet_tinggi)`; tampilkan juga opsi floor/ceil di sebelahnya.
- Ukuran aktual, resolusi total (kolom × res_kabinet_x, baris × res_kabinet_y), aspect ratio aktual, dan diagonal.
- Jarak pandang minimum (m) ≈ pitch (mm) × 1; jarak pandang nyaman ≈ pitch × 3 (Estimasi).
- Daya total maksimum & rata-rata, arus pada 220 V (`A = W / 220`), berat total.
- Peringatan jika resolusi total melebihi 3840×2160 (butuh lebih dari satu input/processor 4K).

Test: pitch 2.5, kabinet 500×500, target 4 × 2.25 m → 8 kolom × 4.5 → round = 5 baris (catat pembulatan .5 ke atas), res kabinet 200×200 → 1600×1000.

### 3. Projector throw & brightness (`/kalkulator/proyektor`)

Input: throw ratio (atau rentang min–max zoom), lebar layar (m) **atau** diagonal + aspect ratio, iluminasi ambien pada layar (lux), gain layar (default 1.0), jenis tampilan untuk target kontras.

- Jarak proyeksi `= throw_ratio × lebar`. Jika rentang, tampilkan jarak min–max.
- Luas layar `A = lebar × tinggi` (m²).
- Target kontras terhadap cahaya ambien: passive 7:1, bdm 15:1, adm 50:1, full motion 80:1.
- Lumen yang dibutuhkan (Estimasi) `= ambien_lux × kontras × A / gain`, dibulatkan ke atas ke kelipatan 500.
- Diagram samping: proyektor, garis throw, dan layar dengan skala.

Test: throw 1.5, lebar 3 m, 16:9 → jarak 4.5 m; tinggi 1.6875, A = 5.0625; 50 lux, bdm 15, gain 1 → 3796.9 → 4000 lumen.

### 4. Kamera PTZ / FOV (`/kalkulator/kamera`)

Input: jarak kamera ke subjek (m), lebar frame yang diinginkan (m), HFOV kamera saat wide dan tele (derajat), jumlah zoom optik (opsional, hanya informasi).

- HFOV yang dibutuhkan `= 2 × atan(lebar / (2 × jarak))` dalam derajat.
- Status: jika HFOV dibutuhkan > HFOV wide → "Terlalu lebar, kamera harus dimundurkan atau pakai lensa lebih lebar"; jika < HFOV tele → "Terlalu sempit, subjek tidak bisa di-zoom sedekat itu"; selain itu → "Bisa".
- Lebar frame pada posisi wide dan tele di jarak tersebut: `2 × jarak × tan(HFOV / 2)`.
- Diagram tampak atas berupa kerucut FOV.

Test: jarak 5 m, lebar 2 m → HFOV 22.62°.

### 5. Cakupan speaker plafon (`/kalkulator/speaker-plafon`)

Input: panjang & lebar ruang (m), tinggi plafon (m), tinggi telinga (default 1.2 m duduk, 1.7 m berdiri), sudut dispersi speaker (derajat, default 90), pola: `edge_to_edge`, `minimum_overlap`, `edge_to_center`.

- `h = tinggi_plafon − tinggi_telinga`; diameter cakupan `d = 2 × h × tan(dispersi / 2)`.
- Jarak antar speaker: edge_to_edge = d; minimum_overlap = d × 0.707; edge_to_center = d / 2.
- Jumlah `= ceil(panjang / jarak) × ceil(lebar / jarak)`; tampilkan grid di diagram tampak atas dengan lingkaran cakupan.
- Peringatan jika h ≤ 0.

Test: plafon 3 m, telinga 1.2, 90° → h 1.8, d 3.6; ruang 10 × 7, minimum_overlap → jarak 2.545 → 4 × 3 = 12 speaker.

### 6. Konversi (`/kalkulator/konversi`)

Panjang (m, ft, in, mm), iluminasi (lux ↔ foot-candle, 1 fc = 10.764 lux), luminansi (nits ↔ foot-lambert, 1 fL = 3.426 nits), diagonal ↔ lebar/tinggi untuk aspect ratio tertentu, dan dB ↔ rasio daya.

## TIER PRO

- `profiles`: id, full_name, company_name, logo_path, plan enum (`free`, `pro`) default free, pro_until nullable.
- `projects`: user_id, name, client_name, notes. `rooms`: project_id, name. `calculations`: room_id, calculator (nama), input jsonb, output jsonb, created_at. `share_links`: project_id, slug (acak 10 karakter), is_active, expires_at nullable.
- RLS: user hanya mengakses datanya sendiri. Halaman share `/s/[slug]` membaca lewat server route yang memvalidasi slug aktif (tanpa membuka tabel ke publik).
- Tombol "Simpan ke project" di setiap kalkulator. Jika belum login → dialog login; jika user free dan sudah punya 1 project → dialog upgrade.
- Batas free: 1 project, export PDF dengan watermark, tanpa share link. Pro: tanpa batas, PDF bermerek (logo & nama perusahaan sendiri), share link.
- Pembayaran di luar scope: sediakan halaman `/upgrade` berisi daftar fitur dan tombol "Hubungi kami" (mailto dari env `CONTACT_EMAIL`), serta fungsi admin sederhana untuk mengaktifkan Pro: script `pnpm pro:grant <email> <bulan>`.
- PDF project: cover (logo, nama project, klien, tanggal), satu bagian per ruang berisi setiap kalkulasi (input, hasil, diagram SVG, rumus), dan catatan estimasi.

## HALAMAN LAIN

- `/`: halaman utama. Hero berupa kalkulator ukuran layar yang langsung bisa dipakai (bukan gambar marketing), lalu daftar kalkulator lainnya dan penjelasan singkat fitur Pro.
- `/login`, `/signup`, `/projects`, `/projects/[id]`, `/settings` (profil, logo, unit).
- SEO: metadata per kalkulator, sitemap.xml, dan Open Graph.

## DESAIN UI

- Nuansa: gambar teknik / blueprint yang presisi, bukan SaaS generik.
- Font: Space Grotesk untuk judul dan angka hasil, Inter untuk teks form.
- Warna: latar `#F3F5F9`, surface `#FFFFFF`, teks `#162033`, garis diagram `#2F5DA8`, aksen hasil `#0E8C7F`, peringatan `#C27400`, grid diagram `#D6DEEA`. Dark mode dengan latar biru gelap `#0F1A2B` ala blueprint.
- Angka hasil utama besar dan jelas, dengan satuan yang lebih kecil di sebelahnya. Diagram memberi label ukuran seperti gambar kerja.

## FASE

1. Setup, `lib/calc` untuk 6 kalkulator + semua unit test.
2. UI kalkulator + diagram SVG + sinkronisasi URL + toggle unit.
3. Halaman utama, SEO.
4. Auth, skema, RLS + test RLS, projects/rooms/calculations.
5. Export PDF (watermark vs bermerek), share link, batas free/pro, script `pro:grant`.
6. README, `.env.example`, `DECISIONS.md`, polish mobile & aksesibilitas (label form, fokus keyboard, kontras).

## KRITERIA SELESAI

- Keenam kalkulator bekerja tanpa login dan semua test contoh di atas lulus.
- User free bisa menyimpan 1 project dan export PDF dengan watermark; setelah `pnpm pro:grant`, user bisa export PDF bermerek dan membuat share link yang bisa dibuka tanpa login.
- User A tidak bisa membaca project milik user B (dibuktikan dengan test RLS).
- `pnpm build` sukses dan skor Lighthouse halaman kalkulator ≥ 90 untuk accessibility.

## DI LUAR SCOPE

Payment gateway, kalkulator akustik lanjutan (RT60, STI), kalkulator bandwidth AV-over-IP, dan multi-bahasa.
