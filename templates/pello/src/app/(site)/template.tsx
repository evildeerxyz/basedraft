"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Mounts again on every navigation, so each page comes in the same way. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transitionEnd: { transform: "none" } }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
