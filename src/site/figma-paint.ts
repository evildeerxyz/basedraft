import type { RGBA } from "./figma-tree";

/*
 * The parts of CSS painting that Figma has its own layers for: gradients become gradient fills,
 * shadows and blurs become effects, and the dither textures the templates tile from tiny SVGs
 * (as backgrounds or masks) become real vector dots. Nothing here is drawn as a picture unless
 * it truly is one, or it would take more shapes than Figma can comfortably hold.
 */

type Color = (c: string) => RGBA | null;

/** Splits a CSS value at top-level commas (layers) or spaces (tokens), leaving functions whole. */
export function splitTop(s: string, sep: "," | " ") {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth === 0 && (sep === "," ? ch === "," : /\s/.test(ch))) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/* ---------- gradients ---------- */

export interface FStop {
  color: RGBA;
  at: number;
}

/**
 * A gradient fill. `transform` is Figma's: it maps the layer's unit square onto the gradient's
 * own space, where a linear gradient runs from (0, 0.5) to (1, 0.5) and a radial one fills the
 * circle around (0.5, 0.5). `from`, `to`, `center` and `radius` are the same, in the box's 0 to 1.
 */
export interface FGradient {
  type: "LINEAR" | "RADIAL" | "ANGULAR";
  stops: FStop[];
  transform: [number, number, number, number, number, number];
  space?: "OKLAB" | "OKLCH";
  from?: [number, number];
  to?: [number, number];
  center?: [number, number];
  radius?: [number, number];
}

const POSITION = /^-?[\d.]+(px|%)?$/;
const CLEAR: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function stopsOf(args: string[], length: number, color: Color, repeating: boolean): FStop[] | null {
  const raw: Array<{ color: RGBA; at: number | null }> = [];
  for (const a of args) {
    const toks = splitTop(a, " ");
    const pos = toks.filter((t) => POSITION.test(t));
    const col = toks.filter((t) => !POSITION.test(t)).join(" ");
    // A lone position is a color hint; Figma has none, so the midpoint stays where it falls.
    if (!col) continue;
    const c = color(col) ?? CLEAR;
    const at = (t: string) => (t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t) / Math.max(1, length));
    if (!pos.length) raw.push({ color: c, at: null });
    else for (const p of pos) raw.push({ color: c, at: at(p) });
  }
  if (raw.length < 2) return null;
  // Unplaced stops: the first at 0, the last at 1, the rest spread evenly; never backwards.
  raw[0].at ??= 0;
  raw[raw.length - 1].at ??= 1;
  let max = -Infinity;
  for (const r of raw)
    if (r.at !== null) {
      r.at = Math.max(r.at, max);
      max = r.at;
    }
  for (let i = 1; i < raw.length; i++) {
    if (raw[i].at !== null) continue;
    let j = i;
    while (raw[j].at === null) j++;
    const a = raw[i - 1].at!;
    const b = raw[j].at!;
    for (let k = i; k < j; k++) raw[k].at = a + ((b - a) * (k - i + 1)) / (j - i + 1);
  }
  let stops = raw.map((r) => ({ color: r.color, at: r.at! }));
  if (repeating) {
    const first = stops[0].at;
    const period = stops[stops.length - 1].at - first;
    if (period > 0.001) {
      const one = stops.map((s) => ({ ...s, at: s.at - first }));
      stops = [];
      for (let k = 0; first + k * period < 1 && stops.length < 240; k++) stops.push(...one.map((s) => ({ ...s, at: first + k * period + s.at })));
    }
  }
  // Fades to transparent keep their neighbor's color, so they don't go grey on the way out.
  stops.forEach((s, i) => {
    if (s.color.a > 0) return;
    const near = stops.slice(i + 1).find((t) => t.color.a > 0) ?? [...stops.slice(0, i)].reverse().find((t) => t.color.a > 0);
    if (near) s.color = { ...near.color, a: 0 };
  });
  // Figma keeps stops between 0 and 1.
  return stops.filter((s, i) => s.at <= 1 || i === 0 || stops[i - 1].at < 1).map((s) => ({ ...s, at: Math.min(1, Math.max(0, s.at)) }));
}

const invert = ([a, b, c, d, e, f]: number[]): FGradient["transform"] => {
  // [a c e; b d f] maps (u, v) to (a u + c v + e, b u + d v + f).
  const det = a * d - b * c || 1e-9;
  return [d / det, -c / det, (c * f - d * e) / det, -b / det, a / det, (b * e - a * f) / det];
};

/** Figma's transform for a linear gradient from one point of a `w` by `h` box to another, both 0 to 1. */
export function linearTransform(from: [number, number], to: [number, number], w: number, h: number) {
  // Across the gradient, as long as it is along it, in the box's own units.
  const [dx, dy] = [(to[0] - from[0]) * w, (to[1] - from[1]) * h];
  const q = [-dy / w, dx / h];
  return invert([to[0] - from[0], to[1] - from[1], q[0], q[1], from[0] - 0.5 * q[0], from[1] - 0.5 * q[1]]);
}

/** Figma's transform for a radial gradient around `center` with radii `radius`, all 0 to 1 of the box. */
export const radialTransform = ([x, y]: [number, number], [rx, ry]: [number, number]) => invert([2 * rx, 0, 0, 2 * ry, x - rx, y - ry]);

function angleOf(t: string) {
  const n = parseFloat(t);
  if (t.endsWith("turn")) return n * 360;
  if (t.endsWith("grad")) return n * 0.9;
  if (t.endsWith("rad")) return (n * 180) / Math.PI;
  return n;
}

const spaceOf = (s: string): FGradient["space"] => (/in oklch/.test(s) ? "OKLCH" : /in oklab/.test(s) ? "OKLAB" : undefined);

function linear(args: string[], w: number, h: number, color: Color, repeating: boolean): FGradient | null {
  let angle = 180;
  let space: FGradient["space"];
  if (/^(to |in |-?[\d.]+(deg|turn|rad|grad)\b)/.test(args[0])) {
    const head = args.shift()!;
    space = spaceOf(head);
    const dir = head.replace(/\bin \S+( \S+ hue)?/, "").trim();
    if (dir.startsWith("to ")) {
      const s = dir.slice(3).split(/\s+/).sort().join(" ");
      const k = (Math.atan2(h, w) * 180) / Math.PI;
      angle = ({ top: 0, right: 90, bottom: 180, left: 270, "right top": k, "bottom right": 180 - k, "bottom left": 180 + k, "left top": 360 - k } as Record<string, number>)[s] ?? 180;
    } else if (dir) angle = angleOf(dir);
  }
  const t = (angle * Math.PI) / 180;
  const [dx, dy] = [Math.sin(t), -Math.cos(t)];
  const L = Math.abs(w * dx) + Math.abs(h * dy);
  const stops = stopsOf(args, L, color, repeating);
  if (!stops) return null;
  const from: [number, number] = [(w / 2 - (dx * L) / 2) / w, (h / 2 - (dy * L) / 2) / h];
  const to: [number, number] = [(w / 2 + (dx * L) / 2) / w, (h / 2 + (dy * L) / 2) / h];
  return { type: "LINEAR", stops, space, from, to, transform: linearTransform(from, to, w, h) };
}

function lengthIn(t: string, of: number) {
  return t.endsWith("%") ? (parseFloat(t) / 100) * of : parseFloat(t);
}

/** "at left top", "at 50% 0%", "at 20px": where in the box. */
function positionIn(toks: string[], w: number, h: number): [number, number] {
  const kw: Record<string, number> = { left: 0, center: 0.5, right: 1, top: 0, bottom: 1 };
  let [a, b] = toks.length ? toks : ["center"];
  if (b === undefined) b = a === "top" || a === "bottom" ? "center" : "center";
  if (a === "top" || a === "bottom" || b === "left" || b === "right") [a, b] = [b, a];
  const x = a in kw ? kw[a] * w : lengthIn(a, w);
  const y = b in kw ? kw[b] * h : lengthIn(b, h);
  return [x, y];
}

function radial(args: string[], w: number, h: number, color: Color, repeating: boolean): FGradient | null {
  let circle = false;
  let size = "farthest-corner";
  const lengths: string[] = [];
  let [cx, cy] = [w / 2, h / 2];
  let space: FGradient["space"];
  if (/^(circle|ellipse|closest|farthest|at |in |-?[\d.]+(px|%))/.test(args[0])) {
    const head = args.shift()!;
    space = spaceOf(head);
    const [shape, at] = head.replace(/\bin \S+( \S+ hue)?/, "").split(/\bat\b/);
    for (const t of shape.trim().split(/\s+/).filter(Boolean)) {
      if (t === "circle") circle = true;
      else if (t === "ellipse") circle = false;
      else if (/^(closest|farthest)-/.test(t)) size = t;
      else lengths.push(t);
    }
    if (at) [cx, cy] = positionIn(at.trim().split(/\s+/), w, h);
    if (lengths.length === 1) circle = true;
  }
  let rx: number;
  let ry: number;
  if (lengths.length) {
    rx = lengthIn(lengths[0], w);
    ry = lengths[1] ? lengthIn(lengths[1], h) : rx;
  } else {
    const sides = [cx, w - cx, cy, h - cy];
    const corners = [Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)];
    if (circle) rx = ry = size === "closest-side" ? Math.min(...sides) : size === "farthest-side" ? Math.max(...sides) : size === "closest-corner" ? Math.min(...corners) : Math.max(...corners);
    else {
      const far = size.startsWith("farthest");
      rx = far ? Math.max(cx, w - cx) : Math.min(cx, w - cx);
      ry = far ? Math.max(cy, h - cy) : Math.min(cy, h - cy);
      if (size.endsWith("corner")) [rx, ry] = [rx * Math.SQRT2, ry * Math.SQRT2];
    }
  }
  rx = Math.max(0.01, rx);
  ry = Math.max(0.01, ry);
  const stops = stopsOf(args, rx, color, repeating);
  if (!stops) return null;
  const [nx, ny, nrx, nry] = [cx / w, cy / h, rx / w, ry / h];
  return { type: "RADIAL", stops, space, center: [nx, ny], radius: [nrx, nry], transform: radialTransform([nx, ny], [nrx, nry]) };
}

function conic(args: string[], w: number, h: number, color: Color): FGradient | null {
  let from = 0;
  let [cx, cy] = [w / 2, h / 2];
  if (/^(from |at |in )/.test(args[0])) {
    const head = args.shift()!.replace(/\bin \S+( \S+ hue)?/, "");
    const m = head.match(/from\s+(\S+)/);
    if (m) from = angleOf(m[1]);
    const at = head.split(/\bat\b/)[1];
    if (at) [cx, cy] = positionIn(at.trim().split(/\s+/), w, h);
  }
  const stops = stopsOf(
    args.map((a) => a.replace(/(-?[\d.]+)(deg|turn|rad|grad)/g, (_, n, u) => `${(angleOf(n + u) / 360) * 100}%`)),
    1,
    color,
    false,
  );
  if (!stops) return null;
  // Figma's angular gradient starts at three o'clock; CSS starts at twelve.
  const t = ((from - 90) * Math.PI) / 180;
  const D = Math.max(w, h);
  const [a, b, c, d] = [(D * Math.cos(t)) / w, (D * Math.sin(t)) / h, (-D * Math.sin(t)) / w, (D * Math.cos(t)) / h];
  const [nx, ny] = [cx / w, cy / h];
  return { type: "ANGULAR", stops, center: [nx, ny], transform: invert([a, b, c, d, nx - 0.5 * a - 0.5 * c, ny - 0.5 * b - 0.5 * d]) };
}

/** Every gradient layer of a background, topmost first, as CSS lists them. Tiled ones are left to patterns. */
export function gradientsOf(image: string, size: string, w: number, h: number, color: Color): FGradient[] {
  if (!image || image === "none" || !image.includes("gradient(")) return [];
  const sizes = splitTop(size, ",");
  const out: FGradient[] = [];
  splitTop(image, ",").forEach((layer, i) => {
    const m = layer.match(/^(repeating-)?(linear|radial|conic)-gradient\(([\s\S]*)\)$/);
    if (!m) return;
    const sz = (sizes[i] ?? sizes[0] ?? "auto").trim();
    // A gradient tiled at a set size (grid lines, stripes) isn't one gradient across the box.
    if (!/^(auto|auto auto|100% 100%|100%|cover)$/.test(sz)) return;
    const args = splitTop(m[3], ",");
    const g = m[2] === "linear" ? linear(args, w, h, color, Boolean(m[1])) : m[2] === "radial" ? radial(args, w, h, color, Boolean(m[1])) : conic(args, w, h, color);
    if (g) out.push(g);
  });
  return out;
}

/* ---------- shadows and blurs ---------- */

export interface FEffect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "FOREGROUND_BLUR" | "BACKGROUND_BLUR";
  radius: number;
  color?: RGBA;
  x?: number;
  y?: number;
  spread?: number;
}

/** box-shadow, filter and backdrop-filter as Figma effects. Lengths are scaled by `k`, the element's zoom. */
export function effectsOf(cs: CSSStyleDeclaration, color: Color, k = 1): FEffect[] {
  const out: FEffect[] = [];
  if (cs.boxShadow && cs.boxShadow !== "none")
    for (const s of splitTop(cs.boxShadow, ",")) {
      const toks = splitTop(s, " ");
      const inset = toks.includes("inset");
      const lens = toks.filter((t) => /^-?[\d.]+(px)?$/.test(t)).map(parseFloat);
      const col = color(toks.filter((t) => t !== "inset" && !/^-?[\d.]+(px)?$/.test(t)).join(" "));
      if (!col || col.a === 0 || lens.length < 2) continue;
      const [x, y, blur = 0, spread = 0] = lens.map((n) => n * k);
      out.push({ type: inset ? "INNER_SHADOW" : "DROP_SHADOW", color: col, x, y, radius: blur, spread });
    }
  // Figma's blur radius is twice the CSS one.
  const blur = (f: string) => parseFloat(f.match(/blur\(([\d.]+)px\)/)?.[1] ?? "0") * 2 * k;
  if (cs.filter && cs.filter !== "none") {
    const r = blur(cs.filter);
    if (r > 0) out.push({ type: "FOREGROUND_BLUR", radius: r });
    for (const m of cs.filter.matchAll(/drop-shadow\(((?:[^()]|\([^()]*\))*)\)/g)) {
      const toks = splitTop(m[1], " ");
      const lens = toks.filter((t) => /^-?[\d.]+(px)?$/.test(t)).map(parseFloat);
      const col = color(toks.filter((t) => !/^-?[\d.]+(px)?$/.test(t)).join(" ")) ?? { r: 0, g: 0, b: 0, a: 1 };
      if (lens.length >= 2 && col.a > 0) out.push({ type: "DROP_SHADOW", color: col, x: lens[0] * k, y: lens[1] * k, radius: (lens[2] ?? 0) * k, spread: 0 });
    }
  }
  const bf = (cs as CSSStyleDeclaration & { webkitBackdropFilter?: string }).backdropFilter || (cs as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter;
  if (bf && bf !== "none") {
    const r = blur(bf);
    if (r > 0) out.push({ type: "BACKGROUND_BLUR", radius: r });
  }
  return out;
}

/* ---------- dither textures: tiny SVG tiles, repeated ---------- */

interface Tile {
  w: number;
  h: number;
  lit: Uint8Array;
  color: RGBA;
  /** The tile drawn at 8x, for when a texture is too big to become dots. */
  src: string;
  big: HTMLCanvasElement;
}

const tiles = new Map<string, Promise<Tile | null>>();
/** Tiles by the CSS size they're drawn at and their URL, once read. */
const ready = new Map<string, Tile | null>();

const tileKey = (url: string, w: number, h: number) => `${w}x${h}|${url}`;

function sizeOf(size: string, img: HTMLImageElement): [number, number] {
  const [a, b] = size.trim().split(/\s+/);
  const nw = img.naturalWidth || 8;
  const nh = img.naturalHeight || 8;
  if (!a || a === "auto") return [nw, nh];
  const w = parseFloat(a);
  const h = !b || b === "auto" ? (w / nw) * nh : parseFloat(b);
  return [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))];
}

async function loadTile(url: string, size: string) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const [w, h] = sizeOf(size, img);
  const key = tileKey(url, w, h);
  if (!tiles.has(key))
    tiles.set(
      key,
      (async () => {
        const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
        const g = c.getContext("2d", { willReadFrequently: true });
        if (!g) return null;
        g.imageSmoothingEnabled = false;
        g.drawImage(img, 0, 0, w, h);
        const px = g.getImageData(0, 0, w, h).data;
        const lit = new Uint8Array(w * h);
        let [r, gg, b, n] = [0, 0, 0, 0];
        for (let i = 0; i < w * h; i++)
          if (px[i * 4 + 3] >= 128) {
            lit[i] = 1;
            r += px[i * 4];
            gg += px[i * 4 + 1];
            b += px[i * 4 + 2];
            n++;
          }
        const big = Object.assign(document.createElement("canvas"), { width: w * 8, height: h * 8 });
        const bg = big.getContext("2d")!;
        bg.imageSmoothingEnabled = false;
        bg.drawImage(img, 0, 0, w * 8, h * 8);
        return { w, h, lit, color: n ? { r: r / n / 255, g: gg / n / 255, b: b / n / 255, a: 1 } : { r: 0, g: 0, b: 0, a: 1 }, src: big.toDataURL("image/png"), big };
      })().catch(() => null),
    );
  ready.set(`${size.trim()}|${url}`, await tiles.get(key)!);
}

const dataSvg = (layer: string) => layer.match(/^url\("?(data:image\/svg\+xml[^")]*)"?\)$/)?.[1] ?? null;

/** Reads every SVG tile used as a texture under `root`, so the tree can be built without waiting. */
export async function readTiles(root: HTMLElement) {
  const win = root.ownerDocument.defaultView ?? window;
  const jobs: Array<Promise<unknown>> = [];
  for (const el of [root, ...root.querySelectorAll("*")]) {
    const cs = win.getComputedStyle(el);
    const mask = cs.maskImage || (cs as CSSStyleDeclaration & { webkitMaskImage?: string }).webkitMaskImage || "";
    for (const [image, size] of [
      [cs.backgroundImage, cs.backgroundSize],
      [mask, cs.maskSize || (cs as CSSStyleDeclaration & { webkitMaskSize?: string }).webkitMaskSize || "auto"],
    ]) {
      if (!image?.includes("data:image/svg")) continue;
      const sizes = splitTop(size, ",");
      splitTop(image, ",").forEach((layer, i) => {
        const url = dataSvg(layer);
        if (url) jobs.push(loadTile(url, sizes[i] ?? sizes[0] ?? "auto").catch(() => undefined));
      });
    }
  }
  await Promise.all(jobs);
}

/** Lit cells as rectangles (x, y, w, h), runs merged across and down. Null past `budget` rectangles. */
export function mergeCells(W: number, H: number, lit: (x: number, y: number) => boolean, budget: number): number[] | null {
  const out: number[] = [];
  let open = new Map<number, number>();
  for (let y = 0; y < H; y++) {
    const next = new Map<number, number>();
    let x = 0;
    while (x < W) {
      if (!lit(x, y)) {
        x++;
        continue;
      }
      let x1 = x + 1;
      while (x1 < W && lit(x1, y)) x1++;
      const key = x * 65536 + x1;
      const at = open.get(key);
      if (at !== undefined) {
        out[at + 3] += 1;
        next.set(key, at);
      } else {
        if (out.length / 4 >= budget) return null;
        next.set(key, out.length);
        out.push(x, y, x1 - x, 1);
      }
      x = x1;
    }
    open = next;
  }
  return out;
}

/** A texture's dots across a box: as rectangles, or as the tile itself when it would take too many. */
export interface FPattern {
  color: RGBA;
  rects: number[] | null;
  tile?: { src: string; w: number; h: number; x: number; y: number };
  /** How much of the box the dots cover, 0 to 1. */
  cover: number;
}

const tinted = new Map<string, string>();

/** A mask's tile in the color it reveals, at 8x, for when its dots are too many to draw one by one. */
function tintTile(tile: Tile, c: RGBA) {
  const key = `${tile.src}|${c.r},${c.g},${c.b},${c.a}`;
  let out = tinted.get(key);
  if (!out) {
    const cv = Object.assign(document.createElement("canvas"), { width: tile.w * 8, height: tile.h * 8 });
    const g = cv.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(tile.big, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${c.a})`;
    g.fillRect(0, 0, cv.width, cv.height);
    out = cv.toDataURL("image/png");
    tinted.set(key, out);
  }
  return out;
}

/* ---------- clip-path shapes ---------- */

/** One clip-path coordinate: a length, a percentage of `of`, or calc() of the two. */
function coord(t: string, of: number) {
  let v = 0;
  const body = t.startsWith("calc(") ? t.slice(5, -1) : t;
  for (const m of body.replace(/\s+/g, "").matchAll(/([+-]?)([\d.]+)(%|px)?/g)) v += (m[1] === "-" ? -1 : 1) * (m[3] === "%" ? (parseFloat(m[2]) / 100) * of : parseFloat(m[2]));
  return v;
}

/** A clip-path polygon as points in the box's own pixels, or null for any other clip. */
export function polygonOf(clip: string, w: number, h: number): Array<[number, number]> | null {
  const m = clip?.match(/^polygon\((.*)\)$/);
  if (!m) return null;
  const pts = splitTop(m[1].replace(/^(nonzero|evenodd)\s*,/, ""), ",").map((p) => {
    const [x, y] = splitTop(p, " ");
    return [coord(x, w), coord(y ?? "0", h)] as [number, number];
  });
  return pts.length >= 3 ? pts : null;
}

/** Shapes the whole copy may spend on textures, shared by every texture in it. */
export const shapeBudget = { left: 60000 };

/**
 * A tiled SVG texture across a box `w` by `h` (in the element's own pixels; `k` scales them to the
 * copy). `which` picks the background or the mask; a mask's dots take `ink`, the color it reveals.
 */
export function patternOf(cs: CSSStyleDeclaration, which: "background" | "mask", w: number, h: number, k: number, ink?: RGBA | null): FPattern | null {
  const s = cs as CSSStyleDeclaration & Record<string, string>;
  const image = which === "background" ? cs.backgroundImage : cs.maskImage || s.webkitMaskImage;
  if (!image?.includes("data:image/svg")) return null;
  const size = which === "background" ? cs.backgroundSize : cs.maskSize || s.webkitMaskSize || "auto";
  const repeat = which === "background" ? cs.backgroundRepeat : cs.maskRepeat || s.webkitMaskRepeat || "repeat";
  const position = which === "background" ? cs.backgroundPosition : cs.maskPosition || s.webkitMaskPosition || "0% 0%";
  const url = dataSvg(splitTop(image, ",")[0]);
  if (!url) return null;
  const tile = ready.get(`${(splitTop(size, ",")[0] ?? "auto").trim()}|${url}`);
  if (!tile) return null;
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const rep = repeat.split(/\s+/);
  const rx = rep[0] === "repeat" || rep[0] === "repeat-x" || rep[0] === "round" || rep[0] === "space";
  const ry = rep[0] === "repeat-y" ? true : rep[0] === "repeat-x" ? false : (rep[1] ?? rep[0]) !== "no-repeat";
  const [px0, py0] = splitTop(position, ",")[0].split(/\s+/);
  const off = (t: string | undefined, room: number) => (!t ? 0 : t.endsWith("%") ? (parseFloat(t) / 100) * room : parseFloat(t) || 0);
  const ox = Math.round(off(px0, W - tile.w));
  const oy = Math.round(off(py0 ?? "50%", H - tile.h));
  const lit = (x: number, y: number) => {
    let tx = x - ox;
    let ty = y - oy;
    if (rx) tx = ((tx % tile.w) + tile.w) % tile.w;
    else if (tx < 0 || tx >= tile.w) return false;
    if (ry) ty = ((ty % tile.h) + tile.h) % tile.h;
    else if (ty < 0 || ty >= tile.h) return false;
    return tile.lit[ty * tile.w + tx] === 1;
  };
  let on = 0;
  for (let i = 0; i < tile.lit.length; i++) on += tile.lit[i];
  const cover = on / tile.lit.length;
  const color = which === "mask" ? (ink ?? null) : tile.color;
  if (!color) return null;
  const budget = Math.min(10000, shapeBudget.left);
  const rects = cover > 0 && cover < 1 ? mergeCells(W, H, lit, budget) : null;
  if (rects) {
    shapeBudget.left -= rects.length / 4;
    if (k !== 1) for (let i = 0; i < rects.length; i++) rects[i] *= k;
  }
  const src = which === "mask" ? tintTile(tile, color) : tile.src;
  return { color, rects, cover, tile: { src, w: tile.w * k, h: tile.h * k, x: ox * k, y: oy * k } };
}

/* ---------- canvases drawn in a few flat inks ---------- */

/**
 * A dither drawn on a canvas, as vector dots per ink. A canvas filled edge to edge gives its
 * commonest ink as `base`, the color behind the dots. Null for anything that isn't a few flat
 * inks (a photo, a 3D scene) or would take too many shapes.
 */
export function canvasDots(c: HTMLCanvasElement, w: number, h: number): { base: RGBA | null; inks: Array<{ color: RGBA; rects: number[] }> } | null {
  const W = c.width;
  const H = c.height;
  if (!W || !H || W * H > 600000) return null;
  let px: Uint8ClampedArray;
  try {
    const t = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const g = t.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(c, 0, 0);
    px = g.getImageData(0, 0, W, H).data;
  } catch {
    return null;
  }
  // Inks by color and coverage: a dither's second ink is often its first at part opacity.
  const buckets = new Map<number, { n: number; r: number; g: number; b: number; a: number }>();
  let opaque = 0;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 16) continue;
    opaque++;
    const key = ((px[i] >> 3) << 13) | ((px[i + 1] >> 3) << 8) | ((px[i + 2] >> 3) << 3) | (a >> 5);
    const k = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0, a: 0 };
    k.n++;
    k.r += px[i];
    k.g += px[i + 1];
    k.b += px[i + 2];
    k.a += a;
    buckets.set(key, k);
  }
  if (!opaque) return null;
  const inks = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 4);
  if (inks.reduce((s, k) => s + k.n, 0) < opaque * 0.985) return null;
  // Canvas pixels read back premultiplied; undo it for the ink's own color.
  const colors = inks.map((k) => {
    const a = k.a / k.n / 255;
    return { r: Math.min(1, k.r / k.n / 255 / a), g: Math.min(1, k.g / k.n / 255 / a), b: Math.min(1, k.b / k.n / 255 / a), a: a > 0.97 ? 1 : a };
  });
  const owner = new Int8Array(W * H).fill(-1);
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    const a = px[i + 3] / 255;
    if (a < 16 / 255) continue;
    let best = 0;
    let d = Infinity;
    colors.forEach((cl, j) => {
      const e = (px[i] / 255 / a - cl.r) ** 2 + (px[i + 1] / 255 / a - cl.g) ** 2 + (px[i + 2] / 255 / a - cl.b) ** 2 + (a - cl.a) ** 2;
      if (e < d) [d, best] = [e, j];
    });
    owner[p] = best;
  }
  const full = opaque >= W * H * 0.995 && colors[0].a === 1;
  const sx = w / W;
  const sy = h / H;
  const out: Array<{ color: RGBA; rects: number[] }> = [];
  for (let j = full ? 1 : 0; j < colors.length; j++) {
    const rects = mergeCells(W, H, (x, y) => owner[y * W + x] === j, Math.min(16000, shapeBudget.left));
    if (!rects) return null;
    shapeBudget.left -= rects.length / 4;
    for (let i = 0; i < rects.length; i += 4) {
      rects[i] *= sx;
      rects[i + 1] *= sy;
      rects[i + 2] *= sx;
      rects[i + 3] *= sy;
    }
    out.push({ color: colors[j], rects });
  }
  return { base: full ? colors[0] : null, inks: out };
}
