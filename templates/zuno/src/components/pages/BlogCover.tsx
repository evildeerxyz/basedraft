"use client";

import { useMemo } from "react";
import { mulberry32 } from "@/lib/utils";
import { DitherCanvas, type DitherField } from "../dither/DitherCanvas";

/** Procedural dithered cover art, unique per post. */
function coverField(seed: number): DitherField {
  const rand = mulberry32(seed * 131 + 7);
  const kind = seed % 4;
  const a = rand() * 6;
  const b = 0.3 + rand() * 0.4;
  if (kind === 0) {
    // layered ridges, like a terrain chart
    return (u, v) => {
      let best = 0;
      for (let k = 0; k < 4; k++) {
        const h = 0.35 + k * 0.14 + 0.08 * Math.sin(u * (5 + k * 2) + a + k);
        if (v > h) best = Math.max(best, 0.9 - (v - h) * (1.8 - k * 0.2) - k * 0.12);
      }
      return best;
    };
  }
  if (kind === 1) {
    // lit sphere
    return (u, v, aspect) => {
      const x = (u - 0.62) * aspect;
      const y = v - b - 0.1;
      const d = Math.hypot(x, y) / 0.34;
      if (d > 1) return Math.max(0, 0.28 - (d - 1) * 0.9);
      const z = Math.sqrt(1 - d * d);
      return Math.max(0, -x * 1.2 - y * 1.4 + z * 0.9) * 0.95;
    };
  }
  if (kind === 2) {
    // concentric rings
    return (u, v, aspect) => {
      const d = Math.hypot((u - b) * aspect, v - 0.55);
      return (0.5 + 0.5 * Math.sin(d * 34 - a)) * Math.max(0, 1 - d * 1.2);
    };
  }
  // diagonal sweep
  return (u, v) => {
    const t = u * 0.7 + v * 0.6 + 0.08 * Math.sin(v * 9 + a);
    return Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.2)), 2) * (1 - v * 0.4);
  };
}

export function BlogCover({ seed, className }: { seed: number; className?: string }) {
  const field = useMemo(() => coverField(seed), [seed]);
  return (
    <div className={`relative overflow-hidden bg-ink-3 ${className ?? ""}`}>
      <DitherCanvas field={field} color="#c8ff3e" pixelSize={3} />
    </div>
  );
}
