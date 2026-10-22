"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type MouseEvent, type ReactElement, type ReactNode, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * basedraft's modal: a white card lifted over a dimmed, softly blurred page, a glow of the hero's
 * light at its head with faint dots fading out under it. Focus moves into it when it opens, stays
 * inside while it's open, and goes back to whatever opened it when it closes. Escape and a click
 * on the page behind close it. It opens in the light or dark of the place it was opened from.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
type Ctx = { open: boolean; setOpen: (o: boolean) => void; titleId: string; bodyId: string; trigger: RefObject<HTMLElement | null>; scope: Scope; setScope: (s: Scope) => void };
const DialogContext = createContext<Ctx | null>(null);
const useDialog = () => {
  const c = useContext(DialogContext);
  if (!c) throw new Error("Dialog parts go inside <Dialog>.");
  return c;
};

/** Holds whether it's open. Leave `open` out and it keeps that itself. */
export function Dialog({ open, defaultOpen = false, onOpenChange, children }: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  const [inner, setInner] = useState(defaultOpen);
  const shown = open ?? inner;
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
  return <DialogContext.Provider value={{ open: shown, setOpen, titleId: `${id}-title`, bodyId: `${id}-body`, trigger, scope, setScope }}>{children}</DialogContext.Provider>;
}

/* One element's ref and another's, both kept. */
const both =
  <T,>(...refs: Array<Ref<T> | undefined>) =>
  (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };

/** What opens it: a button of its own, or with `asChild`, the one element you pass. */
export function DialogTrigger({ asChild, children, onClick, ...props }: ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen, trigger, setScope } = useDialog();
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

/* The light or dark of the place it opens from, carried into the portal, so a dialog opened on a dark panel is dark too. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZES = { sm: "max-w-[400px]", md: "max-w-[480px]", lg: "max-w-[600px]" } as const;

/**
 * The card itself, in a portal over the page. `dismissible={false}` keeps it open on a click
 * behind it (Escape still closes it), for a step that mustn't be lost by accident.
 */
export function DialogContent({ size = "md", glow = true, closeButton = true, dismissible = true, className, children }: { size?: keyof typeof SIZES; /** The hero's light and fine dots at its head. */ glow?: boolean; closeButton?: boolean; dismissible?: boolean; className?: string; children: ReactNode }) {
  const { open, setOpen, titleId, bodyId, trigger, scope } = useDialog();
  const card = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const back = (document.activeElement as HTMLElement | null) ?? trigger.current;
    // Into the card: whatever asks for it with data-autofocus, or else the first thing that takes focus.
    const frame = requestAnimationFrame(() => {
      const c = card.current;
      (c?.querySelector<HTMLElement>("[data-autofocus]") ?? c?.querySelector<HTMLElement>(FOCUSABLE) ?? c)?.focus();
    });
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab" && card.current) {
        // Tab goes round inside the card, never out to the page behind it.
        const f = [...card.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
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
          <motion.div key="dialog" className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto p-4 text-[var(--bd-fg)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.14 } }}>
            <div aria-hidden className="fixed inset-0 bg-[rgb(var(--bd-shade)/0.38)] backdrop-blur-[3px]" onClick={() => dismissible && setOpen(false)} />
            <motion.div
              ref={card}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={bodyId}
              tabIndex={-1}
              initial={still ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 480, damping: 38 }}
              className={cx("relative isolate w-full overflow-hidden rounded-[22px] bg-[var(--bd-surface)] p-6 outline-none shadow-[0_30px_80px_-20px_rgb(var(--bd-shade)/0.45),0_0_0_1px_rgb(var(--bd-ink)/0.07)] sm:p-7", SIZES[size], className)}
            >
              {glow && (
                <>
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 [background:radial-gradient(55%_100%_at_92%_0%,var(--bd-glow-blue),transparent_72%),radial-gradient(50%_100%_at_8%_0%,var(--bd-glow-lilac),transparent_72%),radial-gradient(45%_90%_at_50%_0%,var(--bd-glow-mint),transparent_72%)]" />
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 opacity-80 [background:var(--bd-ui-dots)] [mask-image:linear-gradient(180deg,#000,rgb(0_0_0/0.4)_45%,transparent_92%)]" />
                </>
              )}
              {children}
              {/* After the content, so focus lands on the content first; it sits in the corner all the same. */}
              {closeButton && (
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
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

/** A tile for the dialog's icon, at its head, over the glow. */
export function DialogIcon({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cx("mb-5 grid size-11 place-items-center rounded-[14px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)] [&_svg]:size-[22px]", className)}>{children}</span>;
}

export function DialogTitle({ className, ...props }: ComponentProps<"h2">) {
  const { titleId } = useDialog();
  return <h2 id={titleId} className={cx("pr-8 text-[19px] font-semibold leading-[1.25] tracking-[-0.015em]", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<"p">) {
  const { bodyId } = useDialog();
  return <p id={bodyId} className={cx("mt-2 text-sm leading-relaxed text-[var(--bd-muted)]", className)} {...props} />;
}

/** The actions, at the card's foot: the main one last, on the right. On a phone they stack, main one on top. */
export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

/** Closes it: a button of its own, or with `asChild`, the one element you pass. */
export function DialogClose({ asChild, children, onClick, ...props }: ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useDialog();
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
