import type { ZodType, ZodTypeDef } from "zod";
import type { Diagram } from "@/lib/diagram/types";
import type { Quantity, UnitSystem } from "@/lib/units";

export type CalcId = "screen" | "led" | "projector" | "camera" | "ceiling-speaker" | "convert";
export type Values = Record<string, unknown>;

type FieldBase = {
  name: string;
  label: string;
  hint?: string;
  group?: string;
  showIf?: (v: Values) => boolean;
};
export type NumberField = FieldBase & {
  kind: "number";
  quantity?: Quantity;
  /** Satuan tetap (tidak ikut toggle), misalnya "°" atau "W". */
  unit?: string;
  optional?: boolean;
  placeholder?: (v: Values) => string | undefined;
};
export type SelectField = FieldBase & { kind: "select"; options: { value: string; label: string }[] };
export type Field = NumberField | SelectField;

export type Row = {
  label: string;
  value: number | string;
  quantity?: Quantity;
  unit?: string;
  decimals?: number;
  estimate?: boolean;
  primary?: boolean;
  tone?: "ok" | "warn";
  section?: string;
};
export type Summary = { results: Row[]; warnings: string[] };

export type CalcDefinition<I extends Values, O> = {
  id: CalcId;
  slug: string;
  title: string;
  navTitle: string;
  metaDescription: string;
  intro: string;
  schema: ZodType<I, ZodTypeDef, unknown>;
  defaults: I;
  calculate: (input: I) => O;
  fields: Field[];
  groups?: Record<string, { label: string; collapsible?: boolean }>;
  summarize: (input: I, output: O, units: UnitSystem) => Summary;
  diagram?: (input: I, output: O, units: UnitSystem) => Diagram | null;
  formulas: string[];
  note?: string;
};

export type AnyCalc = CalcDefinition<Values, unknown>;

export function defineCalc<I extends Values, O>(def: CalcDefinition<I, O>): AnyCalc {
  return def as unknown as AnyCalc;
}

export const ASPECT_OPTIONS = [
  { value: "16:9", label: "16:9" },
  { value: "16:10", label: "16:10" },
  { value: "21:9", label: "21:9" },
  { value: "4:3", label: "4:3" },
];
