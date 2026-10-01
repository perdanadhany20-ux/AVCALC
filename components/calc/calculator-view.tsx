"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useUnits } from "@/components/providers";
import { DiagramSvg } from "@/components/diagram/diagram-svg";
import { CalcForm } from "./calc-form";
import { DetailRows, PrimaryResults, Warnings } from "./results-panel";
import { getCalcById, run } from "@/lib/present/registry";
import type { CalcId, Values } from "@/lib/present/types";
import { decodeQuery, encodeQuery } from "@/lib/query";

export function CalculatorView({
  id,
  compact = false,
  renderActions,
}: {
  id: CalcId;
  compact?: boolean;
  renderActions?: (ctx: { calculator: CalcId; input: Values }) => ReactNode;
}) {
  const def = getCalcById(id);
  if (!def) throw new Error(`Kalkulator tidak dikenal: ${id}`);
  const { units } = useUnits();
  const form = useForm<Values>({ defaultValues: def.defaults });
  const watched = form.watch();
  const key = JSON.stringify(watched);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const values = useMemo(() => watched, [key]);
  const loaded = useRef(false);

  // Muat input dari URL sekali saat mount.
  useEffect(() => {
    if (!compact) {
      const params = new URLSearchParams(window.location.search);
      if ([...params.keys()].length) form.reset(decodeQuery(def, params));
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tulis input ke URL agar hasil bisa dibagikan tanpa login.
  useEffect(() => {
    if (compact || !loaded.current) return;
    const t = window.setTimeout(() => {
      const qs = encodeQuery(def, values);
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", url);
    }, 250);
    return () => window.clearTimeout(t);
  }, [compact, def, values]);

  const result = useMemo(() => run(def, values), [def, values]);
  const summary = result.ok ? def.summarize(result.input, result.output, units) : null;
  const diagram = result.ok ? (def.diagram?.(result.input, result.output, units) ?? null) : null;
  const primary = summary?.results.filter((r) => r.primary) ?? [];
  const detail = summary?.results.filter((r) => !r.primary) ?? [];
  const errors = result.ok ? {} : result.errors;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start">
      <form
        className="rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-20"
        onSubmit={(e) => e.preventDefault()}
        aria-label={`Input ${def.title}`}
        noValidate
      >
        <CalcForm def={def} control={form.control} values={values} errors={errors} units={units} idPrefix={compact ? `h-${def.id}` : def.id} />
        {!compact ? (
          <button
            type="button"
            onClick={() => form.reset(def.defaults)}
            className="mt-6 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Kembalikan ke contoh awal
          </button>
        ) : null}
      </form>

      <section aria-label="Hasil" className="min-w-0 rounded-lg border border-border bg-surface">
        {summary ? (
          <>
            <div className="p-5 sm:p-6">
              <PrimaryResults rows={primary} units={units} />
            </div>
            {diagram ? (
              <figure className="overflow-x-auto border-y border-border">
                <DiagramSvg diagram={diagram} className="block h-auto w-full min-w-[560px]" />
                <figcaption className="sr-only">{diagram.label}</figcaption>
              </figure>
            ) : null}
            <div className="grid gap-5 p-5 sm:p-6">
              <Warnings summary={summary} />
              {!compact ? <DetailRows rows={detail} units={units} /> : null}
              {compact ? (
                <Link
                  href={`/kalkulator/${def.slug}?${encodeQuery(def, values)}`}
                  className="text-sm font-medium text-line-ink underline-offset-4 hover:underline"
                >
                  Buka kalkulator lengkap dengan detail & rumus
                </Link>
              ) : (
                <>
                  <details className="rounded-md border border-border">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium select-none">Rumus & asumsi</summary>
                    <div className="border-t border-border px-3 py-3 text-sm">
                      <ul className="grid list-disc gap-1.5 pl-5">
                        {def.formulas.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                      {def.note ? <p className="mt-3 text-muted">{def.note}</p> : null}
                    </div>
                  </details>
                  {result.ok && renderActions ? renderActions({ calculator: def.id, input: result.input }) : null}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-sm text-muted">Lengkapi input yang ditandai merah untuk melihat hasil.</div>
        )}
      </section>
    </div>
  );
}
