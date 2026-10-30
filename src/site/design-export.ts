import { canvasDots, gradientsOf, patternOf, readTiles, type FGradient } from "./figma-paint";
import { figmaTree, type RGBA } from "./figma-tree";

/*
 * Turns a rendered section (or a whole page) into something a design tool can paste:
 *
 *  - Figma: SVG with live <text>, rounded shapes, clipping and embedded images.
 *  - Paper: HTML with inline styles (Paper drops class names) and named layers.
 *
 * Both read the DOM exactly as it's drawn, so what you copy is what you see,
 * including CSS zoom (Studio, the component frames) and same-origin iframes.
 */

type Rect = { x: number; y: number; w: number; h: number };

interface Ctx {
  win: Window;
  doc: Document;
  ox: number;
  oy: number;
  scale: number;
  ids: Map<string, number>;
  defs: string[];
  clip: number;
  sections: number;
}

const IGNORE = "[data-export-ignore]";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/*
 * Any CSS color (rgb, oklab, color-mix, lab...) to rgb + alpha. Tailwind's
 * opacity modifiers compute to oklab, which neither SVG nor design tools read.
 */
const colorCache = new Map<string, { rgb: string; a: number } | null>();
let probe: CanvasRenderingContext2D | null = null;
function parseColor(c: string): { rgb: string; a: number } | null {
  if (!c || c === "transparent" || c === "none") return null;
  if (colorCache.has(c)) return colorCache.get(c)!;
  let out: { rgb: string; a: number } | null = null;
  const m = c.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    out = a === 0 ? null : { rgb: `rgb(${p[0]},${p[1]},${p[2]})`, a };
  } else {
    probe ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
    if (probe) {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = "#000";
      probe.fillStyle = c;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
      out = a === 0 ? null : { rgb: `rgb(${r},${g},${b})`, a: Number((a / 255).toFixed(3)) };
    }
  }
  colorCache.set(c, out);
  return out;
}

/** The same color as 0 to 1 channels. */
function rgbaOf(c: string): RGBA | null {
  const p = parseColor(c);
  if (!p) return null;
  const [r, g, b] = p.rgb.match(/\d+/g)!.map(Number);
  return { r: r / 255, g: g / 255, b: b / 255, a: p.a };
}

const svgRgb = (c: RGBA) => `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;

/** A gradient over a box, as an SVG paint server in the drawing's own pixels. Null for conic ones. */
function svgGradientDef(id: string, g: FGradient, r: Rect) {
  const stops = g.stops.map((s) => `<stop offset="${s.at.toFixed(4)}" stop-color="${svgRgb(s.color)}"${s.color.a < 1 ? ` stop-opacity="${s.color.a}"` : ""}/>`).join("");
  if (g.type === "LINEAR" && g.from && g.to) return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r.x + g.from[0] * r.w}" y1="${r.y + g.from[1] * r.h}" x2="${r.x + g.to[0] * r.w}" y2="${r.y + g.to[1] * r.h}">${stops}</linearGradient>`;
  if (g.type === "RADIAL" && g.center && g.radius) {
    const [cx, cy, rx, ry] = [r.x + g.center[0] * r.w, r.y + g.center[1] * r.h, g.radius[0] * r.w, g.radius[1] * r.h];
    return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${rx}" gradientTransform="translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})">${stops}</radialGradient>`;
  }
  return null;
}

/** Squares (x, y, w, h each) as one SVG path. */
const squaresPath = (rects: number[], ox: number, oy: number) => {
  let d = "";
  for (let i = 0; i < rects.length; i += 4) d += `M${+(ox + rects[i]).toFixed(2)} ${+(oy + rects[i + 1]).toFixed(2)}h${+rects[i + 2].toFixed(2)}v${+rects[i + 3].toFixed(2)}h${-rects[i + 2].toFixed(2)}z`;
  return d;
};

/** Rewrites modern color functions inside any CSS value as rgba(), for tools that only read rgb. */
function rgbaIn(value: string) {
  return value.replace(/(?:oklab|oklch|lab|lch|color-mix|color)\((?:[^()]|\([^()]*\))*\)/g, (m) => {
    const c = parseColor(m);
    return c ? (c.a < 1 ? c.rgb.replace("rgb(", "rgba(").replace(")", `,${c.a})`) : c.rgb) : "transparent";
  });
}

function px(v: string) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function isSrOnly(cs: CSSStyleDeclaration) {
  return cs.position === "absolute" && px(cs.width) <= 1 && px(cs.height) <= 1 && cs.overflow === "hidden";
}

function hidden(el: Element, cs: CSSStyleDeclaration) {
  return el.matches(IGNORE) || cs.display === "none" || cs.visibility === "hidden" || isSrOnly(cs);
}

function rectOf(el: Element, ctx: Ctx): Rect {
  const r = el.getBoundingClientRect();
  return { x: (r.left - ctx.ox) / ctx.scale, y: (r.top - ctx.oy) / ctx.scale, w: r.width / ctx.scale, h: r.height / ctx.scale };
}

function layerName(el: Element, ctx: Ctx) {
  const named = el.getAttribute("data-export-name");
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 28);
  const base =
    named ??
    ({ h1: "Headline", h2: "Heading", h3: "Title", p: "Text", a: `Link ${text}`, button: `Button ${text}`, img: "Image", canvas: "Dither", svg: "Icon", li: "Item", ul: "List", ol: "List", nav: "Navigation", header: "Header", footer: "Footer", section: "Section", blockquote: "Quote", input: "Field", label: "Label" } as Record<string, string>)[tag] ??
    "Frame";
  const clean = base.replace(/[^\w ]+/g, "").trim().replace(/\s+/g, " ") || "Layer";
  const n = (ctx.ids.get(clean) ?? 0) + 1;
  ctx.ids.set(clean, n);
  return n === 1 ? clean : `${clean} ${n}`;
}

/** Box of an element; for display: contents wrappers, the union of their children. */
function boxOf(el: Element, ctx: Ctx): Rect {
  const r = rectOf(el, ctx);
  if (r.w > 0 || r.h > 0) return r;
  const kids = [...el.children].map((c) => rectOf(c, ctx)).filter((k) => k.w > 0 && k.h > 0);
  if (!kids.length) return r;
  const x = Math.min(...kids.map((k) => k.x));
  const y = Math.min(...kids.map((k) => k.y));
  return { x, y, w: Math.max(...kids.map((k) => k.x + k.w)) - x, h: Math.max(...kids.map((k) => k.y + k.h)) - y };
}

/* ---------- images ---------- */

function canvasData(c: HTMLCanvasElement, w: number, h: number): string | null {
  try {
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(w * 2));
    out.height = Math.max(1, Math.round(h * 2));
    const g = out.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.drawImage(c, 0, 0, out.width, out.height);
    // Skip canvases that never drew (offscreen shaders pause until seen).
    const probe = g.getImageData(0, 0, out.width, out.height).data;
    let ink = false;
    for (let i = 3; i < probe.length; i += 64) if (probe[i] > 0) {
      ink = true;
      break;
    }
    return ink ? out.toDataURL("image/png") : null;
  } catch {
    return null;
  }
}

/**
 * A dither's inks, each as an alpha mask. Dithers draw a few flat colors on transparency;
 * anything with more colors than that (a photo, a gradient) isn't one, and returns null.
 */
function canvasTints(c: HTMLCanvasElement, w: number, h: number) {
  try {
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(w * 2));
    out.height = Math.max(1, Math.round(h * 2));
    const g = out.getContext("2d", { willReadFrequently: true })!;
    g.imageSmoothingEnabled = false;
    g.drawImage(c, 0, 0, out.width, out.height);
    const img = g.getImageData(0, 0, out.width, out.height);
    const px = img.data;
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
    let total = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 16) continue;
      // Canvas pixels are premultiplied on read-back for partial alpha; undo it before bucketing.
      const a = px[i + 3] / 255;
      const [r, gg, b] = [px[i] / a, px[i + 1] / a, px[i + 2] / a];
      const key = ((r >> 4) << 8) | ((gg >> 4) << 4) | (b >> 4);
      const k = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
      k.n++;
      k.r += r;
      k.g += gg;
      k.b += b;
      buckets.set(key, k);
      total++;
    }
    if (!total) return null;
    const inks = [...buckets.values()].sort((a, b) => b.n - a.n).filter((k) => k.n > total * 0.02).slice(0, 3);
    if (inks.reduce((s, k) => s + k.n, 0) < total * 0.9) return null;
    const colors = inks.map((k) => [k.r / k.n, k.g / k.n, k.b / k.n]);
    const masks = colors.map(() => new ImageData(out.width, out.height));
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 16) continue;
      const a = px[i + 3] / 255;
      const [r, gg, b] = [px[i] / a, px[i + 1] / a, px[i + 2] / a];
      let best = 0;
      let d = Infinity;
      colors.forEach(([cr, cg, cb], j) => {
        const e = (r - cr) ** 2 + (gg - cg) ** 2 + (b - cb) ** 2;
        if (e < d) [d, best] = [e, j];
      });
      masks[best].data[i + 3] = px[i + 3];
    }
    return colors.map(([r, gg, b], j) => {
      g.putImageData(masks[j], 0, 0);
      return { color: { r: r / 255, g: gg / 255, b: b / 255, a: 1 }, mask: out.toDataURL("image/png") };
    });
  } catch {
    return null;
  }
}

function imgData(img: HTMLImageElement): string {
  try {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    c.getContext("2d")!.drawImage(img, 0, 0);
    return c.toDataURL("image/jpeg", 0.88);
  } catch {
    return new URL(img.currentSrc || img.src, location.href).href;
  }
}

/** Paint an SVG takes from CSS (classes, variables, inherited color), written onto the copy so it draws the same anywhere. */
const SVG_INHERITED = ["fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "visibility"];
const SVG_OWN: Record<string, string> = { opacity: "1", "vector-effect": "none", "stop-color": "rgb(0, 0, 0)", "stop-opacity": "1", display: "inline" };
const SVG_INITIAL: Record<string, string> = { fill: "rgb(0, 0, 0)", "fill-opacity": "1", "fill-rule": "nonzero", stroke: "none", "stroke-width": "1px", "stroke-opacity": "1", "stroke-linecap": "butt", "stroke-linejoin": "miter", "stroke-dasharray": "none", "stroke-dashoffset": "0px", "stroke-miterlimit": "4", visibility: "visible" };

function inlineSvg(svg: SVGSVGElement, color: string, w: number, h: number) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const win = svg.ownerDocument.defaultView ?? window;
  const from = [svg, ...svg.querySelectorAll("*")];
  const to = [copy, ...copy.querySelectorAll("*")];
  from.forEach((el, i) => {
    const c = to[i] as SVGElement | undefined;
    if (!c || el.closest("foreignObject")) return;
    // Shapes kept for <use> take their paint from where they're used, so they keep only their own attributes.
    if (el.closest("defs,symbol") && el.tagName.toLowerCase() !== "stop") return c.removeAttribute("class");
    const cs = win.getComputedStyle(el);
    const up = i > 0 && el.parentElement ? win.getComputedStyle(el.parentElement) : null;
    const style: string[] = [];
    for (const p of SVG_INHERITED) {
      const v = cs.getPropertyValue(p);
      if (v && v !== (up ? up.getPropertyValue(p) : SVG_INITIAL[p])) style.push(`${p}:${rgbaIn(v)}`);
    }
    for (const [p, initial] of Object.entries(SVG_OWN)) {
      const v = cs.getPropertyValue(p);
      if (v && v !== initial && !(p === "display" && i === 0)) style.push(`${p}:${rgbaIn(v)}`);
    }
    // CSS transforms on parts of a drawing (a spinning ring, a flipped chevron) as SVG transforms.
    if (i > 0 && cs.transform && cs.transform !== "none" && !el.getAttribute("transform")) style.push(`transform:${cs.transform}`, `transform-origin:${cs.transformOrigin}`, `transform-box:${cs.getPropertyValue("transform-box") || "view-box"}`);
    if (style.length) c.setAttribute("style", style.join(";"));
    else c.removeAttribute("style");
    c.removeAttribute("class");
  });
  copy.setAttribute("width", String(w));
  copy.setAttribute("height", String(h));
  return new XMLSerializer().serializeToString(copy).replace(/currentColor/g, color);
}

/* ---------- Figma: SVG ---------- */

function roundedPath({ x, y, w, h }: Rect, r: [number, number, number, number]) {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = r.map((v) => Math.min(v, max));
  return `M${x + tl},${y}H${x + w - tr}${tr ? `A${tr},${tr} 0 0 1 ${x + w},${y + tr}` : ""}V${y + h - br}${br ? `A${br},${br} 0 0 1 ${x + w - br},${y + h}` : ""}H${x + bl}${bl ? `A${bl},${bl} 0 0 1 ${x},${y + h - bl}` : ""}V${y + tl}${tl ? `A${tl},${tl} 0 0 1 ${x + tl},${y}` : ""}Z`;
}

const metricsCache = new Map<string, number>();
function ascentRatio(font: string) {
  if (metricsCache.has(font)) return metricsCache.get(font)!;
  const g = document.createElement("canvas").getContext("2d")!;
  g.font = font;
  const m = g.measureText("Hg");
  const asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent || 0.8;
  const desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent || 0.2;
  const ratio = asc / (asc + desc);
  metricsCache.set(font, ratio);
  return ratio;
}

function textNodeSvg(node: Text, cs: CSSStyleDeclaration, ctx: Ctx): string {
  const raw = node.data;
  if (!raw.trim()) return "";
  const color = parseColor(cs.color);
  if (!color) return "";
  const range = ctx.doc.createRange();
  const lines: Array<{ top: number; h: number; left: number; words: string[] }> = [];
  const upper = cs.textTransform === "uppercase";
  for (const m of raw.matchAll(/\S+/g)) {
    range.setStart(node, m.index!);
    range.setEnd(node, m.index! + m[0].length);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const r = rects[0];
    const top = (r.top - ctx.oy) / ctx.scale;
    const h = r.height / ctx.scale;
    const left = (r.left - ctx.ox) / ctx.scale;
    const line = lines.find((l) => Math.abs(l.top - top) < h * 0.5);
    const word = upper ? m[0].toUpperCase() : m[0];
    if (line) line.words.push(word);
    else lines.push({ top, h, left, words: [word] });
  }
  const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
  const size = px(cs.fontSize);
  const ratio = ascentRatio(`${cs.fontWeight} ${size}px ${cs.fontFamily}`);
  const ls = cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing);
  return lines
    .map(
      (l) =>
        `<text x="${l.left.toFixed(2)}" y="${(l.top + l.h * ratio).toFixed(2)}" font-family="${esc(family)}" font-size="${size}" font-weight="${cs.fontWeight}"${cs.fontStyle === "italic" ? ' font-style="italic"' : ""}${ls ? ` letter-spacing="${ls.toFixed(2)}"` : ""} fill="${color.rgb}"${color.a < 1 ? ` fill-opacity="${color.a}"` : ""} xml:space="preserve">${esc(l.words.join(" "))}</text>`,
    )
    .join("");
}

function elementSvg(el: Element, ctx: Ctx): string {
  const cs = ctx.win.getComputedStyle(el);
  if (hidden(el, cs)) return "";
  const r = rectOf(el, ctx);
  const tag = el.tagName.toLowerCase();
  const radii: [number, number, number, number] = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(px) as [number, number, number, number];
  const shape = roundedPath(r, radii);
  const parts: string[] = [];

  // A texture used as a mask shows the element's own color only where its dots are.
  const mask = r.w > 0 && r.h > 0 ? patternOf(cs, "mask", r.w, r.h, 1, rgbaOf(cs.backgroundColor)) : null;
  const masked = Boolean(mask && mask.cover < 0.999);
  const bg = masked ? null : parseColor(cs.backgroundColor);
  if (bg && r.w > 0 && r.h > 0) parts.push(`<path d="${shape}" fill="${bg.rgb}"${bg.a < 1 ? ` fill-opacity="${bg.a}"` : ""}/>`);
  const clipText = cs.backgroundClip === "text" || (cs as CSSStyleDeclaration & { webkitBackgroundClip?: string }).webkitBackgroundClip === "text";
  if (!masked && !clipText && r.w > 0 && r.h > 0)
    for (const g of gradientsOf(cs.backgroundImage, cs.backgroundSize, r.w, r.h, rgbaOf).reverse()) {
      const id = `paint${++ctx.clip}`;
      const def = svgGradientDef(id, g, r);
      if (!def) continue;
      ctx.defs.push(def);
      parts.push(`<path d="${shape}" fill="url(#${id})"/>`);
    }
  const texture = masked ? mask : r.w > 0 && r.h > 0 ? patternOf(cs, "background", r.w, r.h, 1) : null;
  if (texture?.rects?.length) {
    const id = `clip${++ctx.clip}`;
    ctx.defs.push(`<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
    parts.push(`<path clip-path="url(#${id})" d="${squaresPath(texture.rects, r.x, r.y)}" fill="${svgRgb(texture.color)}"${texture.color.a < 1 ? ` fill-opacity="${texture.color.a}"` : ""}/>`);
  }

  const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px);
  const bc = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor].map(parseColor);
  const solid = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle].map((s) => s !== "none" && s !== "hidden");
  if (bw.every((w, i) => w === bw[0] && solid[i] && bc[i]?.rgb === bc[0]?.rgb) && bw[0] > 0 && bc[0]) {
    const inset = bw[0] / 2;
    const inner = roundedPath({ x: r.x + inset, y: r.y + inset, w: r.w - bw[0], h: r.h - bw[0] }, radii.map((v) => Math.max(0, v - inset)) as typeof radii);
    parts.push(`<path d="${inner}" fill="none" stroke="${bc[0].rgb}"${bc[0].a < 1 ? ` stroke-opacity="${bc[0].a}"` : ""} stroke-width="${bw[0]}"/>`);
  } else {
    const sides: Rect[] = [
      { x: r.x, y: r.y, w: r.w, h: bw[0] },
      { x: r.x + r.w - bw[1], y: r.y, w: bw[1], h: r.h },
      { x: r.x, y: r.y + r.h - bw[2], w: r.w, h: bw[2] },
      { x: r.x, y: r.y, w: bw[3], h: r.h },
    ];
    sides.forEach((s, i) => {
      const c = bc[i];
      if (bw[i] > 0 && solid[i] && c) parts.push(`<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="${c.rgb}"${c.a < 1 ? ` fill-opacity="${c.a}"` : ""}/>`);
    });
  }

  const ink = parseColor(cs.color);
  const color = ink ? (ink.a < 1 ? ink.rgb.replace("rgb(", "rgba(").replace(")", `,${ink.a})`) : ink.rgb) : "#000";
  if (tag === "img") {
    const img = el as HTMLImageElement;
    const fit = cs.objectFit === "cover" ? "xMidYMid slice" : cs.objectFit === "contain" ? "xMidYMid meet" : "none";
    parts.push(`<image x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="${fit}" href="${imgData(img)}"/>`);
  } else if (tag === "canvas") {
    // A dither in a few flat inks as vector dots; a photo or 3D scene as the picture it is.
    const dots = canvasDots(el as HTMLCanvasElement, r.w, r.h);
    if (dots) {
      if (dots.base) parts.push(`<path d="${shape}" fill="${svgRgb(dots.base)}"/>`);
      for (const ink of dots.inks) parts.push(`<path d="${squaresPath(ink.rects, r.x, r.y)}" fill="${svgRgb(ink.color)}"/>`);
    } else {
      const data = canvasData(el as HTMLCanvasElement, r.w, r.h);
      if (data) parts.push(`<image x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="none" href="${data}" style="image-rendering:pixelated"/>`);
    }
  } else if (tag === "svg") {
    const inner = inlineSvg(el as SVGSVGElement, color, r.w, r.h).replace(/^<svg/, `<svg x="${r.x}" y="${r.y}"`);
    parts.push(inner);
  } else if (tag === "input" || tag === "textarea") {
    const f = el as HTMLInputElement;
    const value = f.value || f.placeholder;
    if (value && f.type !== "range" && f.type !== "checkbox" && f.type !== "radio") {
      const size = px(cs.fontSize);
      parts.push(`<text x="${r.x + px(cs.paddingLeft)}" y="${r.y + r.h / 2 + size * 0.35}" font-family="${esc(cs.fontFamily.split(",")[0].replace(/["']/g, ""))}" font-size="${size}" fill="${color}"${f.value ? "" : ' fill-opacity="0.5"'}>${esc(value)}</text>`);
    }
  } else {
    // Paint children in stacking order: negative z-index first (backgrounds), then the rest in DOM order.
    const kids: Array<{ z: number; i: number; svg: string }> = [];
    el.childNodes.forEach((child, i) => {
      if (child.nodeType === Node.TEXT_NODE) kids.push({ z: 0, i, svg: textNodeSvg(child as Text, cs, ctx) });
      else if (child.nodeType === Node.ELEMENT_NODE) {
        const z = parseInt(ctx.win.getComputedStyle(child as Element).zIndex, 10);
        kids.push({ z: Number.isFinite(z) ? z : 0, i, svg: elementSvg(child as Element, ctx) });
      }
    });
    const body = kids
      .sort((a, b) => a.z - b.z || a.i - b.i)
      .map((k) => k.svg)
      .join("");
    if (body) {
      const clips = cs.overflowX !== "visible" || cs.overflowY !== "visible";
      if (clips && r.w > 0 && r.h > 0) {
        const id = `clip${++ctx.clip}`;
        ctx.defs.push(`<clipPath id="${id}"><path d="${shape}"/></clipPath>`);
        parts.push(`<g clip-path="url(#${id})">${body}</g>`);
      } else parts.push(body);
    }
  }

  if (!parts.length) return "";
  const opacity = Number(cs.opacity);
  // Sections carry their identity and box in the SVG too, for tools that read SVG structure.
  const key = el.getAttribute("data-bd-block");
  if (key) {
    const box = boxOf(el, ctx);
    const label = el.getAttribute("data-bd-name") ?? key;
    ctx.sections++;
    return `<g id="${esc(label)}" data-bd-component="${esc(key)}" data-bd-rect="${[box.x, box.y, box.w, box.h].map((v) => v.toFixed(1)).join(",")}">${parts.join("")}</g>`;
  }
  return `<g id="${esc(layerName(el, ctx))}"${opacity < 1 ? ` opacity="${opacity}"` : ""}>${parts.join("")}</g>`;
}

/* ---------- Paper: HTML with inline styles ---------- */

const KEEP = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "justify-items",
  "justify-self",
  "align-items",
  "align-self",
  "align-content",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "order",
  "gap",
  "row-gap",
  "column-gap",
  "grid-template-columns",
  "grid-template-rows",
  "grid-column",
  "grid-row",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "min-height",
  "min-width",
  "max-width",
  "aspect-ratio",
  "grid-auto-rows",
  "column-count",
  "break-inside",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration-line",
  "white-space",
  "text-overflow",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "box-shadow",
  "opacity",
  "overflow",
  "object-fit",
  "transform",
  "z-index",
  "isolation",
];

const DEFAULTS: Record<string, string[]> = {
  position: ["static"],
  top: ["auto"],
  right: ["auto"],
  bottom: ["auto"],
  left: ["auto"],
  "flex-direction": ["row"],
  "flex-wrap": ["nowrap"],
  "justify-content": ["normal"],
  "justify-items": ["normal", "legacy"],
  "justify-self": ["auto"],
  "text-overflow": ["clip"],
  "align-items": ["normal"],
  "align-self": ["auto"],
  "align-content": ["normal"],
  "flex-grow": ["0"],
  "max-width": ["none"],
  "aspect-ratio": ["auto"],
  "grid-auto-rows": ["auto"],
  "column-count": ["auto"],
  "break-inside": ["auto"],
  "flex-shrink": ["1"],
  "flex-basis": ["auto"],
  order: ["0"],
  gap: ["normal", "normal normal"],
  "row-gap": ["normal"],
  "column-gap": ["normal"],
  "grid-template-columns": ["none"],
  "grid-template-rows": ["none"],
  "grid-column": ["auto", "auto / auto"],
  "grid-row": ["auto", "auto / auto"],
  "min-height": ["auto", "0px"],
  "min-width": ["auto", "0px"],
  "background-color": ["rgba(0, 0, 0, 0)", "transparent"],
  "background-image": ["none"],
  "background-size": ["auto"],
  "background-position": ["0% 0%"],
  "background-repeat": ["repeat"],
  "font-style": ["normal"],
  "letter-spacing": ["normal"],
  "text-transform": ["none"],
  "text-decoration-line": ["none"],
  "white-space": ["normal"],
  "box-shadow": ["none"],
  opacity: ["1"],
  overflow: ["visible"],
  "object-fit": ["fill"],
  transform: ["none"],
  "z-index": ["auto"],
  isolation: ["auto"],
};

const INHERITED = new Set(["color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "text-transform", "white-space"]);

/**
 * The size CSS asked for ("120px", "50%", "auto"), not the size it came out at. A hidden element
 * reports its declared width and height, so hide it for a moment and ask.
 */
function declared(el: Element, ctx: Ctx) {
  if (!(el instanceof HTMLElement)) return { width: "auto", height: "auto", top: "auto", right: "auto", bottom: "auto", left: "auto", "margin-top": "", "margin-right": "", "margin-bottom": "", "margin-left": "" };
  const prev = el.style.getPropertyValue("display");
  const prio = el.style.getPropertyPriority("display");
  el.style.setProperty("display", "none", "important");
  const cs = ctx.win.getComputedStyle(el);
  // The edges too: drawn, a pinned layer reports all four in pixels, even the ones never set. And
  // margins, where auto (pushing a group to the end of its row) would otherwise read as pixels.
  const out = { width: cs.width, height: cs.height, top: cs.top, right: cs.right, bottom: cs.bottom, left: cs.left, "margin-top": cs.marginTop, "margin-right": cs.marginRight, "margin-bottom": cs.marginBottom, "margin-left": cs.marginLeft };
  if (prev) el.style.setProperty("display", prev, prio);
  else el.style.removeProperty("display");
  return out;
}

const FRACTIONS = [1, 3 / 4, 2 / 3, 1 / 2, 1 / 3, 1 / 4];

/** Elements a browser styles by default (margins, bold, bullets); the site resets them, so the paste must too. */
const UA_STYLED = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "dl", "dd", "blockquote", "figure", "pre", "hr", "fieldset", "legend", "menu"]);

/** Grid tracks as shares of the row, so columns keep their proportions at any width. */
function fluidTracks(v: string) {
  const px = v.split(" ").filter(Boolean).map((t) => parseFloat(t));
  if (!px.length || px.some((n) => !Number.isFinite(n))) return v;
  if (px.every((n) => Math.abs(n - px[0]) < 1)) return `repeat(${px.length}, minmax(0, 1fr))`;
  const min = Math.min(...px);
  return px.map((n) => `minmax(0, ${(n / min).toFixed(2)}fr)`).join(" ");
}

/**
 * Whether all of an element's words sit on one line in the browser: every run of text shares a
 * row (their boxes overlap top to bottom), however the runs are aligned. Short ones like that
 * (a label, a button, a pill) are told not to wrap in Paper, whose letters come out a hair wider
 * than the browser's and would otherwise break a word across two lines.
 */
function oneLine(el: Element, doc: Document) {
  const walk = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let top = -Infinity;
  let bottom = Infinity;
  let chars = 0;
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const t = (n as Text).data;
    if (!t.trim()) continue;
    chars += t.trim().length;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 0.5) continue;
      top = Math.max(top, r.top);
      bottom = Math.min(bottom, r.bottom);
    }
  }
  return chars > 0 && chars <= 48 && top < bottom;
}

/**
 * Inline styles for Paper, written to stay responsive: boxes the browser sized from their
 * content or parent keep no fixed size, grids become fr columns, set widths become percentages
 * where they are one, and caps (max-width) carry over. Resize the frame in Paper and it reflows.
 */
function styleFor(el: Element, cs: CSSStyleDeclaration, parent: CSSStyleDeclaration | null, r: Rect, hasText: boolean, ctx: Ctx) {
  const out: string[] = ["box-sizing: border-box"];
  if (["ul", "ol", "menu"].includes(el.tagName.toLowerCase())) out.push("list-style: none");
  // The copied frame itself: just its width. Where it sat offscreen while being measured isn't part of the design.
  const isRoot = parent === null;
  const want = declared(el, ctx);
  const item = !!parent && /flex|grid/.test(parent.display);
  for (const p of KEEP) {
    if (isRoot && ["position", "top", "right", "bottom", "left", "z-index", "transform"].includes(p)) continue;
    // Only the edges CSS set: one that was left to fall where it may would pin the layer on that side too.
    if ((p === "top" || p === "right" || p === "bottom" || p === "left") && want[p] === "auto") continue;
    if ((p === "margin-top" || p === "margin-right" || p === "margin-bottom" || p === "margin-left") && want[p] === "auto" && !isRoot) {
      out.push(`${p}: auto`);
      continue;
    }
    let v = cs.getPropertyValue(p);
    if (!v) continue;
    // In a row or a column, a floor of 0 (min-h-0, min-w-0) is what lets an item shrink to fit, not the default.
    if ((p === "min-height" || p === "min-width") && v === "0px" && item) {
      out.push(`${p}: 0px`);
      continue;
    }
    if (DEFAULTS[p]?.includes(v)) continue;
    if (p.startsWith("margin") && v === "0px" && !UA_STYLED.has(el.tagName.toLowerCase())) continue;
    if (p.startsWith("padding") && v === "0px" && ["ul", "ol", "menu", "fieldset"].includes(el.tagName.toLowerCase())) {
      out.push(`${p}: 0px`);
      continue;
    }
    if (p.startsWith("padding") && v === "0px") continue;
    if (p.startsWith("border-") && p.endsWith("radius") && v === "0px") continue;
    if (/^border-(top|right|bottom|left)$/.test(p) && (v.startsWith("0px") || v.includes("none"))) continue;
    if (["top", "right", "bottom", "left"].includes(p) && cs.position === "relative" && v === "0px") continue;
    if (INHERITED.has(p) && parent && parent.getPropertyValue(p) === v && !(UA_STYLED.has(el.tagName.toLowerCase()) && (p === "font-size" || p === "font-weight"))) continue;
    if (p === "grid-template-rows") continue;
    if (p === "grid-template-columns") v = fluidTracks(v);
    if (p === "background-image") v = v.replace(/url\("?(?!data:)([^")]+)"?\)/g, (_, u) => `url("${new URL(u, ctx.doc.baseURI).href}")`);
    if (p === "display" && v === "inline") v = "inline-block";
    v = rgbaIn(v);
    out.push(`${p}: ${v}`);
  }
  // A browser lets an item that clips (a scrolling page, a panel) shrink below what's in it; say so,
  // or a line a hair taller in Paper pushes it, and everything under it, out of its frame.
  if (item && (cs.overflowX !== "visible" || cs.overflowY !== "visible")) {
    if (cs.minHeight === "auto") out.push("min-height: 0px");
    if (cs.minWidth === "auto") out.push("min-width: 0px");
  }
  // Centered containers (mx-auto with a max width) report their auto margins as 0, so restore them.
  if (cs.maxWidth !== "none" && el.parentElement && cs.position === "static") {
    const p = el.parentElement.getBoundingClientRect();
    const mine = el.getBoundingClientRect();
    if (Math.abs(mine.left - p.left - (p.right - mine.right)) < 2 && mine.width < p.width - 2) out.push("margin-left: auto", "margin-right: auto");
  }
  if (cs.display === "inline") return out.join("; ");

  const tag = el.tagName.toLowerCase();
  const pinned = cs.position === "absolute" || cs.position === "fixed";
  // Short words on one line stay on one line, and in a row they keep their room rather than be squeezed into wrapping.
  if (hasText && !isRoot && oneLine(el, ctx.doc)) {
    if (cs.whiteSpace === "normal") out.push("white-space: nowrap");
    const row = parent && parent.display.includes("flex") && !parent.flexDirection.startsWith("column");
    if (row && !pinned && cs.flexShrink !== "0" && el.scrollWidth <= el.clientWidth + 1) out.push("flex-shrink: 0");
  }
  const media = ["img", "canvas", "svg", "input", "video"].includes(tag);
  const holder = el.parentElement;
  const pcs = holder ? ctx.win.getComputedStyle(holder) : null;
  const room = holder && pcs ? rectOf(holder, ctx).w - px(pcs.paddingLeft) - px(pcs.paddingRight) - px(pcs.borderLeftWidth) - px(pcs.borderRightWidth) : r.w;
  const fills = Math.abs(r.w - room) < 1.5;

  if (isRoot || !holder) {
    // Its own frame for what's pinned inside it, wherever it lands beside the other widths, and
    // its height where it has a set one (a screen, as tall as its window): what fills it (the
    // sidebar, with the account at its foot) fills it in Paper too.
    out.push(`width: ${r.w.toFixed(1)}px`, "position: relative");
    if (/^[\d.]+px$/.test(want.height)) out.push(`height: ${r.h.toFixed(1)}px`);
    return out.join("; ");
  } else if (pinned) {
    // Pinned layers (badges, glows, overlays) keep the box they were drawn in, unless their
    // edges stretch them (inset 0): then they follow their parent as it resizes.
    const across = want.left !== "auto" && want.right !== "auto";
    const down = want.top !== "auto" && want.bottom !== "auto";
    if (!across) out.push(`width: ${r.w.toFixed(1)}px`);
    if (!down) out.push(`height: ${r.h.toFixed(1)}px`);
    return out.join("; ");
  } else if (media) {
    if (fills) out.push("width: 100%", "height: auto", `aspect-ratio: ${r.w.toFixed(1)} / ${r.h.toFixed(1)}`);
    else out.push(`width: ${r.w.toFixed(1)}px`, `height: ${r.h.toFixed(1)}px`, "max-width: 100%");
    return out.join("; ");
  }
  if (!pinned && !media && !isRoot && holder) {
    // Widths: percentages stay percentages; a set width keeps its size but can never overflow; auto stays fluid.
    if (want.width.endsWith("%")) out.push(`width: ${want.width}`);
    else if (want.width !== "auto") {
      const share = room > 0 ? r.w / room : 0;
      const frac = FRACTIONS.find((f) => Math.abs(share - f) < 0.006);
      out.push(frac && !/^\d+(\.\d+)?px$/.test(want.width) ? `width: ${+(frac * 100).toFixed(3)}%` : `width: ${r.w.toFixed(1)}px`, "max-width: 100%");
    }
  }
  // Heights: content sets them, unless CSS fixed one (a hero, a card, a button) or the box only draws a shape.
  if (cs.aspectRatio === "auto") {
    if (want.height.endsWith("%")) out.push(`height: ${want.height}`);
    else if (want.height !== "auto" || (!hasText && !el.children.length)) out.push(`height: ${r.h.toFixed(1)}px`);
  }
  return out.join("; ");
}

function elementHtml(el: Element, parent: CSSStyleDeclaration | null, ctx: Ctx): string {
  const cs = ctx.win.getComputedStyle(el);
  if (hidden(el, cs)) return "";
  if (cs.display === "contents") return [...el.children].map((c) => elementHtml(c, parent, ctx)).join("");
  const tag = el.tagName.toLowerCase();
  const r = rectOf(el, ctx);
  const name = esc(layerName(el, ctx));
  const hasText = Boolean((el.textContent ?? "").trim());
  const style = esc(styleFor(el, cs, parent, r, hasText, ctx));
  if (tag === "canvas") {
    const data = canvasData(el as HTMLCanvasElement, r.w, r.h);
    return data ? `<img layer-name="${name}" src="${data}" style="${style}; image-rendering: pixelated" alt="">` : "";
  }
  if (tag === "img") {
    const img = el as HTMLImageElement;
    return `<img layer-name="${name}" src="${esc(new URL(img.currentSrc || img.src, ctx.doc.baseURI).href)}" alt="${esc(img.alt)}" style="${style}">`;
  }
  if (tag === "svg") return inlineSvg(el as SVGSVGElement, parseColor(cs.color)?.rgb ?? "#000", r.w, r.h).replace(/^<svg/, `<svg layer-name="${name}" style="${style}"`);
  if (tag === "input" || tag === "textarea") {
    // An input's words sit in the middle of its height, and a placeholder wears its own color.
    const f = el as HTMLInputElement;
    const hint = !f.value && f.placeholder ? ctx.win.getComputedStyle(el, "::placeholder").color : "";
    const middle = tag === "input" ? "; display: flex; align-items: center; white-space: nowrap; overflow: hidden" : "";
    return `<div layer-name="${name}" style="${style}${middle}${parseColor(hint) ? `; color: ${esc(rgbaIn(hint))}` : ""}">${esc(f.value || f.placeholder || "")}</div>`;
  }
  // A paragraph holding layers is written as a frame: a parser closes a <p> at the first <div>
  // inside it (a button or a link, written as one), which would push the rest out after it.
  const safeTag = ["a", "button", "label", "select", "option", "summary", "details", "form", "fieldset", "legend"].includes(tag) || (tag === "p" && el.children.length > 0) ? "div" : tag;
  let inner = "";
  // In a row or a grid, words beside other layers are a layer of their own, as the browser lays
  // them out: the words between two layers, however many text nodes they came in, one item.
  const runs = /flex|grid/.test(cs.display) && el.children.length > 0;
  let run = "";
  const endRun = () => {
    const words = run.replace(/\s+/g, " ").trim();
    if (words) inner += `<span layer-name="Text" style="box-sizing: border-box; display: block">${esc(cs.textTransform === "uppercase" ? words.toUpperCase() : words)}</span>`;
    run = "";
  };
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && runs) run += (child as Text).data;
    else if (child.nodeType === Node.TEXT_NODE) {
      const t = (child as Text).data;
      if (t.trim()) inner += esc(cs.textTransform === "uppercase" ? t.toUpperCase() : t);
      else if (t && inner) inner += " ";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      endRun();
      // A styled run's edge spaces would collapse inside it; keep them between the runs instead.
      const words = (child as Element).textContent ?? "";
      const html = elementHtml(child as Element, cs, ctx);
      inner += runs ? html : (html && /^\s/.test(words) && inner && !inner.endsWith(" ") ? " " : "") + html + (html && /\s$/.test(words) ? " " : "");
    }
  }
  endRun();
  // A button centers what's in it by itself; written as a frame, it's told to.
  const centered = tag === "button" && !/flex|grid/.test(cs.display) ? `; display: flex; align-items: center; justify-content: ${cs.textAlign === "left" || cs.textAlign === "start" ? "flex-start" : cs.textAlign === "right" || cs.textAlign === "end" ? "flex-end" : "center"}` : "";
  return `<${safeTag} layer-name="${name}" style="${style}${centered}">${inner}</${safeTag}>`;
}

/* ---------- entry points ---------- */

/** The nearest ancestor (within a few levels) that clips what's inside it. */
function clipper(el: HTMLElement, win: Window) {
  let n = el.parentElement;
  for (let i = 0; n && i < 3; i++, n = n.parentElement) {
    const cs = win.getComputedStyle(n);
    if (cs.overflowX !== "visible" || cs.overflowY !== "visible") return n;
  }
  return null;
}

/**
 * Entrances that haven't played yet would export invisible: faded out (opacity 0), held back
 * (visibility hidden until a scramble starts) or slid out of a clipped line (a word reveal). Show
 * all of them at rest while reading, and put them back after.
 */
function settle(root: Element) {
  const win = root.ownerDocument.defaultView ?? window;
  const touched: Array<[HTMLElement, string, string, string]> = [];
  root.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const st = el.style;
    let rest = st.opacity === "0" || st.visibility === "hidden";
    if (!rest && /translate/.test(st.transform)) {
      const c = clipper(el, win);
      if (c) {
        const a = el.getBoundingClientRect();
        const b = c.getBoundingClientRect();
        const seen = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        rest = seen < a.width * a.height * 0.5;
      }
    }
    if (!rest) return;
    touched.push([el, st.opacity, st.transform, st.visibility]);
    if (st.opacity === "0") st.opacity = "1";
    if (st.visibility === "hidden") st.visibility = "visible";
    st.transform = "none";
  });
  return () => touched.forEach(([el, o, t, v]) => ((el.style.opacity = o), (el.style.transform = t), (el.style.visibility = v)));
}

/** The color actually behind an element: its own, or the nearest ancestor's. */
function backdrop(el: Element, win: Window): string | null {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const c = win.getComputedStyle(n).backgroundColor;
    if (parseColor(c)) return c;
  }
  return null;
}

function context(root: HTMLElement): Ctx {
  const win = root.ownerDocument.defaultView ?? window;
  const r = root.getBoundingClientRect();
  const layoutW = parseFloat(win.getComputedStyle(root).width) || r.width;
  return { win, doc: root.ownerDocument, ox: r.left, oy: r.top, scale: r.width / layoutW || 1, ids: new Map(), defs: [], clip: 0, sections: 0 };
}

export function toFigmaSvg(root: HTMLElement, name: string) {
  const restore = settle(root);
  try {
    const ctx = context(root);
    const w = root.getBoundingClientRect().width / ctx.scale;
    const h = root.getBoundingClientRect().height / ctx.scale;
    root.setAttribute("data-export-name", name);
    const body = elementSvg(root, ctx);
    root.removeAttribute("data-export-name");
    const bg = parseColor(backdrop(root, ctx.win) ?? "");
    const base = bg ? `<rect id="Background" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${bg.rgb}"/>` : "";
    const meta = esc(JSON.stringify({ v: 1, name, kind: ctx.sections > 1 ? "page" : "component", bg: bg?.rgb ?? null, width: Math.round(w) }));
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-basedraft="${meta}" width="${Math.round(w)}" height="${Math.round(h)}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}"><defs>${ctx.defs.join("")}</defs><g id="${esc(name)}">${base}${body}</g></svg>`;
  } finally {
    restore();
  }
}

/** The auto layout tree "Copy for Figma" encodes as native Figma layers. */
export function toFigmaTree(root: HTMLElement, name: string) {
  const restore = settle(root);
  try {
    const ctx = context(root);
    return figmaTree(root, name, {
      win: ctx.win,
      rect: (el) => rectOf(el, ctx),
      rangeRect: (r) => {
        const b = r.getBoundingClientRect();
        if (!b.width && !b.height) return null;
        return { x: (b.left - ctx.ox) / ctx.scale, y: (b.top - ctx.oy) / ctx.scale, w: b.width / ctx.scale, h: b.height / ctx.scale };
      },
      color: parseColor,
      hidden,
      canvas: canvasData,
      tints: canvasTints,
      img: imgData,
      svg: inlineSvg,
    });
  } finally {
    restore();
  }
}

export function toPaperHtml(root: HTMLElement, name: string) {
  const restore = settle(root);
  try {
    const ctx = context(root);
    root.setAttribute("data-export-name", name);
    let html = elementHtml(root, null, ctx);
    root.removeAttribute("data-export-name");
    // A section relies on its theme's page color; carry it onto the pasted frame.
    const bg = backdrop(root, ctx.win);
    if (bg && !parseColor(ctx.win.getComputedStyle(root).backgroundColor)) html = html.replace(/style="box-sizing: border-box/, `style="box-sizing: border-box; background-color: ${rgbaIn(bg)}`);
    return html;
  } finally {
    restore();
  }
}

/* ---------- export frame: a fixed 1440 page with 100px side margins ---------- */

export const EXPORT_WIDTH = 1440;
export const EXPORT_GUTTER = 100;

/** Redraws a live canvas into its clone, keeping the dither dot size and covering the new box. */
function copyCanvas(from: HTMLCanvasElement, to: HTMLCanvasElement) {
  const host = to.parentElement;
  const srcHost = from.parentElement;
  if (!host || !srcHost || !from.width || !from.height) return;
  to.style.width = "100%";
  to.style.height = "100%";
  const cells = from.width / Math.max(1, srcHost.clientWidth);
  const w = Math.max(1, Math.round(host.clientWidth * cells));
  const h = Math.max(1, Math.round(host.clientHeight * cells));
  to.width = w;
  to.height = h;
  const g = to.getContext("2d");
  if (!g) return;
  g.imageSmoothingEnabled = false;
  const k = Math.max(w / from.width, h / from.height);
  const dw = from.width * k;
  const dh = from.height * k;
  try {
    g.drawImage(from, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } catch {
    /* tainted or lost context: leave it blank */
  }
}

/**
 * Lays the target out again offscreen at exactly 1440px with 100px gutters,
 * whatever width it's previewed at, so every copy has the same frame.
 */
/** Every Figma copy carries all three, as variants. Desktop gets the fixed 100px margins; smaller widths keep each section's own. */
export const VIEWPORTS: Array<{ name: string; width: number; gutter: number | null }> = [
  { name: "Desktop", width: EXPORT_WIDTH, gutter: EXPORT_GUTTER },
  { name: "Tablet", width: 820, gutter: null },
  { name: "Mobile", width: 390, gutter: null },
];

export async function exportFrame(target: HTMLElement, { width = EXPORT_WIDTH, gutter = EXPORT_GUTTER as number | null } = {}): Promise<{ root: HTMLElement; done: () => void }> {
  const doc = target.ownerDocument;
  const scope = target.closest<HTMLElement>(".bd-scope") ?? target;
  let root: HTMLElement;
  if (scope === target) root = target.cloneNode(true) as HTMLElement;
  else {
    root = scope.cloneNode(false) as HTMLElement;
    root.appendChild(target.cloneNode(true));
  }
  root.removeAttribute("id");
  Object.assign(root.style, { position: "absolute", left: "-40000px", top: "0px", width: `${width}px`, minHeight: "0px", zoom: "1", pointerEvents: "none" });
  // A screen fills its window and scrolls inside it; copied, it's drawn whole, as tall as what's in it.
  if (target.dataset.exportHeight === "auto") root.style.height = "auto";
  root.style.setProperty("--bd-page", `${width}px`);
  if (gutter !== null) root.style.setProperty("--bd-gutter", `${gutter}px`);
  root.setAttribute("aria-hidden", "true");
  doc.body.appendChild(root);
  void root.offsetHeight;

  // Freeze animations at rest: layout and entrance transforms (translate, scale) would export mid-flight.
  // A number's reels (data-reel) are the exception: their shift is what shows each digit, not motion.
  root.querySelectorAll<HTMLElement>("[style*='transform']").forEach((el) => {
    if (el.hasAttribute("data-reel")) return;
    if (/translate|scale|matrix/.test(el.style.transform)) el.style.transform = "none";
  });
  void root.offsetHeight;

  const live = [...target.querySelectorAll("canvas")];
  const copies = [...root.querySelectorAll("canvas")];
  copies.forEach((c, i) => live[i] && copyCanvas(live[i], c));

  const imgs = [...root.querySelectorAll("img")];
  imgs.forEach((img) => (img.loading = "eager"));
  await Promise.race([Promise.all(imgs.map((img) => img.decode().catch(() => undefined))), new Promise((r) => setTimeout(r, 2500))]);
  await readTiles(root);
  return { root, done: () => root.remove() };
}

/** The target as one SVG, for Download SVG. */
export async function figmaSvgFor(target: HTMLElement, name: string) {
  const f = await exportFrame(target);
  try {
    return toFigmaSvg(f.root, name);
  } finally {
    f.done();
  }
}

/**
 * "Copy for Figma" from one offscreen layout: Figma's own clipboard scene (auto layout,
 * components, named layers) as HTML, and the SVG as plain text for any other app.
 */
export function figmaCopyFor(target: HTMLElement, name: string) {
  const work = (async () => {
    let svg = "";
    const views: Array<{ name: string; tree: ReturnType<typeof toFigmaTree> }> = [];
    // One layout per viewport: the sections' container queries pick the tablet and phone layouts by themselves.
    for (const v of VIEWPORTS) {
      const f = await exportFrame(target, v);
      try {
        if (!svg) svg = toFigmaSvg(f.root, name);
        views.push({ name: v.name, tree: toFigmaTree(f.root, name) });
      } finally {
        f.done();
      }
    }
    return { svg, views };
  })();
  return {
    html: Promise.all([work, import("./figma-clipboard")]).then(([w, m]) => m.figmaClipboardHtml(w.views)),
    svg: work.then((w) => w.svg),
  };
}

/**
 * Paper's copy of the same views Figma gets: each width its own named frame, the widths side by
 * side and each state its own row under the first, spaced as Figma spaces its variants.
 */
export function paperFrames(name: string, views: Array<{ state?: string; html: string }>) {
  const states = [...new Set(views.map((v) => v.state))];
  const row = (state: string | undefined, label: string) =>
    `<div layer-name="${esc(label)}" style="display: flex; gap: 80px; align-items: flex-start">${views
      .filter((v) => v.state === state)
      .map((v) => v.html)
      .join("")}</div>`;
  if (states.length === 1) return row(states[0], name);
  return `<div layer-name="${esc(name)}" style="display: flex; flex-direction: column; gap: 80px; align-items: flex-start">${states.map((s) => row(s, s ?? name)).join("")}</div>`;
}

/** "Copy for Paper": desktop, tablet and phone, each laid out at its own width as Figma's are. */
export async function paperCopyFor(target: HTMLElement, name: string) {
  const views: Array<{ html: string }> = [];
  for (const v of VIEWPORTS) {
    const f = await exportFrame(target, v);
    try {
      views.push({ html: toPaperHtml(f.root, v.name) });
    } finally {
      f.done();
    }
  }
  return paperFrames(name, views);
}

/**
 * Copies for Figma and for Paper from live layouts: for a piece that lays itself out in script as
 * well as in CSS (a screen's sidebar folds to its rail, its charts size themselves), a copy of
 * what's on screen can't lay itself out again at another width. So each viewport is drawn live at
 * its own width first (all at once), then read the same way as any other copy, once for both tools.
 */
export function designCopyDrawn(draw: (width: number, state?: string) => Promise<{ el: HTMLElement; done: () => void; missing?: boolean }>, name: string, states?: string[]) {
  const work = (async () => {
    // Every state at every width, drawn at once; a piece without states is drawn once per width.
    const jobs = (states?.length ? states : [undefined]).flatMap((state) => VIEWPORTS.map((v) => ({ v, state })));
    const drawn = await Promise.all(jobs.map((j) => draw(j.v.width, j.state)));
    try {
      let svg = "";
      const views: Array<{ name: string; state?: string; tree: ReturnType<typeof toFigmaTree> }> = [];
      const paper: Array<{ state?: string; html: string }> = [];
      for (const [i, j] of jobs.entries()) {
        // A state that isn't there at this width (its button only on a desk) is left out here.
        if (drawn[i].missing) continue;
        const f = await exportFrame(drawn[i].el, j.v);
        try {
          if (!svg) svg = toFigmaSvg(f.root, name);
          views.push({ name: j.v.name, state: j.state, tree: toFigmaTree(f.root, name) });
          paper.push({ state: j.state, html: toPaperHtml(f.root, j.v.name) });
        } finally {
          f.done();
        }
      }
      return { svg, views, paper: paperFrames(name, paper) };
    } finally {
      drawn.forEach((d) => d.done());
    }
  })();
  return {
    html: Promise.all([work, import("./figma-clipboard")]).then(([w, m]) => m.figmaClipboardHtml(w.views)),
    svg: work.then((w) => w.svg),
    paper: work.then((w) => w.paper),
  };
}

/** Writes exact strings through a copy event, the way Figma itself copies. Needs the click's activation to still be live. */
function copyExact(types: Record<string, string>) {
  if (navigator.userActivation && !navigator.userActivation.isActive) return false;
  let wrote = false;
  const on = (e: ClipboardEvent) => {
    if (!e.clipboardData) return;
    for (const [t, v] of Object.entries(types)) e.clipboardData.setData(t, v);
    e.preventDefault();
    e.stopImmediatePropagation();
    wrote = true;
  };
  document.addEventListener("copy", on, true);
  try {
    document.execCommand("copy");
  } catch {
    /* not allowed here: the async write stands */
  } finally {
    document.removeEventListener("copy", on, true);
  }
  return wrote;
}

/**
 * Starts the clipboard write inside the click (Safari needs the gesture), filled in once the export resolves.
 * `exact`: the async API sanitises HTML (Chrome escapes "<" inside attributes, which hides Figma's
 * markers), so where the browser still allows it the same payload is written again byte for byte.
 */
export async function writeClipboard(types: Record<string, Promise<string>>, { exact = false } = {}) {
  const entries = Object.entries(types);
  let failure: unknown = null;
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      const item = new ClipboardItem(Object.fromEntries(entries.map(([t, text]) => [t, text.then((s) => new Blob([s], { type: t }))])));
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(await entries[0][1]);
    }
  } catch (e) {
    failure = e;
  }
  if (exact || failure) {
    const resolved = Object.fromEntries(await Promise.all(entries.map(async ([t, p]) => [t, await p] as const)));
    if (copyExact(resolved)) return;
  }
  if (failure) throw failure;
}

export function downloadFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
