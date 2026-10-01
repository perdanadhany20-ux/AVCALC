import * as calc from "@/lib/calc/led";
import { H, W, dim, gridBg, titleBlock, viewport } from "@/lib/diagram/build";
import type { Shape } from "@/lib/diagram/types";
import { formatNumber, formatQ, type UnitSystem } from "@/lib/units";
import { defineCalc, type Row } from "./types";

const layoutText = (l: calc.Layout, u: UnitSystem) =>
  `${l.cols} × ${l.rows} (${formatQ(l.widthM, "m", u)} × ${formatQ(l.heightM, "m", u)})`;

export const led = defineCalc({
  id: "led",
  slug: "led",
  title: "LED video wall",
  navTitle: "LED video wall",
  metaDescription:
    "Hitung jumlah kabinet, resolusi total, ukuran aktual, jarak pandang, daya, arus 220 V, dan berat LED video wall dari pixel pitch dan ukuran target.",
  intro: "Masukkan pixel pitch, ukuran kabinet, dan ukuran dinding yang diinginkan.",
  schema: calc.schema,
  defaults: calc.defaults,
  calculate: calc.calculate,
  groups: {
    cabinet: { label: "Kabinet" },
    target: { label: "Ukuran target" },
    power: { label: "Daya & berat per kabinet" },
  },
  fields: [
    { kind: "number", name: "pitchMm", label: "Pixel pitch", unit: "mm", group: "cabinet" },
    {
      kind: "select",
      name: "cabinetPreset",
      label: "Ukuran kabinet",
      group: "cabinet",
      options: [
        { value: "500x500", label: "500 × 500 mm" },
        { value: "500x1000", label: "500 × 1000 mm" },
        { value: "600x337.5", label: "600 × 337,5 mm" },
        { value: "640x480", label: "640 × 480 mm" },
        { value: "custom", label: "Ukuran lain" },
      ],
    },
    { kind: "number", name: "cabinetWMm", label: "Lebar kabinet", quantity: "mm", group: "cabinet", showIf: (v) => v.cabinetPreset === "custom" },
    { kind: "number", name: "cabinetHMm", label: "Tinggi kabinet", quantity: "mm", group: "cabinet", showIf: (v) => v.cabinetPreset === "custom" },
    {
      kind: "number",
      name: "cabinetResX",
      label: "Resolusi kabinet horizontal",
      unit: "px",
      optional: true,
      group: "cabinet",
      hint: "Kosongkan untuk otomatis (ukuran ÷ pitch).",
      placeholder: (v) => auto(v, "x"),
    },
    {
      kind: "number",
      name: "cabinetResY",
      label: "Resolusi kabinet vertikal",
      unit: "px",
      optional: true,
      group: "cabinet",
      placeholder: (v) => auto(v, "y"),
    },
    { kind: "number", name: "targetWM", label: "Lebar dinding", quantity: "m", group: "target" },
    { kind: "number", name: "targetHM", label: "Tinggi dinding", quantity: "m", group: "target" },
    { kind: "number", name: "powerMaxW", label: "Daya maksimum", unit: "W", group: "power" },
    { kind: "number", name: "powerAvgW", label: "Daya rata-rata", unit: "W", group: "power" },
    { kind: "number", name: "weightKg", label: "Berat", unit: "kg", group: "power" },
  ],
  summarize: (_input, o, u) => {
    const rows: Row[] = [
      { label: "Susunan kabinet", value: `${o.cols} × ${o.rows}`, unit: "kabinet", primary: true },
      { label: "Resolusi total", value: `${o.resX} × ${o.resY}`, unit: "px", primary: true },
      { label: "Ukuran aktual", value: `${formatQ(o.widthM, "m", u)} × ${formatQ(o.heightM, "m", u)}` },
      { label: "Pembulatan ke bawah", value: layoutText(o.options.floor, u) },
      { label: "Pembulatan ke atas", value: layoutText(o.options.ceil, u) },
      { label: "Aspect ratio aktual", value: `${formatNumber(o.aspect, 2)} : 1` },
      { label: "Diagonal", value: o.diagonalIn, unit: "inci", decimals: 1 },
      { label: "Resolusi per kabinet", value: `${o.cabinetResX} × ${o.cabinetResY}`, unit: "px" },
      { label: "Jarak pandang minimum", value: o.minViewM, quantity: "m", estimate: true },
      { label: "Jarak pandang nyaman", value: o.comfortViewM, quantity: "m", estimate: true },
      { label: "Jumlah kabinet", value: o.cabinets, decimals: 0 },
      { label: "Daya total maksimum", value: o.powerMaxTotalW, unit: "W", decimals: 0 },
      { label: "Daya total rata-rata", value: o.powerAvgTotalW, unit: "W", decimals: 0 },
      { label: "Arus maksimum (220 V)", value: o.currentMaxA, unit: "A" },
      { label: "Arus rata-rata (220 V)", value: o.currentAvgA, unit: "A" },
      { label: "Berat total", value: o.weightTotalKg, unit: "kg" },
    ];
    return { results: rows, warnings: o.warnings.map((w) => w.message) };
  },
  diagram: (input, o, u) => {
    const v = viewport({
      minX: 0,
      maxX: Math.max(o.widthM, input.targetWM),
      minY: 0,
      maxY: Math.max(o.heightM, input.targetHM),
    }, { x: 60, y: 24, w: W - 150, h: H - 100 });
    const s: Shape[] = [...gridBg()];
    const cw = o.cabinetWMm / 1000;
    const ch = o.cabinetHMm / 1000;
    for (let r = 0; r < o.rows; r++) {
      for (let c = 0; c < o.cols; c++) {
        s.push({ kind: "rect", x: v.x(c * cw), y: v.y((r + 1) * ch), w: cw * v.s, h: ch * v.s, tone: "line", fill: "accent", fillOpacity: 0.12, sw: 0.8 });
      }
    }
    s.push({ kind: "rect", x: v.x(0), y: v.y(o.heightM), w: o.widthM * v.s, h: o.heightM * v.s, tone: "line", fill: "none", sw: 1.8 });
    s.push({ kind: "rect", x: v.x(0), y: v.y(input.targetHM), w: input.targetWM * v.s, h: input.targetHM * v.s, tone: "warn", fill: "none", dash: true, sw: 1.2 });
    s.push({ kind: "text", x: v.x(o.widthM / 2), y: v.y(o.heightM / 2) + 5, text: `${o.resX} × ${o.resY} px`, anchor: "middle", size: 14, tone: "text", bold: true });
    s.push(...dim(v.x(0), v.y(0), v.x(o.widthM), v.y(0), formatQ(o.widthM, "m", u), { offset: 22 }));
    s.push(...dim(v.x(o.widthM), v.y(0), v.x(o.widthM), v.y(o.heightM), formatQ(o.heightM, "m", u), { offset: 0 }));
    s.push({ kind: "line", x1: 16, y1: H - 26, x2: 40, y2: H - 26, tone: "warn", dash: true, sw: 1.2 });
    s.push({ kind: "text", x: 46, y: H - 22, text: "Ukuran target", size: 10, tone: "muted" });
    s.push(...titleBlock("Tampak depan", `${o.cols} × ${o.rows} kabinet, P${formatNumber(input.pitchMm, 2)}`));
    return { width: W, height: H, label: "Diagram tampak depan susunan kabinet LED", shapes: s };
  },
  formulas: [
    "Resolusi kabinet = ukuran kabinet ÷ pitch (dibulatkan)",
    "Kolom = round(lebar target mm ÷ lebar kabinet); baris = round(tinggi target mm ÷ tinggi kabinet); .5 dibulatkan ke atas",
    "Resolusi total = kolom × res. kabinet X, baris × res. kabinet Y",
    "Jarak pandang minimum ≈ pitch (mm) × 1 m; nyaman ≈ pitch × 3 m",
    "Arus = daya ÷ 220 V",
  ],
  note: "Jarak pandang adalah estimasi. Daya dan berat mengikuti datasheet kabinet yang Anda masukkan.",
});

function auto(v: Record<string, unknown>, axis: "x" | "y"): string | undefined {
  const preset = v.cabinetPreset as calc.CabinetPreset;
  const pitch = v.pitchMm as number;
  if (!(pitch > 0)) return undefined;
  const [w, h] = calc.cabinetSize({ cabinetPreset: preset, cabinetWMm: v.cabinetWMm as number, cabinetHMm: v.cabinetHMm as number });
  const size = axis === "x" ? w : h;
  return Number.isFinite(size) ? `Otomatis: ${Math.round(size / pitch)}` : undefined;
}
