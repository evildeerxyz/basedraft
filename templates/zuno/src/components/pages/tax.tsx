"use client";

import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useInView } from "motion/react";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { ditherStyle } from "@/lib/dither";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { Stepper } from "../site/Stepper";
import { RollingNumber } from "../ui/RollingNumber";
import { Switch } from "../ui/Switch";

/** Hero visual: a fund dips below your cost basis; Zuno sells, books the loss, swaps into a twin. */
export function HarvestChart() {
  const ref = useRef<HTMLDivElement>(null);
  const play = useInView(ref, { once: true, margin: "-10%" });
  const W = 520;
  const H = 300;
  const pts = [96, 104, 112, 108, 118, 112, 100, 88, 76, 70, 74, 82, 90, 98, 106, 114, 120, 128];
  const basis = 110;
  const y = (v: number) => H - 30 - ((v - 60) / 80) * (H - 70);
  const x = (i: number) => 20 + (i / (pts.length - 1)) * (W - 40);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const sellAt = 9;

  return (
    <div ref={ref} className="rounded-[24px] border border-white/[0.08] bg-ink-2 p-5 sm:p-7">
      <div className="flex items-center justify-between text-[15px] tabular-nums text-white/60">
        <span>QQQ · your lot bought at $110</span>
        <span>12 months</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="QQQ falls below the $110 cost basis; Zuno sells at $70, books the loss and buys QQQM, which recovers to $128">
        <line x1="20" x2={W - 20} y1={y(basis)} y2={y(basis)} stroke="#fff" strokeOpacity="0.35" strokeDasharray="3 5" />
        <text x={W - 20} y={y(basis) - 8} textAnchor="end" fill="#fff" fillOpacity="0.6" fontSize="11" fontFamily="var(--font-geist-mono)">
          cost basis $110
        </text>
        <motion.rect
          x={x(6)}
          y={y(basis)}
          width={x(12) - x(6)}
          height={y(70) - y(basis)}
          fill="#ff5a4e"
          fillOpacity="0.1"
          initial={{ opacity: 0 }}
          animate={{ opacity: play ? 1 : 0 }}
          transition={{ delay: 1.2 }}
        />
        <motion.path d={d} fill="none" stroke="#c8ff3e" strokeWidth="2.5" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: play ? 1 : 0 }} transition={{ duration: 2.4, ease: EASE_OUT }} />
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: play ? 1 : 0 }} transition={{ delay: 1.3 }}>
          <circle cx={x(sellAt)} cy={y(pts[sellAt])} r="6" fill="#000" stroke="#c8ff3e" strokeWidth="2.5" />
          <line x1={x(sellAt)} x2={x(sellAt)} y1={y(pts[sellAt]) + 10} y2={H - 28} stroke="#c8ff3e" strokeOpacity="0.5" />
        </motion.g>
      </svg>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={play ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="mt-2 grid gap-3 sm:grid-cols-3"
      >
        {[
          { k: "Sold at $70", v: "−$1,280 loss booked" },
          { k: "Bought instead", v: "QQQM, same index" },
          { k: "Tax saved", v: "≈ $307 at 24%" },
        ].map((s) => (
          <div key={s.k} className="rounded-[12px] bg-white/[0.04] px-4 py-3">
            <div className="text-[15px] text-white/60">{s.k}</div>
            <div className="mt-0.5 text-[17px] font-medium">{s.v}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const BRACKETS = [12, 22, 24, 32, 35];

export function HarvestCalculator() {
  const [size, setSize] = useState(100000);
  const [bracket, setBracket] = useState(24);
  const [state, setState] = useState(true);

  const est = useMemo(() => {
    // Rough model: harvestable losses ≈ 2.6% of a taxable portfolio in a typical year.
    const losses = size * 0.026;
    const rate = (bracket + (state ? 5 : 0)) / 100;
    const saved = losses * rate;
    return { losses, saved, ten: saved * 10 * 0.85 };
  }, [size, bracket, state]);

  const pct = ((size - 10000) / (1000000 - 10000)) * 100;
  const bars = Array.from({ length: 10 }, (_, i) => (i + 1) / 10);

  return (
    <div className="grid overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2 lg:grid-cols-[380px_1fr]">
      <div className="space-y-8 p-7 lg:p-9">
        <label className="block">
          <span className="flex items-baseline justify-between">
            <span className="text-[16px] text-white/70">Taxable portfolio</span>
            <span className="font-mono text-[17px] tabular-nums">{formatUSD(size, 0)}</span>
          </span>
          <input
            type="range"
            min={10000}
            max={1000000}
            step={5000}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="zuno-range mt-2"
            style={{ "--fill": `${pct}%` } as CSSProperties}
          />
        </label>
        <div>
          <div className="text-[16px] text-white/70">Federal tax bracket</div>
          <LayoutGroup id="bracket">
            <div className="mt-3 grid grid-cols-5 gap-1 rounded-[12px] bg-white/[0.04] p-1">
              {BRACKETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBracket(b)}
                  aria-pressed={bracket === b}
                  className={cn("relative h-9 rounded-[9px] text-[15px] font-medium", bracket === b ? "text-on-lime" : "text-white/70 hover:text-white")}
                >
                  {bracket === b && <motion.span layoutId="bracket-pill" className="absolute inset-0 rounded-[9px] bg-lime" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{b}%</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[16px] text-white/80">Include state tax</div>
            <div className="text-[15px] text-white/60">Assumes 5%</div>
          </div>
          <Switch on={state} onChange={setState} label="Include state tax" />
        </div>
      </div>
      <div className="flex flex-col p-7 lg:border-l lg:border-white/[0.06] lg:p-9">
        <div className="text-[16px] text-white/70">Estimated tax saved each year</div>
        <div className="mt-2 text-[clamp(2.8rem,6vw,4.8rem)] font-semibold leading-none tracking-[-0.05em]">
          <RollingNumber value={formatUSD(est.saved, 0)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[15px]">
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-white/70">
            Losses harvested <span className="font-mono text-white">{formatUSD(est.losses, 0)}</span>
          </span>
          <span className="rounded-full bg-lime/15 px-3 py-1.5 text-accent">
            Over 10 years <span className="font-mono">≈ {formatUSD(est.ten, 0)}</span>
          </span>
        </div>
        <div className="mt-auto flex h-36 items-end gap-2 pt-10" aria-hidden>
          {bars.map((b, i) => (
            <motion.div
              key={i}
              className="flex-1 origin-bottom rounded-t-[4px]"
              style={ditherStyle("#c8ff3e", 0.3 + b * 0.7, 2)}
              initial={false}
              animate={{ height: `${Math.min(100, b * 100 * (0.4 + est.saved / 9000))}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: i * 0.02 }}
            />
          ))}
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">
          Hypothetical estimate. Actual savings depend on market moves, your gains and your tax situation. Harvesting defers tax rather than eliminating it in many cases.
        </p>
      </div>
    </div>
  );
}

/* ---------- four steps, lot by lot ---------- */

const PRICE = 262.1;
const LOTS = [
  { when: "Mar 2025", shares: 10, cost: 268.4 },
  { when: "Jul 2025", shares: 12, cost: 284.9 },
  { when: "Jan 2026", shares: 8, cost: 301.2 },
  { when: "Apr 2026", shares: 15, cost: 296.5 },
].map((l) => ({ ...l, change: (PRICE / l.cost - 1) * 100, pnl: (PRICE - l.cost) * l.shares }));
const HARVEST = LOTS.filter((l) => l.change <= -5);
const LOSS = HARVEST.reduce((a, l) => a + l.pnl, 0);
const SOLD = HARVEST.reduce((a, l) => a + l.shares, 0);
const GAINS = 2400;

function Lots() {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-[20px] font-semibold tracking-[-0.02em]">VTI tax lots</div>
        <div className="text-[16px] text-white/60">
          Today <span className="font-mono text-white">${PRICE.toFixed(2)}</span>
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {LOTS.map((l, i) => {
          const go = l.change <= -5;
          return (
            <motion.li
              key={l.when}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, ease: EASE_OUT, duration: 0.5 }}
              className={cn("grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-[16px] px-4 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:px-5", go ? "bg-white/[0.05]" : "")}
            >
              <div>
                <div className="text-[17px] font-medium">{l.when}</div>
                <div className="text-[15px] text-white/60">
                  {l.shares} shares at ${l.cost.toFixed(2)}
                </div>
              </div>
              <div className={cn("hidden font-mono text-[16px] tabular-nums sm:block", go ? "text-down" : "text-white/60")}>{l.change.toFixed(1)}%</div>
              <div className={cn("font-mono text-[16px] tabular-nums", go ? "text-white" : "text-white/60")}>{formatUSD(l.pnl, 0)}</div>
              <span className={cn("rounded-full px-3 py-1 text-[15px] font-medium", go ? "bg-lime text-on-lime" : "bg-white/[0.06] text-white/60")}>{go ? "Harvest" : "Too small"}</span>
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-6 text-[16px] leading-relaxed text-white/65">Dips under 5% are ignored. Trading costs and noise would eat most of the benefit.</p>
    </div>
  );
}

function Swap() {
  const proceeds = SOLD * PRICE;
  return (
    <div>
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        {[
          { side: "Sell", t: "VTI", sub: `${SOLD} shares`, v: proceeds },
          null,
          { side: "Buy", t: "ITOT", sub: `${(proceeds / 131.4).toFixed(2)} shares`, v: proceeds },
        ].map((c, i) =>
          c ? (
            <motion.div
              key={c.side}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.18, ease: EASE_OUT, duration: 0.55 }}
              className={cn("rounded-[20px] p-5", c.side === "Buy" ? "bg-lime text-on-lime" : "bg-white/[0.06]")}
            >
              <div className={cn("text-[15px] font-medium", c.side === "Buy" ? "opacity-70" : "text-white/60")}>{c.side}</div>
              <div className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.04em]">{c.t}</div>
              <div className={cn("mt-3 text-[16px]", c.side === "Buy" ? "opacity-80" : "text-white/70")}>
                {c.sub} · <span className="font-mono">{formatUSD(c.v, 0)}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div key="arrow" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 }} className="mx-auto grid size-12 rotate-90 place-items-center rounded-full bg-white/[0.06] sm:rotate-0">
              <ArrowRightIcon size={20} weight="bold" />
            </motion.div>
          ),
        )}
      </div>
      <div className="mt-8 rounded-[20px] bg-white/[0.04] p-5">
        <div className="text-[16px] text-white/65">Loss booked for your taxes</div>
        <div className="mt-1 text-[44px] font-semibold leading-none tracking-[-0.04em]">
          <RollingNumber value={formatUSD(LOSS, 0)} />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {["Before", "After"].map((k) => (
          <div key={k} className="flex items-center gap-4">
            <span className="w-16 text-[15px] text-white/60">{k}</span>
            <motion.span initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.9, ease: EASE_OUT, delay: k === "After" ? 0.35 : 0.1 }} className="h-3 rounded-full" style={ditherStyle("#c8ff3e", k === "After" ? 1 : 0.6, 2)} />
          </div>
        ))}
        <p className="pt-1 text-[16px] text-white/65">Both funds track the total US market, so your exposure barely moves.</p>
      </div>
    </div>
  );
}

function WashWindow() {
  return (
    <div>
      <div className="text-[16px] text-white/65">VTI repurchases blocked until</div>
      <div className="mt-1 text-[40px] font-semibold leading-none tracking-[-0.04em]">November 11</div>
      <div className="mt-7 grid grid-cols-7 gap-1.5 sm:gap-2" aria-hidden>
        {Array.from({ length: 31 }, (_, d) => (
          <motion.span
            key={d}
            initial={{ opacity: 0.15, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: d * 0.035, duration: 0.3 }}
            className={cn("grid aspect-square place-items-center rounded-[8px] text-[15px] tabular-nums", d === 0 ? "bg-lime font-semibold text-on-lime" : "bg-white/[0.06] text-white/70")}
          >
            {d + 1}
          </motion.span>
        ))}
      </div>
      <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[16px] text-white/80">
        {["Individual account", "Roth IRA", "Recurring buys", "Dividend reinvestment"].map((x) => (
          <li key={x} className="flex items-center gap-2">
            <CheckIcon size={16} weight="bold" className="text-accent" /> {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UseLoss() {
  const taxable = GAINS + LOSS;
  return (
    <div>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-[17px]">
            <span className="text-white/70">Capital gains this year</span>
            <span className="font-mono">{formatUSD(GAINS, 0)}</span>
          </div>
          <div className="relative mt-3 h-12 overflow-hidden rounded-[12px] bg-white/[0.08]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(-LOSS / GAINS) * 100}%` }}
              transition={{ duration: 1, ease: EASE_OUT, delay: 0.2 }}
              className="absolute inset-y-0 right-0"
              style={ditherStyle("#c8ff3e", 0.85, 2)}
            />
          </div>
          <div className="mt-2 flex justify-between text-[15px]">
            <span className="text-white/60">Still taxable {formatUSD(taxable, 0)}</span>
            <span className="text-accent">Offset {formatUSD(-LOSS, 0)}</span>
          </div>
        </div>
      </div>
      <div className="mt-10 rounded-[20px] bg-lime p-6 text-on-lime">
        <div className="text-[16px] opacity-75">Estimated tax saved, 24% bracket</div>
        <div className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.045em]">
          <RollingNumber value={formatUSD(-LOSS * 0.24, 0)} />
        </div>
      </div>
      <p className="mt-6 text-[16px] leading-relaxed text-white/65">No gains to offset? Up to $3,000 comes off your income instead, and the rest carries forward.</p>
    </div>
  );
}

const STEPS = [
  { title: "Spot the dip", body: "Every lot is compared to what you paid, every trading day. Small dips are ignored; meaningful ones are flagged." },
  { title: "Sell and swap", body: "The flagged lots are sold and the money goes straight into a fund tracking a similar index, the same minute." },
  { title: "Respect the window", body: "Zuno blocks buying the original fund for 31 days across every Zuno account, so the IRS doesn't disallow the loss." },
  { title: "Use the loss", body: "Losses cancel out gains first, then up to $3,000 of income a year. Whatever's left carries forward." },
];

export function HarvestSteps() {
  return (
    <Stepper steps={STEPS} duration={6}>
      {(i) => (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: EASE_OUT }} className="p-6 sm:p-9">
            {i === 0 ? <Lots /> : i === 1 ? <Swap /> : i === 2 ? <WashWindow /> : <UseLoss />}
          </motion.div>
        </AnimatePresence>
      )}
    </Stepper>
  );
}
