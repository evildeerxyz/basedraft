"use client";

import { CheckIcon, SlackLogoIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";
import { Mark } from "@/components/site/logo";
import { Select } from "@/components/site/select";
import { Face, Moment, Toggle, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { momentOf } from "@/lib/day";
import { PEOPLE, personOf } from "@/lib/people";

/*
 * 09:12. Grace asks for three days off before Christmas, and pello answers in the thread. The
 * rules it checked are beside it, as the settings page that holds them: tighten one and the same
 * request goes to Marco instead; loosen it and pello approves it again.
 */

const GRACE = personOf("grace");
const MARCO = personOf("marco");
const HANNAH = personOf("hannah");
const SALES = PEOPLE.filter((p) => p.team === "sales");
const DAYS = [21, 22, 23, 24];
const ASKED = [22, 23, 24];
/** Who in Sales is already out those days, and how far ahead Grace asked. */
const ALREADY_OUT = ["ben"];
const WEEKS_AHEAD = 6;
const CUSTOMER_CALL = "Renewal call with Halden on December 23";

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
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center sm:gap-4">
      <div>
        <p className="text-[15px] font-medium text-ink">{label}</p>
        {hint && <p className="text-[15px] text-mute">{hint}</p>}
      </div>
      {children}
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
      { text: `${out} of ${SALES.length} in Sales out those days, the limit is ${LIMIT.find((l) => l.value === limit)!.label}`, ok: out <= Number(limit) },
      ...(calendar ? [{ text: CUSTOMER_CALL, ok: false }] : []),
    ];
  }, [notice, limit, calendar]);
  const ok = checks.every((c) => c.ok);
  const decider = signs === "lead" ? MARCO : HANNAH;
  const verdict = ok ? `Approved, Grace. Enjoy the break. ${signs === "lead" ? "Marco" : "Hannah"} has been told.` : `This one needs ${decider.name.split(" ")[0]}. I've sent it with the reason and who could cover.`;

  return (
    <Moment id="time-off" time={momentOf("time-off").at} where="Slack, in #sales" title="Grace asked for three days off before Christmas." lead="pello checked her request against Fieldwork's rules and answered in four seconds. The rules are on the left. Change one and the request is checked again.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* The rules, as the settings page that holds them. */}
        <Window title="Time off rules" aside={<span className="text-[15px] text-mute">All teams</span>} className="flex flex-col">
          <div className="grid gap-5 p-5">
            <Field label="Minimum notice" hint="For more than two days">
              <Select label="Minimum notice" value={notice} onChange={setNotice} options={NOTICE} />
            </Field>
            <Field label="Most out at once" hint="In each team">
              <Select label="Most out at once" value={limit} onChange={setLimit} options={LIMIT} />
            </Field>
            <Field label="When a rule isn't met, ask">
              <Select label="When a rule isn't met, ask" value={signs} onChange={setSigns} options={SIGNS} />
            </Field>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
              <span>
                <span className="block text-[15px] font-medium text-ink">Check calendars for customer calls</span>
                <span className="block text-[15px] text-mute">Sales and Support</span>
              </span>
              <Toggle on={calendar} onChange={setCalendar} label="Check calendars for customer calls" />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-3 border-t border-line bg-surface px-5 py-4">
            <Face person={HANNAH} size={32} />
            <p className="text-[15px] leading-[1.45] text-mute">
              Written by <span className="text-ink">{HANNAH.name}</span> in March. pello has applied them to <span className="tabular font-mono text-ink">2,418</span> requests since.
            </p>
          </div>
        </Window>

        {/* The thread, answered against the rules as they are now. */}
        <Window title="sales" icon={<SlackLogoIcon size={18} className="text-ink" />} aside={<span className="text-[15px] text-mute">Friday</span>}>
          <div className="grid gap-6 p-5">
            <div className="flex gap-3">
              <Face person={GRACE} size={36} square />
              <div className="min-w-0">
                <p className="text-[15px]">
                  <span className="font-semibold text-ink">{GRACE.name}</span> <span className="tabular font-mono text-mute">09:12</span>
                </p>
                <p className="mt-0.5 text-[16px] leading-[1.5] text-ink">Can I take December 22 to 24 off? Back on the 28th.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-sunken">
                <Mark size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">
                  <span className="font-semibold text-ink">pello</span> <span className="tabular font-mono text-mute">09:12</span>
                </p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p key={verdict} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className={cn("mt-0.5 text-[16px] leading-[1.5]", ok ? "text-ink" : "text-accent")}>
                    {verdict}
                  </motion.p>
                </AnimatePresence>

                <ul className="mt-3 grid gap-1.5">
                  <AnimatePresence initial={false}>
                    {checks.map((c) => (
                      <motion.li key={c.text} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="flex items-start gap-2 text-[15px] leading-[1.45]">
                        <motion.span key={String(c.ok)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 22 }} className="mt-0.5 shrink-0">
                          {c.ok ? <CheckIcon size={15} weight="bold" className="text-ink" /> : <XIcon size={15} weight="bold" className="text-accent" />}
                        </motion.span>
                        <span className={c.ok ? "text-ink-2" : "font-medium text-accent"}>{c.text}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                {/* Sales that week, with whoever's out. */}
                <div className="mt-5 rounded-[10px] bg-surface p-3">
                  <div className="grid grid-cols-[minmax(72px,1fr)_repeat(4,minmax(0,36px))] items-center gap-1 sm:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,44px))]">
                    <span className="text-[15px] text-mute">
                      <span className="sm:hidden">Dec</span>
                      <span className="max-sm:hidden">December</span>
                    </span>
                    {DAYS.map((d) => (
                      <span key={d} className="tabular text-center font-mono text-[15px] text-mute">
                        {d}
                      </span>
                    ))}
                    {SALES.map((p) => {
                      const out = (d: number) => (p.id === "grace" ? ok && ASKED.includes(d) : ALREADY_OUT.includes(p.id) && d !== 21);
                      return [
                        <span key={p.id} className="flex min-w-0 items-center gap-2 text-[15px] text-ink">
                          <Face person={p} size={22} />
                          <span className="truncate">{p.name.split(" ")[0]}</span>
                        </span>,
                        ...DAYS.map((d) => (
                          <motion.span key={`${p.id}-${d}-${out(d)}`} initial={{ scaleX: 0.3, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.3 }} className={cn("h-6 rounded-[4px]", out(d) ? (p.id === "grace" ? "bg-accent" : "bg-ink-2") : p.id === "grace" && ASKED.includes(d) ? "shadow-[inset_0_0_0_1.5px_var(--pl-accent)]" : "bg-page")} />
                        )),
                      ];
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Window>
      </div>
    </Moment>
  );
}
