"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { pal } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { VelocityMarquee } from "../ui/VelocityMarquee";

const TICKERS = [
  { s: "AAPL", p: 241.18, c: 0.84 },
  { s: "NVDA", p: 182.4, c: 2.31 },
  { s: "MSFT", p: 512.66, c: 0.42 },
  { s: "TSLA", p: 288.03, c: -1.87 },
  { s: "AMZN", p: 226.9, c: 1.12 },
  { s: "BTC", p: 112480.55, c: -1.12 },
  { s: "ETH", p: 4210.32, c: 3.05 },
  { s: "VTI", p: 312.48, c: 0.61 },
  { s: "GOOGL", p: 201.37, c: -0.36 },
  { s: "META", p: 731.2, c: 1.48 },
  { s: "SPY", p: 652.81, c: 0.57 },
  { s: "GLD", p: 318.44, c: 0.22 },
  { s: "QQQ", p: 571.05, c: 0.93 },
  { s: "BND", p: 73.92, c: -0.08 },
];

type Tick = { s: string; p: number; c: number; dir: 1 | -1 | 0 };

function PixelDot() {
  return (
    <span className="mx-7 grid grid-cols-3 gap-px opacity-50" aria-hidden>
      {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
        <span key={i} className={cn("size-[2px]", on ? "bg-lime" : "bg-transparent")} />
      ))}
    </span>
  );
}

function TickerItem({ t }: { t: Tick }) {
  const up = t.c >= 0;
  return (
    <span className="flex items-center font-mono text-[15px]">
      <span className="font-semibold tracking-wide text-white">{t.s}</span>
      <motion.span
        key={t.p}
        initial={t.dir ? { color: t.dir > 0 ? pal.accent : pal.down } : false}
        animate={{ color: pal.muted }}
        transition={{ duration: 1.4 }}
        className="ml-3 tabular-nums"
      >
        {t.p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </motion.span>
      <span className={cn("ml-3 tabular-nums", up ? "text-accent" : "text-down")}>
        {up ? "▲" : "▼"} {Math.abs(t.c).toFixed(2)}%
      </span>
      <PixelDot />
    </span>
  );
}

export function TickerTape() {
  const [ticks, setTicks] = useState<Tick[]>(() => TICKERS.map((t) => ({ ...t, dir: 0 })));

  useEffect(() => {
    const id = setInterval(() => {
      setTicks((prev) =>
        prev.map((t) => {
          if (Math.random() > 0.3) return { ...t, dir: 0 };
          const move = (Math.random() - 0.48) * 0.004;
          return { ...t, p: t.p * (1 + move), c: t.c + move * 100, dir: move >= 0 ? 1 : -1 };
        }),
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <section aria-label="Live market prices" className="relative bg-ink-2/80 py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
      <div className="absolute left-5 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-full border border-white/10 bg-ink px-3 py-1.5 text-[17px] font-medium text-white/60 md:flex">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-lime" />
          <span className="relative size-1.5 rounded-full bg-lime" />
        </span>
        Live
      </div>
      <VelocityMarquee baseVelocity={-1.4}>
        {ticks.map((t) => (
          <TickerItem key={t.s} t={t} />
        ))}
      </VelocityMarquee>
    </section>
  );
}
