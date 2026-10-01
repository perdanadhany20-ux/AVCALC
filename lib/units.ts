export type UnitSystem = "metric" | "imperial";
/** Besaran yang bisa dikonversi oleh toggle unit. Nilai internal selalu metrik. */
export type Quantity = "m" | "mm" | "m2" | "lux";

const SPEC: Record<Quantity, { metric: string; imperial: string; perMetric: number }> = {
  m: { metric: "m", imperial: "ft", perMetric: 1 / 0.3048 },
  mm: { metric: "mm", imperial: "in", perMetric: 1 / 25.4 },
  m2: { metric: "m²", imperial: "ft²", perMetric: 1 / (0.3048 * 0.3048) },
  lux: { metric: "lux", imperial: "fc", perMetric: 1 / 10.764 },
};

export const toDisplay = (v: number, q: Quantity | undefined, sys: UnitSystem) =>
  q && sys === "imperial" ? v * SPEC[q].perMetric : v;
export const fromDisplay = (v: number, q: Quantity | undefined, sys: UnitSystem) =>
  q && sys === "imperial" ? v / SPEC[q].perMetric : v;
export const unitLabel = (q: Quantity, sys: UnitSystem) => SPEC[q][sys];

const fmtCache = new Map<number, Intl.NumberFormat>();
/** Format angka gaya Indonesia (koma desimal), default 2 desimal. */
export function formatNumber(v: number, decimals = 2): string {
  let f = fmtCache.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    fmtCache.set(decimals, f);
  }
  return f.format(v);
}

/** Nilai + satuan sesuai sistem unit, misalnya "1,78 m" atau "5,83 ft". */
export function formatQ(v: number, q: Quantity, sys: UnitSystem, decimals = 2): string {
  return `${formatNumber(toDisplay(v, q, sys), decimals)} ${unitLabel(q, sys)}`;
}

/** Teks angka untuk kolom input: maks. 4 desimal, tanpa nol di belakang, koma desimal. */
export function formatInputNumber(v: number): string {
  if (!Number.isFinite(v)) return "";
  return String(Number(v.toFixed(4))).replace(".", ",");
}

/** Terima "1,5" maupun "1.5". Kosong → undefined, tidak valid → NaN. */
export function parseNumber(text: string): number | undefined {
  const t = text.trim().replace(/\s/g, "").replace(",", ".");
  if (t === "") return undefined;
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return Number.NaN;
  return Number(t);
}
