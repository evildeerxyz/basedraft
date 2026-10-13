"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Mark } from "@/components/site/logo";
import { Select } from "@/components/site/select";
import { Band, SectionHead, Segmented, Window } from "@/components/site/ui";
import { MONTHS, METRICS, noteOf, seriesOf, type Metric } from "@/lib/insights";
import { TEAMS, type TeamId } from "@/lib/people";

/*
 * The note pello writes every morning: a year of the company by team, as a line you can run your
 * pointer along, and what pello thinks is worth knowing about it.
 */

const W = 640;
const H = 220;

export function Insights() {
  const [team, setTeam] = useState<TeamId | "all">("engineering");
  const [metric, setMetric] = useState<Metric>("overtime");
  const [at, setAt] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const s = useMemo(() => seriesOf(team, metric), [team, metric]);
  const top = Math.max(...s) * 1.15;
  const x = (i: number) => 8 + (i / 11) * (W - 16);
  const y = (v: number) => H - (v / top) * (H - 12);
  const line = s.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(11).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const shown = at ?? 11;
  const unit = METRICS.find((m) => m.id === metric)!.unit;

  return (
    <Band id="insights" inner="py-24 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionHead title="A note every morning on how the company is doing." lead="Headcount, time off and overtime by team, with a line on what changed and who should know. Run your pointer along the year." />

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Segmented label="Measure" value={metric} onChange={setMetric} options={METRICS.map((m) => ({ value: m.id, label: m.label }))} />
            <Select label="Team" value={team} onChange={(v) => setTeam(v as TeamId | "all")} options={[{ value: "all", label: "All teams" }, ...TEAMS.map((t) => ({ value: t.id, label: t.name }))]} className="w-[180px]" />
          </div>
          <Window className="mt-4 p-5">
            <p className="flex items-baseline gap-2">
              <span className="tabular font-mono text-[44px] font-medium leading-none tracking-[-0.05em] text-ink">{s[shown].toLocaleString("en-US")}</span>
              <span className="text-[15px] text-mute">
                {unit} in {MONTHS[shown]}
              </span>
            </p>
            <div
              ref={box}
              className="mt-4"
              onPointerMove={(e) => {
                const r = box.current!.getBoundingClientRect();
                setAt(Math.max(0, Math.min(11, Math.round(((e.clientX - r.left) / r.width) * 11))));
              }}
              onPointerLeave={() => setAt(null)}
            >
              <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={`${unit} by month`}>
                <defs>
                  {/* The area under the line, printed as a dither of vermilion. */}
                  <pattern id="insights-fill" width="3" height="3" patternUnits="userSpaceOnUse">
                    <rect width="1.5" height="1.5" fill="var(--pl-accent)" opacity="0.55" />
                  </pattern>
                </defs>
                {[0.33, 0.66, 1].map((k) => (
                  <line key={k} x1={0} x2={W} y1={H - (H - 12) * k} y2={H - (H - 12) * k} stroke="var(--pl-line)" />
                ))}
                <motion.path initial={false} animate={{ d: area }} transition={{ type: "spring", stiffness: 120, damping: 20 }} fill="url(#insights-fill)" />
                <motion.path initial={false} animate={{ d: line }} transition={{ type: "spring", stiffness: 120, damping: 20 }} fill="none" stroke="var(--pl-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <line x1={x(shown)} x2={x(shown)} y1={0} y2={H} stroke="var(--pl-line-strong)" strokeDasharray="3 4" />
                <motion.circle initial={false} animate={{ cx: x(shown), cy: y(s[shown]) }} transition={{ type: "spring", stiffness: 500, damping: 36 }} r="5.5" fill="var(--pl-page)" stroke="var(--pl-accent)" strokeWidth="2.5" />
              </svg>
              <div aria-hidden className="mt-2 flex justify-between font-mono text-[15px] text-mute">
                {MONTHS.map((m, i) => (
                  <span key={m} className={i % 2 ? "max-sm:hidden" : ""}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <motion.p key={`${team}-${metric}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex gap-3 border-t border-line pt-4 text-[16px] leading-[1.5] text-ink-2">
              <Mark size={22} className="mt-0.5" />
              {noteOf(team, metric, s)}
            </motion.p>
          </Window>
        </div>
      </div>
    </Band>
  );
}
