import { camera } from "./camera";
import { ceilingSpeaker } from "./ceiling-speaker";
import { convert } from "./convert";
import { led } from "./led";
import { projector } from "./projector";
import { screen } from "./screen";
import type { AnyCalc, Field, Row, Values } from "./types";
import { formatInputNumber, formatNumber, formatQ, unitLabel, type UnitSystem } from "@/lib/units";

export const CALCULATORS: AnyCalc[] = [screen, led, projector, camera, ceilingSpeaker, convert];

export const getCalcById = (id: string) => CALCULATORS.find((c) => c.id === id);
export const getCalcBySlug = (slug: string) => CALCULATORS.find((c) => c.slug === slug);

export const isVisible = (f: Field, v: Values) => !f.showIf || f.showIf(v);

/** Ganti nilai field tersembunyi yang tidak valid dengan default agar tidak memblokir kalkulasi. */
export function effectiveValues(def: AnyCalc, v: Values): Values {
  const out: Values = { ...v };
  for (const f of def.fields) {
    if (isVisible(f, v)) continue;
    const val = out[f.name];
    if (f.kind === "number" && typeof val === "number" && !Number.isFinite(val)) out[f.name] = def.defaults[f.name];
  }
  return out;
}

export type RunResult =
  | { ok: true; input: Values; output: unknown }
  | { ok: false; errors: Record<string, string> };

export function run(def: AnyCalc, values: Values): RunResult {
  const parsed = def.schema.safeParse(effectiveValues(def, values));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  return { ok: true, input: parsed.data, output: def.calculate(parsed.data) };
}

/** Teks satu baris hasil, dipakai di PDF dan tampilan ringkas. */
export function formatRow(r: Row, units: UnitSystem): { value: string; unit: string } {
  if (typeof r.value === "string") return { value: r.value, unit: r.unit ?? "" };
  if (r.quantity) {
    const [num, ...rest] = formatQ(r.value, r.quantity, units, r.decimals ?? 2).split(" ");
    return { value: num ?? "", unit: rest.join(" ") };
  }
  return { value: formatNumber(r.value, r.decimals ?? 2), unit: r.unit ?? "" };
}

/** Baris input untuk PDF / tampilan read-only. */
export function inputRows(def: AnyCalc, input: Values, units: UnitSystem): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  for (const f of def.fields) {
    if (!isVisible(f, input)) continue;
    const val = input[f.name];
    const group = f.group && def.groups?.[f.group] && def.id === "convert" ? `${def.groups[f.group]!.label}: ` : "";
    if (f.kind === "select") {
      rows.push({ label: group + f.label, value: f.options.find((o) => o.value === val)?.label ?? String(val) });
    } else if (typeof val === "number") {
      const text = f.quantity
        ? formatQ(val, f.quantity, units)
        : `${formatInputNumber(val)}${f.unit ? ` ${f.unit}` : ""}`;
      rows.push({ label: group + f.label, value: text });
    } else if (f.optional) {
      rows.push({ label: group + f.label, value: f.placeholder?.(input) ?? "—" });
    }
  }
  return rows;
}

export { unitLabel };
