"use client";

import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * One action with its alternatives, the way a merge button works: the pill runs the chosen one,
 * and the caret beside it opens the others, each with a line on what it does. Choosing another
 * doesn't run it; it takes the pill's place, its name rolling in as the pill eases to its new
 * width, so the next press does what you picked. Arrows, Enter and Escape run the list.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
/* The light or dark the button sits in, so its list in a portal on body matches it. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

export type SplitAction = {
  value: string;
  label: string;
  /** A line on what it does, in the list. */
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type SplitButtonProps = {
  actions: SplitAction[];
  /** The chosen action's value. Leave it out and the button keeps it, starting from defaultValue or the first. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Runs with the chosen action's value when the pill is pressed. */
  onAction?: (value: string) => void;
  variant?: "ink" | "outline";
  size?: "sm" | "md";
  /** The pill shows dots and can't be pressed, while the action runs. */
  loading?: boolean;
  disabled?: boolean;
  /** What the caret says to a screen reader. */
  menuLabel?: string;
  className?: string;
};

const SIZES = { sm: { h: "h-8", text: "text-[13px]", pad: "pl-3.5 pr-3", caret: "w-8" }, md: { h: "h-10", text: "text-sm", pad: "pl-5 pr-4", caret: "w-10" } } as const;
const VARIANTS = {
  ink: { face: "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.2),0_6px_16px_-8px_rgb(var(--bd-shade)/0.5)]", hover: "hover:bg-[rgb(255_255_255/0.08)]", rule: "bg-[rgb(255_255_255/0.18)]" },
  outline: { face: "bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)]", hover: "hover:bg-[rgb(var(--bd-ink)/0.04)]", rule: "bg-[var(--bd-line-strong)]" },
} as const;

export function SplitButton({ actions, value, defaultValue, onValueChange, onAction, variant = "ink", size = "md", loading = false, disabled = false, menuLabel = "More actions", className }: SplitButtonProps) {
  const [inner, setInner] = useState(defaultValue ?? actions[0]?.value);
  const current = actions.find((a) => a.value === (value ?? inner)) ?? actions[0];
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState(1);
  const main = useRef<HTMLButtonElement>(null);
  const caret = useRef<HTMLButtonElement>(null);
  const sizer = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const still = useReducedMotion();
  const id = useId();
  const mounted = useMounted();
  const s = SIZES[size];
  const v = VARIANTS[variant];

  // The label's width, measured from an unseen copy, so the pill can ease to it.
  useLayoutEffect(() => {
    if (sizer.current) setWidth(sizer.current.offsetWidth);
  }, [current?.label, size]);

  const choose = (a: SplitAction) => {
    if (a.disabled) return;
    setDir(actions.indexOf(a) > actions.indexOf(current) ? 1 : -1);
    setInner(a.value);
    onValueChange?.(a.value);
    setOpen(false);
    main.current?.focus();
  };

  return (
    <span className={cx("relative inline-flex shrink-0 rounded-full", s.h, s.text, v.face, (disabled || loading) && "opacity-60", className)}>
      <button
        ref={main}
        type="button"
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={() => current && onAction?.(current.value)}
        className={cx("relative flex items-center gap-2 rounded-l-full font-medium outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:cursor-not-allowed [&_svg]:size-4", s.pad, !disabled && !loading && v.hover)}
      >
        <span ref={sizer} aria-hidden className="pointer-events-none invisible absolute whitespace-nowrap">
          {current?.label}
        </span>
        <motion.span className="relative block overflow-hidden whitespace-nowrap" initial={false} animate={{ width: width ?? "auto", opacity: loading ? 0 : 1 }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} style={{ height: "1.4em" }}>
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.span
              key={current?.value}
              custom={dir}
              className="absolute left-0 top-0 block leading-[1.4em]"
              variants={{ in: (d: number) => ({ y: still ? 0 : `${d * 100}%`, opacity: 0 }), at: { y: 0, opacity: 1 }, out: (d: number) => ({ y: still ? 0 : `${-d * 100}%`, opacity: 0 }) }}
              initial="in"
              animate="at"
              exit="out"
              transition={{ type: "spring", stiffness: 520, damping: 38 }}
            >
              {current?.label}
            </motion.span>
          </AnimatePresence>
        </motion.span>
        {loading && (
          <span aria-hidden className="absolute inset-0 flex items-center justify-center gap-[3px] pl-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-[3px] rounded-full bg-current opacity-60 animate-[bd-ui-dither_1.15s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </span>
        )}
      </button>
      <span aria-hidden className={cx("my-2 w-px shrink-0", v.rule)} />
      <button
        ref={caret}
        type="button"
        disabled={disabled}
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          setOpen(true);
        }}
        className={cx("grid place-items-center rounded-r-full outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:cursor-not-allowed", s.caret, !disabled && v.hover)}
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }} className="grid place-items-center">
          <CaretDownIcon weight="bold" className="size-3" />
        </motion.span>
      </button>
      {mounted && <AnimatePresence>{open && <ActionList id={id} anchor={caret} label={current?.label} actions={actions} current={current?.value} onChoose={choose} onClose={(refocus) => {
        setOpen(false);
        if (refocus) caret.current?.focus();
      }} />}</AnimatePresence>}
    </span>
  );
}

/** The alternatives, in a card under the button's right edge. */
function ActionList({ id, anchor, label, actions, current, onChoose, onClose }: { id: string; anchor: RefObject<HTMLButtonElement | null>; label?: string; actions: SplitAction[]; current?: string; onChoose: (a: SplitAction) => void; onClose: (refocus: boolean) => void }) {
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const [scope] = useState(() => scopeOf(anchor.current));
  // The latest onClose, for the listeners set up once.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const update = () => {
      const t = anchor.current?.getBoundingClientRect();
      const c = list.current;
      if (!t || !c) return;
      const pad = 8;
      const below = t.bottom + 6 + c.offsetHeight < innerHeight - pad || t.top - 6 - c.offsetHeight < pad;
      setPos({ top: below ? t.bottom + 6 : t.top - 6 - c.offsetHeight, left: Math.min(Math.max(pad, t.right - c.offsetWidth), innerWidth - pad - c.offsetWidth), below });
    };
    const frame = requestAnimationFrame(() => {
      update();
      const all = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitemradio]:not([aria-disabled=true])") ?? [])];
      (all.find((el) => el.getAttribute("aria-checked") === "true") ?? all[0])?.focus({ preventScroll: true });
    });
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!list.current?.contains(n) && !anchor.current?.contains(n)) close.current(false);
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    document.addEventListener("pointerdown", away);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", away);
    };
  }, [anchor]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitemradio]:not([aria-disabled=true])") ?? [])];
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => all[(i + all.length) % all.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at < 0 ? all.length - 1 : at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Escape") close.current(true);
    else if (e.key === "Tab") return close.current(false);
    else return;
    e.preventDefault();
  };

  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <motion.div
        ref={list}
        id={id}
        role="menu"
        aria-label={label ? `Instead of ${label}` : undefined}
        onKeyDown={onKey}
        initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
        exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
        transition={{ type: "spring", stiffness: 600, damping: 38 }}
        style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, transformOrigin: pos?.below === false ? "right bottom" : "right top" }}
        className="z-[90] w-[300px] max-w-[calc(100vw-16px)] rounded-[18px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
      >
        {actions.map((a) => {
          const on = a.value === current;
          return (
            <div
              key={a.value}
              role="menuitemradio"
              aria-checked={on}
              aria-disabled={a.disabled || undefined}
              tabIndex={-1}
              onClick={() => onChoose(a)}
              onPointerMove={(e) => document.activeElement !== e.currentTarget && e.currentTarget.focus({ preventScroll: true })}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                onChoose(a);
              }}
              className="flex cursor-default select-none gap-3 rounded-[12px] px-3 py-2.5 outline-none transition-colors duration-100 focus:bg-[rgb(var(--bd-ink)/0.05)] aria-disabled:opacity-45"
            >
              <span className={cx("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full transition-[background,box-shadow] duration-150", on ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.2)]")}>
                {on && <CheckIcon weight="bold" className="size-2.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[13.5px] font-medium [&_svg]:size-4 [&_svg]:text-[var(--bd-muted)]">
                  {a.icon}
                  {a.label}
                </span>
                {a.description && <span className="mt-0.5 block text-[12.5px] leading-[1.45] text-[var(--bd-muted)]">{a.description}</span>}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>,
    document.body,
  );
}
