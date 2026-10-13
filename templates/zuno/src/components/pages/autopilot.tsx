"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ditherTile } from "@/lib/dither";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { Stepper } from "../site/Stepper";
import { LogoMark } from "../ui/Logo";
import { RollingNumber } from "../ui/RollingNumber";
import { Switch } from "../ui/Switch";

const LIME = "#c8ff3e";
const CLASSES = [
  { k: "US stocks", target: 55, level: 1 },
  { k: "International", target: 18, level: 0.75 },
  { k: "Bonds", target: 12, level: 0.5 },
  { k: "Crypto", target: 5, level: 0.32 },
  { k: "Cash", target: 10, level: 0.16 },
];

/* ---------- hero: rebalancing ring ---------- */

const DRIFTED = [61, 14, 10, 8, 7];

export function AutopilotRing() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [balanced, setBalanced] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setBalanced((b) => !b), 3200);
    return () => clearInterval(id);
  }, [inView]);

  const values = balanced ? CLASSES.map((c) => c.target) : DRIFTED;
  const R = 120;
  const C = 2 * Math.PI * R;
  const offsets = values.map((_, i) => (values.slice(0, i).reduce((a, b) => a + b, 0) / 100) * C);

  return (
    <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[460px]">
      <svg viewBox="0 0 300 300" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          {CLASSES.map((c, i) => (
            <pattern key={c.k} id={`ap-pat-${i}`} width="8" height="8" patternUnits="userSpaceOnUse">
              <image href={ditherTile(LIME, c.level, 2).slice(5, -2)} width="8" height="8" />
            </pattern>
          ))}
        </defs>
        <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="44" />
        {values.map((v, i) => {
          const len = (v / 100) * C - 3;
          return (
            <motion.circle
              key={CLASSES[i].k}
              cx="150"
              cy="150"
              r={R}
              fill="none"
              stroke={i === 0 ? LIME : `url(#ap-pat-${i})`}
              strokeWidth="44"
              initial={false}
              animate={{ strokeDasharray: `${len} ${C}`, strokeDashoffset: -offsets[i] }}
              transition={{ type: "spring", stiffness: 70, damping: 18 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[17px] font-medium text-white/60">Largest drift</div>
          <div className="mt-1 text-[44px] font-semibold leading-none tracking-[-0.04em]">
            <RollingNumber value={balanced ? "0.3%" : "6.0%"} />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={String(balanced)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn("mt-2 text-[16px]", balanced ? "text-accent" : "text-down")}
            >
              {balanced ? "On target" : "US stocks overweight"}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {CLASSES.map((c, i) => (
          <li key={c.k} className="flex items-center gap-2 text-[15px] text-white/70">
            <span className="size-3 rounded-[3px]" style={c.level === 1 ? { background: LIME } : { backgroundImage: ditherTile(LIME, c.level, 1), backgroundSize: "4px 4px" }} />
            {c.k}
            <span className="font-mono text-white">{values[i]}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- drift simulator ---------- */

const START = 48000;

function Range({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-[16px] text-white/70">{label}</span>
        <span className={cn("font-mono text-[17px] tabular-nums", value > 0 ? "text-accent" : value < 0 ? "text-down" : "text-white")}>
          {value > 0 ? "+" : ""}
          {value}%
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="zuno-range mt-2" style={{ "--fill": `${pct}%` } as CSSProperties} />
    </label>
  );
}

export function DriftSimulator() {
  const [shock, setShock] = useState({ us: 18, intl: -4, bonds: -2, crypto: 40 });
  const [threshold, setThreshold] = useState(2);

  const sim = useMemo(() => {
    const moves = [shock.us, shock.intl, shock.bonds, shock.crypto, 0];
    const values = CLASSES.map((c, i) => (START * c.target) / 100 * (1 + moves[i] / 100));
    const total = values.reduce((a, b) => a + b, 0);
    const rows = CLASSES.map((c, i) => {
      const weight = (values[i] / total) * 100;
      const goal = (total * c.target) / 100;
      return { ...c, value: values[i], weight, drift: weight - c.target, trade: goal - values[i] };
    });
    const maxDrift = Math.max(...rows.map((r) => Math.abs(r.drift)));
    const trades = maxDrift > threshold ? rows.filter((r) => Math.abs(r.trade) >= 25).sort((a, b) => a.trade - b.trade) : [];
    return { rows, total, maxDrift, trades };
  }, [shock, threshold]);

  const set = (k: keyof typeof shock) => (v: number) => setShock((s) => ({ ...s, [k]: v }));

  return (
    <div className="grid overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2 lg:grid-cols-[360px_1fr]">
      <div className="space-y-7 p-7 lg:p-9">
        <div className="text-[17px] font-medium">Shock the market</div>
        <Range label="US stocks" value={shock.us} min={-40} max={40} onChange={set("us")} />
        <Range label="International" value={shock.intl} min={-40} max={40} onChange={set("intl")} />
        <Range label="Bonds" value={shock.bonds} min={-15} max={15} onChange={set("bonds")} />
        <Range label="Crypto" value={shock.crypto} min={-70} max={120} onChange={set("crypto")} />
        <div>
          <div className="text-[16px] text-white/70">Rebalance when drift exceeds</div>
          <LayoutGroup id="threshold">
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-[12px] bg-white/[0.04] p-1">
              {[1, 2, 5].map((t) => (
                <button
                  key={t}
                  onClick={() => setThreshold(t)}
                  aria-pressed={threshold === t}
                  className={cn("relative h-9 rounded-[9px] text-[16px] font-medium transition-colors", threshold === t ? "text-on-lime" : "text-white/70 hover:text-white")}
                >
                  {threshold === t && <motion.span layoutId="thr" className="absolute inset-0 rounded-[9px] bg-lime" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{t}%</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>
      </div>

      <div className="border-white/[0.06] p-7 lg:border-l lg:p-9">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-[16px] text-white/70">Portfolio after the move</div>
            <div className="mt-1 text-[40px] font-semibold leading-none tracking-[-0.04em]">
              <RollingNumber value={formatUSD(sim.total, 0)} />
            </div>
          </div>
          <div className={cn("rounded-full px-3 py-1.5 text-[15px] tabular-nums", sim.trades.length ? "bg-down/15 text-down" : "bg-lime/15 text-accent")}>
            Largest drift {sim.maxDrift.toFixed(1)}%
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {[
            { label: "After the move", values: sim.rows.map((r) => r.weight) },
            { label: "Target", values: CLASSES.map((c) => c.target) },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="mb-1.5 text-[15px] text-white/60">{bar.label}</div>
              <div className="flex h-9 gap-[3px] overflow-hidden rounded-[10px]">
                {bar.values.map((v, i) => (
                  <motion.div
                    key={CLASSES[i].k}
                    className="rounded-[4px]"
                    style={CLASSES[i].level === 1 ? { background: LIME } : { backgroundImage: ditherTile(LIME, CLASSES[i].level, 2), backgroundSize: "8px 8px" }}
                    initial={false}
                    animate={{ width: `${v}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="text-[16px] font-medium">What Autopilot would do</div>
          <AnimatePresence mode="popLayout" initial={false}>
            {sim.trades.length === 0 ? (
              <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 text-[17px] text-white/70">
                <CheckIcon size={16} weight="bold" className="text-accent" />
                Nothing. Every asset class is within {threshold}% of target.
              </motion.p>
            ) : (
              <motion.ul key="trades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 divide-y divide-white/[0.06]">
                {sim.trades.map((t) => (
                  <motion.li key={t.k} layout className="flex items-center justify-between py-3 text-[17px]">
                    <span className="flex items-center gap-3">
                      <span className={cn("w-12 text-[15px] tabular-nums", t.trade < 0 ? "text-down" : "text-accent")}>{t.trade < 0 ? "SELL" : "BUY"}</span>
                      {t.k}
                    </span>
                    <span className="font-mono tabular-nums">{formatUSD(Math.abs(t.trade), 0)}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Simplified illustration on a $48,000 Growth portfolio. In practice Autopilot uses new deposits and dividends first, and sells lots with losses before gains.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- rules ---------- */

const EXCLUSIONS = ["Tobacco", "Fossil fuels", "Weapons", "Gambling"];

export function RulesPanel() {
  const [deposits, setDeposits] = useState(true);
  const [shortTerm, setShortTerm] = useState(true);
  const [dividends, setDividends] = useState(true);
  const [threshold, setThreshold] = useState(2);
  const [excluded, setExcluded] = useState<string[]>(["Tobacco"]);

  const toggle = (x: string) => setExcluded((e) => (e.includes(x) ? e.filter((y) => y !== x) : [...e, x]));
  const list = excluded.map((x) => x.toLowerCase());
  const exclusionText = list.length === 0 ? "" : ` It never buys ${list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")} or ${list[list.length - 1]}`} companies.`;

  const rows = [
    { label: "Use deposits before selling", detail: "New money buys what's underweight first.", on: deposits, set: setDeposits },
    { label: "Avoid short-term gains", detail: "Never sells a winner held under a year.", on: shortTerm, set: setShortTerm },
    { label: "Reinvest dividends", detail: "Dividends go straight back to work.", on: dividends, set: setDividends },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-6 border-b border-white/[0.06] px-6 py-5">
            <div>
              <div className="text-[16px] font-medium">{r.label}</div>
              <div className="mt-0.5 text-[16px] text-white/60">{r.detail}</div>
            </div>
            <Switch on={r.on} onChange={r.set} label={r.label} />
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
          <div className="text-[16px] font-medium">Drift threshold</div>
          <div className="flex gap-1 rounded-[10px] bg-white/[0.04] p-1">
            {[1, 2, 5].map((t) => (
              <button key={t} onClick={() => setThreshold(t)} aria-pressed={threshold === t} className={cn("h-8 rounded-[8px] px-3 text-[15px] font-medium", threshold === t ? "bg-lime text-on-lime" : "text-white/70")}>
                {t}%
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="text-[16px] font-medium">Never buy</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXCLUSIONS.map((x) => {
              const on = excluded.includes(x);
              return (
                <button
                  key={x}
                  onClick={() => toggle(x)}
                  aria-pressed={on}
                  className={cn("rounded-full border px-3.5 py-1.5 text-[16px] transition-colors", on ? "border-lime bg-lime text-on-lime" : "border-white/15 text-white/80 hover:border-white/30")}
                >
                  {x}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-[20px] bg-lime p-7 text-on-lime">
        <div className="text-[17px] font-medium opacity-70">In plain English</div>
        <p className="mt-6 text-[24px] font-medium leading-snug tracking-[-0.02em]" aria-live="polite">
          Autopilot rebalances when anything drifts more than {threshold}% from target
          {deposits ? ", spends new deposits before selling anything" : ""}
          {shortTerm ? ", and never realizes a short-term gain" : ""}.{dividends ? " Dividends are reinvested the day they land." : " Dividends stay in cash."}
          {exclusionText}
        </p>
        <p className="mt-6 text-[15px] opacity-70">Change these any time in the app. Copilot will tell you how each rule affects your plan.</p>
      </div>
    </div>
  );
}

/* ---------- a day on Autopilot ---------- */

const DAY = [
  { time: "9:30 AM", title: "The market opens", body: "Autopilot checks every holding against your targets. Everything is within range, so it does nothing. Most days look like this.", w: [55.2, 17.9, 12.1, 4.9, 9.9], status: "On target" },
  { time: "11:02 AM", title: "Nvidia jumps 6%", body: "Your US stocks grow to 57.4% of the portfolio, 2.4% over target and past your 2% threshold. A rebalance is planned.", w: [57.4, 17.2, 11.5, 4.7, 9.2], status: "Drift 2.4%" },
  { time: "11:03 AM", title: "A $500 deposit lands", body: "Instead of selling winners, Autopilot sends your scheduled deposit to what's underweight. No sales means no tax.", w: [57.4, 17.2, 11.5, 4.7, 9.2], status: "Planning" },
  { time: "11:04 AM", title: "Back on target", body: "Two buys, filled in seconds. Largest drift is back to 0.6%, with fractional shares down to the cent.", w: [55.6, 18, 12, 4.8, 9.6], status: "On target" },
  { time: "4:00 PM", title: "You get one sentence", body: "No alerts during the day. Just a note in the app explaining what happened and why, if you want it.", w: [55.6, 18, 12, 4.8, 9.6], status: "Done" },
];

export function AutopilotDay() {
  return (
    <Stepper steps={DAY.map((d) => ({ title: d.title, body: d.body, meta: d.time }))} duration={5}>
      {(i) => {
        const d = DAY[i];
        const warn = d.status.startsWith("Drift");
        return (
          <div className="flex h-full flex-col p-6 sm:p-9">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.045em] tabular-nums">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={d.time} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="block">
                    {d.time}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className={cn("rounded-full px-4 py-2 text-[15px] font-medium transition-colors", warn ? "bg-down/15 text-down" : d.status === "Planning" ? "bg-white/10 text-white" : "bg-lime/15 text-accent")}>{d.status}</span>
            </div>

            <ul className="mt-9 space-y-4">
              {CLASSES.map((c, k) => {
                const over = d.w[k] - c.target > 2;
                return (
                  <li key={c.k} className="grid grid-cols-[110px_1fr_64px] items-center gap-4 sm:grid-cols-[130px_1fr_72px]">
                    <span className="text-[16px] text-white/75">{c.k}</span>
                    <span className="relative h-3.5 rounded-full bg-white/[0.06]">
                      <motion.span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={c.level === 1 ? { background: over ? "#ff5a4e" : LIME } : { backgroundImage: ditherTile(LIME, c.level, 1), backgroundSize: "4px 4px" }}
                        initial={false}
                        animate={{ width: `${(d.w[k] / 60) * 100}%` }}
                        transition={{ type: "spring", stiffness: 90, damping: 18 }}
                      />
                      <span aria-hidden className="absolute -inset-y-1.5 w-[2px] rounded-full bg-white/70" style={{ left: `${(c.target / 60) * 100}%` }} />
                    </span>
                    <span className={cn("text-right font-mono text-[16px] tabular-nums", over ? "text-down" : "text-white")}>{d.w[k].toFixed(1)}%</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center gap-2 pl-[126px] text-[15px] text-white/60 sm:pl-[146px]">
              <span className="h-3.5 w-[2px] rounded-full bg-white/70" /> Target
            </div>

            <div className="mt-auto pt-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
                  {i === 2 || i === 3 ? (
                    <ul className="space-y-2">
                      {[
                        { k: "Bonds", v: 310 },
                        { k: "International", v: 190 },
                      ].map((t) => (
                        <li key={t.k} className="flex items-center justify-between rounded-[14px] bg-white/[0.05] px-5 py-3.5 text-[17px]">
                          <span className="flex items-center gap-3">
                            <span className="text-[15px] font-medium text-accent">Buy</span>
                            {t.k}
                          </span>
                          <span className="flex items-center gap-3 font-mono tabular-nums">
                            ${t.v}.00
                            {i === 3 && <CheckIcon size={18} weight="bold" className="text-accent" />}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : i === 4 ? (
                    <div className="flex gap-4 rounded-[18px] bg-white/[0.05] p-5">
                      <LogoMark size={30} animated={false} className="mt-0.5 shrink-0" />
                      <p className="text-[17px] leading-relaxed text-white/85">Nvidia pushed your US stocks 2.4% over target. I used today&apos;s $500 deposit to rebalance, so nothing was sold and there&apos;s no tax to pay.</p>
                    </div>
                  ) : (
                    <p className="rounded-[18px] bg-white/[0.05] px-5 py-4 text-[17px] text-white/75">{i === 0 ? "No trades needed." : "US stocks are over the 2% line. Looking for the cheapest fix."}</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        );
      }}
    </Stepper>
  );
}
