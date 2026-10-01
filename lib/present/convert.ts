import * as calc from "@/lib/calc/convert";
import { ASPECT_OPTIONS, defineCalc, type Row } from "./types";

const LENGTH_LABEL: Record<calc.LengthUnit, string> = { m: "meter (m)", ft: "kaki (ft)", in: "inci (in)", mm: "milimeter (mm)" };

export const convert = defineCalc({
  id: "convert",
  slug: "konversi",
  title: "Konversi satuan AV",
  navTitle: "Konversi",
  metaDescription:
    "Konversi panjang (m, ft, in, mm), lux ke foot-candle, nits ke foot-lambert, diagonal ke lebar dan tinggi layar, serta dB ke rasio daya.",
  intro: "Setiap bagian bekerja sendiri. Ubah angka di kiri, hasil muncul di kanan.",
  schema: calc.schema,
  defaults: calc.defaults,
  calculate: calc.calculate,
  groups: {
    length: { label: "Panjang" },
    illum: { label: "Iluminasi" },
    lum: { label: "Luminansi" },
    diag: { label: "Diagonal layar" },
    db: { label: "Desibel" },
  },
  fields: [
    { kind: "number", name: "lengthValue", label: "Nilai", group: "length" },
    {
      kind: "select",
      name: "lengthUnit",
      label: "Dari satuan",
      group: "length",
      options: (Object.keys(LENGTH_LABEL) as calc.LengthUnit[]).map((k) => ({ value: k, label: LENGTH_LABEL[k] })),
    },
    { kind: "number", name: "illumValue", label: "Nilai", group: "illum" },
    { kind: "select", name: "illumUnit", label: "Dari satuan", group: "illum", options: [{ value: "lux", label: "lux" }, { value: "fc", label: "foot-candle (fc)" }] },
    { kind: "number", name: "lumValue", label: "Nilai", group: "lum" },
    { kind: "select", name: "lumUnit", label: "Dari satuan", group: "lum", options: [{ value: "nits", label: "nits (cd/m²)" }, { value: "fL", label: "foot-lambert (fL)" }] },
    {
      kind: "select",
      name: "diagDirection",
      label: "Masukkan",
      group: "diag",
      options: [
        { value: "diagonal", label: "Diagonal → lebar & tinggi" },
        { value: "width", label: "Lebar → diagonal & tinggi" },
      ],
    },
    { kind: "number", name: "diagValue", label: "Ukuran", unit: "inci", group: "diag" },
    { kind: "select", name: "diagAspect", label: "Aspect ratio", options: ASPECT_OPTIONS, group: "diag" },
    {
      kind: "select",
      name: "dbDirection",
      label: "Masukkan",
      group: "db",
      options: [
        { value: "db", label: "dB → rasio daya" },
        { value: "ratio", label: "Rasio daya → dB" },
      ],
    },
    { kind: "number", name: "dbValue", label: "Nilai", group: "db" },
  ],
  summarize: (_i, o) => {
    const cm = (inch: number) => `${(inch * 2.54).toLocaleString("id-ID", { maximumFractionDigits: 1 })} cm`;
    const rows: Row[] = [
      { section: "Panjang", label: "Meter", value: o.length.m, unit: "m", decimals: 4 },
      { section: "Panjang", label: "Kaki", value: o.length.ft, unit: "ft", decimals: 4 },
      { section: "Panjang", label: "Inci", value: o.length.in, unit: "in", decimals: 2 },
      { section: "Panjang", label: "Milimeter", value: o.length.mm, unit: "mm", decimals: 1 },
      { section: "Iluminasi", label: "Lux", value: o.lux, unit: "lux" },
      { section: "Iluminasi", label: "Foot-candle", value: o.fc, unit: "fc" },
      { section: "Luminansi", label: "Nits", value: o.nits, unit: "nits" },
      { section: "Luminansi", label: "Foot-lambert", value: o.fL, unit: "fL" },
      { section: "Diagonal layar", label: "Diagonal", value: o.diagonalIn, unit: "inci", decimals: 1 },
      { section: "Diagonal layar", label: "Lebar", value: `${o.widthIn.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} inci (${cm(o.widthIn)})` },
      { section: "Diagonal layar", label: "Tinggi", value: `${o.heightIn.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} inci (${cm(o.heightIn)})` },
      { section: "Desibel", label: "dB", value: o.db ?? "—", unit: o.db === null ? undefined : "dB" },
      { section: "Desibel", label: "Rasio daya", value: o.ratio ?? 0, unit: "×", decimals: 4 },
    ];
    return { results: rows, warnings: o.warnings.map((w) => w.message) };
  },
  formulas: [
    "1 ft = 0,3048 m; 1 in = 25,4 mm",
    "1 foot-candle = 10,764 lux",
    "1 foot-lambert = 3,426 nits",
    "Lebar = diagonal × rasio lebar ÷ √(lebar² + tinggi²)",
    "dB = 10 × log₁₀(rasio daya); rasio = 10^(dB ÷ 10)",
  ],
});
