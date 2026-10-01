import { describe, expect, it } from "vitest";
import { calculate, defaults, schema } from "./screen";

describe("ukuran layar", () => {
  it("contoh spec: D = 6 m, bdm, 16:9 → 80.3 inci → 86 inci", () => {
    const out = calculate({ ...defaults, farthestM: 6, nearestM: 2, viewType: "bdm", aspect: "16:9" });
    expect(out.mode).toBe("forward");
    if (out.mode !== "forward") return;
    expect(out.heightM).toBeCloseTo(1.0, 2); // 6 / 6
    expect(out.widthM).toBeCloseTo(1.78, 2); // 1 × 16/9 = 1.7778
    expect(out.diagonalM).toBeCloseTo(2.04, 2); // √(1.7778² + 1²) = 2.0397
    expect(out.diagonalIn).toBeCloseTo(80.3, 1); // 2.0397 / 0.0254 = 80.30
    expect(out.recommendedIn).toBe(86);
    expect(out.nearestOk).toBe(true); // 2 ≥ 1.78
  });

  it("adm memakai faktor 4: D = 8 m → H = 2 m", () => {
    const out = calculate({ ...defaults, farthestM: 8, viewType: "adm" });
    expect(out.heightM).toBeCloseTo(2, 6);
  });

  it("> 110 inci menyarankan LED/proyektor", () => {
    // D = 12 m, passive (8) → H 1.5, W 2.6667, diag 3.0596 m = 120.5 in
    const out = calculate({ ...defaults, farthestM: 12, viewType: "passive" });
    if (out.mode !== "forward") throw new Error();
    expect(out.diagonalIn).toBeCloseTo(120.45, 1);
    expect(out.recommendedIn).toBeNull();
    expect(out.warnings.map((w) => w.code)).toContain("too_large");
  });

  it("peringatan jika jarak terdekat < lebar gambar", () => {
    const out = calculate({ ...defaults, farthestM: 6, nearestM: 1.5 });
    if (out.mode !== "forward") throw new Error();
    expect(out.nearestOk).toBe(false);
    expect(out.warnings.map((w) => w.code)).toContain("nearest_too_close");
  });

  it("mode terbalik: 86 inci 16:9 → H = 1.0708 m, jarak maks 4.28 / 6.42 / 8.57 m", () => {
    // diag 86 × 0.0254 = 2.1844 m; H = 2.1844 × 9/√337 = 1.07094
    const out = calculate({ ...defaults, mode: "reverse", diagonalIn: 86 });
    if (out.mode !== "reverse") throw new Error();
    expect(out.heightM).toBeCloseTo(1.0709, 4);
    expect(out.maxDistanceM.adm).toBeCloseTo(4.28, 2);
    expect(out.maxDistanceM.bdm).toBeCloseTo(6.43, 2);
    expect(out.maxDistanceM.passive).toBeCloseTo(8.57, 2);
  });

  it("skema menolak jarak negatif", () => {
    expect(schema.safeParse({ ...defaults, farthestM: -1 }).success).toBe(false);
  });
});
