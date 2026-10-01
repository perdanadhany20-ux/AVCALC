import { describe, expect, it } from "vitest";
import { calculate, convertLength, dbToPowerRatio, defaults, flToNits, fcToLux, luxToFc, nitsToFl, powerRatioToDb } from "./convert";

describe("konversi", () => {
  it("panjang: 1 m = 3.2808 ft = 39.37 in = 1000 mm", () => {
    const r = convertLength(1, "m");
    expect(r.ft).toBeCloseTo(3.2808, 4);
    expect(r.in).toBeCloseTo(39.3701, 4);
    expect(r.mm).toBeCloseTo(1000, 6);
    expect(convertLength(12, "in").ft).toBeCloseTo(1, 6);
  });

  it("iluminasi: 1 fc = 10.764 lux; 500 lux = 46.45 fc", () => {
    expect(fcToLux(1)).toBeCloseTo(10.764, 6);
    expect(luxToFc(500)).toBeCloseTo(46.45, 2);
  });

  it("luminansi: 1 fL = 3.426 nits; 500 nits = 145.94 fL", () => {
    expect(flToNits(1)).toBeCloseTo(3.426, 6);
    expect(nitsToFl(500)).toBeCloseTo(145.94, 2);
  });

  it("dB ↔ rasio daya: 3 dB = 1.995×, 10× = 10 dB", () => {
    expect(dbToPowerRatio(3)).toBeCloseTo(1.995, 3);
    expect(powerRatioToDb(10)).toBeCloseTo(10, 6);
    expect(powerRatioToDb(2)).toBeCloseTo(3.0103, 4);
  });

  it("diagonal 86 inci 16:9 → 74.96 × 42.16 inci; dan sebaliknya", () => {
    // 86 × 16/√337 = 74.955; 86 × 9/√337 = 42.162
    const a = calculate({ ...defaults, diagDirection: "diagonal", diagValue: 86 });
    expect(a.widthIn).toBeCloseTo(74.96, 2);
    expect(a.heightIn).toBeCloseTo(42.16, 2);
    const b = calculate({ ...defaults, diagDirection: "width", diagValue: a.widthIn });
    expect(b.diagonalIn).toBeCloseTo(86, 6);
  });

  it("rasio ≤ 0 menghasilkan peringatan", () => {
    const out = calculate({ ...defaults, dbDirection: "ratio", dbValue: 0 });
    expect(out.db).toBeNull();
    expect(out.warnings).toHaveLength(1);
  });
});
