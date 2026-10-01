import * as calc from "@/lib/calc/projector";
import { H, W, dim, gridBg, titleBlock, viewport } from "@/lib/diagram/build";
import type { Shape } from "@/lib/diagram/types";
import { formatNumber, formatQ } from "@/lib/units";
import { ASPECT_OPTIONS, defineCalc } from "./types";

const CONTRAST_LABEL: Record<calc.ContrastType, string> = {
  passive: "Pasif / signage (7:1)",
  bdm: "Presentasi umum (15:1)",
  adm: "Detail / analitis (50:1)",
  full_motion: "Video full motion (80:1)",
};
const SCREEN_BOTTOM = 0.9;

export const projector = defineCalc({
  id: "projector",
  slug: "proyektor",
  title: "Jarak proyeksi & kecerahan proyektor",
  navTitle: "Proyektor",
  metaDescription:
    "Hitung jarak proyeksi dari throw ratio dan estimasi lumen proyektor yang dibutuhkan berdasarkan cahaya ambien, gain layar, dan target kontras.",
  intro: "Masukkan throw ratio, ukuran layar, dan kondisi cahaya ruang.",
  schema: calc.schema,
  defaults: calc.defaults,
  calculate: calc.calculate,
  groups: { throw: { label: "Lensa" }, screen: { label: "Layar" }, light: { label: "Cahaya" } },
  fields: [
    { kind: "number", name: "throwMin", label: "Throw ratio (min. zoom)", unit: ": 1", group: "throw" },
    { kind: "number", name: "throwMax", label: "Throw ratio (maks. zoom)", unit: ": 1", optional: true, group: "throw", hint: "Kosongkan untuk lensa tanpa zoom." },
    {
      kind: "select",
      name: "sizeMode",
      label: "Ukuran layar dari",
      group: "screen",
      options: [
        { value: "width", label: "Lebar layar" },
        { value: "diagonal", label: "Diagonal" },
      ],
    },
    { kind: "number", name: "widthM", label: "Lebar layar", quantity: "m", group: "screen", showIf: (v) => v.sizeMode === "width" },
    { kind: "number", name: "diagonalIn", label: "Diagonal layar", unit: "inci", group: "screen", showIf: (v) => v.sizeMode === "diagonal" },
    { kind: "select", name: "aspect", label: "Aspect ratio", options: ASPECT_OPTIONS, group: "screen" },
    { kind: "number", name: "gain", label: "Gain layar", group: "screen" },
    { kind: "number", name: "ambientLux", label: "Cahaya ambien pada layar", quantity: "lux", group: "light" },
    {
      kind: "select",
      name: "contrastType",
      label: "Jenis tampilan",
      group: "light",
      options: (Object.keys(CONTRAST_LABEL) as calc.ContrastType[]).map((k) => ({ value: k, label: CONTRAST_LABEL[k] })),
    },
  ],
  summarize: (_i, o, u) => ({
    results: [
      { label: "Lumen yang dibutuhkan", value: o.lumens, unit: "lumen", decimals: 0, primary: true, estimate: true },
      o.distanceMaxM === null
        ? { label: "Jarak proyeksi", value: o.distanceMinM, quantity: "m", primary: true }
        : { label: "Jarak proyeksi", value: `${formatQ(o.distanceMinM, "m", u)} – ${formatQ(o.distanceMaxM, "m", u)}`, primary: true },
      { label: "Ukuran gambar", value: `${formatQ(o.widthM, "m", u)} × ${formatQ(o.heightM, "m", u)}` },
      { label: "Diagonal", value: o.diagonalIn, unit: "inci", decimals: 1 },
      { label: "Luas layar", value: o.areaM2, quantity: "m2" },
      { label: "Target kontras", value: `${o.contrast} : 1` },
      { label: "Lumen sebelum pembulatan", value: o.lumensRaw, unit: "lumen", decimals: 1, estimate: true },
    ],
    warnings: o.warnings.map((w) => w.message),
  }),
  diagram: (i, o, u) => {
    const far = o.distanceMaxM ?? o.distanceMinM;
    const top = SCREEN_BOTTOM + o.heightM;
    const lensY = SCREEN_BOTTOM + o.heightM / 2;
    // proyektor di kiri (x = 0), layar di x = far
    const v = viewport({ minX: -0.7, maxX: far + 0.4, minY: 0, maxY: Math.max(top, 2.2) + 0.2 });
    const s: Shape[] = [...gridBg()];
    const screenX = far;
    const projX = far - o.distanceMinM;
    s.push({ kind: "line", x1: v.x(-0.7), y1: v.y(0), x2: v.x(far + 0.4), y2: v.y(0), tone: "line", sw: 1.5 });
    s.push({ kind: "rect", x: v.x(screenX), y: v.y(top), w: Math.max(3, 0.05 * v.s), h: o.heightM * v.s, tone: "accent", fill: "accent", fillOpacity: 0.85 });
    s.push(...dim(v.x(screenX) + 6, v.y(SCREEN_BOTTOM), v.x(screenX) + 6, v.y(top), `H ${formatQ(o.heightM, "m", u)}`, { labelSide: "left" }));

    const box = (x: number, ghost: boolean) => {
      const bw = 0.42;
      const bh = 0.16;
      s.push({ kind: "rect", x: v.x(x - bw), y: v.y(lensY + bh / 2), w: bw * v.s, h: bh * v.s, tone: ghost ? "muted" : "line", fill: ghost ? "none" : "surface", dash: ghost, sw: 1.3 });
      s.push({ kind: "line", x1: v.x(x), y1: v.y(lensY), x2: v.x(screenX), y2: v.y(top), tone: ghost ? "muted" : "line", dash: ghost, sw: 0.9 });
      s.push({ kind: "line", x1: v.x(x), y1: v.y(lensY), x2: v.x(screenX), y2: v.y(SCREEN_BOTTOM), tone: ghost ? "muted" : "line", dash: ghost, sw: 0.9 });
    };
    if (o.distanceMaxM !== null) {
      box(far - o.distanceMaxM, true);
      s.push(...dim(v.x(far - o.distanceMaxM), v.y(0), v.x(screenX), v.y(0), `Maks. ${formatQ(o.distanceMaxM, "m", u)}`, { offset: 36, tone: "muted" }));
    }
    box(projX, false);
    s.push(...dim(v.x(projX), v.y(0), v.x(screenX), v.y(0), `${o.distanceMaxM !== null ? "Min. " : ""}${formatQ(o.distanceMinM, "m", u)}`, { offset: 16 }));
    s.push({ kind: "text", x: v.x(projX) - 4, y: v.y(lensY + 0.08) - 8, text: `Throw ${formatNumber(i.throwMin, 2)}`, anchor: "end", size: 10, tone: "muted" });
    s.push(...titleBlock("Tampak samping", "Lensa sejajar tengah layar, tanpa skala"));
    return { width: W, height: H, label: "Diagram tampak samping jarak proyeksi", shapes: s };
  },
  formulas: [
    "Jarak proyeksi = throw ratio × lebar layar",
    "Luas layar A = lebar × tinggi",
    "Target kontras: pasif 7:1, presentasi 15:1, analitis 50:1, full motion 80:1",
    "Lumen = cahaya ambien (lux) × kontras × A ÷ gain, dibulatkan ke atas ke kelipatan 500",
  ],
  note: "Kebutuhan lumen adalah estimasi. Periksa juga penurunan kecerahan lampu/laser seiring umur pemakaian.",
});
