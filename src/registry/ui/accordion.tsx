"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Children, createContext, use, useId, useState, type ReactNode } from "react";

/*
 * Questions in a numbered list on one card: each row has its number, the question, and a plus
 * that turns into a cross as its answer springs open to its own height. One open at a time, or
 * several with type="multiple".
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type AccordionState = { open: string[]; toggle: (v: string) => void; numbered: boolean };
const AccordionContext = createContext<AccordionState | null>(null);
const ItemContext = createContext<{ value: string; id: string; n: number } | null>(null);
const NumberContext = createContext(0);

export function Accordion({ type = "single", defaultValue = [], numbered = true, className, children }: { type?: "single" | "multiple"; defaultValue?: string[]; /** A number before each question. */ numbered?: boolean; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState<string[]>(defaultValue);
  const toggle = (v: string) => setOpen((o) => (o.includes(v) ? o.filter((x) => x !== v) : type === "single" ? [v] : [...o, v]));
  return (
    <MotionConfig reducedMotion="user">
      <AccordionContext value={{ open, toggle, numbered }}>
        <div className={cx("overflow-hidden rounded-[20px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
          {/* Each item learns its place in the list, for its number. */}
          {Children.toArray(children).map((child, i) => (
            <NumberContext key={i} value={i + 1}>
              {child}
            </NumberContext>
          ))}
        </div>
      </AccordionContext>
    </MotionConfig>
  );
}

export function AccordionItem({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const id = useId();
  const n = use(NumberContext);
  const acc = use(AccordionContext)!;
  const on = acc.open.includes(value);
  return (
    <ItemContext value={{ value, id, n }}>
      <div className={cx("border-t border-[var(--bd-line-subtle)] transition-colors duration-300 first:border-t-0", on && "bg-[color-mix(in_oklab,var(--bd-ui-track)_32%,var(--bd-surface))]", className)}>{children}</div>
    </ItemContext>
  );
}

export function AccordionTrigger({ className, children }: { className?: string; children: ReactNode }) {
  const acc = use(AccordionContext)!;
  const item = use(ItemContext)!;
  const on = acc.open.includes(item.value);
  return (
    <button
      type="button"
      id={`${item.id}-trigger`}
      aria-expanded={on}
      aria-controls={`${item.id}-content`}
      onClick={() => acc.toggle(item.value)}
      className={cx("flex w-full items-center gap-3.5 px-4 py-3.5 text-left text-sm font-medium text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]", className)}
    >
      {acc.numbered && <span className={cx("w-5 shrink-0 font-mono text-[11px] tabular-nums transition-colors duration-300", on ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)]")}>{String(item.n).padStart(2, "0")}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      <span className={cx("grid size-6 shrink-0 place-items-center rounded-full transition-[rotate,background-color,color] duration-300 ease-[var(--bd-ease)]", on ? "rotate-45 text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "bg-[var(--bd-ui-field)] text-[var(--bd-muted)] shadow-[var(--bd-ui-well)]")}>
        <PlusIcon size={12} weight="regular" />
      </span>
    </button>
  );
}

export function AccordionContent({ className, children }: { className?: string; children: ReactNode }) {
  const acc = use(AccordionContext)!;
  const item = use(ItemContext)!;
  const on = acc.open.includes(item.value);
  return (
    <AnimatePresence initial={false}>
      {on && (
        <motion.div
          id={`${item.id}-content`}
          role="region"
          aria-labelledby={`${item.id}-trigger`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ height: { type: "spring", stiffness: 380, damping: 38 }, opacity: { duration: 0.2 } }}
          className="overflow-hidden"
        >
          <div className={cx("pb-4 pr-12 text-sm leading-relaxed text-[var(--bd-muted)]", acc.numbered ? "pl-[50px]" : "pl-4", className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
