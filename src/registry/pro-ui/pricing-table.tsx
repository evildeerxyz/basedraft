"use client";

import { CaretDownIcon, CheckIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/*
 * A pricing section, whole: a switch between paying monthly and yearly whose prices roll over to
 * the new figures a digit at a time, Yearly carrying a tag of what it saves; each plan a raised face
 * on a soft shell with its features listed on the shell, the one you'd pick lit by the hero's light; a seat stepper on a plan
 * priced per seat, its total rolling as you count; and under it all, a comparison of every feature
 * that opens with its plans' names held at the top as you scroll. On a phone the plans become a
 * row you swipe through, landing on the one you'd pick.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;

export type BillingPeriod = "monthly" | "yearly";

export type PricingFeature = string | { label: ReactNode; /** Off, it's shown struck through with a dash: what the plan doesn't have. */ included?: boolean; note?: ReactNode };

/** What someone chose, handed to a plan's action. */
export type PricingChoice = { plan: string; period: BillingPeriod; seats: number; /** A month's total at this period, or null for a plan without a price. */ total: number | null };

export type PricingPlan = {
  id: string;
  name: ReactNode;
  description?: ReactNode;
  /** A month's price, paying monthly and paying yearly. Leave it out for a plan you price by talking. */
  price?: { monthly: number; yearly: number };
  /** Shown in the price's place when there's no price, like "Let's talk". */
  priceLabel?: ReactNode;
  /** Priced per seat: the price is one seat's, and a stepper sets how many. */
  seats?: { min?: number; max?: number; default?: number };
  features?: PricingFeature[];
  /** The plan's one action: a link, or a button that's handed what was chosen. */
  cta: { label: ReactNode; href?: string; onClick?: (choice: PricingChoice) => void };
  /** The plan you'd pick: lit by the hero's light, with its action in metal. One at most. */
  recommended?: boolean;
  /** A word on the recommended plan, like "Most picked". */
  badge?: ReactNode;
};

export type PricingCompareRow = { label: ReactNode; note?: ReactNode; /** By plan id: true for a tick, false for a dash, or words. */ values: Record<string, boolean | ReactNode> };
export type PricingCompareGroup = { label: ReactNode; rows: PricingCompareRow[] };

export type PricingTableProps = {
  plans: PricingPlan[];
  period?: BillingPeriod;
  defaultPeriod?: BillingPeriod;
  onPeriodChange?: (period: BillingPeriod) => void;
  currency?: string;
  locale?: string;
  /** Every feature, plan by plan, in groups: opens under the plans. */
  compare?: PricingCompareGroup[];
  defaultCompareOpen?: boolean;
  /** Where the comparison's plan names stick, from the top of the window: past a site's own header. */
  stickyTop?: number;
  /** For screen readers: what this pricing is. */
  label?: string;
  className?: string;
};

/* ---------- a number that rolls ---------- */

/** One digit: a reel of 0 to 9 behind a one-digit window. A new value turns it; a change mid-turn just turns it on. */
function Reel({ digit, delay, still }: { digit: number; delay: number; still: boolean }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden">
      <span className="invisible">0</span>
      <motion.span className="absolute inset-x-0 top-0 flex flex-col" initial={false} animate={{ y: `${-digit}em` }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 210, damping: 24, mass: 0.8, delay }}>
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} className="block h-[1em]">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** An amount of money, its digits rolling to each new value, the ones a beat before the tens. A screen reader hears the amount. */
function Money({ value, currency, locale, className }: { value: number; currency: string; locale: string; className?: string }) {
  const still = !!useReducedMotion();
  const text = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
  const chars = [...text];
  return (
    <span className={cx("inline-flex items-baseline whitespace-nowrap leading-none tabular-nums", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex leading-none">
        {chars.map((ch, i) => {
          const fromEnd = chars.length - i;
          return /\d/.test(ch) ? <Reel key={`d${fromEnd}`} digit={+ch} delay={fromEnd * 0.03} still={still} /> : <span key={`c${fromEnd}`}>{ch}</span>;
        })}
      </span>
    </span>
  );
}

/* ---------- the period switch ---------- */

function PeriodSwitch({ period, onChange, save }: { period: BillingPeriod; onChange: (p: BillingPeriod) => void; save: number }) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const options: Array<{ value: BillingPeriod; label: string }> = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];
  const onKey = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = period === "monthly" ? "yearly" : "monthly";
    onChange(next);
    track.current?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus();
  };
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <LayoutGroup id={id}>
        <div ref={track} role="radiogroup" aria-label="Billing period" onKeyDown={onKey} className="inline-flex items-center gap-0.5 rounded-full bg-[var(--bd-ui-track)] p-1 shadow-[var(--bd-ui-well)]">
          {options.map((o) => {
            const on = o.value === period;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                data-value={o.value}
                onClick={() => onChange(o.value)}
                className={cx(
                  "relative h-9 rounded-full px-5 text-sm font-medium transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]",
                  on ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)] hover:text-[var(--bd-fg)]",
                )}
              >
                {on && <motion.span layoutId="period" className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]" transition={SNAPPY} />}
                <span className="relative flex items-center gap-2">
                  {o.label}
                  {o.value === "yearly" && save > 0 && (
                    <span className={cx("inline-flex h-5 items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-[background-color,color,opacity] duration-200", on ? "bg-[color-mix(in_oklab,var(--bd-ui-ok)_16%,var(--bd-surface))] text-[color-mix(in_oklab,var(--bd-ui-ok)_78%,var(--bd-fg))]" : "bg-[color-mix(in_oklab,var(--bd-ui-ok)_10%,transparent)] text-[color-mix(in_oklab,var(--bd-ui-ok)_70%,var(--bd-subtle))]")}>
                      <span className="sr-only">, </span>Save {save}%
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

/* ---------- the seat stepper ---------- */

/**
 * Press and hold to keep counting: one step at once, then a pause, then faster and faster. The
 * step runs through a ref, so the hold always counts from the latest value.
 */
function useHold(step: () => void) {
  const latest = useRef(step);
  useEffect(() => {
    latest.current = step;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const start = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    latest.current();
    let wait = 380;
    const tick = () => {
      latest.current();
      wait = Math.max(45, wait * 0.78);
      timer.current = setTimeout(tick, wait);
    };
    timer.current = setTimeout(tick, wait);
  };
  return { onPointerDown: start, onPointerUp: stop, onPointerCancel: stop, onLostPointerCapture: stop };
}

function SeatStepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  const down = useHold(() => set(value - 1));
  const up = useHold(() => set(value + 1));
  const btn = "grid size-8 place-items-center rounded-full text-[var(--bd-fg)] transition-[background-color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.06)] active:scale-[0.9] disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] [&_svg]:size-3.5";
  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--bd-ui-field)] p-1 shadow-[var(--bd-ui-well)]">
      {/* Keyboard users step with the arrows on the count; the buttons are for pointers, so they stay out of the tab order. */}
      <button type="button" tabIndex={-1} aria-hidden disabled={value <= min} className={btn} {...down}>
        <MinusIcon weight="regular" />
      </button>
      <span
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${value} ${value === 1 ? "seat" : "seats"}`}
        onKeyDown={(e) => {
          const by = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : e.key === "PageUp" ? 5 : e.key === "PageDown" ? -5 : 0;
          if (e.key === "Home") set(min);
          else if (e.key === "End") set(max);
          else if (by) set(value + by);
          else return;
          e.preventDefault();
        }}
        className="min-w-[72px] rounded-full px-1 text-center text-sm font-medium tabular-nums text-[var(--bd-fg)] outline-none focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
      >
        {value} {value === 1 ? "seat" : "seats"}
      </span>
      <button type="button" tabIndex={-1} aria-hidden disabled={value >= max} className={btn} {...up}>
        <PlusIcon weight="regular" />
      </button>
    </div>
  );
}

/* ---------- a plan ---------- */

const featureOf = (f: PricingFeature) => (typeof f === "string" ? { label: f, included: true, note: undefined } : { included: true, ...f });

/* A tick on a small raised token; what a plan doesn't have is a quiet dash. */
function Tick({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cx("mt-[1px] grid size-[18px] shrink-0 place-items-center rounded-full [&_svg]:size-[11px]", on ? "bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_1px_2px_rgb(var(--bd-shade)/0.1)]" : "text-[var(--bd-subtle)]")}>
      {on ? <CheckIcon weight="bold" /> : <MinusIcon weight="regular" />}
    </span>
  );
}

/* The shell every plan sits in: a gray a step off the face, with its own hairline and a long soft shadow. */
const SHELL = "bg-[color-mix(in_oklab,var(--bd-ui-track)_42%,var(--bd-surface))] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),0_1px_2px_rgb(var(--bd-shade)/0.05),0_16px_36px_-22px_rgb(var(--bd-shade)/0.4)]";
/*
 * The plan you'd pick, lit by the hero's light: iris from one corner, sky from the other, mint
 * rising from below, over the same gray, with a ring and a glow of the iris.
 */
const LIT =
  "[background:radial-gradient(120%_70%_at_0%_0%,color-mix(in_oklab,var(--bd-ui-viz-1,oklch(56%_0.16_290))_24%,transparent),transparent_62%),radial-gradient(90%_60%_at_100%_0%,color-mix(in_oklab,var(--bd-ui-viz-4,oklch(62%_0.13_236))_18%,transparent),transparent_60%),radial-gradient(110%_55%_at_50%_100%,color-mix(in_oklab,var(--bd-ui-viz-2,oklch(63%_0.12_166))_16%,transparent),transparent_70%),color-mix(in_oklab,var(--bd-ui-track)_42%,var(--bd-surface))] shadow-[0_0_0_1px_color-mix(in_oklab,var(--bd-ui-viz-1,oklch(56%_0.16_290))_30%,transparent),0_2px_6px_rgb(var(--bd-shade)/0.08),0_28px_56px_-26px_color-mix(in_oklab,var(--bd-ui-viz-1,oklch(56%_0.16_290))_55%,transparent)]";
/* The face inside the shell, raised by a hairline and a short shadow. */
const FACE = "bg-[var(--bd-surface)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.06),0_1px_2px_rgb(var(--bd-shade)/0.06),0_4px_12px_-6px_rgb(var(--bd-shade)/0.14)]";

function PlanCard({ plan, period, currency, locale }: { plan: PricingPlan; period: BillingPeriod; currency: string; locale: string }) {
  const seatsDef = plan.seats;
  const min = seatsDef?.min ?? 1;
  const [seats, setSeats] = useState(seatsDef?.default ?? min);
  const each = plan.price ? plan.price[period] : null;
  const total = each === null ? null : each * (seatsDef ? seats : 1);
  const choice: PricingChoice = { plan: plan.id, period, seats: seatsDef ? seats : 1, total };
  const rec = !!plan.recommended;
  const ctaClass = cx(
    "group/cta relative isolate mt-5 inline-flex h-11 w-full select-none items-center justify-center overflow-hidden rounded-full text-sm font-medium transition-[filter,scale,box-shadow] duration-200 active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
    rec
      ? "border-[1.5px] border-transparent text-white [background:var(--bd-ui-metal-fill)_padding-box,var(--bd-ui-metal-edge)_border-box] shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_8px_20px_-10px_rgb(0_0_0/0.5)] hover:brightness-[1.14]"
      : "text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08)] hover:shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.16)]",
  );
  const ctaBody = (
    <>
      {rec && <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 -translate-x-[110%] bg-[linear-gradient(105deg,transparent_30%,rgb(255_255_255/0.22)_50%,transparent_70%)] transition-transform duration-700 ease-[var(--bd-ease)] group-hover/cta:translate-x-[110%] motion-reduce:hidden" />}
      {plan.cta.label}
    </>
  );
  const features = plan.features ?? [];
  return (
    <article aria-label={typeof plan.name === "string" ? plan.name : undefined} data-plan={plan.id} className="relative flex w-[84%] max-w-[360px] shrink-0 snap-center flex-col @3xl:w-auto @3xl:max-w-none">
      <div className={cx("relative isolate flex h-full flex-col rounded-[26px] p-1.5", rec ? LIT : SHELL)}>
        {/* Fine dots over the light, fading down from the top, on the plan you'd pick. */}
        {rec && <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] [background:var(--bd-ui-dots)] [mask-image:linear-gradient(to_bottom,#000,transparent_70%)]" />}
        <div className={cx("rounded-[20.5px] p-5", FACE)}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--bd-fg)]">{plan.name}</h3>
            {rec && plan.badge && <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium text-[var(--bd-ui-ink-text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] [background:var(--bd-ui-ink)]">{plan.badge}</span>}
          </div>
          {plan.description && <p className="mt-1.5 min-h-[2.9em] text-[13px] leading-[1.45] text-[var(--bd-muted)]">{plan.description}</p>}
          <div className="mt-4 flex h-[44px] items-end gap-1.5">
            {each === null ? (
              <span className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-[var(--bd-fg)]">{plan.priceLabel ?? "Let's talk"}</span>
            ) : (
              <>
                <Money value={each} currency={currency} locale={locale} className="text-[40px] font-semibold tracking-[-0.04em] text-[var(--bd-fg)]" />
                <span className="pb-1 text-[13px] text-[var(--bd-muted)]">{seatsDef ? "a seat, a month" : "a month"}</span>
              </>
            )}
          </div>
          {/* What paying this way comes to, in a line of fixed height so the cards never jump. */}
          <p className="mt-2 h-5 truncate text-[12.5px] text-[var(--bd-subtle)]">
            {each === null ? "Priced for your team" : period === "yearly" ? <>Billed yearly, {new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format((total ?? 0) * 12)} a year</> : "Billed monthly, cancel any time"}
          </p>
          {/* The seats, or the same room left empty, so every plan's button and list line up across the row. */}
          <div className={cx("mt-4 flex h-10 items-center justify-between gap-3", !(seatsDef && total !== null) && "@max-3xl:hidden")}>
            {seatsDef && total !== null && (
              <>
                <SeatStepper value={seats} min={min} max={seatsDef.max ?? 500} onChange={setSeats} label={`Seats on ${typeof plan.name === "string" ? plan.name : "this plan"}`} />
                <span className="whitespace-nowrap text-right text-[13px] text-[var(--bd-muted)]">
                  <Money value={total} currency={currency} locale={locale} className="text-[15px] font-semibold text-[var(--bd-fg)]" />
                  <span className="ml-1">a month</span>
                </span>
              </>
            )}
          </div>
          {plan.cta.href ? (
            <a href={plan.cta.href} className={ctaClass} onClick={() => plan.cta.onClick?.(choice)}>
              {ctaBody}
            </a>
          ) : (
            <button type="button" className={ctaClass} onClick={() => plan.cta.onClick?.(choice)}>
              {ctaBody}
            </button>
          )}
        </div>
        {/* What's in it, on the shell under the face. */}
        {features.length > 0 && (
          <ul className="grid gap-2.5 px-4 pb-4 pt-5">
            {features.map((f, i) => {
              const it = featureOf(f);
              return (
                <li key={i} className={cx("flex gap-2.5 text-[13.5px] leading-[1.45]", it.included ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)]")}>
                  <Tick on={it.included !== false} />
                  <span className="min-w-0">
                    {it.included === false && <span className="sr-only">Not included: </span>}
                    {it.label}
                    {it.note && <span className="mt-0.5 block text-[12px] text-[var(--bd-subtle)]">{it.note}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}

/* ---------- the comparison ---------- */

function Cell({ value }: { value: boolean | ReactNode }) {
  if (value === true)
    return (
      <span className="inline-grid" role="img" aria-label="Included">
        <Tick on />
      </span>
    );
  if (value === false || value === undefined || value === null)
    return (
      <span role="img" aria-label="Not included" className="inline-block h-px w-3 bg-[var(--bd-line-strong)] align-middle" />
    );
  return <span className="text-[13px] text-[var(--bd-fg)]">{value}</span>;
}

/** A plan's action, small, in the comparison's head, so the table ends where a choice is made. */
function CompareAction({ plan, period }: { plan: PricingPlan; period: BillingPeriod }) {
  const seats = plan.seats ? (plan.seats.default ?? plan.seats.min ?? 1) : 1;
  const each = plan.price ? plan.price[period] : null;
  const choice: PricingChoice = { plan: plan.id, period, seats, total: each === null ? null : each * seats };
  const cls = cx(
    "mt-2.5 inline-flex h-7 items-center rounded-full px-3 text-[12px] font-medium transition-[filter,scale,box-shadow] duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
    plan.recommended ? "text-[var(--bd-ui-ink-text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] [background:var(--bd-ui-ink)] hover:brightness-[1.12]" : "text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08)]",
  );
  return plan.cta.href ? (
    <a href={plan.cta.href} className={cls} onClick={() => plan.cta.onClick?.(choice)}>
      {plan.cta.label}
    </a>
  ) : (
    <button type="button" className={cls} onClick={() => plan.cta.onClick?.(choice)}>
      {plan.cta.label}
    </button>
  );
}

function Comparison({ plans, groups, period, currency, locale, stickyTop, defaultOpen }: { plans: PricingPlan[]; groups: PricingCompareGroup[]; period: BillingPeriod; currency: string; locale: string; stickyTop: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [pick, setPick] = useState(plans.find((p) => p.recommended)?.id ?? plans[0]?.id);
  const still = useReducedMotion();
  const id = useId();
  const recId = plans.find((p) => p.recommended)?.id;
  return (
    <div className="mt-12">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-compare`}
        onClick={() => setOpen(!open)}
        className="mx-auto flex h-10 items-center gap-2 rounded-full bg-[var(--bd-surface)] px-4 text-sm font-medium text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)] transition-[background-color,scale] duration-150 hover:bg-[color-mix(in_oklab,var(--bd-fg)_4%,var(--bd-surface))] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
      >
        {open ? "Hide the comparison" : "Compare every feature"}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={SNAPPY} className="grid">
          <CaretDownIcon weight="regular" className="size-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-compare`}
            initial={still ? { opacity: 0 } : { height: 0, opacity: 0, overflow: "hidden" }}
            // Once open it lets go of its clip, so the plans' names can stick to the window as you scroll.
            animate={still ? { opacity: 1 } : { height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
            exit={still ? { opacity: 0 } : { height: 0, opacity: 0, overflow: "hidden" }}
            transition={SOFT}
          >
            <div className="pt-6">
              {/* Wide: every plan side by side. */}
              <div className="hidden rounded-[22px] bg-[var(--bd-surface)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] @2xl:block">
                <table className="w-full border-separate border-spacing-0 text-left">
                  <caption className="sr-only">Every feature, plan by plan</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="sticky z-10 rounded-tl-[22px] bg-[var(--bd-surface)] px-5 pb-3 pt-4 text-[12px] font-medium text-[var(--bd-subtle)]" style={{ top: stickyTop }}>
                        Feature
                      </th>
                      {plans.map((p, i) => (
                        <th key={p.id} scope="col" className={cx("sticky z-10 px-4 pb-3.5 pt-4 text-center", p.id === recId ? "rounded-t-[16px] bg-[color-mix(in_oklab,var(--bd-ui-viz-1,oklch(56%_0.16_290))_7%,var(--bd-surface))]" : "bg-[var(--bd-surface)]", i === plans.length - 1 && p.id !== recId && "rounded-tr-[22px]")} style={{ top: stickyTop }}>
                          <span className="block text-[14px] font-semibold text-[var(--bd-fg)]">{p.name}</span>
                          <span className="mt-0.5 block text-[12px] font-normal text-[var(--bd-subtle)]">{p.price ? <Money value={p.price[period]} currency={currency} locale={locale} className="text-[12px]" /> : (p.priceLabel ?? "Let's talk")}</span>
                          <CompareAction plan={p} period={period} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {groups.map((g, gi) => (
                    <tbody key={gi}>
                      <tr>
                        <th scope="colgroup" colSpan={plans.length + 1} className="border-t border-[var(--bd-line-subtle)] px-5 pb-2 pt-5 text-[13px] font-semibold text-[var(--bd-fg)]">
                          {g.label}
                        </th>
                      </tr>
                      {g.rows.map((r, ri) => (
                        <tr key={ri} className="transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--bd-ui-track)_22%,var(--bd-surface))]">
                          <th scope="row" className="border-t border-[var(--bd-line-subtle)] px-5 py-3 text-[13.5px] font-normal text-[var(--bd-fg)]">
                            {r.label}
                            {r.note && <span className="mt-0.5 block text-[12px] text-[var(--bd-subtle)]">{r.note}</span>}
                          </th>
                          {plans.map((p) => (
                            <td key={p.id} className={cx("border-t border-[var(--bd-line-subtle)] px-4 py-3 text-center", p.id === recId && "bg-[color-mix(in_oklab,var(--bd-ui-viz-1,oklch(56%_0.16_290))_7%,var(--bd-surface))]")}>
                              <Cell value={r.values[p.id]} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
              {/* Narrow: one plan at a time, picked from a row of chips held at the top. */}
              <div className="rounded-[20px] bg-[var(--bd-surface)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] @2xl:hidden">
                <div
                  role="tablist"
                  aria-label="Plan to compare"
                  onKeyDown={(e) => {
                    const at = plans.findIndex((p) => p.id === pick);
                    const to = e.key === "ArrowRight" ? at + 1 : e.key === "ArrowLeft" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? plans.length - 1 : null;
                    if (to === null) return;
                    e.preventDefault();
                    const next = plans[(to + plans.length) % plans.length];
                    setPick(next.id);
                    e.currentTarget.querySelector<HTMLElement>(`[data-plan-tab="${next.id}"]`)?.focus();
                  }}
                  className="sticky z-10 flex gap-1.5 overflow-x-auto rounded-t-[20px] border-b border-[var(--bd-line-subtle)] bg-[var(--bd-surface)] p-2.5 [scrollbar-width:none]"
                  style={{ top: stickyTop }}
                >
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      data-plan-tab={p.id}
                      aria-selected={p.id === pick}
                      aria-controls={`${id}-plan`}
                      tabIndex={p.id === pick ? 0 : -1}
                      onClick={() => setPick(p.id)}
                      className="relative h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]"
                    >
                      {p.id === pick && <motion.span layoutId={`${id}-chip`} aria-hidden className="absolute inset-0 rounded-full [background:var(--bd-ui-ink)]" transition={still ? { duration: 0 } : SNAPPY} />}
                      <span className={cx("relative transition-colors duration-150", p.id === pick ? "text-[var(--bd-ui-ink-text)]" : "text-[var(--bd-muted)]")}>{p.name}</span>
                    </button>
                  ))}
                </div>
                <div id={`${id}-plan`} role="tabpanel" aria-label={typeof plans.find((p) => p.id === pick)?.name === "string" ? (plans.find((p) => p.id === pick)!.name as string) : undefined}>
                  {groups.map((g, gi) => (
                    <div key={gi}>
                      <p className={cx("px-4 pb-1.5 text-[13px] font-semibold text-[var(--bd-fg)]", gi === 0 ? "pt-3" : "pt-5")}>{g.label}</p>
                      {g.rows.map((r, ri) => (
                        <div key={ri} className="flex items-center justify-between gap-4 border-t border-[var(--bd-line-subtle)] px-4 py-3">
                          <span className="min-w-0 text-[13.5px] text-[var(--bd-fg)]">
                            {r.label}
                            {r.note && <span className="mt-0.5 block text-[12px] text-[var(--bd-subtle)]">{r.note}</span>}
                          </span>
                          <Cell value={r.values[pick ?? ""]} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- the table ---------- */

export function PricingTable({ plans, period, defaultPeriod = "yearly", onPeriodChange, currency = "USD", locale = "en-US", compare, defaultCompareOpen = false, stickyTop = 0, label = "Pricing", className }: PricingTableProps) {
  const [inner, setInner] = useState<BillingPeriod>(defaultPeriod);
  const current = period ?? inner;
  const setPeriod = (p: BillingPeriod) => {
    setInner(p);
    onPeriodChange?.(p);
  };
  // The best saving of any plan, for the tag on Yearly.
  const save = Math.max(0, ...plans.filter((p) => p.price && p.price.monthly > 0).map((p) => Math.round((1 - p.price!.yearly / p.price!.monthly) * 100)));
  const row = useRef<HTMLDivElement>(null);
  const recIndex = Math.max(0, plans.findIndex((p) => p.recommended));
  const [inView, setInView] = useState(recIndex);
  const still = useReducedMotion();
  const dots = useId();

  // On a phone the row starts on the plan you'd pick, without a scroll you'd notice.
  useEffect(() => {
    const el = row.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const card = el.children[recIndex] as HTMLElement | undefined;
    if (card) el.scrollLeft = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
  }, [recIndex]);

  const onScroll = () => {
    const el = row.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    [...el.children].forEach((c, i) => {
      const card = c as HTMLElement;
      if (Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid) < Math.abs((el.children[best] as HTMLElement).offsetLeft + (el.children[best] as HTMLElement).offsetWidth / 2 - mid)) best = i;
    });
    setInView(best);
  };
  const goTo = (i: number) => {
    const el = row.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: still ? "auto" : "smooth" });
  };

  return (
    <section aria-label={label} className={cx("@container w-full", className)}>
      <PeriodSwitch period={current} onChange={setPeriod} save={save} />
      <div
        ref={row}
        onScroll={onScroll}
        className="-mx-4 mt-8 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-3 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden @3xl:mx-0 @3xl:grid @3xl:snap-none @3xl:gap-4 @3xl:overflow-visible @3xl:px-0 @3xl:[grid-template-columns:repeat(var(--plans),minmax(0,1fr))]"
        style={{ ["--plans" as string]: plans.length }}
      >
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} period={current} currency={currency} locale={locale} />
        ))}
      </div>
      {/* Which plan is in view on a phone, and a way to it. */}
      <div className="mt-2 flex justify-center gap-1.5 @3xl:hidden">
        {plans.map((p, i) => (
          <button key={p.id} type="button" aria-label={`Show ${typeof p.name === "string" ? p.name : `plan ${i + 1}`}`} aria-current={i === inView || undefined} onClick={() => goTo(i)} className="relative grid h-6 w-5 place-items-center">
            <span className="block size-1.5 rounded-full bg-[var(--bd-fg)] opacity-25" />
            {i === inView && <motion.span layoutId={`${dots}-dot`} aria-hidden className="absolute left-0.5 top-[9px] h-1.5 w-4 rounded-full bg-[var(--bd-fg)]" transition={still ? { duration: 0 } : SNAPPY} />}
          </button>
        ))}
      </div>
      {compare && compare.length > 0 && <Comparison plans={plans} groups={compare} period={current} currency={currency} locale={locale} stickyTop={stickyTop} defaultOpen={defaultCompareOpen} />}
    </section>
  );
}
