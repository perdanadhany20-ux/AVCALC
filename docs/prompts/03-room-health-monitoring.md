# PROMPT: Meeting Room Health Monitoring (MVP lengkap)

Kamu adalah Senior Full-Stack & Systems Engineer. Bangun sistem ini dari nol sampai berjalan, secara mandiri.

## ATURAN KERJA (WAJIB)

1. **Jangan bertanya ke user.** Semua keputusan sudah ditentukan di dokumen ini. Jika ada hal yang tidak tercakup, pilih opsi paling sederhana dan umum, lalu catat di `DECISIONS.md` (keputusan, alasan, cara mengubah). Lanjutkan tanpa berhenti.
2. Kerjakan **semua fase berurutan** sampai selesai.
3. Setiap akhir fase jalankan lint, typecheck, test, dan build untuk setiap package, lalu perbaiki semua error.
4. Tidak ada perangkat keras fisik yang tersedia. Semua pengujian memakai **simulator perangkat** yang kamu buat (lihat di bawah).
5. Service-role key hanya di server/Edge Function. Agent tidak pernah memegang service-role key.
6. Jika environment tidak mendukung sebuah perintah, selesaikan kode, tulis langkah manual di README, dan lanjutkan. Commit git per fase.

## ARSITEKTUR (FINAL)

Monorepo pnpm workspaces:

```
apps/web        Next.js 15 dashboard (App Router, TypeScript strict)
apps/agent      Node.js 20 on-site agent (TypeScript, dikompilasi ke dist/)
apps/simulator  Simulator perangkat AV (TypeScript)
packages/shared Tipe, skema zod, konstanta status
supabase/       Migration, seed, Edge Functions, test RLS
```

- Web: Supabase Auth, Postgres, RLS, Realtime, `@supabase/ssr`, Tailwind + shadcn/ui, Recharts, `@react-pdf/renderer`, Vitest.
- Edge Functions (Deno): `agent-config`, `agent-ingest`, `evaluate-alerts`.
- Agent: `serialport` (RS-232 lokal), modul `net` (TCP), `dgram` (UDP/VISCA), `ping` via child process atau paket `ping`, pino (logging), zod. Konfigurasi lewat `.env`: `API_URL`, `AGENT_TOKEN`.
- Browser tidak bisa mengakses RS-232/TCP langsung. Karena itu semua polling dilakukan oleh agent di jaringan klien.

## LOKALISASI

Dashboard dalam Bahasa Indonesia, zona waktu Asia/Jakarta.

## ROLE & TENANT

- Multi-tenant per `company`. Role: `admin`, `operator`, `client_viewer` (terikat `client_id`).
- Sign up pertama → onboarding membuat company, user menjadi admin. Undangan user via email.

## SKEMA DATABASE

Semua tabel memiliki `id uuid`, `created_at`, `company_id` (kecuali `companies`).

- `companies`, `profiles` (role, client_id nullable)
- `clients`, `sites` (client_id, name, address), `rooms` (site_id, name)
- `agents`: site_id, name, token_hash (SHA-256; token asli hanya ditampilkan sekali saat dibuat), last_seen_at, version, ip_address, is_revoked
- `devices`: room_id, agent_id, name, type enum (`display`, `projector`, `camera`, `codec`, `dsp`, `matrix`, `control`, `other`), driver enum (`ping`, `tcp`, `http`, `pjlink`, `visca_ip`, `serial_generic`), host, port, config jsonb (misalnya `pjlink_password`, `serial_path`, `baud`, `query_hex`, `expect_hex`), poll_interval_sec int default 60, is_enabled
- `device_status`: device_id, ts timestamptz, online bool, power text nullable, lamp_hours int nullable, error_code text nullable, latency_ms int nullable, raw jsonb. Index `(device_id, ts desc)`. Retensi: hapus data > 90 hari lewat pg_cron harian.
- `device_current`: device_id pk, ringkasan status terakhir (di-upsert saat ingest, untuk realtime dan dashboard cepat)
- `alert_rules`: scope (`company`, `client`, `device`), scope_id nullable, kind enum (`offline`, `lamp_hours`, `error_code`), threshold jsonb (misalnya `{minutes:5}`, `{hours:2500}`), severity enum (`warning`, `critical`), channels jsonb (`email`, `webhook`), webhook_url nullable, is_enabled
- `alerts`: device_id, rule_id, severity, message, opened_at, resolved_at nullable, acknowledged_by nullable, acknowledged_at nullable
- `notifications`: alert_id, channel, status, sent_at, error

Rule default per company (dibuat saat onboarding): offline ≥ 5 menit → critical; lamp_hours ≥ 2500 → warning; error_code tidak kosong → critical.

## ALUR AGENT

1. Start → `GET agent-config` dengan header `Authorization: Bearer AGENT_TOKEN` → menerima daftar device miliknya. Refresh konfigurasi setiap 5 menit.
2. Polling setiap device sesuai interval, maksimal 10 polling paralel, timeout 5 detik per polling.
3. Kirim batch status ke `POST agent-ingest` setiap 15 detik (atau saat 50 hasil terkumpul), sekaligus sebagai heartbeat.
4. Saat offline: simpan antrean di file JSONL lokal (maks. 10.000 entri), kirim ulang saat koneksi pulih.
5. Backoff eksponensial untuk error jaringan. Log terstruktur ke stdout.
6. Sediakan `Dockerfile` dan file unit `systemd` di `apps/agent/deploy/`.

Driver (satu file per driver di `apps/agent/src/drivers/`, dengan interface `Driver { poll(device): Promise<StatusResult> }`):
- `ping`: online + latency.
- `tcp`: koneksi ke host:port berhasil = online.
- `http`: GET ke `config.path`, status 2xx = online.
- `pjlink`: PJLink Class 1 lewat TCP 4352. Tangani autentikasi `PJLINK 1 <random>` (MD5 dari random + password) maupun `PJLINK 0`. Query `%1POWR ?`, `%1LAMP ?` (ambil jam lampu pertama), `%1ERST ?`. Petakan jawaban ERR1–ERR4 dan `ERRA` menjadi error_code.
- `visca_ip`: UDP 52381. Kirim Power Inquiry `81 09 04 00 FF` dengan header VISCA-over-IP (payload type 0x0110, sequence number). Balasan `90 50 02 FF` = on, `90 50 03 FF` = standby. Tidak ada balasan = offline.
- `serial_generic`: kirim `query_hex` ke `serial_path` dengan `baud`, bandingkan balasan dengan `expect_hex`; cocok = online.

## EDGE FUNCTIONS

- `agent-config`: validasi token (hash cocok, tidak revoked) → kembalikan device aktif milik agent.
- `agent-ingest`: validasi token + zod. Tolak status untuk device yang bukan milik agent. Insert `device_status`, upsert `device_current`, update `agents.last_seen_at`/version, lalu panggil logika evaluasi alert untuk device yang terlibat.
- `evaluate-alerts` (juga dijalankan pg_cron setiap menit): deteksi device yang `device_current.ts` > threshold offline (artinya agent/device diam), buka alert baru jika belum ada alert terbuka untuk rule+device yang sama, dan tutup alert (`resolved_at`) saat kondisi normal kembali. Kirim notifikasi: email via Resend jika `RESEND_API_KEY` ada (jika tidak, catat ke `notifications` dengan status `skipped`); webhook berupa POST JSON `{severity, message, device, room, site, client, opened_at}`.

## KEAMANAN (RLS)

- Fungsi `auth_company_id()`, `auth_role()`, `auth_client_id()`.
- Semua tabel dibatasi `company_id`. `client_viewer` hanya membaca data kliennya dan tidak bisa mengubah apa pun.
- Tabel `agents.token_hash` tidak pernah dikirim ke client (gunakan view tanpa kolom tersebut).
- Hanya admin yang membuat/mencabut agent dan mengelola alert rules. Operator bisa acknowledge alert.
- Test RLS di `supabase/tests`.

## DASHBOARD (apps/web)

- `/dashboard`: ringkasan (total device, online, warning, critical, agent offline), grid ruang dikelompokkan per klien → site dengan indikator hijau/kuning/merah/abu-abu (abu-abu = tidak ada data). Update via Realtime pada `device_current` dan `alerts`.
- `/rooms/[id]`: daftar device dan status terkini.
- `/devices/[id]`: grafik online/offline 7 hari, latency, jam lampu, tabel status terbaru, alert terkait, dan edit konfigurasi.
- `/alerts`: tabel alert terbuka & riwayat, filter severity/klien, tombol acknowledge.
- `/agents`: daftar agent + status online (last_seen < 2 menit), tombol "Buat agent" (tampilkan token sekali beserta perintah instalasi), cabut token.
- `/clients`: CRUD klien/site/ruang/device.
- `/rules`: kelola alert rules.
- `/reports`: laporan uptime bulanan per klien (uptime % per ruang & per device, jumlah alert per severity, device paling bermasalah) dalam format PDF.
- `/settings`: company, user & undangan.

Uptime % = persentase sampel `online = true` dalam periode tersebut. Jika tidak ada sampel, tampilkan "Tidak ada data".

## SIMULATOR (apps/simulator)

Jalankan `pnpm sim` untuk menyalakan perangkat virtual di localhost:
- 3 proyektor PJLink (port 4352, 4353, 4354; satu memakai password `admin`) dengan jam lampu yang naik dan kadang mengirim ERST error.
- 2 kamera VISCA-over-IP (UDP 52381, 52382).
- 2 server TCP & 1 endpoint HTTP.
- Endpoint kontrol `http://localhost:9000` untuk mematikan/menyalakan device atau memicu error, agar alert bisa diuji.

Seed menyertakan company demo, admin `admin@demo.test` / `demo12345`, 1 klien, 1 site, 3 ruang, 1 agent dengan token demo yang dicetak di README, dan device yang mengarah ke simulator.

## DESAIN UI

- Nuansa: layar NOC yang tenang; warna status adalah satu-satunya warna mencolok.
- Font: Inter Tight untuk UI, JetBrains Mono hanya untuk IP, port, dan kode error.
- Warna: latar `#EEF1F4`, surface `#FFFFFF`, teks `#141A21`, primary `#2B59C3`, online `#1F9D55`, warning `#D98E04`, critical `#D93025`, unknown `#8A94A3`. Dark mode default untuk dashboard.
- Status selalu memakai warna **dan** ikon/teks, tidak hanya warna.

## FASE

1. Monorepo, skema, RLS + test, seed, auth.
2. Edge Functions `agent-config` & `agent-ingest` + test.
3. Agent dengan driver ping, tcp, http, pjlink + antrean offline.
4. Simulator; end-to-end: agent → ingest → dashboard realtime.
5. Driver visca_ip & serial_generic (serial diuji dengan mock).
6. Alert engine, notifikasi, halaman alerts & rules.
7. Laporan uptime PDF, halaman agents, Dockerfile & systemd.
8. README lengkap (setup cloud, instalasi agent di lokasi klien, menjalankan simulator), `.env.example`, `DECISIONS.md`.

## KRITERIA SELESAI

- `pnpm sim` + `pnpm --filter agent dev` + web → dashboard menampilkan semua device simulator sebagai online secara realtime.
- Mematikan proyektor lewat endpoint kontrol simulator → alert critical terbuka dalam ≤ 6 menit; menyalakannya lagi → alert ter-resolve.
- Agent dengan token dicabut ditolak (401). Agent tidak bisa mengirim status untuk device milik agent lain.
- Unit test untuk parser PJLink (termasuk autentikasi) dan VISCA lulus. Semua build sukses.

## DI LUAR SCOPE

Kontrol perangkat jarak jauh (power on/off dari dashboard), SNMP, integrasi vendor cloud (misalnya Crestron XiO), dan billing.
