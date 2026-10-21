"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * A field of dots printed on a surface (see .bd-dots in globals.css), alive in two ways: patches
 * of it flicker on in non-photo blue, each on its own rhythm, and the marks under the pointer
 * light up. Both stand down for anyone who asks for less motion.
 *
 * It sits behind everything in its card (the card is `relative isolate`), so it can never be
 * hovered itself: the pointer is followed on the window, and the field lights only while the
 * pointer is over it.
 */

/** Where a patch flickers: across the field (0 to 1), down it in px, how big, how often, and how far into its cycle it starts. */
type Patch = { x: number; top: number; size: number; every: number; delay: number };

/* Along both edges of a wide card, where the field is thickest, never two in step. */
const EDGES: Patch[] = [
  { x: 0.05, top: 40, size: 220, every: 6.8, delay: -1.2 },
  { x: 0.16, top: 230, size: 180, every: 8.4, delay: -4.6 },
  { x: 0.06, top: 470, size: 200, every: 7.4, delay: -2.8 },
  { x: 0.95, top: 30, size: 240, every: 7.1, delay: -0.3 },
  { x: 0.83, top: 190, size: 170, every: 9.2, delay: -5.4 },
  { x: 0.94, top: 420, size: 210, every: 6.2, delay: -3.6 },
];

/** Clear in the middle, where the words sit, and thickest at the edges. */
export const EDGE_FADE = "radial-gradient(64% 60% at 50% 38%, transparent 30%, rgb(0 0 0 / 0.4) 62%, #000 100%)";

export function DotField({ fade = EDGE_FADE, patches = EDGES, layers = 2, className }: { fade?: string; patches?: Patch[]; /** How many copies of the tile are laid together: more is darker. */ layers?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(field);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => ro.disconnect();

    // The spotlight's place, written as custom properties once a frame.
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const place = () => {
      frame = 0;
      if (!pointer) return;
      const box = field.getBoundingClientRect();
      const x = pointer.x - box.left;
      const y = pointer.y - box.top;
      field.style.setProperty("--spot-x", `${x}px`);
      field.style.setProperty("--spot-y", `${y}px`);
      field.toggleAttribute("data-spot-lit", x >= 0 && y >= 0 && x <= box.width && y <= box.height);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    const move = (e: PointerEvent) => {
      // A finger has no hover: a light left behind by a tap would stick.
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const leave = () => {
      pointer = null;
      field.removeAttribute("data-spot-lit");
    };
    window.addEventListener("pointermove", move, { passive: true });
    // Scrolling moves the field under a pointer that's standing still.
    window.addEventListener("scroll", schedule, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", schedule);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)} style={{ "--dot-fade": fade } as CSSProperties}>
      {Array.from({ length: layers }, (_, i) => (
        <span key={i} className="bd-dots" />
      ))}
      {/* Placed once the field's width is known. Each patch's tile is set back by the patch's own offset, so it lights the field's marks rather than adding its own between them. */}
      {width > 0 &&
        patches.map((p) => {
          const left = Math.round(p.x * width - p.size / 2);
          const at = `${-left}px ${-p.top}px`;
          return (
            <span
              key={`${p.x}-${p.top}`}
              className="bd-dots-blink"
              style={{ left, top: p.top, width: p.size, height: p.size, maskPosition: `center, ${at}`, WebkitMaskPosition: `center, ${at}`, "--blink-for": `${p.every}s`, "--blink-delay": `${p.delay}s` } as CSSProperties}
            />
          );
        })}
      <span className="bd-dots-spot" />
    </div>
  );
}
