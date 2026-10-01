import * as calc from "@/lib/calc/screen";
import { H, W, dim, gridBg, titleBlock, viewport } from "@/lib/diagram/build";
import type { Shape } from "@/lib/diagram/types";
import { formatNumber, formatQ } from "@/lib/units";
import { ASPECT_OPTIONS, defineCalc, type Row } from "./types";

const VIEW_LABEL: Record<calc.ViewType, string> = {
  adm: "Detail / analitis (ADM)",
  bdm: "Presentasi umum (BDM)",
  passive: "Signage / video (pasif)",
};
const EYE = 1.2;
const SCREEN_BOTTOM = 0.9;

export const screen = defineCalc({
  id: "screen",
  slug: "ukuran-layar",
  title: "Ukuran layar & jarak pandang",
  navTitle: "Ukuran layar",
  metaDescription:
    "Hitung ukuran display minimum dari jarak penonton terjauh dengan rule of thumb 4/6/8, lengkap dengan rekomendasi ukuran standar dan cek jarak terdekat.",
  intro: "Masukkan jarak penonton terjauh dan jenis tampilan untuk mendapatkan ukuran layar minimum.",
  schema: calc.schema,
  defaults: calc.defaults,
  calculate: calc.calculate,
  groups: { advanced: { label: "Pengaturan lanjut", collapsible: true } },
  fields: [
    {
      kind: "select",
      name: "mode",
      label: "Hitung dari",
      options: [
        { value: "forward", label: "Jarak penonton → ukuran layar" },
        { value: "reverse", label: "Ukuran layar → jarak maksimum" },
      ],
    },
    { kind: "number", name: "farthestM", label: "Jarak penonton terjauh", quantity: "m", showIf: (v) => v.mode === "forward" },
    { kind: "number", name: "nearestM", label: "Jarak penonton terdekat", quantity: "m", showIf: (v) => v.mode === "forward" },
    { kind: "number", name: "diagonalIn", label: "Diagonal layar", unit: "inci", showIf: (v) => v.mode === "reverse" },
    { kind: "select", name: "aspect", label: "Aspect ratio", options: ASPECT_OPTIONS },
    {
      kind: "select",
      name: "viewType",
      label: "Jenis tampilan",
      options: calc.VIEW_TYPES.map((v) => ({ value: v, label: VIEW_LABEL[v] })),
    },
    { kind: "number", name: "factorAdm", label: "Faktor ADM", unit: "×", group: "advanced" },
    { kind: "number", name: "factorBdm", label: "Faktor BDM", unit: "×", group: "advanced" },
    { kind: "number", name: "factorPassive", label: "Faktor pasif", unit: "×", group: "advanced" },
  ],
  summarize: (input, out, u) => {
    const size: Row[] = [
      { label: "Tinggi gambar", value: out.heightM, quantity: "m" },
      { label: "Lebar gambar", value: out.widthM, quantity: "m" },
      { label: "Diagonal", value: out.diagonalM, quantity: "m" },
    ];
    if (out.mode === "reverse") {
      return {
        results: [
          ...calc.VIEW_TYPES.map<Row>((t) => ({
            label: `Jarak terjauh maks., ${VIEW_LABEL[t].toLowerCase()}`,
            value: out.maxDistanceM[t],
            quantity: "m",
            primary: t === input.viewType,
            estimate: true,
          })),
          ...size,
        ],
        warnings: out.warnings.map((w) => w.message),
      };
    }
    return {
      results: [
        out.recommendedIn !== null
          ? { label: "Rekomendasi display", value: out.recommendedIn, unit: "inci", decimals: 0, primary: true, estimate: true }
          : { label: "Rekomendasi", value: "LED video wall atau proyektor", primary: true, tone: "warn" },
        { label: "Diagonal minimum", value: out.diagonalIn, unit: "inci", decimals: 1, primary: true },
        ...size,
        { label: "Faktor dipakai", value: `H = D ÷ ${formatNumber(out.factor, 2)}` },
        {
          label: "Cek jarak terdekat",
          value: out.nearestOk ? "Aman (≥ 1× lebar gambar)" : `Terlalu dekat, minimal ${formatQ(out.widthM, "m", u)}`,
          tone: out.nearestOk ? "ok" : "warn",
        },
      ],
      warnings: out.warnings.map((w) => w.message),
    };
  },
  diagram: (input, out, u) => {
    const forward = out.mode === "forward";
    const far = forward ? input.farthestM : out.maxDistanceM[input.viewType];
    const near = forward ? input.nearestM : null;
    const top = SCREEN_BOTTOM + out.heightM;
    const v = viewport({ minX: -0.6, maxX: far + 0.9, minY: 0, maxY: Math.max(top, 2) + 0.2 });
    const s: Shape[] = [...gridBg()];
    // lantai
    s.push({ kind: "line", x1: v.x(-0.6), y1: v.y(0), x2: v.x(far + 0.9), y2: v.y(0), tone: "line", sw: 1.5 });
    // dinding + layar
    s.push({ kind: "line", x1: v.x(-0.08), y1: v.y(0), x2: v.x(-0.08), y2: v.y(top + 0.3), tone: "muted", sw: 1 });
    s.push({ kind: "rect", x: v.x(-0.06), y: v.y(top), w: 0.06 * v.s, h: out.heightM * v.s, tone: "accent", fill: "accent", fillOpacity: 0.85, sw: 1 });
    s.push(...dim(v.x(-0.06), v.y(SCREEN_BOTTOM), v.x(-0.06), v.y(top), `H ${formatQ(out.heightM, "m", u)}`, { offset: 0, labelSide: "left" }));
    s.push({ kind: "text", x: v.x(0.08), y: v.y(top) - 8, text: `${formatNumber(out.diagonalIn, 1)} inci`, size: 12, tone: "accent", bold: true });

    const viewer = (x: number, tone: "line" | "accent") => {
      s.push({ kind: "circle", cx: v.x(x), cy: v.y(EYE + 0.12), r: Math.max(4, 0.12 * v.s), tone, fill: "surface", sw: 1.2 });
      s.push({ kind: "path", d: `M ${v.x(x)} ${v.y(EYE)} L ${v.x(x)} ${v.y(0.45)} L ${v.x(x - 0.35)} ${v.y(0.45)} L ${v.x(x - 0.35)} ${v.y(0)}`, tone, fill: "none", sw: 1.2 });
    };
    // garis pandang dari penonton terjauh
    s.push({ kind: "line", x1: v.x(far), y1: v.y(EYE), x2: v.x(0), y2: v.y(top), tone: "line", dash: true, sw: 0.8 });
    s.push({ kind: "line", x1: v.x(far), y1: v.y(EYE), x2: v.x(0), y2: v.y(SCREEN_BOTTOM), tone: "line", dash: true, sw: 0.8 });
    viewer(far, "line");
    s.push(...dim(v.x(0), v.y(0), v.x(far), v.y(0), `${forward ? "Terjauh" : "Maks."} ${formatQ(far, "m", u)}`, { offset: 34 }));
    if (near !== null && near > 0 && near < far) {
      viewer(near, out.mode === "forward" && !out.nearestOk ? "accent" : "line");
      s.push(...dim(v.x(0), v.y(0), v.x(near), v.y(0), `Terdekat ${formatQ(near, "m", u)}`, { offset: 16, tone: out.mode === "forward" && !out.nearestOk ? "warn" : "line" }));
    }
    s.push(...titleBlock("Tampak samping", `Mata duduk ${formatQ(EYE, "m", u)}, tanpa skala`));
    return { width: W, height: H, label: "Diagram tampak samping layar dan posisi penonton", shapes: s };
  },
  formulas: [
    "Tinggi gambar H = D ÷ faktor (ADM 4, BDM 6, pasif 8)",
    "Lebar W = H × (rasio lebar ÷ rasio tinggi)",
    "Diagonal = √(W² + H²); inci = meter ÷ 0,0254",
    "Rekomendasi = ukuran standar terkecil ≥ diagonal (43–110 inci)",
    "Jarak terdekat minimal 1 × lebar gambar",
    "Mode terbalik: jarak maksimum = H × faktor",
  ],
  note: "Rule of thumb 4/6/8. Untuk desain final, gunakan standar AVIXA DISCAS.",
});
