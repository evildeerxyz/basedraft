import { mulberry32 } from "./utils";

/** Seeded random walk normalised to 0 to 1. */
export function makeSeries(seed: number, n: number, drift = 0.25, vol = 1) {
  const rand = mulberry32(seed);
  const out: number[] = [];
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += (rand() - 0.5 + drift * 0.1) * vol;
    out.push(v);
  }
  const min = Math.min(...out);
  const max = Math.max(...out);
  return out.map((x) => (x - min) / (max - min || 1));
}

type Pt = [number, number];

function toPoints(values: number[], w: number, h: number, padY: number): Pt[] {
  const step = w / (values.length - 1);
  return values.map((v, i) => [i * step, padY + (1 - v) * (h - padY * 2)]);
}

const f = (n: number) => n.toFixed(2);

/** Smooth Catmull-Rom spline as cubic béziers. Same point count → morphable. */
export function linePath(values: number[], w: number, h: number, padY = 6) {
  const pts = toPoints(values, w, h, padY);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

export function areaPath(values: number[], w: number, h: number, padY = 6) {
  return `${linePath(values, w, h, padY)} L${f(w)},${f(h)} L0,${f(h)} Z`;
}

export function pointAt(values: number[], i: number, w: number, h: number, padY = 6): Pt {
  const step = w / (values.length - 1);
  return [i * step, padY + (1 - values[i]) * (h - padY * 2)];
}
