"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { areaPath, linePath, makeSeries, pointAt } from "@/lib/chart";
import { cn, EASE_OUT, formatUSD } from "@/lib/utils";
import { RollingNumber } from "../ui/RollingNumber";
import { C } from "./ios";

const W = 402;
const PLOT_W = W - 16;
const H = 176;
const N = 48;

const FRAMES = [
  { id: "1D", label: "Today", spread: 0.024, drift: 0.55 },
  { id: "1W", label: "Past week", spread: 0.05, drift: 0.35 },
  { id: "1M", label: "Past month", spread: 0.09, drift: 0.5 },
  { id: "3M", label: "Past 3 months", spread: 0.14, drift: 0.7 },
  { id: "1Y", label: "Past year", spread: 0.24, drift: 0.9 },
  { id: "ALL", label: "All time", spread: 0.62, drift: 1.4 },
] as const;

/** Big live value + scrubbable line chart + timeframe picker, like every brokerage app. */
export function PriceBlock({ label, value, seed, play = true, gradientId }: { label: ReactNode; value: number; seed: number; play?: boolean; gradientId: string }) {
  const [tf, setTf] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const all = useMemo(() => FRAMES.map((f, i) => makeSeries(seed * 7 + i * 13, N, f.drift)), [seed]);
  const series = all[tf];
  const frame = FRAMES[tf];

  const line = useMemo(() => linePath(series, PLOT_W, H, 14), [series]);
  const area = useMemo(() => areaPath(series, PLOT_W, H, 14), [series]);
  const last = pointAt(series, N - 1, PLOT_W, H, 14);
  const baseY = pointAt(series, 0, PLOT_W, H, 14)[1];

  const valueAt = (i: number) => value * (1 + (series[i] - series[N - 1]) * frame.spread);
  const shown = valueAt(scrub ?? N - 1);
  const delta = shown - valueAt(0);
  const pct = (delta / valueAt(0)) * 100;
  const up = delta >= 0;
  const color = up ? C.accent : C.red;
  const scrubPt = scrub !== null ? pointAt(series, scrub, PLOT_W, H, 14) : null;

  const onScrub = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / (r.width * (PLOT_W / W))) * (N - 1));
    setScrub(Math.max(0, Math.min(N - 1, i)));
  };

  return (
    <div>
      <div className="px-[20px]">
        <div className="flex h-[22px] items-center gap-[8px] text-[15px]" style={{ color: C.secondary }}>
          {label}
        </div>
        <div className="mt-[4px] text-[46px] font-semibold leading-none tracking-[-0.04em]">
          <RollingNumber value={formatUSD(shown)} />
        </div>
        <div className="mt-[10px] flex items-center gap-[6px] text-[15px] font-medium">
          <span className="flex items-center gap-[3px] tabular-nums" style={{ color }}>
            <ArrowUpRightIcon size={14} weight="bold" className={cn("transition-transform", !up && "rotate-90")} />
            {formatUSD(Math.abs(delta))} ({Math.abs(pct).toFixed(2)}%)
          </span>
          <span style={{ color: C.secondary }}>{scrub === null ? frame.label : "at this point"}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="mt-[16px] block touch-none overflow-visible"
        role="img"
        aria-label={`Price chart, ${frame.label.toLowerCase()}`}
        onPointerMove={onScrub}
        onPointerLeave={() => setScrub(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.line x1={0} x2={W} initial={false} animate={{ y1: baseY, y2: baseY }} stroke="#fff" strokeOpacity={0.22} strokeDasharray="1.5 5" strokeLinecap="round" />
        <motion.path
          initial={{ d: area, opacity: 0 }}
          animate={{ d: area, opacity: play ? 1 : 0 }}
          transition={{ d: { duration: 0.6, ease: EASE_OUT }, opacity: { duration: 0.8, delay: 0.6 } }}
          fill={`url(#${gradientId})`}
        />
        <motion.path
          initial={{ d: line, pathLength: 0 }}
          animate={{ d: line, pathLength: play ? 1 : 0, stroke: color }}
          transition={{ d: { duration: 0.6, ease: EASE_OUT }, pathLength: { duration: 1.6, ease: EASE_OUT, delay: 0.2 } }}
          fill="none"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {scrubPt ? (
          <g>
            <line x1={scrubPt[0]} x2={scrubPt[0]} y1={0} y2={H} stroke="#fff" strokeOpacity={0.35} />
            <circle cx={scrubPt[0]} cy={scrubPt[1]} r={6} fill="#000" stroke={color} strokeWidth={2.5} />
          </g>
        ) : (
          <motion.g initial={false} animate={{ x: last[0], y: last[1] }} transition={{ duration: 0.6, ease: EASE_OUT }}>
            <motion.circle r={5} fill={color} animate={{ r: [5, 15], opacity: [0.4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
            <circle r={4.5} fill={color} />
          </motion.g>
        )}
      </svg>

      <div className="mt-[10px] flex px-[16px]">
        {FRAMES.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setTf(i)}
            aria-pressed={i === tf}
            className="relative h-[32px] flex-1 rounded-full text-[14px] font-semibold transition-colors"
            style={{ color: i === tf ? (up ? C.onAccent : "#fff") : C.secondary }}
          >
            {i === tf && <motion.span layoutId={`${gradientId}-tf`} className="absolute inset-0 rounded-full" style={{ background: up ? C.accent : C.red }} transition={{ type: "spring", stiffness: 460, damping: 34 }} />}
            <span className="relative">{f.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
