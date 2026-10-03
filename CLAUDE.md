# AVCalc: konteks untuk Claude Code

Kalkulator desain ruang AV (Next.js 15 + Supabase). Spec asli: `docs/prompts/04-av-design-calculators.md` (6 kalkulator gratis tanpa login + tier Pro (project, PDF bermerek, share link)). Prompt tiga platform lain ada di `docs/prompts/`, bukan bagian repo ini. Fase 1–6 sudah selesai, lihat `git log`.

## Perintah
- `pnpm dev` | `pnpm build` | `pnpm lint` | `pnpm typecheck` | `pnpm test`
- `pnpm test:rls`: pgTAP via `supabase test db` (butuh `supabase start`)
- `pnpm test:rls:local`: RLS di Postgres biasa tanpa Docker (PGHOST/PGPORT/PGUSER)
- `pnpm pro:grant <email> <bulan>`

Wajib sebelum commit: lint, typecheck, test, build bersih.

## Peta kode (baca seperlunya, jangan scan semua)
- `lib/calc/<nama>.ts`: rumus murni + zod, tanpa UI. Rumus harus persis spec, dan setiap rumus wajib punya test angka manual.
- `lib/present/<nama>.ts`: field form, ringkasan hasil, diagram, rumus. Dipakai bersama oleh web, PDF, dan halaman share.
- `lib/present/registry.ts`: daftar kalkulator, `run()`, `formatRow()`, `inputRows()`.
- `lib/diagram/`: primitif diagram netral → `components/diagram/diagram-svg.tsx` (web) dan `lib/pdf/project-pdf.tsx` (PDF).
- `components/calc/`: UI kalkulator generik (form dibangkitkan dari definisi), `save-to-project.tsx`.
- `app/projects/actions.ts`: semua server action project, ruang, kalkulasi, dan share.
- `lib/share.ts`: baca halaman share dengan service role setelah validasi slug.
- `supabase/migrations/20260927000000_init.sql`: skema, RLS, trigger batas gratis, bucket logos.
- `supabase/tests/rls.test.sql`: 22 assertion RLS.

## Aturan
- Satuan internal selalu metrik. Toggle imperial hanya untuk tampilan (`lib/units.ts`). URL query menyimpan nilai metrik non-default.
- Batas gratis/Pro ditegakkan di DB (trigger + RLS + column grant). Jangan memindahkan pengecekan ini hanya ke frontend.
- `SUPABASE_SERVICE_ROLE_KEY` hanya di `lib/supabase/admin.ts`, `lib/share.ts`, `scripts/`. Jangan pernah dipakai di client component.
- Kalkulator baru: tambah `lib/calc` + test, `lib/present`, daftarkan di registry, lalu update check constraint `calculations.calculator` lewat migration baru.
- Keputusan di luar spec dicatat di `DECISIONS.md`.
- UI Bahasa Indonesia, angka berformat id-ID, zona waktu Asia/Jakarta.

## Belum diverifikasi (butuh Supabase berjalan)
Alur end-to-end berikut belum diuji: signup/login (password & magic link), simpan ke project, dialog upgrade dari error DB, ekspor PDF dari project (gratis vs Pro + logo), share link incognito, `pro:grant`. Langkahnya ada di README bagian "Uji manual kriteria selesai".
