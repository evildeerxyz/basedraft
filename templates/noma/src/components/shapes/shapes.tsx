"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Path-built shapes. Everything here is drawn with SVG paths or polygon
 * clip-paths, so corners stay sharp (radius 0) while silhouettes get weird.
 */

/** Star/burst path centred in a 100 × 100 box. */
export function burstPath(points = 14, outer = 50, inner = 40) {
  const d: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d.push(`${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M ${d.join(" L ")} Z`;
}

/* ------------------------------------------------------------------------ */
/* Frames: bordered panels with path-cut silhouettes                         */
/* ------------------------------------------------------------------------ */

/** A point as [x %, x px, y %, y px] so one definition serves CSS and SVG. */
type Pt = [number, number, number, number];

const FRAMES = {
  chamfer: (s: number): Pt[] => [
    [0, 0, 0, s],
    [0, s, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 1, -s],
    [1, -s, 1, 0],
    [0, 0, 1, 0],
  ],
  bevel: (s: number): Pt[] => [
    [0, s, 0, 0],
    [1, -s, 0, 0],
    [1, 0, 0, s],
    [1, 0, 1, -s],
    [1, -s, 1, 0],
    [0, s, 1, 0],
    [0, 0, 1, -s],
    [0, 0, 0, s],
  ],
  notch: (s: number): Pt[] => [
    [0, 0, 0, 0],
    [1, -s * 3, 0, 0],
    [1, -s * 3, 0, s],
    [1, 0, 0, s],
    [1, 0, 1, 0],
    [0, 0, 1, 0],
  ],
  tab: (s: number): Pt[] => [
    [0, 0, 0, 0],
    [0.42, 0, 0, 0],
    [0.42, s, 0, s],
    [1, 0, 0, s],
    [1, 0, 1, 0],
    [0, 0, 1, 0],
  ],
  ticket: (s: number): Pt[] => [
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0.5, -s],
    [1, -s, 0.5, 0],
    [1, 0, 0.5, s],
    [1, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 0.5, s],
    [0, s, 0.5, 0],
    [0, 0, 0.5, -s],
  ],
  step: (s: number): Pt[] => [
    [0, 0, 0, 0],
    [0.62, 0, 0, 0],
    [0.62, 0, 0, s],
    [1, 0, 0, s],
    [1, 0, 1, 0],
    [0.38, 0, 1, 0],
    [0.38, 0, 1, -s],
    [0, 0, 1, -s],
  ],
  plain: (): Pt[] => [
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 1, 0],
    [0, 0, 1, 0],
  ],
} as const;

export type FrameCut = keyof typeof FRAMES;

const term = (pct: number, px: number) => (px === 0 ? `${pct * 100}%` : `calc(${pct * 100}% ${px < 0 ? "-" : "+"} ${Math.abs(px)}px)`);

/** CSS clip-path for a frame cut (works during SSR, no measuring). */
export function cutPath(cut: FrameCut, size = 18) {
  return `polygon(${FRAMES[cut](size)
    .map(([xp, xo, yp, yo]) => `${term(xp, xo)} ${term(yp, yo)}`)
    .join(", ")})`;
}

function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // offset sizes include padding and ignore transforms, which is what the outline needs.
    const observer = new ResizeObserver(() => setSize([el.offsetWidth, el.offsetHeight]));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * Panel with a path-cut silhouette and a 1px outline that follows the cut.
 * The fill is a clip-path (correct on first paint); the outline is an SVG
 * polygon drawn at 2px and half clipped away, so every edge reads as 1px.
 */
export function Frame({
  cut = "chamfer",
  size = 18,
  fill = "var(--surface)",
  stroke = "var(--line-strong)",
  dashed = false,
  className,
  style,
  children,
}: {
  cut?: FrameCut;
  size?: number;
  fill?: string;
  stroke?: string;
  dashed?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const [ref, box] = useSize();
  const points = box
    ? FRAMES[cut](size)
        .map(([xp, xo, yp, yo]) => `${xp * box[0] + xo},${yp * box[1] + yo}`)
        .join(" ")
    : null;
  return (
    <div ref={ref} className={cn("relative", className)} style={{ clipPath: cutPath(cut, size), background: fill, ...style }}>
      {points && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
          <polygon points={points} fill="none" stroke={stroke} strokeWidth={2} strokeDasharray={dashed ? "6 5" : undefined} />
        </svg>
      )}
      {children}
    </div>
  );
}

/** Rubber stamp that slams onto the page (approvals). */
export function Stamp({ show, label = "Approved", sub, color = "var(--ok)", className }: { show: boolean; label?: string; sub?: string; color?: string; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      initial={false}
      animate={show ? { opacity: 1, scale: 1, rotate: -14 } : { opacity: 0, scale: 1.7, rotate: -4 }}
      transition={show ? { type: "spring", stiffness: 520, damping: 22 } : { duration: 0.2 }}
    >
      <path d={burstPath(22, 49, 45)} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      <circle cx="50" cy="50" r="37" fill="none" stroke={color} strokeWidth={1.2} strokeDasharray="2.5 2" />
      <text x="50" y={sub ? 52 : 55} textAnchor="middle" fill={color} style={{ font: "700 13px var(--font-geist-mono), monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </text>
      {sub && (
        <text x="50" y="65" textAnchor="middle" fill={color} style={{ font: "500 7px var(--font-geist-mono), monospace" }}>
          {sub}
        </text>
      )}
    </motion.svg>
  );
}

/** Small path glyphs used as bullets and markers. */
export function Glyph({ shape, className, color = "currentColor" }: { shape: "diamond" | "triangle" | "burst" | "cross" | "stairs" | "ring"; className?: string; color?: string }) {
  const d = {
    diamond: "M50 4 L96 50 L50 96 L4 50 Z",
    triangle: "M50 6 L96 90 L4 90 Z",
    burst: burstPath(12, 50, 34),
    cross: "M34 0 L66 0 L66 34 L100 34 L100 66 L66 66 L66 100 L34 100 L34 66 L0 66 L0 34 L34 34 Z",
    stairs: "M0 100 L0 70 L18 70 L18 48 L38 48 L38 26 L60 26 L60 8 L84 8 L84 0 L100 0 L100 100 Z",
    ring: "",
  }[shape];
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      {shape === "ring" ? <path d="M50 10 L93 86 L7 86 Z" fill="none" stroke={color} strokeWidth={12} strokeLinejoin="round" strokeDasharray="22 14" /> : <path d={d} fill={color} />}
    </svg>
  );
}

/** Polygon points (in %) for a starburst. */
function burstPoints(points: number, outer: number, inner: number) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    return `${(50 + Math.cos(a) * r).toFixed(2)}% ${(50 + Math.sin(a) * r).toFixed(2)}%`;
  }).join(", ");
}

/** Silhouettes for the printed fields behind product moments (CSS polygons, so they scale). */
const BACKDROPS = {
  burst: `polygon(${burstPoints(18, 50, 41)})`,
  zigzag:
    "polygon(0 8%, 8% 0, 16% 8%, 24% 0, 32% 8%, 40% 0, 48% 8%, 56% 0, 64% 8%, 72% 0, 80% 8%, 88% 0, 96% 8%, 100% 4%, 100% 92%, 92% 100%, 84% 92%, 76% 100%, 68% 92%, 60% 100%, 52% 92%, 44% 100%, 36% 92%, 28% 100%, 20% 92%, 12% 100%, 4% 92%, 0 96%)",
  stairs: "polygon(0 100%, 0 70%, 18% 70%, 18% 48%, 38% 48%, 38% 26%, 60% 26%, 60% 8%, 84% 8%, 84% 0, 100% 0, 100% 100%)",
  wedge: "polygon(0 14%, 100% 0, 92% 100%, 6% 88%)",
  cross: "polygon(30% 0, 70% 0, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0 70%, 0 30%, 30% 30%)",
} as const;

export type Backdrop = keyof typeof BACKDROPS;

/** A path-cut field printed in ordered dither, the same texture as the WebGL scenes. */
export function Backdrop({ shape, color = "var(--accent)", className }: { shape: Backdrop; color?: string; className?: string }) {
  return (
    <div aria-hidden className={cn("absolute", className)} style={{ clipPath: BACKDROPS[shape], color }}>
      <div className="dither-25 absolute inset-0" />
    </div>
  );
}

/** Zigzag edge strip, used to tear one band into the next. */
export function Zigzag({ color, flip = false, className }: { color: string; flip?: boolean; className?: string }) {
  const teeth = Array.from({ length: 80 }, (_, i) => `L ${i * 2 + 1} ${flip ? 0 : 6} L ${i * 2 + 2} ${flip ? 6 : 0}`).join(" ");
  return (
    <svg viewBox="0 0 160 6" preserveAspectRatio="none" aria-hidden className={cn("block h-3 w-full", className)}>
      <path d={flip ? `M 0 6 L 0 6 ${teeth} L 160 0 L 0 0 Z` : `M 0 0 ${teeth} L 160 6 L 0 6 Z`} fill={color} />
    </svg>
  );
}

/** The Noma mark drawn as a big dashed path. */
export function DashedMark({ className, stroke = "var(--ink)", weight = 2.4 }: { className?: string; stroke?: string; weight?: number }) {
  return (
    <svg viewBox="0 0 44 40" fill="none" aria-hidden className={className}>
      <path
        d="M19.4 4.6a3 3 0 0 1 5.2 0l15.9 27.6a3 3 0 0 1-2.6 4.5H6.1a3 3 0 0 1-2.6-4.5Z"
        stroke={stroke}
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 5"
        strokeDashoffset="3"
      />
    </svg>
  );
}
