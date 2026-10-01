import { z } from "zod";

/** 1 inci dalam meter. */
export const INCH_M = 0.0254;
export const RAD = Math.PI / 180;

export const ASPECT_RATIOS = {
  "16:9": [16, 9],
  "16:10": [16, 10],
  "21:9": [21, 9],
  "4:3": [4, 3],
} as const;
export type AspectRatio = keyof typeof ASPECT_RATIOS;
export const aspectSchema = z.enum(["16:9", "16:10", "21:9", "4:3"]);

export type Warning = { code: string; message: string };

/** Lebar & tinggi (dalam satuan yang sama dengan diagonal) dari diagonal dan aspect ratio. */
export function sizeFromDiagonal(diagonal: number, aspect: AspectRatio) {
  const [w, h] = ASPECT_RATIOS[aspect];
  const k = diagonal / Math.hypot(w, h);
  return { width: w * k, height: h * k };
}

export function heightFromWidth(width: number, aspect: AspectRatio) {
  const [w, h] = ASPECT_RATIOS[aspect];
  return (width * h) / w;
}

export const positive = (msg = "Harus lebih dari 0") => z.number({ invalid_type_error: "Isi angka" }).positive(msg);
export const nonNegative = (msg = "Tidak boleh negatif") => z.number({ invalid_type_error: "Isi angka" }).min(0, msg);
