"use client";

import type { Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { Keys } from "./keys";

/*
 * A small menu that drops from a button, used for accounts on the site and in Studio. Arrow
 * keys move between items, Escape closes it and hands focus back to the button, and a click
 * anywhere else dismisses it.
 */

export type MenuItem =
  | { label: string; icon?: Icon; href?: string; onSelect?: () => void; hint?: ReactNode; keys?: string; danger?: boolean }
  | "divider";

export function Menu({
  label,
  button,
  buttonClassName,
  header,
  items,
  side = "bottom",
  align = "right",
  className,
}: {
  label: string;
  button: ReactNode;
  buttonClassName?: string;
  header?: ReactNode;
  items: MenuItem[];
  side?: "top" | "bottom";
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const list = () => [...(root.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
  const onKey = (e: KeyboardEvent) => {
    const all = list();
    const i = all.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === "Tab" && open) setOpen(false);
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        requestAnimationFrame(() => list()[e.key === "ArrowDown" ? 0 : list().length - 1]?.focus());
        return;
      }
      const n = e.key === "ArrowDown" ? i + 1 : i - 1;
      all[(n + all.length) % all.length]?.focus();
    }
  };

  const row = (danger?: boolean) =>
    cn("flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[13.5px] outline-none transition-colors hover:bg-fg/[0.05] focus-visible:bg-fg/[0.06]", danger ? "text-fg/80" : "text-fg");

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button ref={trigger} type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label={label} className={buttonClassName}>
        {button}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: side === "bottom" ? -4 : 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "bottom" ? -4 : 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className={cn(
              "absolute z-[80] w-[260px] rounded-[10px] bg-surface p-1.5 text-fg shadow-[0_16px_48px_rgb(var(--bd-shade)/0.18),0_0_0_1px_rgb(var(--bd-ink)/0.06)]",
              side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
              align === "right" ? "right-0" : "left-0",
              side === "bottom" ? (align === "right" ? "origin-top-right" : "origin-top-left") : align === "right" ? "origin-bottom-right" : "origin-bottom-left",
              className,
            )}
          >
            {header && <div className="mb-1 border-b border-line px-2.5 pb-2.5 pt-1.5">{header}</div>}
            {items.map((it, i) => {
              if (it === "divider") return <div key={`d${i}`} className="mx-1 my-1 h-px bg-line" />;
              const I = it.icon;
              const body = (
                <>
                  {I && <I size={16} weight="duotone" className="shrink-0 text-muted" />}
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  {it.hint && <span className="shrink-0 text-[12px] text-subtle">{it.hint}</span>}
                  {it.keys && <Keys combo={it.keys} />}
                </>
              );
              const done = () => {
                setOpen(false);
                it.onSelect?.();
              };
              return it.href ? (
                <Link key={it.label} role="menuitem" href={it.href} onClick={done} className={row(it.danger)}>
                  {body}
                </Link>
              ) : (
                <button key={it.label} role="menuitem" type="button" onClick={done} className={row(it.danger)}>
                  {body}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
