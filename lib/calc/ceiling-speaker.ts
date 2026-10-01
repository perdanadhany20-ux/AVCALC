import { z } from "zod";
import { RAD, nonNegative, positive, type Warning } from "./common";

export const PATTERN_FACTOR = { edge_to_edge: 1, minimum_overlap: 0.707, edge_to_center: 0.5 } as const;
export type Pattern = keyof typeof PATTERN_FACTOR;

export const schema = z.object({
  lengthM: positive(),
  widthM: positive(),
  ceilingM: positive(),
  earM: nonNegative(),
  dispersionDeg: positive().max(179.9, "Harus kurang dari 180°"),
  pattern: z.enum(["edge_to_edge", "minimum_overlap", "edge_to_center"]),
});
export type Input = z.infer<typeof schema>;

export const defaults: Input = {
  lengthM: 10,
  widthM: 7,
  ceilingM: 3,
  earM: 1.2,
  dispersionDeg: 90,
  pattern: "minimum_overlap",
};

export type Output = {
  valid: boolean;
  h: number;
  coverageDiameterM: number;
  spacingM: number;
  cols: number;
  rows: number;
  count: number;
  /** Jarak aktual antar speaker setelah grid dibagi rata. */
  actualSpacingXM: number;
  actualSpacingYM: number;
  positions: { x: number; y: number }[];
  warnings: Warning[];
};

export function calculate(input: Input): Output {
  const h = input.ceilingM - input.earM;
  if (h <= 0) {
    return {
      valid: false,
      h,
      coverageDiameterM: 0,
      spacingM: 0,
      cols: 0,
      rows: 0,
      count: 0,
      actualSpacingXM: 0,
      actualSpacingYM: 0,
      positions: [],
      warnings: [{ code: "h_non_positive", message: "Tinggi plafon harus lebih tinggi dari tinggi telinga." }],
    };
  }
  const coverageDiameterM = 2 * h * Math.tan((input.dispersionDeg * RAD) / 2);
  const spacingM = coverageDiameterM * PATTERN_FACTOR[input.pattern];
  const cols = Math.ceil(input.lengthM / spacingM);
  const rows = Math.ceil(input.widthM / spacingM);
  const actualSpacingXM = input.lengthM / cols;
  const actualSpacingYM = input.widthM / rows;
  const positions: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({ x: (c + 0.5) * actualSpacingXM, y: (r + 0.5) * actualSpacingYM });
    }
  }
  return {
    valid: true,
    h,
    coverageDiameterM,
    spacingM,
    cols,
    rows,
    count: cols * rows,
    actualSpacingXM,
    actualSpacingYM,
    positions,
    warnings: [],
  };
}
