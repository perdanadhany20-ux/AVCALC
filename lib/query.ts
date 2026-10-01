import type { AnyCalc, Values } from "@/lib/present/types";

/** Hanya nilai yang berbeda dari default yang ditulis ke URL (dalam satuan metrik). */
export function encodeQuery(def: AnyCalc, values: Values): string {
  const p = new URLSearchParams();
  for (const f of def.fields) {
    const v = values[f.name];
    if (v === def.defaults[f.name]) continue;
    if (typeof v === "number" && Number.isFinite(v)) p.set(f.name, String(Number(v.toPrecision(10))));
    else if (typeof v === "string") p.set(f.name, v);
  }
  return p.toString();
}

export function decodeQuery(def: AnyCalc, params: URLSearchParams): Values {
  const out: Values = { ...def.defaults };
  for (const f of def.fields) {
    const raw = params.get(f.name);
    if (raw === null) continue;
    if (f.kind === "number") {
      const n = Number(raw);
      if (Number.isFinite(n)) out[f.name] = n;
    } else if (f.options.some((o) => o.value === raw)) {
      out[f.name] = raw;
    }
  }
  return out;
}
