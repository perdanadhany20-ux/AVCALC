# PROMPT: AV Service & Maintenance Platform (MVP lengkap)

Kamu adalah Senior Full-Stack Engineer. Bangun aplikasi ini dari nol sampai berjalan, secara mandiri.

## ATURAN KERJA (WAJIB)

1. **Jangan bertanya ke user.** Semua keputusan sudah ditentukan di dokumen ini. Jika ada hal yang tidak tercakup, pilih opsi paling sederhana dan umum di industri, lalu catat di `DECISIONS.md` (keputusan, alasan, cara mengubah). Lanjutkan tanpa berhenti.
2. Kerjakan **semua fase berurutan** sampai selesai.
3. Setiap akhir fase jalankan `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, lalu perbaiki semua error.
4. Service-role key hanya di server. Jangan pernah di client.
5. Jika environment tidak mendukung sebuah perintah (misalnya Docker), selesaikan kode, tulis langkah manual di README, dan lanjutkan.
6. Commit git per fase.

## STACK (FINAL)

- Next.js 15 App Router, TypeScript `strict`, pnpm
- Supabase: Auth (email + password), Postgres, RLS, Storage, Realtime; Supabase CLI; `@supabase/ssr`
- Tailwind CSS + shadcn/ui, lucide-react
- zod + react-hook-form, TanStack Table, date-fns + date-fns-tz
- `@react-pdf/renderer` untuk laporan PDF
- `signature_pad` untuk tanda tangan klien
- PWA (manifest + service worker sederhana) agar halaman teknisi bisa di-install di HP
- Vitest untuk logika SLA & jadwal PM

## LOKALISASI

Bahasa Indonesia, zona waktu Asia/Jakarta, format tanggal `27 Sep 2026 14:30`.

## PRODUK

Integrator AV mengelola kontrak maintenance, aset di lokasi klien, tiket perbaikan dengan SLA, jadwal preventive maintenance (PM), dan laporan kunjungan teknisi.

## ROLE & TENANT

- Multi-tenant per `company`. Sign up pertama → onboarding membuat company, user menjadi `admin`.
- Role: `admin`, `coordinator`, `technician`, `client_viewer`.
- `client_viewer` terikat ke satu `client_id` dan hanya melihat data klien tersebut. Ia bisa membuat tiket dan melihat status, aset, serta laporan miliknya.
- `technician` melihat semua aset (read-only), tetapi hanya bisa mengubah tiket/kunjungan yang di-assign kepadanya.
- `coordinator` dan `admin` mengelola semua data operasional; hanya `admin` yang mengelola user & settings.
- Undangan user via email dari server action.

## SKEMA DATABASE

Semua tabel memiliki `id uuid`, `created_at`, `updated_at` (trigger), `company_id` (kecuali `companies`).

- `companies`: name, logo_path, address, phone, email, business_hours jsonb (default Senin–Jumat 08:00–17:00)
- `profiles`: id = auth.users.id, company_id, full_name, phone, role, client_id nullable, is_active
- `clients`: name, contact_name, email, phone, address
- `sites`: client_id, name, address, lat, lng
- `rooms`: site_id, name, floor
- `asset_types`: name, checklist jsonb (array item checklist PM). Seed: Display, Projector, LED Wall, IFP, Kamera PTZ, Video Conference Codec, Mikrofon, Speaker, DSP, Amplifier, Matrix Switcher, Control Processor, Touch Panel, lengkap dengan 4–8 item checklist yang realistis untuk masing-masing
- `assets`: room_id, asset_type_id, brand, model, serial_number, install_date, warranty_end, status enum (`active`, `faulty`, `retired`), photo_path, notes
- `contracts`: client_id, code, start_date, end_date, pm_visits_per_year int, coverage enum (`business_hours`, `24x7`), is_active
- `contract_rooms`: contract_id, room_id
- `sla_policies`: contract_id, priority enum (`P1`–`P4`), response_minutes, resolution_minutes. Default saat kontrak dibuat: P1 60/240, P2 240/1440, P3 1440/4320, P4 2880/10080
- `tickets`: number (`TKT-{YYYY}-{urut 5 digit}`), client_id, room_id nullable, asset_id nullable, title, description, priority, status enum (`open`, `assigned`, `on_site`, `pending_part`, `resolved`, `closed`), reported_by, assigned_to nullable, response_due_at, resolution_due_at, first_response_at, resolved_at, closed_at
- `ticket_events`: ticket_id, actor_id, type enum (`created`, `status_changed`, `assigned`, `comment`, `photo`), payload jsonb
- `pm_schedules`: contract_id, room_id, due_date, status enum (`scheduled`, `done`, `missed`), assigned_to nullable
- `visits`: ticket_id nullable, pm_schedule_id nullable, technician_id, check_in_at, check_out_at, check_in_lat/lng, summary, checklist_result jsonb, customer_name, signature_path, report_pdf_path
- `attachments`: entity_type, entity_id, path, kind enum (`before`, `after`, `other`)

## ATURAN BISNIS (di `lib/sla.ts` dan `lib/pm.ts` + unit test)

- Saat tiket dibuat: ambil SLA dari kontrak aktif yang mencakup room/klien. Hitung `response_due_at` dan `resolution_due_at`. Untuk kontrak `business_hours`, waktu hanya berjalan di jam kerja company (lewati malam, Sabtu, dan Minggu). Untuk `24x7`, waktu berjalan terus. Jika tidak ada kontrak, tiket tetap dibuat tanpa SLA dan diberi label "Tanpa kontrak".
- `first_response_at` terisi saat status pertama kali berubah dari `open`.
- Status SLA: `on_track`, `at_risk` (sisa waktu < 25%), `breached`. Status `pending_part` tidak menghentikan timer (catat di DECISIONS.md).
- Jadwal PM: saat kontrak dibuat atau diubah, buat `pm_schedules` untuk setiap room dengan jarak rata = 12 / pm_visits_per_year bulan dari start_date, tanpa duplikasi. Jadwal yang lewat 7 hari tanpa kunjungan otomatis menjadi `missed` (Supabase cron / pg_cron harian; jika tidak tersedia, cek saat dashboard dimuat).
- Menyelesaikan kunjungan PM → schedule `done`; menyelesaikan kunjungan tiket → tiket `resolved`. Klien/coordinator menutup (`closed`); tiket `resolved` otomatis `closed` setelah 3 hari.
- Setiap perubahan tiket membuat `ticket_event`.

## KEAMANAN (RLS)

- Fungsi `auth_company_id()`, `auth_role()`, `auth_client_id()` (security definer).
- Semua tabel dibatasi `company_id`.
- `client_viewer`: select hanya baris dengan `client_id = auth_client_id()` (untuk sites/rooms/assets lewat join); insert tiket hanya untuk kliennya sendiri, dengan status `open`.
- `technician`: update tickets/visits hanya jika `assigned_to`/`technician_id = auth.uid()`.
- Storage bucket `attachments`, `signatures`, `reports`: private, path `company_id/...`, akses lewat signed URL.
- Tulis test RLS di `supabase/tests` untuk ketiga aturan di atas.

## HALAMAN & ROUTE

Admin/coordinator (desktop-first, tetap responsif):
- `/dashboard`: tiket terbuka per prioritas, SLA at risk/breached, PM minggu ini, kontrak habis dalam 60/30 hari, aset yang garansinya habis dalam 60 hari. Update realtime.
- `/tickets`: tabel dengan filter (status, prioritas, klien, teknisi, status SLA) dan kolom sisa waktu SLA berwarna; `/tickets/[id]`: detail, timeline event, assign, ubah status, komentar, foto.
- `/clients`, `/clients/[id]`: sites → rooms → assets dalam tree; kontrak klien.
- `/assets/[id]`: detail aset + riwayat tiket & PM.
- `/contracts`, `/contracts/[id]`: SLA, cakupan ruang, jadwal PM.
- `/pm`: kalender/list jadwal PM, assign teknisi.
- `/reports`: unduh laporan kunjungan PDF; ringkasan bulanan per klien (jumlah tiket, % SLA terpenuhi, PM selesai vs terjadwal).
- `/settings`: company, jam kerja, user & undangan, asset types & checklist.

Teknisi (`/tech`, mobile-first, PWA):
- Daftar tugas hari ini dan mendatang (tiket + PM).
- Detail tugas → tombol "Check-in" (simpan waktu & lokasi GPS jika diizinkan) → isi checklist (untuk PM) atau catatan perbaikan → foto sebelum/sesudah (kamera HP) → nama & tanda tangan klien → "Selesaikan kunjungan" → PDF laporan dibuat otomatis.

Portal klien (`/portal`):
- Buat tiket (pilih ruang/aset, prioritas, deskripsi, foto), lihat status tiket, daftar aset, unduh laporan.

## PDF LAPORAN KUNJUNGAN

Logo, nomor tiket atau PM, klien, lokasi/ruang, teknisi, waktu check-in/out dan durasi, uraian pekerjaan, hasil checklist (OK / Tidak OK / N/A + catatan), foto sebelum/sesudah (maks. 6), nama & tanda tangan klien.

## DESAIN UI

- Nuansa: ruang kontrol operasional, jelas dan cepat dipindai.
- Font: Source Sans 3 untuk semua teks, dengan angka tabular.
- Warna: latar `#F4F6F8`, surface `#FFFFFF`, teks `#18212B`, primary `#0F6B6B` (teal), P1 `#C62828`, P2 `#E65100`, P3 `#1565C0`, P4 `#546E7A`, sukses `#2E7D32`. Dark mode tersedia.
- Halaman teknisi: tombol besar (min. tinggi 48px), satu aksi utama per layar, bisa dipakai dengan satu tangan.

## SEED DATA

1 company demo; user: `admin@demo.test`, `coord@demo.test`, `tech1@demo.test`, `tech2@demo.test`, `client@demo.test` (password `demo12345`); 3 klien, 5 site, 15 room, ±60 aset; 2 kontrak aktif (satu business_hours, satu 24x7) dan 1 kontrak yang habis dalam 25 hari; 15 tiket dengan berbagai status (termasuk yang breach); jadwal PM terbentuk otomatis.

## FASE

1. Setup, skema, RLS + test RLS, seed, auth, onboarding, undangan.
2. Klien/site/room/aset + asset types & checklist.
3. Kontrak, SLA engine (`lib/sla.ts` + test), tiket & timeline, realtime.
4. Jadwal PM (`lib/pm.ts` + test) + cron.
5. Aplikasi teknisi PWA, kunjungan, foto, tanda tangan, PDF laporan.
6. Portal klien, dashboard, laporan bulanan.
7. README, `.env.example`, `DECISIONS.md`, polish mobile.

## KRITERIA SELESAI

- Client demo membuat tiket P1 → coordinator assign ke tech1 → tech1 check-in, isi catatan, foto, tanda tangan, selesai → PDF laporan tersedia untuk client dan admin.
- SLA business_hours dihitung benar melewati akhir pekan (dibuktikan dengan unit test).
- tech2 tidak bisa mengubah tiket milik tech1, dan client tidak bisa melihat data klien lain (dibuktikan dengan test RLS).
- `pnpm build` sukses.

## DI LUAR SCOPE

Billing, inventori spare part, notifikasi WhatsApp/SMS (siapkan fungsi `notify()` yang untuk sekarang hanya menulis ke tabel `notifications` dan log), dan aplikasi native.
