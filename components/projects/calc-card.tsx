"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useUnits } from "@/components/providers";
import { DiagramSvg } from "@/components/diagram/diagram-svg";
import { EstimateBadge } from "@/components/calc/results-panel";
import { formatRow, getCalcById } from "@/lib/present/registry";
import type { CalcId, Values } from "@/lib/present/types";
import { encodeQuery } from "@/lib/query";
import { deleteCalculation } from "@/app/projects/actions";
import { ConfirmSubmit } from "./confirm-submit";

export function CalcCard({
  id,
  projectId,
  calculator,
  input,
  output,
  createdAt,
  readOnly = false,
}: {
  id: string;
  projectId?: string;
  calculator: CalcId;
  input: Values;
  output: unknown;
  createdAt: string;
  readOnly?: boolean;
}) {
  const { units } = useUnits();
  const def = getCalcById(calculator);
  if (!def) return null;
  const summary = def.summarize(input, output, units);
  const primary = summary.results.filter((r) => r.primary);
  const diagram = def.diagram?.(input, output, units) ?? null;
  const qs = encodeQuery(def, input);

  return (
    <article className="grid gap-4 rounded-md border border-border bg-surface p-4 md:grid-cols-[1fr_minmax(0,300px)]">
      <div className="min-w-0">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-display font-semibold">{def.title}</h4>
          <span className="text-xs text-muted">{createdAt}</span>
        </header>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {primary.map((r) => {
            const f = formatRow(r, units);
            return (
              <div key={r.label}>
                <dt className="text-xs text-muted">
                  {r.label}
                  {r.estimate ? <EstimateBadge /> : null}
                </dt>
                <dd className={`num font-display text-xl font-semibold ${r.tone === "warn" ? "text-warn-ink" : "text-accent"}`}>
                  {f.value} <span className="text-sm font-medium text-muted">{f.unit}</span>
                </dd>
              </div>
            );
          })}
        </dl>
        {summary.warnings.length ? <p className="mt-2 text-sm text-warn-ink">{summary.warnings.join(" ")}</p> : null}
        {!readOnly ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/kalkulator/${def.slug}${qs ? `?${qs}` : ""}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-sunken">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Buka di kalkulator
            </Link>
            <form action={deleteCalculation}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="project_id" value={projectId} />
              <ConfirmSubmit message="Hapus kalkulasi ini?" className="h-8 px-3" aria-label={`Hapus ${def.title}`}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Hapus
              </ConfirmSubmit>
            </form>
          </div>
        ) : null}
      </div>
      {diagram ? (
        <figure className="overflow-hidden rounded border border-border">
          <DiagramSvg diagram={diagram} className="block h-auto w-full" />
        </figure>
      ) : null}
    </article>
  );
}
