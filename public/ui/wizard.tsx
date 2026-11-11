"use client";

import { ArrowLeftIcon, ArrowRightIcon, KeyReturnIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

/*
 * A form in steps. The rail at the top fills as you go, and each step slides in from the side
 * you're heading, the card easing to its height. Next checks the step first: if something's
 * missing it says what, and the cursor lands on it. Enter moves on. The last step reads it all
 * back with a way into each part to change it; then it sends, with the button pulsing while it
 * does, and says it's done.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
const DRAW = { duration: 0.32, ease: [0.16, 1, 0.3, 1] } as const;
const NONE = { duration: 0 } as const;

type Values = Record<string, unknown>;
export type WizardErrors<V extends Values> = Partial<Record<keyof V & string, string>>;

export type WizardApi<V extends Values> = {
  values: V;
  errors: WizardErrors<V>;
  set: <K extends keyof V & string>(name: K, value: V[K]) => void;
  /** For a text field: its name, value and change, marked when it's wrong, and found when it needs fixing. */
  field: (name: keyof V & string) => { name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; "aria-invalid": true | undefined; "data-wizard-field": string };
  /** For a choice, like a radio group: its value and change. Put data-wizard-field on what's around it. */
  choice: (name: keyof V & string) => { value: string | undefined; onValueChange: (value: string) => void };
  next: () => void;
  back: () => void;
};

export type WizardSummaryRow = { label: string; value: ReactNode };

export type WizardStep<V extends Values> = {
  id: string;
  title: string;
  description?: ReactNode;
  render: (api: WizardApi<V>) => ReactNode;
  /** What's wrong, by field name. Next waits until it returns nothing. */
  validate?: (values: V) => WizardErrors<V> | undefined;
  /** How the step reads back on the review. */
  summary?: (values: V) => WizardSummaryRow[];
};

export type WizardProps<V extends Values> = {
  steps: WizardStep<V>[];
  initialValues: V;
  /** Sent the values at the end. While its promise runs the button pulses; if it throws, its message shows. */
  onSubmit?: (values: V) => void | Promise<void>;
  /** The last step, reading it all back. False leaves it out. */
  review?: { title?: string; description?: ReactNode } | false;
  submitLabel?: string;
  done?: { title?: ReactNode; description?: ReactNode | ((values: V) => ReactNode); action?: { label: string; href?: string; onClick?: () => void }; restart?: string };
  onStepChange?: (index: number, id: string) => void;
  /** Names the form for screen readers. */
  label?: string;
  className?: string;
};

/* A 4 by 4 ordered-dither matrix: each dot's turn in the pulse, so the field shimmers across. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function Dither() {
  return (
    <span aria-hidden className="absolute inset-0 grid place-items-center">
      <span className="grid gap-[2.5px]" style={{ gridTemplateColumns: "repeat(11, 3px)" }}>
        {Array.from({ length: 33 }, (_, i) => {
          const c = i % 11;
          const r = Math.floor(i / 11);
          const delay = (c / 11) * 0.8 + (BAYER[(r % 4) * 4 + (c % 4)] / 16) * 0.45;
          return <span key={i} className="size-[3px] rounded-full bg-current opacity-60 animate-[bd-ui-dither_1.15s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${delay.toFixed(3)}s` }} />;
        })}
      </span>
    </span>
  );
}

const FOCUSABLE = 'input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])';
const BTN = "group/button relative isolate inline-flex h-10 shrink-0 select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full px-5 text-sm font-medium transition-[background-color,color,filter,scale,box-shadow] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] [&_svg]:size-4";
const INK = "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.2),0_6px_16px_-8px_rgb(var(--bd-shade)/0.5)] hover:brightness-[1.12]";
const METAL = "border-[1.5px] border-transparent text-white [background:var(--bd-ui-metal-fill)_padding-box,var(--bd-ui-metal-edge)_border-box] shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(0_0_0/0.18),0_8px_20px_-10px_rgb(0_0_0/0.5)] hover:brightness-[1.14]";
const GHOST = "text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)]";

const slide = {
  enter: (d: number) => ({ x: d * 44, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -44, opacity: 0 }),
};
const fade = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

export function Wizard<V extends Values>({ steps, initialValues, onSubmit, review = {}, submitLabel = "Finish", done, onStepChange, label, className }: WizardProps<V>) {
  const still = !!useReducedMotion();
  const reviewAt = review === false ? -1 : steps.length;
  const total = steps.length + (review === false ? 0 : 1);
  const names = [...steps.map((s) => s.title), ...(review === false ? [] : [review.title ?? "Review"])];

  const [at, setAt] = useState(0);
  const [dir, setDir] = useState(1);
  const [reached, setReached] = useState(0);
  const [values, setValues] = useState<V>(initialValues);
  const [errors, setErrors] = useState<WizardErrors<V>>({});
  const [fromReview, setFromReview] = useState(false);
  const [phase, setPhase] = useState<"edit" | "sending" | "done">("edit");
  const [failed, setFailed] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const nudge = useAnimationControls();

  // Where the cursor goes once the step is in: the first field that needs fixing, or the new step's first.
  const inner = useRef<HTMLDivElement>(null);
  const [aim, setAim] = useState<null | { kind: "step" } | { kind: "fix"; names: string[] }>(null);
  const key = phase === "done" ? "done" : at === reviewAt ? "review" : steps[at]?.id;
  const handled = useRef(aim);
  useEffect(() => {
    if (!aim || handled.current === aim) return;
    handled.current = aim;
    const frame = requestAnimationFrame(() => {
      const root = inner.current?.querySelector<HTMLElement>(`[data-wizard-step="${key}"]`);
      if (!root) return;
      const fields = [...root.querySelectorAll<HTMLElement>("[data-wizard-field]")];
      const field = aim.kind === "fix" ? fields.find((n) => aim.names.includes(n.dataset.wizardField!)) : fields[0];
      const target = field?.matches(FOCUSABLE) ? field : field?.querySelector<HTMLElement>('[role="radio"][tabindex="0"], ' + FOCUSABLE);
      (target ?? root.querySelector<HTMLElement>("[data-wizard-heading]"))?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [aim, key]);

  const set = <K extends keyof V & string>(name: K, value: V[K]) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const n = { ...e };
      delete n[name];
      return n;
    });
  };
  const check = (i: number, v: V) => Object.fromEntries(Object.entries(steps[i]?.validate?.(v) ?? {}).filter(([, m]) => m)) as WizardErrors<V>;
  const go = (to: number) => {
    setDir(to > at ? 1 : -1);
    setAt(to);
    setReached((r) => Math.max(r, to));
    setErrors({});
    setFailed(null);
    setAim({ kind: "step" });
    setSaid(`Step ${to + 1} of ${total}: ${names[to]}`);
    onStepChange?.(to, to === reviewAt ? "review" : steps[to].id);
  };
  const block = (i: number, bad: WizardErrors<V>) => {
    if (i !== at) go(i);
    setErrors(bad);
    const list = Object.values(bad) as string[];
    setAim({ kind: "fix", names: Object.keys(bad) });
    setSaid(list.length === 1 ? list[0] : `${list.length} things to fix: ${list.join(". ")}`);
    if (!still) nudge.start({ x: [0, -5, 5, -3, 2, 0], transition: { duration: 0.36, ease: "easeOut" } });
  };
  /* Every step before this one, in order: the first with something wrong is where you're taken. */
  const firstWrong = (upto: number, v: V) => {
    for (let i = 0; i < Math.min(upto, steps.length); i++) {
      const bad = check(i, v);
      if (Object.keys(bad).length) return { i, bad };
    }
    return null;
  };

  const submit = async (v: V) => {
    const wrong = firstWrong(steps.length, v);
    if (wrong) return block(wrong.i, wrong.bad);
    setPhase("sending");
    setFailed(null);
    setSaid("Sending");
    try {
      await onSubmit?.(v);
      setAim({ kind: "step" });
      setPhase("done");
      setSaid("Done");
    } catch (err) {
      setPhase("edit");
      setFailed(err instanceof Error && err.message ? err.message : "That didn't go through. Try again.");
    }
  };
  /** On from here. Given values when a change made this same moment hasn't reached state yet. */
  const next = (v: V = values) => {
    if (phase !== "edit") return;
    if (at === reviewAt) return void submit(v);
    const bad = check(at, v);
    if (Object.keys(bad).length) return block(at, bad);
    if (fromReview && reviewAt >= 0) {
      setFromReview(false);
      return go(reviewAt);
    }
    if (at + 1 >= steps.length && reviewAt < 0) return void submit(v);
    go(at + 1);
  };
  const back = () => {
    if (phase !== "edit" || at === 0) return;
    setFromReview(false);
    go(at - 1);
  };
  /* From the rail or the review's Edit: back freely, forward only past steps that check out. */
  const jump = (to: number, edit = false) => {
    if (phase !== "edit" || to === at) return;
    if (to > at) {
      const wrong = firstWrong(to, values);
      if (wrong) return block(wrong.i, wrong.bad);
    }
    setFromReview(edit);
    go(to);
  };
  const restart = () => {
    setValues(initialValues);
    setReached(0);
    setFromReview(false);
    setPhase("edit");
    setDir(-1);
    setAt(0);
    setErrors({});
    setAim({ kind: "step" });
  };

  const api: WizardApi<V> = {
    values,
    errors,
    set,
    field: (name) => ({
      name,
      value: String(values[name] ?? ""),
      onChange: (e) => set(name, e.target.value as V[typeof name]),
      "aria-invalid": errors[name] ? true : undefined,
      "data-wizard-field": name,
    }),
    choice: (name) => ({ value: values[name] == null ? undefined : String(values[name]), onValueChange: (v) => set(name, v as V[typeof name]) }),
    next: () => next(),
    back,
  };

  // Enter moves on: from a field the form does it; on a choice, it picks it and moves on.
  const onKey = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    const t = e.target as HTMLElement;
    if (t.getAttribute("role") !== "radio") return;
    e.preventDefault();
    t.click();
    // The click's change hasn't reached state yet: check with it in.
    const name = t.closest<HTMLElement>("[data-wizard-field]")?.dataset.wizardField;
    next(name && t.dataset.value !== undefined ? { ...values, [name]: t.dataset.value } : values);
  };
  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    next();
  };

  // The card eases to the height of the step in it.
  const [height, setHeight] = useState<number | "auto">("auto");
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const finished = phase === "done";
  const sending = phase === "sending";
  const onReview = at === reviewAt && !finished;
  const step = steps[at];
  const motionSet = still ? fade : slide;

  return (
    <form noValidate aria-label={label} onSubmit={onFormSubmit} onKeyDown={onKey} className={cx("@container relative w-full rounded-[24px] bg-[var(--bd-surface)] p-5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-raised),0_0_0_1px_rgb(var(--bd-ink)/0.06)] @md:p-6", className)}>
      {/* The rail: one segment a step, filling as you go. The ones you've been to take you back. */}
      <div className="flex items-baseline justify-between gap-3">
        <span role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={finished ? total : at + 1} aria-valuetext={finished ? "Done" : `Step ${at + 1} of ${total}: ${names[at]}`} className="text-[12.5px] tabular-nums text-[var(--bd-subtle)]">
          {finished ? "Done" : `Step ${at + 1} of ${total}`}
        </span>
        {!finished && <span className="truncate text-[12.5px] font-medium text-[var(--bd-muted)] @lg:hidden">{names[at]}</span>}
      </div>
      <ol className="mt-1.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {names.map((n, i) => {
          const can = !finished && !sending && i !== at && i <= reached;
          const filled = finished || i <= at;
          return (
            <li key={n + i} className="min-w-0">
              <button
                type="button"
                disabled={!can}
                aria-current={i === at && !finished ? "step" : undefined}
                aria-label={`${n}${i < at || finished ? ", done" : i === at ? ", current" : ""}`}
                onClick={() => jump(i)}
                className={cx("group/seg block w-full rounded-[6px] py-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]", can ? "cursor-pointer" : "cursor-default")}
              >
                <span className="block h-1 overflow-hidden rounded-full bg-[var(--bd-ui-track)]">
                  <motion.span className="block h-full origin-left rounded-full [background:var(--bd-ui-ink)]" initial={false} animate={{ scaleX: filled ? 1 : 0 }} transition={still ? NONE : { ...SOFT, delay: filled ? Math.max(0, i - at + 1) * 0.04 : 0 }} />
                </span>
                <span className={cx("mt-2 hidden truncate text-[12.5px] transition-colors duration-150 @lg:block", i === at && !finished ? "font-medium text-[var(--bd-fg)]" : i < at || finished ? "text-[var(--bd-muted)] group-hover/seg:text-[var(--bd-fg)]" : "text-[var(--bd-subtle)]")}>{n}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* The step, sliding in from the side you're heading. */}
      <motion.div animate={{ height }} initial={false} transition={still ? NONE : SOFT} className="relative -mx-2 mt-3 overflow-hidden px-2">
        <div ref={inner} className="relative py-1">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div key={key} data-wizard-step={key} custom={dir} variants={motionSet} initial="enter" animate="center" exit="exit" transition={still ? { duration: 0.15 } : SNAPPY} className="w-full">
                {finished ? (
                  <div className="grid justify-items-center py-6 text-center">
                    <span className="relative grid size-14 place-items-center">
                      <motion.span className="absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_8px_20px_-10px_rgb(var(--bd-shade)/0.6)] [background:var(--bd-ui-ink)]" initial={still ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 22 }} />
                      <svg aria-hidden viewBox="0 0 20 20" className="relative size-6 text-[var(--bd-ui-ink-text)]">
                        <motion.path d="M5 10.5l3.2 3.1L15 7" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={still ? NONE : { ...DRAW, delay: 0.16 }} />
                      </svg>
                    </span>
                    <h3 data-wizard-heading="" tabIndex={-1} className="mt-4 text-[17px] font-semibold tracking-[-0.01em] outline-none">
                      {done?.title ?? "All done"}
                    </h3>
                    <p className="mt-1 max-w-[36ch] text-[13.5px] leading-relaxed text-[var(--bd-muted)]">{typeof done?.description === "function" ? done.description(values) : (done?.description ?? "It's been sent.")}</p>
                    {(done?.action || done?.restart) && (
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                        {done?.action &&
                          (done.action.href ? (
                            <a href={done.action.href} onClick={done.action.onClick} className={cx(BTN, INK)}>
                              {done.action.label}
                              <ArrowRightIcon weight="regular" />
                            </a>
                          ) : (
                            <button type="button" onClick={done.action.onClick} className={cx(BTN, INK)}>
                              {done.action.label}
                              <ArrowRightIcon weight="regular" />
                            </button>
                          ))}
                        {done?.restart && (
                          <button type="button" onClick={restart} className={cx(BTN, GHOST)}>
                            {done.restart}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : onReview ? (
                  <div>
                    <h3 data-wizard-heading="" tabIndex={-1} className="text-[17px] font-semibold tracking-[-0.01em] outline-none">
                      {(review !== false && review.title) || "Review"}
                    </h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--bd-muted)]">{(review !== false && review.description) || "Check it over. Anything you change brings you back here."}</p>
                    <div className="mt-4 divide-y divide-[var(--bd-line-subtle)] rounded-[16px] shadow-[inset_0_0_0_1px_var(--bd-line)]">
                      {steps.map((s, i) => (
                        <section key={s.id} aria-label={s.title} className="flex items-start gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[12px] font-medium text-[var(--bd-subtle)]">{s.title}</h4>
                            {s.summary && (
                              <dl className="mt-1 grid gap-0.5">
                                {s.summary(values).map((row) => (
                                  <div key={row.label} className="flex min-w-0 items-baseline gap-2 text-[13.5px]">
                                    <dt className="sr-only">{row.label}</dt>
                                    <dd className="min-w-0 truncate text-[var(--bd-fg)]">{row.value}</dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => jump(i, true)}
                            aria-label={`Edit ${s.title}`}
                            disabled={sending}
                            className="-mr-1.5 inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-medium text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)] active:scale-[0.96] disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
                          >
                            Edit
                          </button>
                        </section>
                      ))}
                    </div>
                  </div>
                ) : step ? (
                  <div>
                    <h3 data-wizard-heading="" tabIndex={-1} className="text-[17px] font-semibold tracking-[-0.01em] outline-none">
                      {step.title}
                    </h3>
                    {step.description && <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--bd-muted)]">{step.description}</p>}
                    <div className="mt-4">{step.render(api)}</div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
        </div>
      </motion.div>

      {/* Back, and on: Continue, back to the review when that's where you came from, or the last word. */}
      <AnimatePresence initial={false}>
        {!finished && (
          <motion.div key="foot" initial={false} exit={still ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0, paddingTop: 0 }} transition={SOFT} className="mt-5 overflow-hidden border-t border-[var(--bd-line-subtle)] pt-4">
            <AnimatePresence initial={false}>
              {failed && (
                <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SNAPPY} className="mb-3 flex items-start gap-1.5 text-[13px] text-[var(--bd-ui-stop)] [&_svg]:mt-px [&_svg]:size-4 [&_svg]:shrink-0">
                  <WarningCircleIcon weight="duotone" />
                  {failed}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <button type="button" onClick={back} disabled={sending} className={cx(BTN, GHOST, "-ml-2 px-3.5", at === 0 && "invisible")} tabIndex={at === 0 ? -1 : undefined} aria-hidden={at === 0 || undefined}>
                <ArrowLeftIcon weight="regular" />
                Back
              </button>
              <span aria-hidden className="ml-auto hidden items-center gap-1.5 text-[12px] text-[var(--bd-subtle)] @md:flex">
                <kbd className="grid h-5 place-items-center rounded-[5px] bg-[var(--bd-ui-track)] px-1.5 font-sans text-[11px] font-medium text-[var(--bd-muted)] [&_svg]:size-3">
                  <KeyReturnIcon weight="regular" />
                </kbd>
                to {onReview ? "finish" : "continue"}
              </span>
              <motion.span animate={nudge} className="ml-auto inline-flex @md:ml-0">
                <button type="submit" disabled={sending} aria-busy={sending || undefined} className={cx(BTN, onReview ? METAL : INK, sending && "!opacity-100")}>
                  {onReview && <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 -translate-x-[110%] bg-[linear-gradient(105deg,transparent_30%,rgb(255_255_255/0.22)_50%,transparent_70%)] transition-transform duration-700 ease-[var(--bd-ease)] group-hover/button:translate-x-[110%] motion-reduce:hidden" />}
                  <span className={cx("inline-flex items-center gap-2 transition-opacity duration-150", sending && "opacity-0")}>
                    {onReview ? submitLabel : fromReview ? "Back to review" : "Continue"}
                    {!onReview && <ArrowRightIcon weight="regular" />}
                  </span>
                  {sending && <Dither />}
                </button>
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <span role="status" aria-live="polite" className="sr-only">
        {said}
      </span>
    </form>
  );
}
