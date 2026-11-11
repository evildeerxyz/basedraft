"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/*
 * Letters on hinged flaps, the way a station's departures board turns over: to change, each one
 * flips forward through the alphabet, the top half falling and darkening as it goes, until it
 * reaches its letter. The letters start a moment apart, so a word ripples. Sized in em, so its
 * font size sets it; the tiles are a board's black in light and dark alike.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/** The order the flaps turn through. */
export const FLAPS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-'/&";

/* The board's own materials: black tiles, a darker hinge, warm off-white letters. */
const TOP = "linear-gradient(180deg, oklch(0.27 0.004 270), oklch(0.22 0.004 270))";
const BOTTOM = "linear-gradient(180deg, oklch(0.2 0.004 270), oklch(0.17 0.004 270))";
const LETTER = "oklch(0.95 0.012 85)";

function Half({ char, part, color }: { char: string; part: "top" | "bottom"; color: string }) {
  return (
    <span className={cx("absolute inset-x-0 overflow-hidden", part === "top" ? "top-0 rounded-t-[0.12em]" : "bottom-0 rounded-b-[0.12em]")} style={{ height: "calc(50% - 0.025em)", background: part === "top" ? TOP : BOTTOM }}>
      <span className="absolute inset-x-0 flex items-center justify-center font-mono font-semibold leading-none" style={{ height: "1.24em", top: part === "top" ? 0 : "calc(-0.62em + 0.025em)", fontSize: "1em", color }}>
        {char}
      </span>
    </span>
  );
}

function Cell({ char, speed, delay, color, still }: { char: string; speed: number; delay: number; color: string; still: boolean }) {
  const target = FLAPS.includes(char) ? char : " ";
  const [cur, setCur] = useState(target);
  const [prev, setPrev] = useState(target);
  const [flip, setFlip] = useState(0);
  const moving = useRef(false);

  // One flap at a time toward the letter: the first after its delay, the rest at speed.
  useEffect(() => {
    if (cur === target) {
      moving.current = false;
      return;
    }
    const wait = still ? 0 : moving.current ? speed : delay;
    moving.current = true;
    const t = setTimeout(() => {
      setPrev(cur);
      setCur(still ? target : FLAPS[(FLAPS.indexOf(cur) + 1) % FLAPS.length]);
      setFlip((n) => n + 1);
    }, wait);
    return () => clearTimeout(t);
  }, [cur, target, speed, delay, still]);

  const half = Math.max(0.035, (speed * 0.5) / 1000);
  return (
    <span aria-hidden className="relative inline-block shrink-0 rounded-[0.12em] shadow-[0_0.06em_0.12em_rgb(0_0_0/0.45),inset_0_0_0_0.02em_rgb(255_255_255/0.05)]" style={{ width: "0.8em", height: "1.24em", perspective: "4em" }}>
      <Half char={cur} part="top" color={color} />
      <Half char={flip ? prev : cur} part="bottom" color={color} />
      {flip > 0 && !still && (
        <>
          {/* The old letter's top falls away, shading as it turns. */}
          <motion.span key={`f${flip}`} className="absolute inset-0 [backface-visibility:hidden] [transform-style:preserve-3d]" style={{ transformOrigin: "50% 50%" }} initial={{ rotateX: 0 }} animate={{ rotateX: -90 }} transition={{ duration: half, ease: "easeIn" }}>
            <Half char={prev} part="top" color={color} />
            <motion.span className="absolute inset-x-0 top-0 rounded-t-[0.12em] bg-black" style={{ height: "calc(50% - 0.025em)" }} initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ duration: half }} />
          </motion.span>
          {/* The new letter's bottom swings down into place. */}
          <motion.span key={`r${flip}`} className="absolute inset-0 [backface-visibility:hidden]" style={{ transformOrigin: "50% 50%" }} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} transition={{ duration: half, delay: half, ease: "easeOut" }}>
            <Half char={cur} part="bottom" color={color} />
          </motion.span>
        </>
      )}
      {/* The hinge, and its two pins. */}
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-[0.05em] -translate-y-1/2 bg-[oklch(0.08_0_0)]" />
      <span className="pointer-events-none absolute left-[0.04em] top-1/2 size-[0.09em] -translate-y-1/2 rounded-full bg-[oklch(0.38_0_0)]" />
      <span className="pointer-events-none absolute right-[0.04em] top-1/2 size-[0.09em] -translate-y-1/2 rounded-full bg-[oklch(0.38_0_0)]" />
    </span>
  );
}

export type SplitFlapProps = {
  /** What it shows. Letters it doesn't have show as blanks; lowercase turns upper. */
  value: string;
  /** How many tiles, padded with blanks; the value's length by default. */
  length?: number;
  /** Where the value sits when there are spare tiles. */
  align?: "left" | "right";
  /** Ms for each flap to turn. */
  speed?: number;
  /** Ms between one tile starting and the next. */
  stagger?: number;
  /** The letters' color: amber for a delay, green for a go. */
  color?: string;
  className?: string;
};

export function SplitFlap({ value, length, align = "left", speed = 60, stagger = 40, color = LETTER, className }: SplitFlapProps) {
  const still = !!useReducedMotion();
  const text = value.toUpperCase();
  const n = Math.max(length ?? text.length, 0);
  const padded = align === "right" ? text.slice(0, n).padStart(n) : text.slice(0, n).padEnd(n);
  return (
    // A box of its own, so a line of text around it never adds space under the tiles.
    <span role="img" aria-label={text.trim()} className={cx("flex w-fit gap-[0.06em]", className)}>
      {[...padded].map((c, i) => (
        <Cell key={i} char={c} speed={speed} delay={i * stagger} color={color} still={still} />
      ))}
    </span>
  );
}
