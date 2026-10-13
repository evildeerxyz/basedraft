"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

/** Re-mounts on navigation, so every page eases in. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } }}
      transition={{ type: "spring", stiffness: 200, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}
