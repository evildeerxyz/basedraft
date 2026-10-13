"use client";

import { ArrowCounterClockwiseIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, LayoutGroup, animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Mark } from "@/components/site/logo";
import { Select } from "@/components/site/select";
import { Band, Button, Face, SectionHead, Segmented, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { MONTHS, METRICS, noteOf, seriesOf, type Metric } from "@/lib/insights";
import { TEAMS, personOf, type Person, type TeamId } from "@/lib/people";
import { AFTER, BEFORE, DAYS, FROM, TO, hours, type Kind } from "@/lib/week";

/*
 * The rest of what pello does, as four cards with the product in them: a new starter's list that
 * works itself through, a week before and after pello, a year of the company by team, and one
 * personnel file seen by different people.
 */

function Card({ title, body, className, children }: { title: string; body: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("pl-card flex flex-col overflow-hidden rounded-[16px]", className)}>
      <div className="p-6 pb-0 sm:p-7 sm:pb-0">
        <h3 className="font-display text-[22px] font-semibold tracking-[-0.015em] text-ink">{title}</h3>
        <p className="mt-2 max-w-[460px] text-[16px] leading-[1.55] text-mute">{body}</p>
      </div>
      <div className="mt-6 flex-1 px-6 pb-6 sm:px-7 sm:pb-7">{children}</div>
    </div>
  );
}

/* ---------- a new starter ---------- */

const LEO = personOf("leo");
const TASKS: Array<{ text: string; by: "pello" | Person; at: string }> = [
  { text: "Contract signed", by: LEO, at: "Oct 19" },
  { text: "Payroll and pension set up", by: "pello", at: "Oct 19" },
  { text: "Laptop shipped to his flat", by: "pello", at: "Oct 26" },
  { text: "Accounts for Google, Slack and GitHub", by: "pello", at: "Oct 26" },
  { text: "Clara picked as his buddy", by: personOf("oliver"), at: "Oct 27" },
  { text: "First week in his calendar", by: "pello", at: "Oct 30" },
];

function Onboarding() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.4, once: true });
  const [done, setDone] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!seen || done >= TASKS.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), done === 0 ? 400 : 420);
    return () => clearTimeout(t);
  }, [seen, done, run]);
  return (
    <Window className="h-full">
      <div ref={ref} className="flex items-center gap-3 p-4 shadow-[0_1px_0_var(--pl-line)]">
        <Face person={LEO} size={40} hot={done >= TASKS.length} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">{LEO.name}</p>
          <p className="text-[15px] text-mute">Starts Monday, November 2</p>
        </div>
        <Button
          kind="light"
          size="sm"
          onClick={() => {
            setDone(0);
            setRun((r) => r + 1);
          }}
        >
          <ArrowCounterClockwiseIcon size={14} />
          Again
        </Button>
      </div>
      <ul className="p-2">
        {TASKS.map((t, i) => {
          const on = i < done;
          return (
            <li key={t.text} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2">
              <motion.span initial={false} animate={on ? { scale: [0.6, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.3 }} className={cn("grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-300", on ? "bg-ink text-surface" : "shadow-[inset_0_0_0_1.5px_var(--pl-line-strong)]")}>
                {on && <CheckIcon size={11} weight="bold" />}
              </motion.span>
              <span className={cn("min-w-0 flex-1 truncate text-[15px] transition-colors", on ? "text-ink" : "text-mute")}>{t.text}</span>
              {t.by === "pello" ? (
                <span className="grid size-6 place-items-center rounded-full bg-sunken">
                  <Mark size={14} />
                </span>
              ) : (
                <Face person={t.by} size={24} />
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3 px-4 pb-4">
        <div className="grid flex-1 grid-cols-6 gap-1">
          {TASKS.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-colors duration-300", i < done ? "bg-ink" : "bg-sunken")} />
          ))}
        </div>
        <span className="tabular font-mono text-[15px] text-mute">
          {done}/{TASKS.length}
        </span>
      </div>
    </Window>
  );
}

/* ---------- a week ---------- */

const BLOCK: Record<Kind, string> = {
  admin: "bg-sunken text-mute",
  people: "bg-accent-soft text-ink shadow-[inset_2px_0_0_var(--pl-accent)]",
  fixed: "bg-surface text-ink shadow-[0_0_0_1px_var(--pl-line-strong)]",
  pello: "bg-ink text-surface",
};
const HOUR = 30;

function Hours({ value }: { value: number }) {
  const v = useMotionValue(value);
  const text = useTransform(v, (n) => `${Math.round(n)}`);
  useEffect(() => {
    const a = animate(v, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
    return () => a.stop();
  }, [value, v]);
  return <motion.span className="tabular">{text}</motion.span>;
}

function Week() {
  const [when, setWhen] = useState<"before" | "after">("before");
  const blocks = when === "after" ? AFTER : BEFORE;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Hannah's week"
          value={when}
          onChange={setWhen}
          options={[
            { value: "before", label: "Before pello" },
            { value: "after", label: "With pello" },
          ]}
        />
        <p className="text-[15px] text-mute">
          Admin <span className="font-mono font-medium text-ink"><Hours value={hours(blocks, ["admin", "pello"])} />h</span> · People <span className="font-mono font-medium text-accent"><Hours value={hours(blocks, ["people"])} />h</span>
        </p>
      </div>
      <Window className="mt-4 overflow-x-auto">
        <div className="grid min-w-[480px] grid-cols-5 gap-1 p-2">
          {DAYS.map((d, day) => (
            <div key={d}>
              <p className="pb-1.5 text-center text-[15px] font-medium text-mute">{d}</p>
              <div className="relative rounded-[8px] bg-page/60" style={{ height: (TO - FROM) * HOUR }}>
                <LayoutGroup id={`week-${day}`}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {blocks
                      .filter((x) => x.day === day)
                      .map((x, i) => (
                        <motion.div
                          key={x.id}
                          layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1, transition: { delay: 0.08 + i * 0.04, type: "spring", stiffness: 380, damping: 30 } }}
                          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
                          transition={{ type: "spring", stiffness: 300, damping: 32 }}
                          title={x.text}
                          className={cn("absolute inset-x-0.5 overflow-hidden rounded-[6px] px-1.5 text-[15px] font-medium leading-[28px]", BLOCK[x.kind])}
                          style={{ top: (x.start - FROM) * HOUR + 1, height: x.len * HOUR - 2 }}
                        >
                          {x.len >= 1 && <span className="block truncate">{x.text}</span>}
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </LayoutGroup>
              </div>
            </div>
          ))}
        </div>
      </Window>
    </div>
  );
}

/* ---------- a year of the company ---------- */

const W = 520;
const H = 190;

function Insights() {
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Measure" value={metric} onChange={setMetric} options={METRICS.map((m) => ({ value: m.id, label: m.label }))} />
        <Select label="Team" value={team} onChange={(v) => setTeam(v as TeamId | "all")} options={[{ value: "all", label: "All teams" }, ...TEAMS.map((t) => ({ value: t.id, label: t.name }))]} className="w-[170px]" />
      </div>
      <Window className="mt-4 p-4">
        <p className="flex items-baseline gap-2">
          <span className="tabular font-display text-[34px] font-semibold tracking-[-0.02em] text-ink">{s[shown].toLocaleString("en-US")}</span>
          <span className="text-[15px] text-mute">
            {unit} in {MONTHS[shown]}
          </span>
        </p>
        <div
          ref={box}
          className="mt-2"
          onPointerMove={(e) => {
            const r = box.current!.getBoundingClientRect();
            setAt(Math.max(0, Math.min(11, Math.round(((e.clientX - r.left) / r.width) * 11))));
          }}
          onPointerLeave={() => setAt(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={`${unit} by month`}>
            <defs>
              {/* The area under the line, printed as a dither of vermilion. */}
              <pattern id="features-fill" width="3" height="3" patternUnits="userSpaceOnUse">
                <rect width="1.5" height="1.5" fill="var(--pl-accent)" opacity="0.55" />
              </pattern>
            </defs>
            {[0.33, 0.66, 1].map((k) => (
              <line key={k} x1={0} x2={W} y1={H - (H - 12) * k} y2={H - (H - 12) * k} stroke="var(--pl-line)" />
            ))}
            <motion.path initial={false} animate={{ d: area }} transition={{ type: "spring", stiffness: 120, damping: 20 }} fill="url(#features-fill)" />
            <motion.path initial={false} animate={{ d: line }} transition={{ type: "spring", stiffness: 120, damping: 20 }} fill="none" stroke="var(--pl-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <line x1={x(shown)} x2={x(shown)} y1={0} y2={H} stroke="var(--pl-line-strong)" strokeDasharray="3 4" />
            <motion.circle initial={false} animate={{ cx: x(shown), cy: y(s[shown]) }} transition={{ type: "spring", stiffness: 500, damping: 36 }} r="5.5" fill="var(--pl-surface)" stroke="var(--pl-accent)" strokeWidth="2.5" />
          </svg>
        </div>
        <motion.p key={`${team}-${metric}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex gap-2.5 rounded-[10px] bg-sunken p-3 text-[15px] leading-[1.5] text-ink-2">
          <Mark size={18} className="mt-0.5" />
          {noteOf(team, metric, s)}
        </motion.p>
      </Window>
    </div>
  );
}

/* ---------- one personnel file ---------- */

type Viewer = "grace" | "lucas" | "marco" | "hannah";
const VIEWERS: Array<{ value: Viewer; label: string }> = [
  { value: "grace", label: "Grace" },
  { value: "lucas", label: "Teammate" },
  { value: "marco", label: "Manager" },
  { value: "hannah", label: "People" },
];
const ALL: Viewer[] = ["grace", "lucas", "marco", "hannah"];
const FIELDS: Array<{ label: string; value: string; who: Viewer[]; partial?: { who: Viewer[]; value: string } }> = [
  { label: "Role", value: "Account Executive, Sales", who: ALL },
  { label: "Manager", value: "Marco Ricci", who: ALL },
  { label: "Salary", value: "£62,000 a year", who: ["grace", "hannah"], partial: { who: ["marco"], value: "Band S3" } },
  { label: "Bank account", value: "Ending 4417", who: ["grace"] },
  { label: "Sick days this year", value: "3 days", who: ["grace", "hannah"] },
  { label: "Manager's notes", value: "Ready for bigger accounts.", who: ["marco", "hannah"] },
];
const ANSWER: Record<Viewer, string> = {
  grace: "Your salary is £62,000 a year. Your next review is in March.",
  lucas: "That's private to Grace, her manager and People, so I can't share it.",
  marco: "Grace is in band S3. For the exact figure, ask Hannah in People.",
  hannah: "£62,000 a year, unchanged since her review in March.",
};
const GRACE = personOf("grace");

export function FileAs({ className }: { className?: string }) {
  const [viewer, setViewer] = useState<Viewer>("lucas");
  return (
    <div className={className}>
      <Segmented label="See the file as" value={viewer} onChange={setViewer} options={VIEWERS} />
      <Window className="mt-4">
        <div className="flex items-center gap-3 p-4 shadow-[0_1px_0_var(--pl-line)]">
          <Face person={GRACE} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">{GRACE.name}</p>
            <p className="text-[15px] text-mute">Personnel file</p>
          </div>
          <span className="rounded-[7px] bg-accent-soft px-2 py-1 text-[15px] font-medium text-accent">Confidential</span>
        </div>
        <dl className="px-4 py-1">
          {FIELDS.map((f) => {
            const full = f.who.includes(viewer);
            const part = !full && f.partial?.who.includes(viewer);
            const text = full ? f.value : part ? f.partial!.value : "";
            return (
              <div key={f.label} className="flex min-h-[44px] items-center justify-between gap-4 shadow-[0_1px_0_var(--pl-line)] last:shadow-none">
                <dt className="text-[15px] text-mute">{f.label}</dt>
                <dd className="flex min-w-0 justify-end text-right text-[15px] font-medium text-ink">
                  <AnimatePresence mode="wait" initial={false}>
                    {text ? (
                      <motion.span key={`v-${text}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="truncate">
                        {text}
                      </motion.span>
                    ) : (
                      <motion.span key="hidden" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} style={{ originX: 1, width: `${Math.min(200, 36 + f.value.length * 7)}px` }} className="block h-5 rounded-[5px] bg-ink">
                        <span className="sr-only">Hidden</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </dd>
              </div>
            );
          })}
        </dl>
        <div className="m-2 rounded-[10px] bg-sunken p-3">
          <p className="text-[15px] text-mute">{viewer === "grace" ? "Grace asks: what do I earn?" : `${VIEWERS.find((v) => v.value === viewer)!.label} asks: what does Grace earn?`}</p>
          <AnimatePresence mode="wait">
            <motion.p key={viewer} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className={cn("mt-1 text-[15px] leading-[1.5]", viewer === "lucas" ? "text-accent" : "text-ink")}>
              {ANSWER[viewer]}
            </motion.p>
          </AnimatePresence>
        </div>
      </Window>
    </div>
  );
}

export function Features() {
  return (
    <Band rule id="features" inner="py-20 lg:py-28">
      <SectionHead title="Everything else, handled too" lead="New starters, a calmer week for the People team, a read on how the company is doing, and files only the right people can open." />
      <div className="mt-14 grid gap-3 lg:grid-cols-2">
        <Card title="Ready on day one" body="pello works through a new starter's list in the weeks before, and leaves the parts that need a person to that person.">
          <Onboarding />
        </Card>
        <Card title="A week back for Hannah" body="Hannah runs People at Fieldwork. Switch between her week before pello and with it.">
          <Week />
        </Card>
        <Card title="Know before the survey does" body="Headcount, time off and overtime by team, every morning, with a note on what changed and who should know.">
          <Insights />
        </Card>
        <Card title="Everyone sees what they should" body="Salaries, health and reviews open only to the people who need them. pello's answers follow the same rules.">
          <FileAs />
        </Card>
      </div>
    </Band>
  );
}
