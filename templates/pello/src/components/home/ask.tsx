"use client";

import { ArrowRightIcon, ArrowUpIcon, BookOpenTextIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mark } from "@/components/site/logo";
import { Avatar, Container, SectionHead, Status } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf } from "@/lib/people";

/*
 * The handbook, asked in chat. Pick a question or type your own: pello reads the policy, answers
 * in a few lines, shows the passage it used, and offers to do the thing you were asking about.
 * What it can't find in the handbook goes to a person instead of being guessed.
 */

interface Answer {
  q: string;
  text: string;
  cite?: { doc: string; section: string; quote: string; mark: string };
  action?: { label: string; button: string; done: string };
  /** Sent on to someone, for what the handbook doesn't cover. */
  sent?: string;
}

const ANSWERS: Record<"days" | "leave" | "chair" | "pay" | "other", Answer> = {
  days: {
    q: "How many days off do I have left?",
    text: "You have 9 of your 25 days left this year. Two of them are already booked for December 22 and 23, so you can still plan 7 more. Up to 5 unused days carry over to March.",
    cite: { doc: "Time off policy", section: "2.1", quote: "Everyone gets 25 days off a year, on top of public holidays. Up to 5 unused days carry over and can be taken until March 31.", mark: "Up to 5 unused days carry over" },
    action: { label: "Take Friday, November 13 off", button: "Book it", done: "Booked. Hannah has been told." },
  },
  leave: {
    q: "What's our parental leave?",
    text: "Birth parents get 20 weeks at full pay. Partners get 12 weeks at full pay, which you can take in up to three blocks during the first year. Tell us 8 weeks ahead and pello plans the handover with you.",
    cite: { doc: "Family leave", section: "4.2", quote: "Partners receive 12 weeks of leave at full pay, which may be taken in up to three separate blocks within twelve months of the birth or adoption.", mark: "up to three separate blocks" },
    action: { label: "Start a leave plan", button: "Start", done: "Draft plan sent to Hannah." },
  },
  chair: {
    q: "Can I expense a desk chair?",
    text: "Yes. Your home office budget is £400 a year and you've used £120 on a monitor arm, so a chair up to £280 is covered. Add the receipt here and it's paid back with your next salary.",
    cite: { doc: "Home office", section: "6.1", quote: "Each person has £400 a year for their home office: a chair, a desk, a screen or anything else that makes working from home comfortable.", mark: "£400 a year" },
    action: { label: "Add a receipt for a chair", button: "Add receipt", done: "Receipt added, £249. Paid on October 30." },
  },
  pay: {
    q: "When is payday this month?",
    text: "On the last working day of each month. This month that's Friday, October 30, and your payslip will be in the app the day before.",
    cite: { doc: "Pay and payslips", section: "1.3", quote: "Salaries are paid on the last working day of each month. Payslips are published one working day before.", mark: "last working day of each month" },
    action: { label: "Open your September payslip", button: "Open", done: "Opened. £3,412 net, the same as August." },
  },
  other: {
    q: "",
    text: "I couldn't find that in Fieldwork's handbook, so I won't guess. I've sent your question to Hannah in People, who usually replies the same day.",
    sent: "Sent to Hannah",
  },
};

type Key = keyof typeof ANSWERS;
const ASKABLE: Key[] = ["days", "leave", "chair", "pay"];

function keyFor(text: string): Key {
  const t = text.toLowerCase();
  if (/parent|maternity|paternity|baby|family|adopt/.test(t)) return "leave";
  if (/day.? off|holiday|vacation|pto|days left|time off|annual leave/.test(t)) return "days";
  if (/chair|desk|expense|budget|equipment|monitor|screen|receipt/.test(t)) return "chair";
  if (/pay ?day|paid|salary|payslip|pay ?check|wage/.test(t)) return "pay";
  return "other";
}

interface Turn {
  id: number;
  key: Key;
  q: string;
  phase: "reading" | "typing" | "done";
  words: number;
}

const ASKER = personOf("tom");

function Citation({ cite }: { cite: NonNullable<Answer["cite"]> }) {
  const [open, setOpen] = useState(false);
  const [before, after] = cite.quote.split(cite.mark);
  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex h-9 items-center gap-2 rounded-full bg-accent-soft px-3.5 text-[15px] font-medium text-accent transition-colors hover:bg-[color-mix(in_oklab,var(--pl-accent)_18%,var(--pl-surface))]">
        <BookOpenTextIcon size={17} />
        {cite.doc}, section {cite.section}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.blockquote initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="overflow-hidden">
            <p className="mt-3 rounded-[16px] bg-page px-4 py-3 text-[16px] leading-[1.55] text-ink-2 shadow-[inset_3px_0_0_var(--pl-accent)]">
              {before}
              <mark className="rounded-[4px] bg-accent-soft px-0.5 text-ink">{cite.mark}</mark>
              {after}
            </p>
          </motion.blockquote>
        )}
      </AnimatePresence>
    </div>
  );
}

function Action({ action }: { action: NonNullable<Answer["action"]> }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-4 flex min-h-[64px] items-center justify-between gap-4 rounded-[18px] bg-page px-4 py-3 shadow-[inset_0_0_0_1px_var(--pl-line)]">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 text-[16px] font-medium text-ink">
            <span className="grid size-6 place-items-center rounded-full bg-good text-white">
              <CheckIcon size={14} weight="bold" />
            </span>
            {action.done}
          </motion.p>
        ) : (
          <motion.p key="ask" exit={{ opacity: 0, y: -6 }} className="text-[16px] font-medium text-ink">
            {action.label}
          </motion.p>
        )}
      </AnimatePresence>
      {!done && (
        <button type="button" onClick={() => setDone(true)} className="h-10 shrink-0 rounded-[12px] bg-ink px-4 text-[15px] font-medium text-page transition-colors hover:bg-ink-2">
          {action.button}
        </button>
      )}
    </div>
  );
}

function Dots() {
  return (
    <span className="ml-1 inline-flex gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-1 rounded-full bg-current" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

function Reply({ turn }: { turn: Turn }) {
  const a = ANSWERS[turn.key];
  const words = a.text.split(" ");
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-page">
        <Mark size={20} className="text-page" />
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        {turn.phase === "reading" ? (
          <p className="flex items-center text-[16px] text-mute">
            Reading {a.cite ? `${a.cite.doc}, section ${a.cite.section}` : "the handbook"}
            <Dots />
          </p>
        ) : (
          <p className="text-[17px] leading-[1.6] text-ink">{turn.phase === "done" ? a.text : words.slice(0, turn.words).join(" ")}</p>
        )}
        {turn.phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {a.cite && <Citation cite={a.cite} />}
            {a.action && <Action action={a.action} />}
            {a.sent && (
              <div className="mt-4">
                <Status tone="accent">{a.sent}</Status>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function Ask() {
  const [turns, setTurns] = useState<Turn[]>([{ id: 0, key: "days", q: ANSWERS.days.q, phase: "done", words: 0 }]);
  const [draft, setDraft] = useState("");
  const body = useRef<HTMLDivElement>(null);
  const last = turns[turns.length - 1];
  const busy = last.phase !== "done";

  // Reading, then the answer word by word, then what it found and what it can do.
  useEffect(() => {
    if (last.phase === "reading") {
      const t = setTimeout(() => setTurns((ts) => ts.map((x) => (x.id === last.id ? { ...x, phase: "typing" } : x))), 900);
      return () => clearTimeout(t);
    }
    if (last.phase === "typing") {
      const total = ANSWERS[last.key].text.split(" ").length;
      const t = setTimeout(() => setTurns((ts) => ts.map((x) => (x.id === last.id ? { ...x, words: x.words + 1, phase: x.words + 1 >= total ? "done" : "typing" } : x))), 34);
      return () => clearTimeout(t);
    }
  }, [last]);

  useEffect(() => {
    const el = body.current;
    if (el && turns.length > 1) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const ask = (q: string, key: Key = keyFor(q)) => {
    if (busy || !q.trim()) return;
    setTurns((ts) => [...ts.slice(-3), { id: ts[ts.length - 1].id + 1, key, q: q.trim(), phase: "reading", words: 0 }]);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
    setDraft("");
  };

  return (
    <section id="ask" className="scroll-mt-20 py-28 lg:py-36">
      <Container className="grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
        <div>
          <SectionHead title="Ask it anything in the handbook." lead="People ask in Slack, Teams or the app. pello answers from your own policies, shows the line it used, and when the answer is a request, it files it." />
          <ul className="mt-12">
            {ASKABLE.map((k) => {
              const on = last.key === k;
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => ask(ANSWERS[k].q, k)}
                    disabled={busy}
                    className={cn("group flex w-full items-center justify-between gap-4 py-5 text-left text-[19px] font-medium tracking-[-0.015em] shadow-[0_1px_0_var(--pl-line)] transition-colors disabled:cursor-default", on ? "text-ink" : "text-ink-2 hover:text-ink")}
                  >
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">{ANSWERS[k].q}</span>
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full transition-all duration-300", on ? "bg-accent text-accent-ink" : "bg-sunken text-ink-2 group-hover:bg-ink group-hover:text-page")}>
                      <ArrowRightIcon size={16} weight="bold" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex h-[640px] flex-col overflow-hidden rounded-[28px] bg-surface shadow-[0_30px_80px_-44px_rgb(12_14_20/0.4),inset_0_0_0_1px_var(--pl-line)]">
          <div className="flex items-center justify-between gap-4 px-6 py-4 shadow-[0_1px_0_var(--pl-line)]">
            <p className="flex items-center gap-2.5 text-[17px] font-semibold text-ink">
              <Mark size={24} />
              pello
              <span className="font-normal text-mute">in #ask-people</span>
            </p>
            <span className="flex items-center gap-2 text-[15px] text-mute">
              <Avatar person={ASKER} size={30} />
              <span className="max-sm:hidden">{ASKER.name}</span>
            </span>
          </div>

          <div ref={body} className="flex flex-1 flex-col gap-7 overflow-y-auto px-6 py-6">
            <div className="mt-auto" />
            {turns.map((t) => (
              <motion.div key={t.id} initial={t.id ? { opacity: 0, y: 14 } : false} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
                <p className="ml-auto max-w-[80%] rounded-[20px] rounded-br-[6px] bg-ink px-4 py-3 text-[17px] leading-snug text-page">{t.q}</p>
                <Reply turn={t} />
              </motion.div>
            ))}
          </div>

          <form onSubmit={submit} className="p-4">
            <div className="flex items-center gap-2 rounded-[18px] bg-page p-1.5 pl-4 shadow-[inset_0_0_0_1px_var(--pl-line-strong)] transition-shadow focus-within:shadow-[0_0_0_3px_var(--pl-accent)]">
              <label htmlFor="ask-input" className="sr-only">
                Ask pello a question
              </label>
              <input
                id="ask-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about leave, pay, expenses or anything else"
                autoComplete="off"
                className="h-11 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-mute focus-visible:outline-none"
              />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-accent text-accent-ink transition-opacity disabled:opacity-35">
                <ArrowUpIcon size={18} weight="bold" />
              </button>
            </div>
          </form>
        </div>
      </Container>
    </section>
  );
}
