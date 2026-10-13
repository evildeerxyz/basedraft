"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function Switch({ on, onChange, label, className }: { on: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200", on ? "bg-lime" : "bg-white/15", className)}
    >
      <motion.span
        className="absolute left-[3px] top-[3px] block size-[22px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
        initial={false}
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
      />
    </button>
  );
}
