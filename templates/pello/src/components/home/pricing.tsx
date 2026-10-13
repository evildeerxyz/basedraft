"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ButtonLink, Container, SectionHead } from "@/components/site/ui";
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
      {/* A ruler: a tick for every step, longer at each power of ten, inked up to your size. */}
      <div aria-hidden className="absolute inset-x-0 bottom-1 flex h-7 items-end justify-between">
        {Array.from({ length: 61 }, (_, i) => {
          const at = i / 60;
          const major = [10, 100, 1000, 2000].some((n) => Math.abs(tOf(n) - at) < 0.009);
          return <span key={i} className={cn("w-[2px]", at <= t ? "bg-ink" : "bg-line-strong", major ? "h-7" : i % 5 === 0 ? "h-4" : "h-2.5")} />;
        })}
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
        className="absolute bottom-0 h-12 w-[6px] -translate-x-1/2 rounded-[2px] bg-accent transition-transform hover:scale-x-150 focus-visible:outline-offset-4"
        style={{ left: `${t * 100}%` }}
      />
    </div>
  );
}

export function Pricing({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const [size, setSize] = useState(120);
  const [yearly, setYearly] = useState(true);
  const best = fits(size);
  const k = yearly ? 0.8 : 1;

  return (
    <section id="pricing" className="scroll-mt-20 py-28 lg:py-36">
      <Container>
        <SectionHead as={heading} align="center" title="Priced per person, so it grows with you." lead="Every plan has the Slack and Teams apps, unlimited questions and a 30 day free trial. No setup fee." />

        <div className="mx-auto mt-14 max-w-[820px] rounded-[4px] bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p className="text-[17px] text-ink-2">
              <span className="tabular block font-display text-[72px] font-extrabold leading-[0.85] text-ink">{size.toLocaleString("en-US")}</span>
              people at your company
            </p>
            <LayoutGroup id="billing">
              <div role="radiogroup" aria-label="Billing" className="flex rounded-[6px] bg-page p-1 shadow-[inset_0_0_0_1.5px_var(--pl-ink)]">
                {[
                  [false, "Monthly"],
                  [true, "Yearly, save 20%"],
                ].map(([v, label]) => (
                  <button key={String(v)} type="button" role="radio" aria-checked={yearly === v} onClick={() => setYearly(v as boolean)} className={cn("relative h-11 rounded-[3px] px-5 text-[16px] font-semibold transition-colors", yearly === v ? "text-page" : "text-ink-2 hover:text-ink")}>
                    {yearly === v && <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-[3px] bg-ink" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                    <span className="relative">{label as string}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>
          <div className="mt-6">
            <Slider value={size} onChange={setSize} />
            <div className="tabular relative mt-1 h-6 text-[15px] text-mute">
              {[10, 100, 1000, 2000].map((n, i) => (
                <span key={n} className={cn("absolute", i === 0 ? "" : i === 3 ? "-translate-x-full max-sm:hidden" : "-translate-x-1/2")} style={{ left: `${tOf(n) * 100}%` }}>
                  {n.toLocaleString("en-US")}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => {
            const on = p.id === best;
            const dark = p.id === "growth";
            return (
              <motion.div key={p.id} animate={{ y: on ? -8 : 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} className={cn("relative flex flex-col rounded-[4px] p-7 transition-shadow duration-300 sm:p-8", dark ? "bg-night text-night-ink" : "bg-surface text-ink", on && "shadow-[0_0_0_4px_var(--pl-accent)]")}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-[34px] font-extrabold leading-none">{p.name}</p>
                  <AnimatePresence>
                    {on && (
                      <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="rounded-[3px] bg-accent px-2.5 py-1 text-[15px] font-semibold text-accent-ink">
                        Fits {size.toLocaleString("en-US")} people
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className={cn("mt-2 text-[16px] leading-[1.5]", dark ? "text-night-mute" : "text-ink-2")}>{p.for}</p>
                <div className="mt-8">
                  {p.price ? (
                    <>
                      <p className="flex items-baseline gap-2">
                        <span className="tabular font-display text-[64px] font-extrabold leading-none">{money(p.price * k * size)}</span>
                        <span className={cn("text-[16px]", dark ? "text-night-mute" : "text-mute")}>a month</span>
                      </p>
                      <p className={cn("tabular mt-2 text-[16px]", dark ? "text-night-mute" : "text-mute")}>
                        ${(p.price * k).toFixed(2).replace(/\.00$/, "")} per person{yearly ? `, ${money(p.price * k * size * 12)} a year` : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-[64px] font-extrabold leading-none">Let&apos;s talk</p>
                      <p className={cn("mt-2 text-[16px]", dark ? "text-night-mute" : "text-mute")}>A price for your size and setup</p>
                    </>
                  )}
                </div>
                <ul className="mt-8 grid flex-1 content-start gap-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[17px] leading-[1.45]">
                      <CheckIcon size={18} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <ButtonLink href="/contact" kind={dark ? "light" : on ? "accent" : "quiet"} size="lg" arrow className="mt-9 w-full">
                  {p.price ? "Start free for 30 days" : "Talk to us"}
                </ButtonLink>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
