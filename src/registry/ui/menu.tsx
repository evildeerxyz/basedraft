"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type ReactElement, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * A dropdown of actions that opens from a button: in sections with small labels, each action with
 * its icon and its shortcut on small keys, options that tick on and off, and the one that can't be
 * undone set apart in red. The keyboard runs it all: arrows move, Home and End jump, a letter
 * finds the action that starts with it, Enter does it, Escape closes it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
type Ctx = { open: boolean; setOpen: (o: boolean) => void; id: string; trigger: RefObject<HTMLElement | null>; scope: Scope; setScope: (s: Scope) => void; first: "first" | "last"; setFirst: (f: "first" | "last") => void };
const MenuContext = createContext<Ctx | null>(null);
const useMenu = () => {
  const c = useContext(MenuContext);
  if (!c) throw new Error("Menu parts go inside <Menu>.");
  return c;
};

/** Holds whether it's open. Leave `open` out and it keeps that itself. */
export function Menu({ open, defaultOpen = false, onOpenChange, children }: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  const [inner, setInner] = useState(defaultOpen);
  const setOpen = useCallback(
    (o: boolean) => {
      setInner(o);
      onOpenChange?.(o);
    },
    [onOpenChange],
  );
  const trigger = useRef<HTMLElement | null>(null);
  const [scope, setScope] = useState<Scope>({});
  const [first, setFirst] = useState<"first" | "last">("first");
  return <MenuContext.Provider value={{ open: open ?? inner, setOpen, id: useId(), trigger, scope, setScope, first, setFirst }}>{children}</MenuContext.Provider>;
}

const both =
  <T,>(...refs: Array<Ref<T> | undefined>) =>
  (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };

function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

/** What opens it: a button of its own, or with `asChild`, the one element you pass. Down arrow opens it on the first action, up arrow on the last. */
export function MenuTrigger({ asChild, children, onClick, onKeyDown, ...props }: ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen, id, trigger, setScope, setFirst } = useMenu();
  const aria = { id: `${id}-trigger`, "aria-haspopup": "menu" as const, "aria-expanded": open, "aria-controls": open ? id : undefined };
  const toggle = (e: MouseEvent<HTMLElement>) => {
    setScope(scopeOf(e.currentTarget));
    setFirst("first");
    setOpen(!open);
  };
  const key = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    setScope(scopeOf(e.currentTarget));
    setFirst(e.key === "ArrowUp" ? "last" : "first");
    setOpen(true);
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void; onKeyDown?: (e: ReactKeyboardEvent<HTMLElement>) => void; ref?: Ref<HTMLElement> }>;
    return cloneElement(child, {
      ...aria,
      ref: both(child.props.ref, trigger),
      onClick: (e: MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) toggle(e);
      },
      onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => {
        child.props.onKeyDown?.(e);
        if (!e.defaultPrevented) key(e);
      },
    } as Record<string, unknown>);
  }
  return (
    <button
      type="button"
      ref={both(props.ref, trigger as Ref<HTMLButtonElement>)}
      {...aria}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) toggle(e);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented) key(e);
      }}
    >
      {children}
    </button>
  );
}

type Side = "top" | "bottom";
type Align = "start" | "center" | "end";

function place(t: DOMRect, w: number, h: number, side: Side, align: Align, gap: number) {
  const pad = 8;
  let s = side;
  if (s === "bottom" && t.bottom + gap + h > innerHeight - pad && t.top - gap - h > pad) s = "top";
  else if (s === "top" && t.top - gap - h < pad && t.bottom + gap + h < innerHeight - pad) s = "bottom";
  const top = s === "bottom" ? t.bottom + gap : t.top - gap - h;
  const want = align === "start" ? t.left : align === "end" ? t.right - w : t.left + t.width / 2 - w / 2;
  return { top, left: Math.min(Math.max(pad, want), innerWidth - pad - w), side: s };
}

const ITEM = '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"])';

/** The list, in a portal, beside its trigger. */
export function MenuContent({ side = "bottom", align = "start", gap = 6, className, children }: { side?: Side; align?: Align; gap?: number; className?: string; children: ReactNode }) {
  const { open, setOpen, id, trigger, scope, first } = useMenu();
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const mounted = useMounted();
  const [pos, setPos] = useState<ReturnType<typeof place> | null>(null);
  // Letters typed in quick succession, to find the action that starts with them.
  const typed = useRef({ text: "", at: 0 });

  const items = () => [...(list.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])];
  const close = useCallback(
    (refocus = true) => {
      setOpen(false);
      if (refocus) trigger.current?.focus();
    },
    [setOpen, trigger],
  );

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const t = trigger.current?.getBoundingClientRect();
      const c = list.current;
      if (t && c) setPos(place(t, c.offsetWidth, c.offsetHeight, side, align, gap));
    };
    const frame = requestAnimationFrame(() => {
      update();
      const all = [...(list.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])];
      (first === "last" ? all.at(-1) : all[0])?.focus({ preventScroll: true });
    });
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!list.current?.contains(n) && !trigger.current?.contains(n)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", away);
      setPos(null);
    };
  }, [open, setOpen, trigger, side, align, gap, first]);

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => all[(i + all.length) % all.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at < 0 ? all.length - 1 : at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return close(false);
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      // Type-ahead: the next action whose name starts with what's been typed.
      const now = Date.now();
      typed.current = { text: now - typed.current.at < 600 ? typed.current.text + e.key.toLowerCase() : e.key.toLowerCase(), at: now };
      const q = typed.current.text;
      const from = [...all.slice(at + 1), ...all.slice(0, at + 1)];
      from.find((el) => (el.dataset.label ?? el.textContent ?? "").trim().toLowerCase().startsWith(q))?.focus();
    } else return;
    e.preventDefault();
  };

  if (!mounted) return null;
  const below = (pos?.side ?? side) === "bottom";
  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={list}
            id={id}
            role="menu"
            aria-labelledby={`${id}-trigger`}
            aria-orientation="vertical"
            onKeyDown={onKey}
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: below ? -4 : 4 }}
            animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
            exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 600, damping: 38 }}
            style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, transformOrigin: `${align === "start" ? "left" : align === "end" ? "right" : "center"} ${below ? "top" : "bottom"}` }}
            className={cx("z-[90] min-w-[232px] max-w-[calc(100vw-16px)] rounded-[16px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] outline-none shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]", className)}
          >
            <MenuClose.Provider value={close}>{children}</MenuClose.Provider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/* How an item closes the menu after it's chosen. */
const MenuClose = createContext<(refocus?: boolean) => void>(() => {});

/** A section's name, small and quiet, over its actions. */
export function MenuLabel({ className, ...props }: ComponentProps<"div">) {
  return <div role="presentation" className={cx("px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--bd-subtle)]", className)} {...props} />;
}

/** A hairline between sections. */
export function MenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cx("mx-1 my-1.5 h-px bg-[var(--bd-line-subtle)]", className)} />;
}

/** A group of actions, for a screen reader: give it the same `label` as its MenuLabel. */
export function MenuGroup({ label, className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={className}>
      {children}
    </div>
  );
}

/* An action's shortcut, a small key each: ["⌘", "D"]. */
function Keys({ keys }: { keys: string[] }) {
  return (
    <span aria-hidden className="ml-auto flex shrink-0 gap-0.5 pl-4">
      {keys.map((k) => (
        <kbd key={k} className="grid h-5 min-w-5 place-items-center rounded-[5px] bg-[rgb(var(--bd-ink)/0.05)] px-1 font-sans text-[11px] font-medium text-[var(--bd-subtle)] shadow-[inset_0_-1px_0_rgb(var(--bd-ink)/0.08)]">
          {k}
        </kbd>
      ))}
    </span>
  );
}

const ROW =
  "group/item relative flex h-9 w-full cursor-default select-none items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] outline-none transition-colors duration-100 focus:bg-[rgb(var(--bd-ink)/0.06)] aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0";

/** One action. It runs `onSelect` and closes the menu; `tone="stop"` for the one that can't be undone. */
export function MenuItem({ icon, shortcut, onSelect, disabled, tone = "default", className, children }: { icon?: ReactNode; /** Its keys, one each: ["⌘", "D"]. Shown, not bound: bind them yourself. */ shortcut?: string[]; onSelect?: () => void; disabled?: boolean; tone?: "default" | "stop"; className?: string; children: ReactNode }) {
  const close = useContext(MenuClose);
  const run = () => {
    if (disabled) return;
    close();
    onSelect?.();
  };
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={run}
      onPointerMove={(e) => document.activeElement !== e.currentTarget && e.currentTarget.focus({ preventScroll: true })}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        run();
      }}
      className={cx(ROW, tone === "stop" ? "text-[var(--bd-ui-stop)] focus:bg-[color-mix(in_oklab,var(--bd-ui-stop)_10%,transparent)]" : "text-[var(--bd-fg)]", className)}
    >
      {icon && <span className={cx("grid place-items-center", tone === "stop" ? "" : "text-[var(--bd-muted)] group-focus/item:text-[var(--bd-fg)]")}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <Keys keys={shortcut} />}
    </div>
  );
}

/** An option that ticks on and off. Choosing it keeps the menu open, so several can be set in a row. */
export function MenuCheckboxItem({ checked, defaultChecked = false, onCheckedChange, shortcut, disabled, className, children }: { checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void; shortcut?: string[]; disabled?: boolean; className?: string; children: ReactNode }) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const flip = () => {
    if (disabled) return;
    setInner(!on);
    onCheckedChange?.(!on);
  };
  return (
    <div
      role="menuitemcheckbox"
      aria-checked={on}
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={flip}
      onPointerMove={(e) => document.activeElement !== e.currentTarget && e.currentTarget.focus({ preventScroll: true })}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        flip();
      }}
      className={cx(ROW, "text-[var(--bd-fg)]", className)}
    >
      {/* The tick: an ink dot with a check when it's on, an empty ring when it's off. */}
      <span aria-hidden className={cx("grid size-4 place-items-center rounded-full transition-[background,box-shadow] duration-150", on ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.2)]")}>
        <AnimatePresence initial={false}>{on && <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 700, damping: 30 }} className="grid place-items-center [&_svg]:!size-2.5"><CheckIcon weight="bold" /></motion.span>}</AnimatePresence>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <Keys keys={shortcut} />}
    </div>
  );
}
