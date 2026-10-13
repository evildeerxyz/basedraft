"use client";

import type { ReactNode } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { ReactLenis } from "lenis/react";

/** Motion defaults + Lenis smooth scrolling (skipped for reduced-motion users). */
export function Providers({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user">
      {!reduce && <ReactLenis root options={{ lerp: 0.11, smoothWheel: true }} />}
      {children}
    </MotionConfig>
  );
}
