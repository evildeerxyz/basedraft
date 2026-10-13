"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Band, ButtonLink, SectionHead, Segmented } from "@/components/site/ui";
import { cn } from "@/lib/cn";

/*
 * What pello costs for your team. Drag the slider to your size and the plans show their monthly
 * price for it; the one that fits is marked. Paying yearly takes 20% off.
 */

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 6,
    for: "For teams that want questions and time off handled.",
    features: ["Ask pello in Slack, Teams and email", "Time off with your own rules", "Documents and e-signing", "Up to 2 admins"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 11,
    for: "For companies with payroll to run and new people every month.",
    features: ["Everything in Starter", "Payroll in the US, UK, Germany and Canada", "Onboarding and offboarding", "Insights and a note every morning", "As many admins as you need"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    for: "For 1,000 people and up, or rules that need their own setup.",
    features: ["Everything in Growth", "Single sign-on, SCIM and custom roles", "Data kept in the EU or the US", "A named person on our team", "Your contract, your invoicing"],
  },
] as const;

const MIN = 10;
const MAX = 2000;
// The slider is even in orders of magnitude: as far from 10 to 100 as from 100 to 1,000.
const sizeAt = (t: number) => {
  const raw = MIN * (MAX / MIN) ** t;
  const step = raw < 100 ? 5 : raw < 500 ? 10 : 50;
  return Math.max(MIN, Math.min(MAX, Math.round(raw / step) * step));
};
const tOf = (size: number) => Math.log(size / MIN) / Math.log(MAX / MIN);
const fits = (size: number) => (size < 50 ? "starter" : size < 1000 ? "growth" : "enterprise");
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function Slider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const t = tOf(value);
  const set = (e: PointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    onChange(sizeAt(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))));
  };
  const key = (e: KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02, PageUp: 0.1, PageDown: -0.1 };
    if (e.key === "Home") onChange(MIN);
    else if (e.key === "End") onChange(MAX);
    else if (moves[e.key]) {
      let next = sizeAt(Math.max(0, Math.min(1, t + moves[e.key])));
      // Always move at least one step.
      if (next === value) next = Math.max(MIN, Math.min(MAX, value + (moves[e.key] > 0 ? 5 : -5)));
      onChange(next);
    } else return;
    e.preventDefault();
  };
  return (
    <div
      ref={track}
      className="relative h-12 cursor-pointer touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => e.buttons && set(e)}
    >
      {/* The track, inked up to your size, with a tick at each power of ten. */}
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-sunken shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)]">
        <div className="h-full rounded-full bg-ink" style={{ width: `${t * 100}%` }} />
        {[100, 1000].map((n) => (
          <span key={n} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-line-strong" style={{ left: `${tOf(n) * 100}%` }} />
        ))}
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Team size"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
        aria-valuetext={`${value} people`}
        onKeyDown={key}
        className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface shadow-[0_0_0_1px_var(--pl-line-strong),0_2px_6px_rgb(0_0_0/0.18)] transition-transform hover:scale-110 active:scale-95"
        style={{ left: `${t * 100}%` }}
      />
    </div>
  );
}

export function Pricing({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const [size, setSize] = useState(120);
  const [yearly, setYearly] = useState<"yearly" | "monthly">("yearly");
  const best = fits(size);
  const k = yearly === "yearly" ? 0.8 : 1;

  return (
    <Band rule id="pricing" inner="py-20 lg:py-28">
      <SectionHead as={heading} title="Priced per person, so it grows with you" lead="Every plan has the Slack and Teams apps, unlimited questions and a 30 day free trial. No setup fee." />

      <div className="pl-card mx-auto mt-12 max-w-[760px] rounded-[16px] p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p>
            <span className="tabular block font-display text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink">{size.toLocaleString("en-US")}</span>
            <span className="mt-1 block text-[15px] text-mute">people at your company</span>
          </p>
          <Segmented
            label="Billing"
            value={yearly}
            onChange={setYearly}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly, save 20%" },
            ]}
          />
        </div>
        <div className="mt-5">
          <Slider value={size} onChange={setSize} />
          <div className="tabular relative mt-1 h-6 font-mono text-[15px] text-mute">
            {[10, 100, 1000, 2000].map((n, i) => (
              <span key={n} className={cn("absolute", i === 0 ? "" : i === 3 ? "-translate-x-full max-sm:hidden" : "-translate-x-1/2")} style={{ left: `${tOf(n) * 100}%` }}>
                {n.toLocaleString("en-US")}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {PLANS.map((p) => {
          const on = p.id === best;
          return (
            <motion.div key={p.id} layout className={cn("pl-card relative flex flex-col rounded-[16px] p-6 transition-shadow duration-300 sm:p-7", on && "shadow-[0_0_0_2px_var(--pl-ink),var(--pl-shadow)]")}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-[22px] font-semibold tracking-[-0.015em] text-ink">{p.name}</p>
                <AnimatePresence>
                  {on && (
                    <motion.span initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} className="rounded-[7px] bg-ink px-2 py-1 text-[15px] font-medium text-surface">
                      Fits {size.toLocaleString("en-US")} people
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-2 text-[15px] leading-[1.5] text-mute">{p.for}</p>
              <div className="mt-7">
                {p.price ? (
                  <>
                    <p className="flex items-baseline gap-1.5">
                      <span className="tabular font-display text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink">{money(p.price * k * size)}</span>
                      <span className="text-[15px] text-mute">a month</span>
                    </p>
                    <p className="mt-2 text-[15px] text-mute">
                      <span className="tabular font-mono">${(p.price * k).toFixed(2).replace(/\.00$/, "")}</span> per person{yearly === "yearly" ? ", billed yearly" : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink">Let&apos;s talk</p>
                    <p className="mt-2 text-[15px] text-mute">A price for your size and setup</p>
                  </>
                )}
              </div>
              <ButtonLink href="/contact" kind={on ? "dark" : "light"} className="mt-7 w-full">
                {p.price ? "Start free for 30 days" : "Talk to us"}
              </ButtonLink>
              <ul className="mt-7 grid gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[15px] leading-[1.45] text-ink-2">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sunken">
                      <CheckIcon size={11} weight="bold" className="text-ink" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </Band>
  );
}
