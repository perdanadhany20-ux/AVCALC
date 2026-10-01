"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatInputNumber, fromDisplay, parseNumber, toDisplay, unitLabel, type UnitSystem } from "@/lib/units";
import type { NumberField } from "@/lib/present/types";

const same = (a: number | undefined, b: unknown) =>
  (a === undefined && b === undefined) ||
  (typeof a === "number" && typeof b === "number" && (Number.isNaN(a) ? Number.isNaN(b) : Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b))));

export function NumberInput({
  id,
  field,
  value,
  onChange,
  units,
  placeholder,
  invalid,
  describedBy,
}: {
  id: string;
  field: NumberField;
  value: unknown;
  onChange: (v: number | undefined) => void;
  units: UnitSystem;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const display = typeof value === "number" && Number.isFinite(value) ? formatInputNumber(toDisplay(value, field.quantity, units)) : "";
  const [text, setText] = useState(display);

  // Sinkronkan teks bila nilai kanonik berubah dari luar (reset, preset, ganti satuan).
  useEffect(() => {
    const parsed = parseNumber(text);
    const canon = parsed === undefined ? undefined : fromDisplay(parsed, field.quantity, units);
    if (!same(canon, value)) setText(display);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, units]);

  const unit = field.quantity ? unitLabel(field.quantity, units) : field.unit;

  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="num pr-14 text-right"
        onChange={(e) => {
          setText(e.target.value);
          const n = parseNumber(e.target.value);
          if (n === undefined) onChange(field.optional ? undefined : Number.NaN);
          else onChange(Number.isNaN(n) ? Number.NaN : fromDisplay(n, field.quantity, units));
        }}
      />
      {unit ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted" aria-hidden>
          {unit}
        </span>
      ) : null}
    </div>
  );
}
