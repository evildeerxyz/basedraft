/*
 * Geometry Figma keeps beside every layer and draws from: outlines as compact command blobs,
 * and vector networks for editable vectors. Without it Figma shows a pasted layer only once
 * it has been touched, so "Copy for Figma" writes it the way Figma's own copy does.
 *
 * SVG shapes are read through the browser (computed fills, transforms) and flattened to
 * lines and cubics, so icons land as vectors you can recolor.
 */
import type { FGradient } from "./figma-paint";
import type { RGBA } from "./figma-tree";

export type P = [number, number];
export interface Sub {
  start: P;
  segs: Array<{ c1?: P; c2?: P; to: P }>;
  closed: boolean;
}
type Cmd = number[];

/** Path commands as Figma stores them: 0 close, 1 move, 2 line, 3 quad, 4 cubic, points as float32. */
export function pathBlob(cmds: Cmd[]) {
  const out = new Uint8Array(cmds.reduce((n, c) => n + 1 + (c.length - 1) * 4, 0));
  const view = new DataView(out.buffer);
  let o = 0;
  for (const c of cmds) {
    out[o++] = c[0];
    for (let i = 1; i < c.length; i++, o += 4) view.setFloat32(o, c[i], true);
  }
  return out;
}

/* ---------- rectangles ---------- */

const K = 0.5522847498;

/** A rounded rectangle, clockwise from the top of the left edge, as Figma draws one. */
export function roundedRect(x: number, y: number, w: number, h: number, radius: number[]): Cmd[] {
  const [tl, tr, br, bl] = radius.map((v) => Math.max(0, Math.min(v, w / 2, h / 2)));
  const k = (v: number) => v * (1 - K);
  return [
    [1, x, y + tl],
    ...(tl ? [[4, x, y + k(tl), x + k(tl), y, x + tl, y]] : []),
    [2, x + w - tr, y],
    ...(tr ? [[4, x + w - k(tr), y, x + w, y + k(tr), x + w, y + tr]] : []),
    [2, x + w, y + h - br],
    ...(br ? [[4, x + w, y + h - k(br), x + w - k(br), y + h, x + w - br, y + h]] : []),
    [2, x + bl, y + h],
    ...(bl ? [[4, x + k(bl), y + h, x, y + h - k(bl), x, y + h - bl]] : []),
    [2, x, y + tl],
    [0],
  ];
}

/** Fill and stroke outlines for a frame or rectangle; strokes sit inside the box unless `outside`. */
export function boxGeometry(w: number, h: number, radius: number[], stroke?: [number, number, number, number], outside = false) {
  const fill = roundedRect(0, 0, w, h, radius);
  if (!stroke || stroke.every((v) => v <= 0)) return { fill };
  const [t, r, b, l] = stroke;
  if (outside) {
    const outer = roundedRect(-t, -t, w + 2 * t, h + 2 * t, radius.map((v) => (v > 0 ? v + t : 0)));
    return { fill, stroke: { cmds: [...outer, ...fill], rule: "ODD" as const } };
  }
  if (t === r && r === b && b === l) {
    // A ring: the outline and the outline inset by the stroke, filled even-odd.
    const inner = roundedRect(t, t, Math.max(0, w - 2 * t), Math.max(0, h - 2 * t), radius.map((v) => Math.max(0, v - t)));
    return { fill, stroke: { cmds: [...fill, ...inner], rule: "ODD" as const } };
  }
  // Separate sides (a rule under a header, say): one strip per side.
  const strips: Cmd[] = [];
  if (t > 0) strips.push(...roundedRect(0, 0, w, t, [0, 0, 0, 0]));
  if (b > 0) strips.push(...roundedRect(0, h - b, w, b, [0, 0, 0, 0]));
  if (l > 0) strips.push(...roundedRect(0, 0, l, h, [0, 0, 0, 0]));
  if (r > 0) strips.push(...roundedRect(w - r, 0, r, h, [0, 0, 0, 0]));
  return { fill, stroke: { cmds: strips, rule: "NONZERO" as const } };
}

/* ---------- SVG paths ---------- */

function arcToCubics(x1: number, y1: number, rx: number, ry: number, angle: number, large: number, sweep: number, x2: number, y2: number): Array<[P, P, P]> {
  if (!rx || !ry) return [[[x1, y1], [x2, y2], [x2, y2]]];
  const phi = (angle * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const xp = cos * dx + sin * dy;
  const yp = -sin * dx + cos * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const den = rx * rx * yp * yp + ry * ry * xp * xp;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * yp) / ry;
  const cyp = (-coef * ry * xp) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  else if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const d = dt / n;
  const k = (4 / 3) * Math.tan(d / 4);
  const at = (ux: number, uy: number): P => [cos * rx * ux - sin * ry * uy + cx, sin * rx * ux + cos * ry * uy + cy];
  const out: Array<[P, P, P]> = [];
  for (let i = 0, t = t1; i < n; i++, t += d) {
    const [c1, s1, c2, s2] = [Math.cos(t), Math.sin(t), Math.cos(t + d), Math.sin(t + d)];
    out.push([at(c1 - k * s1, s1 + k * c1), at(c2 + k * s2, s2 - k * c2), i === n - 1 ? [x2, y2] : at(c2, s2)]);
  }
  return out;
}

/** An SVG path's `d`, every command made absolute and every curve a cubic. */
export function parsePath(d: string): Sub[] {
  let i = 0;
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++;
  };
  const num = () => {
    skip();
    const m = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(d.slice(i));
    if (!m) throw new Error("bad path number");
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const flag = () => {
    skip();
    const c = d[i++];
    if (c !== "0" && c !== "1") throw new Error("bad arc flag");
    return Number(c);
  };
  const subs: Sub[] = [];
  let cur: Sub | null = null;
  let [x, y, sx, sy] = [0, 0, 0, 0];
  let lastC: P | null = null;
  let lastQ: P | null = null;
  let cmd = "";
  const open = () => {
    if (!cur || cur.closed) {
      cur = { start: [x, y], segs: [], closed: false };
      subs.push(cur);
      [sx, sy] = [x, y];
    }
    return cur;
  };
  const cubic = (c1: P, c2: P, to: P) => {
    open().segs.push({ c1, c2, to });
    [x, y] = to;
  };
  for (;;) {
    skip();
    if (i >= d.length) break;
    if (/[A-Za-z]/.test(d[i])) cmd = d[i++];
    else if (!cmd || /z/i.test(cmd)) throw new Error("bad path");
    const rel = cmd === cmd.toLowerCase();
    const [ox, oy] = rel ? [x, y] : [0, 0];
    switch (cmd.toUpperCase()) {
      case "M": {
        const p: P = [num() + ox, num() + oy];
        cur = { start: p, segs: [], closed: false };
        subs.push(cur);
        [x, y, sx, sy] = [p[0], p[1], p[0], p[1]];
        cmd = rel ? "l" : "L";
        lastC = lastQ = null;
        break;
      }
      case "L":
      case "H":
      case "V": {
        const c = cmd.toUpperCase();
        const to: P = c === "H" ? [num() + ox, y] : c === "V" ? [x, num() + oy] : [num() + ox, num() + oy];
        open().segs.push({ to });
        [x, y] = to;
        lastC = lastQ = null;
        break;
      }
      case "C": {
        const c1: P = [num() + ox, num() + oy];
        const c2: P = [num() + ox, num() + oy];
        cubic(c1, c2, [num() + ox, num() + oy]);
        lastC = c2;
        lastQ = null;
        break;
      }
      case "S": {
        const c1: P = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
        const c2: P = [num() + ox, num() + oy];
        cubic(c1, c2, [num() + ox, num() + oy]);
        lastC = c2;
        lastQ = null;
        break;
      }
      case "Q":
      case "T": {
        const q: P = cmd.toUpperCase() === "Q" ? [num() + ox, num() + oy] : lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y];
        const to: P = [num() + ox, num() + oy];
        cubic([x + (2 / 3) * (q[0] - x), y + (2 / 3) * (q[1] - y)], [to[0] + (2 / 3) * (q[0] - to[0]), to[1] + (2 / 3) * (q[1] - to[1])], to);
        lastQ = q;
        lastC = null;
        break;
      }
      case "A": {
        const [rx, ry, rot, large, sweep] = [num(), num(), num(), flag(), flag()];
        const to: P = [num() + ox, num() + oy];
        for (const [c1, c2, end] of arcToCubics(x, y, rx, ry, rot, large, sweep, to[0], to[1])) cubic(c1, c2, end);
        lastC = lastQ = null;
        break;
      }
      case "Z": {
        if (cur) cur.closed = true;
        [x, y] = [sx, sy];
        lastC = lastQ = null;
        break;
      }
      default:
        throw new Error(`unsupported path command ${cmd}`);
    }
  }
  return subs;
}

function ellipse(cx: number, cy: number, rx: number, ry: number): Sub {
  const [kx, ky] = [rx * K, ry * K];
  return {
    start: [cx + rx, cy],
    segs: [
      { c1: [cx + rx, cy + ky], c2: [cx + kx, cy + ry], to: [cx, cy + ry] },
      { c1: [cx - kx, cy + ry], c2: [cx - rx, cy + ky], to: [cx - rx, cy] },
      { c1: [cx - rx, cy - ky], c2: [cx - kx, cy - ry], to: [cx, cy - ry] },
      { c1: [cx + kx, cy - ry], c2: [cx + rx, cy - ky], to: [cx + rx, cy] },
    ],
    closed: true,
  };
}

function cmdsToSubs(cmds: Cmd[]): Sub[] {
  const subs: Sub[] = [];
  let cur: Sub | null = null;
  for (const c of cmds) {
    if (c[0] === 1) subs.push((cur = { start: [c[1], c[2]], segs: [], closed: false }));
    else if (c[0] === 2) cur?.segs.push({ to: [c[1], c[2]] });
    else if (c[0] === 4) cur?.segs.push({ c1: [c[1], c[2]], c2: [c[3], c[4]], to: [c[5], c[6]] });
    else if (c[0] === 0 && cur) cur.closed = true;
  }
  return subs;
}

/** Any SVG shape element as subpaths in its own user space. */
function subsOf(el: SVGGeometryElement): Sub[] {
  const v = (a: SVGAnimatedLength) => a.baseVal.value;
  switch (el.tagName.toLowerCase()) {
    case "path":
      return parsePath(el.getAttribute("d") ?? "");
    case "rect": {
      const r = el as SVGRectElement;
      const rad = Math.min(v(r.rx) || v(r.ry), v(r.ry) || v(r.rx));
      return cmdsToSubs(roundedRect(v(r.x), v(r.y), v(r.width), v(r.height), [rad, rad, rad, rad]));
    }
    case "circle": {
      const c = el as SVGCircleElement;
      return [ellipse(v(c.cx), v(c.cy), v(c.r), v(c.r))];
    }
    case "ellipse": {
      const e = el as SVGEllipseElement;
      return [ellipse(v(e.cx), v(e.cy), v(e.rx), v(e.ry))];
    }
    case "line": {
      const l = el as SVGLineElement;
      return [{ start: [v(l.x1), v(l.y1)], segs: [{ to: [v(l.x2), v(l.y2)] }], closed: false }];
    }
    case "polyline":
    case "polygon": {
      const pts = [...(el as SVGPolylineElement).points].map((p): P => [p.x, p.y]);
      if (!pts.length) return [];
      return [{ start: pts[0], segs: pts.slice(1).map((to) => ({ to })), closed: el.tagName.toLowerCase() === "polygon" }];
    }
  }
  return [];
}

export interface SvgStroke {
  color: RGBA;
  width: number;
  cap: "NONE" | "ROUND" | "SQUARE";
  join: "MITER" | "BEVEL" | "ROUND";
  miter: number;
  dash: number[];
  /** The stroke's outline, for Figma to draw before it works one out itself. */
  outline: Sub[];
}

export interface SvgShape {
  subs: Sub[];
  fill: RGBA | null;
  gradient?: FGradient;
  stroke?: SvgStroke;
  evenOdd: boolean;
  opacity: number;
}

function paint(value: string, opacity: string): RGBA | null {
  const m = /rgba?\(([^)]+)\)/.exec(value);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  const alpha = a * Number(opacity || 1);
  return alpha > 0 ? { r: r / 255, g: g / 255, b: b / 255, a: alpha } : null;
}

/* ---------- strokes as outlines ---------- */

const flatten = (s: Sub): P[] => {
  const pts: P[] = [s.start];
  let p = s.start;
  for (const g of s.segs) {
    if (g.c1 && g.c2) {
      const n = Math.min(24, Math.max(4, Math.ceil((Math.hypot(g.c1[0] - p[0], g.c1[1] - p[1]) + Math.hypot(g.c2[0] - g.c1[0], g.c2[1] - g.c1[1]) + Math.hypot(g.to[0] - g.c2[0], g.to[1] - g.c2[1])) / 2)));
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        pts.push([cubicAt(p[0], g.c1[0], g.c2[0], g.to[0], t), cubicAt(p[1], g.c1[1], g.c2[1], g.to[1], t)]);
      }
    } else pts.push(g.to);
    p = g.to;
  }
  return pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 1e-4);
};

/** A closed polygon, wound clockwise on screen, so any number of them fill as one under non-zero. */
const poly = (pts: P[]): Sub => {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [a, b] = [pts[i], pts[(i + 1) % pts.length]];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const ring = area < 0 ? [...pts].reverse() : pts;
  return { start: ring[0], segs: ring.slice(1).map((to) => ({ to })).concat([{ to: ring[0] }]), closed: true };
};

const disc = (c: P, r: number): Sub => poly(Array.from({ length: 24 }, (_, i) => [c[0] + r * Math.cos((i / 24) * 2 * Math.PI), c[1] + r * Math.sin((i / 24) * 2 * Math.PI)] as P));

/** Splits a polyline into its dashes. */
function dashes(pts: P[], closed: boolean, pattern: number[], offset: number): P[][] {
  const line = closed ? [...pts, pts[0]] : pts;
  const out: P[][] = [];
  const total = pattern.reduce((a, b) => a + b, 0);
  if (total <= 0) return [line];
  let k = 0;
  let left = pattern[0];
  // Start part-way into the pattern by the offset.
  for (let o = ((offset % total) + total) % total; o > 0; ) {
    if (o >= left) {
      o -= left;
      k = (k + 1) % pattern.length;
      left = pattern[k];
    } else {
      left -= o;
      o = 0;
    }
  }
  let cur: P[] | null = k % 2 === 0 ? [line[0]] : null;
  for (let i = 1; i < line.length; i++) {
    let a = line[i - 1];
    const b = line[i];
    let len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (len > 0) {
      const step = Math.min(left, len);
      const t = step / len;
      const m: P = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      if (cur) cur.push(m);
      len -= step;
      left -= step;
      a = m;
      if (left <= 1e-6) {
        k = (k + 1) % pattern.length;
        left = pattern[k];
        if (cur) {
          if (cur.length > 1) out.push(cur);
          cur = null;
        } else cur = [m];
      }
    }
  }
  if (cur && cur.length > 1) out.push(cur);
  return out;
}

/** The area a stroke covers, as polygons: a band per segment, a joint per corner, a cap per open end. */
export function strokeOutline(subs: Sub[], width: number, cap: SvgStroke["cap"], join: SvgStroke["join"], miter: number, dash: number[], dashOffset = 0): Sub[] {
  const r = width / 2;
  const out: Sub[] = [];
  for (const s of subs) {
    const pts = flatten(s);
    const closed = s.closed && pts.length > 2;
    const ring = closed && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 1e-4 ? pts.slice(0, -1) : pts;
    const pieces = dash.length ? dashes(ring, closed, dash, dashOffset).map((p) => ({ p, closed: false })) : [{ p: ring, closed }];
    for (const { p, closed: shut } of pieces) {
      if (p.length < 2) {
        if (cap === "ROUND" && p.length === 1) out.push(disc(p[0], r));
        continue;
      }
      const n = p.length;
      const segs = shut ? n : n - 1;
      const dir = (i: number): P => {
        const [a, b] = [p[i % n], p[(i + 1) % n]];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
      };
      for (let i = 0; i < segs; i++) {
        const [a, b] = [p[i], p[(i + 1) % n]];
        const [dx, dy] = dir(i);
        const [nx, ny] = [-dy * r, dx * r];
        out.push(poly([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]));
      }
      // Corners: every inner point, and the first one too on a closed path.
      for (let i = shut ? 0 : 1; i < (shut ? n : n - 1); i++) {
        const v = p[i];
        const d1 = dir((i - 1 + n) % n);
        const d2 = dir(i);
        const cross = d1[0] * d2[1] - d1[1] * d2[0];
        if (Math.abs(cross) < 1e-6 && d1[0] * d2[0] + d1[1] * d2[1] > 0) continue;
        if (join === "ROUND") {
          out.push(disc(v, r));
          continue;
        }
        // The outer side of the turn.
        const s1 = cross > 0 ? -1 : 1;
        const p1: P = [v[0] - d1[1] * r * s1, v[1] + d1[0] * r * s1];
        const p2: P = [v[0] - d2[1] * r * s1, v[1] + d2[0] * r * s1];
        const cos = Math.max(-1, Math.min(1, -(d1[0] * d2[0] + d1[1] * d2[1])));
        const ratio = 1 / Math.sin(Math.acos(cos) / 2);
        if (join === "MITER" && ratio <= miter) {
          const bis: P = [p1[0] + p2[0] - 2 * v[0], p1[1] + p2[1] - 2 * v[1]];
          const bl = Math.hypot(bis[0], bis[1]) || 1;
          const tip: P = [v[0] + (bis[0] / bl) * r * ratio, v[1] + (bis[1] / bl) * r * ratio];
          out.push(poly([v, p1, tip, p2]));
        } else out.push(poly([v, p1, p2]));
      }
      if (!shut)
        for (const [e, d] of [
          [p[0], dir(0).map((x) => -x)],
          [p[n - 1], dir(n - 2)],
        ] as Array<[P, number[]]>) {
          if (cap === "ROUND") out.push(disc(e, r));
          else if (cap === "SQUARE") {
            const [nx, ny] = [-d[1] * r, d[0] * r];
            const f: P = [e[0] + d[0] * r, e[1] + d[1] * r];
            out.push(poly([[e[0] + nx, e[1] + ny], [f[0] + nx, f[1] + ny], [f[0] - nx, f[1] - ny], [e[0] - nx, e[1] - ny]]));
          }
        }
    }
  }
  return out;
}

/* ---------- gradients inside an SVG ---------- */

type Affine = [number, number, number, number, number, number];
/** a·b for affine maps written [a, b, c, d, e, f] (x' = a x + c y + e, y' = b x + d y + f). */
const mul = (m: Affine, n: Affine): Affine => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const inv = ([a, b, c, d, e, f]: Affine): Affine => {
  const det = a * d - b * c || 1e-9;
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
};

/**
 * A shape's url(#id) gradient as a Figma gradient over the shape's own box on screen. Every step
 * is an affine map, so gradientTransform, bounding-box units and the drawing's own transforms
 * all compose: Figma's gradient space, the SVG gradient, its units, the screen, the layer box.
 */
function svgGradient(el: SVGGraphicsElement, value: string, opacity: number, m: DOMMatrix, box: DOMRect, b: { x: number; y: number; w: number; h: number }): FGradient | null {
  const id = value.match(/url\("?#([^")]+)"?\)/)?.[1];
  const g = id ? el.ownerSVGElement?.querySelector<SVGGradientElement>(`#${CSS.escape(id)}`) : null;
  if (!g) return null;
  const stops = [...g.querySelectorAll("stop")].map((s) => {
    const cs = getComputedStyle(s);
    const c = paint(cs.stopColor, String(Number(cs.stopOpacity || 1) * opacity)) ?? { ...(paint(cs.stopColor, "1") ?? { r: 0, g: 0, b: 0, a: 1 }), a: 0 };
    const off = s.getAttribute("offset") ?? "0";
    return { color: c, at: Math.min(1, Math.max(0, off.endsWith("%") ? parseFloat(off) / 100 : parseFloat(off))) };
  });
  if (stops.length < 2) return null;
  const user = g.getAttribute("gradientUnits") === "userSpaceOnUse";
  const vb = el.ownerSVGElement?.viewBox.baseVal;
  const [VW, VH] = [vb?.width || box.width, vb?.height || box.height];
  const num = (name: string, def: string, of: number) => {
    const v = g.getAttribute(name) ?? def;
    return v.endsWith("%") ? (parseFloat(v) / 100) * (user ? of : 1) : parseFloat(v);
  };
  const bb = el.getBBox();
  const units: Affine = user ? [1, 0, 0, 1, 0, 0] : [bb.width, 0, 0, bb.height, bb.x, bb.y];
  const gt = g.gradientTransform.baseVal.consolidate()?.matrix;
  const G: Affine = gt ? [gt.a, gt.b, gt.c, gt.d, gt.e, gt.f] : [1, 0, 0, 1, 0, 0];
  const screen: Affine = [m.a, m.b, m.c, m.d, m.e - box.left, m.f - box.top];
  const toBox: Affine = [1 / b.w, 0, 0, 1 / b.h, -b.x / b.w, -b.y / b.h];
  let A: Affine;
  let type: FGradient["type"];
  if (g.tagName.toLowerCase() === "lineargradient") {
    const [x1, y1, x2, y2] = [num("x1", "0%", VW), num("y1", "0%", VH), num("x2", "100%", VW), num("y2", "0%", VH)];
    // Along the gradient, then across it at the same length.
    A = [x2 - x1, y2 - y1, -(y2 - y1), x2 - x1, x1 + 0.5 * (y2 - y1), y1 - 0.5 * (x2 - x1)];
    type = "LINEAR";
  } else {
    const r = num("r", "50%", Math.hypot(VW, VH) / Math.SQRT2);
    const [cx, cy] = [num("cx", "50%", VW), num("cy", "50%", VH)];
    A = [2 * r, 0, 0, 2 * r, cx - r, cy - r];
    type = "RADIAL";
  }
  const M = mul(toBox, mul(screen, mul(units, mul(G, A))));
  const T = inv(M);
  const at = (u: number, v: number): [number, number] => [M[0] * u + M[2] * v + M[4], M[1] * u + M[3] * v + M[5]];
  return type === "LINEAR"
    ? { type, stops, from: at(0, 0.5), to: at(1, 0.5), transform: [T[0], T[2], T[4], T[1], T[3], T[5]] }
    : { type, stops, center: at(0.5, 0.5), radius: [Math.hypot(M[0], M[1]) / 2, Math.hypot(M[2], M[3]) / 2], transform: [T[0], T[2], T[4], T[1], T[3], T[5]] };
}

/** True when every clip in the drawing is a plain rectangle at least as big as the drawing itself. */
function clipsAreFrames(svg: SVGSVGElement) {
  const vb = svg.viewBox.baseVal;
  const [W, H] = vb && vb.width ? [vb.width, vb.height] : [svg.width.baseVal.value, svg.height.baseVal.value];
  return [...svg.querySelectorAll("clipPath")].every((c) => {
    const kids = [...c.children];
    if (kids.length !== 1 || kids[0].tagName.toLowerCase() !== "rect" || c.getAttribute("clipPathUnits") === "objectBoundingBox") return false;
    const r = (kids[0] as SVGRectElement).getBBox();
    return r.x <= 0.01 && r.y <= 0.01 && r.x + r.width >= W - 0.01 && r.y + r.height >= H - 0.01;
  });
}

/** Writes every <use> out as the shapes it points at, so the drawing is all plain shapes. False if one can't be. */
function expandUses(svg: SVGSVGElement) {
  for (let pass = 0; pass < 6; pass++) {
    const uses = [...svg.querySelectorAll("use")];
    if (!uses.length) return true;
    for (const u of uses) {
      const ref = (u.getAttribute("href") ?? u.getAttribute("xlink:href") ?? "").replace(/^#/, "");
      const target = ref ? svg.querySelector(`#${CSS.escape(ref)}`) : null;
      if (!target || target.tagName.toLowerCase() === "symbol" || target.contains(u)) return false;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      for (const a of ["style", "opacity", "fill", "stroke", "stroke-width", "class"]) if (u.hasAttribute(a)) g.setAttribute(a, u.getAttribute(a)!);
      const [x, y] = [parseFloat(u.getAttribute("x") ?? "0") || 0, parseFloat(u.getAttribute("y") ?? "0") || 0];
      g.setAttribute("transform", `${u.getAttribute("transform") ?? ""} translate(${x} ${y})`.trim());
      const clone = target.cloneNode(true) as Element;
      clone.removeAttribute("id");
      g.appendChild(clone);
      u.replaceWith(g);
    }
  }
  return !svg.querySelector("use");
}

/**
 * Shapes from an SVG, in the SVG's own pixel space: fills (flat or gradient) and strokes (with
 * their caps, joins and dashes). Null when the drawing needs what vectors can't carry (masks,
 * patterns, filters, images, text, shaped clips): those travel as images instead.
 */
export function svgShapes(markup: string, w: number, h: number): SvgShape[] | null {
  const host = document.createElement("div");
  host.style.cssText = `position:absolute;left:-20000px;top:0;width:${w}px;height:${h}px;pointer-events:none`;
  host.innerHTML = markup;
  document.body.appendChild(host);
  try {
    const svg = host.querySelector("svg");
    if (!svg || !expandUses(svg) || svg.querySelector("image,text,foreignObject,mask,pattern,filter")) return null;
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    if (svg.querySelector("clipPath") && !clipsAreFrames(svg)) return null;
    // Points go element space -> screen -> the SVG's own pixel box (viewBox scaling included).
    const box = svg.getBoundingClientRect();
    const out: SvgShape[] = [];
    for (const el of svg.querySelectorAll<SVGGeometryElement>("path,rect,circle,ellipse,line,polyline,polygon")) {
      if (el.closest("defs,clipPath,symbol,marker")) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const m = el.getScreenCTM();
      if (!m) continue;
      let opacity = 1;
      for (let n: Element | null = el; n && n !== host; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity || 1);
      const tf = (p: P): P => [m.a * p[0] + m.c * p[1] + m.e - box.left, m.b * p[0] + m.d * p[1] + m.f - box.top];
      const subs = subsOf(el).map((s) => ({ start: tf(s.start), closed: s.closed, segs: s.segs.map((g) => ({ to: tf(g.to), ...(g.c1 ? { c1: tf(g.c1), c2: tf(g.c2!) } : {}) })) }));
      if (!subs.length) continue;
      const b = bounds(subs);
      const urlFill = cs.fill.startsWith("url(");
      const gradient = urlFill ? svgGradient(el, cs.fill, Number(cs.fillOpacity || 1), m, box, b) : null;
      if (urlFill && !gradient) return null;
      const fill = gradient ? null : paint(cs.fill, cs.fillOpacity);
      const strokeColor = cs.stroke.startsWith("url(") ? undefined : paint(cs.stroke, cs.strokeOpacity);
      if (cs.stroke.startsWith("url(")) return null;
      const scale = cs.vectorEffect === "non-scaling-stroke" ? 1 : Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      const sw = parseFloat(cs.strokeWidth) * scale;
      let stroke: SvgStroke | undefined;
      if (strokeColor && sw > 0) {
        const cap = cs.strokeLinecap === "round" ? "ROUND" : cs.strokeLinecap === "square" ? "SQUARE" : "NONE";
        const join = cs.strokeLinejoin === "round" ? "ROUND" : cs.strokeLinejoin === "bevel" ? "BEVEL" : "MITER";
        const miter = parseFloat(cs.strokeMiterlimit) || 4;
        const dash = cs.strokeDasharray && cs.strokeDasharray !== "none" ? cs.strokeDasharray.split(/[\s,]+/).map((v) => parseFloat(v) * scale).filter((v) => v >= 0) : [];
        const pattern = dash.length % 2 ? [...dash, ...dash] : dash;
        stroke = { color: strokeColor, width: sw, cap, join, miter, dash: pattern, outline: strokeOutline(subs, sw, cap, join, miter, pattern, (parseFloat(cs.strokeDashoffset) || 0) * scale) };
      }
      if (!fill && !gradient && !stroke) continue;
      out.push({ subs, fill, ...(gradient ? { gradient } : {}), ...(stroke ? { stroke } : {}), evenOdd: cs.fillRule === "evenodd", opacity });
    }
    return out.length ? out : null;
  } catch {
    return null;
  } finally {
    host.remove();
  }
}

/* ---------- vectors ---------- */

function cubicAt(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** Tight-enough bounds: curves sampled rather than boxed by their control points. */
export function bounds(subs: Sub[]) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  const add = ([x, y]: P) => {
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  };
  for (const s of subs) {
    let p = s.start;
    add(p);
    for (const g of s.segs) {
      if (g.c1 && g.c2) for (let t = 0.125; t < 1; t += 0.125) add([cubicAt(p[0], g.c1[0], g.c2[0], g.to[0], t), cubicAt(p[1], g.c1[1], g.c2[1], g.to[1], t)]);
      add(g.to);
      p = g.to;
    }
  }
  return { x: x0, y: y0, w: Math.max(0.01, x1 - x0), h: Math.max(0.01, y1 - y0) };
}

/** Outline commands for subpaths, moved so (ox, oy) is the origin. */
export function subsToCmds(subs: Sub[], ox: number, oy: number): Cmd[] {
  const out: Cmd[] = [];
  for (const s of subs) {
    out.push([1, s.start[0] - ox, s.start[1] - oy]);
    for (const g of s.segs) out.push(g.c1 && g.c2 ? [4, g.c1[0] - ox, g.c1[1] - oy, g.c2[0] - ox, g.c2[1] - oy, g.to[0] - ox, g.to[1] - oy] : [2, g.to[0] - ox, g.to[1] - oy]);
    if (s.closed) out.push([0]);
  }
  return out;
}

/**
 * Figma's vector network: vertices (style, x, y), segments (style, start, start tangent, end,
 * end tangent) and filled regions made of loops of segments. A region's first word carries the
 * fill rule in its low bit (1 for non-zero).
 */
export function vectorNetwork(subs: Sub[], ox: number, oy: number, evenOdd: boolean) {
  const verts: P[] = [];
  const segs: Array<[number, P, number, P]> = [];
  const loops: number[][] = [];
  const near = (a: P, b: P) => Math.abs(a[0] - b[0]) < 1e-3 && Math.abs(a[1] - b[1]) < 1e-3;
  for (const s of subs) {
    const first = verts.push([s.start[0] - ox, s.start[1] - oy]) - 1;
    let prev = first;
    let prevPt = s.start;
    const loop: number[] = [];
    s.segs.forEach((g, i) => {
      const closing = s.closed && i === s.segs.length - 1 && near(g.to, s.start);
      const end = closing ? first : verts.push([g.to[0] - ox, g.to[1] - oy]) - 1;
      const ts: P = g.c1 ? [g.c1[0] - prevPt[0], g.c1[1] - prevPt[1]] : [0, 0];
      const te: P = g.c2 ? [g.c2[0] - g.to[0], g.c2[1] - g.to[1]] : [0, 0];
      loop.push(segs.push([prev, ts, end, te]) - 1);
      prev = end;
      prevPt = g.to;
    });
    if (s.closed && prev !== first) loop.push(segs.push([prev, [0, 0], first, [0, 0]]) - 1);
    if (s.closed && loop.length) loops.push(loop);
  }
  const size = 12 + verts.length * 12 + segs.length * 28 + (loops.length ? 8 + loops.reduce((n, l) => n + 4 + l.length * 4, 0) : 0);
  const out = new Uint8Array(size);
  const v = new DataView(out.buffer);
  let o = 0;
  const u32 = (n: number) => {
    v.setUint32(o, n, true);
    o += 4;
  };
  const f32 = (n: number) => {
    v.setFloat32(o, n, true);
    o += 4;
  };
  u32(verts.length);
  u32(segs.length);
  u32(loops.length ? 1 : 0);
  for (const [x, y] of verts) {
    u32(0);
    f32(x);
    f32(y);
  }
  for (const [a, ts, b, te] of segs) {
    u32(0);
    u32(a);
    f32(ts[0]);
    f32(ts[1]);
    u32(b);
    f32(te[0]);
    f32(te[1]);
  }
  if (loops.length) {
    u32(evenOdd ? 0 : 1);
    u32(loops.length);
    for (const l of loops) {
      u32(l.length);
      l.forEach(u32);
    }
  }
  return out;
}
