"use client";

import { ArrowUpIcon, BookOpenTextIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { Mark } from "@/components/site/logo";
import { Band, Face, SectionHead, Tag, Window } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personOf } from "@/lib/people";

/*
 * The handbook, asked in chat. Pick a question or type your own: pello reads the policy, answers
 * in a few lines and offers to do the thing you asked about, and beside it is the handbook page it
 * read, with the line it used marked. What the handbook doesn't cover goes to a person instead.
 */

interface Answer {
  q: string;
  text: string;
  page?: { doc: string; section: string; title: string; number: number; paras: string[]; mark: string; cited: number };
  action?: { label: string; button: string; done: string };
}

const ANSWERS: Record<"days" | "leave" | "chair" | "pay" | "other", Answer> = {
  days: {
    q: "How many days off do I have left?",
    text: "You have 9 of your 25 days left this year. Two of them are already booked for December 22 and 23, so you can still plan 7 more. Up to 5 unused days carry over to March.",
    page: {
      doc: "Time off policy",
      section: "2.1",
      title: "Days off",
      number: 14,
      paras: [
        "Everyone at Fieldwork gets 25 days off a year, on top of the public holidays where they work. Days run from January to December, and someone who joins during the year gets a share of them.",
        "Up to 5 unused days carry over and can be taken until March 31. Anything above that is paid out with December's salary.",
        "Ask at least two weeks ahead for anything longer than three days, so your team can plan around it.",
      ],
      mark: "Up to 5 unused days carry over",
      cited: 412,
    },
    action: { label: "Take Friday, November 13 off", button: "Book it", done: "Booked. Hannah has been told." },
  },
  leave: {
    q: "What's our parental leave?",
    text: "Birth parents get 20 weeks at full pay. Partners get 12 weeks at full pay, which you can take in up to three blocks during the first year. Tell us 8 weeks ahead and pello plans the handover with you.",
    page: {
      doc: "Family leave",
      section: "4.2",
      title: "Parental leave",
      number: 22,
      paras: [
        "Birth parents receive 20 weeks of leave at full pay, which can start up to four weeks before the due date.",
        "Partners receive 12 weeks of leave at full pay, which may be taken in up to three separate blocks within twelve months of the birth or adoption.",
        "Tell your manager and the People team at least eight weeks ahead, and we'll plan the handover together.",
      ],
      mark: "up to three separate blocks",
      cited: 86,
    },
    action: { label: "Start a leave plan", button: "Start", done: "Draft plan sent to Hannah." },
  },
  chair: {
    q: "Can I expense a desk chair?",
    text: "Yes. Your home office budget is £400 a year and you've used £120 on a monitor arm, so a chair up to £280 is covered. Add the receipt here and it's paid back with your next salary.",
    page: {
      doc: "Home office",
      section: "6.1",
      title: "Your home office budget",
      number: 31,
      paras: [
        "Each person has £400 a year for their home office: a chair, a desk, a screen or anything else that makes working from home comfortable.",
        "Keep the receipt. Anything inside the budget is paid back with the next salary, without anyone having to approve it.",
        "What you buy is yours to keep, including if you leave.",
      ],
      mark: "£400 a year",
      cited: 158,
    },
    action: { label: "Add a receipt for a chair", button: "Add receipt", done: "Receipt added, £249. Paid on October 30." },
  },
  pay: {
    q: "When is payday this month?",
    text: "On the last working day of each month. This month that's Friday, October 30, and your payslip will be in the app the day before.",
    page: {
      doc: "Pay and payslips",
      section: "1.3",
      title: "When you're paid",
      number: 8,
      paras: [
        "Salaries are paid on the last working day of each month. Payslips are published one working day before.",
        "If payday falls on a public holiday, you're paid on the working day before it.",
        "Questions about a payslip go to Emma Schultz in Finance, who replies within a day.",
      ],
      mark: "last working day of each month",
      cited: 203,
    },
    action: { label: "Open your September payslip", button: "Open", done: "Opened. £3,412 net, the same as August." },
  },
  other: {
    q: "",
    text: "I couldn't find that in Fieldwork's handbook, so I won't guess. I've sent your question to Hannah in People, who usually replies the same day.",
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

const ASKER = personOf("tom");
const HANNAH = personOf("hannah");

function Action({ action }: { action: NonNullable<Answer["action"]> }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-4 flex min-h-[56px] items-center justify-between gap-3 rounded-[12px] bg-sunken px-3.5 py-2">
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-[15px] font-medium text-ink">
            <span className="grid size-5 place-items-center rounded-full bg-ink text-surface">
              <CheckIcon size={11} weight="bold" />
            </span>
            {action.done}
          </motion.p>
        ) : (
          <motion.p key="ask" exit={{ opacity: 0, y: -6 }} className="text-[15px] font-medium text-ink">
            {action.label}
          </motion.p>
        )}
      </AnimatePresence>
      {!done && (
        <button type="button" onClick={() => setDone(true)} className="pl-btn-dark h-9 shrink-0 rounded-[10px] px-3 text-[15px] font-medium">
          {action.button}
        </button>
      )}
    </div>
  );
}

/** The handbook page pello read, with the line it used marked once the answer is in. */
function Page({ a, marked }: { a: Answer; marked: boolean }) {
  if (!a.page)
    return (
      <div className="flex h-full flex-col justify-between p-7">
        <div>
          <p className="font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">Nothing in the handbook covers this</p>
          <p className="mt-3 text-[16px] leading-[1.55] text-mute">So pello didn&apos;t guess. The question went to the person who can answer it, and it&apos;s on the list of gaps to fill.</p>
        </div>
        <div className="flex items-center gap-3 rounded-[12px] bg-sunken p-3">
          <Face person={HANNAH} size={44} />
          <div>
            <p className="text-[15px] font-semibold text-ink">{HANNAH.name}</p>
            <p className="text-[15px] text-mute">{HANNAH.role}, usually replies the same day</p>
          </div>
        </div>
      </div>
    );
  const p = a.page;
  return (
    <div className="flex h-full flex-col p-7">
      <p className="text-[15px] text-mute">
        Section <span className="tabular font-mono">{p.section}</span>
      </p>
      <p className="mt-1 font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">{p.title}</p>
      <div className="mt-4 grid gap-3.5 text-[16px] leading-[1.65] text-ink-2">
        {p.paras.map((para) => {
          const at = para.indexOf(p.mark);
          if (at < 0) return <p key={para}>{para}</p>;
          return (
            <p key={para}>
              {para.slice(0, at)}
              <motion.mark
                initial={false}
                animate={{ backgroundSize: marked ? "100% 100%" : "0% 100%" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[3px] bg-no-repeat px-0.5 text-ink [background-image:linear-gradient(var(--pl-accent-soft),var(--pl-accent-soft))]"
                style={{ backgroundColor: "transparent", boxShadow: marked ? "inset 0 -2px 0 var(--pl-accent)" : "none" }}
              >
                {p.mark}
              </motion.mark>
              {para.slice(at + p.mark.length)}
            </p>
          );
        })}
      </div>
      <p className="mt-auto flex items-center gap-2 pt-6 text-[15px] text-mute">
        <BookOpenTextIcon size={16} />
        Used in <span className="tabular font-mono text-ink">{p.cited}</span> answers this month
      </p>
    </div>
  );
}

interface Turn {
  id: number;
  key: Key;
  q: string;
  phase: "reading" | "typing" | "done";
  words: number;
}

export function Ask() {
  const [turn, setTurn] = useState<Turn>({ id: 0, key: "days", q: ANSWERS.days.q, phase: "done", words: 0 });
  const [draft, setDraft] = useState("");
  const a = ANSWERS[turn.key];
  const busy = turn.phase !== "done";

  // Reading, then the answer word by word, then what it found and what it can do.
  useEffect(() => {
    if (turn.phase === "reading") {
      const t = setTimeout(() => setTurn((x) => ({ ...x, phase: "typing" })), 850);
      return () => clearTimeout(t);
    }
    if (turn.phase === "typing") {
      const total = ANSWERS[turn.key].text.split(" ").length;
      const t = setTimeout(() => setTurn((x) => ({ ...x, words: x.words + 1, phase: x.words + 1 >= total ? "done" : "typing" })), 32);
      return () => clearTimeout(t);
    }
  }, [turn]);

  const ask = (q: string, key: Key = keyFor(q)) => {
    if (busy || !q.trim()) return;
    setTurn((x) => ({ id: x.id + 1, key, q: q.trim(), phase: "reading", words: 0 }));
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
    setDraft("");
  };

  return (
    <Band rule id="ask" inner="py-20 lg:py-28">
      <SectionHead title="Answers people can check" lead="Your team asks in Slack, Teams or the app. pello answers from your own policies and shows the line it used, so nobody has to ask twice." />

      <div className="pl-card mt-14 overflow-hidden rounded-[16px] p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 p-2">
          {ASKABLE.map((k) => {
            const on = turn.key === k;
            return (
              <button key={k} type="button" onClick={() => ask(ANSWERS[k].q, k)} disabled={busy} aria-pressed={on} className={cn("h-10 rounded-[10px] px-3.5 text-[15px] font-medium transition-colors disabled:cursor-default", on ? "pl-btn-dark" : "pl-btn-light")}>
                {ANSWERS[k].q}
              </button>
            );
          })}
        </div>

        <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Window title="#ask-people" className="flex min-h-[520px] flex-col">
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start gap-3">
                <Face person={ASKER} size={36} />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">
                    {ASKER.name} <span className="font-normal text-mute">{ASKER.role}</span>
                  </p>
                  <motion.p key={turn.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-0.5 text-[16px] leading-[1.5] text-ink">
                    {turn.q}
                  </motion.p>
                </div>
              </div>
              <div className="mt-6 flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink">
                  <Mark size={20} className="text-surface" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">
                    pello <span className="ml-1 rounded-[5px] bg-sunken px-1.5 py-0.5 text-[15px] font-medium text-mute">App</span>
                  </p>
                  {turn.phase === "reading" ? (
                    <p className="mt-0.5 text-[16px] text-mute">Reading {a.page ? `${a.page.doc}, section ${a.page.section}` : "the handbook"}</p>
                  ) : (
                    <p className="mt-0.5 text-[16px] leading-[1.55] text-ink">{turn.phase === "done" ? a.text : a.text.split(" ").slice(0, turn.words).join(" ")}</p>
                  )}
                  {turn.phase === "done" && (
                    <motion.div key={turn.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                      {a.action && <Action action={a.action} />}
                      {!a.page && (
                        <div className="mt-4">
                          <Tag tone="flag">Sent to Hannah</Tag>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
              <form onSubmit={submit} className="mt-auto pt-6">
                <label htmlFor="ask-input" className="sr-only">
                  Ask pello your own question
                </label>
                <div className="flex items-center gap-2 rounded-[12px] bg-surface p-1.5 pl-3.5 shadow-[0_0_0_1px_var(--pl-line-strong)] transition-shadow focus-within:shadow-[0_0_0_1px_var(--pl-ink),0_0_0_4px_var(--pl-line)]">
                  <input id="ask-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask your own: leave, pay, expenses, anything" autoComplete="off" className="h-9 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute focus-visible:outline-none" />
                  <button type="submit" disabled={busy || !draft.trim()} aria-label="Send" className="pl-btn-dark grid size-9 shrink-0 place-items-center rounded-[9px] disabled:opacity-30">
                    <ArrowUpIcon size={16} weight="bold" />
                  </button>
                </div>
              </form>
            </div>
          </Window>

          <Window title={a.page ? `Fieldwork handbook · ${a.page.doc} · p. ${a.page.number}` : "Fieldwork handbook"} className="min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div key={turn.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="h-[476px]">
                <Page a={a} marked={turn.phase === "done"} />
              </motion.div>
            </AnimatePresence>
          </Window>
        </div>
      </div>
    </Band>
  );
}
