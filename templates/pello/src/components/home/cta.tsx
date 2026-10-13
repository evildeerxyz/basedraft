"use client";

import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Dithered } from "@/components/site/dither";
import { Select } from "@/components/site/select";
import { Band } from "@/components/site/ui";
import { cn } from "@/lib/cn";
import { SCENES } from "@/lib/photos";

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
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 border-t border-ink pt-5 text-ink">
            <CheckIcon size={20} weight="bold" className="mt-0.5 shrink-0" />
            <div>
              <p className="text-[17px] font-semibold">Thanks. We&apos;ll write to {email.trim()} today.</p>
              <p className="mt-1 text-[15px] leading-[1.5] text-mute">Someone from our team will suggest a time, and set up the demo on a handbook like yours.</p>
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
              className={cn("h-12 rounded-[10px] bg-page px-4 text-[16px] text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)] outline-none transition-shadow placeholder:text-mute focus-visible:shadow-[inset_0_0_0_1.5px_var(--pl-ink)] focus-visible:outline-none", error && "shadow-[inset_0_0_0_1.5px_var(--pl-accent)]")}
            />
            <Select label="Team size" value={size} onChange={setSize} options={SIZES} className="[&>button]:h-12" />
            <button type="submit" className="pl-btn-dark group flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-5 text-[16px] font-medium">
              Book a demo
              <ArrowRightIcon size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
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

/** The last ask: the day after the weekend, with pello starting on it. */
export function Cta() {
  return (
    <Band id="cta" inner="pb-24 lg:pb-32">
      <div className="grid gap-12 border-t border-ink pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pt-20">
        <div className="flex flex-col">
          <p className="tabular font-mono text-[48px] font-medium leading-none tracking-[-0.05em] text-accent">Mon 09:00</p>
          <p className="mt-3 text-[15px] text-mute">Your company, the week after next</p>
          <h2 className="mt-10 max-w-[620px] text-balance text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-[1] tracking-[-0.05em] text-ink">Give your People team its Fridays back.</h2>
          <p className="mt-5 max-w-[520px] text-[19px] leading-[1.5] text-mute">A 30 minute call, set up on a handbook like yours. Then 30 days free, with your own team.</p>
          <DemoForm className="mt-9 max-w-[640px] lg:mt-auto lg:pt-10" />
        </div>
        <figure>
          <Dithered src={SCENES.office} alt="An open office, with people working at their desks" inks={["ink", "mute", "surface"]} cell={2} focus={[0.5, 0.45]} className="aspect-[4/3] w-full rounded-[14px] lg:aspect-auto lg:h-full lg:min-h-[460px]" />
        </figure>
      </div>
    </Band>
  );
}
