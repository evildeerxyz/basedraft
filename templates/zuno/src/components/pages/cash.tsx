"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ditherStyle } from "@/lib/dither";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { LogoMark } from "../ui/Logo";
import { RollingNumber } from "../ui/RollingNumber";
import { pal } from "@/lib/palette";

const APY = 0.041;

/** Hero visual: ripple shader with interest accruing on a $25,000 balance, sped up 60×. */
export function CashHero() {
  const ref = useRef<HTMLDivElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  useEffect(() => {
    if (!inView) return;
    const perMs = (25000 * APY) / 365 / 86_400_000;
    let v = 2.808219;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      v += (now - last) * perMs * 60;
      last = now;
      if (out.current) out.current.textContent = v.toFixed(6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <div ref={ref} className="relative aspect-square w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-ink-2">
      <DitherShader shape="ripple" orb={[0.5, 0.42, 0]} color={pal.accent} opacity={0.7} pixelSize={4} intensity={0.8} interactive />
      <div className="absolute inset-x-5 bottom-5 rounded-[18px] bg-ink/90 p-5 ring-1 ring-white/10 sm:inset-x-8 sm:bottom-8">
        <div className="flex items-center justify-between text-[15px] text-white/60">
          <span>Interest earned today on $25,000</span>
          <span className="flex items-center gap-1.5 text-accent">
            <span className="size-1.5 animate-pulse rounded-full bg-lime" /> live
          </span>
        </div>
        <div className="mt-1 font-mono text-[34px] tabular-nums tracking-tight">
          $<span ref={out}>2.808219</span>
        </div>
      </div>
    </div>
  );
}

const RATES = [
  { k: "Zuno Cash", rate: 0.041, you: true },
  { k: "US savings average", rate: 0.0042 },
  { k: "Big-bank savings", rate: 0.0001 },
];

export function InterestCalculator() {
  const [balance, setBalance] = useState(20000);
  const rows = useMemo(() => RATES.map((r) => ({ ...r, year: balance * r.rate })), [balance]);
  const max = rows[0].year || 1;
  const pct = ((balance - 1000) / (250000 - 1000)) * 100;

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2 p-7 lg:p-10">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="text-[16px] text-white/70">Cash balance</span>
              <span className="font-mono text-[17px] tabular-nums">{formatUSD(balance, 0)}</span>
            </span>
            <input
              type="range"
              min={1000}
              max={250000}
              step={1000}
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="zuno-range mt-2"
              style={{ "--fill": `${pct}%` } as CSSProperties}
            />
          </label>
          <div className="mt-10 text-[16px] text-white/70">With Zuno you&apos;d earn</div>
          <div className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.05em]">
            <RollingNumber value={formatUSD(rows[0].year, 0)} />
          </div>
          <div className="mt-2 text-[16px] text-white/60">a year · {formatUSD(rows[0].year / 12, 2)} a month</div>
        </div>
        <ul className="space-y-6 self-end">
          {rows.map((r, i) => (
            <li key={r.k}>
              <div className="flex items-baseline justify-between text-[16px]">
                <span className={r.you ? "font-medium text-white" : "text-white/70"}>
                  {r.k} <span className="text-[15px] tabular-nums text-white/60">{(r.rate * 100).toFixed(2)}% APY</span>
                </span>
                <span className="font-mono tabular-nums">{formatUSD(r.year, 0)}</span>
              </div>
              <div className="mt-2 h-8 overflow-hidden rounded-[8px] bg-white/[0.04]">
                <motion.div
                  className="h-full rounded-[8px]"
                  style={r.you ? { background: "var(--zn-accent)" } : ditherStyle(pal.accent, i === 1 ? 0.45 : 0.2, 2)}
                  initial={false}
                  animate={{ width: `${Math.max(0.6, (r.year / max) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 110, damping: 20 }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 text-[15px] text-white/60">
        APY is variable and was 4.10% as of October 1, 2026. Averages from public deposit-rate surveys. Interest is paid monthly.
      </p>
    </div>
  );
}

/* ---------- FDIC sweep across ten program banks ---------- */

const BANKS = ["Alder", "Basalt", "Corran", "Delmont", "Eastwick", "Fennell", "Galloway", "Hartwell", "Ingram", "Juniper"];
const CAP = 250_000;
const toBalance = (t: number) => Math.round((25_000 * Math.pow(100, t / 100)) / 5000) * 5000;

export function SweepVisual() {
  const [t, setT] = useState(62);
  const balance = toBalance(t);
  const used = Math.min(BANKS.length, Math.ceil(balance / CAP));
  return (
    <div className="rounded-[28px] border border-white/[0.08] bg-ink-2 p-6 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block max-w-[560px]">
          <span className="text-[17px] text-white/70">Your cash balance</span>
          <span className="mt-2 block text-[clamp(2.6rem,5vw,4rem)] font-semibold leading-none tracking-[-0.045em]">
            <RollingNumber value={formatUSD(balance, 0)} />
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            aria-valuetext={formatUSD(balance, 0)}
            className="zuno-range mt-6"
            style={{ "--fill": `${t}%` } as CSSProperties}
          />
        </label>
        <dl className="flex gap-10">
          <div>
            <dt className="text-[16px] text-white/60">FDIC coverage</dt>
            <dd className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-accent">{formatUSD(balance, 0)}</dd>
          </div>
          <div>
            <dt className="text-[16px] text-white/60">Banks used</dt>
            <dd className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">
              {used} <span className="text-white/45">of 10</span>
            </dd>
          </div>
        </dl>
      </div>

      <ul className="mt-12 grid grid-cols-5 gap-x-2 gap-y-8 sm:gap-x-3 lg:grid-cols-10">
        {BANKS.map((b, i) => {
          const held = Math.max(0, Math.min(CAP, balance - i * CAP));
          const pct = held / CAP;
          return (
            <li key={b} className="min-w-0">
              <div className="mb-2 truncate text-center font-mono text-[15px] tabular-nums text-white/75">{held ? `$${Math.round(held / 1000)}K` : "·"}</div>
              <div className="relative h-[150px] overflow-hidden rounded-[14px] bg-white/[0.05] sm:h-[200px]">
                <motion.div
                  className="absolute inset-x-0 bottom-0"
                  style={pct === 1 ? { background: "var(--zn-accent)" } : ditherStyle(pal.accent, 0.7, 2)}
                  initial={false}
                  animate={{ height: `${pct * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: i * 0.03 }}
                />
              </div>
              <div className={cn("mt-2 truncate text-center text-[15px]", held ? "text-white" : "text-white/55")}>{b}</div>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 max-w-[680px] text-[16px] leading-relaxed text-white/65">
        Each bank holds up to $250,000 of your cash, the FDIC limit. Bank names are illustrative; the app shows exactly where every dollar sits.
      </p>
    </div>
  );
}

/* ---------- everyday moments ---------- */

const ROUNDUPS = [
  { k: "Coffee", v: 4.35 },
  { k: "Groceries", v: 62.18 },
  { k: "Ride home", v: 13.2 },
  { k: "Lunch", v: 11.4 },
];

function Card({ title, body, children, className }: { title: string; body: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col rounded-[28px] border border-white/[0.08] bg-ink-2 p-7 sm:p-9", className)}>
      <h3 className="text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold leading-[1.1] tracking-[-0.035em]">{title}</h3>
      <p className="mt-3 max-w-[440px] text-[18px] leading-relaxed text-white/70">{body}</p>
      <div className="mt-8 flex-1">{children}</div>
    </div>
  );
}

export function CashMoments() {
  const ref = useRef<HTMLDivElement>(null);
  const play = useInView(ref, { once: true, margin: "-15%" });
  const saved = ROUNDUPS.reduce((a, r) => a + (Math.ceil(r.v) - r.v), 0);
  return (
    <div ref={ref} className="grid gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-7" title="Round-ups" body="Card purchases round up to the next dollar, and the change is saved or invested.">
        <ul className="space-y-2">
          {ROUNDUPS.map((r, i) => (
            <motion.li
              key={r.k}
              initial={{ opacity: 0, y: 12 }}
              animate={play ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.25, ease: EASE_OUT, duration: 0.5 }}
              className="flex items-center justify-between rounded-[14px] bg-white/[0.04] px-5 py-3.5 text-[17px]"
            >
              <span>{r.k}</span>
              <span className="flex items-center gap-5 font-mono tabular-nums">
                <span className="text-white/60">${r.v.toFixed(2)}</span>
                <span className="w-16 text-right text-accent">+${(Math.ceil(r.v) - r.v).toFixed(2)}</span>
              </span>
            </motion.li>
          ))}
        </ul>
        <div className="mt-5 flex items-baseline justify-between px-1">
          <span className="text-[17px] text-white/70">Saved this week</span>
          <span className="text-[32px] font-semibold tracking-[-0.03em]">
            <RollingNumber value={play ? `$${saved.toFixed(2)}` : "$0.00"} />
          </span>
        </div>
      </Card>

      <Card className="lg:col-span-5" title="Same-day withdrawals" body="Requests before 2 PM ET usually land in your bank the same day.">
        <div className="rounded-[18px] bg-white/[0.04] p-5">
          <div className="text-[16px] text-white/65">To Checking ••4821</div>
          <div className="mt-1 text-[34px] font-semibold tracking-[-0.035em]">$1,200.00</div>
          <ol className="mt-5 space-y-3.5">
            {[
              { k: "Requested", t: "11:42 AM", done: true },
              { k: "Sent to your bank", t: "12:05 PM", done: true },
              { k: "Arrives", t: "Today", done: false },
            ].map((s, i) => (
              <motion.li key={s.k} initial={{ opacity: 0 }} animate={play ? { opacity: 1 } : {}} transition={{ delay: 0.4 + i * 0.35 }} className="flex items-center gap-3 text-[17px]">
                {s.done ? (
                  <CheckCircleIcon size={22} weight="fill" className="text-accent" />
                ) : (
                  <span className="relative grid size-[22px] place-items-center">
                    <span className="absolute size-3 animate-ping rounded-full bg-lime/60 motion-reduce:animate-none" />
                    <span className="size-2.5 rounded-full bg-lime" />
                  </span>
                )}
                <span className="flex-1">{s.k}</span>
                <span className="text-white/60">{s.t}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </Card>

      <Card className="lg:col-span-5" title="Instant deposits" body="Up to $5,000 is ready to invest the moment you hit deposit, before the transfer settles.">
        <div className="space-y-3">
          {[
            { k: "Bank transfer settles", v: "2 business days", w: "100%", fill: false },
            { k: "Available to invest", v: "Now", w: "8%", fill: true },
          ].map((r, i) => (
            <div key={r.k}>
              <div className="flex justify-between text-[16px]">
                <span className="text-white/70">{r.k}</span>
                <span className={r.fill ? "text-accent" : "text-white/80"}>{r.v}</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={play ? { width: r.w } : {}}
                  transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.3 + i * 0.2 }}
                  className="h-full rounded-full"
                  style={r.fill ? { background: "var(--zn-accent)" } : ditherStyle("#f5f5f5", 0.35, 2)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-7" title="Idle cash alerts" body="Copilot spots money you don't need on hand and suggests where it would work harder.">
        <div className="flex gap-4 rounded-[18px] bg-white/[0.04] p-5">
          <LogoMark size={30} animated={false} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-[17px] leading-relaxed text-white/85">
              You&apos;ve kept $9,400 in Cash for 60 days and your bills average $3,100 a month. Want to invest $4,000 and keep two months on hand?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-[12px] bg-lime px-4 py-2.5 text-[16px] font-medium text-on-lime">Invest $4,000</span>
              <span className="rounded-[12px] bg-white/[0.08] px-4 py-2.5 text-[16px] text-white/80">Keep it in Cash</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
