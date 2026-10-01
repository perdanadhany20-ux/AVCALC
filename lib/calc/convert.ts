import { z } from "zod";
import { INCH_M, aspectSchema, heightFromWidth, positive, sizeFromDiagonal, type Warning } from "./common";

export const LENGTH_TO_M = { m: 1, ft: 0.3048, in: INCH_M, mm: 0.001 } as const;
export type LengthUnit = keyof typeof LENGTH_TO_M;
export const LUX_PER_FC = 10.764;
export const NITS_PER_FL = 3.426;

export const convertLength = (value: number, from: LengthUnit) => {
  const m = value * LENGTH_TO_M[from];
  return { m, ft: m / LENGTH_TO_M.ft, in: m / LENGTH_TO_M.in, mm: m / LENGTH_TO_M.mm };
};
export const luxToFc = (lux: number) => lux / LUX_PER_FC;
export const fcToLux = (fc: number) => fc * LUX_PER_FC;
export const nitsToFl = (nits: number) => nits / NITS_PER_FL;
export const flToNits = (fl: number) => fl * NITS_PER_FL;
export const dbToPowerRatio = (db: number) => 10 ** (db / 10);
export const powerRatioToDb = (ratio: number) => 10 * Math.log10(ratio);

const num = z.number({ invalid_type_error: "Isi angka" });

export const schema = z.object({
  lengthValue: num,
  lengthUnit: z.enum(["m", "ft", "in", "mm"]),
  illumValue: num.min(0, "Tidak boleh negatif"),
  illumUnit: z.enum(["lux", "fc"]),
  lumValue: num.min(0, "Tidak boleh negatif"),
  lumUnit: z.enum(["nits", "fL"]),
  diagDirection: z.enum(["diagonal", "width"]),
  diagValue: positive(),
  diagAspect: aspectSchema,
  dbDirection: z.enum(["db", "ratio"]),
  dbValue: num,
});
export type Input = z.infer<typeof schema>;

export const defaults: Input = {
  lengthValue: 1,
  lengthUnit: "m",
  illumValue: 500,
  illumUnit: "lux",
  lumValue: 500,
  lumUnit: "nits",
  diagDirection: "diagonal",
  diagValue: 86,
  diagAspect: "16:9",
  dbDirection: "db",
  dbValue: 3,
};

export type Output = {
  length: Record<LengthUnit, number>;
  lux: number;
  fc: number;
  nits: number;
  fL: number;
  /** Semua ukuran diagonal dalam inci. */
  diagonalIn: number;
  widthIn: number;
  heightIn: number;
  db: number | null;
  ratio: number | null;
  warnings: Warning[];
};

export function calculate(input: Input): Output {
  const warnings: Warning[] = [];
  const lux = input.illumUnit === "lux" ? input.illumValue : fcToLux(input.illumValue);
  const nits = input.lumUnit === "nits" ? input.lumValue : flToNits(input.lumValue);

  let diagonalIn: number;
  let widthIn: number;
  let heightIn: number;
  if (input.diagDirection === "diagonal") {
    diagonalIn = input.diagValue;
    const s = sizeFromDiagonal(diagonalIn, input.diagAspect);
    widthIn = s.width;
    heightIn = s.height;
  } else {
    widthIn = input.diagValue;
    heightIn = heightFromWidth(widthIn, input.diagAspect);
    diagonalIn = Math.hypot(widthIn, heightIn);
  }

  let db: number | null;
  let ratio: number | null;
  if (input.dbDirection === "db") {
    db = input.dbValue;
    ratio = dbToPowerRatio(db);
  } else if (input.dbValue > 0) {
    ratio = input.dbValue;
    db = powerRatioToDb(ratio);
  } else {
    ratio = input.dbValue;
    db = null;
    warnings.push({ code: "ratio_non_positive", message: "Rasio daya harus lebih dari 0 untuk dikonversi ke dB." });
  }

  return {
    length: convertLength(input.lengthValue, input.lengthUnit),
    lux,
    fc: luxToFc(lux),
    nits,
    fL: nitsToFl(nits),
    diagonalIn,
    widthIn,
    heightIn,
    db,
    ratio,
    warnings,
  };
}
