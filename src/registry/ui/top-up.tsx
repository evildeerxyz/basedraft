"use client";

import { ArrowRightIcon, CaretDownIcon, CheckIcon, PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/*
 * Adding money to a balance, said in what it buys. The amount stands big in the middle: type it,
 * or run the tape under it with a drag, the wheel or the arrow keys, its suggested amounts marked
 * in ink. Under the figure, how long the balance lasts with it at the pace it's spent. What's
 * charged reads as one sentence, the card in it a picker of its own; a top-up that runs by itself
 * is one switch. Paying is a hold, so money never leaves on a slip, and once it's done the column
 * turns over to what changed: the balance and how long it lasts, before and after.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const DAY = 86_400_000;
const EASE = [0.16, 1, 0.3, 1] as const;

export type TopUpMethod = {
  id: string;
  /** How it's named: "Visa", "Amex", "Business checking". */
  brand: string;
  last4: string;
  /** For a card, when it runs out: "08/28". */
  expires?: string;
};

export type TopUpResult = { amount: number; fee: number; total: number; method?: string; autoReload: boolean };

export type TopUpProps = {
  /** What's there now. Raise it once it's paid if you like: what was added is counted from the balance it was paid at. */
  balance: number;
  /** Suggested amounts: marked in ink on the tape, and where it snaps first. */
  presets?: number[];
  defaultAmount?: number;
  /** The tape's step, and the smallest and largest amount at a time. */
  step?: number;
  min?: number;
  max?: number;
  /** What paying costs on top, for an amount. Card fees by default: 2.9% and 30 cents. */
  fee?: (amount: number) => number;
  feeLabel?: string;
  /** What's spent in a day, from which day: says how long the balance lasts, now and with the amount added. */
  pace?: { perDay: number; from: string };
  /** What a dollar buys, said under the amount when there's no pace: { per: 100, unit: "credits" }. */
  rate?: { per: number; unit: string };
  methods?: TopUpMethod[];
  defaultMethod?: string;
  /** Offer a top-up that runs by itself: this amount, when the balance falls under that one. */
  autoReload?: { amount: number; below: number };
  /** Where the receipt goes, said once it's paid. */
  receipt?: string;
  currency?: string;
  title?: string;
  /** Pay on a hold (the default), so it can't go by a slip, or on a press. */
  confirm?: "hold" | "press";
  /** Pays. Throw to say it didn't work: the message shows over the button. */
  onConfirm?: (result: TopUpResult) => Promise<void> | void;
  /** The Done button, once it's paid. */
  onDone?: () => void;
  /** Offer to add a card, at the foot of the list of them. */
  onAddMethod?: () => void;
  /** Without its card or padding, to sit in a dialog or sheet of your own, which pads it. */
  plain?: boolean;
  className?: string;
};

type Paid = TopUpResult & { before: number };

const cardFee = (a: number) => (a > 0 ? Math.round((a * 0.029 + 0.3) * 100) / 100 : 0);

/** A sum of money that rolls to its new figure rather than jumping, or counts up from another. */
function Money({ value, from, currency, className }: { value: number; from?: number; currency: string; className?: string }) {
  const still = useReducedMotion();
  const mv = useMotionValue(from ?? value);
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const text = useTransform(mv, (v) => fmt.format(v));
  useEffect(() => {
    if (still) {
      mv.set(value);
      return;
    }
    const run = animate(mv, value, { duration: from === undefined ? 0.5 : 1.1, ease: EASE });
    return () => run.stop();
  }, [value, from, still, mv]);
  return <motion.span className={cx("tabular-nums", className)}>{text}</motion.span>;
}

/* How far apart the tape's steps are, in pixels. */
const GAP = 9;

/**
 * The amount on a tape that runs under a fixed needle: drag it, turn the wheel over it, press the
 * arrows (Shift for five steps), or press a mark to run to it. It lets go onto the nearest step.
 */
function Tape({ value, onChange, min, max, step, marks, disabled, format }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; marks: number[]; disabled: boolean; format: (n: number) => string }) {
  const still = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(400);
  const pos = useMotionValue(value);
  const grab = useRef<{ x: number; at: number; moved: boolean } | null>(null);
  const last = useRef(value);
  const settle = useRef<AnimationPlaybackControls | null>(null);
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const snap = (v: number) => clamp(Math.round(v / step) * step);
  const first = Math.ceil(min / step) * step;
  const count = Math.floor((max - first) / step);
  const x = useTransform(pos, (p) => w / 2 - ((p - first) / step) * GAP);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A new amount from elsewhere (typed, or a mark pressed): the tape runs to it.
  useEffect(() => {
    if (grab.current || last.current === value) return;
    last.current = value;
    settle.current?.stop();
    settle.current = animate(pos, clamp(value), still ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, still]);

  const emit = (v: number) => {
    const s = snap(v);
    if (s !== last.current) {
      last.current = s;
      onChange(s);
    }
  };
  const letGo = () => {
    settle.current = animate(pos, snap(pos.get()), still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 });
  };

  // The wheel runs it too, sideways or down, without scrolling what it's in.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let t = 0;
    const onWheel = (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      settle.current?.stop();
      const p = clamp(pos.get() + ((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / GAP) * step * 0.6);
      pos.set(p);
      emit(p);
      window.clearTimeout(t);
      t = window.setTimeout(letGo, 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(t);
    };
  });

  const ticks: ReactNode[] = [];
  for (let k = 0; k <= count; k++) {
    const v = first + k * step;
    const mark = marks.includes(v);
    const major = v % (step * 5) === 0;
    const at = k * GAP;
    ticks.push(<line key={v} x1={at} x2={at} y1={mark ? 2 : major ? 8 : 13} y2={26} strokeWidth={mark ? 1.5 : 1} style={{ stroke: mark ? "var(--bd-fg)" : `rgb(var(--bd-ink) / ${major ? 0.3 : 0.16})` }} />);
    if (mark || v % (step * 10) === 0)
      ticks.push(
        <text key={`t${v}`} x={at} y={44} textAnchor="middle" className={cx("text-[11.5px] tabular-nums", mark ? "font-medium" : "")} style={{ fill: mark ? "var(--bd-fg)" : "var(--bd-subtle)" }}>
          {format(v)}
        </text>,
      );
  }

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Amount"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      aria-disabled={disabled || undefined}
      onKeyDown={(e) => {
        const by = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
        if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          return onChange(e.key === "Home" ? min : max);
        }
        if (!by || disabled) return;
        e.preventDefault();
        onChange(snap(value + by * step * (e.shiftKey ? 5 : 1)));
      }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        settle.current?.stop();
        grab.current = { x: e.clientX, at: pos.get(), moved: false };
      }}
      onPointerMove={(e) => {
        const g = grab.current;
        if (!g) return;
        const dx = e.clientX - g.x;
        if (Math.abs(dx) > 3) g.moved = true;
        if (!g.moved) return;
        const p = clamp(g.at - (dx / GAP) * step);
        pos.set(p);
        emit(p);
      }}
      onPointerUp={(e) => {
        const g = grab.current;
        grab.current = null;
        if (!g) return;
        if (g.moved) return letGo();
        // A press without a drag runs to the step pressed.
        const r = e.currentTarget.getBoundingClientRect();
        const to = snap(pos.get() + ((e.clientX - r.left - r.width / 2) / GAP) * step);
        last.current = to;
        onChange(to);
        settle.current = animate(pos, to, still ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 });
      }}
      onPointerCancel={() => {
        grab.current = null;
        letGo();
      }}
      className={cx(
        "relative h-[52px] cursor-grab touch-none select-none overflow-hidden rounded-[10px] outline-none [mask-image:linear-gradient(90deg,transparent,#000_22%,#000_78%,transparent)] focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)] active:cursor-grabbing",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <motion.svg aria-hidden width={count * GAP + 1} height={52} className="absolute left-0 top-0 overflow-visible" style={{ x }}>
        {ticks}
      </motion.svg>
      {/* The needle. */}
      <span aria-hidden className="absolute left-1/2 top-0 h-[28px] w-[2px] -translate-x-1/2 rounded-full bg-[var(--bd-fg)] shadow-[0_0_0_3px_var(--bd-surface)]" />
    </div>
  );
}

/** Pays on a hold: a fill sweeps across while it's held, and letting go early runs it back. Space and Enter hold it too. */
function Pay({ label, hold, busy, disabled, onPay }: { label: string; hold: boolean; busy: boolean; disabled: boolean; onPay: () => void }) {
  const still = useReducedMotion();
  const p = useMotionValue(0);
  const run = useRef<AnimationPlaybackControls | null>(null);
  const width = useTransform(p, (v) => `${v * 100}%`);
  const [holding, setHolding] = useState(false);
  useEffect(() => {
    if (!busy) p.set(0);
  }, [busy, p]);
  const start = () => {
    if (disabled || busy) return;
    if (!hold) return onPay();
    setHolding(true);
    run.current?.stop();
    run.current = animate(p, 1, { duration: (still ? 0.5 : 0.9) * (1 - p.get()), ease: "linear", onComplete: onPay });
  };
  const stop = () => {
    setHolding(false);
    if (p.get() >= 1) return;
    run.current?.stop();
    run.current = animate(p, 0, { duration: 0.22, ease: EASE });
  };
  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-label={busy ? "Paying" : label}
      onPointerDown={(e) => {
        if (e.button === 0) start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stop()}
      onClick={(e) => e.preventDefault()}
      className="relative isolate inline-flex h-12 w-full select-none items-center justify-center overflow-hidden rounded-full text-[15px] font-medium text-[var(--bd-ui-ink-text)] outline-none transition-[filter,opacity,scale] duration-200 [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.2),0_8px_20px_-10px_rgb(var(--bd-shade)/0.5)] hover:brightness-[1.1] focus-visible:shadow-[0_0_0_2px_var(--bd-surface),0_0_0_4px_var(--bd-ui-focus)] active:scale-[0.99] disabled:opacity-40 aria-busy:pointer-events-none"
    >
      <motion.span aria-hidden className="absolute inset-y-0 left-0 -z-10 bg-current opacity-[0.16]" style={{ width }} />
      <AnimatePresence mode="popLayout" initial={false}>
        {busy ? (
          <motion.span key="busy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="inline-flex items-center gap-2.5">
            <svg viewBox="0 0 20 20" className="size-4 animate-spin motion-reduce:animate-none" aria-hidden>
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.25" />
              <path d="M10 2a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
            </svg>
            Paying
          </motion.span>
        ) : (
          <motion.span key={holding ? "hold" : "rest"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="tabular-nums">
            {holding ? "Keep holding" : label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/** The card in the sentence: a quiet button that opens the list of them under it. */
function Method({ methods, value, onChange, onAdd, disabled }: { methods: TopUpMethod[]; value?: string; onChange: (id: string) => void; onAdd?: () => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const picked = methods.find((m) => m.id === value);
  const still = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  if (!picked) return null;
  const choosable = methods.length > 1 || !!onAdd;
  return (
    <span ref={box} className="relative inline-block">
      <button
        type="button"
        disabled={disabled || !choosable}
        aria-haspopup={choosable ? "listbox" : undefined}
        aria-expanded={choosable ? open : undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-[6px] font-medium text-[var(--bd-fg)] underline decoration-[rgb(var(--bd-ink)/0.25)] underline-offset-[5px] outline-none transition-colors hover:decoration-[var(--bd-fg)] focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)] disabled:no-underline"
      >
        {picked.brand} ···· {picked.last4}
        {choosable && <CaretDownIcon weight="regular" className={cx("size-3 transition-transform", open && "rotate-180")} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="listbox"
            aria-label="Pay with"
            initial={still ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 520, damping: 36 }}
            className="absolute bottom-full left-1/2 z-20 mb-2 grid w-64 -translate-x-1/2 origin-bottom rounded-[14px] bg-[var(--bd-raised)] p-1.5 text-left shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_16px_40px_-12px_rgb(var(--bd-shade)/0.35)]"
          >
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={m.id === value}
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className="flex h-10 items-center gap-2 rounded-[10px] px-2.5 text-left text-[13.5px] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] focus-visible:bg-[rgb(var(--bd-ink)/0.06)]"
              >
                <span className="min-w-0 flex-1 truncate">
                  {m.brand} ···· {m.last4}
                </span>
                {m.expires && <span className="shrink-0 tabular-nums text-[var(--bd-subtle)]">{m.expires}</span>}
                <CheckIcon weight="bold" className={cx("size-3.5 shrink-0", m.id === value ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
            {onAdd && (
              <button type="button" onClick={onAdd} className="flex h-10 items-center gap-2 rounded-[10px] px-2.5 text-left text-[13.5px] text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)]">
                <PlusIcon weight="regular" className="size-3.5" />
                Add a card
              </button>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function Toggle({ checked, onChange, label, children }: { checked: boolean; onChange: (v: boolean) => void; label: string; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0 text-[13.5px] leading-5 text-[var(--bd-muted)]">{children}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx("relative h-5 w-[34px] shrink-0 rounded-full outline-none transition-colors duration-200 focus-visible:shadow-[0_0_0_2px_var(--bd-surface),0_0_0_4px_var(--bd-ui-focus)]", checked ? "[background:var(--bd-ui-ink)]" : "bg-[var(--bd-ui-track)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]")}
      >
        <motion.span className="absolute top-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)]" initial={false} animate={{ left: checked ? 16 : 2 }} transition={{ type: "spring", stiffness: 600, damping: 36 }} />
      </button>
    </label>
  );
}

export function TopUp({
  balance,
  presets = [25, 50, 100, 250],
  defaultAmount = presets[Math.min(2, presets.length - 1)] ?? 50,
  step = 5,
  min = 5,
  max = 1000,
  fee = cardFee,
  feeLabel = "card fee",
  pace,
  rate,
  methods = [],
  defaultMethod,
  autoReload,
  receipt,
  currency = "USD",
  title = "Add funds",
  confirm = "hold",
  onConfirm,
  onDone,
  onAddMethod,
  plain = false,
  className,
}: TopUpProps) {
  const still = useReducedMotion();
  const ids = useId();
  const [text, setText] = useState(String(defaultAmount));
  const [method, setMethod] = useState(defaultMethod ?? methods[0]?.id);
  const [auto, setAuto] = useState(false);
  const [phase, setPhase] = useState<"form" | "paying" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<Paid | null>(null);

  const whole = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
  const amount = Number(text) || 0;
  const charge = fee(amount);
  const total = Math.round((amount + charge) * 100) / 100;
  const short = amount > 0 && amount < min;
  const over = amount > max;
  const ready = amount >= min && !over && (!methods.length || !!method);
  const picked = methods.find((m) => m.id === method);
  // How long a balance lasts at the pace given, as the day it runs out.
  const lasts = (b: number) => (pace && pace.perDay > 0 ? new Date(Date.parse(`${pace.from}T00:00:00Z`) + Math.floor(b / pace.perDay) * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : null);

  const type = (raw: string) => {
    // Digits and one point, two places after it at most, no leading zeros.
    const clean = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    const [w = "", part] = clean.split(".");
    setText(`${w.replace(/^0+(?=\d)/, "").slice(0, 6)}${part !== undefined ? `.${part.slice(0, 2)}` : ""}`);
    setError(null);
  };

  const pay = async () => {
    if (!ready || phase !== "form") return;
    const result: TopUpResult = { amount, fee: charge, total, method, autoReload: auto };
    setPhase("paying");
    setError(null);
    try {
      await (onConfirm ? onConfirm(result) : new Promise((r) => setTimeout(r, 1400)));
      setPaid({ ...result, before: balance });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "That didn't go through. Try another card.");
      setPhase("form");
    }
  };

  const swap = still ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, y: 10, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -8, filter: "blur(4px)" } };
  const now = lasts(balance);
  const then = lasts(balance + amount);

  return (
    <div className={cx("relative w-full text-[var(--bd-fg)]", !plain && "rounded-[24px] bg-[var(--bd-surface)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),0_1px_2px_rgb(var(--bd-shade)/0.04),0_12px_32px_-16px_rgb(var(--bd-shade)/0.18)]", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {phase !== "done" ? (
          <motion.div key="form" {...swap} transition={{ duration: 0.28, ease: EASE }} className={cx("grid gap-6", !plain && "p-6 sm:p-7")}>
            <div className="grid gap-1 pr-8">
              <h2 className="text-[17px] font-semibold tracking-[-0.012em]">{title}</h2>
              <p className="text-[13.5px] text-[var(--bd-muted)]">
                <span className="tabular-nums text-[var(--bd-fg)]">{whole(balance)}</span> now{now ? `, enough until about ${now}` : ""}.
              </p>
            </div>

            {/* How much: the figure, typed, and the tape under it. */}
            <div className="grid gap-4">
              <div className="grid justify-items-center gap-2">
                <label htmlFor={`${ids}-amount`} className="flex cursor-text items-baseline justify-center text-[56px] font-semibold leading-none tracking-[-0.04em]">
                  <span className={cx("mr-0.5 transition-colors", amount ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)]")}>$</span>
                  <input
                    id={`${ids}-amount`}
                    inputMode="decimal"
                    autoComplete="off"
                    value={text}
                    onChange={(e) => type(e.target.value)}
                    disabled={phase === "paying"}
                    placeholder="0"
                    aria-label="Amount"
                    aria-invalid={short || over || undefined}
                    aria-describedby={`${ids}-hint`}
                    style={{ width: `${Math.max(1, text.length || 1) * 0.6 + 0.06}em` }}
                    className="min-w-0 max-w-full bg-transparent text-left tabular-nums outline-none placeholder:text-[var(--bd-subtle)] disabled:opacity-100"
                  />
                </label>
                <p id={`${ids}-hint`} aria-live="polite" className={cx("h-5 text-[14px] tabular-nums transition-colors", short || over ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-muted)]")}>
                  {short
                    ? `At least ${whole(min)}`
                    : over
                      ? `At most ${whole(max)} at a time`
                      : then && amount
                        ? <>Lasts until about <span className="font-medium text-[var(--bd-fg)]">{then}</span></>
                        : rate
                          ? `${(amount * rate.per).toLocaleString("en-US", { maximumFractionDigits: 0 })} ${rate.unit}`
                          : "Added to your balance right away"}
                </p>
              </div>
              <Tape value={Math.min(max, Math.max(min, amount))} onChange={(v) => type(String(v))} min={min} max={max} step={step} marks={presets} disabled={phase === "paying"} format={(n) => whole(n)} />
            </div>

            <div className="grid gap-4 border-t border-[var(--bd-line-subtle)] pt-5">
              {/* What's charged, said once. */}
              <p className="text-pretty text-[14.5px] leading-6 text-[var(--bd-muted)]">
                <Money value={total} currency={currency} className="font-medium text-[var(--bd-fg)]" /> today
                {picked && (
                  <>
                    {" "}to <Method methods={methods} value={method} onChange={setMethod} onAdd={onAddMethod} disabled={phase === "paying"} />
                  </>
                )}
                , with a <Money value={charge} currency={currency} /> {feeLabel}.
              </p>
              {autoReload && (
                <Toggle checked={auto} onChange={setAuto} label="Top up by itself">
                  Top up {whole(autoReload.amount)} by itself when it falls under {whole(autoReload.below)}
                </Toggle>
              )}
            </div>

            <div className="grid gap-3">
              <AnimatePresence initial={false}>
                {error && (
                  <motion.p key="error" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2 overflow-hidden text-[13.5px] leading-5 text-[var(--bd-ui-stop)]">
                    <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <Pay label={amount ? `${confirm === "hold" ? "Hold to pay" : "Pay"} ${whole(total)}` : "Enter an amount"} hold={confirm === "hold"} busy={phase === "paying"} disabled={!ready} onPay={() => void pay()} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" {...swap} transition={{ duration: 0.32, ease: EASE }} className={cx("grid gap-6", !plain && "p-6 sm:p-7")}>
            <div className="grid gap-3 pr-8">
              <motion.span
                aria-hidden
                className="grid size-9 place-items-center rounded-full text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]"
                initial={still ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 22, delay: 0.1 }}
              >
                <CheckIcon weight="bold" className="size-4" />
              </motion.span>
              <p className="text-balance text-[24px] font-semibold leading-tight tracking-[-0.022em]">
                {whole(paid?.amount ?? 0)} added<span className="text-[var(--bd-subtle)]">{lasts((paid?.before ?? 0) + (paid?.amount ?? 0)) ? `, enough until about ${lasts((paid?.before ?? 0) + (paid?.amount ?? 0))}.` : "."}</span>
              </p>
            </div>

            {/* What changed, before and after. */}
            <dl className="grid text-[14px]">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-y border-[var(--bd-line-subtle)] py-3.5">
                <dt className="text-[var(--bd-muted)]">Balance</dt>
                <dd className="flex items-center gap-2 tabular-nums">
                  <span className="text-[var(--bd-subtle)]">{whole(paid?.before ?? 0)}</span>
                  <ArrowRightIcon aria-hidden weight="regular" className="size-3.5 text-[var(--bd-subtle)]" />
                  <Money from={paid?.before} value={(paid?.before ?? 0) + (paid?.amount ?? 0)} currency={currency} className="font-medium" />
                </dd>
              </div>
              {pace && (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--bd-line-subtle)] py-3.5">
                  <dt className="text-[var(--bd-muted)]">Lasts until about</dt>
                  <dd className="flex items-center gap-2 tabular-nums">
                    <span className="text-[var(--bd-subtle)]">{lasts(paid?.before ?? 0)}</span>
                    <ArrowRightIcon aria-hidden weight="regular" className="size-3.5 text-[var(--bd-subtle)]" />
                    <span className="font-medium">{lasts((paid?.before ?? 0) + (paid?.amount ?? 0))}</span>
                  </dd>
                </div>
              )}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--bd-line-subtle)] py-3.5">
                <dt className="text-[var(--bd-muted)]">Charged{picked ? ` to ${picked.brand} ···· ${picked.last4}` : ""}</dt>
                <dd className="tabular-nums">{whole(paid?.total ?? 0)}</dd>
              </div>
              {paid?.autoReload && autoReload && (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--bd-line-subtle)] py-3.5">
                  <dt className="text-[var(--bd-muted)]">Tops up by itself</dt>
                  <dd className="tabular-nums">
                    {whole(autoReload.amount)} under {whole(autoReload.below)}
                  </dd>
                </div>
              )}
            </dl>
            {receipt && <p className="-mt-3 text-[13px] text-[var(--bd-muted)]">A receipt is on its way to {receipt}.</p>}

            <button
              type="button"
              onClick={() => {
                if (onDone) onDone();
                else {
                  setPhase("form");
                  setPaid(null);
                }
              }}
              className="h-12 w-full rounded-full bg-[var(--bd-surface)] text-[15px] font-medium shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.03)] focus-visible:shadow-[0_0_0_2px_var(--bd-surface),0_0_0_4px_var(--bd-ui-focus)]"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
