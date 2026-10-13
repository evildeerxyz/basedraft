"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/*
 * Stock headshots, printed the same way as the WebGL scenes: luminance is
 * auto-levelled, then ordered (Bayer 4×4) dithered into four warm tones.
 * Highlights stay light in both themes, so faces never turn into negatives.
 */

/* Darkest to lightest. */
const LIGHT = ["#231f19", "#8f806a", "#d6c9b2", "#f8f4ec"];
const DARK = ["#14110e", "#4f463b", "#9d907c", "#e2d9c9"];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

function themeOf(el: Element | null) {
  const scoped = el?.closest("[data-theme]") as HTMLElement | null;
  return (scoped?.dataset.theme ?? document.documentElement.dataset.theme) === "dark" ? "dark" : "light";
}

export function slugOf(name: string) {
  return name.toLowerCase().replace(/[^a-z]+/g, "-");
}

export function Portrait({ name, className, cell = 2 }: { name: string; className?: string; cell?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => setImage(img);
    img.src = `/people/${slugOf(name)}.jpg`;
  }, [name]);

  useEffect(() => {
    const update = () => setTheme(themeOf(host.current));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = host.current;
    const out = canvas.current;
    if (!el || !out || !image) return;
    const draw = () => {
      const cols = Math.max(8, Math.round(el.clientWidth / cell));
      const rows = Math.max(8, Math.round(el.clientHeight / cell));
      out.width = cols;
      out.height = rows;
      const ctx = out.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      // object-fit: cover
      const scale = Math.max(cols / image.width, rows / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      ctx.drawImage(image, (cols - w) / 2, (rows - h) / 2, w, h);
      const frame = ctx.getImageData(0, 0, cols, rows);
      const px = frame.data;
      const lum = new Float32Array(cols * rows);
      const sorted: number[] = [];
      for (let i = 0; i < lum.length; i++) {
        lum[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
        if (i % 7 === 0) sorted.push(lum[i]);
      }
      sorted.sort((a, b) => a - b);
      const lo = sorted[Math.floor(sorted.length * 0.02)];
      const hi = sorted[Math.floor(sorted.length * 0.985)];
      const tones = (theme === "dark" ? DARK : LIGHT).map(rgb);
      const steps = tones.length - 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const v = Math.pow(Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(0.05, hi - lo))), 1.2) * steps;
          const band = Math.min(steps - 1, Math.floor(v));
          const c = tones[v - band > BAYER[(y % 4) * 4 + (x % 4)] ? band + 1 : band];
          px[i * 4] = c[0];
          px[i * 4 + 1] = c[1];
          px[i * 4 + 2] = c[2];
          px[i * 4 + 3] = 255;
        }
      }
      ctx.putImageData(frame, 0, 0);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [image, theme, cell]);

  return (
    <div ref={host} className={cn("relative overflow-hidden bg-surface-2", className)}>
      <canvas ref={canvas} role="img" aria-label={`Portrait of ${name}`} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
    </div>
  );
}
