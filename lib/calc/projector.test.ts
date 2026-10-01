import { describe, expect, it } from "vitest";
import { calculate, defaults, schema } from "./projector";

describe("proyektor", () => {
  it("contoh spec: throw 1.5, lebar 3 m 16:9, 50 lux, bdm, gain 1 → 4.5 m, 4000 lumen", () => {
    const out = calculate({ ...defaults, throwMin: 1.5, sizeMode: "width", widthM: 3, aspect: "16:9", ambientLux: 50, contrastType: "bdm", gain: 1 });
    expect(out.distanceMinM).toBeCloseTo(4.5, 6);
    expect(out.distanceMaxM).toBeNull();
    expect(out.heightM).toBeCloseTo(1.6875, 6);
    expect(out.areaM2).toBeCloseTo(5.0625, 6);
    expect(out.lumensRaw).toBeCloseTo(3796.875, 3); // 50 × 15 × 5.0625
    expect(out.lumens).toBe(4000);
  });

  it("rentang zoom 1.4–2.24 → jarak 4.2–6.72 m", () => {
    const out = calculate({ ...defaults, throwMin: 1.4, throwMax: 2.24, widthM: 3 });
    expect(out.distanceMinM).toBeCloseTo(4.2, 6);
    expect(out.distanceMaxM).toBeCloseTo(6.72, 6);
  });

  it("input diagonal: 120 inci 16:9 → lebar 2.6566 m", () => {
    // 120 × 0.0254 = 3.048 m; √337 = 18.35756; W = 3.048 × 16 / 18.35756 = 2.65656
    const out = calculate({ ...defaults, sizeMode: "diagonal", diagonalIn: 120 });
    expect(out.widthM).toBeCloseTo(2.6566, 4);
  });

  it("gain 1.5 mengurangi lumen; adm 50:1 memperbesar", () => {
    // 50 × 50 × 5.0625 / 1.5 = 8437.5 → 8500
    const out = calculate({ ...defaults, widthM: 3, contrastType: "adm", gain: 1.5 });
    expect(out.lumens).toBe(8500);
  });

  it("throwMax < throwMin ditolak", () => {
    expect(schema.safeParse({ ...defaults, throwMin: 2, throwMax: 1 }).success).toBe(false);
  });
});
