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
    <div className="w-full max-w-[480px] rounded-[4px] bg-surface p-8 sm:p-10">
      <Mark size={40} />
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h1 className="mt-8 font-display text-[56px] font-extrabold leading-[0.9] text-ink">Check your inbox.</h1>
            <p className="mt-3 text-[17px] leading-[1.55] text-ink-2">
              We sent a link to <span className="font-medium text-ink">{email.trim()}</span>. It works for the next 15 minutes.
            </p>
            <button type="button" onClick={() => setSent(false)} className="mt-8 inline-flex h-11 items-center gap-2 rounded-[4px] text-[17px] font-semibold text-ink-2 transition-colors hover:text-ink">
              <ArrowLeftIcon size={17} />
              Use another email
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <h1 className="mt-8 font-display text-[56px] font-extrabold leading-[0.9] text-ink">Sign in to pello</h1>
            <div className="mt-8 grid gap-3">
              {[
                { label: "Continue with Google", icon: GoogleLogoIcon },
                { label: "Continue with Microsoft", icon: WindowsLogoIcon },
              ].map((p) => (
                <button key={p.label} type="button" className="flex h-14 items-center justify-center gap-3 rounded-[4px] bg-page text-[17px] font-semibold text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] transition-colors hover:bg-ink hover:text-page">
                  <p.icon size={20} weight="bold" />
                  {p.label}
                </button>
              ))}
            </div>
            <p className="my-6 text-center text-[15px] text-mute">or with a link by email</p>
            <form onSubmit={submit} noValidate className="grid gap-3">
              <label htmlFor="signin-email" className="text-[16px] font-medium text-ink">
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
                className={cn("h-14 rounded-[4px] bg-page px-4 text-[17px] text-ink outline-none transition-shadow placeholder:text-mute focus-visible:shadow-[0_0_0_3px_var(--pl-accent)] focus-visible:outline-none", error ? "shadow-[0_0_0_2px_var(--pl-accent)]" : "shadow-[inset_0_0_0_1.5px_var(--pl-ink)]")}
              />
              {error && (
                <p id="signin-error" role="alert" className="text-[15px] font-semibold text-accent">
                  {error}
                </p>
              )}
              <button type="submit" className="mt-2 flex h-14 items-center justify-center gap-2 rounded-[4px] bg-ink text-[17px] font-semibold text-page transition-colors hover:bg-accent hover:text-accent-ink">
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
