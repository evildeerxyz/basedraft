"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

/*
 * pello prints its pictures. A photo is drawn at a few pixels per dot and ordered dithered (Bayer
 * 8 × 8) into two or three of the page's own inks, read from the CSS variables, so a new palette
 * prints them in its colors too. When one first comes into view it develops, dark coming up out of
 * the paper; when it's switched to other inks (hovered, or something happens to that person) a
 * scan line passes down it and leaves it printed in the new ones.
 */

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map((v) => (v + 0.5) / 64);

export type Ink = "ink" | "accent" | "page" | "surface" | "night" | "night-2";
const VAR: Record<Ink, string> = { ink: "--pl-ink", accent: "--pl-accent", page: "--pl-page", surface: "--pl-surface", night: "--pl-night", "night-2": "--pl-night-2" };
type RGB = [number, number, number];

let probe: CanvasRenderingContext2D | null = null;
/** A CSS variable's color as sRGB numbers, whatever form it's written in (a hex, a color-mix). */
function rgbOf(el: Element, ink: Ink): RGB {
  const span = document.createElement("span");
  span.style.cssText = `display:none;color:var(${VAR[ink]})`;
  el.appendChild(span);
  const css = getComputedStyle(span).color;
  span.remove();
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return [0, 0, 0];
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "#000";
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = (t: number) => 1 - (1 - t) ** 3;

/** Writes a field of values (0 is the darkest ink, 1 the lightest) into pixels, dithered. */
function print(out: Uint8ClampedArray, value: (i: number) => number, cols: number, rows: number, tones: RGB[], below?: { row: number; tones: RGB[] }) {
  for (let y = 0; y < rows; y++) {
    const t = below && y < below.row ? below.tones : tones;
    const n = t.length - 1;
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const f = Math.min(0.9999, Math.max(0, value(i))) * n;
      const band = Math.min(n - 1, Math.floor(f));
      const c = t[f - band > BAYER[(y & 7) * 8 + (x & 7)] ? band + 1 : band];
      out[i * 4] = c[0];
      out[i * 4 + 1] = c[1];
      out[i * 4 + 2] = c[2];
      out[i * 4 + 3] = 255;
    }
  }
}

export function Dithered({
  src,
  alt = "",
  inks = ["ink", "page"],
  cell = 2,
  focus = [0.5, 0.35],
  develop = true,
  className,
  style,
}: {
  /** The photo, as a path in public/ (it can be swapped for another in basedraft Studio). */
  src: string;
  alt?: string;
  /** Darkest first. Change them and a scan line prints the photo again in the new ones. */
  inks?: Ink[];
  /** Size of a dot, in CSS pixels. */
  cell?: number;
  /** Which part of the photo stays in frame when it's cropped, as fractions across and down. */
  focus?: [number, number];
  develop?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ inks: (next: Ink[]) => void } | null>(null);
  const key = inks.join(",");
  // The inks it's printed in now; changing them doesn't load the photo again (see the second effect).
  const latest = useRef(key);
  const [fx, fy] = focus;

  useEffect(() => {
    const el = host.current!;
    const out = canvas.current!;
    const ctx = out.getContext("2d", { willReadFrequently: true })!;
    let img: HTMLImageElement | null = null;
    let lum = new Float32Array(0);
    let cols = 0;
    let rows = 0;
    let frame: ImageData | null = null;
    let shown: Ink[] = latest.current.split(",") as Ink[];
    let tones: RGB[] = [];
    let p = develop && !still() ? 0 : 1;
    let raf = 0;
    let started = !develop || still();

    const render = (below?: { row: number; tones: RGB[] }) => {
      if (!frame) return;
      print(frame.data, (i) => 1 - (1 - lum[i]) * p, cols, rows, tones, below);
      ctx.putImageData(frame, 0, 0);
    };

    const layout = () => {
      if (!img) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      cols = Math.max(8, Math.round(w / cell));
      rows = Math.max(8, Math.round(h / cell));
      out.width = cols;
      out.height = rows;
      // Cover the box, keeping the focus point in frame.
      const s = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (cols - dw) * fx, (rows - dh) * fy, dw, dh);
      let px: Uint8ClampedArray;
      try {
        px = ctx.getImageData(0, 0, cols, rows).data;
      } catch {
        return; // an image from elsewhere that can't be read back: it stays as drawn.
      }
      lum = new Float32Array(cols * rows);
      const sample: number[] = [];
      for (let i = 0; i < lum.length; i++) {
        lum[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
        if (i % 5 === 0) sample.push(lum[i]);
      }
      // Levels: the darkest and lightest few percent go to the inks' ends, so every photo prints with the same punch.
      sample.sort((a, b) => a - b);
      const lo = sample[Math.floor(sample.length * 0.04)] ?? 0;
      const hi = sample[Math.floor(sample.length * 0.9)] ?? 1;
      for (let i = 0; i < lum.length; i++) lum[i] = Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(0.08, hi - lo))) ** 0.85;
      tones = shown.map((k) => rgbOf(el, k));
      frame = ctx.createImageData(cols, rows);
      render();
    };

    const animate = (ms: number, step: (t: number) => void, done?: () => void) => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        step(t);
        if (t < 1) raf = requestAnimationFrame(tick);
        else done?.();
      };
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (started || !img) return;
      started = true;
      animate(1100, (t) => {
        p = ease(t);
        render();
      });
    };

    api.current = {
      inks: (next) => {
        const to = next.map((k) => rgbOf(el, k));
        shown = next;
        if (!frame || still()) {
          tones = to;
          render();
          return;
        }
        const from = tones;
        animate(
          380,
          (t) => {
            tones = from;
            render({ row: Math.round(ease(t) * rows), tones: to });
          },
          () => {
            tones = to;
            render();
          },
        );
      },
    };

    const io = new IntersectionObserver(([e]) => e.isIntersecting && start(), { threshold: 0.2 });
    const ro = new ResizeObserver(layout);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      img = image;
      layout();
      io.observe(el);
    };
    image.src = src;
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      api.current = null;
    };
  }, [src, cell, develop, fx, fy]);

  useEffect(() => {
    if (latest.current === key) return;
    latest.current = key;
    api.current?.inks(key.split(",") as Ink[]);
  }, [key]);

  return (
    <div ref={host} className={cn("relative overflow-hidden bg-surface", className)} style={style}>
      <canvas ref={canvas} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className="absolute inset-0 size-full [image-rendering:pixelated]" />
    </div>
  );
}

/**
 * A gradient printed the same way: dense ink at one end thinning to paper at the other, rising
 * from the bottom or spreading from a point. With `drift`, it moves slowly while it's on screen.
 */
export function DitherField({ inks = ["accent", "page"], shape = "rise", at = [0.82, 1], reach = 1, cell = 3, drift = false, className }: { inks?: Ink[]; shape?: "rise" | "fall" | "sun"; at?: [number, number]; reach?: number; cell?: number; drift?: boolean; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const key = inks.join(",");
  const [ax, ay] = at;

  useEffect(() => {
    const el = host.current!;
    const out = canvas.current!;
    const ctx = out.getContext("2d")!;
    let cols = 0;
    let rows = 0;
    let frame: ImageData | null = null;
    let tones: RGB[] = [];
    let raf = 0;
    let visible = false;
    let last = 0;
    const moving = drift && !still();

    const draw = (t: number) => {
      if (!frame) return;
      const wobble = moving ? t / 2600 : 0;
      print(
        frame.data,
        (i) => {
          const x = (i % cols) / cols;
          const y = Math.floor(i / cols) / rows;
          // How far from where the ink is densest, as a share of how far it reaches.
          const d = shape === "sun" ? Math.hypot((x - ax) * (cols / rows), y - ay) : shape === "rise" ? 1 - y : y;
          let v = Math.min(1, d / reach);
          if (moving) v += Math.sin(x * 9 + wobble) * 0.035 + Math.sin(y * 7 - wobble * 1.3) * 0.035;
          return v;
        },
        cols,
        rows,
        tones,
      );
      ctx.putImageData(frame, 0, 0);
    };
    const layout = () => {
      cols = Math.max(4, Math.round(el.clientWidth / cell));
      rows = Math.max(4, Math.round(el.clientHeight / cell));
      out.width = cols;
      out.height = rows;
      tones = (key.split(",") as Ink[]).map((k) => rgbOf(el, k));
      frame = ctx.createImageData(cols, rows);
      draw(performance.now());
    };
    const loop = (now: number) => {
      if (now - last > 60) {
        last = now;
        draw(now);
      }
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (moving && visible && !raf) raf = requestAnimationFrame(loop);
    });
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [key, shape, ax, ay, reach, cell, drift]);

  return (
    <div ref={host} aria-hidden className={cn("pointer-events-none overflow-hidden", className)}>
      <canvas ref={canvas} className="size-full [image-rendering:pixelated]" />
    </div>
  );
}
