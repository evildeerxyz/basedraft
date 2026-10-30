"use client";

import { ArrowDownRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * The figures that matter, as tabs across the top of a card, and under them whatever the chosen
 * one shows: pick Revenue and the chart is revenue. Each tab is a label, the figure in large type,
 * and how far it moved, in green or red by whether that's good news, so a fall in refunds reads
 * as good. An ink rule slides to the tab that's on. The arrow keys walk them; on a narrow screen
 * they scroll sideways.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type MetricFormat = "number" | "compact" | "currency" | "percent" | ((value: number) => string);

export type Metric = {
  id: string;
  label: string;
  value: number;
  format?: MetricFormat;
  /** Its change as a share: 0.12 is up 12%. */
  delta?: number;
  /** Which way is good news. Up by default; down for costs, errors and wait times. */
  good?: "up" | "down";
  /** A short line under it, like "vs last week". */
  note?: ReactNode;
};

export type MetricTabsProps = {
  metrics: Metric[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** What shows under the tabs: the chart for the chosen one. A function gets the metric. */
  children?: ReactNode | ((metric: Metric) => ReactNode);
  currency?: string;
  /** What the tabs are, for a screen reader. */
  label?: string;
  className?: string;
};

const show = (m: Metric, currency: string) => {
  const f = m.format ?? "number";
  if (typeof f === "function") return f(m.value);
  const opts: Intl.NumberFormatOptions = f === "currency" ? { style: "currency", currency, maximumFractionDigits: m.value >= 1000 ? 0 : 2 } : f === "compact" ? { notation: "compact", maximumFractionDigits: 1 } : f === "percent" ? { style: "percent", maximumFractionDigits: 1 } : {};
  return new Intl.NumberFormat("en-US", opts).format(m.value);
};

export function MetricTabs({ metrics, value, defaultValue, onValueChange, children, currency = "USD", label = "Metrics", className }: MetricTabsProps) {
  const [inner, setInner] = useState(defaultValue ?? metrics[0]?.id);
  const current = value ?? inner;
  const active = metrics.find((m) => m.id === current) ?? metrics[0];
  const id = useId();
  const still = useReducedMotion();
  const pick = (next: string) => {
    setInner(next);
    onValueChange?.(next);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = metrics.findIndex((m) => m.id === active.id);
    const next = metrics[(i + step + metrics.length) % metrics.length];
    pick(next.id);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`)?.focus();
  };
  const body = typeof children === "function" ? children(active) : children;

  return (
    <div className={cx("@container overflow-hidden rounded-[20px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_1px_2px_rgb(var(--bd-shade)/0.05),0_16px_36px_-22px_rgb(var(--bd-shade)/0.35)]", className)}>
      <LayoutGroup id={id}>
        <div role="tablist" aria-label={label} onKeyDown={onKey} className="flex overflow-x-auto border-b border-[var(--bd-line-subtle)] [scrollbar-width:none]">
          {metrics.map((m) => {
            const on = m.id === active.id;
            const up = (m.delta ?? 0) >= 0;
            const fine = m.delta === undefined || m.delta === 0 ? null : up === ((m.good ?? "up") === "up");
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                data-id={m.id}
                id={`${id}-${m.id}`}
                aria-selected={on}
                aria-controls={`${id}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => pick(m.id)}
                className={cx("group relative min-w-[168px] flex-1 px-5 pb-4 pt-[18px] text-left @max-[480px]:min-w-0 @max-[480px]:px-3 @max-[480px]:pb-3 @max-[480px]:pt-3.5 outline-none transition-colors duration-200 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-[var(--bd-line-subtle)] focus-visible:bg-[rgb(var(--bd-ink)/0.04)]", on ? "bg-[var(--bd-surface)]" : "bg-[color-mix(in_oklab,var(--bd-ui-track)_35%,var(--bd-surface))] hover:bg-[color-mix(in_oklab,var(--bd-ui-track)_15%,var(--bd-surface))]")}
              >
                {on && <motion.span layoutId="metric-rule" aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-[var(--bd-fg)]" transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }} />}
                <span className={cx("block text-[13px] transition-colors", on ? "font-medium text-[var(--bd-fg)]" : "text-[var(--bd-muted)]")}>{m.label}</span>
                <span className="mt-2 flex items-baseline gap-2.5 @max-[480px]:flex-col @max-[480px]:items-start @max-[480px]:gap-1">
                  <span className={cx("text-[26px] font-semibold leading-none @max-[480px]:text-[20px] tracking-[-0.03em] tabular-nums transition-colors", on ? "text-[var(--bd-fg)]" : "text-[color-mix(in_oklab,var(--bd-fg)_78%,transparent)]")}>{show(m, currency)}</span>
                  {m.delta !== undefined && (
                    <span className={cx("inline-flex items-center gap-0.5 text-[12.5px] font-medium tabular-nums", fine === null ? "text-[var(--bd-muted)]" : fine ? "text-[var(--bd-ui-ok)]" : "text-[var(--bd-ui-stop)]")}>
                      {up ? <ArrowUpRightIcon size={12} weight="regular" /> : <ArrowDownRightIcon size={12} weight="regular" />}
                      {Math.abs(m.delta * 100).toFixed(Math.abs(m.delta) < 0.1 ? 1 : 0)}%
                    </span>
                  )}
                </span>
                {m.note && <span className="mt-1.5 block truncate text-[12px] text-[var(--bd-subtle)] @max-[480px]:hidden">{m.note}</span>}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {body !== undefined && (
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${active.id}`} className="relative p-4 sm:p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={active.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0 : 0.18 }}>
              {body}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
