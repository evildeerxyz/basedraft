"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useState, type ComponentProps } from "react";

/*
 * A button that copies a piece of text. Round with just its icon, or a pill that says so; either
 * way the icon turns over into a check, a ring spreads from it, and it settles back after a moment.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SPRING = { type: "spring", stiffness: 600, damping: 30 } as const;

export type CopyButtonProps = Omit<ComponentProps<"button">, "value"> & {
  value: string;
  /** What a screen reader hears, and what the pill says. */
  label?: string;
  variant?: "icon" | "pill";
};

export function CopyButton({ value, label = "Copy", variant = "icon", className, ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  const pill = variant === "pill";
  return (
    <MotionConfig reducedMotion="user">
      <button
        type="button"
        aria-label={copied ? "Copied" : label}
        onClick={() => void navigator.clipboard?.writeText(value).then(() => setCopied(true))}
        className={cx(
          "relative inline-flex shrink-0 items-center justify-center rounded-full text-[var(--bd-fg)] transition-[background-color,scale,box-shadow] duration-200 active:scale-[0.94] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
          pill ? "h-8 gap-1.5 pl-2.5 pr-3.5 text-[13px] font-medium" : "size-8",
          className,
        )}
        {...props}
      >
        {/* The ring that spreads from a copy. */}
        <AnimatePresence>
          {copied && <motion.span key="ring" aria-hidden initial={{ opacity: 0.5, scale: 1 }} animate={{ opacity: 0, scale: 1.6 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_1.5px_rgb(var(--bd-ink)/0.35)]" />}
        </AnimatePresence>
        <span className="relative grid size-4 place-items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={copied ? "done" : "copy"} initial={{ scale: 0.4, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0, rotate: 40 }} transition={SPRING} className="grid place-items-center">
              {copied ? <CheckIcon size={15} weight="bold" /> : <CopyIcon size={15} weight="duotone" />}
            </motion.span>
          </AnimatePresence>
        </span>
        {pill && (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={copied ? "done" : "copy"} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={SPRING}>
              {copied ? "Copied" : label}
            </motion.span>
          </AnimatePresence>
        )}
      </button>
    </MotionConfig>
  );
}
