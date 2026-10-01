import { z } from "zod";
import { INCH_M, positive, nonNegative, type Warning } from "./common";

export const CABINET_PRESETS = {
  "500x500": [500, 500],
  "500x1000": [500, 1000],
  "600x337.5": [600, 337.5],
  "640x480": [640, 480],
} as const;
export type CabinetPreset = keyof typeof CABINET_PRESETS | "custom";

/** Tegangan untuk perhitungan arus. */
export const VOLTAGE = 220;
export const UHD = { x: 3840, y: 2160 } as const;

const optionalPositiveInt = z.number().int("Harus bilangan bulat").positive("Harus lebih dari 0").optional();

export const schema = z.object({
  pitchMm: positive(),
  cabinetPreset: z.enum(["500x500", "500x1000", "600x337.5", "640x480", "custom"]),
  cabinetWMm: positive(),
  cabinetHMm: positive(),
  cabinetResX: optionalPositiveInt,
  cabinetResY: optionalPositiveInt,
  targetWM: positive(),
  targetHM: positive(),
  powerMaxW: nonNegative(),
  powerAvgW: nonNegative(),
  weightKg: nonNegative(),
});
export type Input = z.infer<typeof schema>;

export const defaults: Input = {
  pitchMm: 2.5,
  cabinetPreset: "500x500",
  cabinetWMm: 500,
  cabinetHMm: 500,
  targetWM: 4,
  targetHM: 2.25,
  powerMaxW: 180,
  powerAvgW: 60,
  weightKg: 7.5,
};

export type Layout = { cols: number; rows: number; widthM: number; heightM: number };

export type Output = {
  cabinetWMm: number;
  cabinetHMm: number;
  cabinetResX: number;
  cabinetResY: number;
  autoResX: number;
  autoResY: number;
  cols: number;
  rows: number;
  options: { floor: Layout; round: Layout; ceil: Layout };
  cabinets: number;
  widthM: number;
  heightM: number;
  resX: number;
  resY: number;
  aspect: number;
  diagonalM: number;
  diagonalIn: number;
  minViewM: number;
  comfortViewM: number;
  powerMaxTotalW: number;
  powerAvgTotalW: number;
  currentMaxA: number;
  currentAvgA: number;
  weightTotalKg: number;
  warnings: Warning[];
};

export function cabinetSize(input: Pick<Input, "cabinetPreset" | "cabinetWMm" | "cabinetHMm">): [number, number] {
  if (input.cabinetPreset === "custom") return [input.cabinetWMm, input.cabinetHMm];
  const [w, h] = CABINET_PRESETS[input.cabinetPreset];
  return [w, h];
}

export function calculate(input: Input): Output {
  const [cw, ch] = cabinetSize(input);
  const autoResX = Math.round(cw / input.pitchMm);
  const autoResY = Math.round(ch / input.pitchMm);
  const cabinetResX = input.cabinetResX ?? autoResX;
  const cabinetResY = input.cabinetResY ?? autoResY;

  const tw = (input.targetWM * 1000) / cw;
  const th = (input.targetHM * 1000) / ch;
  const layout = (f: (n: number) => number): Layout => {
    const cols = Math.max(1, f(tw));
    const rows = Math.max(1, f(th));
    return { cols, rows, widthM: (cols * cw) / 1000, heightM: (rows * ch) / 1000 };
  };
  // Math.round membulatkan .5 ke atas (4.5 → 5).
  const options = { floor: layout(Math.floor), round: layout(Math.round), ceil: layout(Math.ceil) };
  const { cols, rows, widthM, heightM } = options.round;

  const cabinets = cols * rows;
  const resX = cols * cabinetResX;
  const resY = rows * cabinetResY;
  const diagonalM = Math.hypot(widthM, heightM);
  const powerMaxTotalW = cabinets * input.powerMaxW;
  const powerAvgTotalW = cabinets * input.powerAvgW;

  const warnings: Warning[] = [];
  if (resX > UHD.x || resY > UHD.y || resX * resY > UHD.x * UHD.y) {
    warnings.push({
      code: "exceeds_4k",
      message: `Resolusi total ${resX}×${resY} melebihi 3840×2160. Butuh lebih dari satu input atau processor 4K.`,
    });
  }

  return {
    cabinetWMm: cw,
    cabinetHMm: ch,
    cabinetResX,
    cabinetResY,
    autoResX,
    autoResY,
    cols,
    rows,
    options,
    cabinets,
    widthM,
    heightM,
    resX,
    resY,
    aspect: resX / resY,
    diagonalM,
    diagonalIn: diagonalM / INCH_M,
    minViewM: input.pitchMm * 1,
    comfortViewM: input.pitchMm * 3,
    powerMaxTotalW,
    powerAvgTotalW,
    currentMaxA: powerMaxTotalW / VOLTAGE,
    currentAvgA: powerAvgTotalW / VOLTAGE,
    weightTotalKg: cabinets * input.weightKg,
    warnings,
  };
}
