import { describe, expect, it } from "vitest";
import { calculate, defaults } from "./led";

describe("LED video wall", () => {
  const base = { ...defaults, pitchMm: 2.5, cabinetPreset: "500x500" as const, targetWM: 4, targetHM: 2.25 };

  it("contoh spec: P2.5, 500×500, 4 × 2.25 m → 8 × 5, 1600×1000", () => {
    const out = calculate(base);
    expect(out.cabinetResX).toBe(200); // 500 / 2.5
    expect(out.cabinetResY).toBe(200);
    expect(out.cols).toBe(8); // round(4000 / 500)
    expect(out.rows).toBe(5); // round(2250 / 500 = 4.5) → 5 (.5 dibulatkan ke atas)
    expect(out.resX).toBe(1600);
    expect(out.resY).toBe(1000);
    expect(out.widthM).toBeCloseTo(4, 6);
    expect(out.heightM).toBeCloseTo(2.5, 6);
    expect(out.aspect).toBeCloseTo(1.6, 6);
    expect(out.options.floor).toMatchObject({ cols: 8, rows: 4 });
    expect(out.options.ceil).toMatchObject({ cols: 8, rows: 5 });
    expect(out.warnings).toHaveLength(0);
  });

  it("daya, arus 220 V, berat, jarak pandang", () => {
    // 40 kabinet × 180 W = 7200 W → 32.73 A; 40 × 60 = 2400 W → 10.91 A; 40 × 7.5 = 300 kg
    const out = calculate(base);
    expect(out.cabinets).toBe(40);
    expect(out.powerMaxTotalW).toBe(7200);
    expect(out.currentMaxA).toBeCloseTo(32.73, 2);
    expect(out.currentAvgA).toBeCloseTo(10.91, 2);
    expect(out.weightTotalKg).toBe(300);
    expect(out.minViewM).toBe(2.5);
    expect(out.comfortViewM).toBe(7.5);
    // diagonal √(4² + 2.5²) = 4.717 m = 185.7 in
    expect(out.diagonalIn).toBeCloseTo(185.7, 1);
  });

  it("resolusi kabinet bisa ditimpa manual", () => {
    const out = calculate({ ...base, cabinetResX: 192, cabinetResY: 192 });
    expect(out.resX).toBe(8 * 192);
    expect(out.autoResX).toBe(200);
  });

  it("peringatan jika melebihi 3840×2160", () => {
    // P1.5 → 333 px per kabinet; 8 × 333 = 2664 lebar, 5 × 333 = 1665 tinggi → piksel 4.43 jt (< 8.29 jt), aman
    expect(calculate({ ...base, pitchMm: 1.5 }).warnings).toHaveLength(0);
    // target 8 × 4.5 m pada P1.5 → 16 × 9 kabinet → 5328 × 2997
    const out = calculate({ ...base, pitchMm: 1.5, targetWM: 8, targetHM: 4.5 });
    expect(out.resX).toBe(5328);
    expect(out.warnings[0]?.code).toBe("exceeds_4k");
  });

  it("kabinet custom dipakai jika preset custom", () => {
    const out = calculate({ ...base, cabinetPreset: "custom", cabinetWMm: 400, cabinetHMm: 300 });
    expect(out.cols).toBe(10); // 4000 / 400
    expect(out.rows).toBe(8); // round(7.5) = 8
  });
});
