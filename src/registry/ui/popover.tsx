"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type MouseEvent, type ReactElement, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * A small card that opens from what you pressed, for a choice or a setting that belongs to it: a
 * color, a link to share, a few options. It stays beside its trigger as the page scrolls, flips
 * above it when there's no room below, and keeps inside the window. Focus moves into it; Escape,
 * a click elsewhere or tabbing away closes it, and focus goes back to the trigger.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
type Ctx = { open: boolean; setOpen: (o: boolean) => void; id: string; trigger: RefObject<HTMLElement | null>; scope: Scope; setScope: (s: Scope) => void };
const PopoverContext = createContext<Ctx | null>(null);
const usePopover = () => {
  const c = useContext(PopoverContext);
  if (!c) throw new Error("Popover parts go inside <Popover>.");
  return c;
};

/** Holds whether it's open. Leave `open` out and it keeps that itself. */
export function Popover({ open, defaultOpen = false, onOpenChange, children }: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
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
  return <PopoverContext.Provider value={{ open: open ?? inner, setOpen, id: useId(), trigger, scope, setScope }}>{children}</PopoverContext.Provider>;
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

/** What opens and closes it: a button of its own, or with `asChild`, the one element you pass. */
export function PopoverTrigger({ asChild, children, onClick, ...props }: ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen, id, trigger, setScope } = usePopover();
  const aria = { "aria-haspopup": "dialog" as const, "aria-expanded": open, "aria-controls": open ? id : undefined };
  const toggle = (e: MouseEvent<HTMLElement>) => {
    setScope(scopeOf(e.currentTarget));
    setOpen(!open);
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void; ref?: Ref<HTMLElement> }>;
    return cloneElement(child, {
      ...aria,
      ref: both(child.props.ref, trigger),
      onClick: (e: MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) toggle(e);
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
    >
      {children}
    </button>
  );
}

type Side = "top" | "bottom";
type Align = "start" | "center" | "end";

/* Where the card goes beside its trigger: on the side asked for if it fits, else the other, and never past the window's edge. */
function place(t: DOMRect, w: number, h: number, side: Side, align: Align, gap: number) {
  const pad = 8;
  let s = side;
  if (s === "bottom" && t.bottom + gap + h > innerHeight - pad && t.top - gap - h > pad) s = "top";
  else if (s === "top" && t.top - gap - h < pad && t.bottom + gap + h < innerHeight - pad) s = "bottom";
  const top = s === "bottom" ? t.bottom + gap : t.top - gap - h;
  const want = align === "start" ? t.left : align === "end" ? t.right - w : t.left + t.width / 2 - w / 2;
  return { top, left: Math.min(Math.max(pad, want), innerWidth - pad - w), side: s };
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The card, in a portal, beside its trigger. Give it a `label` when nothing inside it names it. */
export function PopoverContent({ side = "bottom", align = "center", gap = 8, label, className, children }: { side?: Side; align?: Align; /** Space between the trigger and the card, in pixels. */ gap?: number; label?: string; className?: string; children: ReactNode }) {
  const { open, setOpen, id, trigger, scope } = usePopover();
  const card = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const mounted = useMounted();
  const [pos, setPos] = useState<ReturnType<typeof place> | null>(null);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const t = trigger.current?.getBoundingClientRect();
      const c = card.current;
      if (t && c) setPos(place(t, c.offsetWidth, c.offsetHeight, side, align, gap));
    };
    // Measured once it has drawn, then kept beside its trigger as the page moves.
    const frame = requestAnimationFrame(() => {
      update();
      (card.current?.querySelector<HTMLElement>("[data-autofocus]") ?? card.current?.querySelector<HTMLElement>(FOCUSABLE) ?? card.current)?.focus({ preventScroll: true });
    });
    const ro = new ResizeObserver(update);
    if (card.current) ro.observe(card.current);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!card.current?.contains(n) && !trigger.current?.contains(n)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", onKey);
      setPos(null);
    };
  }, [open, setOpen, trigger, side, align, gap]);

  if (!mounted) return null;
  const below = (pos?.side ?? side) === "bottom";
  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={card}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            // Tabbing out of it closes it, the way leaving a field does.
            onBlur={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && !e.currentTarget.contains(next) && !trigger.current?.contains(next)) setOpen(false);
            }}
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: below ? -4 : 4 }}
            animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
            exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 560, damping: 38 }}
            style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, transformOrigin: `${align === "start" ? "left" : align === "end" ? "right" : "center"} ${below ? "top" : "bottom"}` }}
            className={cx("z-[90] w-max max-w-[calc(100vw-16px)] rounded-[18px] bg-[var(--bd-surface)] p-4 text-[var(--bd-fg)] outline-none shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]", className)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/** Closes it from inside: a button of its own, or with `asChild`, the one element you pass. */
export function PopoverClose({ asChild, children, onClick, ...props }: ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen, trigger } = usePopover();
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void }>;
    return cloneElement(child, {
      onClick: (e: MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) close();
      },
    } as Record<string, unknown>);
  }
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) close();
      }}
    >
      {children}
    </button>
  );
}
