"use client";

import { MotionConfig as M } from "motion/react";
import type { ReactNode } from "react";

export function MotionConfig({ children }: { children: ReactNode }) {
  return <M reducedMotion="user">{children}</M>;
}
