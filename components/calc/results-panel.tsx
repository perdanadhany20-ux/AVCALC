import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatRow } from "@/lib/present/registry";
import type { Row, Summary } from "@/lib/present/types";
import type { UnitSystem } from "@/lib/units";
import { cn } from "@/lib/utils";

export function EstimateBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-sm border border-warn/60 px-1.5 py-px align-middle text-[11px] font-medium text-warn-ink">
      Estimasi
    </span>
  );
}

function ToneIcon({ tone }: { tone?: Row["tone"] }) {
  if (tone === "ok") return <CheckCircle2 className="h-4 w-4 shrink-0 text-ok-ink" aria-hidden />;
  if (tone === "warn") return <AlertTriangle className="h-4 w-4 shrink-0 text-warn-ink" aria-hidden />;
  return null;
}

export function PrimaryResults({ rows, units }: { rows: Row[]; units: UnitSystem }) {
  return (
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {rows.map((r) => {
        const { value, unit } = formatRow(r, units);
        return (
          <div key={r.label} aria-live="polite">
            <div className="text-sm text-muted">
              {r.label}
              {r.estimate ? <EstimateBadge /> : null}
            </div>
            <div className={cn("mt-1 flex items-baseline gap-2 font-display", r.tone === "warn" ? "text-warn-ink" : "text-accent")}>
              {r.tone ? <ToneIcon tone={r.tone} /> : null}
              <span className={cn("num font-semibold tracking-tight", value.length > 14 ? "text-2xl" : "text-4xl")}>{value}</span>
              {unit ? <span className="text-base font-medium text-muted">{unit}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DetailRows({ rows, units }: { rows: Row[]; units: UnitSystem }) {
  const sections: (string | undefined)[] = [];
  for (const r of rows) if (!sections.includes(r.section)) sections.push(r.section);
  return (
    <div className="grid gap-5">
      {sections.map((sec) => (
        <div key={sec ?? "_"}>
          {sec ? <h2 className="pb-1 font-display text-sm font-semibold text-line-ink">{sec}</h2> : null}
          <dl className="divide-y divide-border">
          {rows
            .filter((r) => r.section === sec)
            .map((r) => {
              const { value, unit } = formatRow(r, units);
              return (
                <div key={r.label} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                  <dt className="text-muted">
                    {r.label}
                    {r.estimate ? <EstimateBadge /> : null}
                  </dt>
                  <dd className={cn("num flex items-center gap-1.5 text-right font-medium", r.tone === "warn" && "text-warn-ink", r.tone === "ok" && "text-ok-ink")}>
                    <ToneIcon tone={r.tone} />
                    <span>
                      {value}
                      {unit ? <span className="ml-1 font-normal text-muted">{unit}</span> : null}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function Warnings({ summary }: { summary: Summary }) {
  if (!summary.warnings.length) return null;
  return (
    <ul className="grid gap-2" aria-live="polite">
      {summary.warnings.map((w) => (
        <li key={w} className="flex gap-2 rounded-md border border-warn/50 bg-warn/10 px-3 py-2 text-sm text-warn-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{w}</span>
        </li>
      ))}
    </ul>
  );
}
