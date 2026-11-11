"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";

/*
 * Any picture as an ordered dither: its light read cell by cell and printed as dots, the way a
 * newspaper or an old screen would, in ink on paper, in any color, or in the picture's own colors
 * stepped down, as squares or as round dots. It develops when it first comes into view, its dots
 * arriving in the matrix's order, and under the pointer the photo itself shows through a dissolve
 * that follows the same order. Drawn on a canvas, so the picture has to come from your own site
 * or from one that allows it (CORS).
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/** An ordered-dither matrix of size n, as thresholds between 0 and 1, built by doubling the 2 by 2. */
function matrix(n: 2 | 4 | 8) {
  let m = [[0, 2], [3, 1]];
  while (m.length < n) {
    const s = m.length;
    m = Array.from({ length: s * 2 }, (_, y) => Array.from({ length: s * 2 }, (_, x) => 4 * m[y % s][x % s] + [[0, 2], [3, 1]][Math.floor(y / s)][Math.floor(x / s)]));
  }
  return m.map((row) => row.map((v) => (v + 0.5) / (n * n)));
}

type Rgba = [number, number, number, number];

/** A computed CSS color, in any color space, as red, green, blue and alpha from 0 to 255: painted once on a tiny canvas and read back. */
function toRgba(color: string): Rgba {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = color;
  g.fillRect(0, 0, 1, 1);
  const d = g.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2], d[3]];
}

/** What's behind the dots: the paper, or else the nearest background up the page that's mostly solid. White if there's none. */
function backdrop(el: HTMLElement | null): Rgba {
  for (let n = el; n; n = n.parentElement) {
    const c = toRgba(getComputedStyle(n).backgroundColor);
    if (c[3] > 128) return c;
  }
  return [255, 255, 255, 255];
}

/** A color's lightness, 0 to 1, from its red, green and blue. */
const lightness = (c: Rgba) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

/* How long the dots take to arrive, and the photo to show through or leave, in ms. */
const DEVELOP = 1100;
const REVEAL = 460;
const ease = (t: number) => 1 - (1 - t) ** 3;

export type DitherImageProps = Omit<ComponentProps<"div">, "children"> & {
  src: string;
  /** What the picture shows, for a screen reader. */
  alt: string;
  /** One dot's size, in CSS pixels. */
  cell?: number;
  /** The ordered-dither matrix: 2 is coarse and graphic, 8 has the most shades. */
  matrix?: 2 | 4 | 8;
  /** Ink in one color, or the picture's own colors stepped down. */
  palette?: "ink" | "color";
  /** The dots' color, for ink: any CSS color. The text color by default. */
  ink?: string;
  /** What's behind the dots: any CSS color. */
  paper?: string;
  /** How many tones: 2 is pure ink or paper; more adds lighter inks, or more steps of each color. */
  levels?: number;
  /** Square cells, or round dots like a halftone. */
  shape?: "square" | "round";
  /** Lifts or sinks the picture's light before it's dithered, from -1 to 1. */
  brightness?: number;
  /** Stretches its light apart (above 1) or together (below 1). */
  contrast?: number;
  /** Ink where the picture is light rather than dark. On auto, an ink lighter than what's behind it prints the light, so the picture reads true on a dark page too. */
  invert?: boolean | "auto";
  /** Stretches the picture's light to the whole range first, so a dull photo still prints with real blacks and whites. */
  normalize?: boolean;
  /** Its width over its height, kept before the picture loads so nothing below shifts. The picture's own once it loads. */
  ratio?: number;
  /** How it fills its box. */
  fit?: "cover" | "contain";
  /** Shows the photo through a dissolve on hover, or never. */
  reveal?: "hover" | "none";
  /** Shows the photo, from outside: overrides hover. */
  revealed?: boolean;
  /** Its dots arrive in the matrix's order the first time it comes into view. */
  develop?: boolean;
};

export function DitherImage({
  src,
  alt,
  cell = 3,
  matrix: size = 4,
  palette = "ink",
  ink = "currentColor",
  paper = "transparent",
  levels = 2,
  shape = "square",
  brightness = 0,
  contrast = 1,
  invert = "auto",
  normalize = true,
  ratio,
  fit = "cover",
  reveal = "hover",
  revealed,
  develop = true,
  className,
  style,
  onPointerEnter,
  onPointerLeave,
  ...props
}: DitherImageProps) {
  const box = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [picture, setPicture] = useState<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<number | null>(null);
  const [hover, setHover] = useState(false);
  const [seen, setSeen] = useState(!develop);
  const [near, setNear] = useState(false);
  // What's drawn: the grid, each cell's finished color and threshold, and where the two animations are.
  const live = useRef<{ cols: number; rows: number; w: number; h: number; out: Uint8ClampedArray; thr: Float32Array; dev: number; rev: number; still: boolean; ink: string; paint?: () => void }>({ cols: 0, rows: 0, w: 0, h: 0, out: new Uint8ClampedArray(0), thr: new Float32Array(0), dev: develop ? 0 : 1, rev: 0, still: false, ink: "" });

  // Load the picture once it's near the screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
    let gone = false;
    const im = new Image();
    if (/^https?:\/\//.test(src) && !src.startsWith(location.origin)) im.crossOrigin = "anonymous";
    im.decoding = "async";
    im.onload = () => {
      if (gone) return;
      setNatural(im.naturalWidth / im.naturalHeight);
      setPicture(im);
    };
    im.src = src;
    return () => {
      gone = true;
    };
  }, [near, src]);

  // Develop once a quarter of it is on screen.
  useEffect(() => {
    const el = box.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  // Read the picture into cells and dither it, again whenever its size, its look or the theme changes.
  useEffect(() => {
    const el = box.current;
    const canvas = dots.current;
    const top = photo.current;
    if (!el || !canvas || !top || !picture) return;
    const s = live.current;
    s.still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const thresholds = matrix(size);
    const n = Math.max(2, Math.round(levels));
    let frame = 0;

    const build = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      // The picture at one pixel a cell, fitted the way the box asks.
      const small = document.createElement("canvas");
      small.width = cols;
      small.height = rows;
      const g = small.getContext("2d", { willReadFrequently: true })!;
      const scale = (fit === "cover" ? Math.max : Math.min)(cols / picture.naturalWidth, rows / picture.naturalHeight);
      const dw = picture.naturalWidth * scale;
      const dh = picture.naturalHeight * scale;
      g.imageSmoothingQuality = "high";
      g.drawImage(picture, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
      const behind = backdrop(el);
      s.ink = `${getComputedStyle(probe.current!).color} on ${behind}`;
      const [ir, ig, ib, ia] = toRgba(getComputedStyle(probe.current!).color);
      let src: Uint8ClampedArray;
      try {
        src = g.getImageData(0, 0, cols, rows).data;
      } catch {
        // A picture from a site that doesn't allow it can't be read: show it as it is.
        s.cols = 0;
        return;
      }
      // The picture's darkest and lightest few percent, to stretch its light between.
      const light = (p: number) => (0.2126 * src[p] + 0.7152 * src[p + 1] + 0.0722 * src[p + 2]) / 255;
      let lo = 0;
      let hi = 1;
      if (normalize) {
        const hist = new Uint32Array(256);
        let total = 0;
        for (let p = 0; p < src.length; p += 4) {
          if (src[p + 3] < 128) continue;
          hist[Math.round(light(p) * 255)]++;
          total++;
        }
        let seen = 0;
        for (let b = 0; b < 256; b++) if ((seen += hist[b]) >= total * 0.02) { lo = b / 255; break; }
        seen = 0;
        for (let b = 255; b >= 0; b--) if ((seen += hist[b]) >= total * 0.02) { hi = b / 255; break; }
        if (hi - lo < 0.1) [lo, hi] = [0, 1];
      }
      // An ink lighter than what's behind it prints the light; a darker one, the shadows.
      const flip = invert === "auto" ? lightness([ir, ig, ib, ia]) > lightness(behind) : invert;
      const out = new Uint8ClampedArray(cols * rows * 4);
      const thr = new Float32Array(cols * rows);
      const step = (v: number, t: number) => {
        const q = Math.min(1, Math.max(0, v)) * (n - 1);
        const base = Math.floor(q);
        return Math.min(n - 1, base + (q - base > t ? 1 : 0)) / (n - 1);
      };
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const t = thresholds[y % size][x % size];
          thr[i] = t;
          const p = i * 4;
          if (src[p + 3] < 128) continue;
          const adjust = (v: number) => ((v / 255 - lo) / (hi - lo) - 0.5) * contrast + 0.5 + brightness;
          if (palette === "color") {
            out[p] = step(adjust(src[p]), t) * 255;
            out[p + 1] = step(adjust(src[p + 1]), t) * 255;
            out[p + 2] = step(adjust(src[p + 2]), t) * 255;
            out[p + 3] = 255;
          } else {
            const l = adjust(light(p) * 255);
            const amount = step(flip ? l : 1 - l, t);
            out[p] = ir;
            out[p + 1] = ig;
            out[p + 2] = ib;
            out[p + 3] = amount * ia;
          }
        }
      }
      Object.assign(s, { cols, rows, w, h, out, thr });
      canvas.width = cols;
      canvas.height = rows;
      canvas.style.width = `${cols * cell}px`;
      canvas.style.height = `${rows * cell}px`;
      // The photo, at full sharpness, for the dissolve.
      const dpr = Math.min(2, devicePixelRatio || 1);
      top.width = Math.round(w * dpr);
      top.height = Math.round(h * dpr);
      top.style.width = `${w}px`;
      top.style.height = `${h}px`;
      paint();
    };

    // The dots that have arrived, and over them the photo in the cells it has reached.
    const mask = document.createElement("canvas");
    const paint = () => {
      const { cols, rows, out, thr, dev, rev } = s;
      if (!cols) return;
      const g = canvas.getContext("2d")!;
      const img = g.createImageData(cols, rows);
      for (let i = 0; i < thr.length; i++) {
        if (thr[i] >= dev) continue;
        const p = i * 4;
        img.data[p] = out[p];
        img.data[p + 1] = out[p + 1];
        img.data[p + 2] = out[p + 2];
        img.data[p + 3] = out[p + 3];
      }
      g.putImageData(img, 0, 0);
      const t = top.getContext("2d")!;
      t.clearRect(0, 0, top.width, top.height);
      if (rev <= 0) return;
      const scale = (fit === "cover" ? Math.max : Math.min)(top.width / picture.naturalWidth, top.height / picture.naturalHeight);
      const dw = picture.naturalWidth * scale;
      const dh = picture.naturalHeight * scale;
      t.globalCompositeOperation = "source-over";
      t.imageSmoothingEnabled = true;
      t.drawImage(picture, (top.width - dw) / 2, (top.height - dh) / 2, dw, dh);
      if (rev >= 1) return;
      mask.width = cols;
      mask.height = rows;
      const m = mask.getContext("2d")!;
      const mi = m.createImageData(cols, rows);
      for (let i = 0; i < thr.length; i++) if (thr[i] < rev) mi.data[i * 4 + 3] = 255;
      m.putImageData(mi, 0, 0);
      t.globalCompositeOperation = "destination-in";
      t.imageSmoothingEnabled = false;
      t.drawImage(mask, 0, 0, cols * cell * (top.width / s.w), rows * cell * (top.height / s.h));
      t.globalCompositeOperation = "source-over";
    };
    s.paint = paint;

    build();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    });
    ro.observe(el);
    // A theme switch can change what ink means: when it does, dither again.
    const mo = new MutationObserver(() => {
      if (!probe.current || `${getComputedStyle(probe.current).color} on ${backdrop(el)}` === s.ink) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    });
    mo.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["class", "data-theme"] });
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mo.disconnect();
    };
  }, [picture, cell, size, palette, ink, levels, brightness, contrast, invert, normalize, fit]);

  // Develop, and show the photo through, toward where they should be.
  const show = revealed ?? (reveal === "hover" && hover);
  useEffect(() => {
    const s = live.current;
    if (!picture) return;
    const targets = { dev: seen ? 1 : 0, rev: show ? 1 : 0 };
    const from = { dev: s.dev, rev: s.rev };
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      let moving = false;
      for (const k of ["dev", "rev"] as const) {
        if (from[k] === targets[k]) continue;
        const span = (k === "dev" ? DEVELOP : REVEAL) * Math.abs(targets[k] - from[k]);
        const t = s.still || span <= 0 ? 1 : Math.min(1, (now - t0) / span);
        s[k] = from[k] + (targets[k] - from[k]) * ease(t);
        if (t < 1) moving = true;
      }
      s.paint?.();
      if (moving) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [picture, seen, show]);

  const round: CSSProperties | undefined =
    shape === "round"
      ? {
          maskImage: "radial-gradient(circle closest-side, #000 82%, transparent 92%)",
          WebkitMaskImage: "radial-gradient(circle closest-side, #000 82%, transparent 92%)",
          maskSize: `${cell}px ${cell}px`,
          WebkitMaskSize: `${cell}px ${cell}px`,
        }
      : undefined;

  return (
    <div
      ref={box}
      role="img"
      aria-label={alt}
      onPointerEnter={(e) => {
        setHover(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        setHover(false);
        onPointerLeave?.(e);
      }}
      className={cx("relative isolate overflow-hidden", className)}
      style={{ aspectRatio: ratio ?? natural ?? undefined, backgroundColor: paper, ...style }}
      {...props}
    >
      <span ref={probe} aria-hidden className="hidden" style={{ color: ink }} />
      <canvas ref={dots} aria-hidden className="absolute left-0 top-0 [image-rendering:pixelated]" style={round} />
      <canvas ref={photo} aria-hidden className="absolute left-0 top-0" />
    </div>
  );
}
