import { z } from "zod";
import { RAD, positive, type Warning } from "./common";

const angle = positive().max(179.9, "Harus kurang dari 180°");

export const schema = z
  .object({
    distanceM: positive(),
    frameWidthM: positive(),
    hfovWide: angle,
    hfovTele: angle,
    opticalZoom: positive().optional(),
  })
  .refine((v) => v.hfovTele <= v.hfovWide, {
    path: ["hfovTele"],
    message: "HFOV tele harus ≤ HFOV wide",
  });
export type Input = z.infer<typeof schema>;

export const defaults: Input = {
  distanceM: 5,
  frameWidthM: 2,
  hfovWide: 70,
  hfovTele: 6.5,
  opticalZoom: 12,
};

export type Status = "ok" | "too_wide" | "too_narrow";

export type Output = {
  requiredHfov: number;
  status: Status;
  frameAtWideM: number;
  frameAtTeleM: number;
  /** Jarak minimum agar lebar frame muat pada posisi wide. */
  minDistanceM: number;
  /** Jarak maksimum agar lebar frame masih bisa dicapai pada posisi tele. */
  maxDistanceM: number;
  warnings: Warning[];
};

export const frameWidthAt = (distance: number, hfovDeg: number) => 2 * distance * Math.tan((hfovDeg * RAD) / 2);

export function calculate(input: Input): Output {
  const requiredHfov = (2 * Math.atan(input.frameWidthM / (2 * input.distanceM))) / RAD;
  const status: Status =
    requiredHfov > input.hfovWide ? "too_wide" : requiredHfov < input.hfovTele ? "too_narrow" : "ok";

  const warnings: Warning[] = [];
  if (status === "too_wide") {
    warnings.push({ code: "too_wide", message: "Terlalu lebar, kamera harus dimundurkan atau pakai lensa lebih lebar." });
  } else if (status === "too_narrow") {
    warnings.push({ code: "too_narrow", message: "Terlalu sempit, subjek tidak bisa di-zoom sedekat itu." });
  }

  return {
    requiredHfov,
    status,
    frameAtWideM: frameWidthAt(input.distanceM, input.hfovWide),
    frameAtTeleM: frameWidthAt(input.distanceM, input.hfovTele),
    minDistanceM: input.frameWidthM / (2 * Math.tan((input.hfovWide * RAD) / 2)),
    maxDistanceM: input.frameWidthM / (2 * Math.tan((input.hfovTele * RAD) / 2)),
    warnings,
  };
}
