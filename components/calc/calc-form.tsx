"use client";

import { Controller, type Control } from "react-hook-form";
import { Label, Select } from "@/components/ui/input";
import { NumberInput } from "./number-input";
import { isVisible } from "@/lib/present/registry";
import type { AnyCalc, Field, Values } from "@/lib/present/types";
import type { UnitSystem } from "@/lib/units";

export function CalcForm({
  def,
  control,
  values,
  errors,
  units,
  idPrefix,
}: {
  def: AnyCalc;
  control: Control<Values>;
  values: Values;
  errors: Record<string, string>;
  units: UnitSystem;
  idPrefix: string;
}) {
  const visible = def.fields.filter((f) => isVisible(f, values));
  const order: (string | undefined)[] = [];
  for (const f of visible) if (!order.includes(f.group)) order.push(f.group);

  const renderField = (f: Field) => {
    const id = `${idPrefix}-${f.name}`;
    const err = errors[f.name];
    const describedBy = [f.hint ? `${id}-hint` : null, err ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
    return (
      <div key={f.name} className="grid gap-1.5">
        <Label htmlFor={id}>
          {f.label}
          {f.kind === "number" && f.optional ? <span className="font-normal text-muted"> (opsional)</span> : null}
        </Label>
        <Controller
          control={control}
          name={f.name}
          render={({ field }) =>
            f.kind === "select" ? (
              <Select id={id} value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value)} aria-describedby={describedBy}>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ) : (
              <NumberInput
                id={id}
                field={f}
                value={field.value}
                onChange={field.onChange}
                units={units}
                placeholder={f.placeholder?.(values)}
                invalid={Boolean(err)}
                describedBy={describedBy}
              />
            )
          }
        />
        {f.hint ? (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {f.hint}
          </p>
        ) : null}
        {err ? (
          <p id={`${id}-err`} className="text-xs font-medium text-danger" role="alert">
            {err}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="grid gap-6">
      {order.map((g) => {
        const fields = visible.filter((f) => f.group === g);
        const meta = g ? def.groups?.[g] : undefined;
        if (meta?.collapsible) {
          return (
            <details key={g} className="group rounded-md border border-border">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted select-none hover:text-ink">{meta.label}</summary>
              <div className="grid gap-4 border-t border-border p-3">{fields.map(renderField)}</div>
            </details>
          );
        }
        return (
          <fieldset key={g ?? "_"} className="grid gap-4">
            {meta ? <legend className="mb-3 font-display text-sm font-semibold text-line-ink">{meta.label}</legend> : null}
            {fields.map(renderField)}
          </fieldset>
        );
      })}
    </div>
  );
}
