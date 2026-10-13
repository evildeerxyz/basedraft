"use client";

import { CheckIcon, LockSimpleIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Select } from "@/components/site/select";
import { Avatar, Container, SectionHead } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf } from "@/lib/people";

/*
 * One record, seen by five different people. Pick who's looking: what they may see is there, what
 * they may not is locked, and the same rule holds when they ask pello about it. Every look is
 * written to the log.
 */

type Viewer = "grace" | "lucas" | "marco" | "hannah" | "emma";
const VIEWERS: Array<{ id: Viewer; label: string; as: string }> = [
  { id: "grace", label: "Grace, herself", as: "herself" },
  { id: "lucas", label: "Lucas, a teammate", as: "a teammate" },
  { id: "marco", label: "Marco, her manager", as: "her manager" },
  { id: "hannah", label: "Hannah, People", as: "People" },
  { id: "emma", label: "Emma, Payroll", as: "Payroll" },
];

const ALL: Viewer[] = ["grace", "lucas", "marco", "hannah", "emma"];
const FIELDS: Array<{ label: string; value: string; who: Viewer[]; partial?: { who: Viewer[]; value: string } }> = [
  { label: "Role", value: "Account Executive, Sales", who: ALL },
  { label: "Manager", value: "Marco Ricci", who: ALL },
  { label: "Started", value: "March 3, 2024", who: ALL },
  { label: "Salary", value: "£62,000 a year", who: ["grace", "hannah", "emma"], partial: { who: ["marco"], value: "Band S3" } },
  { label: "Bank account", value: "Ending 4417", who: ["grace", "emma"] },
  { label: "Sick days this year", value: "3 days", who: ["grace", "hannah"] },
  { label: "Manager's notes", value: "Ready for bigger accounts next year.", who: ["marco", "hannah"] },
];

const ANSWER: Record<Viewer, string> = {
  grace: "Your salary is £62,000 a year, paid monthly. Your next review is in March.",
  lucas: "That's private to Grace, her manager and the People team, so I can't share it.",
  marco: "Grace is in band S3. For the exact figure, ask Hannah in People.",
  hannah: "£62,000 a year, unchanged since her review in March.",
  emma: "£62,000 a year. October's pay is £5,166.67 before tax.",
};

const GRACE = personOf("grace");
const CHECKS = ["SOC 2 Type II, audited every year", "GDPR, with data kept in the EU or the US", "Single sign-on and SCIM", "Every look at a record is logged"];

export function Security() {
  const [viewer, setViewer] = useState<Viewer>("lucas");
  const [log, setLog] = useState<Array<{ id: number; who: Viewer; at: string }>>([
    { id: 1, who: "lucas", at: "14:02" },
    { id: 0, who: "hannah", at: "11:47" },
  ]);
  const v = VIEWERS.find((x) => x.id === viewer)!;

  const view = (id: Viewer) => {
    setViewer(id);
    setLog((l) => [{ id: l[0].id + 1, who: id, at: `14:${String(Math.min(59, 2 + l[0].id)).padStart(2, "0")}` }, ...l].slice(0, 4));
  };

  return (
    <section id="security" className="scroll-mt-20 py-28 lg:py-36">
      <Container className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <SectionHead title="Everyone sees what they should. Nobody sees more." lead="Salaries, health and reviews are open only to the people who need them. Every answer pello gives is checked against who's asking." />
          <ul className="mt-10 grid gap-4">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-3.5 text-[18px] text-ink">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-good-soft text-good">
                  <CheckIcon size={15} weight="bold" />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[28px] bg-surface p-3 shadow-[0_30px_80px_-44px_rgb(12_14_20/0.4),inset_0_0_0_1px_var(--pl-line)]">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-3 text-[19px] font-semibold tracking-[-0.02em] text-ink">
              <Avatar person={GRACE} size={40} />
              {GRACE.name}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[16px] text-mute">View as</span>
              <Select label="View as" value={viewer} onChange={(x) => view(x as Viewer)} options={VIEWERS.map((x) => ({ value: x.id, label: x.label }))} className="w-[230px]" />
            </div>
          </div>

          <dl className="mt-2 rounded-[22px] bg-page p-2">
            {FIELDS.map((f) => {
              const full = f.who.includes(viewer);
              const part = !full && f.partial?.who.includes(viewer);
              return (
                <div key={f.label} className="flex min-h-[56px] items-center justify-between gap-4 rounded-[14px] px-4 py-2 odd:bg-surface">
                  <dt className="text-[16px] text-mute">{f.label}</dt>
                  <dd className="relative flex min-w-0 justify-end text-right text-[17px] font-medium text-ink">
                    <AnimatePresence mode="wait" initial={false}>
                      {full || part ? (
                        <motion.span key={`v-${full ? "full" : "part"}`} initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(6px)" }} transition={{ duration: 0.25 }} className="truncate">
                          {full ? f.value : f.partial!.value}
                        </motion.span>
                      ) : (
                        <motion.span key="locked" initial={{ opacity: 0, scaleX: 0.4 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.4 }} transition={{ duration: 0.25 }} style={{ originX: 1 }} className="flex items-center gap-2 rounded-full bg-sunken px-3 py-1 text-[15px] font-medium text-mute">
                          <LockSimpleIcon size={15} weight="bold" />
                          Locked
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[22px] bg-page p-5">
              <p className="text-[15px] text-mute">
                {viewer === "grace" ? "Grace asks pello: what do I earn?" : `${v.label.split(",")[0]} asks pello: what does Grace earn?`}
              </p>
              <AnimatePresence mode="wait">
                <motion.p key={viewer} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className={cn("mt-2 text-[17px] leading-[1.5]", viewer === "lucas" ? "text-ink-2" : "text-ink")}>
                  {ANSWER[viewer]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="rounded-[22px] bg-page p-5">
              <p className="text-[15px] text-mute">Who looked today</p>
              <ul className="mt-2 grid gap-1.5">
                <AnimatePresence initial={false}>
                  {log.slice(0, 3).map((l) => (
                    <motion.li key={l.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-baseline justify-between gap-3 text-[16px] text-ink">
                      <span className="truncate">{personOf(l.who).name}</span>
                      <span className="tabular shrink-0 font-mono text-[15px] text-mute">{l.at}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
