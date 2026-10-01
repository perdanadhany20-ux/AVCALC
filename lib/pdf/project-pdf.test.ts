import { writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { registerPdfFonts } from "./fonts";
import { ProjectPdf, type PdfData } from "./project-pdf";
import { CALCULATORS, run } from "@/lib/present/registry";
import type { CalcId } from "@/lib/present/types";

function sample(pro: boolean): PdfData {
  const calcs = CALCULATORS.map((def) => {
    const r = run(def, def.defaults);
    if (!r.ok) throw new Error(def.id);
    return { calculator: def.id as CalcId, input: r.input, output: JSON.parse(JSON.stringify(r.output)) };
  });
  return {
    project: { name: "Gedung Kantor Pusat", client_name: "PT Contoh Klien", notes: "Revisi layout lantai 5." },
    rooms: [
      { name: "Boardroom", calculations: calcs.slice(0, 3) },
      { name: "Training room", calculations: calcs.slice(3) },
    ],
    branding: { pro, companyName: pro ? "PT Integrator AV" : null, preparedBy: "Budi", logoDataUri: null },
    generatedAt: new Date("2026-10-02T03:00:00Z"),
  };
}

describe("PDF project", () => {
  it("merender PDF gratis (tanda air) dan Pro tanpa error", async () => {
    registerPdfFonts();
    for (const pro of [false, true]) {
      const buf = await renderToBuffer(createElement(ProjectPdf, { data: sample(pro) }) as Parameters<typeof renderToBuffer>[0]);
      expect(buf.subarray(0, 4).toString()).toBe("%PDF");
      expect(buf.length).toBeGreaterThan(20_000);
      if (process.env.PDF_OUT) writeFileSync(`${process.env.PDF_OUT}/sample-${pro ? "pro" : "free"}.pdf`, buf);
    }
  }, 60_000);
});
