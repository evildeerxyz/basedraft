/*
 * Reads a rendered section (or page) and describes it as Figma would build it:
 * auto layout frames with real gaps, padding and alignment, one text layer per
 * text block (with colored ranges for two-tone headlines), images, icons, and a
 * component marker on every section. figma-clipboard.ts turns it into Figma's own paste format.
 *
 * Everything is inferred from what the browser actually laid out, so it holds for
 * flex, grid and plain block flow alike.
 */

import { canvasDots, effectsOf, gradientsOf, patternOf, polygonOf, shapeBudget, type FEffect, type FGradient, type FPattern } from "./figma-paint";

type Sizing = "FIXED" | "HUG" | "FILL";
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Base extends Box {
  name: string;
  sizeH: Sizing;
  sizeV: Sizing;
  abs?: boolean;
  opacity?: number;
  /** Degrees clockwise. A rotated layer's x and y are where its own top left corner landed. */
  rotation?: number;
  effects?: FEffect[];
}
export interface FLayout {
  mode: "H" | "V";
  gap: number;
  counterGap?: number;
  wrap?: boolean;
  pad: [number, number, number, number];
  main: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  cross: "MIN" | "CENTER" | "MAX" | "BASELINE";
}
export interface FFrame extends Base {
  t: "frame";
  layout: FLayout | null;
  fill: RGBA | null;
  /** Gradient layers over the fill, topmost first, as CSS lists them. */
  gradients?: FGradient[];
  /** Dither textures over the fill and under the content. */
  patterns?: FPattern[];
  stroke: { c: RGBA; w: [number, number, number, number]; outside?: boolean } | null;
  radius: [number, number, number, number];
  clip: boolean;
  /** A clip-path polygon, in the frame's own pixels: the frame is drawn and clipped to it. */
  shape?: Array<[number, number]>;
  children: FNode[];
  component?: { key: string; type: string };
}
export interface FText extends Base {
  t: "text";
  chars: string;
  family: string;
  weight: number;
  italic: boolean;
  size: number;
  lh: number;
  ls: number;
  color: RGBA;
  align: "LEFT" | "CENTER" | "RIGHT";
  ranges: Array<{ s: number; e: number; color?: RGBA; weight?: number }>;
  wrap: boolean;
  /** Where the browser drew each character: x, y, w, h per character, relative to this layer (w is -1 for none). */
  boxes?: number[];
  /** Text filled with a gradient (background-clip: text). */
  gradient?: FGradient;
  /** One line set in a box wider than it (a grid cell, a block): the box is the width, the text aligns in it. */
  boxed?: boolean;
  /** Set once `boxes` are relative to the layer, so they aren't moved twice. */
  placed?: boolean;
}
export interface FImage extends Base {
  t: "image";
  src: string;
  fit: "FILL" | "FIT";
  radius: [number, number, number, number];
  /** A dither drawn in flat inks: one alpha mask per ink, so each ink stays recolorable in Figma. */
  tints?: Array<{ color: RGBA; mask: string }>;
  /** The same dither as vector dots, when it's small enough: the color behind them and each ink's squares. */
  dots?: { base: RGBA | null; inks: Array<{ color: RGBA; rects: number[] }> };
}
export interface FSvg extends Base {
  t: "svg";
  svg: string;
}
export type FNode = FFrame | FText | FImage | FSvg;

export interface TreeHelpers {
  win: Window;
  rect: (el: Element) => Box;
  rangeRect: (r: Range) => Box | null;
  color: (c: string) => { rgb: string; a: number } | null;
  hidden: (el: Element, cs: CSSStyleDeclaration) => boolean;
  canvas: (c: HTMLCanvasElement, w: number, h: number) => string | null;
  tints?: (c: HTMLCanvasElement, w: number, h: number) => FImage["tints"] | null;
  img: (img: HTMLImageElement) => string;
  svg: (svg: SVGSVGElement, color: string, w: number, h: number) => string;
}

const px = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const NAMES: Record<string, string> = { h1: "Headline", h2: "Heading", h3: "Title", p: "Text", nav: "Navigation", header: "Header", footer: "Footer", section: "Section", ul: "List", ol: "List", li: "Item", button: "Button", a: "Link", blockquote: "Quote", figure: "Figure", dl: "List", dt: "Term", dd: "Detail", table: "Table", tr: "Row", th: "Cell", td: "Cell", form: "Form", label: "Label" };

/** How big a layer's own content makes it on one axis, ignoring any stretch from its parent. */
function intrinsic(n: FNode, axis: "w" | "h"): number {
  if (n.t !== "frame" || !n.layout) return n[axis];
  const L = n.layout;
  const kids = n.children.filter((c) => !c.abs);
  const along = (L.mode === "H") === (axis === "w");
  const pad = axis === "w" ? L.pad[1] + L.pad[3] : L.pad[0] + L.pad[2];
  if (!kids.length) return pad;
  const sizes = kids.map((c) => intrinsic(c, axis));
  return pad + (along ? sizes.reduce((a, v) => a + v, 0) + L.gap * (kids.length - 1) : Math.max(...sizes));
}

/**
 * A frame that hugs an axis is sized by its children, so they can't all fill it on that axis
 * (Figma won't, and the frame would collapse). Along a hugging stack nothing fills. Across one,
 * the child with the most content sets the size and the rest stretch to it, as CSS does.
 */
function settleFills(n: FNode) {
  if (n.t !== "frame") return;
  if (n.layout) {
    const kids = n.children.filter((c) => !c.abs);
    const fixed = (c: FNode) => (c.t === "text" || (c.t === "frame" && c.layout) ? "HUG" : "FIXED");
    for (const axis of ["sizeH", "sizeV"] as const) {
      if (n[axis] !== "HUG") continue;
      const main = (axis === "sizeH") === (n.layout.mode === "H");
      if (main) kids.forEach((c) => c[axis] === "FILL" && (c[axis] = fixed(c)));
      else if (kids.length && kids.every((c) => c[axis] === "FILL")) {
        const dim = axis === "sizeH" ? "w" : "h";
        const big = kids.reduce((a, c) => (intrinsic(c, dim) > intrinsic(a, dim) ? c : a));
        big[axis] = intrinsic(big, dim) >= big[dim] - 1.5 ? fixed(big) : "FIXED";
      }
    }
  }
  n.children.forEach(settleFills);
}

export function figmaTree(root: HTMLElement, name: string, h: TreeHelpers): FFrame {
  const { win } = h;
  shapeBudget.left = 60000;
  const style = (el: Element) => win.getComputedStyle(el);
  const rgba = (c: string): RGBA | null => {
    const p = h.color(c);
    if (!p) return null;
    const [r, g, b] = p.rgb.match(/\d+/g)!.map(Number);
    return { r: r / 255, g: g / 255, b: b / 255, a: p.a };
  };
  /** Draws a box of its own: a fill, a gradient or texture (not one clipped to its text), a border or a shadow. */
  const boxy = (cs: CSSStyleDeclaration) =>
    Boolean(h.color(cs.backgroundColor)) ||
    (cs.backgroundImage !== "none" && cs.backgroundClip !== "text" && (cs as CSSStyleDeclaration & { webkitBackgroundClip?: string }).webkitBackgroundClip !== "text") ||
    px(cs.borderTopWidth) + px(cs.borderRightWidth) + px(cs.borderBottomWidth) + px(cs.borderLeftWidth) > 0 ||
    (cs.boxShadow !== "none" && !/^(rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, )?)+$/.test(cs.boxShadow));
  const radius = (cs: CSSStyleDeclaration): [number, number, number, number] => [px(cs.borderTopLeftRadius), px(cs.borderTopRightRadius), px(cs.borderBottomRightRadius), px(cs.borderBottomLeftRadius)];
  const pad = (cs: CSSStyleDeclaration): [number, number, number, number] => [px(cs.paddingTop) + px(cs.borderTopWidth), px(cs.paddingRight) + px(cs.borderRightWidth), px(cs.paddingBottom) + px(cs.borderBottomWidth), px(cs.paddingLeft) + px(cs.borderLeftWidth)];

  function frameBase(el: Element, cs: CSSStyleDeclaration, b: Box, label?: string): FFrame {
    const bw: [number, number, number, number] = [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)];
    const sc = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor].map(rgba).find(Boolean) ?? null;
    const tag = el.tagName.toLowerCase();
    const op = Number(cs.opacity);
    let fill = rgba(cs.backgroundColor);
    // Text filled with a gradient carries it on the text itself, not behind it.
    const clipText = cs.backgroundClip === "text" || (cs as CSSStyleDeclaration & { webkitBackgroundClip?: string }).webkitBackgroundClip === "text";
    let gradients = clipText ? [] : gradientsOf(cs.backgroundImage, cs.backgroundSize, b.w, b.h, rgba);
    const patterns: FPattern[] = [];
    const texture = patternOf(cs, "background", b.w, b.h, 1);
    if (texture) patterns.push(texture);
    // A texture used as a mask shows the element's own color only where its dots are.
    const mask = patternOf(cs, "mask", b.w, b.h, 1, fill ?? gradients[0]?.stops[0]?.color);
    if (mask && mask.cover < 0.999) {
      patterns.splice(0, patterns.length, mask);
      fill = null;
      gradients = [];
    }
    let effects = effectsOf(cs, rgba);
    let stroke: FFrame["stroke"] = sc && bw.some((w) => w > 0) ? { c: sc, w: bw } : null;
    // A ring drawn with a hard shadow (Tailwind's ring, outline-like shadows) is a stroke in Figma.
    const ring = stroke ? -1 : effects.findIndex((e) => (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") && !e.x && !e.y && !e.radius && (e.spread ?? 0) > 0);
    if (ring >= 0) {
      const e = effects[ring];
      stroke = { c: e.color!, w: [e.spread!, e.spread!, e.spread!, e.spread!], outside: e.type === "DROP_SHADOW" };
      effects = effects.filter((_, i) => i !== ring);
    }
    const shape = polygonOf(cs.clipPath, b.w, b.h);
    // A rounded inset clip is just rounded corners that clip.
    const inset = cs.clipPath?.match(/^inset\(0px round ([\d.]+)px\)$/);
    const corners = inset ? ([1, 1, 1, 1].map(() => parseFloat(inset[1])) as FFrame["radius"]) : radius(cs);
    return {
      t: "frame",
      name: label ?? el.getAttribute("data-export-name") ?? NAMES[tag] ?? "Frame",
      ...b,
      sizeH: "FIXED",
      sizeV: "FIXED",
      layout: null,
      ...(shape ? { shape } : {}),
      fill,
      ...(gradients.length ? { gradients } : {}),
      ...(patterns.length ? { patterns } : {}),
      ...(effects.length ? { effects } : {}),
      stroke,
      radius: corners,
      clip: cs.overflowX !== "visible" || cs.overflowY !== "visible" || Boolean(inset) || (patterns.length > 0 && corners.some((r) => r > 0)),
      children: [],
      ...(op < 1 ? { opacity: op } : {}),
    };
  }

  /* ---------- transforms: measured flat, then turned and sized as drawn ---------- */

  /** Rotation and scale the layout doesn't see. Moves alone need nothing: boxes already include them. */
  function transformOf(cs: CSSStyleDeclaration) {
    let rot = 0;
    let sx = 1;
    let sy = 1;
    let flat = false;
    const t = cs.transform;
    if (t && t !== "none") {
      const m = t.match(/^matrix\(([^)]+)\)$/);
      if (m) {
        const [a, b, c, d] = m[1].split(",").map(Number);
        const det = a * d - b * c;
        const s0 = Math.hypot(a, b) * (det < 0 ? -1 : 1);
        rot += (Math.atan2(b / (s0 || 1), a / (s0 || 1)) * 180) / Math.PI;
        sx *= s0;
        sy *= s0 ? det / s0 : 0;
      } else flat = true;
    }
    const ext = cs as CSSStyleDeclaration & { rotate?: string; scale?: string };
    if (ext.rotate && ext.rotate !== "none") {
      const parts = ext.rotate.trim().split(/\s+/);
      const ang = parts[parts.length - 1];
      const about = parts.length === 1 || parts[0] === "z" || (parts.length === 4 && parts[0] === "0" && parts[1] === "0");
      const n = parseFloat(ang);
      const deg = ang.endsWith("turn") ? n * 360 : ang.endsWith("grad") ? n * 0.9 : ang.endsWith("rad") ? (n * 180) / Math.PI : n;
      if (about) rot += deg * (parts.length === 4 && parts[2].startsWith("-") ? -1 : 1);
      else flat = true;
    }
    if (ext.scale && ext.scale !== "none") {
      const [a, b = a] = ext.scale.trim().split(/\s+/).map(Number);
      sx *= a;
      sy *= b;
    }
    if (Math.abs(rot) < 0.05 && Math.abs(sx - 1) < 0.002 && Math.abs(sy - 1) < 0.002 && !flat) return null;
    return { rot, sx, sy };
  }

  /** Makes a subtree's character boxes relative to their own text layers, once. */
  function placeBoxes(n: FNode, ox: number, oy: number) {
    const ax = ox + n.x;
    const ay = oy + n.y;
    if (n.t === "text" && n.boxes && !n.placed) {
      n.boxes = n.boxes.slice();
      for (let i = 0; i < n.boxes.length; i += 4)
        if (n.boxes[i + 2] >= 0) {
          n.boxes[i] = r2(n.boxes[i] - ax);
          n.boxes[i + 1] = r2(n.boxes[i + 1] - ay);
        }
      n.placed = true;
    }
    if (n.t === "frame") n.children.forEach((c) => placeBoxes(c, ax, ay));
  }

  const scaleRects = (r: number[], sx: number, sy: number) => r.map((v, i) => v * (i % 2 ? sy : sx));

  /** Sizes a subtree by sx and sy about its own top left: boxes, type, spacing, corners and effects. */
  function scaleTree(n: FNode, sx: number, sy: number, top = true) {
    if (!top) {
      n.x *= sx;
      n.y *= sy;
    }
    n.w *= sx;
    n.h *= sy;
    const k = Math.min(sx, sy);
    n.effects?.forEach((e) => Object.assign(e, { radius: e.radius * k, ...(e.x !== undefined ? { x: e.x * sx, y: (e.y ?? 0) * sy, spread: (e.spread ?? 0) * k } : {}) }));
    if (n.t === "text") {
      n.size *= sy;
      n.lh *= sy;
      n.ls *= sx;
      if (n.boxes) n.boxes = n.boxes.map((v, i) => (i % 4 === 2 && v < 0 ? v : v * (i % 2 ? sy : sx)));
    } else if (n.t === "frame") {
      n.radius = n.radius.map((v) => v * k) as FFrame["radius"];
      if (n.stroke) n.stroke = { ...n.stroke, w: n.stroke.w.map((v, i) => v * (i % 2 ? sx : sy)) as [number, number, number, number] };
      if (n.layout) {
        const L = n.layout;
        L.gap *= L.mode === "H" ? sx : sy;
        if (L.counterGap !== undefined) L.counterGap *= L.mode === "H" ? sy : sx;
        L.pad = [L.pad[0] * sy, L.pad[1] * sx, L.pad[2] * sy, L.pad[3] * sx];
      }
      if (n.shape) n.shape = n.shape.map(([x, y]) => [x * sx, y * sy]);
      n.patterns?.forEach((p) => {
        if (p.rects) p.rects = scaleRects(p.rects, sx, sy);
        if (p.tile) p.tile = { ...p.tile, w: p.tile.w * sx, h: p.tile.h * sy, x: p.tile.x * sx, y: p.tile.y * sy };
      });
      n.children.forEach((c) => scaleTree(c, sx, sy, false));
    } else if (n.t === "image") {
      n.radius = n.radius.map((v) => v * k) as FImage["radius"];
      n.dots?.inks.forEach((ink) => (ink.rects = scaleRects(ink.rects, sx, sy)));
    } else if (n.t === "svg") n.svg = n.svg.replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*"/, `<svg$1 width="${n.w}" height="${n.h}"`);
  }

  /** Mirrors a subtree left to right inside its own box (a flipped edge, a mirrored glyph). */
  function mirror(n: FNode) {
    if (n.t === "frame") {
      if (n.shape) n.shape = n.shape.map(([x, y]) => [n.w - x, y]);
      n.patterns?.forEach((p) => {
        if (p.rects) for (let i = 0; i < p.rects.length; i += 4) p.rects[i] = n.w - p.rects[i] - p.rects[i + 2];
      });
      for (const c of n.children) {
        c.x = n.w - c.x - c.w;
        mirror(c);
      }
      if (n.layout?.mode === "H") {
        n.children.reverse();
        n.layout.main = n.layout.main === "MIN" ? "MAX" : n.layout.main === "MAX" ? "MIN" : n.layout.main;
      }
    } else if (n.t === "image") n.dots?.inks.forEach((ink) => {
      for (let i = 0; i < ink.rects.length; i += 4) ink.rects[i] = n.w - ink.rects[i] - ink.rects[i + 2];
    });
  }

  /**
   * An element with a rotation or scale: measured with it switched off, so everything inside reads
   * at its true size, then sized and turned as the page draws it. In a flow it sits in a frame the
   * size of its layout box, which is the room CSS gives it.
   */
  function build(el: Element, marker?: { key: string; type: string; name: string }): FNode | null {
    const cs = style(el);
    if (h.hidden(el, cs)) return null;
    const tf = transformOf(cs);
    if (!tf) return plain(el, cs, marker);
    if (!tf.sx || !tf.sy) return null;
    const st = (el as HTMLElement).style;
    const saved = ["transform", "rotate", "scale"].map((p) => [p, st.getPropertyValue(p), st.getPropertyPriority(p)] as const);
    saved.forEach(([p]) => st.setProperty(p, "none", "important"));
    let node: FNode | null;
    let box: Box;
    try {
      box = h.rect(el);
      node = plain(el, style(el), marker);
    } finally {
      saved.forEach(([p, v, pr]) => (v ? st.setProperty(p, v, pr) : st.removeProperty(p)));
    }
    if (!node) return null;
    placeBoxes(node, 0, 0);
    const origin = cs.transformOrigin.split(" ").map(px);
    let ox = origin[0];
    const oy = origin[1];
    if (tf.sx < 0) {
      mirror(node);
      ox = box.w - ox;
    }
    const [sx, sy] = [Math.abs(tf.sx), Math.abs(tf.sy)];
    scaleTree(node, sx, sy);
    const rad = (tf.rot * Math.PI) / 180;
    const [cos, sin] = [Math.cos(rad), Math.sin(rad)];
    // Where its own top left lands: the origin stays put while everything turns and grows around it.
    node.x = box.x + ox - (cos * ox * sx - sin * oy * sy);
    node.y = box.y + oy - (sin * ox * sx + cos * oy * sy);
    if (Math.abs(tf.rot) >= 0.05) node.rotation = r2(tf.rot);
    if (cs.position === "absolute" || cs.position === "fixed") return node;
    node.x -= box.x;
    node.y -= box.y;
    return { t: "frame", name: node.name, ...box, sizeH: "FIXED", sizeV: "FIXED", layout: null, fill: null, stroke: null, radius: [0, 0, 0, 0], clip: false, children: [node] };
  }

  /* ---------- text ---------- */

  function inlineOnly(el: Element): boolean {
    for (const n of el.childNodes) {
      if (n.nodeType !== Node.ELEMENT_NODE) continue;
      const c = n as Element;
      const tag = c.tagName.toLowerCase();
      if (tag === "br") continue;
      const cs = style(c);
      if (h.hidden(c, cs)) continue;
      if (cs.display !== "inline" || ["img", "svg", "canvas", "input", "textarea", "select", "video"].includes(tag) || boxy(cs) || !inlineOnly(c)) return false;
    }
    return true;
  }

  function textOf(el: Element, cs: CSSStyleDeclaration, nodes?: Node[]): FText | null {
    let chars = "";
    // The DOM character behind every character of `chars`, so each can be measured where it was drawn.
    const src: Array<[Text, number] | null> = [];
    const ranges: FText["ranges"] = [];
    const baseColor = cs.color;
    const baseWeight = cs.fontWeight;
    const walk = (list: Iterable<Node>, s: CSSStyleDeclaration) => {
      for (const n of list) {
        if (n.nodeType === Node.TEXT_NODE) {
          // Collapse white space as CSS does, one character at a time.
          const data = (n as Text).data;
          const tt = s.textTransform;
          const upper = tt === "uppercase";
          let lead = !chars || chars.endsWith(" ") || chars.endsWith("\n");
          let t = "";
          for (let i = 0; i < data.length; i++) {
            const ch = data[i];
            if (/\s/.test(ch)) {
              if (lead) continue;
              t += " ";
              lead = true;
            } else {
              // capitalize: the first letter of every word, as CSS draws it.
              const up = upper || (tt === "capitalize" && lead) ? ch.toUpperCase() : tt === "lowercase" ? ch.toLowerCase() : ch;
              t += up.length === 1 ? up : ch;
              lead = false;
            }
            src.push([n as Text, i]);
          }
          if (!t) continue;
          const start = chars.length;
          chars += t;
          const diffColor = s.color !== baseColor;
          const diffWeight = s.fontWeight !== baseWeight;
          if (diffColor || diffWeight) ranges.push({ s: start, e: chars.length, ...(diffColor ? { color: rgba(s.color) ?? undefined } : {}), ...(diffWeight ? { weight: Number(s.fontWeight) } : {}) });
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          const c = n as Element;
          if (c.tagName.toLowerCase() === "br") {
            if (chars.endsWith(" ")) {
              chars = chars.slice(0, -1);
              src.pop();
            }
            chars += "\n";
            src.push(null);
            continue;
          }
          const ccs = style(c);
          if (h.hidden(c, ccs)) continue;
          walk(c.childNodes, ccs);
        }
      }
    };
    walk(nodes ?? el.childNodes, cs);
    const trimmed = chars.replace(/\s+$/, "");
    if (!trimmed) return null;
    src.length = trimmed.length;
    const boxes: number[] = [];
    const one = el.ownerDocument.createRange();
    for (const at of src) {
      let q: Box | null = null;
      if (at) {
        one.setStart(at[0], at[1]);
        one.setEnd(at[0], at[1] + 1);
        q = h.rangeRect(one);
      }
      if (q) boxes.push(r2(q.x), r2(q.y), r2(q.w), r2(q.h));
      else boxes.push(0, 0, -1, 0);
    }

    const range = el.ownerDocument.createRange();
    if (nodes?.length === 1) range.selectNodeContents(nodes[0]);
    else range.selectNodeContents(el);
    const b = h.rangeRect(range);
    if (!b) return null;
    const lines = new Set([...range.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top / Math.max(1, px(cs.lineHeight) * 0.5)))).size;
    const color = rgba(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
    const align = cs.textAlign === "center" ? "CENTER" : cs.textAlign === "right" || cs.textAlign === "end" ? "RIGHT" : "LEFT";
    const lh = cs.lineHeight === "normal" ? px(cs.fontSize) * 1.2 : px(cs.lineHeight);
    return {
      t: "text",
      name: trimmed.slice(0, 40),
      ...b,
      sizeH: "HUG",
      sizeV: "HUG",
      chars: trimmed,
      family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
      weight: Number(cs.fontWeight) || 400,
      italic: cs.fontStyle === "italic",
      size: px(cs.fontSize),
      lh: r2(lh),
      ls: cs.letterSpacing === "normal" ? 0 : r2(px(cs.letterSpacing)),
      color,
      align,
      ranges: ranges.filter((q) => q.s < trimmed.length).map((q) => ({ ...q, e: Math.min(q.e, trimmed.length) })),
      wrap: lines > 1 || trimmed.includes("\n"),
      boxes,
    };
  }

  /**
   * Balanced and pretty wrapping pick their own line breaks; Figma wraps greedily. Narrowing the
   * text box to its widest line makes Figma break exactly where the page does.
   */
  function narrow(t: FText, cs: CSSStyleDeclaration) {
    const ext = cs as CSSStyleDeclaration & { textWrap?: string; textWrapStyle?: string };
    if (!/balance|pretty/.test(`${ext.textWrapStyle ?? ""} ${ext.textWrap ?? ""}`) || !t.boxes) return false;
    let widest = 0;
    let line: { top: number; h: number; l: number; r: number } | null = null;
    const close = () => line && (widest = Math.max(widest, line.r - line.l));
    for (let k = 0; k < t.chars.length; k++) {
      const [x, y, w, hh] = t.boxes.slice(k * 4, k * 4 + 4);
      if (w < 0 || t.chars[k] === " ") continue;
      if (!line || Math.abs(y - line.top) > hh * 0.5) {
        close();
        line = { top: y, h: hh, l: x, r: x + w };
      } else line.r = Math.max(line.r, x + w);
    }
    close();
    // A little room for Figma's own text measuring, never enough to pull up another word.
    const w = Math.min(t.w, Math.ceil(widest + Math.max(2, t.size * 0.25)));
    if (!widest || w >= t.w - 1) return false;
    if (t.align === "CENTER") t.x += (t.w - w) / 2;
    else if (t.align === "RIGHT") t.x += t.w - w;
    t.w = w;
    return true;
  }

  /* ---------- elements ---------- */

  type Item = { node: FNode; box: Box; abs: boolean; cs?: CSSStyleDeclaration; order?: number; z?: number; made?: boolean };

  function items(el: Element, cs: CSSStyleDeclaration, marker?: { key: string; type: string; name: string }): Item[] {
    const out: Item[] = [];
    let i = 0;
    for (const n of el.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) {
        if (!(n as Text).data.trim()) continue;
        const t = textOf(el, cs, [n]);
        if (t) out.push({ node: t, box: t, abs: false, order: out.length });
        continue;
      }
      if (n.nodeType !== Node.ELEMENT_NODE) continue;
      const c = n as Element;
      const ccs = style(c);
      if (h.hidden(c, ccs)) continue;
      // Column definitions draw nothing; their cells carry the layout.
      if (ccs.display === "table-column" || ccs.display === "table-column-group") continue;
      if (ccs.display === "contents") {
        const key = c.getAttribute("data-bd-block");
        const label = c.getAttribute("data-bd-name") ?? key ?? "";
        out.push(...items(c, cs, key ? { key, type: key, name: label } : marker));
        continue;
      }
      const node = build(c, marker && i === 0 ? marker : undefined);
      i++;
      if (!node) continue;
      out.push({ node, box: node, abs: ccs.position === "absolute" || ccs.position === "fixed", cs: ccs, order: out.length, z: parseInt(ccs.zIndex, 10) || 0 });
    }
    return out;
  }

  /**
   * True when a frame isn't the size of its content plus padding: taller or wider (a set size), or
   * smaller (negative margins let the content spill over). Either way it keeps its measured size.
   */
  function fixedOn(n: FNode, axis: "h" | "w") {
    if (n.t !== "frame" || !n.layout) return false;
    const L = n.layout;
    const kids = n.children.filter((c) => !c.abs);
    if (!kids.length) return true;
    const along = (L.mode === "V") === (axis === "h");
    const sizes = kids.map((c) => (axis === "h" ? c.h : c.w));
    const content = along ? sizes.reduce((a, v) => a + v, 0) + L.gap * (kids.length - 1) : Math.max(...sizes);
    const padding = axis === "h" ? L.pad[0] + L.pad[2] : L.pad[1] + L.pad[3];
    return Math.abs((axis === "h" ? n.h : n.w) - (content + padding)) > 1.5 && !(L.wrap && axis === "h");
  }

  function sizeChild(k: Item, layout: FLayout, cw: number, ch: number, stretch: boolean) {
    const n = k.node;
    const fullW = Math.abs(k.box.w - cw) < 1.5;
    const fullH = Math.abs(k.box.h - ch) < 1.5;
    const auto = n.t === "text" || (n.t === "frame" && n.layout !== null);
    const hug = (n.t === "text" && !n.wrap) || (n.t === "frame" && n.layout !== null && Boolean(k.cs?.display.startsWith("inline")));
    const hugH = auto && !fixedOn(n, "h");
    const hugW = auto && !fixedOn(n, "w");
    if (layout.mode === "V") {
      n.sizeH = fullW && n.t !== "svg" ? "FILL" : hug && hugW ? "HUG" : "FIXED";
      n.sizeV = hugH ? "HUG" : "FIXED";
    } else {
      const grow = Number(k.cs?.flexGrow ?? 0) > 0;
      const chip = n.t === "frame" && n.layout !== null && n.children.every((c) => c.t !== "frame");
      n.sizeH = grow ? "FILL" : (hug || chip) && hugW ? "HUG" : "FIXED";
      n.sizeV = stretch && fullH ? "FILL" : hugH ? "HUG" : "FIXED";
    }
  }

  /** Groups items into side-by-side columns, each a clean vertical stack; null if they don't form columns. */
  function columnsOf(list: Item[]) {
    if (list.length < 3) return null;
    const cols: Array<{ x: number; y: number; w: number; h: number; items: Item[] }> = [];
    for (const k of [...list].sort((a, c) => a.box.x - c.box.x || a.box.y - c.box.y)) {
      const col = cols.find((c) => Math.abs(c.x - k.box.x) < 2 && Math.abs(c.w - k.box.w) < 2);
      if (col) col.items.push(k);
      else cols.push({ x: k.box.x, y: 0, w: k.box.w, h: 0, items: [k] });
    }
    if (cols.length < 2 || cols.every((c) => c.items.length < 2)) return null;
    for (let i = 1; i < cols.length; i++) if (cols[i].x < cols[i - 1].x + cols[i - 1].w - 1) return null;
    for (const c of cols) {
      c.items.sort((a, q) => a.box.y - q.box.y);
      if (!c.items.every((k, i) => i === 0 || k.box.y >= c.items[i - 1].box.y + c.items[i - 1].box.h - 1.5)) return null;
      c.y = c.items[0].box.y;
      c.h = c.items[c.items.length - 1].box.y + c.items[c.items.length - 1].box.h - c.y;
    }
    return cols;
  }

  /* ---------- spacing: one gap per stack, as a designer would set it ---------- */

  const startOf = (k: Item, mode: "H" | "V") => (mode === "V" ? k.box.y : k.box.x);
  const spanOf = (k: Item, mode: "H" | "V") => (mode === "V" ? k.box.h : k.box.w);
  const endOf = (k: Item, mode: "H" | "V") => startOf(k, mode) + spanOf(k, mode);
  /** Items that follow each other along the axis without overlapping. */
  const sequential = (seq: Item[], mode: "H" | "V") => seq.every((k, i) => i === 0 || startOf(k, mode) >= endOf(seq[i - 1], mode) - 1.5);
  /** A transparent auto layout frame: padding inside it changes nothing you can see. */
  const roomy = (k: Item) => k.node.t === "frame" && k.node.layout !== null && !k.node.fill && !k.node.stroke;

  /** Adds space inside a transparent frame at one end of the axis, keeping its contents where they are. */
  function padIn(k: Item, mode: "H" | "V", side: "start" | "end", extra: number) {
    const n = k.node as FFrame;
    const i = mode === "V" ? (side === "start" ? 0 : 2) : side === "start" ? 3 : 1;
    n.layout!.pad[i] += extra;
    if (mode === "V") {
      n.h += extra;
      k.box = { ...k.box, h: k.box.h + extra, y: side === "start" ? k.box.y - extra : k.box.y };
    } else {
      n.w += extra;
      k.box = { ...k.box, w: k.box.w + extra, x: side === "start" ? k.box.x - extra : k.box.x };
    }
    if (side === "start") for (const c of n.children) if (mode === "V") c.y += extra;
    else c.x += extra;
  }

  /** A run of items in its own stack, so its tighter spacing becomes that stack's gap. */
  function groupOf(run: Item[], mode: "H" | "V", cross: FLayout["cross"], depth: number): Item {
    const x = Math.min(...run.map((k) => k.box.x));
    const y = Math.min(...run.map((k) => k.box.y));
    const w = Math.max(...run.map((k) => k.box.x + k.box.w)) - x;
    const h = Math.max(...run.map((k) => k.box.y + k.box.h)) - y;
    const inner = arrange(run, mode, cross, depth);
    const along = (n: FNode) => (mode === "V" ? n.sizeV : n.sizeH);
    const across = (n: FNode) => (mode === "V" ? n.sizeH : n.sizeV);
    const main = run.some((k) => along(k.node) === "FILL") ? "FILL" : "HUG";
    const side = run.some((k) => across(k.node) === "FILL") ? "FILL" : "HUG";
    const node: FFrame = {
      t: "frame",
      name: "Frame",
      x,
      y,
      w,
      h,
      sizeH: mode === "V" ? side : main,
      sizeV: mode === "V" ? main : side,
      layout: { mode, gap: inner.gap, pad: [0, 0, 0, 0], main: "MIN", cross },
      fill: null,
      stroke: null,
      radius: [0, 0, 0, 0],
      clip: false,
      children: inner.items.map((k) => {
        k.node.x = r1(k.box.x - x);
        k.node.y = r1(k.box.y - y);
        return k.node;
      }),
    };
    return { node, box: { x, y, w, h }, abs: false, made: true };
  }

  /**
   * Even spacing becomes the stack's gap. Uneven spacing (margins) is read the way a designer
   * would build it: tighter runs, like a title over its subtitle, become their own stack; small
   * leftovers go into the padding of a transparent frame beside them; a spacer is the last resort.
   */
  function arrange(seq: Item[], mode: "H" | "V", cross: FLayout["cross"], depth = 0): { gap: number; items: Item[] } {
    if (seq.length < 2) return { gap: 0, items: seq };
    const gaps = seq.slice(1).map((k, i) => Math.max(0, startOf(k, mode) - endOf(seq[i], mode)));
    const lo = Math.min(...gaps);
    const hi = Math.max(...gaps);
    if (hi - lo > Math.max(8, lo * 0.25) && depth < 3) {
      const sorted = [...gaps].sort((a, b) => a - b);
      let cut = 0;
      let jump = 0;
      for (let i = 1; i < sorted.length; i++)
        if (sorted[i] - sorted[i - 1] > jump) {
          jump = sorted[i] - sorted[i - 1];
          cut = (sorted[i] + sorted[i - 1]) / 2;
        }
      const runs: Item[][] = [[seq[0]]];
      gaps.forEach((g, i) => (g < cut ? runs[runs.length - 1].push(seq[i + 1]) : runs.push([seq[i + 1]])));
      return arrange(
        runs.map((r) => (r.length > 1 ? groupOf(r, mode, cross, depth + 1) : r[0])),
        mode,
        cross,
        depth + 1,
      );
    }
    const gap = Math.round(lo);
    const out: Item[] = [seq[0]];
    gaps.forEach((g, i) => {
      const extra = Math.round(g - gap);
      const next = seq[i + 1];
      const prev = out[out.length - 1];
      if (extra >= 1) {
        if (prev.made || roomy(prev)) padIn(prev, mode, "end", extra);
        else if (next.made || roomy(next)) padIn(next, mode, "start", extra);
        else if (extra >= gap) {
          // A spacer sits between two gaps of its own, so it only makes up the rest.
          const at = endOf(prev, mode) + gap;
          const size = extra - gap;
          const box = mode === "V" ? { x: prev.box.x, y: at, w: 1, h: size } : { x: at, y: prev.box.y, w: size, h: 1 };
          out.push({ node: { t: "frame", name: "Spacer", ...box, sizeH: "FIXED", sizeV: "FIXED", layout: null, fill: null, stroke: null, radius: [0, 0, 0, 0], clip: false, children: [] }, box, abs: false });
        } else {
          // Too small for a spacer: hold the space in a transparent frame around the item before it.
          const wrapped = groupOf([prev], mode, cross, depth + 1);
          padIn(wrapped, mode, "end", extra);
          out[out.length - 1] = wrapped;
        }
      }
      out.push(next);
    });
    return { gap, items: out };
  }

  /**
   * Figma aligns a stack's children together; CSS lets one child sit apart (align-self). That
   * child goes in its own frame spanning the stack's cross axis, aligned on its own inside it.
   */
  function alone(k: Item, mode: "H" | "V", parentCross: FLayout["cross"], at: number, size: number) {
    const v = k.cs?.alignSelf ?? "auto";
    if (["auto", "normal", "stretch", "baseline", "first baseline", "last baseline"].includes(v)) return;
    const own = alignOf(v, mode);
    if (own === parentCross || own === "BASELINE") return;
    const n = k.node;
    const box = mode === "H" ? { x: k.box.x, y: at, w: k.box.w, h: size } : { x: at, y: k.box.y, w: size, h: k.box.h };
    n.x = k.box.x - box.x;
    n.y = k.box.y - box.y;
    const wrap: FFrame = {
      t: "frame",
      name: "Frame",
      ...box,
      sizeH: mode === "H" ? n.sizeH : "FILL",
      sizeV: mode === "H" ? "FILL" : n.sizeV,
      layout: { mode: mode === "H" ? "V" : "H", gap: 0, pad: [0, 0, 0, 0], main: own, cross: "MIN" },
      fill: null,
      stroke: null,
      radius: [0, 0, 0, 0],
      clip: false,
      children: [n],
    };
    if (mode === "H" && n.sizeV === "FILL") n.sizeV = "HUG";
    if (mode === "V" && n.sizeH === "FILL") n.sizeH = "HUG";
    k.node = wrap;
    k.box = wrap;
  }

  /**
   * A block child pushed in by its margins (mx-auto beside a set right margin, an indent) sits
   * apart from its stack's alignment. It goes in a full-width frame, the offset as its padding.
   */
  function offset(k: Item, cross: FLayout["cross"], left: number, width: number) {
    const L = k.box.x - left;
    const R = left + width - (k.box.x + k.box.w);
    if (k.node.sizeH === "FILL" || L < -1 || R < -1) return;
    const fits = cross === "MIN" ? L <= 1.5 : cross === "MAX" ? R <= 1.5 : Math.abs(L - R) <= 3;
    if (fits) return;
    const n = k.node;
    const right = L > R + 1.5;
    const box = { x: left, y: k.box.y, w: width, h: k.box.h };
    n.x = k.box.x - left;
    n.y = 0;
    const wrap: FFrame = {
      t: "frame",
      name: "Frame",
      ...box,
      sizeH: "FILL",
      sizeV: n.sizeV === "FILL" ? "FILL" : "HUG",
      layout: { mode: "H", gap: 0, pad: [0, right ? r1(R) : 0, 0, right ? 0 : r1(L)], main: right ? "MAX" : "MIN", cross: "MIN" },
      fill: null,
      stroke: null,
      radius: [0, 0, 0, 0],
      clip: false,
      children: [n],
    };
    k.node = wrap;
    k.box = wrap;
  }

  function alignOf(v: string, mode: "H" | "V"): FLayout["cross"] {
    if (v === "center") return "CENTER";
    if (v === "flex-end" || v === "end" || v === "self-end") return "MAX";
    if (v === "baseline" && mode === "H") return "BASELINE";
    return "MIN";
  }

  function plain(el: Element, cs: CSSStyleDeclaration, marker?: { key: string; type: string; name: string }): FNode | null {
    const tag = el.tagName.toLowerCase();
    const b = h.rect(el);
    // A zero-size box can still be an anchor for what hangs off it (labels, tooltips, badges).
    if ((b.w <= 0 || b.h <= 0) && cs.display !== "contents" && (cs.overflowX !== "visible" || cs.overflowY !== "visible" || !el.children.length)) return null;
    const isMarked = Boolean(el.getAttribute("data-bd-block") && cs.display !== "contents") || Boolean(marker);
    const key = el.getAttribute("data-bd-block") ?? marker?.key;
    const label = el.getAttribute("data-bd-name") ?? marker?.name;

    if (tag === "img") {
      const img = el as HTMLImageElement;
      return { t: "image", name: img.alt || "Image", ...b, sizeH: "FIXED", sizeV: "FIXED", src: h.img(img), fit: cs.objectFit === "contain" ? "FIT" : "FILL", radius: radius(cs) };
    }
    if (tag === "canvas") {
      // A dither in a few flat inks becomes vector dots; anything else (a photo, a 3D scene) is the picture it is.
      const dots = canvasDots(el as HTMLCanvasElement, b.w, b.h);
      if (dots) return { t: "image", name: "Dither", ...b, sizeH: "FIXED", sizeV: "FIXED", src: "", fit: "FILL", radius: radius(cs), dots };
      const src = h.canvas(el as HTMLCanvasElement, b.w, b.h);
      const tints = h.tints?.(el as HTMLCanvasElement, b.w, b.h) ?? undefined;
      return src ? { t: "image", name: "Dither", ...b, sizeH: "FIXED", sizeV: "FIXED", src, fit: "FILL", radius: radius(cs), ...(tints ? { tints } : {}) } : null;
    }
    if (tag === "svg") {
      const ink = h.color(cs.color);
      const color = ink ? (ink.a < 1 ? ink.rgb.replace("rgb(", "rgba(").replace(")", `,${ink.a})`) : ink.rgb) : "#000";
      return { t: "svg", name: "Icon", ...b, sizeH: "FIXED", sizeV: "FIXED", svg: h.svg(el as SVGSVGElement, color, b.w, b.h) };
    }

    const flexish = cs.display.includes("flex") || cs.display.includes("grid");
    const hasText = Boolean((el.textContent ?? "").trim());

    // A block of text: one text layer, wrapped in a frame only if it has its own box.
    if (hasText && !flexish && inlineOnly(el) && tag !== "input" && tag !== "textarea") {
      const t = textOf(el, cs);
      if (!t) return null;
      if (cs.backgroundClip === "text" || (cs as CSSStyleDeclaration & { webkitBackgroundClip?: string }).webkitBackgroundClip === "text") {
        const g = gradientsOf(cs.backgroundImage, cs.backgroundSize, b.w, b.h, rgba)[0];
        if (g) t.gradient = g;
      }
      const p = pad(cs);
      // Vertical extent from the line boxes, not glyph bounds, so stacked text never "overlaps".
      t.y = b.y + p[0];
      t.h = Math.max(1, b.h - p[0] - p[2]);
      // A block (or a grid cell) is as wide as its box, not its words; its text aligns inside it.
      const blockish = ["block", "list-item", "table-cell", "flow-root"].includes(cs.display) || (el.parentElement && style(el.parentElement).display.includes("grid"));
      const bare = !boxy(cs) && p.every((v) => v === 0) && !isMarked;
      if (t.wrap || (blockish && bare)) {
        const inner = b.w - p[1] - p[3];
        if (!t.wrap && inner > t.w + 1) t.boxed = true;
        t.x = b.x + p[3];
        t.w = inner;
      }
      // Narrowed text keeps a frame the size of its box, so the layout around it doesn't move.
      const narrowed = t.wrap && narrow(t, cs);
      if (bare && !narrowed) {
        const op = Number(cs.opacity);
        if (op < 1) t.opacity = op;
        return t;
      }
      const f = frameBase(el, cs, b);
      f.layout = { mode: "H", gap: 0, pad: p, main: t.align === "CENTER" ? "CENTER" : t.align === "RIGHT" ? "MAX" : "MIN", cross: "CENTER" };
      t.sizeH = t.wrap && t.w >= b.w - p[1] - p[3] - 1 ? "FILL" : t.wrap ? "FIXED" : "HUG";
      f.children = [{ ...t, x: t.x - b.x, y: t.y - b.y }];
      if (isMarked && key) Object.assign(f, { name: label ?? f.name, component: { key: `${key}|${Math.round(b.w)}|${hash(t.chars)}`, type: key } });
      return f;
    }

    if (tag === "input" || tag === "textarea") {
      const f = frameBase(el, cs, b, "Field");
      const field = el as HTMLInputElement;
      const value = field.value || field.placeholder;
      f.layout = { mode: "H", gap: 0, pad: pad(cs), main: "MIN", cross: "CENTER" };
      if (value && !["range", "checkbox", "radio"].includes(field.type)) {
        const c = rgba(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
        f.children.push({ t: "text", name: value.slice(0, 40), x: px(cs.paddingLeft), y: 0, w: b.w - px(cs.paddingLeft) - px(cs.paddingRight), h: b.h, sizeH: "FILL", sizeV: "HUG", chars: value, family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(), weight: Number(cs.fontWeight) || 400, italic: false, size: px(cs.fontSize), lh: px(cs.fontSize) * 1.4, ls: 0, color: field.value ? c : { ...c, a: c.a * 0.5 }, align: "LEFT", ranges: [], wrap: false });
      }
      return f;
    }

    const f = frameBase(el, cs, b, isMarked ? label : undefined);
    const list = items(el, cs);
    const inflow = list.filter((k) => !k.abs);
    const p = pad(cs);
    const cw = b.w - p[1] - p[3];
    const chH = b.h - p[0] - p[2];
    let layout: FLayout | null = null;
    let kids: Item[] = list;

    if (cs.display.includes("flex")) {
      const mode = cs.flexDirection.startsWith("column") ? "V" : "H";
      const gap = px(mode === "H" ? cs.columnGap : cs.rowGap);
      const jc = cs.justifyContent;
      layout = {
        mode,
        gap,
        pad: p,
        main: jc === "center" ? "CENTER" : jc === "flex-end" || jc === "end" ? "MAX" : jc === "space-between" ? "SPACE_BETWEEN" : "MIN",
        cross: alignOf(cs.alignItems, mode),
      };
      if (cs.flexWrap === "wrap") Object.assign(layout, { wrap: true, counterGap: px(mode === "H" ? cs.rowGap : cs.columnGap) });
      const stretch = cs.alignItems === "normal" || cs.alignItems === "stretch";
      inflow.forEach((k) => sizeChild(k, layout!, cw, chH, stretch));
      inflow.forEach((k) => alone(k, mode, layout!.cross, mode === "H" ? b.y + p[0] : b.x + p[3], mode === "H" ? chH : cw));
      // Spacing as laid out, margins included, rather than the CSS gap alone.
      const seq = [...inflow].sort((a, c) => startOf(a, mode) - startOf(c, mode));
      if (!layout.wrap && layout.main !== "SPACE_BETWEEN" && seq.length && sequential(seq, mode)) {
        const r = arrange(seq, mode, layout.cross);
        layout.gap = r.gap;
        const [s0, s1] = mode === "V" ? [0, 2] : [3, 1];
        const begin = mode === "V" ? b.y : b.x;
        const finish = begin + (mode === "V" ? b.h : b.w);
        if (layout.main === "MIN") layout.pad[s0] = Math.max(0, r1(startOf(r.items[0], mode) - begin));
        if (layout.main === "MAX") layout.pad[s1] = Math.max(0, r1(finish - endOf(r.items[r.items.length - 1], mode)));
        if (layout.main === "MIN") {
          const last = r.items[r.items.length - 1];
          const trailing = last.cs ? px(mode === "V" ? last.cs.marginBottom : last.cs.marginRight) : 0;
          if (trailing > 0) layout.pad[s1] += trailing;
        }
        kids = [...r.items, ...list.filter((k) => k.abs)];
      }
    } else if (cs.display.includes("grid")) {
      const tracks = cs.gridTemplateColumns.split(" ").filter((v) => v.endsWith("px")).map(px);
      const colGap = px(cs.columnGap);
      const rowGap = px(cs.rowGap);
      const stretch = cs.alignItems === "normal" || cs.alignItems === "stretch";
      if (tracks.length <= 1) {
        // One-column grids, including "place-items: center" wrappers for icons and initials.
        const centerMain = cs.alignItems === "center" || cs.alignContent === "center";
        const centerCross = cs.justifyItems === "center" || cs.justifyItems === "legacy center";
        layout = { mode: "V", gap: rowGap, pad: p, main: centerMain ? "CENTER" : "MIN", cross: centerCross ? "CENTER" : "MIN" };
        inflow.forEach((k) => sizeChild(k, layout!, cw, chH, false));
      } else {
        // Grids become a column of rows, each an auto layout row with the grid's column gap.
        // Items share a row when their vertical spans overlap (grid items can be centered, so tops differ).
        const rows: Item[][] = [];
        [...inflow].sort((a, c) => a.box.y - c.box.y || a.box.x - c.box.x).forEach((k) => {
          const row = rows.find((r) => {
            const top = Math.min(...r.map((q) => q.box.y));
            const bottom = Math.max(...r.map((q) => q.box.y + q.box.h));
            return Math.min(bottom, k.box.y + k.box.h) - Math.max(top, k.box.y) > Math.min(k.box.h, bottom - top) * 0.5;
          });
          if (row) row.push(k);
          else rows.push([k]);
        });
        const equal = tracks.every((t) => Math.abs(t - tracks[0]) < 1.5);
        const rowFrames: Item[] = rows.map((row, ri) => {
          row.sort((a, c) => a.box.x - c.box.x);
          const x = Math.min(...row.map((k) => k.box.x));
          const y = Math.min(...row.map((k) => k.box.y));
          const rh = Math.max(...row.map((k) => k.box.y + k.box.h)) - y;
          const rw = Math.max(...row.map((k) => k.box.x + k.box.w)) - x;
          const rowLayout: FLayout = { mode: "H", gap: colGap, pad: [0, 0, 0, 0], main: "MIN", cross: alignOf(cs.alignItems, "H") };
          row.forEach((k) => {
            const n = k.node;
            n.sizeH = equal && row.length === tracks.length ? "FILL" : "FIXED";
            const auto = n.t === "text" || (n.t === "frame" && n.layout !== null);
            n.sizeV = stretch && Math.abs(k.box.h - rh) < 1.5 ? (auto || n.t === "frame" ? "FILL" : "FIXED") : auto && !fixedOn(n, "h") ? "HUG" : "FIXED";
          });
          row.forEach((k) => {
            alone(k, "H", rowLayout.cross, y, rh);
            k.node.x = k.box.x - x;
            k.node.y = k.box.y - y;
          });
          const rowNode: FFrame = { t: "frame", name: `Row ${ri + 1}`, x, y, w: rw, h: rh, sizeH: "FILL", sizeV: "HUG", layout: rowLayout, fill: null, stroke: null, radius: [0, 0, 0, 0], clip: false, children: row.map((k) => k.node) };
          return { node: rowNode, box: { x, y, w: rw, h: rh }, abs: false };
        });
        layout = { mode: "V", gap: rowGap, pad: [...p] as FLayout["pad"], main: "MIN", cross: "MIN" };
        // Rows sitting down or centered in a taller grid (a fixed-height bar, place-content).
        if (rowFrames.length) {
          const above = rowFrames[0].box.y - (b.y + p[0]);
          const last = rowFrames[rowFrames.length - 1].box;
          const below = b.y + b.h - p[2] - (last.y + last.h);
          if (above > 1.5 && Math.abs(above - below) < 2) layout.main = "CENTER";
          else if (above > 1.5 && below < 1.5) layout.main = "MAX";
          else if (above > 1.5) layout.pad[0] += r1(above);
        }
        kids = [...rowFrames, ...list.filter((k) => k.abs)];
      }
    } else if (inflow.length) {
      const sorted = [...inflow].sort((a, c) => a.box.y - c.box.y);
      const stacked = sorted.every((k, i) => i === 0 || k.box.y >= sorted[i - 1].box.y + sorted[i - 1].box.h - 1.5);
      const row = sorted.every((k) => Math.abs(k.box.y - sorted[0].box.y) < 4 || Math.abs(k.box.y + k.box.h / 2 - (sorted[0].box.y + sorted[0].box.h / 2)) < 4);
      if (stacked) {
        const gaps = sorted.slice(1).map((k, i) => k.box.y - (sorted[i].box.y + sorted[i].box.h));
        const gap = gaps.length ? Math.max(0, Math.round(Math.min(...gaps))) : 0;
        const top = sorted[0].box.y - b.y;
        const bottom = b.y + b.h - (sorted[sorted.length - 1].box.y + sorted[sorted.length - 1].box.h);
        const left = sorted.filter((k) => Math.abs(k.box.w - cw) >= 1.5);
        const isCentered = left.length > 0 && left.filter((k) => Math.abs(k.box.x + k.box.w / 2 - (b.x + p[3] + cw / 2)) < 2).length > left.length / 2;
        const isRight = !isCentered && left.length > 0 && left.filter((k) => Math.abs(k.box.x + k.box.w - (b.x + b.w - p[1])) < 2).length > left.length / 2;
        const cross = isCentered ? "CENTER" : isRight ? "MAX" : "MIN";
        layout = { mode: "V", gap, pad: [Math.max(0, r1(top)), p[1], Math.max(0, r1(bottom)), p[3]], main: "MIN", cross };
        inflow.forEach((k) => sizeChild(k, layout!, cw, chH, false));
        inflow.forEach((k) => offset(k, cross, b.x + p[3], cw));
        // Uneven spacing in block flow (margins) is regrouped so every stack keeps one gap.
        const r = arrange(sorted, "V", cross);
        layout.gap = r.gap;
        kids = [...r.items, ...list.filter((k) => k.abs)];
      } else if (columnsOf(inflow)) {
        // Masonry and CSS columns: a row of auto layout columns.
        const cols = columnsOf(inflow)!;
        const colGap = Math.max(0, Math.round(Math.min(...cols.slice(1).map((c, i) => c.x - (cols[i].x + cols[i].w)))));
        const colFrames: Item[] = cols.map((c, ci) => {
          const gaps = c.items.slice(1).map((k, i) => k.box.y - (c.items[i].box.y + c.items[i].box.h));
          const gap = gaps.length ? Math.max(0, Math.round(Math.min(...gaps))) : 0;
          const L: FLayout = { mode: "V", gap, pad: [0, 0, 0, 0], main: "MIN", cross: "MIN" };
          c.items.forEach((k) => {
            sizeChild(k, L, c.w, c.h, false);
            k.node.x = k.box.x - c.x;
            k.node.y = k.box.y - c.y;
          });
          const node: FFrame = { t: "frame", name: `Column ${ci + 1}`, x: c.x, y: c.y, w: c.w, h: c.h, sizeH: "FILL", sizeV: "HUG", layout: L, fill: null, stroke: null, radius: [0, 0, 0, 0], clip: false, children: c.items.map((k) => k.node) };
          return { node, box: { x: c.x, y: c.y, w: c.w, h: c.h }, abs: false };
        });
        layout = { mode: "H", gap: colGap, pad: p, main: "MIN", cross: "MIN" };
        kids = [...colFrames, ...list.filter((k) => k.abs)];
      } else if (row) {
        const byX = [...inflow].sort((a, c) => a.box.x - c.box.x);
        const gaps = byX.slice(1).map((k, i) => k.box.x - (byX[i].box.x + byX[i].box.w));
        layout = { mode: "H", gap: gaps.length ? Math.max(0, Math.round(Math.min(...gaps))) : 0, pad: p, main: "MIN", cross: "CENTER" };
        inflow.forEach((k) => sizeChild(k, layout!, cw, chH, false));
        kids = [...byX, ...list.filter((k) => k.abs)];
      }
    }

    // Paint order, as CSS stacks it: negative z-index at the back, then the flow, then pinned
    // layers above any unpositioned content, then raised (z-index) layers on top. The flow's own
    // order is its layout, so pinned layers slot in around it.
    {
      const absNeg = kids.filter((k) => k.abs && (k.z ?? 0) < 0);
      const absPos = kids.filter((k) => k.abs && (k.z ?? 0) === 0).sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
      const raised = kids.filter((k) => k.abs && (k.z ?? 0) > 0).sort((x, y) => (x.z ?? 0) - (y.z ?? 0) || (x.order ?? 0) - (y.order ?? 0));
      const seq = kids.filter((k) => !k.abs);
      const positioned = (k: Item) => Boolean(k.cs && k.cs.position !== "static");
      for (const a of absPos) {
        let at = 0;
        seq.forEach((k, i) => {
          if ((k.order !== undefined && k.order < (a.order ?? 0)) || (!k.abs && !positioned(k))) at = i + 1;
        });
        seq.splice(at, 0, a);
      }
      kids = [...absNeg, ...seq, ...raised];
    }
    f.layout = layout;
    f.children = kids.map((k) => {
      const n = k.node;
      if (k.abs) n.abs = true;
      n.x = r1(k.box.x - b.x);
      n.y = r1(k.box.y - b.y);
      return n;
    });
    if (isMarked && key) {
      const words = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      f.component = { key: `${key}|${Math.round(b.w)}|${hash(words)}`, type: key };
      f.name = label ?? f.name;
    }
    return f;
  }

  // A page whose content is all pinned (a fixed bar) has no height of its own; give it its content's.
  const rr = h.rect(root);
  const before = root.style.minHeight;
  if (rr.h < 1) root.style.minHeight = `${Math.ceil(Math.max(1, ...[...root.querySelectorAll("*")].map((e) => { const r = h.rect(e); return r.y + r.h - rr.y; })))}px`;
  let top: FFrame;
  try {
    top = build(root) as FFrame;
  } finally {
    root.style.minHeight = before;
  }
  top.name = name;
  top.sizeH = "FIXED";
  top.sizeV = "HUG";
  // A first section's top margin collapses through the page body; keep it as the page's own space.
  const above = root === root.ownerDocument.body ? -h.rect(root.ownerDocument.documentElement).y : 0;
  if (above > 0.5 && top.layout) {
    top.layout.pad[0] += r1(above);
    top.h += above;
    top.y -= above;
    top.children.forEach((c) => (c.y += above));
  }
  if (!top.fill) top.fill = rgba(style(root.ownerDocument.documentElement).backgroundColor);
  settleFills(top);
  // Character boxes were measured on the page; make them relative to their own text layer.
  placeBoxes(top, 0, 0);
  return top;
}
