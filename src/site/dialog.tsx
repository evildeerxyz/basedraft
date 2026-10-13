"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { DitherSky } from "./plan-parts";

/*
 * basedraft's one modal: a white card lifted over a dimmed page. Pro, accounts, sharing and the
 * Library all open in it, so they look and behave the same. Focus moves in on open and goes back
 * to whatever opened it on close; Tab stays inside; Escape and a click outside close it.
 */

export const DIALOG_CARD = "relative isolate w-full overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface text-fg shadow-[0_30px_80px_-20px_rgb(var(--bd-shade)/0.45),0_0_0_1px_rgb(var(--bd-ink)/0.06)]";

export function Dialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  initialFocus,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  /** What gets focus on open. Defaults to the first field, then the first button. */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const card = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      const c = card.current;
      const first = initialFocus?.current ?? c?.querySelector<HTMLElement>("[data-autofocus]") ?? c?.querySelector<HTMLElement>("input:not([type=hidden]), a[href], button:not([disabled]):not([data-dialog-close])");
      first?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // A menu inside the dialog closes first.
        if (e.defaultPrevented) return;
        e.preventDefault();
        close.current();
      } else if (e.key === "Tab" && card.current) {
        const f = [...card.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), [tabindex='0']")].filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const [first, last] = [f[0], f[f.length - 1]];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // A menu item that opened the dialog may be gone by now; then focus stays on the page.
      if (back?.isConnected) back.focus();
    };
  }, [open, initialFocus]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="dialog" className="fixed inset-0 z-[150] grid place-items-center overflow-y-auto p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
          <div aria-hidden className="fixed inset-0 bg-black/35 dark:bg-black/60 backdrop-blur-[3px]" onClick={() => close.current()} />
          <motion.div
            ref={card}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 480, damping: 38 }}
            className={cn(DIALOG_CARD, "max-w-[460px]", className)}
          >
            <DitherSky className="-z-10" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" data-dialog-close onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-[8px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg">
      <XIcon size={15} weight="bold" />
    </button>
  );
}
