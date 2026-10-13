"use client";

import { CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Dithered } from "@/components/site/dither";
import { Select } from "@/components/site/select";
import { Container, SectionHead, Stamp } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf } from "@/lib/people";
import { personPhoto } from "@/lib/photos";

/*
 * One personnel file, seen by five different people. Pick who's looking: what they may see is
 * there, what they may not is blacked out like a redacted document, and the same rule holds when
 * they ask pello about it. Every look is written to the log.
 */

type Viewer = "grace" | "lucas" | "marco" | "hannah" | "emma";
const VIEWERS: Array<{ id: Viewer; label: string }> = [
  { id: "grace", label: "Grace, herself" },
  { id: "lucas", label: "Lucas, a teammate" },
  { id: "marco", label: "Marco, her manager" },
  { id: "hannah", label: "Hannah, People" },
  { id: "emma", label: "Emma, Payroll" },
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
    <section id="security" className="scroll-mt-20 bg-surface py-28 lg:py-36">
      <Container className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <SectionHead title="Everyone sees what they should. Nobody sees more." lead="Salaries, health and reviews are open only to the people who need them. Every answer pello gives is checked against who's asking." />
          <ul className="mt-10 grid gap-4">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-center gap-3.5 text-[19px] font-medium text-ink">
                <span className="grid size-7 shrink-0 place-items-center rounded-[3px] bg-ink text-page">
                  <CheckIcon size={15} weight="bold" />
                </span>
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-10 max-w-[360px]">
            <p className="text-[16px] font-semibold text-ink">See the file as</p>
            <Select label="See the file as" value={viewer} onChange={(x) => view(x as Viewer)} options={VIEWERS.map((x) => ({ value: x.id, label: x.label }))} className="mt-2" />
          </div>
        </div>

        <div>
          <div className="relative rounded-[4px] bg-page p-6 shadow-[0_30px_70px_-40px_rgb(0_0_0/0.45)] sm:p-8">
            <div className="flex items-start gap-5">
              <Dithered src={personPhoto(GRACE.id)} alt={GRACE.name} cell={2} focus={[0.5, 0.3]} className="size-28 shrink-0 rounded-[3px] sm:size-32" />
              <div className="min-w-0 pt-1">
                <p className="text-[16px] text-mute">Personnel file</p>
                <p className="font-display text-[44px] font-extrabold leading-[0.92] text-ink">{GRACE.name}</p>
                <p className="tabular mt-2 font-mono text-[15px] text-mute">FW 0188</p>
              </div>
              <span className="absolute right-5 top-5 max-sm:hidden">
                <Stamp tone="accent" tilt={6} play={false}>
                  Confidential
                </Stamp>
              </span>
            </div>

            <dl className="mt-7">
              {FIELDS.map((f) => {
                const full = f.who.includes(viewer);
                const part = !full && f.partial?.who.includes(viewer);
                const text = full ? f.value : part ? f.partial!.value : "";
                return (
                  <div key={f.label} className="flex min-h-[54px] items-center justify-between gap-4 shadow-[0_1px_0_var(--pl-line-strong)]">
                    <dt className="text-[16px] text-mute">{f.label}</dt>
                    <dd className="relative flex min-w-0 justify-end text-right text-[18px] font-semibold text-ink">
                      <AnimatePresence mode="wait" initial={false}>
                        {text ? (
                          <motion.span key={`v-${text}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="truncate">
                            {text}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="hidden"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            exit={{ scaleX: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            style={{ originX: 1, width: `${Math.min(240, 40 + f.value.length * 8)}px` }}
                            className="block h-6 bg-ink"
                          >
                            <span className="sr-only">Hidden from {v.label.split(",")[0]}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1.25fr_1fr]">
            <div className="rounded-[4px] bg-ink p-6 text-page">
              <p className="text-[15px] text-night-mute">{viewer === "grace" ? "Grace asks pello: what do I earn?" : `${v.label.split(",")[0]} asks pello: what does Grace earn?`}</p>
              <AnimatePresence mode="wait">
                <motion.p key={viewer} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className={cn("mt-2 text-[19px] leading-[1.45]", viewer === "lucas" ? "text-accent" : "text-page")}>
                  {ANSWER[viewer]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="rounded-[4px] bg-page p-6">
              <p className="text-[15px] text-mute">Who looked today</p>
              <ul className="mt-2 grid gap-1.5">
                <AnimatePresence initial={false}>
                  {log.slice(0, 3).map((l) => (
                    <motion.li key={l.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-baseline justify-between gap-3 text-[17px] text-ink">
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
