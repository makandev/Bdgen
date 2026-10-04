/*
 * Handwritten signature ("ink"): strokes as flat number lists on a fixed pad, small enough for links.
 * validate.ts checks them (normalizeInk), the editor records them, render.ts draws them as SVG.
 */

/** Pad size in stored units (aspect 2.5 : 1). */
export const INK_W = 1000;
export const INK_H = 400;
/** Hard caps – a signature needs far less; they keep links and cards small. */
export const MAX_INK_STROKES = 40;
export const MAX_INK_POINTS = 1500;

type Pt = [number, number];

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Ramer–Douglas–Peucker: drops points that lie (almost) on the line between their neighbours. */
export function simplifyStroke(points: Pt[], tolerance = 2.5): Pt[] {
  if (points.length < 3) return points;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distToSegment(points[i], points[0], points[points.length - 1]);
    if (d > maxD) (maxD = d), (idx = i);
  }
  if (maxD <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplifyStroke(points.slice(0, idx + 1), tolerance).slice(0, -1), ...simplifyStroke(points.slice(idx), tolerance)];
}

/** Rounds pad points to whole numbers inside the pad and packs them as [x0,y0,x1,y1,…]. */
export function packStroke(points: Pt[]): number[] {
  const out: number[] = [];
  for (const [x, y] of simplifyStroke(points)) {
    out.push(Math.max(0, Math.min(INK_W, Math.round(x))), Math.max(0, Math.min(INK_H, Math.round(y))));
  }
  return out;
}

export function inkPoints(ink: number[][] | undefined): number {
  return (ink ?? []).reduce((n, s) => n + s.length / 2, 0);
}

/** Smooth SVG path through the points (quadratic curves via the midpoints). Numbers only. */
export function inkPath(s: number[]): string {
  const n = s.length / 2;
  if (n === 1) return `M${s[0]} ${s[1]}l.1 0`;
  let d = `M${s[0]} ${s[1]}`;
  for (let i = 1; i < n - 1; i++) {
    const mx = (s[2 * i] + s[2 * i + 2]) / 2;
    const my = (s[2 * i + 1] + s[2 * i + 3]) / 2;
    d += `Q${s[2 * i]} ${s[2 * i + 1]} ${mx} ${my}`;
  }
  return d + `L${s[2 * n - 2]} ${s[2 * n - 1]}`;
}

/** Bounding box with a margin, so a small signature still fills its place in the card. */
export function inkBox(ink: number[][]): { x: number; y: number; w: number; h: number } {
  let x0 = INK_W, y0 = INK_H, x1 = 0, y1 = 0;
  for (const s of ink) {
    for (let i = 0; i < s.length; i += 2) {
      x0 = Math.min(x0, s[i]); x1 = Math.max(x1, s[i]);
      y0 = Math.min(y0, s[i + 1]); y1 = Math.max(y1, s[i + 1]);
    }
  }
  const m = 16;
  const w = Math.max(x1 - x0, 120) + 2 * m;
  const h = Math.max(y1 - y0, 40) + 2 * m;
  return { x: Math.round((x0 + x1) / 2 - w / 2), y: Math.round((y0 + y1) / 2 - h / 2), w: Math.round(w), h: Math.round(h) };
}
