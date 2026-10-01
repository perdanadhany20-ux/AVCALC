import type { Shape, Tone } from "./types";

export const W = 640;
export const H = 380;

/**
 * Pemetaan koordinat dunia (meter, y ke atas) ke kanvas (px, y ke bawah) dengan skala seragam.
 */
export function viewport(
  world: { minX: number; maxX: number; minY: number; maxY: number },
  box = { x: 40, y: 30, w: W - 80, h: H - 90 },
) {
  const ww = Math.max(world.maxX - world.minX, 1e-6);
  const wh = Math.max(world.maxY - world.minY, 1e-6);
  const s = Math.min(box.w / ww, box.h / wh);
  const ox = box.x + (box.w - ww * s) / 2;
  const oy = box.y + (box.h - wh * s) / 2;
  return {
    s,
    x: (x: number) => ox + (x - world.minX) * s,
    y: (y: number) => oy + (world.maxY - y) * s,
  };
}

export function gridBg(step = 20): Shape[] {
  const out: Shape[] = [];
  for (let x = step; x < W; x += step) out.push({ kind: "line", x1: x, y1: 0, x2: x, y2: H, tone: "grid", sw: 0.5 });
  for (let y = step; y < H; y += step) out.push({ kind: "line", x1: 0, y1: y, x2: W, y2: y, tone: "grid", sw: 0.5 });
  return out;
}

/** Garis ukur gaya gambar kerja: garis bantu, tick miring 45°, dan label. Koordinat kanvas. */
export function dim(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  opts: { offset?: number; tone?: Tone; labelSide?: "auto" | "left" | "right" } = {},
): Shape[] {
  const tone = opts.tone ?? "line";
  const off = opts.offset ?? 0;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const ax = x1 + nx * off;
  const ay = y1 + ny * off;
  const bx = x2 + nx * off;
  const by = y2 + ny * off;
  const t = 4;
  const out: Shape[] = [
    { kind: "line", x1: ax, y1: ay, x2: bx, y2: by, tone, sw: 1 },
    { kind: "line", x1: ax - t, y1: ay + t, x2: ax + t, y2: ay - t, tone, sw: 1.4 },
    { kind: "line", x1: bx - t, y1: by + t, x2: bx + t, y2: by - t, tone, sw: 1.4 },
  ];
  if (off !== 0) {
    const ext = Math.sign(off) * 4;
    out.push(
      { kind: "line", x1, y1, x2: ax + nx * ext, y2: ay + ny * ext, tone, sw: 0.6 },
      { kind: "line", x1: x2, y1: y2, x2: bx + nx * ext, y2: by + ny * ext, tone, sw: 0.6 },
    );
  }
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  if (vertical) {
    const side = opts.labelSide === "left" ? -1 : 1;
    out.push({ kind: "text", x: mx + side * 7, y: my + 4, text: label, anchor: side > 0 ? "start" : "end", size: 11, tone: "text" });
  } else {
    out.push({ kind: "rect", x: mx - label.length * 3.2 - 4, y: my - 8, w: label.length * 6.4 + 8, h: 14, tone: "surface", fill: "surface", sw: 0 });
    out.push({ kind: "text", x: mx, y: my + 4, text: label, anchor: "middle", size: 11, tone: "text" });
  }
  return out;
}

/** Kotak judul di pojok kanan bawah, seperti title block gambar kerja. */
export function titleBlock(title: string, note: string): Shape[] {
  const w = 200;
  const h = 34;
  const x = W - w - 8;
  const y = H - h - 8;
  return [
    { kind: "rect", x, y, w, h, tone: "line", fill: "surface", sw: 1 },
    { kind: "line", x1: x, y1: y + 18, x2: x + w, y2: y + 18, tone: "line", sw: 0.6 },
    { kind: "text", x: x + 8, y: y + 13, text: title, size: 10, tone: "text", bold: true },
    { kind: "text", x: x + 8, y: y + 29, text: note, size: 9, tone: "muted" },
  ];
}
