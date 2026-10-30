/*
 * "Copy for Figma" with no plugin. Figma copies layers to the clipboard as a small HTML
 * wrapper around its own scene format (kiwi, the binary format Figma is built on), and reads
 * that same format back on paste. Writing it here means a plain Cmd V in any Figma file gives:
 *   - auto layout frames with the page's gaps, padding, alignment and sizing (no groups)
 *   - one text layer per text block, with colored and weighted ranges, drawn on arrival
 *   - icons and logos as vectors you can recolor; photos, canvases and charts as image fills
 *   - every viewport at once: a section as a component set with Desktop, Tablet and Mobile variants,
 *     a page as a frame per viewport built from instances of those variants
 *   - layers named for what they are: Button, Card, Actions, Copy, Grid, Row, Stack
 */
import { compileSchema, decodeBinarySchema } from "kiwi-schema";
import { bounds, boxGeometry, pathBlob, subsToCmds, svgShapes, vectorNetwork, type Sub } from "./figma-geometry";
import type { FEffect, FGradient, FPattern } from "./figma-paint";
import { FIGMA_ARCHIVE_VERSION, FIGMA_SCHEMA } from "./figma-schema";
import { derivedText } from "./figma-text";
import type { FFrame, FImage, FNode, FSvg, FText, RGBA } from "./figma-tree";

type GUID = { sessionID: number; localID: number };
type Node = Record<string, unknown> & { guid: GUID };
type Paint = Record<string, unknown>;

const DOCUMENT: GUID = { sessionID: 0, localID: 0 };
const CANVAS: GUID = { sessionID: 0, localID: 1 };
const SESSION = 1;
const FILE_KEY = "basedraftsite00000000";

/* ---------- binary helpers ---------- */

const bytesOfBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

function base64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** "fig-kiwi", a version, then length-prefixed chunks: the schema, then the message. */
function archive(chunks: Uint8Array[]) {
  const size = 12 + chunks.reduce((n, c) => n + 4 + c.length, 0);
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  out.set(new TextEncoder().encode("fig-kiwi"), 0);
  view.setUint32(8, FIGMA_ARCHIVE_VERSION, true);
  let o = 12;
  for (const c of chunks) {
    view.setUint32(o, c.length, true);
    out.set(c, o + 4);
    o += 4 + c.length;
  }
  return out;
}

let compiled: Promise<{ kiwi: { encodeMessage: (m: unknown) => Uint8Array }; schema: Uint8Array }> | null = null;
function codec() {
  compiled ??= (async () => {
    const schema = bytesOfBase64(FIGMA_SCHEMA);
    const raw = await pipe(schema, new DecompressionStream("deflate-raw"));
    // Keep the compiled object whole: its encoders call each other through `this`.
    return { kiwi: compileSchema(decodeBinarySchema(raw)), schema };
  })();
  return compiled;
}

/* ---------- layer names ---------- */

const isButton = (n: FFrame) => Boolean(n.fill || n.stroke) && n.h <= 64 && n.layout?.mode === "H" && n.children.length <= 3 && n.children.some((c) => c.t === "text");

/** Generic boxes get named for what they hold, so the layers panel reads like a designer built it. */
export function nameLayers(n: FNode) {
  if (n.t !== "frame") return;
  n.children.forEach(nameLayers);
  if (n.component || (n.name !== "Frame" && n.name !== "Link")) return;
  const kids = n.children;
  if (isButton(n)) n.name = "Button";
  else if (n.name === "Link") return;
  else if (kids.length === 1 && kids[0].t === "svg") n.name = "Icon";
  else if (!kids.length) n.name = !n.fill && !n.stroke ? "Spacer" : n.h <= 2 || n.w <= 2 ? "Divider" : "Shape";
  else if (kids.every((k) => k.t === "frame" && (k.name === "Button" || k.name === "Link"))) n.name = "Actions";
  else if (n.fill || n.stroke) n.name = "Card";
  else if (n.layout?.mode === "V" && kids.every((k) => k.t === "text")) n.name = "Copy";
  else if (n.layout?.mode === "V" && kids.some((k) => k.t === "text") && kids.some((k) => k.t === "frame" && (k.name === "Actions" || k.name === "Button"))) n.name = "Content";
  else if (n.layout?.wrap || (kids.length >= 3 && kids.every((k) => k.t === kids[0].t && k.name === kids[0].name))) n.name = n.layout?.mode === "V" ? "List" : "Grid";
  else n.name = n.layout ? (n.layout.mode === "H" ? "Row" : "Stack") : "Frame";
}

/* ---------- paints and shapes ---------- */

const at = (x: number, y: number) => ({ m00: 1, m01: 0, m02: x, m10: 0, m11: 1, m12: y });
const solid = (c: RGBA): Paint => ({ type: "SOLID", color: { r: c.r, g: c.g, b: c.b, a: 1 }, opacity: c.a, visible: true, blendMode: "NORMAL" });

/** A gradient fill: its stops, and the transform from the layer's unit square onto the gradient. */
const gradient = (g: FGradient): Paint => {
  const [m00, m01, m02, m10, m11, m12] = g.transform;
  return { type: `GRADIENT_${g.type}`, opacity: 1, visible: true, blendMode: "NORMAL", transform: { m00, m01, m02, m10, m11, m12 }, stops: g.stops.map((s) => ({ color: s.color, position: s.at })) };
};

/** Shadows and blurs as Figma effects. */
const effects = (list: FEffect[] | undefined) =>
  list?.length
    ? {
        effects: list.map((e) =>
          e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"
            ? { type: e.type, color: e.color, offset: { x: e.x ?? 0, y: e.y ?? 0 }, radius: e.radius, spread: e.spread ?? 0, visible: true, blendMode: "NORMAL", showShadowBehindNode: false }
            : { type: e.type, radius: e.radius, visible: true, blendMode: "NORMAL" },
        ),
      }
    : {};

/** A box's paints, bottom first as Figma stacks them: the color, then the gradients CSS lists top first. */
const fills = (fill: RGBA | null, gradients: FGradient[] | undefined): Paint[] => [...(fill ? [solid(fill)] : []), ...(gradients ?? []).slice().reverse().map(gradient)];

function corners(r: [number, number, number, number], w: number, h: number) {
  const [tl, tr, br, bl] = r.map((v) => Math.min(v, Math.min(w, h) / 2));
  if (!tl && !tr && !br && !bl) return {};
  return {
    cornerRadius: tl,
    rectangleTopLeftCornerRadius: tl,
    rectangleTopRightCornerRadius: tr,
    rectangleBottomRightCornerRadius: br,
    rectangleBottomLeftCornerRadius: bl,
    rectangleCornerRadiiIndependent: !(tl === tr && tr === br && br === bl),
  };
}

function stroke(n: FFrame) {
  if (!n.stroke) return {};
  const [t, r, b, l] = n.stroke.w;
  const uniform = t === r && r === b && b === l;
  return {
    strokePaints: [solid(n.stroke.c)],
    strokeAlign: n.stroke.outside ? "OUTSIDE" : "INSIDE",
    strokeWeight: Math.max(t, r, b, l),
    ...(uniform ? {} : { borderStrokeWeightsIndependent: true, borderTopWeight: t, borderRightWeight: r, borderBottomWeight: b, borderLeftWeight: l }),
  };
}

/* ---------- fonts ---------- */

const WEIGHT_STYLE: Record<number, string> = { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" };
/** Families whose Figma style names are spaced ("Semi Bold"); Google fonts like Geist use "SemiBold". */
const SPACED = new Set(["Inter", "SF Pro", "SF Pro Display", "SF Pro Text"]);

function fontName(family: string, weight: number, italic: boolean) {
  const w = Math.min(900, Math.max(100, Math.round(weight / 100) * 100));
  let style = WEIGHT_STYLE[w];
  if (SPACED.has(family)) style = style.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (italic) style = w === 400 ? "Italic" : `${style} Italic`;
  return { family, style, postscript: "" };
}

/* ---------- the scene ---------- */

class Scene {
  nodes: Node[] = [];
  blobs: Array<{ bytes: Uint8Array }> = [];
  private images = new Map<string, Paint>();
  private keyed = new Map<string, number>();
  private next = 2;

  /** Stores bytes in the message's blobs; nodes point at them by index. */
  blob(bytes: Uint8Array) {
    return this.blobs.push({ bytes }) - 1;
  }

  /** The same bytes once, however many layers use them (a glyph, a common outline). */
  shared(key: string, make: () => Uint8Array) {
    let i = this.keyed.get(key);
    if (i === undefined) this.keyed.set(key, (i = this.blob(make())));
    return i;
  }

  /** Fill and stroke outlines Figma draws a box from. */
  geometry(w: number, h: number, radius: number[], stroke?: [number, number, number, number], outside = false) {
    const g = boxGeometry(w, h, radius, stroke, outside);
    const key = `box|${w}|${h}|${radius.join(",")}`;
    return {
      fillGeometry: [{ windingRule: "NONZERO", commandsBlob: this.shared(key, () => pathBlob(g.fill)), styleID: 0 }],
      ...(g.stroke ? { strokeGeometry: [{ windingRule: g.stroke.rule, commandsBlob: this.blob(pathBlob(g.stroke.cmds)), styleID: 0 }] } : {}),
    };
  }

  guid(): GUID {
    return { sessionID: SESSION, localID: this.next++ };
  }

  add(n: Node) {
    this.nodes.push(n);
    return n;
  }

  /** An image fill. Bytes ride along in the message's blobs, keyed by their SHA-1 like Figma's own. */
  async image(bytes: Uint8Array, fit: "FILL" | "FIT" | "TILE"): Promise<Paint> {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", bytes as BufferSource));
    const key = `${base64(hash)}|${fit}`;
    const seen = this.images.get(key);
    if (seen) return seen;
    const bmp = await createImageBitmap(new Blob([bytes as BlobPart]));
    const dataBlob = this.blob(bytes);
    const paint: Paint = {
      type: "IMAGE",
      opacity: 1,
      visible: true,
      blendMode: "NORMAL",
      transform: at(0, 0),
      image: { hash, name: "image", dataBlob },
      imageScaleMode: fit,
      imageShouldColorManage: false,
      rotation: 0,
      scale: 0.5,
      originalImageWidth: bmp.width,
      originalImageHeight: bmp.height,
    };
    bmp.close();
    this.images.set(key, paint);
    return paint;
  }
}

/** Figma orders siblings by these strings; ascending is the auto layout flow. */
const position = (i: number) => String.fromCharCode(33 + Math.floor(i / 92)) + String.fromCharCode(34 + (i % 92));

/** How a child sits in its auto layout parent: fill on the main axis grows, fill across stretches. */
function inParent(c: FNode, parent: FFrame | null) {
  if (!parent?.layout) return {};
  if (c.abs) return { stackPositioning: "ABSOLUTE", ...(c.stretch?.h ? { horizontalConstraint: "STRETCH" } : {}), ...(c.stretch?.v ? { verticalConstraint: "STRETCH" } : {}) };
  const h = parent.layout.mode === "H";
  return {
    ...((h ? c.sizeH : c.sizeV) === "FILL" ? { stackChildPrimaryGrow: 1 } : {}),
    ...((h ? c.sizeV : c.sizeH) === "FILL" ? { stackChildAlignSelf: "STRETCH" } : {}),
  };
}

/** Where a layer sits: its top left corner, turned by its rotation. */
function place(n: FNode) {
  if (!n.rotation) return at(n.x, n.y);
  const r = (n.rotation * Math.PI) / 180;
  return { m00: Math.cos(r), m01: -Math.sin(r), m02: n.x, m10: Math.sin(r), m11: Math.cos(r), m12: n.y };
}

function base(s: Scene, n: FNode, parent: GUID, i: number, type: string) {
  return {
    guid: s.guid(),
    phase: "CREATED",
    parentIndex: { guid: parent, position: position(i) },
    type,
    name: n.name,
    visible: true,
    opacity: n.opacity ?? 1,
    size: { x: Math.max(1, n.w), y: Math.max(1, n.h) },
    transform: place(n),
    ...effects(n.effects),
  };
}

async function text(s: Scene, n: FText, parent: GUID, i: number, holder: FFrame | null) {
  const wraps = n.wrap || n.boxed || n.sizeH === "FILL";
  // Figma measures text itself; a hair of slack keeps a fixed-width line from wrapping early.
  const w = wraps && n.sizeH !== "FILL" ? n.w + 2 : n.w;
  const styles: Array<{ color?: RGBA; weight?: number }> = [];
  const ids = new Array<number>(n.chars.length).fill(0);
  for (const r of n.ranges) {
    if (r.e <= r.s) continue;
    let id = styles.findIndex((x) => JSON.stringify(x) === JSON.stringify({ color: r.color, weight: r.weight }));
    if (id < 0) id = styles.push({ color: r.color, weight: r.weight }) - 1;
    for (let k = r.s; k < r.e; k++) ids[k] = id + 1;
  }
  const derivedTextData = await derivedText(n, w, ids, styles, (key, make) => s.shared(key, make), (weight) => fontName(n.family, weight, n.italic));
  s.add({
    ...base(s, { ...n, w }, parent, i, "TEXT"),
    ...inParent(n, holder),
    autoRename: true,
    fontSize: Math.max(1, n.size),
    fontName: fontName(n.family, n.weight, n.italic),
    textAlignHorizontal: n.align,
    textAlignVertical: "TOP",
    lineHeight: { value: n.lh, units: "PIXELS" },
    letterSpacing: { value: n.ls || 0, units: "PIXELS" },
    textAutoResize: wraps ? "HEIGHT" : "WIDTH_AND_HEIGHT",
    fillPaints: n.gradient ? [gradient(n.gradient)] : [solid(n.color)],
    textData: {
      characters: n.chars,
      ...(styles.length
        ? {
            characterStyleIDs: ids,
            styleOverrideTable: styles.map((st, k) => ({
              styleID: k + 1,
              ...(st.color ? { fillPaints: [solid(st.color)] } : {}),
              ...(st.weight ? { fontName: fontName(n.family, st.weight, n.italic) } : {}),
            })),
          }
        : {}),
      lines: n.chars.split("\n").map(() => ({ lineType: "PLAIN", styleId: 0, indentationLevel: 0, sourceDirectionality: "AUTO", listStartOffset: 0, isFirstLineOfList: false })),
    },
    ...(derivedTextData ? { derivedTextData } : {}),
    textUserLayoutVersion: 4,
    textBidiVersion: 1,
  });
}

async function srcBytes(src: string) {
  const res = await fetch(src);
  return new Uint8Array(await res.arrayBuffer());
}

/** Icons go in as crisp 4x images: they keep their exact drawing at any zoom you'll design at. */
async function svgBytes(svg: string, w: number, h: number) {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * 4));
  c.height = Math.max(1, Math.round(h * 4));
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}

/** An icon, logo or chart as vectors inside an "Icon" frame: fills, gradients and strokes stay editable in Figma. */
function vectors(s: Scene, n: FSvg, parent: GUID, i: number, holder: FFrame | null) {
  const shapes = svgShapes(n.svg, n.w, n.h);
  if (!shapes) return false;
  const frameNode = s.add({
    ...base(s, n, parent, i, "FRAME"),
    ...inParent(n, holder),
    fillPaints: [],
    frameMaskDisabled: false,
    ...s.geometry(n.w, n.h, [0, 0, 0, 0]),
  });
  shapes.forEach((shape, k) => {
    const paints = shape.gradient ? [gradient(shape.gradient)] : shape.fill ? [solid(shape.fill)] : [];
    // SVG fills an open path as if it were closed; Figma fills only closed loops.
    const subs = paints.length && !shape.stroke ? shape.subs.map((q) => ({ ...q, closed: true })) : shape.subs;
    const b = bounds(subs);
    const rule = shape.evenOdd ? "ODD" : "NONZERO";
    const st = shape.stroke;
    s.add({
      guid: s.guid(),
      phase: "CREATED",
      parentIndex: { guid: frameNode.guid, position: position(k) },
      type: "VECTOR",
      name: shapes.length > 1 ? `Vector ${k + 1}` : "Vector",
      visible: true,
      opacity: shape.opacity,
      size: { x: b.w, y: b.h },
      transform: at(b.x, b.y),
      fillPaints: paints,
      ...(st
        ? {
            strokePaints: [solid(st.color)],
            strokeWeight: st.width,
            strokeAlign: "CENTER",
            strokeCap: st.cap,
            strokeJoin: st.join,
            miterLimit: st.miter,
            ...(st.dash.length ? { dashPattern: st.dash } : {}),
            strokeGeometry: [{ windingRule: "NONZERO", commandsBlob: s.blob(pathBlob(subsToCmds(st.outline, b.x, b.y))), styleID: 0 }],
          }
        : { strokeWeight: 0, strokeAlign: "CENTER" }),
      vectorData: { vectorNetworkBlob: s.blob(vectorNetwork(subs, b.x, b.y, shape.evenOdd)), normalizedSize: { x: b.w, y: b.h } },
      fillGeometry: paints.length ? [{ windingRule: rule, commandsBlob: s.blob(pathBlob(subsToCmds(subs, b.x, b.y))), styleID: 0 }] : [],
    });
  });
  return true;
}

/** Squares (x, y, w, h each) as one vector, in a given color: a dither's dots, a texture's grain. */
function squares(s: Scene, rects: number[], color: RGBA, parent: GUID, i: number, name: string, absolute: boolean) {
  const subs: Sub[] = [];
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let k = 0; k < rects.length; k += 4) {
    const [x, y, w, h] = [rects[k], rects[k + 1], rects[k + 2], rects[k + 3]];
    subs.push({ start: [x, y], segs: [{ to: [x + w, y] }, { to: [x + w, y + h] }, { to: [x, y + h] }, { to: [x, y] }], closed: true });
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x + w), Math.max(y1, y + h)];
  }
  if (!subs.length) return;
  const [w, h] = [x1 - x0, y1 - y0];
  s.add({
    guid: s.guid(),
    phase: "CREATED",
    parentIndex: { guid: parent, position: position(i) },
    type: "VECTOR",
    name,
    visible: true,
    opacity: 1,
    size: { x: w, y: h },
    transform: at(x0, y0),
    fillPaints: [solid(color)],
    strokeWeight: 0,
    strokeAlign: "CENTER",
    ...(absolute ? { stackPositioning: "ABSOLUTE" } : {}),
    vectorData: { vectorNetworkBlob: s.blob(vectorNetwork(subs, x0, y0, false)), normalizedSize: { x: w, y: h } },
    fillGeometry: [{ windingRule: "NONZERO", commandsBlob: s.blob(pathBlob(subsToCmds(subs, x0, y0))), styleID: 0 }],
  });
}

/** A polygon (clip-path) as one closed vector. */
function polygon(s: Scene, pts: Array<[number, number]>, parent: GUID, i: number, name: string, extra: Record<string, unknown>) {
  const sub: Sub = { start: pts[0], segs: [...pts.slice(1), pts[0]].map((to) => ({ to })), closed: true };
  const b = bounds([sub]);
  s.add({
    guid: s.guid(),
    phase: "CREATED",
    parentIndex: { guid: parent, position: position(i) },
    type: "VECTOR",
    name,
    visible: true,
    opacity: 1,
    size: { x: b.w, y: b.h },
    transform: at(b.x, b.y),
    strokeWeight: 0,
    strokeAlign: "CENTER",
    vectorData: { vectorNetworkBlob: s.blob(vectorNetwork([sub], b.x, b.y, false)), normalizedSize: { x: b.w, y: b.h } },
    fillGeometry: [{ windingRule: "NONZERO", commandsBlob: s.blob(pathBlob(subsToCmds([sub], b.x, b.y))), styleID: 0 }],
    ...extra,
  });
}

/**
 * What a box draws under its content: for a clip-path shape, the shape as a mask and then filled
 * with the box's paint; then its dither textures, as vector dots or the tile repeated.
 */
async function textures(s: Scene, n: FFrame, guid: GUID) {
  const list: FPattern[] = n.patterns ?? [];
  const abs = n.layout ? { stackPositioning: "ABSOLUTE" } : {};
  let at0 = 0;
  if (n.shape) {
    polygon(s, n.shape, guid, at0++, "Clip", { mask: true, maskType: "ALPHA", fillPaints: [solid({ r: 0, g: 0, b: 0, a: 1 })], ...abs });
    const paints = fills(n.fill, n.gradients);
    if (paints.length) polygon(s, n.shape, guid, at0++, "Shape", { fillPaints: paints, ...abs });
  }
  for (const [j, p] of list.entries()) {
    const k = at0 + j;
    const name = list.length > 1 ? `Texture ${j + 1}` : "Texture";
    if (p.rects) {
      squares(s, p.rects, p.color, guid, k, name, Boolean(n.layout));
      continue;
    }
    if (!p.tile) continue;
    const bytes = await srcBytes(p.tile.src);
    const paint = await s.image(bytes, "TILE");
    const natural = Number(paint.originalImageWidth) || p.tile.w * 8;
    s.add({
      guid: s.guid(),
      phase: "CREATED",
      parentIndex: { guid, position: position(k) },
      type: "ROUNDED_RECTANGLE",
      name,
      visible: true,
      opacity: 1,
      size: { x: n.w, y: n.h },
      transform: at(0, 0),
      ...(n.layout ? { stackPositioning: "ABSOLUTE" } : {}),
      fillPaints: [{ ...paint, scale: p.tile.w / natural }],
      ...s.geometry(n.w, n.h, [0, 0, 0, 0]),
    });
  }
  return at0 + list.length;
}

/**
 * A dither in Figma: per ink, its dots as an alpha mask under a flat "Dither color" layer.
 * Change that layer's fill to recolor the dither; the dot pattern stays exactly as drawn.
 */
async function dither(s: Scene, n: FImage, parent: GUID, i: number, holder: FFrame | null) {
  const tints = n.tints!;
  const masks: Paint[] = [];
  for (const t of tints) masks.push(await s.image(await srcBytes(t.mask), "FILL"));
  const box = s.add({
    ...base(s, n, parent, i, "FRAME"),
    ...inParent(n, holder),
    fillPaints: [],
    frameMaskDisabled: false,
    ...corners(n.radius, n.w, n.h),
    ...s.geometry(n.w, n.h, n.radius),
  });
  const layer = (parentGuid: GUID, k: number, name: string, extra: Record<string, unknown>) =>
    s.add({ guid: s.guid(), phase: "CREATED", parentIndex: { guid: parentGuid, position: position(k) }, type: "ROUNDED_RECTANGLE", name, visible: true, opacity: 1, size: { x: n.w, y: n.h }, transform: at(0, 0), ...s.geometry(n.w, n.h, [0, 0, 0, 0]), ...extra });
  tints.forEach((t, k) => {
    const ink = s.add({ guid: s.guid(), phase: "CREATED", parentIndex: { guid: box.guid, position: position(k) }, type: "FRAME", name: tints.length > 1 ? `Ink ${k + 1}` : "Ink", visible: true, opacity: 1, size: { x: n.w, y: n.h }, transform: at(0, 0), fillPaints: [], frameMaskDisabled: true, ...s.geometry(n.w, n.h, [0, 0, 0, 0]) });
    layer(ink.guid, 0, "Dots", { fillPaints: [masks[k]], mask: true, maskType: "ALPHA" });
    layer(ink.guid, 1, "Dither color", { fillPaints: [solid(t.color)] });
  });
}

/** A canvas dither as vectors: the color behind it, then each ink's dots, inside a "Dither" frame. */
function dots(s: Scene, n: FImage, parent: GUID, i: number, holder: FFrame | null) {
  const d = n.dots!;
  const box = s.add({
    ...base(s, n, parent, i, "FRAME"),
    ...inParent(n, holder),
    fillPaints: d.base ? [solid(d.base)] : [],
    frameMaskDisabled: false,
    ...corners(n.radius, n.w, n.h),
    ...s.geometry(n.w, n.h, n.radius),
  });
  d.inks.forEach((ink, k) => squares(s, ink.rects, ink.color, box.guid, k, d.inks.length > 1 ? `Ink ${k + 1}` : "Ink", false));
}

async function picture(s: Scene, n: FImage | FSvg, parent: GUID, i: number, holder: FFrame | null) {
  if (n.t === "svg" && vectors(s, n, parent, i, holder)) return;
  if (n.t === "image" && n.dots) return dots(s, n, parent, i, holder);
  if (n.t === "image" && n.tints?.length) return dither(s, n, parent, i, holder);
  let fill: Paint;
  try {
    const bytes = n.t === "image" ? await srcBytes(n.src) : await svgBytes(n.svg, n.w, n.h);
    fill = bytes ? await s.image(bytes, n.t === "image" ? n.fit : "FIT") : solid({ r: 0.93, g: 0.93, b: 0.93, a: 1 });
  } catch {
    fill = solid({ r: 0.93, g: 0.93, b: 0.93, a: 1 });
  }
  s.add({
    ...base(s, n, parent, i, "ROUNDED_RECTANGLE"),
    ...inParent(n, holder),
    ...(n.t === "image" ? corners(n.radius, n.w, n.h) : {}),
    fillPaints: [fill],
    ...s.geometry(n.w, n.h, n.t === "image" ? n.radius : [0, 0, 0, 0]),
  });
}

/** The frame-level fields a frame, a main component and its instances all share. */
function frameProps(s: Scene, n: FFrame, own: { sizeH: FFrame["sizeH"]; sizeV: FFrame["sizeV"] }) {
  const L = n.layout;
  const out: Record<string, unknown> = {
    // A clip-path shape draws the paint itself, inside the frame.
    fillPaints: n.shape ? [] : fills(n.fill, n.gradients),
    ...stroke(n),
    ...corners(n.radius, n.w, n.h),
    frameMaskDisabled: !n.clip,
    ...s.geometry(n.w, n.h, n.radius, n.stroke?.w, n.stroke?.outside),
  };
  if (!L) return out;
  const h = L.mode === "H";
  const wrap = Boolean(L.wrap && h);
  // Figma can't hug a wrapping row's width, and a filled side is sized by the parent.
  const hugMain = (h ? own.sizeH : own.sizeV) === "HUG" && !wrap;
  const hugCross = (h ? own.sizeV : own.sizeH) === "HUG";
  Object.assign(out, {
    stackMode: h ? "HORIZONTAL" : "VERTICAL",
    stackSpacing: L.gap || 0,
    stackVerticalPadding: L.pad[0],
    stackPaddingRight: L.pad[1],
    stackPaddingBottom: L.pad[2],
    stackHorizontalPadding: L.pad[3],
    stackPrimaryAlignItems: L.main,
    stackCounterAlignItems: L.cross === "BASELINE" && !h ? "MIN" : L.cross,
    stackPrimarySizing: hugMain ? "RESIZE_TO_FIT_WITH_IMPLICIT_SIZE" : "FIXED",
    stackCounterSizing: hugCross ? "RESIZE_TO_FIT_WITH_IMPLICIT_SIZE" : "FIXED",
    ...(wrap ? { stackWrap: "WRAP", stackCounterSpacing: L.counterGap ?? 0 } : {}),
  });
  return out;
}

async function frame(s: Scene, n: FFrame, parent: GUID, i: number, holder: FFrame | null, type = "FRAME", extra: Record<string, unknown> = {}) {
  const own = type === "SYMBOL" ? { sizeH: "FIXED" as const, sizeV: n.layout ? ("HUG" as const) : ("FIXED" as const) } : n;
  const node = s.add({
    ...base(s, n, parent, i, type),
    ...(type === "SYMBOL" ? {} : inParent(n, holder)),
    ...frameProps(s, n, own),
    ...extra,
  });
  await children(s, n, node.guid, await textures(s, n, node.guid));
  return node;
}

async function children(s: Scene, n: FFrame, guid: GUID, from = 0) {
  let k = from;
  for (const c of n.children) {
    if (c.t === "text") await text(s, c, guid, k++, n);
    else if (c.t === "frame") await frame(s, c, guid, k++, n);
    else await picture(s, c, guid, k++, n);
  }
}

/* ---------- sections, components and instances ---------- */

function sectionsOf(root: FFrame) {
  const out: FFrame[] = [];
  (function walk(n: FNode, depth: number) {
    if (n.t !== "frame") return;
    if (n.component) return void out.push(n);
    if (depth < 4) n.children.forEach((c) => walk(c, depth + 1));
  })(root, 0);
  return out;
}

const MAIN_ONLY = new Set(["guid", "parentIndex", "type", "transform", "isSymbolPublishable", "symbolDescription", "variantPropSpecs", "name"]);
const description = (n: FFrame) => `basedraft ${n.component?.type.replace("/", " / ") ?? "section"}. Edit this main component and every instance follows.`;

async function mainComponent(s: Scene, n: FFrame, parent: GUID, i: number, x: number, y: number, pageFill: RGBA | null, extra: Record<string, unknown> = {}) {
  const from = s.nodes.length;
  const main = await frame(s, { ...n, x, y, fill: n.fill ?? pageFill, sizeH: "FIXED", sizeV: n.layout ? "HUG" : "FIXED" }, parent, i, null, "SYMBOL", {
    isSymbolPublishable: true,
    symbolDescription: description(n),
    ...extra,
  });
  return { main, layers: s.nodes.slice(from + 1) };
}

type View = { name: string; tree: FFrame; state?: string };

/**
 * A Figma component set: one variant per viewport, switched with a "Viewport" property (Desktop,
 * Tablet, Mobile) the way a designer would build it, laid side by side. When the copy brings a
 * piece's states too (what pressing its buttons shows), a "State" property joins it, and the
 * variants lie in a grid: a row per state, a column per viewport.
 */
async function componentSet(s: Scene, name: string, parts: Array<{ name: string; state?: string; n: FFrame }>, parent: GUID, i: number, x: number, y: number, pageFill: RGBA | null) {
  const PAD = 40;
  const GAP = 80;
  const viewports = [...new Set(parts.map((p) => p.name))];
  const states = [...new Set(parts.map((p) => p.state).filter((v): v is string => !!v))];
  const grid = states.length > 0;
  // Where each variant sits: in a grid, every column as wide as its widest and every row as tall as its tallest.
  const colW = viewports.map((v) => Math.max(...parts.filter((p) => p.name === v).map((p) => p.n.w)));
  const rowH = grid ? states.map((st) => Math.max(...parts.filter((p) => p.state === st).map((p) => p.n.h))) : [Math.max(...parts.map((p) => p.n.h))];
  const colX = colW.map((_, c) => PAD + colW.slice(0, c).reduce((t, v) => t + v + GAP, 0));
  const rowY = rowH.map((_, r) => PAD + rowH.slice(0, r).reduce((t, v) => t + v + GAP, 0));
  const w = grid ? PAD * 2 + colW.reduce((t, v) => t + v, 0) + GAP * (colW.length - 1) : PAD * 2 + parts.reduce((t, p) => t + p.n.w, 0) + GAP * (parts.length - 1);
  const h = PAD * 2 + rowH.reduce((t, v) => t + v, 0) + GAP * (rowH.length - 1);
  const prop = s.guid();
  const stateProp = s.guid();
  const set = s.add({
    guid: s.guid(),
    phase: "CREATED",
    parentIndex: { guid: parent, position: position(i) },
    type: "FRAME",
    name,
    visible: true,
    opacity: 1,
    size: { x: w, y: h },
    transform: at(x, y),
    isStateGroup: true,
    isPublishable: true,
    stateGroupPropertyValueOrders: [{ property: "Viewport", values: viewports }, ...(grid ? [{ property: "State", values: states }] : [])],
    componentPropDefs: [
      { id: prop, name: "Viewport", initialValue: { textValue: { characters: viewports[0] } }, sortPosition: "!", type: "VARIANT", preferredValues: { stringValues: [] } },
      ...(grid ? [{ id: stateProp, name: "State", initialValue: { textValue: { characters: states[0] } }, sortPosition: position(1), type: "VARIANT", preferredValues: { stringValues: [] } }] : []),
    ],
    fillPaints: [],
    // Figma draws a component set's dashed purple outline itself; this matches what it stores.
    strokePaints: [{ ...solid({ r: 0.592, g: 0.278, b: 1, a: 1 }), visible: false }],
    strokeWeight: 1,
    strokeAlign: "INSIDE",
    dashPattern: [10, 5],
    ...corners([5, 5, 5, 5], w, h),
    frameMaskDisabled: false,
    // A row of viewports lays itself out; a grid of states is placed by hand.
    ...(grid
      ? {}
      : {
          stackMode: "HORIZONTAL",
          stackSpacing: GAP,
          stackVerticalPadding: PAD,
          stackPaddingRight: PAD,
          stackPaddingBottom: PAD,
          stackHorizontalPadding: PAD,
          stackPrimarySizing: "RESIZE_TO_FIT_WITH_IMPLICIT_SIZE",
          stackCounterSizing: "RESIZE_TO_FIT_WITH_IMPLICIT_SIZE",
          stackCounterAlignItems: "MIN",
        }),
    ...s.geometry(w, h, [5, 5, 5, 5]),
  });
  const variants = [];
  let vx = PAD;
  for (const [k, p] of parts.entries()) {
    if (grid) {
      const at = { x: colX[viewports.indexOf(p.name)], y: rowY[states.indexOf(p.state ?? states[0])] };
      const specs = [
        { propDefId: prop, value: p.name },
        { propDefId: stateProp, value: p.state ?? states[0] },
      ];
      variants.push(await mainComponent(s, { ...p.n, name: `Viewport=${p.name}, State=${p.state ?? states[0]}` }, set.guid, k, at.x, at.y, pageFill, { variantPropSpecs: specs }));
    } else {
      variants.push(await mainComponent(s, { ...p.n, name: `Viewport=${p.name}` }, set.guid, k, vx, PAD, pageFill, { variantPropSpecs: [{ propDefId: prop, value: p.name }] }));
      vx += p.n.w + GAP;
    }
  }
  return { set, w, h, variants };
}

/** What an instance draws its layers from until Figma lays it out: each layer's outlines and text, by path. */
function derivedFor(layers: Node[]) {
  return layers
    .map((d) => ({
      guidPath: { guids: [d.guid] },
      ...(d.fillGeometry ? { fillGeometry: d.fillGeometry } : {}),
      ...(d.strokeGeometry ? { strokeGeometry: d.strokeGeometry } : {}),
      ...(d.derivedTextData ? { derivedTextData: d.derivedTextData, size: d.size, transform: d.transform } : {}),
    }))
    .filter((d) => Object.keys(d).length > 1);
}

/** Everything Figma needs for one paste, as a kiwi message. */
async function sceneFor(views: View[]) {
  const s = new Scene();
  s.add({ guid: DOCUMENT, phase: "CREATED", type: "DOCUMENT", name: "Document", visible: true, opacity: 1, transform: at(0, 0) });
  s.add({ guid: CANVAS, phase: "CREATED", parentIndex: { guid: DOCUMENT, position: "!" }, type: "CANVAS", name: "Page 1", visible: true, opacity: 1, transform: at(0, 0), backgroundColor: { r: 0.96, g: 0.96, b: 0.96, a: 1 }, backgroundOpacity: 1, backgroundEnabled: true });

  views.forEach((v) => nameLayers(v.tree));
  const name = views[0].tree.name;
  const pageFill = views[0].tree.fill;
  const sections = views.map((v) => sectionsOf(v.tree));
  const count = Math.min(...sections.map((l) => l.length));

  if (count <= 1) {
    // One section: a component set with a variant per viewport, ready for a design system.
    const parts = views.map((v, k) => ({ name: v.name, state: v.state, n: sections[k][0] ?? { ...v.tree, component: { key: `frame|${name}`, type: "frame" } } }));
    await componentSet(s, sections[0][0]?.name ?? name, parts, CANVAS, 0, 0, 0, pageFill);
    return { scene: s, made: 1, kind: "component" as const };
  }

  // A page: a frame per viewport, side by side, built from instances; the component sets on a section to the right.
  const GAP = 200;
  const xs: number[] = [];
  let right = 0;
  for (const v of views) {
    xs.push(right);
    right += v.tree.w + GAP;
  }
  const sets: Array<Awaited<ReturnType<typeof componentSet>>> = [];
  const holder = s.add({ guid: s.guid(), phase: "CREATED", parentIndex: { guid: CANVAS, position: position(views.length) }, type: "SECTION", name: `${name} components`, visible: true, opacity: 1, size: { x: 1, y: 1 }, transform: at(right + 200, 0), fillPaints: [solid({ r: 1, g: 1, b: 1, a: 1 })] });
  let y = 80;
  for (let i = 0; i < count; i++) {
    const set = await componentSet(s, sections[0][i].name, views.map((v, k) => ({ name: v.name, n: sections[k][i] })), holder.guid, i, 80, y, pageFill);
    sets.push(set);
    y += set.h + 120;
  }
  // The holder's size is known once its sets are laid out.
  const width = Math.max(...sets.map((x) => x.w)) + 160;
  Object.assign(holder, { size: { x: width, y: y - 40 }, ...s.geometry(width, y - 40, [0, 0, 0, 0]) });

  views.forEach((v, k) => {
    const h = sections[k].slice(0, count).reduce((t, n) => t + n.h, 0);
    const page = s.add({
      guid: s.guid(),
      phase: "CREATED",
      parentIndex: { guid: CANVAS, position: position(k) },
      type: "FRAME",
      name: `${name} / ${v.name}`,
      visible: true,
      opacity: 1,
      size: { x: v.tree.w, y: h },
      transform: at(xs[k], 0),
      fillPaints: pageFill ? [solid(pageFill)] : [],
      frameMaskDisabled: false,
      stackMode: "VERTICAL",
      stackSpacing: 0,
      stackPrimarySizing: "RESIZE_TO_FIT_WITH_IMPLICIT_SIZE",
      stackCounterSizing: "FIXED",
      ...s.geometry(v.tree.w, h, [0, 0, 0, 0]),
    });
    let top = 0;
    sets.forEach((set, i) => {
      const { main, layers } = set.variants[k];
      const n = sections[k][i];
      // An instance carries its main component's frame fields; Figma fills in its layers from the main.
      const shared = Object.fromEntries(Object.entries(main).filter(([key]) => !MAIN_ONLY.has(key)));
      s.add({
        ...shared,
        guid: s.guid(),
        parentIndex: { guid: page.guid, position: position(i) },
        type: "INSTANCE",
        name: sections[0][i].name,
        transform: at(0, top),
        symbolData: { symbolID: main.guid, symbolOverrides: [], uniformScaleFactor: 1 },
        derivedSymbolData: derivedFor(layers),
        derivedSymbolDataLayoutVersion: 1,
        stackChildAlignSelf: "STRETCH",
      });
      top += n.h;
    });
  });
  return { scene: s, made: count, kind: "page" as const };
}

async function encode(scene: Scene) {
  const { kiwi, schema } = await codec();
  const pasteID = Math.floor(Math.random() * 2 ** 30);
  const message = kiwi.encodeMessage({
    type: "NODE_CHANGES",
    sessionID: 0,
    ackID: 0,
    pasteID,
    pasteFileKey: FILE_KEY,
    pasteIsPartiallyOutsideEnclosingFrame: false,
    pastePageId: CANVAS,
    isCut: false,
    pasteEditorType: "DESIGN",
    nodeChanges: scene.nodes,
    blobs: scene.blobs,
  });
  const data = archive([schema, await pipe(message, new CompressionStream("deflate-raw"))]);
  const meta = btoa(JSON.stringify({ fileKey: FILE_KEY, pasteID, dataType: "scene" }));
  return `<meta charset="utf-8" /><meta charset="utf-8" /><span data-metadata="<!--(figmeta)${meta}(/figmeta)-->"></span><span data-buffer="<!--(figma)${base64(data)}(/figma)-->"></span><span style="white-space: pre-wrap"></span>`;
}

/** The HTML Figma writes to the clipboard, carrying the scene for every viewport's tree. */
export async function figmaClipboardHtml(views: View[]) {
  const { scene } = await sceneFor(views);
  return encode(scene);
}
