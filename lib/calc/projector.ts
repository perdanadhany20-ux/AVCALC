import { z } from "zod";
import { INCH_M, aspectSchema, heightFromWidth, nonNegative, positive, sizeFromDiagonal, type Warning } from "./common";

export const CONTRAST_TARGETS = { passive: 7, bdm: 15, adm: 50, full_motion: 80 } as const;
export type ContrastType = keyof typeof CONTRAST_TARGETS;

export const schema = z
  .object({
    throwMin: positive(),
    throwMax: positive().optional(),
    sizeMode: z.enum(["width", "diagonal"]),
    widthM: positive(),
    diagonalIn: positive(),
    aspect: aspectSchema,
    ambientLux: nonNegative(),
    gain: positive(),
    contrastType: z.enum(["passive", "bdm", "adm", "full_motion"]),
  })
  .refine((v) => v.throwMax === undefined || v.throwMax >= v.throwMin, {
    path: ["throwMax"],
    message: "Throw ratio maksimum harus ≥ minimum",
  });
export type Input = z.infer<typeof schema>;

export const defaults: Input = {
  throwMin: 1.5,
  sizeMode: "width",
  widthM: 3,
  diagonalIn: 120,
  aspect: "16:9",
  ambientLux: 50,
  gain: 1,
  contrastType: "bdm",
};

export type Output = {
  widthM: number;
  heightM: number;
  diagonalIn: number;
  areaM2: number;
  distanceMinM: number;
  distanceMaxM: number | null;
  contrast: number;
  lumensRaw: number;
  lumens: number;
  warnings: Warning[];
};

export function calculate(input: Input): Output {
  let widthM: number;
  let heightM: number;
  if (input.sizeMode === "width") {
    widthM = input.widthM;
    heightM = heightFromWidth(widthM, input.aspect);
  } else {
    const s = sizeFromDiagonal(input.diagonalIn * INCH_M, input.aspect);
    widthM = s.width;
    heightM = s.height;
  }
  const areaM2 = widthM * heightM;
  const contrast = CONTRAST_TARGETS[input.contrastType];
  const lumensRaw = (input.ambientLux * contrast * areaM2) / input.gain;
  const lumens = Math.ceil(lumensRaw / 500) * 500;

  const warnings: Warning[] = [];
  if (input.ambientLux === 0) {
    warnings.push({ code: "dark_room", message: "Cahaya ambien 0 lux: kebutuhan lumen ditentukan oleh keinginan, bukan rumus kontras." });
  }

  return {
    widthM,
    heightM,
    diagonalIn: Math.hypot(widthM, heightM) / INCH_M,
    areaM2,
    distanceMinM: input.throwMin * widthM,
    distanceMaxM: input.throwMax !== undefined ? input.throwMax * widthM : null,
    contrast,
    lumensRaw,
    lumens,
    warnings,
  };
}
