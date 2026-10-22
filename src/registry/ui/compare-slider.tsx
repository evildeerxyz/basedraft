"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/*
 * Two versions of one thing, one over the other, split by a line you drag: before and after, light
 * and dark, the draft and the live site. Press anywhere and the line springs there, then follows
 * your hand; the arrow keys move it in small steps, with Shift in large ones. Each side's name sits
 * in its corner and steps aside as the line comes near.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type CompareSliderProps = Omit<ComponentProps<"div">, "children" | "onChange"> & {
  /** The left side: usually an image. */
  before: ReactNode;
  /** The right side. */
  after: ReactNode;
  /** Each side's name, in its corner; false for none. */
  labels?: [string, string] | false;
  /** Where the line is, from 0 (all after) to 100 (all before). Leave it out and the slider keeps it. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Width over height. */
  ratio?: number;
  /** What the handle says to a screen reader. */
  label?: string;
};

export function CompareSlider({ before, after, labels = ["Before", "After"], value, defaultValue = 50, onValueChange, ratio = 16 / 10, label = "Compare", className, style, ...props }: CompareSliderProps) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const x = useMotionValue(value ?? defaultValue);
  const [now, setNow] = useState(value ?? defaultValue);
  useMotionValueEvent(x, "change", (v) => setNow(Math.round(v)));
  useEffect(() => {
    if (value !== undefined && Math.abs(value - x.get()) > 0.1) x.set(value);
  }, [value, x]);
  const clip = useTransform(x, (v) => `inset(0 ${100 - v}% 0 0)`);
  const left = useTransform(x, (v) => `${v}%`);
  const dragging = useRef(false);

  const at = (clientX: number) => {
    const b = box.current!.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - b.left) / b.width) * 100));
  };
  const set = (v: number, glide = false) => {
    const to = Math.max(0, Math.min(100, v));
    if (glide && !still) animate(x, to, { type: "spring", stiffness: 380, damping: 34 });
    else x.set(to);
    onValueChange?.(Math.round(to));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    set(at(e.clientX), true);
    (box.current?.querySelector("[role=slider]") as HTMLElement | null)?.focus({ preventScroll: true });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) set(at(e.clientX));
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const to = e.key === "ArrowLeft" || e.key === "ArrowDown" ? now - step : e.key === "ArrowRight" || e.key === "ArrowUp" ? now + step : e.key === "Home" ? 0 : e.key === "End" ? 100 : null;
    if (to == null) return;
    e.preventDefault();
    set(to, e.key === "Home" || e.key === "End");
  };

  return (
    <div
      ref={box}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      className={cx("relative isolate cursor-ew-resize touch-none select-none overflow-hidden rounded-[20px] bg-[var(--bd-ui-track)] [&_img]:pointer-events-none [&_img]:size-full [&_img]:object-cover", className)}
      style={{ aspectRatio: ratio, ...style }}
      {...props}
    >
      <div className="absolute inset-0">{after}</div>
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        {before}
      </motion.div>
      {labels && (
        <>
          <span aria-hidden className={cx("pointer-events-none absolute left-3 top-3 rounded-full bg-[rgb(0_0_0/0.45)] px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-md transition-opacity duration-200", now < 18 && "opacity-0")}>
            {labels[0]}
          </span>
          <span aria-hidden className={cx("pointer-events-none absolute right-3 top-3 rounded-full bg-[rgb(0_0_0/0.45)] px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-md transition-opacity duration-200", now > 82 && "opacity-0")}>
            {labels[1]}
          </span>
        </>
      )}
      {/* The line, and the bead on it that you hold. */}
      <motion.div className="pointer-events-none absolute inset-y-0 w-0" style={{ left }}>
        <span aria-hidden className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_0_12px_rgb(0_0_0/0.25)]" />
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={now}
          aria-valuetext={labels ? `${now}% ${labels[0]}, ${100 - now}% ${labels[1]}` : `${now}%`}
          aria-orientation="horizontal"
          onKeyDown={key}
          className="pointer-events-auto absolute left-0 top-1/2 flex h-9 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full text-[oklch(30%_0.004_265)] outline-none [background:linear-gradient(180deg,oklch(100%_0_0),oklch(95.5%_0.003_265))] shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_1px_2px_rgb(0_0_0/0.2),0_6px_16px_-6px_rgb(0_0_0/0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <CaretLeftIcon weight="bold" className="size-3" />
          <CaretRightIcon weight="bold" className="size-3" />
        </div>
      </motion.div>
    </div>
  );
}
