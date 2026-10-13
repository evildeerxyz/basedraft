"use client";

import { CaretDownIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Band, ButtonLink, SectionHead, Segmented, Tag } from "@/components/site/ui";
import { cn } from "@/lib/cn";

/*
 * What pello costs, worked out for your team. Drag to your size and every plan shows its monthly
 * price for it, as rows of a list; the one that fits is marked and opened. Paying yearly takes 20%
 * off. Open any plan to see what's in it.
 */

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 6,
    for: "For teams that want questions and time off handled.",
    features: ["Ask pello in Slack, Teams and email", "Time off with your own rules", "Expenses within budgets", "Documents and e-signing", "Up to 2 admins"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 11,
    for: "For companies with payroll to run and new people every month.",
    features: ["Everything in Starter", "Payroll in the US, UK, Germany and Canada", "Onboarding and offboarding", "Overtime and staffing flags", "Insights and a note every morning", "As many admins as you need"],
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
      className="relative h-10 cursor-pointer touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => e.buttons && set(e)}
    >
      {/* The track, inked up to your size, with a tick at each power of ten. */}
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-line-strong">
        <div className="h-full rounded-full bg-ink" style={{ width: `${t * 100}%` }} />
        {[100, 1000].map((n) => (
          <span key={n} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-2" style={{ left: `${tOf(n) * 100}%` }} />
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
        className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-page shadow-[inset_0_0_0_2px_var(--pl-ink)] transition-transform hover:scale-110 active:scale-95"
        style={{ left: `${t * 100}%` }}
      />
    </div>
  );
}

export function Pricing({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const [size, setSize] = useState(120);
  const [billing, setBilling] = useState<"yearly" | "monthly">("yearly");
  // Which plan is opened: the one that fits, until you open another yourself.
  const [chosen, setChosen] = useState<string | null>(null);
  const best = fits(size);
  const shown = chosen ?? best;
  const k = billing === "yearly" ? 0.8 : 1;

  return (
    <Band id="pricing" inner="py-24 lg:py-32">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <SectionHead as={heading} title="Per person, per month. Work out yours." lead="Every plan has the Slack and Teams apps, unlimited questions and 30 days free. There's no setup fee." />
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p>
              <span className="tabular block font-mono text-[56px] font-medium leading-none tracking-[-0.06em] text-ink">{size.toLocaleString("en-US")}</span>
              <span className="mt-2 block text-[15px] text-mute">people at your company</span>
            </p>
            <Segmented
              label="Billing"
              value={billing}
              onChange={setBilling}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly, 20% off" },
              ]}
            />
          </div>
          <div className="mt-4">
            <Slider
              value={size}
              onChange={(v) => {
                setSize(v);
                setChosen(null);
              }}
            />
            <div className="tabular relative h-6 font-mono text-[15px] text-mute">
              {[10, 100, 1000].map((n, i) => (
                <span key={n} className={cn("absolute", i === 0 ? "" : "-translate-x-1/2")} style={{ left: `${tOf(n) * 100}%` }}>
                  {n.toLocaleString("en-US")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-16 border-t border-ink">
        {PLANS.map((p) => {
          const fit = p.id === best;
          const open = p.id === shown;
          return (
            <li key={p.id} className="border-b border-line">
              <div className="grid gap-x-8 gap-y-4 py-7 lg:grid-cols-[230px_minmax(0,1fr)_250px_auto] lg:items-center">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p className="text-[26px] font-semibold tracking-[-0.04em] text-ink">{p.name}</p>
                  <AnimatePresence>
                    {fit && (
                      <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        <Tag tone="done">Fits {size.toLocaleString("en-US")}</Tag>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="max-w-[380px] text-[16px] leading-[1.5] text-mute">{p.for}</p>
                <div>
                  {p.price ? (
                    <>
                      <p className="flex items-baseline gap-2">
                        <span className={cn("tabular font-mono text-[34px] font-medium leading-none tracking-[-0.05em] transition-colors", fit ? "text-ink" : "text-ink-2")}>{money(p.price * k * size)}</span>
                        <span className="text-[15px] text-mute">a month</span>
                      </p>
                      <p className="mt-1.5 text-[15px] text-mute">
                        <span className="tabular font-mono">${(p.price * k).toFixed(2).replace(/\.00$/, "")}</span> a person{billing === "yearly" ? ", billed yearly" : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[34px] font-semibold leading-none tracking-[-0.045em] text-ink-2">Let&apos;s talk</p>
                      <p className="mt-1.5 text-[15px] text-mute">A price for your size and setup</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ButtonLink href="/contact" kind={fit ? "dark" : "light"}>
                    {p.price ? "Start free" : "Talk to us"}
                  </ButtonLink>
                  <button type="button" onClick={() => setChosen(open ? "none" : p.id)} aria-expanded={open} aria-controls={`plan-${p.id}`} aria-label={`What's in ${p.name}`} className="pl-btn-light grid size-11 place-items-center rounded-[10px]">
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 420, damping: 28 }}>
                      <CaretDownIcon size={16} weight="bold" />
                    </motion.span>
                  </button>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div id={`plan-${p.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 340, damping: 36 }} className="overflow-hidden">
                    <ul className="grid gap-x-8 gap-y-2 pb-8 sm:grid-cols-2 lg:grid-cols-3 lg:pl-[262px]">
                      {p.features.map((f) => (
                        <li key={f} className="text-[16px] leading-[1.5] text-ink-2">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[15px] text-mute">Prices are in US dollars, before tax.</p>
    </Band>
  );
}
