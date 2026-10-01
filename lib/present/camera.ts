import * as calc from "@/lib/calc/camera";
import { RAD } from "@/lib/calc/common";
import { H, W, dim, gridBg, titleBlock, viewport } from "@/lib/diagram/build";
import type { Shape } from "@/lib/diagram/types";
import { formatNumber, formatQ } from "@/lib/units";
import { defineCalc, type Row } from "./types";

const STATUS: Record<calc.Status, string> = {
  ok: "Bisa",
  too_wide: "Terlalu lebar",
  too_narrow: "Terlalu sempit",
};

export const camera = defineCalc({
  id: "camera",
  slug: "kamera",
  title: "Kamera PTZ & field of view",
  navTitle: "Kamera PTZ",
  metaDescription:
    "Cek apakah kamera PTZ bisa membingkai lebar subjek pada jarak tertentu dari HFOV wide dan tele, lengkap dengan diagram kerucut FOV tampak atas.",
  intro: "Masukkan jarak kamera ke subjek, lebar frame yang diinginkan, dan HFOV kamera.",
  schema: calc.schema,
  defaults: calc.defaults,
  calculate: calc.calculate,
  fields: [
    { kind: "number", name: "distanceM", label: "Jarak kamera ke subjek", quantity: "m" },
    { kind: "number", name: "frameWidthM", label: "Lebar frame yang diinginkan", quantity: "m" },
    { kind: "number", name: "hfovWide", label: "HFOV wide", unit: "°" },
    { kind: "number", name: "hfovTele", label: "HFOV tele", unit: "°" },
    { kind: "number", name: "opticalZoom", label: "Zoom optik", unit: "×", optional: true, hint: "Hanya informasi." },
  ],
  summarize: (i, o, u) => {
    const rows: Row[] = [
      { label: "HFOV yang dibutuhkan", value: o.requiredHfov, unit: "°", primary: true },
      { label: "Status", value: STATUS[o.status], tone: o.status === "ok" ? "ok" : "warn", primary: true },
      { label: `Lebar frame pada wide (${formatNumber(i.hfovWide, 1)}°)`, value: o.frameAtWideM, quantity: "m" },
      { label: `Lebar frame pada tele (${formatNumber(i.hfovTele, 1)}°)`, value: o.frameAtTeleM, quantity: "m" },
      { label: "Rentang jarak kamera yang memungkinkan", value: `${formatQ(o.minDistanceM, "m", u)} – ${formatQ(o.maxDistanceM, "m", u)}` },
    ];
    if (i.opticalZoom !== undefined) rows.push({ label: "Zoom optik", value: i.opticalZoom, unit: "×", decimals: 0 });
    return { results: rows, warnings: o.warnings.map((w) => w.message) };
  },
  diagram: (i, o, u) => {
    const reach = i.distanceM * 1.15;
    const halfSpan = (deg: number) => Math.tan((Math.min(deg, 170) * RAD) / 2) * reach;
    const yMax = Math.max(i.frameWidthM / 2, Math.min(halfSpan(i.hfovWide), reach * 0.6)) * 1.15;
    const v = viewport({ minX: -0.3, maxX: reach, minY: -yMax, maxY: yMax });
    const s: Shape[] = [...gridBg()];
    const cone = (deg: number, tone: "muted" | "accent" | "line", fill: boolean, dash: boolean) => {
      const hs = Math.min(halfSpan(deg), yMax);
      const x = hs < halfSpan(deg) ? (yMax / Math.tan((Math.min(deg, 170) * RAD) / 2)) : reach;
      s.push({
        kind: "path",
        d: `M ${v.x(0)} ${v.y(0)} L ${v.x(x)} ${v.y(hs)} L ${v.x(x)} ${v.y(-hs)} Z`,
        tone,
        fill: fill ? tone : "none",
        fillOpacity: fill ? 0.16 : 0,
        dash,
        sw: 1,
      });
    };
    cone(i.hfovWide, "muted", false, true);
    cone(i.hfovTele, "line", false, true);
    cone(o.requiredHfov, "accent", true, false);
    // subjek
    s.push({ kind: "line", x1: v.x(i.distanceM), y1: v.y(i.frameWidthM / 2), x2: v.x(i.distanceM), y2: v.y(-i.frameWidthM / 2), tone: o.status === "ok" ? "accent" : "warn", sw: 3 });
    s.push(...dim(v.x(i.distanceM), v.y(i.frameWidthM / 2), v.x(i.distanceM), v.y(-i.frameWidthM / 2), formatQ(i.frameWidthM, "m", u), { labelSide: "right" }));
    s.push(...dim(v.x(0), v.y(-yMax * 0.82), v.x(i.distanceM), v.y(-yMax * 0.82), formatQ(i.distanceM, "m", u)));
    // kamera
    s.push({ kind: "rect", x: v.x(0) - 14, y: v.y(0) - 7, w: 14, h: 14, tone: "line", fill: "surface", sw: 1.4 });
    s.push({ kind: "text", x: v.x(0) + 10, y: v.y(0) - 10, text: `${formatNumber(o.requiredHfov, 2)}°`, size: 12, tone: "accent", bold: true });
    s.push({ kind: "line", x1: 16, y1: H - 40, x2: 40, y2: H - 40, tone: "muted", dash: true, sw: 1 });
    s.push({ kind: "text", x: 46, y: H - 36, text: "Wide", size: 10, tone: "muted" });
    s.push({ kind: "line", x1: 16, y1: H - 24, x2: 40, y2: H - 24, tone: "line", dash: true, sw: 1 });
    s.push({ kind: "text", x: 46, y: H - 20, text: "Tele", size: 10, tone: "muted" });
    s.push(...titleBlock("Tampak atas", "Kerucut FOV horizontal"));
    return { width: W, height: H, label: "Diagram tampak atas kerucut field of view kamera", shapes: s };
  },
  formulas: [
    "HFOV dibutuhkan = 2 × atan(lebar ÷ (2 × jarak))",
    "Lebar frame pada jarak = 2 × jarak × tan(HFOV ÷ 2)",
    "Bisa jika HFOV tele ≤ HFOV dibutuhkan ≤ HFOV wide",
  ],
});
