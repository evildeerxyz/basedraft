"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { linePath, makeSeries } from "@/lib/chart";
import { cn, formatUSD } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";

const ASSETS = [
  { sym: "BTC", name: "Bitcoin", price: 112480.55, chg: -1.12, seed: 15, color: "#f7931a" },
  { sym: "ETH", name: "Ethereum", price: 4210.32, chg: 3.05, seed: 27, color: "#8a92b2" },
];

function useLivePrices() {
  const [prices, setPrices] = useState(ASSETS.map((a) => a.price));
  useEffect(() => {
    const id = setInterval(() => setPrices((p) => p.map((v) => v * (1 + (Math.random() - 0.49) * 0.003))), 1800);
    return () => clearInterval(id);
  }, []);
  return prices;
}

/** Hero visual: the ringed planet, with live prices. */
export function CryptoHero() {
  const prices = useLivePrices();
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-ink-2">
      <DitherShader shape="planet" ring orb={[0.5, 0.45, 0.24]} color="#c8ff3e" pixelSize={3} interactive />
      <div className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3 sm:inset-x-8 sm:bottom-8">
        {ASSETS.map((a, i) => (
          <div key={a.sym} className="rounded-[14px] bg-ink/90 px-4 py-3 ring-1 ring-white/10">
            <div className="flex items-center justify-between text-[15px] text-white/60">
              <span>{a.name}</span>
              <span className={a.chg >= 0 ? "text-accent" : "text-down"}>
                {a.chg >= 0 ? "+" : "−"}
                {Math.abs(a.chg).toFixed(2)}%
              </span>
            </div>
            <div className="mt-1 font-mono text-[18px] tabular-nums">{formatUSD(prices[i])}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CryptoAssets() {
  const prices = useLivePrices();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ASSETS.map((a, i) => {
        const up = a.chg >= 0;
        return (
          <div key={a.sym} className="rounded-[20px] border border-white/[0.08] bg-ink-2 p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full text-[17px] font-bold text-white" style={{ background: a.color }}>
                {a.sym === "BTC" ? "₿" : "Ξ"}
              </span>
              <div>
                <div className="text-[18px] font-semibold">{a.name}</div>
                <div className="text-[15px] tabular-nums text-white/60">{a.sym}</div>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[30px] tabular-nums tracking-tight">{formatUSD(prices[i])}</div>
                <div className={cn("mt-1 text-[16px]", up ? "text-accent" : "text-down")}>
                  {up ? "+" : "−"}
                  {Math.abs(a.chg).toFixed(2)}% today
                </div>
              </div>
              <Spark seed={a.seed} up={up} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Spark({ seed, up }: { seed: number; up: boolean }) {
  const d = useMemo(() => linePath(makeSeries(seed, 40, up ? 0.5 : -0.4), 160, 56, 4), [seed, up]);
  return (
    <svg viewBox="0 0 160 56" className="h-14 w-40" aria-hidden>
      <path d={d} fill="none" stroke={up ? "#c8ff3e" : "#ff5a4e"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const CAPS = [
  { k: "Conservative", cap: 0 },
  { k: "Balanced", cap: 3 },
  { k: "Growth", cap: 5 },
];

/** Shows how the cap works: crypto rallies, Autopilot trims the excess back to the cap. */
export function CryptoCap() {
  const [rally, setRally] = useState(80);
  const [plan, setPlan] = useState(2);
  const cap = CAPS[plan].cap;
  const start = cap;
  const grown = start * (1 + rally / 100);
  const weight = (grown / (100 - start + grown)) * 100;
  const trim = Math.max(0, weight - cap);
  const pct = (rally / 200) * 100;

  return (
    <div className="grid overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2 lg:grid-cols-[360px_1fr]">
      <div className="space-y-8 p-7 lg:p-9">
        <div>
          <div className="text-[16px] text-white/70">Your strategy</div>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-[12px] bg-white/[0.04] p-1">
            {CAPS.map((c, i) => (
              <button key={c.k} onClick={() => setPlan(i)} aria-pressed={plan === i} className={cn("h-9 rounded-[9px] text-[15px] font-medium", plan === i ? "bg-lime text-on-lime" : "text-white/70 hover:text-white")}>
                {c.k}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="flex items-baseline justify-between">
            <span className="text-[16px] text-white/70">Crypto rallies by</span>
            <span className="font-mono text-[17px] text-accent">+{rally}%</span>
          </span>
          <input type="range" min={0} max={200} step={5} value={rally} onChange={(e) => setRally(Number(e.target.value))} className="zuno-range mt-2" style={{ "--fill": `${pct}%` } as CSSProperties} />
        </label>
      </div>
      <div className="p-7 lg:border-l lg:border-white/[0.06] lg:p-9">
        {cap === 0 ? (
          <p className="text-[18px] leading-relaxed text-white/80">Conservative plans hold no crypto. Autopilot will never buy it unless you change strategy.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6">
              {[
                { k: "Cap", v: `${cap}%` },
                { k: "After the rally", v: `${weight.toFixed(1)}%` },
                { k: "Autopilot trims", v: `${trim.toFixed(1)}%` },
              ].map((s) => (
                <div key={s.k}>
                  <div className="text-[15px] text-white/60">{s.k}</div>
                  <div className="mt-1 text-[32px] font-semibold tracking-[-0.04em]">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="relative mt-10 h-12 overflow-hidden rounded-[10px] bg-white/[0.04]">
              <motion.div className="absolute inset-y-0 left-0 bg-lime" initial={false} animate={{ width: `${(Math.min(weight, cap) / 12) * 100}%` }} />
              <motion.div
                className="absolute inset-y-0 bg-down/70"
                initial={false}
                animate={{ left: `${(cap / 12) * 100}%`, width: `${(trim / 12) * 100}%` }}
              />
              <div className="absolute inset-y-0 w-px bg-white" style={{ left: `${(cap / 12) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[15px] tabular-nums text-white/60">
              <span>0%</span>
              <span>12% of portfolio</span>
            </div>
            <p className="mt-6 text-[17px] leading-relaxed text-white/70">
              The trimmed {trim.toFixed(1)}% is sold and spread across the rest of your mix, so one asset class can never quietly take over your plan.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
