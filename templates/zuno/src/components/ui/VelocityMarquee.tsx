"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useReducedMotion,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface VelocityMarqueeProps {
  children: ReactNode;
  /** % of track width per second. Negative scrolls left. */
  baseVelocity?: number;
  className?: string;
  skew?: boolean;
}

/** Endless marquee that speeds up, reverses and skews with scroll velocity. */
export function VelocityMarquee({ children, baseVelocity = -2, className, skew = true }: VelocityMarqueeProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smooth, [-2500, 0, 2500], skew ? [10, 0, -10] : [0, 0, 0]);
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const direction = useRef(1);
  const paused = useRef(false);
  const reduce = useReducedMotion();

  useAnimationFrame((_, delta) => {
    if (reduce || paused.current) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    moveBy += direction.current * moveBy * f;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div
      className={cn("flex overflow-hidden whitespace-nowrap", className)}
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocusCapture={() => (paused.current = true)}
      onBlurCapture={() => (paused.current = false)}
    >
      <motion.div className="flex w-max shrink-0 flex-nowrap" style={{ x, skewX }}>
        <div className="flex shrink-0 flex-nowrap">{children}</div>
        <div className="flex shrink-0 flex-nowrap" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
