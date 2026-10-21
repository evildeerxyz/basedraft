"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { createContext, use, useId, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

/*
 * Tabs as a quiet row of names, the selected one inked on a pill that slides to the next, and its
 * panel rising in under them. The arrow keys move between tabs. Controlled with value and
 * onValueChange, or left to keep its own state.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type TabsState = { value: string; setValue: (v: string) => void; id: string };
const TabsContext = createContext<TabsState | null>(null);
const useTabs = () => {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error("Tabs parts go inside <Tabs>.");
  return ctx;
};

export function Tabs({ value, defaultValue = "", onValueChange, className, children }: { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; className?: string; children: ReactNode }) {
  const [inner, setInner] = useState(defaultValue);
  const id = useId();
  const current = value ?? inner;
  const setValue = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext value={{ value: current, setValue, id }}>
      <LayoutGroup id={id}>
        <div className={cx("flex flex-col gap-4", className)}>{children}</div>
      </LayoutGroup>
    </TabsContext>
  );
}

export function TabsList({ className, onKeyDown, ...props }: ComponentProps<"div">) {
  const tabs = useTabs();
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const all = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")];
    const i = all.findIndex((b) => b.getAttribute("aria-selected") === "true");
    const next = all[(i + step + all.length) % all.length];
    next?.focus();
    if (next?.dataset.value) tabs.setValue(next.dataset.value);
  };
  return <div role="tablist" onKeyDown={onKey} className={cx("inline-flex w-fit items-center gap-1 rounded-full p-1 shadow-[inset_0_0_0_1px_var(--bd-line)]", className)} {...props} />;
}

export function TabsTrigger({ value, className, children, ...props }: ComponentProps<"button"> & { value: string }) {
  const tabs = useTabs();
  const on = tabs.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${tabs.id}-tab-${value}`}
      data-value={value}
      aria-selected={on}
      aria-controls={`${tabs.id}-panel-${value}`}
      tabIndex={on ? 0 : -1}
      onClick={() => tabs.setValue(value)}
      className={cx(
        "relative flex h-8 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors duration-200 [&_svg]:size-4",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]",
        on ? "text-[var(--bd-ui-ink-text)]" : "text-[var(--bd-muted)] hover:text-[var(--bd-fg)]",
        className,
      )}
      {...props}
    >
      {on && <motion.span layoutId="tab" className="absolute inset-0 rounded-full [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_4px_12px_-6px_rgb(var(--bd-shade)/0.5)]" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
      <span className="relative flex items-center gap-1.5">{children}</span>
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const tabs = useTabs();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {tabs.value === value && (
        <motion.div
          key={value}
          role="tabpanel"
          id={`${tabs.id}-panel-${value}`}
          aria-labelledby={`${tabs.id}-tab-${value}`}
          initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
