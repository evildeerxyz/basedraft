"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type FocusEvent, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * A card that previews what a link leads to (a template, a person) when you rest on the link for
 * a moment, or reach it with the keyboard. Moving the pointer from the link to the card keeps it
 * open: anywhere in the triangle between the pointer and the card's near edge counts as on the
 * way. It closes a moment after the pointer leaves both, or at once with Escape. A small caret
 * points back at the link, and the card flips above it when there's no room below.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

type Ctx = {
  open: boolean;
  id: string;
  trigger: RefObject<HTMLElement | null>;
  card: RefObject<HTMLDivElement | null>;
  scope: Scope;
  /** Open after the delay (or now), or close after the grace (or now). */
  soon: (open: boolean, now?: boolean) => void;
  /** Stop whatever was about to happen. */
  hold: () => void;
  leaveTrigger: (e: ReactPointerEvent<HTMLElement>) => void;
  setScope: (s: Scope) => void;
};
const HoverCardContext = createContext<Ctx | null>(null);
const useHoverCard = () => {
  const c = useContext(HoverCardContext);
  if (!c) throw new Error("Hover card parts go inside <HoverCard>.");
  return c;
};

type Point = { x: number; y: number };
/* Whether p is inside the triangle a, b, c, by which side of each edge it falls. */
const inTriangle = (p: Point, a: Point, b: Point, c: Point) => {
  const s = (p1: Point, p2: Point, p3: Point) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = s(p, a, b);
  const d2 = s(p, b, c);
  const d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

/** Holds whether it's open, and its timing: `openDelay` before it shows, `closeDelay` of grace before it goes. */
export function HoverCard({ openDelay = 400, closeDelay = 200, children }: { openDelay?: number; closeDelay?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const card = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const watch = useRef<(() => void) | null>(null);
  const [scope, setScope] = useState<Scope>({});
  const id = useId();

  const stopWatching = () => {
    watch.current?.();
    watch.current = null;
  };
  const hold = useCallback(() => clearTimeout(timer.current), []);
  const soon = useCallback(
    (next: boolean, now = false) => {
      clearTimeout(timer.current);
      if (now) return setOpen(next);
      timer.current = setTimeout(() => setOpen(next), next ? openDelay : closeDelay);
    },
    [openDelay, closeDelay],
  );

  // Leaving the link toward the card: while the pointer stays in the triangle from where it left
  // to the card's near edge, the grace keeps starting over; anywhere else, it runs out.
  const leaveTrigger = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      stopWatching();
      const c = card.current?.getBoundingClientRect();
      const t = trigger.current?.getBoundingClientRect();
      if (!c || !t) return soon(false, !open);
      const from = { x: e.clientX, y: e.clientY };
      const below = c.top >= t.top;
      const edge = below ? c.top : c.bottom;
      const a = { x: c.left, y: edge };
      const b = { x: c.right, y: edge };
      soon(false);
      const move = (ev: PointerEvent) => {
        const p = { x: ev.clientX, y: ev.clientY };
        const r = card.current?.getBoundingClientRect();
        // Made it to the card: it stays.
        if (r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) {
          stopWatching();
          return hold();
        }
        if (inTriangle(p, from, a, b)) soon(false);
        else stopWatching();
      };
      document.addEventListener("pointermove", move);
      watch.current = () => document.removeEventListener("pointermove", move);
    },
    [open, soon, hold],
  );

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      clearTimeout(timer.current);
      setOpen(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      watch.current?.();
    },
    [],
  );

  return <HoverCardContext.Provider value={{ open, id, trigger, card, scope, soon, hold, leaveTrigger, setScope }}>{children}</HoverCardContext.Provider>;
}

const both =
  <T,>(...refs: Array<Ref<T> | undefined>) =>
  (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };

/** What it previews: a link of its own, or with `asChild`, the one element you pass (your router's Link, say). */
export function HoverCardTrigger({ asChild, children, ...props }: ComponentProps<"a"> & { asChild?: boolean }) {
  const { soon, trigger, leaveTrigger, setScope, card } = useHoverCard();
  const handlers = {
    onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      setScope(scopeOf(e.currentTarget));
      soon(true);
    },
    onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse") leaveTrigger(e);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.matches(":focus-visible")) return;
      setScope(scopeOf(e.currentTarget));
      soon(true);
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!card.current?.contains(e.relatedTarget as Node | null)) soon(false, true);
    },
    // A press means you're going there: no card on the way.
    onPointerDown: () => soon(false, true),
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown> & { ref?: Ref<HTMLElement> }>;
    const merged: Record<string, unknown> = { ref: both(child.props.ref, trigger) };
    for (const [k, fn] of Object.entries(handlers)) {
      const own = child.props[k] as ((e: unknown) => void) | undefined;
      merged[k] = (e: unknown) => {
        own?.(e);
        (fn as (e: unknown) => void)(e);
      };
    }
    return cloneElement(child, merged);
  }
  return (
    <a ref={both(props.ref, trigger as Ref<HTMLAnchorElement>)} {...props} {...handlers}>
      {children}
    </a>
  );
}

type Side = "top" | "bottom";
type Align = "start" | "center" | "end";

/* Where the card goes: on the side asked for if it fits, else the other, never past the window's edge; and where its caret points. */
function place(t: DOMRect, w: number, h: number, side: Side, align: Align, gap: number) {
  const pad = 8;
  let s = side;
  if (s === "bottom" && t.bottom + gap + h > innerHeight - pad && t.top - gap - h > pad) s = "top";
  else if (s === "top" && t.top - gap - h < pad && t.bottom + gap + h < innerHeight - pad) s = "bottom";
  const want = align === "start" ? t.left : align === "end" ? t.right - w : t.left + t.width / 2 - w / 2;
  const left = Math.min(Math.max(pad, want), innerWidth - pad - w);
  return { top: s === "bottom" ? t.bottom + gap : t.top - gap - h, left, side: s, caret: Math.min(Math.max(18, t.left + t.width / 2 - left), w - 18) };
}

/** The card, in a portal, beside what it previews. */
export function HoverCardContent({ side = "bottom", align = "center", gap = 10, className, children }: { side?: Side; align?: Align; /** Space between the link and the card, in pixels. */ gap?: number; className?: string; children: ReactNode }) {
  const { open, id, trigger, card, scope, soon, hold } = useHoverCard();
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
    const frame = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    if (card.current) ro.observe(card.current);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      setPos(null);
    };
  }, [open, trigger, card, side, align, gap]);

  if (!mounted) return null;
  const below = (pos?.side ?? side) === "bottom";
  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={card}
            id={id}
            data-side={pos?.side ?? side}
            onPointerEnter={hold}
            onPointerLeave={(e) => e.pointerType === "mouse" && soon(false)}
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: below ? -6 : 6 }}
            animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
            exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: below ? -4 : 4, transition: { duration: 0.14 } }}
            transition={SOFT}
            style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, transformOrigin: `${pos?.caret ?? 0}px ${below ? "0" : "100%"}` }}
            className={cx("z-[90] w-[300px] max-w-[calc(100vw-16px)] rounded-[18px] bg-[var(--bd-surface)] p-4 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]", className)}
          >
            {/* The caret, pointing back at the link. */}
            <span aria-hidden className={cx("absolute size-3 -translate-x-1/2 rotate-45 rounded-[3px] bg-[var(--bd-surface)]", below ? "-top-1.5 shadow-[-1px_-1px_0_rgb(var(--bd-ink)/0.08)]" : "-bottom-1.5 shadow-[1px_1px_0_rgb(var(--bd-ink)/0.08)]")} style={{ left: pos?.caret ?? "50%" }} />
            <div className="relative">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
