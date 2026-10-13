"use client";

import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Mark } from "@/components/site/logo";
import { Select } from "@/components/site/select";
import { Container, SectionHead } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { TEAMS, firstName, leadOf, type TeamId } from "@/lib/people";

/*
 * A year of Fieldwork, by team: headcount, time off taken and overtime. Pick a team and a measure
 * and the chart moves to it; point at a month for its number. The note beside it is worked out
 * from the same numbers, the way pello writes them each morning.
 */

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
type Metric = "headcount" | "timeoff" | "overtime";
const METRICS: Array<{ id: Metric; label: string; unit: string }> = [
  { id: "headcount", label: "Headcount", unit: "people" },
  { id: "timeoff", label: "Time off", unit: "days" },
  { id: "overtime", label: "Overtime", unit: "hours" },
];

// Start and end of the year for each team; the months between are filled in smoothly.
const HEAD: Record<TeamId, [number, number]> = { people: [8, 10], engineering: [70, 84], design: [20, 24], sales: [44, 48], support: [33, 36], finance: [11, 12] };
// Time off by month, as a share of the year's average: December and summer are high.
const SEASON = [0.8, 1.7, 0.7, 0.8, 0.9, 1.1, 1.0, 1.2, 1.6, 1.7, 0.9, 0.8];
// Overtime per person per month, and how it moves: engineering's has climbed since July.
const OVER: Record<TeamId, number[]> = {
  people: [1.1, 1.4, 1, 1, 1.2, 1, 0.9, 1, 0.8, 0.7, 1.2, 1.1],
  engineering: [1.6, 1.2, 1.4, 1.5, 1.4, 1.6, 1.5, 1.7, 1.8, 2.1, 2.5, 2.9],
  design: [1, 0.8, 1, 1.1, 1, 1.2, 1.1, 1, 0.9, 0.8, 1, 1.1],
  sales: [1.5, 2.2, 0.9, 1.1, 1.6, 1.2, 1.3, 1.6, 1, 0.9, 1.4, 1.8],
  support: [1.4, 2.4, 1.6, 1.2, 1.1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.2, 1.1],
  finance: [1.2, 2.6, 2.2, 1, 1.1, 1.8, 1, 1, 1.1, 1, 1.2, 1.4],
};

function headcount(t: TeamId) {
  const [a, z] = HEAD[t];
  return MONTHS.map((_, i) => Math.round(a + (z - a) * (i / 11) ** 0.9));
}
function seriesOf(team: TeamId | "all", metric: Metric): number[] {
  const teams = team === "all" ? TEAMS.map((t) => t.id) : [team];
  return MONTHS.map((_, i) =>
    teams.reduce((sum, t) => {
      const h = headcount(t)[i];
      if (metric === "headcount") return sum + h;
      if (metric === "timeoff") return sum + Math.round(h * 2.1 * SEASON[i]);
      return sum + Math.round(h * OVER[t][i] * 1.4);
    }, 0),
  );
}

function noteOf(team: TeamId | "all", metric: Metric, s: number[]) {
  const name = team === "all" ? "Fieldwork" : TEAMS.find((t) => t.id === team)!.name;
  const last = s[11];
  if (metric === "headcount") return `${name} went from ${s[0]} to ${last} people in twelve months. ${team === "engineering" ? "Two more engineers start in November, and both have a laptop on the way." : "Nobody left in October, and the open roles are on track for January."}`;
  if (metric === "timeoff") {
    const prior = Math.round((s[7] + s[8] + s[9]) / 3);
    const quiet = team === "all" ? 11 : Math.max(1, Math.round(s[11] / 40));
    return `${name} took ${last} days off in October, against ${prior} a month over the summer. ${quiet} ${quiet === 1 ? "person hasn't" : "people haven't"} taken a day since June, and their managers have a reminder.`;
  }
  const change = Math.round(((last - s[8]) / s[8]) * 100);
  const lead = team === "all" ? "Hannah" : firstName(leadOf(team).name);
  return change > 15
    ? `Overtime in ${name} is up ${change}% since July. ${team === "all" ? "Most of it is in Engineering." : "Three people are above 48 hours this month."} ${lead} has the details.`
    : `Overtime in ${name} is ${change >= 0 ? `up ${change}%` : `down ${-change}%`} since July, which is about normal for the time of year. Nothing needs a look.`;
}

const W = 720;
const H = 300;
const PAD = 14;

export function Insights() {
  const [team, setTeam] = useState<TeamId | "all">("engineering");
  const [metric, setMetric] = useState<Metric>("overtime");
  const [at, setAt] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const s = useMemo(() => seriesOf(team, metric), [team, metric]);
  const top = Math.max(...s) * 1.18;
  const x = (i: number) => PAD + (i / 11) * (W - PAD * 2);
  const y = (v: number) => H - (v / top) * (H - 20);
  const line = s.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(11).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const unit = METRICS.find((m) => m.id === metric)!.unit;
  const shown = at ?? 11;

  return (
    <section id="insights" className="scroll-mt-20 py-28 lg:py-36">
      <Container>
        <SectionHead title="See how the company is doing before the survey tells you." lead="Headcount, time off and overtime by team, updated every morning. pello writes down what changed and who should know." />

        <div className="mt-14 overflow-hidden rounded-[28px] border border-line bg-surface">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between lg:px-7 lg:pt-6">
            <div role="tablist" aria-label="Measure" className="flex rounded-[16px] bg-page p-1 shadow-[inset_0_0_0_1px_var(--pl-line)]">
              {METRICS.map((m) => (
                <button key={m.id} type="button" role="tab" aria-selected={metric === m.id} onClick={() => setMetric(m.id)} className={cn("relative h-11 flex-1 rounded-[12px] px-4 text-[16px] font-medium transition-colors sm:flex-none", metric === m.id ? "text-ink" : "text-ink-2 hover:text-ink")}>
                  {metric === m.id && <motion.span layoutId="metric-pill" className="absolute inset-0 rounded-[12px] bg-surface shadow-[0_1px_3px_rgb(12_14_20/0.12),inset_0_0_0_1px_var(--pl-line)]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                  <span className="relative">{m.label}</span>
                </button>
              ))}
            </div>
            <Select label="Team" value={team} onChange={(v) => setTeam(v as TeamId | "all")} options={[{ value: "all", label: "All teams" }, ...TEAMS.map((t) => ({ value: t.id, label: t.name }))]} className="sm:w-[220px]" />
          </div>

          <div className="grid lg:grid-cols-[1fr_340px]">
            <div className="p-5 pt-2 lg:p-7 lg:pt-3">
              <div className="flex items-baseline gap-3">
                <p className="tabular text-[56px] font-semibold leading-none tracking-[-0.05em] text-ink">{s[shown].toLocaleString("en-US")}</p>
                <p className="text-[17px] text-mute">
                  {unit} in {MONTHS[shown]}
                </p>
              </div>
              <div
                ref={box}
                className="relative mt-6"
                onPointerMove={(e) => {
                  const r = box.current!.getBoundingClientRect();
                  setAt(Math.max(0, Math.min(11, Math.round(((e.clientX - r.left) / r.width) * 11))));
                }}
                onPointerLeave={() => setAt(null)}
              >
                <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" aria-label={`${unit} by month`} role="img">
                  <defs>
                    <linearGradient id="insights-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="var(--pl-accent)" stopOpacity="0.2" />
                      <stop offset="1" stopColor="var(--pl-accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75, 1].map((k) => (
                    <line key={k} x1={0} x2={W} y1={H - (H - 20) * k} y2={H - (H - 20) * k} stroke="var(--pl-line)" strokeDasharray="3 6" />
                  ))}
                  <motion.path initial={false} animate={{ d: area }} transition={{ type: "spring", stiffness: 120, damping: 20 }} fill="url(#insights-fill)" />
                  <motion.path initial={false} animate={{ d: line }} transition={{ type: "spring", stiffness: 120, damping: 20 }} fill="none" stroke="var(--pl-accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                  <line x1={x(shown)} x2={x(shown)} y1={0} y2={H} stroke="var(--pl-line-strong)" strokeDasharray="2 4" />
                  <motion.circle initial={false} animate={{ cx: x(shown), cy: y(s[shown]) }} transition={{ type: "spring", stiffness: 500, damping: 36 }} r="7" fill="var(--pl-surface)" stroke="var(--pl-accent)" strokeWidth="3" />
                </svg>
                <div className="relative mt-3 h-6">
                  {MONTHS.map((m, i) => (
                    <span key={m} className={cn("absolute -translate-x-1/2 text-[15px] transition-colors", i === shown ? "font-medium text-ink" : "text-mute", i % 2 === 1 && "max-sm:invisible")} style={{ left: `${(x(i) / W) * 100}%` }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 bg-page p-6 shadow-[inset_0_1px_0_var(--pl-line)] lg:p-7 lg:shadow-[inset_1px_0_0_var(--pl-line)]">
              <div>
                <p className="flex items-center gap-2.5 text-[16px] font-semibold text-ink">
                  <Mark size={22} />
                  What pello noticed
                </p>
                <motion.p key={`${team}-${metric}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-4 text-[19px] leading-[1.5] tracking-[-0.01em] text-ink">
                  {noteOf(team, metric, s)}
                </motion.p>
              </div>
              <p className="text-[15px] text-mute">Updated today at 07:00 from payroll, time off and calendars.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
