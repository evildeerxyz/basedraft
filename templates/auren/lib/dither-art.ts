import { bayer } from "./dither";

export type ArtVariant = "sun" | "waves" | "rings" | "grid";

const hash = (x: number, y: number, s: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return h - Math.floor(h);
};

// Scalar fields in [0, 1]; u and v run 0..1 across the art, `ar` is width / height.
const FIELDS: Record<ArtVariant, (u: number, v: number, s: number, ar: number) => number> = {
  sun: (u, v, s) => {
    const horizon = 0.62;
    const cx = 0.3 + ((s * 0.37) % 0.4);
    const sunAt = (y: number) => Math.hypot((u - cx) * 1.6, y - horizon);
    if (v < horizon) {
      const d = sunAt(v);
      return d < 0.34 ? 0.62 + 0.38 * (1 - d / 0.34) : 0.4 * Math.exp(-(d - 0.34) * 6);
    }
    if (v - horizon < 0.02) return 0;
    const depth = v - horizon;
    const d = sunAt(horizon - depth * 1.4);
    const band = Math.sin(depth * 120 + s) > -0.2 ? 1 : 0.2;
    const base = d < 0.34 ? 0.8 : 0.4 * Math.exp(-(d - 0.34) * 6);
    return base * band * Math.max(0, 1 - depth * 2.4);
  },
  waves: (u, v, s, ar) => {
    const w = Math.sin(u * ar * 5 + Math.sin(v * 7 + s) * 1.8 + v * 9);
    return Math.max(0, (0.5 + 0.5 * w) * (0.25 + v * 0.85));
  },
  rings: (u, v, s, ar) => {
    const d = Math.hypot((u - 0.62) * ar, v - 0.55);
    return Math.max(0, (0.5 + 0.5 * Math.cos(d * 34 - s)) * Math.exp(-d * 1.6));
  },
  grid: (u, v, s) => {
    const cx = Math.floor(u * 9);
    const cy = Math.floor(v * 6);
    const r = hash(cx, cy, s);
    const lit = r > 0.62 ? 1 : r > 0.35 ? 0.42 : 0.12;
    return lit * (0.45 + 0.55 * (1 - v));
  },
};

/**
 * Ordered-dithers a field into two SVG paths: `mid` for accent pixels and
 * `hi` for paper pixels, on a cols × rows grid of unit squares.
 * `fade` dissolves the art toward its left edge, for overlaying text.
 */
export function ditherPaths(variant: ArtVariant, seed: number, cols: number, rows: number, fade = 0) {
  const field = FIELDS[variant];
  const ar = cols / rows;
  let mid = "";
  let hi = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const u = (x + 0.5) / cols;
      let v = field(u, (y + 0.5) / rows, seed, ar);
      if (fade) v *= Math.min(1, Math.max(0, u / fade));
      const s = Math.min(1, Math.max(0, v)) * 2;
      const b = Math.floor(s);
      const level = b + (s - b > bayer(x, y) ? 1 : 0);
      if (level === 1) mid += `M${x} ${y}h1v1h-1z`;
      else if (level >= 2) hi += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { mid, hi };
}
