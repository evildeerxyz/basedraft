"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type MouseEvent, type ReactElement, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * A panel that slides in from an edge of the window and floats there, a little in from the edge,
 * with the page dimmed behind it: for settings, details and forms too long for a dialog. From the
 * bottom it's a phone's sheet, with a grip to drag it down and away. Focus is held inside while
 * it's open and given back after; Escape and a click on the page close it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
type Ctx = { open: boolean; setOpen: (o: boolean) => void; titleId: string; bodyId: string; trigger: RefObject<HTMLElement | null>; scope: Scope; setScope: (s: Scope) => void };
const SheetContext = createContext<Ctx | null>(null);
const useSheet = () => {
  const c = useContext(SheetContext);
  if (!c) throw new Error("Sheet parts go inside <Sheet>.");
  return c;
};

/** Holds whether it's open. Leave `open` out and it keeps that itself. */
export function Sheet({ open, defaultOpen = false, onOpenChange, children }: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  const [inner, setInner] = useState(defaultOpen);
  const setOpen = useCallback(
    (o: boolean) => {
      setInner(o);
      onOpenChange?.(o);
    },
    [onOpenChange],
  );
  const id = useId();
  const trigger = useRef<HTMLElement | null>(null);
  const [scope, setScope] = useState<Scope>({});
  return <SheetContext.Provider value={{ open: open ?? inner, setOpen, titleId: `${id}-title`, bodyId: `${id}-body`, trigger, scope, setScope }}>{children}</SheetContext.Provider>;
}

const both =
  <T,>(...refs: Array<Ref<T> | undefined>) =>
  (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };

/* The light or dark of the place it opens from, carried into the portal. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

/** What opens it: a button of its own, or with `asChild`, the one element you pass. */
export function SheetTrigger({ asChild, children, onClick, ...props }: ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen, trigger, setScope } = useSheet();
  const aria = { "aria-haspopup": "dialog" as const, "aria-expanded": open };
  const opening = (e: MouseEvent<HTMLElement>) => {
    setScope(scopeOf(e.currentTarget));
    setOpen(true);
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void; ref?: Ref<HTMLElement> }>;
    return cloneElement(child, {
      ...aria,
      ref: both(child.props.ref, trigger),
      onClick: (e: MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) opening(e);
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
        if (!e.defaultPrevented) opening(e);
      }}
    >
      {children}
    </button>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* Where each side sits, and where it comes in from. */
const SIDES = {
  right: { box: "inset-y-2 right-2 w-[min(420px,calc(100vw-16px))]", from: { x: "calc(100% + 16px)" } },
  left: { box: "inset-y-2 left-2 w-[min(420px,calc(100vw-16px))]", from: { x: "calc(-100% - 16px)" } },
  bottom: { box: "inset-x-2 bottom-2 mx-auto max-h-[min(86vh,720px)] max-w-[640px]", from: { y: "calc(100% + 16px)" } },
} as const;

/**
 * The panel, in a portal over the page. From the bottom, it carries a grip: drag it down far
 * enough, or fast enough, and it goes.
 */
export function SheetContent({ side = "right", closeButton = true, className, children }: { side?: keyof typeof SIDES; closeButton?: boolean; className?: string; children: ReactNode }) {
  const { open, setOpen, titleId, bodyId, trigger, scope } = useSheet();
  const panel = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const mounted = useMounted();
  const drag = useDragControls();
  const s = SIDES[side];
  const bottom = side === "bottom";

  useEffect(() => {
    if (!open) return;
    const back = (document.activeElement as HTMLElement | null) ?? trigger.current;
    const frame = requestAnimationFrame(() => {
      const c = panel.current;
      (c?.querySelector<HTMLElement>("[data-autofocus]") ?? c?.querySelector<HTMLElement>(FOCUSABLE) ?? c)?.focus();
    });
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab" && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!f.length) return e.preventDefault();
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
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      root.style.overflow = overflow;
      if (back?.isConnected) back.focus();
    };
  }, [open, setOpen, trigger]);

  if (!mounted) return null;
  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <AnimatePresence>
        {open && (
          <motion.div key="sheet" className="fixed inset-0 z-[100] text-[var(--bd-fg)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.05 } }}>
            <div aria-hidden className="fixed inset-0 bg-[rgb(var(--bd-shade)/0.34)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={bodyId}
              tabIndex={-1}
              initial={still ? { opacity: 0 } : s.from}
              animate={still ? { opacity: 1 } : { x: 0, y: 0 }}
              exit={still ? { opacity: 0 } : s.from}
              transition={{ type: "spring", stiffness: 420, damping: 42 }}
              drag={bottom && !still ? "y" : false}
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.04, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) setOpen(false);
              }}
              className={cx("fixed flex flex-col overflow-hidden rounded-[24px] bg-[var(--bd-surface)] outline-none shadow-[0_30px_80px_-20px_rgb(var(--bd-shade)/0.5),0_0_0_1px_rgb(var(--bd-ink)/0.07)]", s.box, className)}
            >
              {/* The grip: only it starts a drag, so a long body still scrolls. */}
              {bottom && (
                <span aria-hidden onPointerDown={(e) => drag.start(e)} className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing">
                  <span className="h-1.5 w-10 rounded-full bg-[rgb(var(--bd-ink)/0.14)]" />
                </span>
              )}
              {children}
              {/* After the content, so focus lands on the content first; it sits in the corner all the same. */}
              {closeButton && (
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3.5 top-3.5 z-10 grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                  <XIcon size={15} weight="regular" />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/** The top of the panel: its title and a line on it, on a faint wash of paper, above a hairline. */
export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("shrink-0 border-b border-[var(--bd-line-subtle)] px-6 pb-5 pr-14 pt-6 [background:var(--bd-ui-paper)]", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentProps<"h2">) {
  const { titleId } = useSheet();
  return <h2 id={titleId} className={cx("text-[18px] font-semibold leading-[1.3] tracking-[-0.015em]", className)} {...props} />;
}

export function SheetDescription({ className, ...props }: ComponentProps<"p">) {
  const { bodyId } = useSheet();
  return <p id={bodyId} className={cx("mt-1.5 text-sm leading-relaxed text-[var(--bd-muted)]", className)} {...props} />;
}

/** The middle, which scrolls on its own when it's long. */
export function SheetBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("min-h-0 flex-1 overflow-y-auto px-6 py-5", className)} {...props} />;
}

/** The actions, held at the foot above a hairline, however long the body runs. */
export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--bd-line-subtle)] px-6 py-4 sm:flex-row sm:justify-end", className)} {...props} />;
}

/** Closes it: a button of its own, or with `asChild`, the one element you pass. */
export function SheetClose({ asChild, children, onClick, ...props }: ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useSheet();
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void }>;
    return cloneElement(child, {
      onClick: (e: MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      },
    } as Record<string, unknown>);
  }
  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
    >
      {children}
    </button>
  );
}
