import type { Diagram, Tone } from "@/lib/diagram/types";

const c = (t: Tone | "none" | undefined, fallback: string) => (t === "none" ? "none" : `var(--dg-${t ?? fallback})`);

export function DiagramSvg({ diagram, className }: { diagram: Diagram; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${diagram.width} ${diagram.height}`}
      role="img"
      aria-label={diagram.label}
      className={className}
      style={{ fontFamily: "var(--font-display)" }}
    >
      <rect x={0} y={0} width={diagram.width} height={diagram.height} fill="var(--dg-surface)" />
      {diagram.shapes.map((s, i) => {
        switch (s.kind) {
          case "line":
            return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={c(s.tone, "line")} strokeWidth={s.sw ?? 1} strokeDasharray={s.dash ? "5 4" : undefined} />;
          case "rect":
            return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} stroke={s.sw === 0 ? "none" : c(s.tone, "line")} strokeWidth={s.sw ?? 1} fill={c(s.fill ?? "none", "surface")} fillOpacity={s.fillOpacity ?? 1} strokeDasharray={s.dash ? "5 4" : undefined} />;
          case "circle":
            return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} stroke={c(s.tone, "line")} strokeWidth={s.sw ?? 1} fill={c(s.fill ?? "none", "surface")} fillOpacity={s.fillOpacity ?? 1} strokeDasharray={s.dash ? "5 4" : undefined} />;
          case "path":
            return <path key={i} d={s.d} stroke={c(s.tone, "line")} strokeWidth={s.sw ?? 1} fill={c(s.fill ?? "none", "surface")} fillOpacity={s.fillOpacity ?? 1} strokeDasharray={s.dash ? "5 4" : undefined} strokeLinejoin="round" />;
          case "text":
            return (
              <text key={i} x={s.x} y={s.y} fontSize={s.size ?? 11} fill={c(s.tone, "text")} textAnchor={s.anchor ?? "start"} fontWeight={s.bold ? 600 : 400}>
                {s.text}
              </text>
            );
        }
      })}
    </svg>
  );
}
