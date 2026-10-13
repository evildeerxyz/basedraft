"use client";

import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Dithered } from "@/components/site/dither";
import { Select } from "@/components/site/select";
import { Container } from "@/components/site/ui";
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
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 rounded-[4px] bg-page p-6 text-ink">
            <span className="grid size-9 shrink-0 place-items-center rounded-[3px] bg-ink text-page">
              <CheckIcon size={18} weight="bold" />
            </span>
            <div>
              <p className="text-[19px] font-semibold">Thanks. We&apos;ll write to {email.trim()} today.</p>
              <p className="mt-1 text-[17px] text-ink-2">Someone from our team will suggest a time, and set up the demo on a handbook like yours.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" exit={{ opacity: 0, y: -8 }} onSubmit={submit} noValidate className={cn("grid gap-3", stacked ? "sm:grid-cols-[1fr_auto] [&>input]:sm:col-span-2" : "sm:grid-cols-[1fr_240px_auto]")}>
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
              className={cn("h-14 rounded-[4px] bg-page px-5 text-[17px] text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] outline-none transition-shadow placeholder:text-mute focus-visible:shadow-[0_0_0_3px_var(--pl-accent)] focus-visible:outline-none", error && "shadow-[0_0_0_3px_var(--pl-ink)]")}
            />
            <Select label="Team size" value={size} onChange={setSize} options={SIZES} className="[&>button]:h-14 [&>button]:text-[17px]" />
            <button type="submit" className="group flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-ink px-7 text-[17px] font-semibold text-page transition-colors hover:bg-ink-2">
              Book a demo
              <ArrowRightIcon size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <AnimatePresence>
              {error && (
                <motion.p id="demo-error" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={cn("text-[16px] font-semibold", stacked ? "sm:col-span-2" : "sm:col-span-3")}>
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

export function Cta() {
  return (
    <section className="py-24 lg:py-32">
      <Container>
        <div className="grid overflow-hidden rounded-[4px] bg-accent text-accent-ink lg:grid-cols-[1.15fr_0.85fr]">
          <div className="px-6 py-14 sm:px-12 lg:px-14 lg:py-20">
            <h2 className="max-w-[720px] text-balance font-display text-[clamp(3.2rem,7vw,7rem)] font-extrabold leading-[0.84]">Give your people team its week back.</h2>
            <p className="mt-6 max-w-[520px] text-[clamp(1.15rem,1.5vw,1.32rem)] leading-[1.5]">A 30 minute call, set up on a handbook like yours. Then 30 days free, with your own team.</p>
            <DemoForm onAccent className="mt-10 max-w-[760px]" />
          </div>
          {/* A team at work, printed in ink straight onto the vermilion. */}
          <Dithered src={SCENES.laughing} alt="Three colleagues laughing at a laptop" inks={["ink", "accent"]} cell={3} focus={[0.5, 0.4]} className="min-h-[340px] bg-accent lg:min-h-full" />
        </div>
      </Container>
    </section>
  );
}
