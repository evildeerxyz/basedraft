"use client";

import { CheckIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mark } from "@/components/site/logo";
import { Avatar, Container, SectionHead, Status } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { useEngaged } from "@/lib/engaged";
import { PEOPLE, personOf } from "@/lib/people";

/*
 * One request for time off, start to finish, in four steps that play on their own while the
 * section is on screen (or click one). The switch makes it a busy week in Sales: the request breaks a rule, so pello hands it
 * to Marco with what he needs to decide, instead of deciding itself.
 */

const GRACE = personOf("grace");
const MARCO = personOf("marco");
const SALES = PEOPLE.filter((p) => p.team === "sales");
const DAYS = [22, 23, 24];
const STEP_MS = 4200;

const STEPS = [
  { title: "Grace asks for three days", body: "In Slack, the way she'd ask a colleague: can I take December 22 to 24 off?" },
  { title: "pello checks your rules", body: "Days left, notice, how many of her team are already out, and anything booked on her calendar." },
  { title: "Approved, or sent to Marco", body: "Inside the rules, it's approved and Marco is told. Outside them, Marco decides, with everything in front of him." },
  { title: "Everything else follows", body: "The team calendar, cover for her accounts and payroll update on their own." },
];

function rules(busy: boolean) {
  return [
    { text: "15 days left, 3 asked for", ok: true },
    { text: "Asked 6 weeks ahead, the rule is 2", ok: true },
    { text: busy ? "2 of 5 in Sales already out, the limit is 2" : "1 of 5 in Sales out those days, the limit is 2", ok: !busy },
    { text: "No customer meetings on her calendar", ok: true },
  ];
}

function Calendar() {
  // December 2026 starts on a Tuesday.
  const cells = [null, ...Array.from({ length: 31 }, (_, i) => i + 1)];
  return (
    <div className="w-full max-w-[400px]">
      <div className="flex items-baseline justify-between">
        <p className="text-[19px] font-semibold text-ink">December</p>
        <p className="tabular text-[16px] text-mute">2026</p>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="pb-1 text-[15px] text-mute">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          const on = d !== null && DAYS.includes(d);
          return (
            <motion.span
              key={i}
              initial={false}
              animate={on ? { scale: [1, 1.12, 1] } : {}}
              transition={{ delay: on ? 0.25 + DAYS.indexOf(d!) * 0.12 : 0, duration: 0.4 }}
              className={cn("tabular grid h-10 place-items-center rounded-[10px] text-[15px]", d === null ? "" : on ? "bg-accent font-semibold text-accent-ink" : i % 7 >= 5 ? "text-mute" : "bg-surface text-ink-2")}
            >
              {d}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

function Message({ who, children, delay = 0 }: { who: "pello" | typeof GRACE; children: ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="flex gap-3">
      {who === "pello" ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink">
          <Mark size={22} className="text-page" />
        </span>
      ) : (
        <Avatar person={who} size={40} />
      )}
      <div className="min-w-0">
        <p className="text-[16px] font-semibold text-ink">{who === "pello" ? "pello" : who.name}</p>
        <div className="mt-1 text-[17px] leading-[1.5] text-ink-2">{children}</div>
      </div>
    </motion.div>
  );
}

function Stage({ step, busy }: { step: number; busy: boolean }) {
  const [decided, setDecided] = useState<null | "yes" | "other">(null);
  if (step === 0)
    return (
      <div className="flex w-full flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <Message who={GRACE}>Can I take December 22 to 24 off? Back on the 28th.</Message>
        <Calendar />
      </div>
    );
  if (step === 1)
    return (
      <ul className="grid w-full max-w-[520px] gap-3">
        {rules(busy).map((r, i) => (
          <motion.li key={r.text} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.32, duration: 0.4 }} className="flex items-center gap-4 rounded-[16px] bg-surface px-4 py-4 shadow-[inset_0_0_0_1px_var(--pl-line)]">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35 + i * 0.32, type: "spring", stiffness: 500, damping: 20 }} className={cn("grid size-7 shrink-0 place-items-center rounded-full text-white", r.ok ? "bg-good" : "bg-bad")}>
              {r.ok ? <CheckIcon size={15} weight="bold" /> : <XIcon size={15} weight="bold" />}
            </motion.span>
            <span className={cn("text-[17px]", r.ok ? "text-ink" : "font-medium text-bad")}>{r.text}</span>
          </motion.li>
        ))}
      </ul>
    );
  if (step === 2)
    return busy ? (
      <div className="w-full max-w-[540px] rounded-[22px] bg-surface p-6 shadow-[0_24px_60px_-30px_rgb(12_14_20/0.35),inset_0_0_0_1px_var(--pl-line)]">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-3 text-[16px] font-semibold text-ink">
            <Avatar person={MARCO} size={36} />
            For {MARCO.name}
          </p>
          <Status tone={decided ? "good" : "wait"}>{decided ? "Decided" : "Needs you"}</Status>
        </div>
        <p className="mt-5 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink">Grace asked for December 22 to 24.</p>
        <p className="mt-2 text-[17px] leading-[1.55] text-ink-2">Ben and Sofia are already out those days, and the limit for Sales is 2. Lucas is in and could cover her accounts.</p>
        <AnimatePresence mode="wait" initial={false}>
          {decided ? (
            <motion.p key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex items-center gap-2.5 text-[17px] font-medium text-ink">
              <span className="grid size-6 place-items-center rounded-full bg-good text-white">
                <CheckIcon size={14} weight="bold" />
              </span>
              {decided === "yes" ? "Approved by Marco. Grace and Lucas have been told." : "Sent Grace January 5 to 7 instead."}
            </motion.p>
          ) : (
            <motion.div key="b" exit={{ opacity: 0 }} className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setDecided("yes")} className="h-11 rounded-[12px] bg-ink px-5 text-[16px] font-medium text-page transition-colors hover:bg-ink-2">
                Approve anyway
              </button>
              <button type="button" onClick={() => setDecided("other")} className="h-11 rounded-[12px] bg-surface px-5 text-[16px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)] transition-colors hover:bg-sunken">
                Suggest other days
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    ) : (
      <div className="grid w-full max-w-[560px] gap-6">
        <Message who="pello">
          You&apos;re off December 22 to 24. Enjoy it, Grace.{" "}
          <span className="ml-1 inline-flex align-middle">
            <Status tone="good">Approved in 4 seconds</Status>
          </span>
        </Message>
        <Message who="pello" delay={0.5}>
          <span className="text-ink">To Marco:</span> Grace is off December 22 to 24. It was inside the rules, so I approved it. Lucas has her accounts.
        </Message>
      </div>
    );
  return (
    <div className="w-full max-w-[560px]">
      <div className="grid grid-cols-[1fr_repeat(3,64px)] items-center gap-2">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="tabular text-center text-[15px] text-mute">
            Dec {d}
          </span>
        ))}
        {SALES.map((p, r) => {
          const out = p.id === "grace" || (busy && (p.id === "ben" || p.id === "sofia"));
          return [
            <span key={p.id} className="flex items-center gap-3 py-1 text-[16px] text-ink">
              <Avatar person={p} size={30} />
              {p.name}
            </span>,
            ...DAYS.map((d, i) => (
              <motion.span
                key={`${p.id}-${d}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1 + r * 0.06 + i * 0.05, duration: 0.35 }}
                className={cn("h-9 origin-left rounded-[8px]", out ? (p.id === "grace" ? "bg-accent" : "bg-ink-2") : "bg-surface shadow-[inset_0_0_0_1px_var(--pl-line)]")}
              />
            )),
          ];
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Status tone="good">Calendar updated</Status>
        <Status tone="good">Lucas covers her accounts</Status>
        <Status tone="wait">No change to pay</Status>
      </div>
    </div>
  );
}

export function TimeOff() {
  const ref = useRef<HTMLDivElement>(null);
  // It plays while it's on screen, once someone is on the page (see lib/engaged.ts).
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
    <section id="time-off" className="scroll-mt-20 bg-surface py-28 lg:py-36">
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
            className="flex shrink-0 items-center gap-3 self-start rounded-full bg-page py-2 pl-2 pr-5 text-[16px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--pl-line)] lg:self-end"
          >
            <span className={cn("flex h-7 w-12 items-center rounded-full p-1 transition-colors duration-300", busy ? "bg-bad" : "bg-line-strong")}>
              <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className={cn("size-5 rounded-full bg-white shadow-sm", busy && "ml-auto")} />
            </span>
            Make it a busy week in Sales
          </button>
        </div>

        <div ref={ref} className="mt-14 grid overflow-hidden rounded-[28px] border border-line bg-page lg:grid-cols-[400px_1fr]">
          <ol className="p-3 lg:p-4">
            {STEPS.map((s, i) => {
              const on = i === step;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(i);
                      setManual(true);
                    }}
                    aria-current={on ? "step" : undefined}
                    className={cn("relative w-full overflow-hidden rounded-[20px] px-5 py-5 text-left transition-colors", on ? "bg-surface shadow-[inset_0_0_0_1px_var(--pl-line)]" : "hover:bg-sunken")}
                  >
                    <span className="flex items-baseline gap-4">
                      <span className={cn("tabular font-mono text-[15px]", on ? "text-accent" : "text-mute")}>0{i + 1}</span>
                      <span className={cn("text-[19px] font-semibold tracking-[-0.02em]", on ? "text-ink" : "text-ink-2")}>{s.title}</span>
                    </span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="block overflow-hidden">
                          <span className="block pl-[38px] pt-2 text-[16px] leading-[1.55] text-ink-2">{s.body}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {on && seen && !manual && (
                      <motion.span key={`${step}-${busy}`} aria-hidden className="absolute inset-x-5 bottom-0 h-[3px] origin-left rounded-full bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: STEP_MS / 1000, ease: "linear" }} />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden p-6 shadow-[inset_0_1px_0_var(--pl-line)] sm:p-10 lg:shadow-[inset_1px_0_0_var(--pl-line)]">
            <AnimatePresence mode="wait">
              <motion.div key={`${step}-${busy}`} initial={{ opacity: 0, y: 18, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="flex w-full justify-center">
                <Stage step={step} busy={busy} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}
