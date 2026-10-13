"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mark } from "@/components/site/logo";
import { Container, Face, SectionHead, Stamp, Tag } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { useEngaged } from "@/lib/engaged";
import { PEOPLE, personOf } from "@/lib/people";

/*
 * One request for time off, start to finish, in four steps filed like folders. They play on
 * their own while the section is on screen (or open one). The switch makes it a busy week in
 * Sales: the request breaks a rule, so pello hands it to Marco instead of deciding itself.
 */

const GRACE = personOf("grace");
const MARCO = personOf("marco");
const SALES = PEOPLE.filter((p) => p.team === "sales");
const DAYS = [22, 23, 24];
const STEP_MS = 4200;

const STEPS = [
  { tab: "Request", title: "Grace asks for three days", body: "In Slack, the way she'd ask a colleague." },
  { tab: "Rules", title: "pello checks your rules", body: "Days left, notice, who else is out, her calendar." },
  { tab: "Decision", title: "Approved, or sent to Marco", body: "Inside the rules it's approved. Outside them, Marco decides." },
  { tab: "Updates", title: "Everything else follows", body: "Calendar, cover and payroll update on their own." },
];

function rules(busy: boolean) {
  return [
    { text: "15 days left, 3 asked for", ok: true },
    { text: "Asked 6 weeks ahead, the rule is 2", ok: true },
    { text: busy ? "2 of 5 in Sales already out, the limit is 2" : "1 of 5 in Sales out those days, the limit is 2", ok: !busy },
    { text: "No customer meetings on her calendar", ok: true },
  ];
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3 shadow-[0_1px_0_var(--pl-line-strong)]">
      <p className="text-[15px] text-mute">{label}</p>
      <div className="mt-0.5 text-[19px] font-semibold text-ink">{children}</div>
    </div>
  );
}

/** The request, as a form: it's what every step is about, so it stays on the left. */
function Form({ step, busy }: { step: number; busy: boolean }) {
  return (
    <div className="relative">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-[26px] font-extrabold text-ink">Time off request</p>
        <p className="tabular font-mono text-[15px] text-mute">No. 4417</p>
      </div>
      <div className="mt-4">
        <Field label="Who">
          <span className="flex items-center gap-3">
            <Face person={GRACE} size={32} />
            {GRACE.name}, {GRACE.role}
          </span>
        </Field>
        <Field label="When">December 22 to 24, back on the 28th</Field>
        <Field label="Days">
          <span className="tabular font-mono">3</span> of <span className="tabular font-mono">15</span> left
        </Field>
        <Field label="Signs off">{MARCO.name}, Sales Lead</Field>
      </div>
      <AnimatePresence>
        {step >= 2 && (
          <motion.div key={busy ? "busy" : "ok"} exit={{ opacity: 0 }} className="absolute bottom-8 right-0">
            <Stamp tone={busy ? "accent" : "ink"} tilt={-9} className="text-[30px]">
              {busy ? "Sent to Marco" : "Approved"}
            </Stamp>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Calendar() {
  // December 2026 starts on a Tuesday.
  const cells = [null, ...Array.from({ length: 31 }, (_, i) => i + 1)];
  return (
    <div className="w-full max-w-[420px]">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-[26px] font-extrabold text-ink">December</p>
        <p className="tabular font-mono text-[15px] text-mute">2026</p>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="pb-1 text-[15px] font-semibold text-mute">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          const on = d !== null && DAYS.includes(d);
          return (
            <motion.span key={i} initial={false} animate={on ? { scale: [1, 1.14, 1] } : {}} transition={{ delay: on ? 0.25 + DAYS.indexOf(d!) * 0.12 : 0, duration: 0.4 }} className={cn("tabular grid h-10 place-items-center rounded-[3px] font-mono text-[15px]", d === null ? "" : on ? "bg-accent font-semibold text-accent-ink" : i % 7 >= 5 ? "text-mute" : "bg-page text-ink-2")}>
              {d}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

function Stage({ step, busy }: { step: number; busy: boolean }) {
  const [decided, setDecided] = useState<null | "yes" | "other">(null);
  if (step === 0)
    return (
      <div className="grid w-full gap-8">
        <div className="flex gap-3">
          <Face person={GRACE} size={40} />
          <div>
            <p className="text-[16px] font-semibold text-ink">
              {GRACE.name} <span className="font-normal text-mute">in Slack, 09:12</span>
            </p>
            <p className="mt-1 text-[19px] leading-[1.45] text-ink">Can I take December 22 to 24 off? Back on the 28th.</p>
          </div>
        </div>
        <Calendar />
      </div>
    );
  if (step === 1)
    return (
      <ul className="w-full">
        {rules(busy).map((r, i) => (
          <motion.li key={r.text} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.3, duration: 0.35 }} className="flex items-center gap-4 py-4 shadow-[0_1px_0_var(--pl-line-strong)]">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.3, type: "spring", stiffness: 500, damping: 20 }} className={cn("grid size-8 shrink-0 place-items-center rounded-[3px]", r.ok ? "bg-ink text-page" : "bg-accent text-accent-ink")}>
              {r.ok ? <CheckIcon size={17} weight="bold" /> : <XIcon size={17} weight="bold" />}
            </motion.span>
            <span className={cn("text-[19px]", r.ok ? "text-ink" : "font-semibold text-accent")}>{r.text}</span>
          </motion.li>
        ))}
      </ul>
    );
  if (step === 2)
    return busy ? (
      <div className="w-full">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-3 text-[17px] font-semibold text-ink">
            <Face person={MARCO} size={36} />
            For {MARCO.name}
          </p>
          <Tag tone={decided ? "done" : "flag"}>{decided ? "Decided" : "Needs you"}</Tag>
        </div>
        <p className="mt-6 font-display text-[34px] font-extrabold leading-[0.98] text-ink">Grace asked for December 22 to 24.</p>
        <p className="mt-3 text-[18px] leading-[1.55] text-ink-2">Ben and Sofia are already out those days, and the limit for Sales is 2. Lucas is in and could cover her accounts.</p>
        <AnimatePresence mode="wait" initial={false}>
          {decided ? (
            <motion.p key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-7 flex items-center gap-2.5 text-[18px] font-semibold text-ink">
              <CheckIcon size={20} weight="bold" />
              {decided === "yes" ? "Approved by Marco. Grace and Lucas have been told." : "Sent Grace January 5 to 7 instead."}
            </motion.p>
          ) : (
            <motion.div key="b" exit={{ opacity: 0 }} className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => setDecided("yes")} className="h-12 rounded-[4px] bg-ink px-5 text-[16px] font-semibold text-page transition-colors hover:bg-accent hover:text-accent-ink">
                Approve anyway
              </button>
              <button type="button" onClick={() => setDecided("other")} className="h-12 rounded-[4px] px-5 text-[16px] font-semibold text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] transition-colors hover:bg-ink hover:text-page">
                Suggest other days
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ) : (
      <div className="grid w-full gap-7">
        {[
          { to: "To Grace", text: "You're off December 22 to 24. Enjoy it, Grace." },
          { to: "To Marco", text: "Grace is off December 22 to 24. It was inside the rules, so I approved it. Lucas has her accounts." },
        ].map((m, i) => (
          <motion.div key={m.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.45, duration: 0.4 }} className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-page">
              <Mark size={24} />
            </span>
            <div>
              <p className="text-[16px] font-semibold text-ink">
                pello <span className="font-normal text-mute">{m.to}</span>
              </p>
              <p className="mt-1 text-[19px] leading-[1.45] text-ink">{m.text}</p>
            </div>
          </motion.div>
        ))}
        <p className="text-[16px] text-mute">
          Decided in <span className="tabular font-mono text-ink">4</span> seconds.
        </p>
      </div>
    );
  return (
    <div className="w-full">
      <div className="grid grid-cols-[1fr_repeat(3,60px)] items-center gap-1.5">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="tabular text-center font-mono text-[15px] text-mute">
            {d}
          </span>
        ))}
        {SALES.map((p, r) => {
          const out = p.id === "grace" || (busy && (p.id === "ben" || p.id === "sofia"));
          return [
            <span key={p.id} className="flex items-center gap-3 py-1 text-[17px] text-ink">
              <Face person={p} size={30} />
              {p.name}
            </span>,
            ...DAYS.map((d, i) => (
              <motion.span
                key={`${p.id}-${d}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1 + r * 0.06 + i * 0.05, duration: 0.35 }}
                className={cn("h-9 origin-left rounded-[3px]", out ? (p.id === "grace" ? "bg-accent" : "pl-dither-50 bg-page text-ink") : "bg-page")}
              />
            )),
          ];
        })}
      </div>
      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
        <Tag tone="done">Calendar updated</Tag>
        <Tag tone="done">Lucas covers her accounts</Tag>
        <Tag tone="open">No change to pay</Tag>
      </div>
    </div>
  );
}

export function TimeOff() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const engaged = useEngaged();
  const seen = inView && engaged;
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!seen || manual) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [seen, manual, step]);

  return (
    <section id="time-off" className="scroll-mt-20 py-28 lg:py-36">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead title="Time off, approved before the kettle boils." lead="Set the rules once: how much notice, how many people per team can be out, who signs off on what. pello checks every request against them and only asks a person when it has to." />
          <button
            type="button"
            role="switch"
            aria-checked={busy}
            onClick={() => {
              setBusy((b) => !b);
              setStep(1);
              setManual(false);
            }}
            className="flex shrink-0 items-center gap-3 self-start rounded-[4px] py-2 pl-2 pr-4 text-[17px] font-semibold text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] lg:self-end"
          >
            <span className={cn("flex h-7 w-12 items-center rounded-[3px] p-1 transition-colors duration-300", busy ? "bg-accent" : "bg-sunken")}>
              <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className={cn("size-5 rounded-[2px] bg-ink", busy && "ml-auto")} />
            </span>
            Make it a busy week in Sales
          </button>
        </div>

        <div ref={ref} className="mt-14">
          <div role="tablist" aria-label="Steps" className="flex gap-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const on = i === step;
              return (
                <button
                  key={s.tab}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setStep(i);
                    setManual(true);
                  }}
                  className={cn("relative min-w-[150px] flex-1 overflow-hidden rounded-t-[6px] px-5 pb-3 pt-4 text-left transition-colors", on ? "bg-surface text-ink" : "bg-page text-mute shadow-[inset_0_0_0_1px_var(--pl-line-strong)] hover:text-ink")}
                >
                  <span className="tabular block font-mono text-[15px]">0{i + 1}</span>
                  <span className="block font-display text-[24px] font-extrabold leading-tight">{s.tab}</span>
                  {on && seen && !manual && <motion.span key={`${step}-${busy}`} aria-hidden className="absolute inset-x-0 top-0 h-[3px] origin-left bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: STEP_MS / 1000, ease: "linear" }} />}
                </button>
              );
            })}
          </div>
          <div className="grid gap-10 rounded-b-[4px] bg-surface p-6 sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:p-12">
            <Form step={step} busy={busy} />
            <div className="min-h-[420px]">
              <p className="font-display text-[34px] font-extrabold leading-none text-ink">{STEPS[step].title}</p>
              <p className="mt-2 text-[17px] text-ink-2">{STEPS[step].body}</p>
              <div className="mt-8">
                <AnimatePresence mode="wait">
                  <motion.div key={`${step}-${busy}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                    <Stage step={step} busy={busy} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
