"use client";

import { CookieIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState, useSyncExternalStore, type ElementType, type ReactNode } from "react";

/*
 * Asking about cookies, fairly: a small card in a corner with Reject all and Accept all set the
 * same, so saying no is as easy as saying yes, and Customize opening to each kind with its own
 * switch. The choice is kept in this browser, read back with readConsent(), and openConsent() brings
 * the card back from a link like "Cookie settings" in the footer.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type ConsentCategory = {
  id: string;
  label: string;
  description?: string;
  /** Always on, and can't be switched off: the cookies the site needs to work. */
  required?: boolean;
};

export type ConsentChoice = { choices: Record<string, boolean>; at: string };

const OPEN = "bd-consent-open";
const SAVED = "bd-consent-saved";

/** What was chosen, under a key, or null if nothing has been. */
export function readConsent(storageKey = "consent"): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as ConsentChoice) : null;
  } catch {
    return null;
  }
}

/** Shows the card again, for a "Cookie settings" link: the one under this key, or every one. */
export function openConsent(storageKey?: string) {
  dispatchEvent(new CustomEvent(OPEN, { detail: storageKey }));
}

const subscribe = (fn: () => void) => {
  addEventListener("storage", fn);
  addEventListener(SAVED, fn);
  return () => {
    removeEventListener("storage", fn);
    removeEventListener(SAVED, fn);
  };
};

export type ConsentProps = {
  categories: ConsentCategory[];
  /** Runs with each kind's choice when the card is answered. */
  onSave?: (choices: Record<string, boolean>) => void;
  /** Where the choice is kept in this browser. */
  storageKey?: string;
  /** In a corner of the page, or in place. */
  position?: "bottom-left" | "bottom-right" | "inline";
  title?: ReactNode;
  description?: ReactNode;
  /** The privacy policy, linked from the card. */
  policyHref?: string;
  /** Your router's link. */
  link?: ElementType;
  className?: string;
};

export function Consent({
  categories,
  onSave,
  storageKey = "consent",
  position = "bottom-left",
  title = "We use cookies",
  description = "Some keep the site working. With your say, others help us see what's used, so we can make it better.",
  policyHref,
  link: Link = "a",
  className,
}: ConsentProps) {
  const answered = useSyncExternalStore(subscribe, () => !!readConsent(storageKey), () => true);
  const [again, setAgain] = useState(false);
  const [custom, setCustom] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>(() => Object.fromEntries(categories.map((c) => [c.id, !!c.required])));
  const still = useReducedMotion();
  const id = useId();

  useEffect(() => {
    const show = (e: Event) => {
      const key = (e as CustomEvent<string | undefined>).detail;
      if (key && key !== storageKey) return;
      const was = readConsent(storageKey);
      if (was) setPicked((p) => ({ ...p, ...was.choices }));
      setCustom(true);
      setAgain(true);
    };
    addEventListener(OPEN, show);
    return () => removeEventListener(OPEN, show);
  }, [storageKey]);

  const save = (choices: Record<string, boolean>) => {
    const all = Object.fromEntries(categories.map((c) => [c.id, c.required ? true : !!choices[c.id]]));
    try {
      localStorage.setItem(storageKey, JSON.stringify({ choices: all, at: new Date().toISOString() } satisfies ConsentChoice));
    } catch {}
    setAgain(false);
    setCustom(false);
    dispatchEvent(new Event(SAVED));
    onSave?.(all);
  };
  const every = (on: boolean) => Object.fromEntries(categories.map((c) => [c.id, on || !!c.required]));
  const open = !answered || again;
  const corner = position === "inline" ? "relative" : cx("fixed bottom-4 z-[100] w-[min(380px,calc(100vw-32px))]", position === "bottom-right" ? "right-4" : "left-4");

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="consent"
          role="dialog"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-text`}
          initial={still ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={still ? { opacity: 0 } : { opacity: 0, y: 16, transition: { duration: 0.18 } }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className={cx(corner, position === "inline" && "w-full max-w-[380px]", "rounded-[22px] bg-[var(--bd-surface)] p-5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]", className)}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[var(--bd-ui-track)] text-[var(--bd-muted)]">
              <CookieIcon weight="duotone" className="size-[18px]" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 id={`${id}-title`} className="text-[15px] font-medium leading-5">
                {title}
              </h2>
              <p id={`${id}-text`} className="mt-1 text-[13px] leading-[1.55] text-[var(--bd-muted)]">
                {description}{" "}
                {policyHref && (
                  <Link href={policyHref} className="whitespace-nowrap text-[var(--bd-fg)] underline underline-offset-[3px] decoration-[var(--bd-line-strong)] hover:decoration-current">
                    Privacy policy
                  </Link>
                )}
              </p>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {custom && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={still ? { duration: 0 } : { height: { type: "spring", stiffness: 380, damping: 36 }, opacity: { duration: 0.18 } }} className="overflow-hidden">
                <ul className="mt-4 grid gap-1 border-t border-[var(--bd-line-subtle)] pt-3">
                  {categories.map((c) => {
                    const on = c.required || picked[c.id];
                    return (
                      <li key={c.id} className="flex items-start gap-3 rounded-[12px] px-1 py-2">
                        <div className="min-w-0 flex-1">
                          <p id={`${id}-${c.id}`} className="flex items-center gap-2 text-[13.5px] font-medium">
                            {c.label}
                            {c.required && <span className="text-[11.5px] font-normal text-[var(--bd-subtle)]">Always on</span>}
                          </p>
                          {c.description && <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[var(--bd-muted)]">{c.description}</p>}
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!on}
                          aria-labelledby={`${id}-${c.id}`}
                          disabled={c.required}
                          onClick={() => setPicked((p) => ({ ...p, [c.id]: !p[c.id] }))}
                          className={cx("relative mt-0.5 h-6 w-10 shrink-0 rounded-full outline-none transition-[background,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:opacity-50", on ? "[background:var(--bd-ui-ink)]" : "bg-[var(--bd-ui-track)] shadow-[var(--bd-ui-well)]")}
                        >
                          <motion.span aria-hidden initial={false} animate={{ x: on ? 18 : 2 }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 34 }} className="absolute left-0 top-[3px] size-[18px] rounded-full [background:var(--bd-ui-bead)] shadow-[var(--bd-ui-lift)]" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {custom ? (
              <button type="button" onClick={() => save(picked)} className={BTN_INK}>
                Save my choices
              </button>
            ) : (
              <button type="button" onClick={() => setCustom(true)} className="h-9 rounded-full px-3 text-[13px] font-medium text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                Customize
              </button>
            )}
            <span className="ml-auto flex gap-2">
              {/* The same weight, side by side: no is as easy as yes. */}
              <button type="button" onClick={() => save(every(false))} className={BTN_EVEN}>
                Reject all
              </button>
              <button type="button" onClick={() => save(every(true))} className={BTN_EVEN}>
                Accept all
              </button>
            </span>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

const BTN_EVEN = "h-9 rounded-full bg-[var(--bd-surface)] px-4 text-[13px] font-medium text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)] outline-none transition-colors hover:bg-[var(--bd-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]";
const BTN_INK = "h-9 rounded-full px-4 text-[13px] font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_4px_12px_-6px_rgb(var(--bd-shade)/0.5)] outline-none transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]";
