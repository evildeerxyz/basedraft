"use client";

import { PlayIcon } from "@phosphor-icons/react";
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pageHeight, pinViewportHeights } from "@/site/frame-fit";
import { composeUrl, liveUrl, sectionOf, type TemplateSlug } from "@/site/live";
import { addressOf, applyEdits, original, scopeRoot, setText, textsIn, type TextEdit } from "@/site/text-edits";
import { blocksOf } from "@/site/live-export";
import { applyTheme } from "@/site/theme";
import { idOf, type View } from "./state";

/*
 * Studio's canvas, laid out like Framer's: every breakpoint side by side, each the page at its
 * real width and its full height, drawn by the template's own code in a same-origin frame. A camera
 * moves over the board; Studio never changes what's inside except the text you edit. It reads where
 * each section sits and draws outlines, the selection's toolbar and the text editor over the top.
 *
 * Panning and zooming move one layer on the GPU, every frame, without touching React or the pages
 * inside. Only once a zoom comes to rest are the pages drawn again at the new size, sharp.
 */

export type CanvasDevice = "desktop" | "tablet" | "phone";
export const CANVAS_WIDTH: Record<CanvasDevice, number> = { desktop: 1440, tablet: 820, phone: 390 };
/** The window each breakpoint is laid out for: what 100vh means on it. */
export const CANVAS_HEIGHT: Record<CanvasDevice, number> = { desktop: 900, tablet: 1180, phone: 844 };
export const DEVICE_LABEL: Record<CanvasDevice, string> = { desktop: "Desktop", tablet: "Tablet", phone: "Phone" };

/** A piece of text on the page, where an edit would find it. */
export interface PageText {
  scope: string;
  from: string;
  nth: number;
  text: string;
  tag: string;
}

/** A top-level block of a template page, for its layers. */
export interface Block {
  key: string;
  name: string;
}

/**
 * A point on a page at one breakpoint, in the page's own pixels. With an anchor, it's from that
 * section's (or block's) top left, so it moves with the section.
 */
export interface Spot {
  device: CanvasDevice;
  x: number;
  y: number;
  anchor?: string | null;
}

/** Someone else's selection, drawn in their color. */
export interface Peer {
  key: string;
  color: string;
  name: string;
}

export interface CanvasHandle {
  /** The primary breakpoint's document, for reading the page. */
  doc: () => Document | null;
  /** The texts in a section, or in one block of a template page, in reading order. */
  texts: (scope: string, block?: string) => PageText[];
  /** Scrolls the board so a section is in view. */
  reveal: (key: string) => void;
  /** Brings a point on a page into the middle of the view. */
  revealSpot: (s: Spot) => void;
}

type Box = { top: number; left: number; width: number; height: number };
export type Zoom = number | "fit" | "all";
type Cam = { x: number; y: number };

// Room above the frames for the account bar and each frame's label, and around them.
const TOP = 112;
const MARGIN = 40;
/** Between breakpoints, in the page's own pixels, so it grows and shrinks with them. */
const GAP = 160;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 2;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** Holds a label or a toolbar at its own size while the layer under it is mid zoom. */
export const steady = (origin: string) => ({ transform: "scale(calc(1 / var(--bd-k, 1)))", transformOrigin: origin });

/**
 * Where everything sits at a zoom. The board's coordinates are the pages' pixels times the zoom,
 * the primary breakpoint's top left at 0,0; the camera is the board point at the canvas's top left.
 */
function geometry(devices: CanvasDevice[], zoom: Zoom, size: { w: number; h: number }, insets: { left: number; right: number }) {
  const primary = devices[0] ?? "desktop";
  const avail = Math.max(240, size.w - insets.left - insets.right - MARGIN * 2);
  const allW = devices.reduce((t, d) => t + CANVAS_WIDTH[d], 0) + GAP * Math.max(0, devices.length - 1);
  const z = zoom === "fit" ? Math.min(1, avail / CANVAS_WIDTH[primary]) : zoom === "all" ? Math.min(1, avail / allW) : clampZoom(zoom);
  // The first breakpoint, centered between the panels when it fits; or all of them, side by side.
  const span = (zoom === "all" && devices.length > 1 ? allW : CANVAS_WIDTH[primary]) * z;
  const home: Cam = { x: -(insets.left + MARGIN + Math.max(0, (avail - span) / 2)), y: -TOP };
  return { primary, avail, allW, z, home };
}

const keyOf = (zoom: Zoom, size: { w: number; h: number }, insets: { left: number; right: number }, devices: CanvasDevice[]) => `${zoom}|${size.w}|${size.h}|${insets.left}|${insets.right}|${devices.join()}`;

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

interface Editing {
  device: CanvasDevice;
  node: Text;
  scope: string;
  from: string;
  nth: number;
  was: string;
  value: string;
  rect: Box;
}

interface FrameProps {
  device: CanvasDevice;
  primary: boolean;
  src: string;
  /** Opens the preview at this breakpoint's width. */
  onPreview: (device: CanvasDevice) => void;
  /** Out of view (or Studio's preview is open): drawn no more until it's back, so it costs nothing. */
  paused: boolean;
  /** Changes when the page should be measured and painted again (back from the preview). */
  resync: number;
  compose: boolean;
  keys: string[];
  edits: TextEdit[];
  theme: string;
  selected: string | null;
  z: number;
  left: number;
  onHeight: (device: CanvasDevice, h: number) => void;
  onRects: (device: CanvasDevice, rects: Record<string, Box>, blocks: Block[]) => void;
  onHover: (key: string | null) => void;
  onSelect: (key: string | null) => void;
  onKey: (e: KeyboardEvent) => void;
  onText: (device: CanvasDevice, node: Text, el: Element) => void;
  onWheel: (e: WheelEvent, device: CanvasDevice) => void;
  onPoint: (device: CanvasDevice, x: number, y: number) => void;
  onReady: (device: CanvasDevice) => void;
  register: (device: CanvasDevice, iframe: HTMLIFrameElement | null) => void;
  height: number;
  scope: (el: Element) => string | null;
}

/** One breakpoint: its label, and the page at that width and its full height. */
const Frame = memo(function Frame({ device, primary, src, onPreview, paused, resync, compose, keys, edits, theme, selected, z, left, onHeight, onRects, onHover, onSelect, onKey, onText, onWheel, onPoint, onReady, register, height, scope }: FrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const W = CANVAS_WIDTH[device];
  const latest = useRef({ keys, edits, selected, onSelect, onKey, onHover, onText, onWheel, onPoint, scope, onRects, onHeight });
  useEffect(() => {
    latest.current = { keys, edits, selected, onSelect, onKey, onHover, onText, onWheel, onPoint, scope, onRects, onHeight };
  });

  useEffect(() => {
    register(device, ref.current);
    return () => register(device, null);
  }, [device, register]);

  /** The page's height once everything sized to the window is held at a window's height. */
  const fit = useCallback(() => {
    const f = ref.current;
    const d = f?.contentDocument;
    if (!f || !d?.body) return;
    pinViewportHeights(f, CANVAS_HEIGHT[device]);
    latest.current.onHeight(device, Math.max(CANVAS_HEIGHT[device], pageHeight(d)));
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
    latest.current.onRects(device, rects, blocks);
  }, [compose, device]);

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
    // Out of view, the redraw waits until it's back: no new shaders for a page nobody sees.
    if (drawn.current === theme || paused) return;
    const t = setTimeout(
      () => {
        drawn.current = theme;
        ref.current?.contentWindow?.postMessage({ type: "bd:theme", css: theme }, location.origin);
      },
      drawn.current === "" && theme ? 0 : 450,
    );
    return () => clearTimeout(t);
  }, [theme, ready, paused, fit, measure]);

  // Hover, clicks, keys and the wheel inside the frame, and anything that moves its sections.
  useEffect(() => {
    if (!ready) return;
    const f = ref.current;
    const win = f?.contentWindow;
    const d = f?.contentDocument;
    if (!f || !win || !d) return;
    const move = (e: PointerEvent) => {
      const el = asEl(e.target);
      latest.current.onHover(el ? latest.current.scope(el) : null);
      // The frame is the page at full height, never scrolled, so its pointer is the page's pixels.
      latest.current.onPoint(device, e.clientX, e.clientY);
    };
    const leave = () => latest.current.onHover(null);
    const click = (e: MouseEvent) => {
      const el = asEl(e.target);
      if (!el) return;
      // Links never navigate away from the canvas.
      if (el.closest("a[href]")) e.preventDefault();
      // The first click selects; once a section is selected, clicks reach it, so you can try it.
      const k = latest.current.scope(el);
      if (k && k !== latest.current.selected) {
        e.preventDefault();
        e.stopPropagation();
        latest.current.onSelect(k);
      }
    };
    const dbl = (e: MouseEvent) => {
      const el = asEl(e.target);
      const range = d.caretRangeFromPoint?.(e.clientX, e.clientY);
      const node = range?.startContainer;
      if (!el || !node || node.nodeType !== 3 || !(node as Text).data.trim()) return;
      e.preventDefault();
      latest.current.onText(device, node as Text, el);
    };
    const key = (e: KeyboardEvent) => latest.current.onKey(e);
    const wheel = (e: WheelEvent) => {
      // The board scrolls, not the page inside it; a page's own smooth scrolling never sees it.
      e.preventDefault();
      e.stopImmediatePropagation();
      latest.current.onWheel(e, device);
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
    d.addEventListener("dblclick", dbl, true);
    d.addEventListener("keydown", key);
    win.addEventListener("wheel", wheel, { passive: false, capture: true });
    paint();
    fit();
    measure();
    // Drawn and measured: the page is on show.
    requestAnimationFrame(() => onReady(device));
    return () => {
      ro.disconnect();
      clearInterval(tick);
      d.removeEventListener("pointermove", move);
      d.removeEventListener("pointerleave", leave);
      d.removeEventListener("click", click, true);
      d.removeEventListener("dblclick", dbl, true);
      d.removeEventListener("keydown", key);
      win.removeEventListener("wheel", wheel, { capture: true });
    };
  }, [ready, device, fit, measure, paint, onReady]);

  return (
    <div className="absolute top-0" style={{ left, width: W * z }}>
      {/* The breakpoint's label, as in Framer: its name, its width, and a preview at that width. */}
      <div className="absolute -top-10 left-0 flex h-8 items-center gap-2 rounded-[8px] bg-fg/[0.04] px-1.5 text-[12.5px]" style={{ width: `calc(${W * z}px * var(--bd-k, 1))`, ...steady("0 40px") }}>
        <button type="button" onClick={() => onPreview(device)} aria-label={`Preview at ${DEVICE_LABEL[device]} width`} title={`Preview at ${CANVAS_WIDTH[device]}`} className="grid size-6 place-items-center rounded-[7px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg">
          <PlayIcon size={12} weight="fill" />
        </button>
        <span className={cn("font-medium", primary ? "text-fg" : "text-muted")}>{DEVICE_LABEL[device]}</span>
        <span className="tabular-nums text-subtle">{W}</span>
      </div>
      {/*
        Paused, the page inside isn't drawn at all (content-visibility), so its animations, shaders
        and canvases stop costing the main thread, which the frames share with Studio. Its size,
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

/** Comment mode's pointer: a speech bubble, its tail at the point. */
const COMMENT_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M3 25V12.5C3 7.25 7.25 3 12.5 3h3C20.75 3 25 7.25 25 12.5S20.75 22 15.5 22H7.5z" fill="#141414" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 12.5h8M10 16h5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>')}") 3 25, crosshair`;

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
  /** Keeps some of the pages in view. */
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
    /** Straight to a point, for dragging with the hand. */
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

export const Canvas = forwardRef<
  CanvasHandle,
  {
    template: TemplateSlug;
    view: View;
    keys: string[];
    devices: CanvasDevice[];
    edits: TextEdit[];
    /** The project's colors, as CSS (see site/theme). */
    theme?: string;
    selected: string | null;
    zoom: Zoom;
    hand: boolean;
    insets: { left: number; right: number };
    onSelect: (key: string | null) => void;
    onZoom: (z: number) => void;
    onZoomTo: (z: number) => void;
    /** The zoom as it changes mid pinch, before the pages are drawn at it. */
    onLiveZoom?: (z: number) => void;
    onEdit: (e: TextEdit) => void;
    onBlocks: (blocks: Block[]) => void;
    /** Studio's shortcuts, also heard while focus is inside the frames. */
    onKey: (e: KeyboardEvent) => void;
    bar: (key: string, width: number) => ReactNode;
    /** Comment mode: a click places a comment instead of selecting. */
    commenting?: boolean;
    /** Where the pointer is on the pages, as it moves; null once it leaves the canvas. */
    onPointer?: (s: Spot | null) => void;
    /** A click in comment mode: where, or null for a click off the pages. */
    onPlace?: (s: Spot | null) => void;
    /** Drawn over the pages, moving with them: pins and other people's pointers. */
    overlay?: (place: (s: Spot) => { left: number; top: number } | null) => ReactNode;
    peers?: Peer[];
    /** A breakpoint's page is drawn and measured. */
    onReady?: (device: CanvasDevice) => void;
    /** Play on a breakpoint's label: preview the page at its width. */
    onPreview?: (device: CanvasDevice) => void;
    /** Every page paused (while Studio's preview covers the canvas). */
    paused?: boolean;
    /** Bump to have every page measured and painted again. */
    resync?: number;
  }
>(function Canvas({ template, view, keys, devices, edits, theme = "", selected, zoom, hand, insets, onSelect, onZoom, onZoomTo, onLiveZoom, onEdit, onBlocks, onKey, bar, commenting, onPointer, onPlace, overlay, peers, onReady, onPreview, paused = false, resync = 0 }, ref) {
  const scroller = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const frames = useRef(new Map<CanvasDevice, HTMLIFrameElement>());
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [heights, setHeights] = useState<Partial<Record<CanvasDevice, number>>>({});
  const [rects, setRects] = useState<Partial<Record<CanvasDevice, Record<string, Box>>>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [space, setSpace] = useState(false);
  const compose = view.kind === "page";
  // The list each frame was opened with; later lists are posted to it, so it never reloads.
  const [src] = useState(() => (view.kind === "page" ? composeUrl(template, keys) : liveUrl(template, view.path)));
  const routeScope = view.kind === "route" ? `route:${view.path}` : "";

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const g = geometry(devices, zoom, size, insets);
  const { primary, avail, z } = g;
  useEffect(() => onZoom(z), [z, onZoom]);

  // The camera as React last drew it, and the zoom and layout it was set for. When those change
  // from outside (the zoom menu, a panel opening, the window resizing), the camera follows: "fit"
  // centers the page again, a set zoom keeps the middle of the view where it was.
  const [cam, setCam] = useState<Cam>(() => g.home);
  const key = keyOf(zoom, size, insets, devices);
  const [basis, setBasis] = useState(() => ({ z, key, rev: 0 }));
  if (basis.z !== z || basis.key !== key) {
    const k = z / basis.z;
    let next = cam;
    if (zoom === "fit" || zoom === "all") next = { x: g.home.x, y: (cam.y + TOP) * k - TOP };
    else if (k !== 1) {
      const c = { x: insets.left + MARGIN + avail / 2, y: size.h / 2 };
      next = { x: (cam.x + c.x) * k - c.x, y: (cam.y + c.y) * k - c.y };
    }
    setBasis({ z, key, rev: basis.rev + 1 });
    setCam(next);
  }

  // Breakpoints side by side, their gaps growing and shrinking with them.
  const lefts: number[] = [];
  let x = 0;
  for (const d of devices) {
    lefts.push(x);
    x += (CANVAS_WIDTH[d] + GAP) * z;
  }

  const latest = useRef({ onZoomTo, onLiveZoom, size, insets, devices, heights, rects, lefts, z, onPointer });
  useEffect(() => {
    latest.current = { onZoomTo, onLiveZoom, size, insets, devices, heights, rects, lefts, z, onPointer };
  });

  const [camera] = useState(() =>
    createCamera({
      layer: () => layer.current,
      clamp: (c, zz) => {
        const { size: s, devices: ds, heights: hs } = latest.current;
        const w = (ds.reduce((t, d) => t + CANVAS_WIDTH[d], 0) + GAP * Math.max(0, ds.length - 1)) * zz;
        const h = Math.max(...ds.map((d) => hs[d] ?? CANVAS_HEIGHT[d])) * zz;
        const keep = 160;
        return { x: Math.min(w - keep, Math.max(keep - s.w, c.x)), y: Math.min(h - keep, Math.max(keep - s.h, c.y)) };
      },
      commit: (zz, c, zoomed) => {
        setCam(c);
        if (!zoomed) return;
        const { size: s, insets: i, devices: ds } = latest.current;
        setBasis((b) => ({ z: zz, key: keyOf(zz, s, i, ds), rev: b.rev }));
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

  // Breakpoints load once they come near the screen, so a page with heavy scenes only runs them where you look.
  const [near, setNear] = useState<Set<CanvasDevice>>(() => new Set([primary]));
  const geo = useRef({ devices, lefts, z, cx: cam.x, w: size.w });
  useEffect(() => {
    geo.current = { devices, lefts, z, cx: cam.x, w: size.w };
  });
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const gg = geo.current;
      const seen = gg.devices.filter((d, i) => gg.lefts[i] - gg.cx < gg.w + 600 && gg.lefts[i] + CANVAS_WIDTH[d] * gg.z - gg.cx > -600);
      setNear((s) => (seen.some((d) => !s.has(d)) ? new Set([...s, ...seen]) : s));
    });
    return () => cancelAnimationFrame(id);
  }, [devices, z, size.w, cam.x]);

  const register = useCallback((d: CanvasDevice, f: HTMLIFrameElement | null) => {
    if (f) frames.current.set(d, f);
    else frames.current.delete(d);
  }, []);
  const onHeight = useCallback((d: CanvasDevice, h: number) => setHeights((s) => (Math.abs((s[d] ?? 0) - h) < 1 ? s : { ...s, [d]: h })), []);
  const onRects = useCallback(
    (d: CanvasDevice, r: Record<string, Box>, blocks: Block[]) => {
      setRects((s) => (JSON.stringify(s[d]) === JSON.stringify(r) ? s : { ...s, [d]: r }));
      if (d === devices[0] && view.kind === "route") onBlocks(blocks);
    },
    [devices, view.kind, onBlocks],
  );

  /** Which layer an element in a frame belongs to: its section, or its top-level block. */
  const scope = useCallback(
    (el: Element) => {
      if (compose) return el.closest("[data-bd-key]")?.getAttribute("data-bd-key") ?? null;
      const doc = el.ownerDocument;
      const i = blocksOf(doc).findIndex((b) => b.contains(el));
      return i >= 0 ? `block:${i}` : null;
    },
    [compose],
  );

  /** Brings a section's top into view, if it's out of it. */
  const bringIntoView = (r: Box) => {
    const top = r.top * z - 72;
    const c = camera.live();
    if (top < c.y || top > c.y + size.h - 160) camera.glide({ y: top });
  };

  const docOf = (d: CanvasDevice) => frames.current.get(d)?.contentDocument ?? null;

  /* ---------- points on the pages: pointers and pins ---------- */

  /** The section (or block) under a point, and the point from its top left. */
  const anchored = (d: CanvasDevice, x: number, y: number): Spot => {
    const all = latest.current.rects[d] ?? {};
    const hit = Object.entries(all).find(([, r]) => x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height);
    return hit ? { device: d, x: x - hit[1].left, y: y - hit[1].top, anchor: hit[0] } : { device: d, x, y };
  };
  /** A point on screen, on the nearest breakpoint's page. */
  const spotAt = (clientX: number, clientY: number): Spot | null => {
    const box = scroller.current?.getBoundingClientRect();
    const { devices: ds, lefts: ls, z: zz } = latest.current;
    if (!box || !ds.length) return null;
    const c = camera.live();
    const bx = (clientX - box.left + c.x) / c.z;
    const by = (clientY - box.top + c.y) / c.z;
    let i = 0;
    ds.forEach((_, j) => bx >= ls[j] / zz - GAP / 2 && (i = j));
    return { device: ds[i], x: bx - ls[i] / zz, y: by };
  };
  const onPoint = useCallback((d: CanvasDevice, x: number, y: number) => latest.current.onPointer?.({ device: d, x, y }), []);
  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });
  const onFrameReady = useCallback((d: CanvasDevice) => ready.current?.(d), []);
  const previewRef = useRef(onPreview);
  useEffect(() => {
    previewRef.current = onPreview;
  });
  const onFramePreview = useCallback((d: CanvasDevice) => previewRef.current?.(d), []);
  /** Where a point on a page sits on the board, as drawn now; null when it isn't on show. */
  const place = (s: Spot) => {
    const i = devices.indexOf(s.device);
    if (i < 0) return null;
    if (!s.anchor) return { left: lefts[i] + s.x * z, top: s.y * z };
    const r = rects[s.device]?.[s.anchor];
    return r ? { left: lefts[i] + (r.left + s.x) * z, top: (r.top + s.y) * z } : null;
  };

  useImperativeHandle(ref, () => ({
    doc: () => docOf(primary),
    texts: (s, block) => {
      const d = docOf(primary);
      const root = d && scopeRoot(d, s);
      if (!root) return [];
      const within = block ? blocksOf(d)[Number(block.split(":")[1])] : null;
      return textsIn(root)
        .filter((t) => !within || within.contains(t))
        .map((t) => ({ scope: s, ...addressOf(t, root), text: t.data.trim(), tag: t.parentElement?.closest("h1,h2,h3,h4,button,a,li,p,label,dt,dd,span")?.tagName.toLowerCase() ?? "text" }));
    },
    reveal: (key) => {
      const r = rects[primary]?.[key];
      if (r) bringIntoView(r);
    },
    revealSpot: (s) => {
      const at = place(s);
      if (!at) return;
      const k = camera.live().z / z;
      camera.glide({ x: at.left * k - (insets.left + (size.w - insets.left - insets.right) / 2), y: at.top * k - size.h / 3 });
    },
  }));

  // A section picked from the layers comes into view.
  const shown = useRef<string | null>(null);
  useEffect(() => {
    const r = selected ? rects[primary]?.[selected] : null;
    if (!selected || !r || shown.current === selected) return;
    shown.current = selected;
    const top = r.top * z - 72;
    const c = camera.live();
    if (top < c.y || top > c.y + size.h - 160) camera.glide({ y: top });
  }, [selected, rects, primary, z, camera, size.h]);

  /* ---------- panning and zooming ---------- */

  const onFrameWheel = useCallback(
    (e: WheelEvent, d: CanvasDevice) => {
      const f = frames.current.get(d);
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
  const panning = hand || space;
  const drag = useRef<{ x: number; y: number; cam: Cam } | null>(null);

  /* ---------- editing text ---------- */

  const startText = useCallback(
    (device: CanvasDevice, node: Text, el: Element) => {
      const s = compose ? el.closest("[data-bd-key]")?.getAttribute("data-bd-key") : routeScope;
      const doc = el.ownerDocument;
      const root = s ? scopeRoot(doc, s) : null;
      if (!s || !root || !root.contains(node)) return;
      const range = doc.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      const { from, nth } = addressOf(node, root);
      setEditing({ device, node, scope: s, from, nth, was: node.data.trim(), value: node.data.trim(), rect: { top: r.top, left: r.left, width: r.width, height: r.height } });
      onSelect(compose ? s : scope(el));
    },
    [compose, routeScope, onSelect, scope],
  );

  const commit = (keep: boolean) => {
    if (!editing) return;
    if (!keep) setText(editing.node, editing.was);
    else if (editing.value.trim() && editing.value.trim() !== editing.was) onEdit({ scope: editing.scope, from: editing.from, nth: editing.nth, to: editing.value.trim() });
    else setText(editing.node, editing.was);
    setEditing(null);
  };

  const sel = selected ? rects[primary]?.[selected] : null;
  const name = (k: string) => (compose ? (sectionOf(template, idOf(k))?.name ?? idOf(k)) : null);
  const outline = (d: CanvasDevice, k: string, strong: boolean) => {
    const r = rects[d]?.[k];
    if (!r) return null;
    const i = devices.indexOf(d);
    return <span key={`${d}-${k}-${strong}`} className={cn("absolute rounded-[2px]", strong ? "shadow-[inset_0_0_0_2px_var(--bd-select)]" : "shadow-[inset_0_0_0_1px_var(--bd-select)]")} style={{ top: r.top * z, left: lefts[i] + r.left * z, width: r.width * z, height: r.height * z }} />;
  };
  const primaryLeft = lefts[0] ?? 0;
  /** Whether a breakpoint shows between the panels, with a margin, at the camera React last drew. */
  const inView = (i: number, d: CanvasDevice) => {
    const left = lefts[i] - cam.x;
    const right = left + CANVAS_WIDTH[d] * z;
    const top = -cam.y;
    const bottom = top + (heights[d] ?? CANVAS_HEIGHT[d]) * z;
    return right > insets.left - 24 && left < size.w - insets.right + 24 && bottom > -200 && top < size.h + 200;
  };
  const ed = editing ? { left: lefts[devices.indexOf(editing.device)] + editing.rect.left * z, top: editing.rect.top * z, width: editing.rect.width * z, height: editing.rect.height * z } : null;

  return (
    <div
      ref={scroller}
      className={cn("absolute inset-0 overflow-hidden", panning && "cursor-grab active:cursor-grabbing")}
      onPointerDown={(e) => {
        if (panning) {
          drag.current = { x: e.clientX, y: e.clientY, cam: { ...camera.live() } };
          (e.target as Element).setPointerCapture?.(e.pointerId);
          return;
        }
        if (e.target === e.currentTarget || (e.target as Element).hasAttribute("data-board")) onSelect(null);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (d) camera.moveTo({ x: d.cam.x - (e.clientX - d.x), y: d.cam.y - (e.clientY - d.y) });
        if (onPointer) {
          const s = spotAt(e.clientX, e.clientY);
          if (s) onPointer(s);
        }
      }}
      onPointerLeave={() => onPointer?.(null)}
      onPointerUp={() => (drag.current = null)}
      // Only the camera moves the board. Focusing a field on it, or find in page, would scroll this
      // box instead and put the pages out of line with it, so any scroll is undone at once.
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
    >
      {/* The camera: this layer carries a pan or a pinch between renders; the board under it is where React draws. */}
      <div ref={layer} className="absolute left-0 top-0 origin-top-left will-change-transform">
        <div data-board className="absolute left-0 top-0 will-change-transform" style={{ transform: `translate3d(${-cam.x}px, ${-cam.y}px, 0)` }}>
          {devices.map((d, i) =>
            !near.has(d) ? (
              <div key={d} className="absolute top-0" style={{ left: lefts[i], width: CANVAS_WIDTH[d] * z }}>
                <div className="absolute -top-10 left-0 flex h-8 items-center gap-2 rounded-[8px] bg-fg/[0.04] px-3 text-[12.5px]" style={{ width: `calc(${CANVAS_WIDTH[d] * z}px * var(--bd-k, 1))`, ...steady("0 40px") }}>
                  <span className="font-medium text-muted">{DEVICE_LABEL[d]}</span>
                  <span className="tabular-nums text-subtle">{CANVAS_WIDTH[d]}</span>
                </div>
                <div className="bg-surface shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.06)]" style={{ height: CANVAS_HEIGHT[d] * z }} />
              </div>
            ) : (
              <Frame
                key={d}
                device={d}
                primary={i === 0}
                src={src}
                onPreview={onFramePreview}
                paused={paused || !inView(i, d)}
                resync={resync}
                compose={compose}
                keys={keys}
                edits={edits}
                theme={theme}
                selected={selected}
                z={z}
                left={lefts[i]}
                height={heights[d] ?? CANVAS_HEIGHT[d]}
                onHeight={onHeight}
                onRects={onRects}
                onHover={setHover}
                onSelect={onSelect}
                onKey={onKey}
                onText={startText}
                onWheel={onFrameWheel}
                onPoint={onPoint}
                onReady={onFrameReady}
                register={register}
                scope={scope}
              />
            ),
          )}

          {/* Outlines over every breakpoint: the selection, and what the pointer is over. */}
          <div aria-hidden className="pointer-events-none absolute left-0 top-0">
            {hover && hover !== selected && devices.map((d) => outline(d, hover, false))}
            {selected && devices.map((d) => outline(d, selected, true))}
            {hover && hover !== selected && rects[primary]?.[hover] && name(hover) && (
              <span className="absolute whitespace-nowrap rounded-br-[6px] bg-select px-2 py-1 text-[12px] font-medium text-white" style={{ top: Math.max(0, rects[primary]![hover].top * z), left: primaryLeft + rects[primary]![hover].left * z, ...steady("0 0") }}>
                {name(hover)}
              </span>
            )}
            {ed && <span className="absolute rounded-[3px] shadow-[0_0_0_2px_#0d99ff]" style={{ top: ed.top - 2, left: ed.left - 3, width: ed.width + 6, height: ed.height + 4 }} />}
            {/* Other people's selections, in their colors, with their names on the first breakpoint. */}
            {peers?.map((p) =>
              devices.map((d, i) => {
                const r = rects[d]?.[p.key];
                if (!r) return null;
                return (
                  <span key={`${p.name}-${d}`} className="absolute rounded-[2px]" style={{ top: r.top * z, left: lefts[i] + r.left * z, width: r.width * z, height: r.height * z, boxShadow: `inset 0 0 0 2px ${p.color}` }}>
                    {i === 0 && (
                      <span className="absolute right-0 top-0 whitespace-nowrap rounded-bl-[6px] px-2 py-1 text-[12px] font-medium text-white" style={{ background: p.color, ...steady("100% 0") }}>
                        {p.name}
                      </span>
                    )}
                  </span>
                );
              }),
            )}
          </div>

          {/* In comment mode the pages take no clicks: a click anywhere on them places a comment. */}
          {commenting && (
            <div
              aria-hidden
              data-board
              className="absolute"
              style={{ left: -MARGIN * 4, top: -TOP, width: (lefts.at(-1) ?? 0) + CANVAS_WIDTH[devices.at(-1) ?? "desktop"] * z + MARGIN * 8, height: Math.max(...devices.map((d) => heights[d] ?? CANVAS_HEIGHT[d])) * z + TOP * 2, cursor: COMMENT_CURSOR }}
              onClick={(e) => {
                const at = spotAt(e.clientX, e.clientY);
                const on = at && at.x >= 0 && at.x <= CANVAS_WIDTH[at.device] && at.y >= 0 && at.y <= (heights[at.device] ?? CANVAS_HEIGHT[at.device]);
                onPlace?.(on ? anchored(at.device, at.x, at.y) : null);
              }}
            />
          )}
          {overlay?.(place)}

          {/* The selection's toolbar, just above it, held in view while the section runs past the top. */}
          {sel && selected && (
            <div className="absolute z-10 flex items-center justify-between gap-2" style={{ top: Math.min(Math.max(sel.top * z - 44, 6, cam.y + 64), (sel.top + sel.height) * z - 44), left: primaryLeft + sel.left * z, width: `calc(${sel.width * z}px * var(--bd-k, 1))`, ...steady("0 100%") }}>
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
                onChange={(e) => {
                  setEditing({ ...editing, value: e.target.value });
                  setText(editing.node, e.target.value || " ");
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
              <div className="mt-1.5 flex items-center justify-between px-1 text-[11.5px] text-muted">
                <span>Enter to keep, Esc to undo</span>
                <span>Shift Enter for a new line</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Dragging the board while panning; frames can't take the pointer away mid-drag. */}
      {panning && <div className="absolute inset-0" />}
    </div>
  );
});
