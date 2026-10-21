"use client";

import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { EASE_OUT } from "@/lib/utils";
import { WithKeys } from "./keys";

type Toast = { id: number; text: string; detail?: string; tone: "ok" | "error" };
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, opts: { detail?: string; tone?: Toast["tone"] } = {}) {
  const t: Toast = { id: Date.now() + Math.random(), text, detail: opts.detail, tone: opts.tone ?? "ok" };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 4200);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Top-center confirmations, clear of Studio's toolbar, announced to screen readers: a small white card with a hairline, floating. */
export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => toasts, () => toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2">
      <AnimatePresence>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.18, ease: EASE_OUT } }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="flex max-w-[420px] items-start gap-2.5 rounded-[var(--bd-r-inset)] border border-line bg-surface px-4 py-3 text-fg shadow-[var(--bd-shadow-float)]"
          >
            {t.tone === "ok" ? <CheckCircleIcon size={18} weight="duotone" className="mt-px shrink-0 text-[oklch(0.62_0.17_150)]" /> : <WarningCircleIcon size={18} weight="duotone" className="mt-px shrink-0 text-[#d92d20] dark:text-[#ff8a80]" />}
            <div>
              <div className="text-[13px] font-medium">
                <WithKeys text={t.text} />
              </div>
              {t.detail && (
                <div className="mt-0.5 text-meta leading-[1.6] text-muted">
                  <WithKeys text={t.detail} />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
