"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState, type ReactNode } from "react";

/*
 * A short label in an ink bubble with a caret, rising in over what it describes on hover or
 * keyboard focus after a moment's pause. It can carry the keys for the action too, on small caps.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export function Tooltip({ content, keys, side = "top", delay = 160, className, children }: { content: ReactNode; /** Its shortcut, a cap each: ["⌘", "E"]. */ keys?: string[]; side?: "top" | "bottom"; delay?: number; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();
  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  const top = side === "top";
  return (
    <span className="relative inline-flex" onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide} aria-describedby={open ? id : undefined}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: top ? 6 : -6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 620, damping: 34 }}
            className={cx(
              "pointer-events-none absolute left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] py-1.5 pl-2.5 text-xs font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),var(--bd-shadow-float)]",
              keys?.length ? "pr-1.5" : "pr-2.5",
              top ? "bottom-full mb-2.5 origin-bottom" : "top-full mt-2.5 origin-top",
              className,
            )}
          >
            {content}
            {keys && keys.length > 0 && (
              <span className="flex gap-0.5">
                {keys.map((k) => (
                  <kbd key={k} className="grid h-[18px] min-w-[18px] place-items-center rounded-[5px] bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_16%,transparent)] px-1 font-sans text-[10.5px] font-medium">
                    {k}
                  </kbd>
                ))}
              </span>
            )}
            {/* The caret, pointing at what it describes. */}
            <span aria-hidden className={cx("absolute left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-[1.5px] bg-[var(--bd-ui-ink-solid)]", top ? "top-full -translate-y-[5px]" : "bottom-full translate-y-[5px]")} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
