"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/*
 * The heroes' light, dithered: where a soft blur used to glow in the corners, the same blue, lilac
 * and mint light is set in pixels that switch on in an 8×8 Bayer order as it gets brighter, so a
 * gradient becomes basedraft's ordered dither. The middle, where the words sit, stays clear. On arriving the light develops
 * over a second, then drifts slowly while the hero is on screen; with reduced motion it's drawn
 * once and stays.
 */

/* The order pixels switch on in as the light rises: an even pattern rather than noise. */
const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
/** A pixel's size, in CSS px. */
const CELL = 3;

type RGB = readonly [number, number, number];
/* The hero's own colors, a step deeper than its old glows, since a pixel is either on or off. */
const BLUE: RGB = [160, 188, 244];
const LILAC: RGB = [206, 190, 242];
const MINT: RGB = [170, 226, 204];

/** A light: where it sits and how far it reaches across and down, as fractions of the hero. */
type Light = { x: number; y: number; rx: number; ry: number; rgb: RGB };

/* Where the lights sit: on the home page as its glows did, and turned around on a library's front page. */
const CORNERS: Record<"home" | "library", Light[]> = {
  home: [
    { x: 0.08, y: 0, rx: 0.48, ry: 0.62, rgb: BLUE },
    { x: 0.94, y: 0.06, rx: 0.4, ry: 0.55, rgb: LILAC },
    { x: 0.78, y: 1.08, rx: 0.46, ry: 0.52, rgb: MINT },
  ],
  library: [
    { x: 0.92, y: 0, rx: 0.48, ry: 0.62, rgb: BLUE },
    { x: 0.58, y: 1.12, rx: 0.4, ry: 0.55, rgb: LILAC },
    { x: 0.02, y: 0.96, rx: 0.46, ry: 0.52, rgb: MINT },
  ],
};
/** How far a point is clear of the words in the middle: 0 among them, 1 out at the edges. */
function clear(nx: number, ny: number) {
  const e = Math.hypot((nx - 0.5) / 0.72, (ny - 0.5) / 0.66);
  return Math.min(1, Math.max(0, (e - 0.5) / 0.45));
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, lights: Light[], k: number, t: number) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  // Each light wanders a little around its place.
  const at = lights.map((l, j) => ({ ...l, x: l.x + 0.018 * Math.sin(t * 0.32 + j * 2.1), y: l.y + 0.018 * Math.cos(t * 0.27 + j * 1.7) }));
  for (let y = 0; y < h; y++) {
    const ny = (y + 0.5) / h;
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5) / w;
      const room = clear(nx, ny);
      if (!room) continue;
      // The lights add up, and the brightest here gives the pixel its color.
      let none = 1;
      let best = 0;
      let rgb: RGB = BLUE;
      for (const l of at) {
        const dist = Math.hypot((nx - l.x) / l.rx, (ny - l.y) / l.ry);
        if (dist >= 1) continue;
        const li = Math.pow(1 - dist, 1.35);
        none *= 1 - li;
        if (li > best) {
          best = li;
          rgb = l.rgb;
        }
      }
      if ((1 - none) * 0.92 * room * k <= (BAYER[(y & 7) * 8 + (x & 7)] + 0.5) / 64) continue;
      const i = (y * w + x) * 4;
      d[i] = rgb[0];
      d[i + 1] = rgb[1];
      d[i + 2] = rgb[2];
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function DitherLight({ layout }: { layout: "home" | "library" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const still = !!useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;
    const lights = CORNERS[layout];
    let [w, h] = [0, 0];
    let raf = 0;
    let last = 0;
    let shown = true;
    const start = performance.now();
    const paint = (now: number) => {
      // Nothing to draw on until the hero has a size.
      if (!w || !h) return;
      const t = (now - start) / 1000;
      // The light develops over its first 1.4 seconds, easing out.
      const k = still ? 1 : 1 - Math.pow(1 - Math.min(1, t / 1.4), 3);
      draw(ctx, w, h, lights, k, still ? 0 : t);
    };
    const fit = () => {
      const r = host.getBoundingClientRect();
      [w, h] = [Math.max(1, Math.ceil(r.width / CELL)), Math.max(1, Math.ceil(r.height / CELL))];
      [canvas.width, canvas.height] = [w, h];
      paint(performance.now());
    };
    // About eleven frames a second is enough for a light this slow, and only while it can be seen.
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!shown || document.hidden || now - last < 90) return;
      last = now;
      paint(now);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => (shown = e.isIntersecting));
    io.observe(host);
    if (!still) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [layout, still]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full [image-rendering:pixelated]" />;
}
