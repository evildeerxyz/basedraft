"use client";

import { ArrowLeftIcon, EnvelopeSimpleIcon, GoogleLogoIcon, WindowsLogoIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { Mark } from "@/components/site/logo";
import { cn } from "@/lib/cn";

/* Sign in with Google, Microsoft or a link by email. The email path shows what happens next. */
export function SignIn() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter the email you use at work");
    setError("");
    setSent(true);
  };

  return (
    <div className="pl-card w-full max-w-[440px] rounded-[16px] p-7 sm:p-9">
      <Mark size={40} />
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h1 className="mt-6 font-display text-[32px] font-semibold tracking-[-0.025em] text-ink">Check your inbox</h1>
            <p className="mt-3 text-[16px] leading-[1.55] text-mute">
              We sent a link to <span className="font-medium text-ink">{email.trim()}</span>. It works for the next 15 minutes.
            </p>
            <button type="button" onClick={() => setSent(false)} className="mt-6 inline-flex h-10 items-center gap-2 rounded-[10px] text-[15px] font-medium text-ink-2 transition-colors hover:text-ink">
              <ArrowLeftIcon size={17} />
              Use another email
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h1 className="mt-6 font-display text-[32px] font-semibold tracking-[-0.025em] text-ink">Sign in to pello</h1>
            <div className="mt-8 grid gap-3">
              {[
                { label: "Continue with Google", icon: GoogleLogoIcon },
                { label: "Continue with Microsoft", icon: WindowsLogoIcon },
              ].map((p) => (
                <button key={p.label} type="button" className="pl-btn-light flex h-11 items-center justify-center gap-2.5 rounded-[12px] text-[15px] font-medium">
                  <p.icon size={18} weight="bold" />
                  {p.label}
                </button>
              ))}
            </div>
            <p className="my-6 text-center text-[15px] text-mute">or with a link by email</p>
            <form onSubmit={submit} noValidate className="grid gap-3">
              <label htmlFor="signin-email" className="text-[15px] font-medium text-ink">
                Work email
              </label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="you@company.com"
                autoComplete="email"
                aria-invalid={!!error}
                aria-describedby={error ? "signin-error" : undefined}
                className={cn("h-11 rounded-[10px] bg-surface px-3.5 text-[15px] text-ink outline-none transition-shadow placeholder:text-mute focus-visible:shadow-[0_0_0_1px_var(--pl-ink),0_0_0_4px_var(--pl-line)] focus-visible:outline-none", error ? "shadow-[0_0_0_1px_var(--pl-accent),0_0_0_4px_var(--pl-accent-soft)]" : "shadow-[0_0_0_1px_var(--pl-line-strong)]")}
              />
              {error && (
                <p id="signin-error" role="alert" className="text-[15px] font-semibold text-accent">
                  {error}
                </p>
              )}
              <button type="submit" className="pl-btn-dark mt-1 flex h-11 items-center justify-center gap-2 rounded-[12px] text-[15px] font-medium">
                <EnvelopeSimpleIcon size={19} />
                Email me a link
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
