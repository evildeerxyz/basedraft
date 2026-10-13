"use client";

import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useState, type PointerEvent } from "react";
import { pal } from "@/lib/palette";
import { cn, EASE_IN_OUT, EASE_OUT, formatUSD, mulberry32 } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { useIntroDone } from "../Intro";
import { DitherReveal } from "../ui/DitherReveal";
import { MagneticButton } from "../ui/MagneticButton";
import { RollingNumber } from "../ui/RollingNumber";

/* ---------- data: five years of one member's portfolio ---------- */

const N = 120;
const DAY = 86_400_000;
const START = Date.UTC(2021, 5, 1);
const STEP_DAYS = 16;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const VALUES = (() => {
  // Biweekly steps with $170 deposits: the 2022 bear market, a 2023 wobble and the 2025 selloff.
  const rand = mulberry32(41);
  const raw: number[] = [];
  let v = 20000;
  for (let i = 0; i < N; i++) {
    let drift = 0.0052;
    if (i >= 14 && i < 28) drift = -0.023;
    if (i >= 58 && i < 63) drift = -0.012;
    if (i >= 95 && i < 101) drift = -0.026;
    v = v * (1 + drift + (rand() - 0.5) * 0.028) + 170;
    raw.push(v);
  }
  const k = 48213.07 / raw[N - 1];
  return raw.map((x) => x * k);
})();
const MIN = Math.min(...VALUES);
const MAX = Math.max(...VALUES);
const HEIGHTS = VALUES.map((v) => 0.05 + ((v - MIN) / (MAX - MIN)) * 0.66);

const dateAt = (i: number) => {
  const d = new Date(START + i * STEP_DAYS * DAY);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const YEARS = [2022, 2023, 2024, 2025, 2026].map((y) => ({
  y,
  x: (Date.UTC(y, 0, 1) - START) / (STEP_DAYS * DAY) / (N - 1),
}));

const LINE = HEIGHTS.map((h, i) => `${i ? "L" : "M"}${((i / (N - 1)) * 1000).toFixed(1)},${((1 - h) * 1000).toFixed(1)}`).join(" ");

const NOTES = [
  { i: 24, title: "Bought the dip", body: "+$1,200 into VTI at −21%" },
  { i: 47, title: "Harvested a loss", body: "Sold ARKK · saved $96 in tax" },
  { i: 64, title: "Rebalanced", body: "Drift 4.2% → 0.3%" },
  { i: 99, title: "Held steady", body: "Paused buys through the selloff" },
];

const FACTS = [
  { k: "Pricing", v: "Flat $6/mo. Never a % of your money" },
  { k: "Taxes", v: "Loss harvesting, checked daily" },
  { k: "Protection", v: "SIPC-covered up to $500,000" },
  { k: "Rated", v: "4.9 on the App Store · 52K reviews" },
];

/* ---------- chart ---------- */

function HeroChart({ play }: { play: boolean }) {
  const reveal = useMotionValue(0);
  const [reached, setReached] = useState(-1);
  const [scrub, setScrub] = useState<number | null>(null);
  const [live, setLive] = useState(VALUES[N - 1]);

  useEffect(() => {
    if (!play) return;
    const a = animate(reveal, 1, { duration: 2.8, ease: EASE_IN_OUT, delay: 0.35 });
    return () => a.stop();
  }, [play, reveal]);

  useMotionValueEvent(reveal, "change", (v) => {
    const idx = Math.floor(v * (N - 1));
    if (idx !== reached) setReached(idx);
  });

  useEffect(() => {
    const id = setInterval(() => setLive((b) => b * (1 + (Math.random() - 0.45) * 0.0009)), 2400);
    return () => clearInterval(id);
  }, []);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reached < N - 1) return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (N - 1));
    setScrub(Math.max(0, Math.min(N - 1, i)));
  };

  const idx = scrub ?? N - 1;
  const value = scrub === null ? live : VALUES[idx];
  const gain = value - VALUES[0];
  const pct = (gain / VALUES[0]) * 100;
  const done = reached >= N - 1;

  return (
    <div className="relative flex-1">
      {/* readout */}
      <div className="relative z-20 mx-auto max-w-[1280px] px-5 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={play ? { opacity: 1 } : undefined} transition={{ delay: 0.4, duration: 0.6 }}>
          <div className="flex items-center gap-2 text-[17px] font-medium text-white/60">
            <span className={cn("size-1.5", scrub === null ? "animate-pulse bg-lime" : "bg-white/50")} />
            {scrub === null ? "Maya’s portfolio · live" : dateAt(idx)}
          </div>
          <div className="mt-2 text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-none tracking-[-0.04em]">
            <RollingNumber value={formatUSD(value)} />
          </div>
          <div className="mt-2 text-[15px] tabular-nums text-accent">
            +{formatUSD(gain)} ({pct.toFixed(1)}%) <span className="text-white/60">since {dateAt(0)}</span>
          </div>
        </motion.div>
      </div>

      {/* plot: full bleed, edge to edge */}
      <div
        className="absolute inset-x-0 bottom-8 top-6 cursor-crosshair touch-none"
        onPointerMove={onMove}
        onPointerLeave={() => setScrub(null)}
      >
        <DitherShader shape="chart" data={HEIGHTS} reveal={reveal} color={pal.dither} opacity={0.95} secondColor={pal.dither} secondOpacity={0.45} pixelSize={3} interactive={done} />
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          role="img"
          aria-label="Maya's portfolio from June 2021 to today, growing from about $24,800 to $48,200 through the 2022 and 2025 selloffs"
        >
          <motion.path
            d={LINE}
            fill="none"
            stroke={pal.soft}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            style={{ pathLength: reveal }}
          />
        </svg>

        {/* AI decisions pinned to the line */}
        {NOTES.map((n, k) => {
          const shown = reached >= n.i;
          const x = (n.i / (N - 1)) * 100;
          const top = (1 - HEIGHTS[n.i]) * 100;
          const flip = x > 70;
          return (
            <div key={n.i} className="pointer-events-none absolute" style={{ left: `${x.toFixed(2)}%`, top: `${top.toFixed(2)}%` }}>
              <motion.span
                className="absolute -left-[5px] -top-[5px] block size-[10px] border-2 border-ink bg-lime"
                initial={{ scale: 0 }}
                animate={{ scale: shown ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              />
              <motion.span
                className="absolute bottom-[8px] left-0 block w-px origin-bottom bg-white/30"
                style={{ height: 34 + (k % 2) * 30 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: shown ? 1 : 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              />
              <motion.div
                className={cn("absolute hidden w-max sm:block", flip ? "right-[-1px] text-right" : "left-[-1px]")}
                style={{ bottom: 42 + (k % 2) * 30 }}
                initial={{ opacity: 0, y: 6 }}
                animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
              >
                <div className="bg-ink/85 px-2.5 py-1">
                  <div className="text-[17px] font-medium text-white/60">
                    {dateAt(n.i)} · Autopilot
                  </div>
                  <div className="mt-0.5 text-[15px] font-medium text-white">{n.title}</div>
                  <div className="text-[15px] text-white/60">{n.body}</div>
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* live tip */}
        <div className="pointer-events-none absolute" style={{ left: "calc(100% - 7px)", top: `${((1 - HEIGHTS[N - 1]) * 100).toFixed(2)}%` }}>
          <motion.span
            className="absolute -left-[6px] -top-[6px] block size-3 rounded-full bg-lime"
            initial={{ scale: 0 }}
            animate={{ scale: done ? 1 : 0 }}
          />
          {done && (
            <motion.span
              className="absolute -left-[6px] -top-[6px] block size-3 rounded-full border border-lime"
              animate={{ scale: [1, 3], opacity: [0.8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </div>

        {/* scrub cursor */}
        {scrub !== null && (
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${((scrub / (N - 1)) * 100).toFixed(2)}%` }}>
            <div className="absolute inset-y-0 w-px bg-white/40" />
            <span
              className="absolute -left-[6px] block size-3 border-2 border-lime bg-ink"
              style={{ top: `calc(${((1 - HEIGHTS[scrub]) * 100).toFixed(2)}% - 6px)` }}
            />
          </div>
        )}
      </div>

      {/* time axis */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8">
        <div className="absolute inset-0">
        {YEARS.map((y) => (
          <span
            key={y.y}
            className="absolute top-2 -translate-x-1/2 text-[15px] tabular-nums text-white/60"
            style={{ left: `${(y.x * 100).toFixed(2)}%` }}
          >
            {y.y}
          </span>
        ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- hero ---------- */

export function Hero() {
  const play = useIntroDone();

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden pt-28 lg:pt-32">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 lg:grid-cols-12 lg:gap-6 lg:px-8">
        <h1 className="text-[clamp(3.1rem,7.6vw,7.4rem)] font-semibold leading-[0.88] tracking-[-0.06em] lg:col-span-8">
          <DitherReveal as="span" className="block" play={play} cell={4} duration={0.7}>
            Money that
          </DitherReveal>
          <DitherReveal as="span" className="block text-white/45" play={play} cell={4} duration={0.7} delay={0.14}>
            manages itself.
          </DitherReveal>
        </h1>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={play ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.35 }}
          className="flex flex-col justify-end lg:col-span-4 lg:pb-2"
        >
          <p className="max-w-[460px] text-[18px] leading-relaxed text-white/65 lg:text-[20px]">
            Zuno is an AI investment manager. It builds your portfolio, rebalances it daily and harvests tax losses, then
            explains every decision in plain English.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <MagneticButton href="/signup" strength={0.25} className="h-14 rounded-[14px] bg-lime px-6 text-[17px] font-medium text-ink">
              Get started
              <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
            </MagneticButton>
            <a href="#app" className="group inline-flex items-center gap-1.5 text-[17px] text-white/70 transition-colors hover:text-white">
              Tour the app
              <ArrowUpRightIcon size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.div>
      </div>

      <div className="relative mt-12 flex min-h-[420px] flex-1 flex-col lg:mt-14">
        <HeroChart play={play} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : undefined}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="relative border-t border-white/[0.08]"
      >
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.k} className="px-5 py-5 lg:px-8">
              <div className="text-[17px] font-medium text-white/60">{f.k}</div>
              <div className="mt-1 text-[16px] text-white/80">{f.v}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
