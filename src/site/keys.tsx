"use client";

import { AnimatePresence, motion } from "motion/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/*
 * Keyboard shortcuts, always shown as keys: each one in its own small box, with the Mac
 * symbols people know from Figma (⌘ ⇧ ⌥ ⌫). In copy, write a shortcut as {Cmd Z} and it
 * renders as keys wherever the text appears: toasts, FAQ answers, tooltips.
 */

const SYMBOL: Record<string, string> = { cmd: "⌘", shift: "⇧", option: "⌥", alt: "⌥", ctrl: "⌃", enter: "↵", return: "↵", del: "⌫", delete: "⌫", backspace: "⌫", up: "↑", down: "↓", left: "←", right: "→", esc: "Esc", tab: "Tab", space: "Space" };

export function Key({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <kbd
      className={cn(
        "inline-grid h-[19px] min-w-[19px] place-items-center rounded-[5px] px-1 align-[1px] font-sans text-[11px] font-medium leading-none",
        dark ? "bg-canvas/[0.12] text-canvas shadow-[inset_0_0_0_1px_rgb(var(--bd-paper-rgb)/0.18)]" : "bg-surface text-fg shadow-[inset_0_-1px_0_rgb(var(--bd-shade)/0.12),0_0_0_1px_rgb(var(--bd-ink)/0.14)]",
      )}
    >
      {children}
    </kbd>
  );
}

/** "Cmd Shift Z" as three keys. */
export function Keys({ combo, dark, className }: { combo: string; dark?: boolean; className?: string }) {
  const parts = combo.trim().split(/\s+/);
  return (
    <span className={cn("inline-flex items-center gap-[3px] whitespace-nowrap", className)} aria-label={parts.join(" ")}>
      {parts.map((p, i) => (
        <Key key={i} dark={dark}>
          {SYMBOL[p.toLowerCase()] ?? p}
        </Key>
      ))}
    </span>
  );
}

/** Text where {Cmd V} becomes keys. */
export function WithKeys({ text, dark }: { text: string; dark?: boolean }) {
  const parts = text.split(/\{([^}]+)\}/);
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <Keys key={i} combo={p} dark={dark} className="mx-0.5" /> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

/** Plain text for places that can't hold markup, like aria labels: {Cmd V} becomes "Cmd V". */
export const plainKeys = (text: string) => text.replace(/\{([^}]+)\}/g, "$1");

/**
 * Figma-style tooltip: the action's name, then its keys. Shows after a short pause on hover,
 * straight away on keyboard focus. It floats above the page, so no scrolling panel can clip it
 * or start scrolling sideways because of it, and it stays inside the window at the edges.
 */
export function Tip({ label, keys, side = "top", children, className }: { label: string; keys?: string; side?: "top" | "bottom"; children: ReactNode; className?: string }) {
  const [at, setAt] = useState<CSSProperties | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const r = wrap.current?.getBoundingClientRect();
      if (!r) return;
      const x = r.left + r.width / 2;
      setAt(side === "top" ? { left: x, bottom: window.innerHeight - r.top + 8 } : { left: x, top: r.bottom + 8 });
    }, delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setAt(null);
  };
  // Nudged in from the window's edge once it has a size.
  useLayoutEffect(() => {
    const el = tip.current;
    if (!at || !el) return;
    const r = el.getBoundingClientRect();
    const shift = r.left < 8 ? 8 - r.left : r.right > window.innerWidth - 8 ? window.innerWidth - 8 - r.right : 0;
    el.style.marginLeft = `${shift}px`;
  }, [at]);
  // Anything scrolling underneath would leave it behind, so it goes.
  useEffect(() => {
    if (!at) return;
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", hide, { capture: true });
  }, [at]);
  return (
    <span
      ref={wrap}
      className={cn("relative inline-flex", className)}
      onPointerEnter={() => show(350)}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(e) => e.target.matches(":focus-visible") && show(0)}
      onBlur={hide}
    >
      {children}
      {at &&
        createPortal(
          <AnimatePresence>
            <motion.span
              ref={tip}
              role="tooltip"
              initial={{ opacity: 0, y: side === "top" ? 4 : -4, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              transition={{ type: "spring", stiffness: 700, damping: 40 }}
              style={at}
              className="pointer-events-none fixed z-[170] flex items-center gap-2 whitespace-nowrap rounded-[5px] bg-fg px-2 py-1.5 text-[12px] font-medium text-canvas shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
            >
              {label}
              {keys && <Keys combo={keys} dark />}
            </motion.span>
          </AnimatePresence>,
          document.body,
        )}
    </span>
  );
}
