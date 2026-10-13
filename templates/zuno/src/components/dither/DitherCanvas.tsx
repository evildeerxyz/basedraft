"use client";

import { useEffect, useRef } from "react";
import { bayer8 } from "@/lib/dither";
import { cn, hexToRgb } from "@/lib/utils";
import { pal } from "@/lib/palette";

/** Returns coverage 0 to 1 for a cell. u/v are 0 to 1 across the canvas (v from top). */
export type DitherField = (u: number, v: number, aspect: number) => number;

interface DitherCanvasProps {
  field: DitherField;
  color?: string;
  opacity?: number;
  pixelSize?: number;
  className?: string;
}

/**
 * Static, CPU-rendered ordered dither for gradients, glows and portraits.
 * Cheap enough to sprinkle everywhere; re-renders only on resize.
 */
export function DitherCanvas({
  field,
  color = pal.accent,
  opacity = 1,
  pixelSize = 3,
  className,
}: DitherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef(field);

  useEffect(() => {
    fieldRef.current = field;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const [r, g, b] = hexToRgb(color);
    const a = Math.round(opacity * 255);

    const paint = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.ceil(rect.width / pixelSize));
      const h = Math.max(1, Math.ceil(rect.height / pixelSize));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w * pixelSize}px`;
      canvas.style.height = `${h * pixelSize}px`;
      const img = ctx.createImageData(w, h);
      const data = img.data;
      const aspect = w / h;
      const fx = fieldRef.current;
      for (let y = 0; y < h; y++) {
        const v = h > 1 ? y / (h - 1) : 0;
        for (let x = 0; x < w; x++) {
          const u = w > 1 ? x / (w - 1) : 0;
          if (fx(u, v, aspect) > bayer8(x, y)) {
            const i = (y * w + x) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(host);
    return () => ro.disconnect();
  }, [color, opacity, pixelSize]);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="pixelated absolute left-0 top-0 block" />
    </div>
  );
}

/* A few reusable fields. */
export const fields = {
  fadeUp: (power = 1.6): DitherField => (_u, v) => Math.pow(v, power),
  fadeDown: (power = 1.6): DitherField => (_u, v) => Math.pow(1 - v, power),
  radial:
    (cx = 0.5, cy = 0.5, radius = 0.6, power = 1.4): DitherField =>
    (u, v, aspect) => {
      const dx = (u - cx) * aspect;
      const dy = v - cy;
      const d = Math.sqrt(dx * dx + dy * dy) / radius;
      return Math.pow(Math.max(0, 1 - d), power);
    },
  ellipse:
    (cx = 0.5, cy = 0.5, rx = 0.45, ry = 0.35, power = 1.2): DitherField =>
    (u, v) => {
      const dx = (u - cx) / rx;
      const dy = (v - cy) / ry;
      return Math.pow(Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)), power);
    },
};
