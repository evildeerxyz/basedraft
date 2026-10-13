"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// 7×7 pixel "Z". 2 = solid, 1 = half-tone (rendered smaller for a dithered edge).
const GRID = [
  "2222222",
  "0000221",
  "0002210",
  "0022100",
  "0221000",
  "1220000",
  "2222222",
];

const CELLS = GRID.flatMap((row, y) =>
  row.split("").flatMap((c, x) => (c === "0" ? [] : [{ x, y, half: c === "1" }])),
);

export function LogoMark({ size = 28, className, animated = true }: { size?: number; className?: string; animated?: boolean }) {
  const cell = 2.7;
  const gap = 0.35;
  const origin = (28 - (7 * cell + 6 * gap)) / 2;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={cn("shrink-0", className)}
      initial="rest"
      whileHover={animated ? "hover" : undefined}
      aria-hidden
    >
      <rect width="28" height="28" rx="8" fill="var(--color-lime)" />
      {CELLS.map(({ x, y, half }, i) => {
        const s = half ? cell * 0.55 : cell;
        const off = (cell - s) / 2;
        return (
          <motion.rect
            key={i}
            x={origin + x * (cell + gap) + off}
            y={origin + y * (cell + gap) + off}
            width={s}
            height={s}
            fill="var(--color-on-lime)"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            variants={{
              rest: { scale: 1, rotate: 0 },
              hover: {
                scale: [1, 0.2, 1],
                rotate: [0, 90, 0],
                transition: { duration: 0.6, delay: (x + y) * 0.035, ease: "easeInOut" },
              },
            }}
          />
        );
      })}
    </motion.svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[21px] font-semibold leading-none tracking-[-0.05em]">zuno</span>
    </span>
  );
}
