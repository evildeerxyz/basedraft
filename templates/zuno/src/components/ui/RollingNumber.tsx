"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Digit({ d }: { d: number }) {
  return (
    <span className="relative inline-block h-[1.1em] overflow-hidden align-top leading-[1.1em]">
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        initial={false}
        animate={{ y: `${-d * 10}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
      >
        {DIGITS.map((n) => (
          <span key={n} className="block h-[1.1em] leading-[1.1em]">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** Odometer-style number: each digit rolls independently to its new value. */
export function RollingNumber({ value, className }: { value: string; className?: string }) {
  const chars = value.split("");
  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex">
      {chars.map((ch, i) => {
        const key = chars.length - i;
        return /\d/.test(ch) ? (
          <Digit key={key} d={Number(ch)} />
        ) : (
          <span key={`${key}${ch}`} className="inline-block h-[1.1em] leading-[1.1em]">
            {ch}
          </span>
        );
      })}
      </span>
    </span>
  );
}
