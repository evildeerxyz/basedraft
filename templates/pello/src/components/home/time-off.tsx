"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";
import { Mark } from "@/components/site/logo";
import { Select } from "@/components/site/select";
import { Band, Face, SectionHead, Tag, Toggle, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { PEOPLE, personOf } from "@/lib/people";

/*
 * Time off, decided by rules you can change. The rules are a settings form; beside it, Grace's
 * request is checked against them as they are right now. Tighten one and watch it go to Marco
 * instead; loosen it and pello approves it again.
 */

const GRACE = personOf("grace");
const MARCO = personOf("marco");
const SALES = PEOPLE.filter((p) => p.team === "sales");
const DAYS = [22, 23, 24];
/** Who in Sales is already out those days, and how far ahead Grace asked. */
const ALREADY_OUT = ["ben"];
const WEEKS_AHEAD = 6;
const CUSTOMER_CALL = "Renewal call with Halden, December 23";

const NOTICE = [
  { value: "1", label: "1 week" },
  { value: "2", label: "2 weeks" },
  { value: "4", label: "4 weeks" },
  { value: "8", label: "8 weeks" },
];
const LIMIT = [
  { value: "1", label: "1 person" },
  { value: "2", label: "2 people" },
  { value: "3", label: "3 people" },
];
const SIGNS = [
  { value: "lead", label: "Their team lead" },
  { value: "people", label: "The People team" },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[15px] font-medium text-ink">{label}</p>
      {hint && <p className="text-[15px] text-mute">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function TimeOff() {
  const [notice, setNotice] = useState("2");
  const [limit, setLimit] = useState("2");
  const [signs, setSigns] = useState("lead");
  const [calendar, setCalendar] = useState(false);

  const checks = useMemo(() => {
    const out = ALREADY_OUT.length + 1;
    return [
      { text: "15 days left, 3 asked for", ok: true },
      { text: `Asked ${WEEKS_AHEAD} weeks ahead, the rule is ${NOTICE.find((n) => n.value === notice)!.label}`, ok: WEEKS_AHEAD >= Number(notice) },
      { text: `${out} of ${SALES.length} in Sales out those days, the limit is ${limit}`, ok: out <= Number(limit) },
      ...(calendar ? [{ text: CUSTOMER_CALL, ok: false }] : []),
    ];
  }, [notice, limit, calendar]);
  const ok = checks.every((c) => c.ok);
  const who = signs === "lead" ? MARCO.name : "the People team";
  const verdict = ok ? `Approved by pello. ${signs === "lead" ? "Marco" : "Hannah"} has been told.` : `Sent to ${who} to decide, with the reason and who could cover.`;

  return (
    <Band rule id="time-off" inner="py-20 lg:py-28">
      <SectionHead align="left" title="Time off, approved before the kettle boils" lead="Write the rules once. pello checks every request against them and only asks a person when one doesn't fit. Change a rule here and watch Grace's request." />

      <div className="pl-card mt-14 grid gap-3 rounded-[16px] p-3 sm:p-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* The rules, as the settings page that holds them. */}
        <div className="relative pt-4">
          <div aria-hidden className="absolute inset-x-8 top-0 h-8 rounded-t-[12px] bg-surface shadow-[0_0_0_1px_var(--pl-line)]" />
          <div aria-hidden className="absolute inset-x-4 top-2 h-8 rounded-t-[12px] bg-surface shadow-[0_0_0_1px_var(--pl-line)]" />
          <Window className="relative h-full">
            <div className="grid gap-5 p-5 sm:p-6">
              <p className="font-display text-[22px] font-semibold tracking-[-0.015em] text-ink">Time off rules</p>
              <Field label="Minimum notice" hint="For anything longer than two days">
                <Select label="Minimum notice" value={notice} onChange={setNotice} options={NOTICE} />
              </Field>
              <Field label="Most out at once, per team">
                <Select label="Most out at once, per team" value={limit} onChange={setLimit} options={LIMIT} />
              </Field>
              <Field label="When a rule isn't met, ask">
                <Select label="When a rule isn't met, ask" value={signs} onChange={setSigns} options={SIGNS} />
              </Field>
              <div className="flex items-center justify-between gap-4 rounded-[12px] bg-sunken p-3.5">
                <span>
                  <span className="block text-[15px] font-medium text-ink">Check calendars for customer calls</span>
                  <span className="block text-[15px] text-mute">Sales and Support only</span>
                </span>
                <Toggle on={calendar} onChange={setCalendar} label="Check calendars for customer calls" />
              </div>
            </div>
          </Window>
        </div>

        {/* The request, checked against the rules as they are now. */}
        <Window title="Request No. 4417">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Face person={GRACE} size={44} hot={!ok} />
              <div className="min-w-0">
                <p className="text-[16px] font-semibold text-ink">{GRACE.name}</p>
                <p className="text-[15px] text-mute">
                  {GRACE.role}, asked in Slack at <span className="tabular font-mono">09:12</span>
                </p>
              </div>
            </div>
            <p className="mt-5 font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">&ldquo;Can I take December 22 to 24 off? Back on the 28th.&rdquo;</p>

            <ul className="mt-5 grid gap-2">
              <AnimatePresence initial={false}>
                {checks.map((c) => (
                  <motion.li key={c.text} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 shadow-[0_0_0_1px_var(--pl-line)]">
                    <motion.span key={String(c.ok)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 22 }} className={cn("grid size-5 shrink-0 place-items-center rounded-full", c.ok ? "bg-ink text-surface" : "bg-accent text-accent-ink")}>
                      {c.ok ? <CheckIcon size={11} weight="bold" /> : <XIcon size={11} weight="bold" />}
                    </motion.span>
                    <span className={cn("text-[15px]", c.ok ? "text-ink" : "font-medium text-accent")}>{c.text}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={verdict} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mt-4 flex items-start gap-3 rounded-[12px] bg-sunken p-4">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", ok ? "bg-ink" : "bg-surface shadow-[0_0_0_1px_var(--pl-line)]")}>
                  {ok ? <Mark size={20} className="text-surface" /> : <Face person={signs === "lead" ? MARCO : personOf("hannah")} size={36} />}
                </span>
                <div>
                  <Tag tone={ok ? "done" : "flag"}>{ok ? "Approved" : "Needs a person"}</Tag>
                  <p className="mt-2 text-[15px] leading-[1.5] text-ink-2">{verdict}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Sales that week, with whoever's out. */}
            <div className="mt-5">
              <div className="grid grid-cols-[1fr_repeat(3,52px)] items-center gap-1.5">
                <span className="text-[15px] text-mute">Sales, December</span>
                {DAYS.map((d) => (
                  <span key={d} className="tabular text-center font-mono text-[15px] text-mute">
                    {d}
                  </span>
                ))}
                {SALES.map((p) => {
                  const out = p.id === "grace" ? ok : ALREADY_OUT.includes(p.id);
                  return [
                    <span key={p.id} className="flex items-center gap-2 text-[15px] text-ink">
                      <Face person={p} size={24} />
                      {p.name.split(" ")[0]}
                    </span>,
                    ...DAYS.map((d) => <motion.span key={`${p.id}-${d}-${out}`} initial={{ scaleX: 0.3, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.3 }} className={cn("h-7 rounded-[6px]", out ? (p.id === "grace" ? "bg-accent" : "bg-ink-2") : "bg-sunken")} />),
                  ];
                })}
              </div>
            </div>
          </div>
        </Window>
      </div>
    </Band>
  );
}
