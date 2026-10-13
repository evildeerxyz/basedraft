"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "motion/react";

// Skip the fade on the very first load so server HTML is never hidden.
const session = { navigated: false };

/** Re-mounts on every navigation, so each new page eases in. */
export default function Template({ children }: { children: ReactNode }) {
  const animate = session.navigated;
  useEffect(() => {
    session.navigated = true;
  }, []);

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
