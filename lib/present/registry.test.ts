import { describe, expect, it } from "vitest";
import { CALCULATORS, inputRows, run } from "./registry";
import { decodeQuery, encodeQuery } from "@/lib/query";

describe("registry kalkulator", () => {
  for (const def of CALCULATORS) {
    it(`${def.id}: default valid, ringkasan & diagram terbentuk (metrik & imperial)`, () => {
      const r = run(def, def.defaults);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      for (const u of ["metric", "imperial"] as const) {
        const s = def.summarize(r.input, r.output, u);
        expect(s.results.length).toBeGreaterThan(0);
        const d = def.diagram?.(r.input, r.output, u);
        if (d) {
          expect(d.shapes.length).toBeGreaterThan(5);
          for (const sh of d.shapes) {
            for (const val of Object.values(sh)) if (typeof val === "number") expect(Number.isFinite(val)).toBe(true);
          }
        }
      }
      expect(inputRows(def, r.input, "metric").length).toBeGreaterThan(0);
    });

    it(`${def.id}: query string round-trip`, () => {
      const qs = encodeQuery(def, def.defaults);
      expect(qs).toBe("");
      const decoded = decodeQuery(def, new URLSearchParams(qs));
      expect(decoded).toEqual(def.defaults);
    });
  }

  it("query menyimpan nilai non-default dan mengabaikan nilai asing", () => {
    const def = CALCULATORS[0]!;
    const qs = encodeQuery(def, { ...def.defaults, farthestM: 9.5, viewType: "adm" });
    expect(qs).toContain("farthestM=9.5");
    const v = decodeQuery(def, new URLSearchParams(qs + "&viewType2=x&aspect=99:1"));
    expect(v.farthestM).toBe(9.5);
    expect(v.aspect).toBe("16:9");
  });

  it("imperial: 1.78 m tampil sebagai ft", () => {
    const def = CALCULATORS[0]!;
    const r = run(def, def.defaults);
    if (!r.ok) throw new Error();
    const rows = def.summarize(r.input, r.output, "imperial").results;
    expect(rows.find((x) => x.label === "Lebar gambar")?.quantity).toBe("m");
  });
});
