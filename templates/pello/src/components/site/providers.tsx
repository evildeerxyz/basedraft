"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Motion everywhere follows the visitor's reduced-motion setting. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
