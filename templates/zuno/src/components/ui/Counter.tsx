"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE_OUT } from "@/lib/utils";

interface CounterProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const fmt = (v: number, decimals: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Counts up once when scrolled into view. Writes to the DOM directly, so nothing re-renders. */
export function Counter({ to, from = 0, duration = 2.2, decimals = 0, prefix = "", suffix = "", className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from, to, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${prefix}${fmt(v, decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, from, to, duration, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${fmt(from, decimals)}${suffix}`}
    </span>
  );
}
