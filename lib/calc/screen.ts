import { z } from "zod";
import { ASPECT_RATIOS, INCH_M, aspectSchema, positive, nonNegative, sizeFromDiagonal, type Warning } from "./common";

export const VIEW_TYPES = ["adm", "bdm", "passive"] as const;
export type ViewType = (typeof VIEW_TYPES)[number];

/** Ukuran display standar (inci) untuk rekomendasi. */
export const STANDARD_DISPLAY_SIZES_IN = [43, 50, 55, 65, 75, 86, 98, 100, 110] as const;

export const schema = z.object({
  mode: z.enum(["forward", "reverse"]),
  farthestM: positive(),
  nearestM: nonNegative(),
  aspect: aspectSchema,
  viewType: z.enum(VIEW_TYPES),
  diagonalIn: positive(),
  factorAdm: positive(),
  factorBdm: positive(),
  factorPassive: positive(),
});
export type Input = z.infer<typeof schema>;

export const defaults: Input = {
  mode: "forward",
  farthestM: 6,
  nearestM: 2,
  aspect: "16:9",
  viewType: "bdm",
  diagonalIn: 86,
  factorAdm: 4,
  factorBdm: 6,
  factorPassive: 8,
};

type Size = { heightM: number; widthM: number; diagonalM: number; diagonalIn: number };

export type Output =
  | (Size & {
      mode: "forward";
      factor: number;
      recommendedIn: number | null;
      nearestOk: boolean;
      warnings: Warning[];
    })
  | (Size & {
      mode: "reverse";
      maxDistanceM: Record<ViewType, number>;
      warnings: Warning[];
    });

export function factorFor(input: Input, type: ViewType): number {
  return type === "adm" ? input.factorAdm : type === "bdm" ? input.factorBdm : input.factorPassive;
}

export function calculate(input: Input): Output {
  const [rw, rh] = ASPECT_RATIOS[input.aspect];

  if (input.mode === "reverse") {
    const diagonalM = input.diagonalIn * INCH_M;
    const { width, height } = sizeFromDiagonal(diagonalM, input.aspect);
    return {
      mode: "reverse",
      heightM: height,
      widthM: width,
      diagonalM,
      diagonalIn: input.diagonalIn,
      maxDistanceM: {
        adm: height * input.factorAdm,
        bdm: height * input.factorBdm,
        passive: height * input.factorPassive,
      },
      warnings: [],
    };
  }

  const factor = factorFor(input, input.viewType);
  const heightM = input.farthestM / factor;
  const widthM = heightM * (rw / rh);
  const diagonalM = Math.hypot(widthM, heightM);
  const diagonalIn = diagonalM / INCH_M;
  const recommendedIn = STANDARD_DISPLAY_SIZES_IN.find((s) => s >= diagonalIn) ?? null;
  const nearestOk = input.nearestM >= widthM;

  const warnings: Warning[] = [];
  if (recommendedIn === null) {
    warnings.push({
      code: "too_large",
      message: "Diagonal melebihi 110 inci. Pertimbangkan LED video wall atau proyektor.",
    });
  }
  if (!nearestOk) {
    warnings.push({
      code: "nearest_too_close",
      message: "Penonton terdekat lebih dekat dari 1× lebar gambar. Mundurkan baris depan atau perkecil layar.",
    });
  }
  if (input.nearestM > input.farthestM) {
    warnings.push({ code: "nearest_gt_farthest", message: "Jarak terdekat lebih besar dari jarak terjauh." });
  }

  return { mode: "forward", factor, heightM, widthM, diagonalM, diagonalIn, recommendedIn, nearestOk, warnings };
}
