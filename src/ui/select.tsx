"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { cn, EASE_OUT } from "@/lib/utils";
import { fieldTone } from "./field";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Our own dropdown, built to the WAI-ARIA select-only combobox pattern: it opens with
 * the arrow keys, Enter or Space, supports Home/End and type-to-jump, and closes with
 * Escape, Tab or a click outside. Focus never leaves the trigger.
 */
export function Select({
  id,
  value,
  onChange,
  options,
  invalid,
  placeholder = "Choose one",
  className,
  size = "md",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<SelectOption | string>;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const sm = size === "sm";
  const opts: SelectOption[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = Math.max(-1, opts.findIndex((o) => o.value === value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(Math.max(0, selected));
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const uid = useId();
  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  // Outside a template's own theme (Studio's panels, site forms), the list floats above the page so no
  // scrolling or collapsing parent can cut it off. It opens upward when there isn't room below.
  const [float, setFloat] = useState<CSSProperties | null>(null);
  const [up, setUp] = useState(false);
  const place = () => {
    const el = root.current;
    if (!el || el.closest(".bd-scope")) return setFloat(null);
    const r = el.getBoundingClientRect();
    const want = Math.min(320, opts.length * (sm ? 34 : 48) + 12);
    const below = window.innerHeight - r.bottom - 8;
    const flip = below < want && r.top - 8 > below;
    setUp(flip);
    setFloat({ position: "fixed", left: r.left, width: Math.max(r.width, sm ? 200 : 0), ...(flip ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }), maxHeight: Math.max(120, Math.min(320, flip ? r.top - 12 : below)) });
  };

  useEffect(() => {
    if (!open || !float) return;
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  });

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node) && !list.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = (at: number) => {
    setActive(Math.min(opts.length - 1, Math.max(0, at)));
    place();
    setOpen(true);
  };
  const choose = (i: number) => {
    onChange(opts[i].value);
    setOpen(false);
  };

  const jump = (key: string) => {
    const now = Date.now();
    const t = now - typed.current.at > 600 ? key : typed.current.text + key;
    typed.current = { text: t, at: now };
    const from = open ? active : selected;
    const order = [...opts.slice(from + 1), ...opts.slice(0, from + 1)];
    const hit = order.find((o) => o.label.toLowerCase().startsWith(t.toLowerCase()));
    if (!hit) return;
    const i = opts.indexOf(hit);
    if (open) setActive(i);
    else onChange(hit.value);
  };

  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        show(selected < 0 ? 0 : selected);
      } else if (k === "Home") {
        e.preventDefault();
        show(0);
      } else if (k === "End") {
        e.preventDefault();
        show(opts.length - 1);
      } else if (k.length === 1 && /\S/.test(k)) jump(k);
      return;
    }
    if (k === "ArrowDown") {
      e.preventDefault();
      if (e.altKey) return choose(active);
      setActive((a) => Math.min(opts.length - 1, a + 1));
    } else if (k === "ArrowUp") {
      e.preventDefault();
      if (e.altKey) return choose(active);
      setActive((a) => Math.max(0, a - 1));
    } else if (k === "Home" || k === "PageUp") {
      e.preventDefault();
      setActive(0);
    } else if (k === "End" || k === "PageDown") {
      e.preventDefault();
      setActive(opts.length - 1);
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      choose(active);
    } else if (k === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (k === "Tab") {
      choose(active);
    } else if (k.length === 1 && /\S/.test(k)) jump(k);
  };

  const current = opts[selected];

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${id}-label`}
        aria-activedescendant={open ? optId(active) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onClick={() => (open ? setOpen(false) : show(selected < 0 ? 0 : selected))}
        onKeyDown={onKey}
        onBlur={(e) => {
          if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-control border bg-fg/[0.03] text-left outline-none transition-[border-color,background-color,box-shadow] duration-200 focus:bg-fg/[0.05]",
          sm ? "h-8 px-2.5 text-[13px] focus:ring-2" : "h-12 px-4 text-[16px] focus:ring-4",
          fieldTone(invalid),
          open && cn("border-accent bg-fg/[0.05] ring-accent/30", sm ? "ring-2" : "ring-4"),
        )}
      >
        <span className={cn("truncate", current ? "text-fg" : "text-subtle")}>{current?.label ?? placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 28 }} className="shrink-0 text-muted">
          <CaretDownIcon size={sm ? 13 : 18} weight="regular" />
        </motion.span>
      </button>

      {(() => {
        const listbox = (
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            initial={{ opacity: 0, y: up ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: up ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            style={float ?? undefined}
            className={cn(
              "overflow-y-auto border border-line bg-surface-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)]",
              float ? cn("z-[160]", up ? "origin-bottom" : "origin-top") : cn("absolute inset-x-0 top-full z-50 max-h-[320px] origin-top", sm ? "mt-1" : "mt-2"),
              sm ? "min-w-[200px] rounded-[8px] p-1" : "rounded-card p-1.5",
            )}
          >
            {opts.map((o, i) => {
              const isActive = i === active;
              const isSel = i === selected;
              return (
                <li
                  key={o.value}
                  id={optId(i)}
                  data-index={i}
                  role="option"
                  aria-selected={isSel}
                  onPointerMove={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={cn("relative flex cursor-pointer items-center gap-3", sm ? "rounded-[6px] px-2.5 py-1.5 text-[13px]" : "rounded-[8px] px-3.5 py-2.5 text-[16px]", isSel ? "text-fg" : "text-fg/80")}
                >
                  {isActive && <motion.span layoutId={`${uid}-hl`} className={cn("absolute inset-0 bg-fg/[0.08]", sm ? "rounded-[6px]" : "rounded-[8px]")} transition={{ type: "spring", stiffness: 600, damping: 40 }} />}
                  <span className="relative flex-1">
                    <span className="block">{o.label}</span>
                    {o.hint && <span className={cn("mt-0.5 block text-muted", sm ? "text-[12px]" : "text-[14px]")}>{o.hint}</span>}
                  </span>
                  <span className="relative w-5 shrink-0 text-accent">{isSel && <CheckIcon size={sm ? 13 : 18} weight="duotone" />}</span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
        );
        return float && typeof document !== "undefined" ? createPortal(listbox, document.body) : listbox;
      })()}
    </div>
  );
}
