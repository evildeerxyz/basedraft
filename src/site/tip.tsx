"use client";

import { ArrowUpRightIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { TIP } from "@/lib/tip";
import { cn } from "@/lib/utils";
import { ClaudeMark } from "./claude-mark";
import { Dialog, DialogClose } from "./dialog";
import { Note } from "./plan-parts";

/*
 * Buy me a Claude plan: basedraft is free and open source, and anyone who'd like to can put any
 * amount toward the Claude plan that builds it. The button is in the header for everyone; the
 * dialog takes an amount, with Claude's plans as presets, and sends you on to Whop to pay. No
 * account needed here. Whop sends you back to the home page, which says thank you (shell.tsx).
 */

let shown = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function openTip() {
  shown = true;
  emit();
}
const closeTip = () => {
  shown = false;
  emit();
};

/** Whether payments are connected, asked once per visit. */
let connected: Promise<boolean> | null = null;
const isConnected = () =>
  (connected ??= fetch("/api/tip", { cache: "no-store" })
    .then((r) => r.json() as Promise<{ open?: boolean }>)
    .then((b) => b.open === true)
    .catch(() => {
      connected = null;
      return true;
    }));

/** "20", "20.5", "1,000.25": what's typed, as dollars, or NaN. */
const dollars = (text: string) => (text.trim() ? Number(text.replace(/,/g, "")) : NaN);
const fits = (n: number) => Number.isFinite(n) && n >= TIP.min && n <= TIP.max;
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

const SIZE = {
  /** The header's: 36px, the words after the mark. */
  md: "h-9 gap-2 pl-3 pr-3.5",
  /** Just the mark, where the header is short of room. */
  mark: "size-9",
  /** The phone menu's and the footer's: 48px. */
  lg: "h-12 gap-2.5 px-6",
};

/** The button, wherever it shows: Claude's mark, and what it does. */
export function TipButton({ size = "md", className }: { size?: keyof typeof SIZE; className?: string }) {
  const mark = size === "mark";
  return (
    <button type="button" onClick={openTip} aria-label={mark ? "Buy me a Claude plan" : undefined} title={mark ? "Buy me a Claude plan" : undefined} className={cn("inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full text-ui font-medium text-fg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-fg)_14%,transparent)] transition-[background-color,scale] duration-200 hover:bg-surface-2 active:scale-[0.98]", SIZE[size], className)}>
      <ClaudeMark size={size === "lg" ? 17 : 15} />
      {!mark && "Buy me a Claude plan"}
    </button>
  );
}

export function TipModal() {
  const open = useSyncExternalStore(subscribe, () => shown, () => false);
  // The dialog draws its content only while open, so each opening starts a fresh form.
  return (
    <Dialog open={open} onClose={closeTip} labelledBy="tip-title" describedBy="tip-body" className="max-w-[440px]">
      <DialogClose onClose={closeTip} />
      <TipForm />
    </Dialog>
  );
}

function TipForm() {
  const id = useId();
  const field = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(String(TIP.initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    let on = true;
    void isConnected().then((c) => on && setOpen(c));
    return () => {
      on = false;
    };
  }, []);

  const amount = dollars(text);
  const ok = fits(amount);
  // Only once something's typed: an empty field just waits.
  const hint = !text.trim() || ok ? null : `From ${money(TIP.min)} to ${money(TIP.max)}.`;

  const type = (v: string) => {
    // Digits and one point, two places after it.
    const clean = v.replace(/[^\d.]/g, "").replace(/(\..*?)\./g, "$1");
    const [whole, cents] = clean.split(".");
    setText(cents === undefined ? whole.slice(0, 6) : `${whole.slice(0, 6)}.${cents.slice(0, 2)}`);
    setError(null);
  };
  const pick = (n: number) => {
    setText(String(n));
    setError(null);
    field.current?.focus();
  };

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok || busy || !open) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (body.url) return window.location.assign(body.url);
      setError(body.error ?? "Whop didn't open a checkout. Try again in a moment.");
    } catch {
      setError("That didn't go through. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <form noValidate onSubmit={pay}>
      <div className="px-6 pb-5 pt-6">
        <span className="grid size-11 place-items-center rounded-[14px] bg-[color-mix(in_srgb,var(--bd-fg)_5%,var(--bd-surface))]">
          <ClaudeMark size={22} />
        </span>
        <h2 id="tip-title" className="mt-4 text-title">
          Buy me a Claude plan
        </h2>
        <p id="tip-body" className="mt-2 text-pretty text-body text-muted">
          basedraft is free and open source, built with Claude Code. If it saved you time, put any amount toward the plan that builds it.
        </p>
      </div>

      {/* The amount on a card, set in a soft frame with the plans under it. */}
      <div className="px-6">
        <div className="rounded-[20px] bg-fg/[0.035] p-1.5">
          <label htmlFor={`${id}-amount`} className="flex cursor-text items-baseline gap-1 rounded-[15px] bg-raised px-4 pb-3 pt-2.5 shadow-[0_1px_2px_rgb(var(--bd-shade)/0.06),0_0_0_1px_rgb(var(--bd-ink)/0.06)] has-focus-visible:shadow-[0_1px_2px_rgb(var(--bd-shade)/0.06),0_0_0_2px_var(--bd-fg)]">
            <span aria-hidden className="text-[30px] font-medium leading-none tracking-[-0.03em] text-subtle">
              $
            </span>
            <input
              ref={field}
              id={`${id}-amount`}
              data-autofocus
              inputMode="decimal"
              autoComplete="off"
              aria-label="Amount in US dollars"
              aria-invalid={hint ? true : undefined}
              aria-describedby={hint ? `${id}-hint` : undefined}
              value={text}
              onChange={(e) => type(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="20"
              className="min-w-0 flex-1 bg-transparent text-[44px] font-medium leading-[1.1] tracking-[-0.04em] tabular-nums text-fg outline-none placeholder:text-fg/20"
            />
            <span className="text-meta font-medium text-subtle">USD</span>
          </label>
          <div role="group" aria-label="Claude's plans, a month" className="mt-1.5 grid grid-cols-3 gap-1.5">
            {TIP.presets.map((p) => {
              const on = amount === p.amount;
              return (
                <button
                  key={p.amount}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(p.amount)}
                  className={cn("rounded-[13px] px-3 py-2 text-left transition-[background-color,box-shadow,color] duration-200", on ? "bg-raised text-fg shadow-[0_1px_2px_rgb(var(--bd-shade)/0.06),0_0_0_1px_rgb(var(--bd-ink)/0.08)]" : "text-muted hover:bg-fg/[0.04] hover:text-fg")}
                >
                  <span className="block text-ui font-medium tabular-nums text-fg">{money(p.amount)}</span>
                  <span className="block text-meta">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {hint && (
          <p id={`${id}-hint`} className="mt-2 px-1 text-meta text-[#d92d20] dark:text-[#ff8a80]">
            {hint}
          </p>
        )}
      </div>

      <div className="mt-5 border-t border-line px-6 pb-5 pt-4">
        {error && (
          <p role="alert" className="mb-3 text-meta text-[#d92d20] dark:text-[#ff8a80]">
            {error}
          </p>
        )}
        {!open && (
          <p role="status" className="mb-3 text-meta text-muted">
            Payments are being connected. Check back soon.
          </p>
        )}
        <button type="submit" disabled={!ok || busy || !open} className="btn-metal inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-ui font-medium disabled:pointer-events-none disabled:opacity-50">
          {busy ? (
            <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              Pay {ok ? money(amount) : ""} <ArrowUpRightIcon weight="regular" size={14} />
            </>
          )}
          {busy && <span className="sr-only">Opening the checkout</span>}
        </button>
        <Note icon={LockSimpleIcon} className="mt-3 justify-center text-center text-meta text-muted">
          One payment, on Whop&apos;s secure checkout. Never a subscription.
        </Note>
      </div>
    </form>
  );
}
