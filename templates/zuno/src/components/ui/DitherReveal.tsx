"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { ditherMasks } from "@/lib/dither";

interface DitherRevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Start explicitly; defaults to when scrolled into view. */
  play?: boolean;
  delay?: number;
  duration?: number;
  cell?: number;
}

const maskStyle = (url: string, size: number): CSSProperties => ({
  maskImage: url,
  WebkitMaskImage: url,
  maskSize: `${size}px ${size}px`,
  WebkitMaskSize: `${size}px ${size}px`,
});

/**
 * Prints content in through an ordered-dither mask: 16 Bayer levels step from
 * empty to solid, so text materialises pixel by pixel instead of fading.
 */
export function DitherReveal({ children, as: Tag = "div", className, play, delay = 0, duration = 0.65, cell = 3 }: DitherRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const active = play ?? inView;
  const masks = ditherMasks(cell);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.maskImage = "none";
      el.style.webkitMaskImage = "none";
      return;
    }
    let raf = 0;
    const start = performance.now() + delay * 1000;
    let last = -1;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / (duration * 1000)));
      const k = Math.round(p * 16);
      if (k !== last) {
        last = k;
        const m = k >= 16 ? "none" : masks[k];
        el.style.maskImage = m;
        el.style.webkitMaskImage = m;
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, delay, duration, masks]);

  return (
    <Tag ref={ref} className={className} style={maskStyle(masks[0], cell * 4)}>
      {children}
    </Tag>
  );
}
