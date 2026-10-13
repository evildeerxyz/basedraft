"use client";

import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Mosaic } from "@/components/site/dither";
import { Select } from "@/components/site/select";
import { Band } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { personPhoto } from "@/lib/photos";

export const SIZES = [
  { value: "1-50", label: "1 to 50 people" },
  { value: "51-200", label: "51 to 200 people" },
  { value: "201-1000", label: "201 to 1,000 people" },
  { value: "1000+", label: "More than 1,000 people" },
];

/**
 * The demo form: a work email and the team's size. It checks the email before it sends. On the
 * accent, its focus rings are drawn in ink, so they still show.
 */
export function DemoForm({ className, onAccent, stacked }: { className?: string; onAccent?: boolean; stacked?: boolean }) {
  const [email, setEmail] = useState("");
  const [size, setSize] = useState("51-200");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a work email, like hannah@fieldwork.com");
    setError("");
    setSent(true);
  };

  return (
    <div className={cn(onAccent && "[--pl-accent:var(--pl-ink)]", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pl-pop flex items-start gap-4 rounded-[14px] p-5 text-ink">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-surface">
              <CheckIcon size={18} weight="bold" />
            </span>
            <div>
              <p className="text-[17px] font-semibold">Thanks. We&apos;ll write to {email.trim()} today.</p>
              <p className="mt-1 text-[15px] text-mute">Someone from our team will suggest a time, and set up the demo on a handbook like yours.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" exit={{ opacity: 0, y: -8 }} onSubmit={submit} noValidate className={cn("grid gap-2", stacked ? "sm:grid-cols-[1fr_auto] [&>input]:sm:col-span-2" : "sm:grid-cols-[1fr_210px_auto]")}>
            <label htmlFor="demo-email" className="sr-only">
              Work email
            </label>
            <input
              id="demo-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="Work email"
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? "demo-error" : undefined}
              className={cn("h-11 rounded-[10px] bg-surface px-3.5 text-[15px] text-ink shadow-[0_0_0_1px_var(--pl-line-strong),0_1px_2px_rgb(0_0_0/0.04)] outline-none transition-shadow placeholder:text-mute focus-visible:shadow-[0_0_0_1px_var(--pl-ink),0_0_0_4px_var(--pl-line)] focus-visible:outline-none", error && "shadow-[0_0_0_1px_var(--pl-accent),0_0_0_4px_var(--pl-accent-soft)]")}
            />
            <Select label="Team size" value={size} onChange={setSize} options={SIZES} />
            <button type="submit" className="pl-btn-dark group flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-4 text-[15px] font-medium">
              Book a demo
              <CaretRightIcon size={14} weight="bold" className="opacity-70 transition-transform group-hover:translate-x-0.5" />
            </button>
            <AnimatePresence>
              {error && (
                <motion.p id="demo-error" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={cn("text-[15px] font-medium text-accent", stacked ? "sm:col-span-2" : "sm:col-span-3")}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Fieldwork's people, behind the last ask. */
const FACES = ["hannah", "leo", "grace", "marco", "priya", "oliver", "mei", "tom", "nina", "arjun", "clara", "ravi", "iris", "julia", "ethan", "ava", "lucas", "sofia", "ben", "jack", "zoe", "hugo", "emma", "felix", "daniel", "noah"].map(personPhoto);

export function Cta() {
  return (
    <Band rule inner="py-6">
      <div className="pl-card relative -mx-2 overflow-hidden rounded-[16px] sm:-mx-6 lg:-mx-[64px]">
        <Mosaic srcs={FACES} inks={["mute", "line", "surface"]} clear={0.62} className="absolute inset-0" />
        <div className="relative mx-auto max-w-[720px] px-6 py-24 text-center sm:py-32">
          <h2 className="text-balance font-display text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">Give your people team its week back</h2>
          <p className="mx-auto mt-4 max-w-[500px] text-[18px] leading-[1.55] text-mute">A 30 minute call, set up on a handbook like yours. Then 30 days free, with your own team.</p>
          <DemoForm className="mx-auto mt-8 max-w-[640px] text-left" />
        </div>
      </div>
    </Band>
  );
}
