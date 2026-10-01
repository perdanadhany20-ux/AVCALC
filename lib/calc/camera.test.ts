import { describe, expect, it } from "vitest";
import { calculate, defaults, schema } from "./camera";

describe("kamera PTZ / FOV", () => {
  it("contoh spec: jarak 5 m, lebar 2 m → HFOV 22.62°", () => {
    // 2 × atan(2 / 10) = 2 × 11.3099° = 22.6199°
    const out = calculate({ ...defaults, distanceM: 5, frameWidthM: 2 });
    expect(out.requiredHfov).toBeCloseTo(22.62, 2);
    expect(out.status).toBe("ok");
  });

  it("lebar frame pada wide 70° di 5 m = 7.00 m", () => {
    // 2 × 5 × tan(35°) = 10 × 0.70021 = 7.0021
    const out = calculate({ ...defaults, distanceM: 5, hfovWide: 70 });
    expect(out.frameAtWideM).toBeCloseTo(7.0, 2);
  });

  it("terlalu lebar jika HFOV dibutuhkan > wide", () => {
    // 2 × atan(8 / 4) = 126.87° > 70°
    const out = calculate({ ...defaults, distanceM: 2, frameWidthM: 8 });
    expect(out.status).toBe("too_wide");
  });

  it("terlalu sempit jika HFOV dibutuhkan < tele", () => {
    // 2 × atan(0.5 / 30) = 1.91° < 6.5°
    const out = calculate({ ...defaults, distanceM: 15, frameWidthM: 0.5 });
    expect(out.status).toBe("too_narrow");
  });

  it("tele > wide ditolak", () => {
    expect(schema.safeParse({ ...defaults, hfovWide: 10, hfovTele: 20 }).success).toBe(false);
  });
});
