import * as calc from "@/lib/calc/ceiling-speaker";
import { H, W, dim, gridBg, titleBlock, viewport } from "@/lib/diagram/build";
import type { Shape } from "@/lib/diagram/types";
import { formatQ } from "@/lib/units";
import { defineCalc } from "./types";

const PATTERN_LABEL: Record<calc.Pattern, string> = {
  edge_to_edge: "Tepi ke tepi (jarak = d)",
  minimum_overlap: "Overlap minimum (jarak = 0,707 d)",
  edge_to_center: "Tepi ke tengah (jarak = d ÷ 2)",
};

export const ceilingSpeaker = defineCalc({
  id: "ceiling-speaker",
  slug: "speaker-plafon",
  title: "Cakupan speaker plafon",
  navTitle: "Speaker plafon",
  metaDescription:
    "Hitung diameter cakupan, jarak antar speaker, dan jumlah speaker plafon untuk pola tepi ke tepi, overlap minimum, atau tepi ke tengah.",
  intro: "Masukkan ukuran ruang, tinggi plafon, dan sudut dispersi speaker.",
  schema: calc.schema,
  defaults: calc.defaults,
  calculate: calc.calculate,
  groups: { room: { label: "Ruang" }, speaker: { label: "Speaker" } },
  fields: [
    { kind: "number", name: "lengthM", label: "Panjang ruang", quantity: "m", group: "room" },
    { kind: "number", name: "widthM", label: "Lebar ruang", quantity: "m", group: "room" },
    { kind: "number", name: "ceilingM", label: "Tinggi plafon", quantity: "m", group: "room" },
    { kind: "number", name: "earM", label: "Tinggi telinga", quantity: "m", group: "room", hint: "Duduk 1,2 m (3,9 ft), berdiri 1,7 m (5,6 ft)." },
    { kind: "number", name: "dispersionDeg", label: "Sudut dispersi", unit: "°", group: "speaker" },
    {
      kind: "select",
      name: "pattern",
      label: "Pola penempatan",
      group: "speaker",
      options: (Object.keys(PATTERN_LABEL) as calc.Pattern[]).map((k) => ({ value: k, label: PATTERN_LABEL[k] })),
    },
  ],
  summarize: (_i, o, u) => ({
    results: o.valid
      ? [
          { label: "Jumlah speaker", value: o.count, unit: "unit", decimals: 0, primary: true },
          { label: "Grid", value: `${o.cols} × ${o.rows}`, primary: true },
          { label: "Jarak plafon ke telinga (h)", value: o.h, quantity: "m" },
          { label: "Diameter cakupan (d)", value: o.coverageDiameterM, quantity: "m" },
          { label: "Jarak antar speaker maksimum", value: o.spacingM, quantity: "m" },
          { label: "Jarak aktual (panjang × lebar)", value: `${formatQ(o.actualSpacingXM, "m", u)} × ${formatQ(o.actualSpacingYM, "m", u)}` },
        ]
      : [{ label: "Jumlah speaker", value: "Tidak bisa dihitung", tone: "warn", primary: true }],
    warnings: o.warnings.map((w) => w.message),
  }),
  diagram: (i, o, u) => {
    if (!o.valid) return null;
    const pad = Math.max(0.3, o.coverageDiameterM / 2 - Math.min(o.actualSpacingXM, o.actualSpacingYM) / 2 + 0.2);
    const v = viewport({ minX: -pad, maxX: i.lengthM + pad, minY: -pad, maxY: i.widthM + pad });
    const s: Shape[] = [...gridBg()];
    s.push({ kind: "rect", x: v.x(0), y: v.y(i.widthM), w: i.lengthM * v.s, h: i.widthM * v.s, tone: "line", fill: "surface", sw: 2 });
    const r = (o.coverageDiameterM / 2) * v.s;
    for (const p of o.positions) {
      s.push({ kind: "circle", cx: v.x(p.x), cy: v.y(p.y), r, tone: "accent", fill: "accent", fillOpacity: 0.1, sw: 0.8 });
    }
    for (const p of o.positions) {
      s.push({ kind: "circle", cx: v.x(p.x), cy: v.y(p.y), r: 3.5, tone: "line", fill: "line", sw: 1 });
    }
    s.push({ kind: "rect", x: v.x(0), y: v.y(i.widthM), w: i.lengthM * v.s, h: i.widthM * v.s, tone: "line", fill: "none", sw: 2 });
    s.push(...dim(v.x(0), v.y(0), v.x(i.lengthM), v.y(0), formatQ(i.lengthM, "m", u), { offset: 16 }));
    s.push(...dim(v.x(0), v.y(0), v.x(0), v.y(i.widthM), formatQ(i.widthM, "m", u), { labelSide: "left" }));
    if (o.cols > 1) {
      const a = o.positions[0];
      const b = o.positions[1];
      if (a && b) s.push(...dim(v.x(a.x), v.y(a.y), v.x(b.x), v.y(b.y), formatQ(o.actualSpacingXM, "m", u), { offset: -12, tone: "accent" }));
    }
    s.push(...titleBlock("Tampak atas", `Lingkaran = cakupan pada ${formatQ(i.earM, "m", u)}`));
    return { width: W, height: H, label: "Diagram tampak atas grid speaker plafon dan lingkaran cakupan", shapes: s };
  },
  formulas: [
    "h = tinggi plafon − tinggi telinga",
    "Diameter cakupan d = 2 × h × tan(dispersi ÷ 2)",
    "Jarak antar speaker: tepi ke tepi = d; overlap minimum = d × 0,707; tepi ke tengah = d ÷ 2",
    "Jumlah = ceil(panjang ÷ jarak) × ceil(lebar ÷ jarak), lalu dibagi rata",
  ],
});
