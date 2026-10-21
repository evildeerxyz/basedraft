"use client";

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pageHeight, pinViewportHeights } from "@/site/frame-fit";
import { composeUrl, liveUrl, sectionOf, type TemplateSlug } from "@/site/live";
import { addressOf, applyEdits, original, scopeRoot, setText, textsIn, type TextEdit } from "@/site/text-edits";
import { blocksOf } from "@/site/live-export";
import { applyTheme } from "@/site/theme";
import { idOf, type View } from "./state";

/*
 * Studio's canvas: the page at one breakpoint, at its real width and its full height, drawn by the
 * template's own code in a same-origin frame. A camera moves over the board; Studio never changes
 * what's inside except the text you edit. It reads where each section sits and draws outlines, the
 * selection's toolbar and the text editor over the top. Another breakpoint is another canvas:
 * Studio opens a fresh one for it.
 *
 * Panning and zooming move one layer on the GPU, every frame, without touching React or the page
 * inside. Only once a zoom comes to rest is the page drawn again at the new size, sharp.
 */

export type CanvasDevice = "desktop" | "tablet" | "phone";
export const CANVAS_WIDTH: Record<CanvasDevice, number> = { desktop: 1440, tablet: 820, phone: 390 };
/** The window each breakpoint is laid out for: what 100vh means on it. */
export const CANVAS_HEIGHT: Record<CanvasDevice, number> = { desktop: 900, tablet: 1180, phone: 844 };
export const DEVICE_LABEL: Record<CanvasDevice, string> = { desktop: "Desktop", tablet: "Tablet", phone: "Phone" };

/** A top-level block of a template page, for its layers. */
export interface Block {
  key: string;
  name: string;
}

/** A headline set word by word, rewritten as one line: its words handed back to their places in order, the rest in the last. */
const spread = (v: string, n: number) => {
  const words = v.trim().split(/\s+/).filter(Boolean);
  return Array.from({ length: n }, (_, i) => (i < n - 1 ? (words[i] ?? "") : words.slice(n - 1).join(" ")));
};

export interface CanvasHandle {
  /** The same words in the decorative copies of an edit's text (a marquee repeats its cards), to change with it. */
  clonesOf: (e: TextEdit) => TextEdit[];
  /** The page on the canvas, once it's open. */
  docs: () => Document[];
  /** Has the page draw itself again (its shaders and canvases read the page's mode as they're made). */
  redraw: () => void;
}

type Box = { top: number; left: number; width: number; height: number };
export type Zoom = number | "fit";
type Cam = { x: number; y: number };

// Room above the frame for the account bar and the frame's label, and around it.
const TOP = 112;
const MARGIN = 40;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 2;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** Holds a label or a toolbar at its own size while the layer under it is mid zoom. */
const steady = (origin: string) => ({ transform: "scale(calc(1 / var(--bd-k, 1)))", transformOrigin: origin });

/**
 * Where everything sits at a zoom. The board's coordinates are the page's pixels times the zoom,
 * its top left at 0,0; the camera is the board point at the canvas's top left.
 */
function geometry(device: CanvasDevice, zoom: Zoom, size: { w: number; h: number }, insets: { left: number; right: number }) {
  const avail = Math.max(240, size.w - insets.left - insets.right - MARGIN * 2);
  const z = zoom === "fit" ? Math.min(1, avail / CANVAS_WIDTH[device]) : clampZoom(zoom);
  // The page, centered between the panels when it fits.
  const home: Cam = { x: -(insets.left + MARGIN + Math.max(0, (avail - CANVAS_WIDTH[device] * z) / 2)), y: -TOP };
  return { avail, z, home };
}

const keyOf = (zoom: Zoom, size: { w: number; h: number }, insets: { left: number; right: number }) => `${zoom}|${size.w}|${size.h}|${insets.left}|${insets.right}`;

/** Union of a section's boxes in its frame. Its wrapper has no box of its own (display: contents). */
function boxOf(el: Element | null): Box | null {
  if (!el) return null;
  const rs = (getComputedStyle(el).display === "contents" ? [...el.children] : [el]).map((c) => c.getBoundingClientRect()).filter((r) => r.width || r.height);
  if (!rs.length) return null;
  const top = Math.min(...rs.map((r) => r.top));
  const left = Math.min(...rs.map((r) => r.left));
  return { top, left, width: Math.max(...rs.map((r) => r.right)) - left, height: Math.max(...rs.map((r) => r.bottom)) - top };
}


const blockName = (el: Element, i: number) => {
  const tag = el.tagName.toLowerCase();
  if (tag === "header" || tag === "nav") return "Navigation";
  if (tag === "footer") return "Footer";
  const h = el.querySelector("h1,h2,h3")?.textContent?.trim().replace(/\s+/g, " ");
  return h ? (h.length > 34 ? `${h.slice(0, 32)}…` : h) : `Section ${i + 1}`;
};

/** Elements from a frame aren't instances of this window's Element, so look for closest() instead. */
const asEl = (t: EventTarget | null) => {
  const el = t as Element | null;
  return el && typeof el.closest === "function" ? el : null;
};

/** The text under a point on a page, if the point is on its letters (not just near them), and it's copy (not a field). */
function textAt(d: Document, x: number, y: number): Text | null {
  const range = d.caretRangeFromPoint?.(x, y);
  const node = range?.startContainer;
  if (!node || node.nodeType !== 3 || !(node as Text).data.trim()) return null;
  const p = node.parentElement;
  if (!p || p.closest("input, textarea, select, [contenteditable]")) return null;
  const r = d.createRange();
  r.selectNodeContents(node);
  const on = [...r.getClientRects()].some((b) => x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2);
  return on ? (node as Text) : null;
}

interface Editing {
  node: Text;
  scope: string;
  from: string;
  nth: number;
  was: string;
  value: string;
  rect: Box;
  /** A headline set word by word: every word of it, edited as one line (see spread). */
  words?: Array<{ node: Text; from: string; nth: number; was: string }>;
}

interface FrameProps {
  device: CanvasDevice;
  src: string;
  /** Studio's preview is open over it: drawn no more until it's back, so it costs nothing. */
  paused: boolean;
  /** Changes when the page should be measured and painted again (back from the preview). */
  resync: number;
  compose: boolean;
  keys: string[];
  edits: TextEdit[];
  theme: string;
  /** Images in place of the template's files: each path, and the image's address. */
  images: Record<string, string>;
  selected: string | null;
  z: number;
  onHeight: (h: number) => void;
  onRects: (rects: Record<string, Box>, blocks: Block[]) => void;
  onHover: (key: string | null) => void;
  onSelect: (key: string | null) => void;
  onKey: (e: KeyboardEvent) => void;
  onText: (node: Text, el: Element) => void;
  /** The text the pointer is over (null when it isn't over any): outlined, to say a click edits it. */
  onTextHover: (node: Text | null) => void;
  onWheel: (e: WheelEvent) => void;
  onReady: () => void;
  register: (iframe: HTMLIFrameElement | null) => void;
  height: number;
  scope: (el: Element) => string | null;
}

/** The breakpoint: its label, and the page at that width and its full height. */
const Frame = memo(function Frame({ device, src, paused, resync, compose, keys, edits, theme, images, selected, z, onHeight, onRects, onHover, onSelect, onKey, onText, onTextHover, onWheel, onReady, register, height, scope }: FrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const W = CANVAS_WIDTH[device];
  const latest = useRef({ keys, edits, selected, onSelect, onKey, onHover, onText, onTextHover, onWheel, scope, onRects, onHeight });
  useEffect(() => {
    latest.current = { keys, edits, selected, onSelect, onKey, onHover, onText, onTextHover, onWheel, scope, onRects, onHeight };
  });

  useEffect(() => {
    register(ref.current);
    return () => register(null);
  }, [register]);

  /** The page's height once everything sized to the window is held at a window's height. */
  const fit = useCallback(() => {
    const f = ref.current;
    const d = f?.contentDocument;
    if (!f || !d?.body) return;
    pinViewportHeights(f, CANVAS_HEIGHT[device]);
    latest.current.onHeight(Math.max(CANVAS_HEIGHT[device], pageHeight(d)));
  }, [device]);

  const measure = useCallback(() => {
    const d = ref.current?.contentDocument;
    if (!d?.body) return;
    const rects: Record<string, Box> = {};
    let blocks: Block[] = [];
    if (compose) {
      for (const k of latest.current.keys) {
        const b = boxOf(d.querySelector(`[data-bd-key="${CSS.escape(k)}"]`));
        if (b) rects[k] = b;
      }
    } else {
      const els = blocksOf(d);
      els.forEach((el, i) => {
        const b = boxOf(el);
        if (b) rects[`block:${i}`] = b;
      });
      blocks = els.map((el, i) => ({ key: `block:${i}`, name: blockName(el, i) }));
    }
    latest.current.onRects(rects, blocks);
  }, [compose]);

  /** Text edits, laid over the page: anything no longer edited goes back to the template's words. */
  const paint = useCallback(() => {
    const d = ref.current?.contentDocument;
    if (!d?.body) return;
    for (const t of textsIn(d.body)) if ((t as Text & { bdFrom?: string }).bdFrom !== undefined) setText(t, original(t));
    applyEdits(d, latest.current.edits);
  }, []);

  // The frame says when it's ready and when it has drawn a new list (pages made of sections).
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.type === "bd:ready") {
        setReady(true);
        ref.current?.contentWindow?.postMessage({ type: "bd:sections", keys: latest.current.keys }, location.origin);
      }
      if (e.data?.type === "bd:rendered")
        requestAnimationFrame(() => {
          paint();
          fit();
          measure();
        });
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [fit, measure, paint]);

  useEffect(() => {
    if (ready && compose) ref.current?.contentWindow?.postMessage({ type: "bd:sections", keys }, location.origin);
  }, [keys, ready, compose]);

  useEffect(() => {
    if (ready) paint();
  }, [edits, ready, paint]);

  // The project's colors, over the template's own; colors can change a page's height (a font
  // doesn't, but a section that hides on contrast might), so it's measured again after.
  // Back from somewhere that may have changed things under it: measured and painted again.
  useEffect(() => {
    if (!ready || !resync) return;
    paint();
    fit();
    measure();
  }, [resync, ready, paint, fit, measure]);

  // Every page also draws again once the colors settle, so shaders and canvases (which read
  // colors when they're made) take them too: basedraft's wiring in the page does it.
  const drawn = useRef("");
  useEffect(() => {
    const d = ref.current?.contentDocument;
    if (!ready || !d?.head) return;
    applyTheme(d, theme);
    requestAnimationFrame(() => {
      fit();
      measure();
    });
    // Out of view, the redraw waits until it's back: no new shaders for a page nobody sees. Images
    // go with the colors: the page draws again for either, once.
    const look = Object.keys(images).length ? `${theme}|${JSON.stringify(images)}` : theme;
    if (drawn.current === look || paused) return;
    const t = setTimeout(
      () => {
        drawn.current = look;
        ref.current?.contentWindow?.postMessage({ type: "bd:theme", css: theme, images }, location.origin);
      },
      drawn.current === "" && look ? 0 : 450,
    );
    return () => clearTimeout(t);
  }, [theme, images, ready, paused, fit, measure]);

  // Hover, clicks, keys and the wheel inside the frame, and anything that moves its sections.
  useEffect(() => {
    if (!ready) return;
    const f = ref.current;
    const win = f?.contentWindow;
    const d = f?.contentDocument;
    if (!f || !win || !d) return;
    // The text under the pointer, checked once a frame: a text cursor and an outline say a click edits it.
    let over: Text | null = null;
    let at: { x: number; y: number; alt: boolean } | null = null;
    let frame = 0;
    const look = () => {
      frame = 0;
      const next = at && !at.alt ? textAt(d, at.x, at.y) : null;
      if (next === over) return;
      over = next;
      d.documentElement.style.cursor = next ? "text" : "";
      latest.current.onTextHover(next);
    };
    const move = (e: PointerEvent) => {
      const el = asEl(e.target);
      latest.current.onHover(el ? latest.current.scope(el) : null);
      at = { x: e.clientX, y: e.clientY, alt: e.altKey };
      if (!frame) frame = requestAnimationFrame(look);
    };
    const leave = () => {
      latest.current.onHover(null);
      at = null;
      if (!frame) frame = requestAnimationFrame(look);
    };
    /*
     * One click edits: on a word, it's ready to rewrite; anywhere else, the section (or block) is
     * selected, and once it is, clicks reach the page so you can try it. Option (Alt) click always
     * reaches the page, the way a visitor would click it.
     */
    const click = (e: MouseEvent) => {
      const el = asEl(e.target);
      if (!el) return;
      // Links never navigate away from the canvas.
      if (el.closest("a[href]")) e.preventDefault();
      if (e.altKey) return;
      const node = textAt(d, e.clientX, e.clientY);
      if (node) {
        e.preventDefault();
        e.stopPropagation();
        return latest.current.onText(node, el);
      }
      const k = latest.current.scope(el);
      if (k && k !== latest.current.selected) {
        e.preventDefault();
        e.stopPropagation();
        latest.current.onSelect(k);
      }
    };
    const key = (e: KeyboardEvent) => latest.current.onKey(e);
    const wheel = (e: WheelEvent) => {
      // The board scrolls, not the page inside it; a page's own smooth scrolling never sees it.
      e.preventDefault();
      e.stopImmediatePropagation();
      latest.current.onWheel(e);
    };
    const ro = new ResizeObserver(() =>
      requestAnimationFrame(() => {
        fit();
        measure();
      }),
    );
    ro.observe(d.body);
    const tick = setInterval(measure, 800);
    d.addEventListener("pointermove", move);
    d.addEventListener("pointerleave", leave);
    d.addEventListener("click", click, true);
    d.addEventListener("keydown", key);
    win.addEventListener("wheel", wheel, { passive: false, capture: true });
    paint();
    fit();
    measure();
    // Drawn and measured: the page is on show.
    requestAnimationFrame(() => onReady());
    return () => {
      ro.disconnect();
      clearInterval(tick);
      d.removeEventListener("pointermove", move);
      d.removeEventListener("pointerleave", leave);
      d.removeEventListener("click", click, true);
      cancelAnimationFrame(frame);
      d.removeEventListener("keydown", key);
      win.removeEventListener("wheel", wheel, { capture: true });
    };
  }, [ready, fit, measure, paint, onReady]);

  return (
    <div className="absolute left-0 top-0" style={{ width: W * z }}>
      {/* The breakpoint's label, as in Framer: its name and its width. */}
      <div className="absolute -top-10 left-0 flex h-8 items-center gap-2 rounded-[8px] bg-fg/[0.04] px-3 text-[12.5px]" style={{ width: `calc(${W * z}px * var(--bd-k, 1))`, ...steady("0 40px") }}>
        <span className="font-medium text-fg">{DEVICE_LABEL[device]}</span>
        <span className="tabular-nums text-subtle">{W}</span>
      </div>
      {/*
        Paused, the page inside isn't drawn at all (content-visibility), so its animations, shaders
        and canvases stop costing the main thread, which the frame shares with Studio. Its size,
        and everything measured in it, stay as they were.
      */}
      <div className="relative overflow-hidden bg-white shadow-[0_1px_3px_rgb(var(--bd-shade)/0.08),0_16px_48px_-16px_rgb(var(--bd-shade)/0.22),0_0_0_1px_rgb(var(--bd-ink)/0.06)]" style={{ width: W * z, height: height * z, contentVisibility: paused ? "hidden" : undefined }}>
        <div style={{ width: W, height, transform: `scale(${z})`, transformOrigin: "0 0" }}>
          <iframe
            ref={ref}
            src={src}
            title={`Your page, ${DEVICE_LABEL[device]}`}
            className="block w-full border-0"
            style={{ height }}
            // Pages made of sections say when they're ready; a template's own page is ready once it loads.
            onLoad={() => setTimeout(() => setReady(true), compose ? 1500 : 0)}
          />
        </div>
        {!ready && <div className="absolute inset-0 grid place-items-center bg-surface text-[13px] text-muted">Loading {DEVICE_LABEL[device].toLowerCase()}…</div>}
      </div>
    </div>
  );
});

/** A mouse wheel's click (lines, or a big whole step) eases there; a trackpad's stream of small steps goes straight. */
const isNotch = (e: WheelEvent) => e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));

/** A menu or field on the canvas that scrolls by itself keeps its wheel. */
function scrollsItself(t: EventTarget | null, stop: Element) {
  for (let el = t as HTMLElement | null; el && el !== stop; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) return true;
  }
  return false;
}

interface CameraHooks {
  layer: () => HTMLElement | null;
  /** Keeps some of the page in view. */
  clamp: (c: Cam, z: number) => Cam;
  /** Draws the board for a camera at rest, or a pan at the zoom already drawn. */
  commit: (z: number, c: Cam, zoomed: boolean) => void;
  /** The zoom as it changes, for a readout. */
  live: (z: number) => void;
}

const IDLE = 140;

/**
 * The camera. What's on screen ("live") runs ahead of what React drew ("drawn"): the difference is
 * one transform on the layer holding the board, so a pinch or a pan never waits on a render or on
 * the pages inside repainting. A pan is handed to React as it goes (it only moves the board); a
 * zoom once it rests, when the pages are drawn again at their new size.
 */
function createCamera(h: CameraHooks) {
  let drawn = { z: 1, x: 0, y: 0 };
  let live = { ...drawn };
  // Where the camera is heading. A trackpad moves live and target together; a wheel's notch
  // moves the target and live eases after it.
  let target = { ...drawn };
  let anchor = { x: 0, y: 0 };
  let sent = { ...drawn };
  let raf = 0;
  let last = 0;

  const paint = () => {
    const el = h.layer();
    if (!el) return;
    const k = live.z / drawn.z;
    const tx = k * drawn.x - live.x;
    const ty = k * drawn.y - live.y;
    el.style.transform = Math.abs(k - 1) < 1e-6 && Math.abs(tx) < 0.01 && Math.abs(ty) < 0.01 ? "" : `translate3d(${tx}px, ${ty}px, 0) scale(${k})`;
    el.style.setProperty("--bd-k", String(k));
    h.live(live.z);
  };

  /** Zooms live by r about a point on screen, the point holding still; the target pans with it. */
  const scaleAbout = (r: number, ax: number, ay: number) => {
    live = { z: live.z * r, x: (live.x + ax) * r - ax, y: (live.y + ay) * r - ay };
    target = { ...target, x: (target.x + ax) * r - ax, y: (target.y + ay) * r - ay };
  };

  const send = () => {
    const zoomed = live.z !== drawn.z;
    if (zoomed) {
      // A tidy zoom for the readout and the menu, the point under the pointer kept where it was.
      const zr = Math.round(live.z * 1e4) / 1e4;
      scaleAbout(zr / live.z, anchor.x, anchor.y);
      live.z = zr;
      target = { ...live };
      paint();
    }
    if (!zoomed && live.x === sent.x && live.y === sent.y) return;
    sent = { ...live };
    h.commit(live.z, { x: live.x, y: live.y }, zoomed);
  };

  const step = () => {
    raf = 0;
    const r = target.z / live.z;
    if (r !== 1) scaleAbout(Math.abs(Math.log(r)) > 0.002 ? Math.pow(r, 0.3) : r, anchor.x, anchor.y);
    if (Math.abs(Math.log(target.z / live.z)) <= 1e-9) live.z = target.z;
    const dx = target.x - live.x;
    const dy = target.y - live.y;
    live = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 ? { ...live, x: live.x + dx * 0.3, y: live.y + dy * 0.3 } : { ...live, x: target.x, y: target.y };
    paint();
    const moving = live.z !== target.z || live.x !== target.x || live.y !== target.y;
    if (moving || performance.now() - last < IDLE) {
      if (live.z === drawn.z) send();
      raf = requestAnimationFrame(step);
    } else send();
  };

  const run = () => {
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(step);
  };

  return {
    live: () => live,
    /** React drew the board for this camera; `reset` when it came from outside (the zoom menu). */
    drawnAt(z: number, c: Cam, reset: boolean) {
      drawn = { z, x: c.x, y: c.y };
      if (reset) {
        cancelAnimationFrame(raf);
        raf = 0;
        live = { ...drawn };
        target = { ...drawn };
        sent = { ...drawn };
      }
      paint();
    },
    wheel(dx: number, dy: number, zoomKey: boolean, cx: number, cy: number, notch: boolean) {
      if (zoomKey) {
        const f = notch ? (dy < 0 ? 1.25 : 1 / 1.25) : Math.exp(-Math.max(-25, Math.min(25, dy)) * 0.01);
        const tz = clampZoom(target.z * f);
        anchor = { x: cx, y: cy };
        const r = tz / target.z;
        target = { ...target, z: tz };
        if (!notch) {
          scaleAbout(r, cx, cy);
          paint();
        }
      } else if (notch) target = { ...target, ...h.clamp({ x: target.x + dx, y: target.y + dy }, live.z) };
      else {
        const c = h.clamp({ x: live.x + dx, y: live.y + dy }, live.z);
        target = { ...target, x: target.x + c.x - live.x, y: target.y + c.y - live.y };
        live = { ...live, ...c };
        paint();
      }
      run();
    },
    /** Straight to a point, for dragging with Space held. */
    moveTo(c: Cam) {
      const to = h.clamp(c, live.z);
      live = { ...live, ...to };
      target = { ...live };
      paint();
      run();
    },
    /** Eases to a point, for bringing a section into view. */
    glide(c: Partial<Cam>) {
      target = { ...target, ...h.clamp({ x: c.x ?? target.x, y: c.y ?? target.y }, live.z) };
      run();
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

const NO_IMAGES: Record<string, string> = {};

export const Canvas = forwardRef<
  CanvasHandle,
  {
    template: TemplateSlug;
    view: View;
    keys: string[];
    device: CanvasDevice;
    edits: TextEdit[];
    /** The project's colors, as CSS (see site/theme). */
    theme?: string;
    /** Images in place of the template's files (see site/images). */
    images?: Record<string, string>;
    selected: string | null;
    zoom: Zoom;
    insets: { left: number; right: number };
    onSelect: (key: string | null) => void;
    onZoom: (z: number) => void;
    onZoomTo: (z: number) => void;
    /** The zoom as it changes mid pinch, before the page is drawn at it. */
    onLiveZoom?: (z: number) => void;
    onEdit: (e: TextEdit | TextEdit[]) => void;
    onBlocks: (blocks: Block[]) => void;
    /** Studio's shortcuts, also heard while focus is inside the frame. */
    onKey: (e: KeyboardEvent) => void;
    bar: (key: string, width: number) => ReactNode;
    /** The page is drawn and measured. */
    onReady?: () => void;
    /** The page paused (while Studio's preview covers the canvas). */
    paused?: boolean;
    /** Bump to have the page measured and painted again. */
    resync?: number;
  }
>(function Canvas({ template, view, keys, device, edits, theme = "", images = NO_IMAGES, selected, zoom, insets, onSelect, onZoom, onZoomTo, onLiveZoom, onEdit, onBlocks, onKey, bar, onReady, paused = false, resync = 0 }, ref) {
  const scroller = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [height, setHeight] = useState(CANVAS_HEIGHT[device]);
  const [rects, setRects] = useState<Record<string, Box>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  // The words the pointer is over on the page, outlined: a click edits them.
  const [overText, setOverText] = useState<Box | null>(null);
  const onTextHover = useCallback((node: Text | null) => {
    if (!node) return setOverText(null);
    const r = node.ownerDocument.createRange();
    r.selectNodeContents(node);
    const b = r.getBoundingClientRect();
    setOverText({ top: b.top, left: b.left, width: b.width, height: b.height });
  }, []);
  const [space, setSpace] = useState(false);
  const compose = view.kind === "page";
  // The list the frame was opened with; later lists are posted to it, so it never reloads.
  const [src] = useState(() => (view.kind === "page" ? composeUrl(template, keys) : liveUrl(template, view.path)));
  const routeScope = view.kind === "route" ? `route:${view.path}` : "";

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const g = geometry(device, zoom, size, insets);
  const { avail, z } = g;
  useEffect(() => onZoom(z), [z, onZoom]);

  // The camera as React last drew it, and the zoom and layout it was set for. When those change
  // from outside (the zoom menu, a panel opening, the window resizing), the camera follows: "fit"
  // centers the page again, a set zoom keeps the middle of the view where it was.
  const [cam, setCam] = useState<Cam>(() => g.home);
  const key = keyOf(zoom, size, insets);
  const [basis, setBasis] = useState(() => ({ z, key, rev: 0 }));
  if (basis.z !== z || basis.key !== key) {
    const k = z / basis.z;
    let next = cam;
    if (zoom === "fit") next = { x: g.home.x, y: (cam.y + TOP) * k - TOP };
    else if (k !== 1) {
      const c = { x: insets.left + MARGIN + avail / 2, y: size.h / 2 };
      next = { x: (cam.x + c.x) * k - c.x, y: (cam.y + c.y) * k - c.y };
    }
    setBasis({ z, key, rev: basis.rev + 1 });
    setCam(next);
  }

  const latest = useRef({ onZoomTo, onLiveZoom, size, insets, height });
  useEffect(() => {
    latest.current = { onZoomTo, onLiveZoom, size, insets, height };
  });

  const [camera] = useState(() =>
    createCamera({
      layer: () => layer.current,
      clamp: (c, zz) => {
        const { size: s, height: h } = latest.current;
        const keep = 160;
        return { x: Math.min(CANVAS_WIDTH[device] * zz - keep, Math.max(keep - s.w, c.x)), y: Math.min(h * zz - keep, Math.max(keep - s.h, c.y)) };
      },
      commit: (zz, c, zoomed) => {
        setCam(c);
        if (!zoomed) return;
        const { size: s, insets: i } = latest.current;
        setBasis((b) => ({ z: zz, key: keyOf(zz, s, i), rev: b.rev }));
        latest.current.onZoomTo(zz);
      },
      live: (zz) => latest.current.onLiveZoom?.(zz),
    }),
  );

  const rev = useRef(basis.rev);
  useLayoutEffect(() => {
    const outside = rev.current !== basis.rev;
    rev.current = basis.rev;
    camera.drawnAt(z, cam, outside);
  }, [camera, z, cam, basis.rev]);
  useEffect(() => () => camera.stop(), [camera]);

  const register = useCallback((f: HTMLIFrameElement | null) => {
    frame.current = f;
  }, []);
  const onHeight = useCallback((h: number) => setHeight((now) => (Math.abs(now - h) < 1 ? now : h)), []);
  const onRects = useCallback(
    (r: Record<string, Box>, blocks: Block[]) => {
      setRects((now) => (JSON.stringify(now) === JSON.stringify(r) ? now : r));
      if (view.kind === "route") onBlocks(blocks);
    },
    [view.kind, onBlocks],
  );

  /** Which layer an element in the frame belongs to: its section, or its top-level block. */
  const scope = useCallback(
    (el: Element) => {
      if (compose) return el.closest("[data-bd-key]")?.getAttribute("data-bd-key") ?? null;
      const doc = el.ownerDocument;
      const i = blocksOf(doc).findIndex((b) => b.contains(el));
      return i >= 0 ? `block:${i}` : null;
    },
    [compose],
  );

  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });
  const onFrameReady = useCallback(() => ready.current?.(), []);

  useImperativeHandle(ref, () => ({
    clonesOf: (e) => {
      const d = frame.current?.contentDocument;
      const root = d && scopeRoot(d, e.scope);
      if (!root) return [];
      const same = textsIn(root).filter((n) => original(n) === e.from);
      const target = same[e.nth];
      if (!target) return [];
      // The same place in every copy of what repeats (each copy of a card, each copy of a track):
      // change one, and they all still match. Words that merely read the same elsewhere aren't copies.
      const memo = new Map<Element, string>();
      const sig = (el: Element) => {
        if (!memo.has(el)) memo.set(el, textsIn(el).map(original).join("\u0000"));
        return memo.get(el)!;
      };
      // Copies can hold copies (a track drawn twice, each repeating its cards): each one found is followed too.
      const twins = new Set<Text>([target]);
      const queue = [target];
      while (queue.length && twins.size < 64) {
        const node = queue.shift()!;
        for (let p = node.parentElement; p && p !== root; p = p.parentElement) {
          const parent = p.parentElement;
          if (!parent || parent.childElementCount < 2) continue;
          const at = textsIn(p).indexOf(node);
          for (const q of parent.children) {
            const twin = q !== p && sig(q) === sig(p) ? textsIn(q)[at] : undefined;
            if (twin && !twins.has(twin)) {
              twins.add(twin);
              queue.push(twin);
            }
          }
        }
      }
      twins.delete(target);
      return [...twins].flatMap((n) => {
        const i = same.indexOf(n);
        return i >= 0 && i !== e.nth ? [{ ...e, nth: i }] : [];
      });
    },
    docs: () => (frame.current?.contentDocument ? [frame.current.contentDocument] : []),
    redraw: () => frame.current?.contentWindow?.postMessage({ type: "bd:theme", css: theme, images }, location.origin),
  }));

  // A section picked from the layers comes into view.
  const shown = useRef<string | null>(null);
  useEffect(() => {
    const r = selected ? rects[selected] : null;
    if (!selected || !r || shown.current === selected) return;
    shown.current = selected;
    const top = r.top * z - 72;
    const c = camera.live();
    if (top < c.y || top > c.y + size.h - 160) camera.glide({ y: top });
  }, [selected, rects, z, camera, size.h]);

  /* ---------- panning and zooming ---------- */

  const onFrameWheel = useCallback(
    (e: WheelEvent) => {
      const f = frame.current;
      const box = scroller.current?.getBoundingClientRect();
      if (!f || !box) return;
      const fr = f.getBoundingClientRect();
      // The frame's coordinates are its own pixels, drawn at the live zoom; the camera's are the screen's.
      const zl = camera.live().z;
      const unit = e.deltaMode === 1 ? 16 : 1;
      camera.wheel(e.deltaX * unit, e.deltaY * unit, e.ctrlKey || e.metaKey, fr.left + e.clientX * zl - box.left, fr.top + e.clientY * zl - box.top, isNotch(e));
    },
    [camera],
  );

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey) && scrollsItself(e.target, el)) return;
      e.preventDefault();
      const box = el.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 16 : 1;
      camera.wheel(e.deltaX * unit, e.deltaY * unit, e.ctrlKey || e.metaKey, e.clientX - box.left, e.clientY - box.top, isNotch(e));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [camera]);

  // Hold Space to pan, as in Figma and Framer.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code === "Space" && !e.repeat && !(t.isContentEditable || ["INPUT", "TEXTAREA"].includes(t.tagName))) {
        e.preventDefault();
        setSpace(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpace(false);
    const blur = () => setSpace(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const drag = useRef<{ x: number; y: number; cam: Cam } | null>(null);

  /* ---------- editing text ---------- */

  const startText = useCallback(
    (node: Text, el: Element) => {
      const s = compose ? el.closest("[data-bd-key]")?.getAttribute("data-bd-key") : routeScope;
      const doc = el.ownerDocument;
      const root = s ? scopeRoot(doc, s) : null;
      if (!s || !root || !root.contains(node)) return;
      const range = doc.createRange();
      const { from, nth } = addressOf(node, root);
      // A word of a headline set word by word: the whole headline, as one line to rewrite.
      const owner = node.parentElement?.closest("h1, h2, h3, h4, h5, h6, p, a, button, li");
      const pieces = owner && root.contains(owner) ? textsIn(owner) : [];
      const words = pieces.length >= 3 && pieces.every((n) => !/\s/.test(original(n))) ? pieces.map((n) => ({ node: n, ...addressOf(n, root), was: n.data.trim() })) : undefined;
      if (words) range.selectNodeContents(owner!);
      else range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      const was = words ? words.map((w) => w.was).filter(Boolean).join(" ") : node.data.trim();
      setEditing({ node, scope: s, from, nth, was, value: was, rect: { top: r.top, left: r.left, width: r.width, height: r.height }, words });
      onSelect(compose ? s : scope(el));
    },
    [compose, routeScope, onSelect, scope],
  );

  const commit = (keep: boolean) => {
    if (!editing) return;
    const { words } = editing;
    if (words) {
      const v = editing.value.trim();
      if (keep && v && v !== editing.was) {
        const next = spread(v, words.length);
        onEdit(words.map((w, i) => ({ scope: editing.scope, from: w.from, nth: w.nth, to: next[i] })).filter((e, i) => e.to !== words[i].was));
      } else words.forEach((w) => setText(w.node, w.was));
      return setEditing(null);
    }
    if (!keep) setText(editing.node, editing.was);
    else if (editing.value.trim() && editing.value.trim() !== editing.was) onEdit({ scope: editing.scope, from: editing.from, nth: editing.nth, to: editing.value.trim() });
    else setText(editing.node, editing.was);
    setEditing(null);
  };
  /** Back to the template's own words, as one change. */
  const reset = () => {
    if (!editing) return;
    const parts = editing.words ?? [{ node: editing.node, from: editing.from, nth: editing.nth }];
    onEdit(parts.map((w) => ({ scope: editing.scope, from: w.from, nth: w.nth, to: w.from })));
    setEditing(null);
  };
  // What the template wrote there, to offer going back to it.
  const templateWords = editing ? (editing.words ? editing.words.map((w) => w.from).join(" ") : editing.from) : "";

  const sel = selected ? rects[selected] : null;
  const name = (k: string) => (compose ? (sectionOf(template, idOf(k))?.name ?? idOf(k)) : null);
  const outline = (k: string, strong: boolean) => {
    const r = rects[k];
    if (!r) return null;
    return <span key={`${k}-${strong}`} className={cn("absolute rounded-[2px]", strong ? "shadow-[inset_0_0_0_2px_var(--bd-select)]" : "shadow-[inset_0_0_0_1px_var(--bd-select)]")} style={{ top: r.top * z, left: r.left * z, width: r.width * z, height: r.height * z }} />;
  };
  const ed = editing ? { left: editing.rect.left * z, top: editing.rect.top * z, width: editing.rect.width * z, height: editing.rect.height * z } : null;

  return (
    <div
      ref={scroller}
      className={cn("absolute inset-0 overflow-hidden", space && "cursor-grab active:cursor-grabbing")}
      onPointerDown={(e) => {
        if (space) {
          drag.current = { x: e.clientX, y: e.clientY, cam: { ...camera.live() } };
          (e.target as Element).setPointerCapture?.(e.pointerId);
          return;
        }
        if (e.target === e.currentTarget || (e.target as Element).hasAttribute("data-board")) onSelect(null);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (d) camera.moveTo({ x: d.cam.x - (e.clientX - d.x), y: d.cam.y - (e.clientY - d.y) });
      }}
      onPointerUp={() => (drag.current = null)}
      // Only the camera moves the board. Focusing a field on it, or find in page, would scroll this
      // box instead and put the page out of line with it, so any scroll is undone at once.
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
    >
      {/* The camera: this layer carries a pan or a pinch between renders; the board under it is where React draws. */}
      <div ref={layer} className="absolute left-0 top-0 origin-top-left will-change-transform">
        <div data-board className="absolute left-0 top-0 will-change-transform" style={{ transform: `translate3d(${-cam.x}px, ${-cam.y}px, 0)` }}>
          <Frame
            device={device}
            src={src}
            paused={paused}
            resync={resync}
            compose={compose}
            keys={keys}
            edits={edits}
            theme={theme}
            images={images}
            selected={selected}
            z={z}
            height={height}
            onHeight={onHeight}
            onRects={onRects}
            onHover={setHover}
            onSelect={onSelect}
            onKey={onKey}
            onText={startText}
            onTextHover={onTextHover}
            onWheel={onFrameWheel}
            onReady={onFrameReady}
            register={register}
            scope={scope}
          />

          {/* Outlines over the page: the selection, and what the pointer is over. */}
          <div aria-hidden className="pointer-events-none absolute left-0 top-0">
            {hover && hover !== selected && outline(hover, false)}
            {selected && outline(selected, true)}
            {hover && hover !== selected && rects[hover] && name(hover) && (
              <span className="absolute whitespace-nowrap rounded-br-[6px] bg-select px-2 py-1 text-[12px] font-medium text-white" style={{ top: Math.max(0, rects[hover].top * z), left: rects[hover].left * z, ...steady("0 0") }}>
                {name(hover)}
              </span>
            )}
            {ed && <span className="absolute rounded-[3px] shadow-[0_0_0_2px_#0d99ff]" style={{ top: ed.top - 2, left: ed.left - 3, width: ed.width + 6, height: ed.height + 4 }} />}
            {/* The words under the pointer: a click edits them. */}
            {overText && !ed && !space && <span className="absolute rounded-[3px] shadow-[0_0_0_1px_#0d99ff]" style={{ top: overText.top * z - 2, left: overText.left * z - 3, width: overText.width * z + 6, height: overText.height * z + 4 }} />}
          </div>

          {/* The selection's toolbar, just above it, held in view while the section runs past the top. */}
          {sel && selected && (
            <div className="absolute z-10 flex items-center justify-between gap-2" style={{ top: Math.min(Math.max(sel.top * z - 44, 6, cam.y + 64), (sel.top + sel.height) * z - 44), left: sel.left * z, width: `calc(${sel.width * z}px * var(--bd-k, 1))`, ...steady("0 100%") }}>
              {bar(selected, sel.width * z)}
            </div>
          )}

          {/* Editing text: the words in a field beside them, live on the page as you type. */}
          {editing && ed && (
            <div className="absolute z-20 w-[320px] rounded-[10px] bg-surface p-2 shadow-[0_16px_48px_rgb(var(--bd-shade)/0.2),0_0_0_1px_rgb(var(--bd-ink)/0.08)]" style={{ top: ed.top + ed.height + 10, left: ed.left, ...steady("0 0") }}>
              <textarea
                autoFocus
                aria-label="Text"
                value={editing.value}
                rows={Math.min(6, Math.max(1, Math.ceil(editing.value.length / 40)))}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  setEditing({ ...editing, value: e.target.value });
                  if (editing.words) spread(e.target.value, editing.words.length).forEach((w, i) => setText(editing.words![i].node, w || " "));
                  else setText(editing.node, e.target.value || " ");
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commit(true);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    commit(false);
                  }
                }}
                onBlur={() => commit(true)}
                className="block w-full resize-none rounded-[6px] bg-fg/[0.04] px-2.5 py-2 text-[13px] leading-snug outline-none focus:ring-2 focus:ring-[#0d99ff]/40"
              />
              <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11.5px] text-muted">
                <span>Enter to keep, Esc to undo</span>
                {/* Held on pointer down, so the field's blur doesn't keep the words first. */}
                {editing.was !== templateWords ? (
                  <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={reset} className="rounded-[6px] px-1.5 py-0.5 font-medium text-fg/80 hover:bg-fg/[0.06] hover:text-fg">
                    Back to the original
                  </button>
                ) : (
                  <span>Shift Enter for a new line</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Dragging the board while panning; the frame can't take the pointer away mid-drag. */}
      {space && <div className="absolute inset-0" />}
    </div>
  );
});
