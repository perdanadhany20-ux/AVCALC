import { describe, expect, it } from "vitest";
import { calculate, defaults } from "./ceiling-speaker";

describe("speaker plafon", () => {
  it("contoh spec: plafon 3, telinga 1.2, 90°, 10 × 7, minimum_overlap → 12 speaker", () => {
    const out = calculate({ ...defaults, lengthM: 10, widthM: 7, ceilingM: 3, earM: 1.2, dispersionDeg: 90, pattern: "minimum_overlap" });
    expect(out.h).toBeCloseTo(1.8, 6);
    expect(out.coverageDiameterM).toBeCloseTo(3.6, 6); // 2 × 1.8 × tan 45°
    expect(out.spacingM).toBeCloseTo(2.545, 3); // 3.6 × 0.707
    expect(out.cols).toBe(4); // ceil(10 / 2.545 = 3.93)
    expect(out.rows).toBe(3); // ceil(7 / 2.545 = 2.75)
    expect(out.count).toBe(12);
    expect(out.positions).toHaveLength(12);
  });

  it("edge_to_edge memakai jarak = d", () => {
    // ceil(10 / 3.6) = 3, ceil(7 / 3.6) = 2 → 6
    expect(calculate({ ...defaults, pattern: "edge_to_edge" }).count).toBe(6);
  });

  it("edge_to_center memakai jarak = d / 2", () => {
    // jarak 1.8 → ceil(10/1.8)=6, ceil(7/1.8)=4 → 24
    expect(calculate({ ...defaults, pattern: "edge_to_center" }).count).toBe(24);
  });

  it("peringatan jika h ≤ 0", () => {
    const out = calculate({ ...defaults, ceilingM: 1.2, earM: 1.2 });
    expect(out.valid).toBe(false);
    expect(out.warnings[0]?.code).toBe("h_non_positive");
  });
});
