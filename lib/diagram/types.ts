export type Tone = "line" | "grid" | "accent" | "warn" | "muted" | "text" | "surface";

type Stroke = { tone?: Tone; dash?: boolean; sw?: number };
type Fill = { fill?: Tone | "none"; fillOpacity?: number };

export type Shape =
  | ({ kind: "line"; x1: number; y1: number; x2: number; y2: number } & Stroke)
  | ({ kind: "rect"; x: number; y: number; w: number; h: number } & Stroke & Fill)
  | ({ kind: "circle"; cx: number; cy: number; r: number } & Stroke & Fill)
  | ({ kind: "path"; d: string } & Stroke & Fill)
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      anchor?: "start" | "middle" | "end";
      size?: number;
      tone?: Tone;
      bold?: boolean;
    };

/** Gambar netral platform: dirender ke SVG DOM (web) dan ke react-pdf Svg (PDF). */
export type Diagram = { width: number; height: number; label: string; shapes: Shape[] };

export const TONE_HEX: Record<Tone, string> = {
  line: "#2F5DA8",
  grid: "#D6DEEA",
  accent: "#0E8C7F",
  warn: "#C27400",
  muted: "#7A879B",
  text: "#162033",
  surface: "#FFFFFF",
};
