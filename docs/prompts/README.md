# Prompt spesifikasi platform AV

| File | Platform | Status |
|---|---|---|
| `04-av-design-calculators.md` | AV Room Design Calculators | **Repo ini.** Fase 1–6 selesai |
| `01-av-proposal-bom-generator.md` | AV Proposal & BOM Generator | Belum dibangun |
| `02-av-service-maintenance.md` | AV Service & Maintenance Platform | Belum dibangun |
| `03-room-health-monitoring.md` | Meeting Room Health Monitoring | Belum dibangun |

Setiap prompt adalah aplikasi terpisah yang dibangun dari nol di repo masing-masing. Untuk membangunnya di Claude Code:

```bash
mkdir av-proposal && cd av-proposal && git init
cp ../avcalc/docs/prompts/01-av-proposal-bom-generator.md ./SPEC.md
claude
```

Lalu beri perintah: `Baca SPEC.md dan kerjakan semua fase sampai kriteria selesai terpenuhi. Jangan bertanya.`

Urutan yang disarankan: 01 → 02 → 03. Prompt 03 paling berat karena berupa monorepo dengan agent dan simulator.
