"use client";

import { ArrowLeftIcon, CheckIcon, ScanSmileyIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { EASE_OUT } from "@/lib/utils";
import { Field, Input } from "../ui/Field";
import { OtpInput, PasswordInput, PrimaryButton, SecondaryButton } from "./parts";

type Stage = "credentials" | "passkey" | "code" | "done";

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: EASE_OUT },
};

function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [running]);
  return [left, () => setLeft(seconds)] as const;
}

export function LoginFlow() {
  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; code?: string }>({});
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [left, resetTimer] = useCountdown(30, stage === "code");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (stage !== "credentials" && stage !== "code") heading.current?.focus();
  }, [stage]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter the email you signed up with, like you@example.com.";
    if (password.length < 8) next.password = "Passwords are at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStage("code");
    }, 900);
  };

  const passkey = () => {
    setStage("passkey");
    setTimeout(() => setStage("done"), 2200);
  };

  const verify = (v: string) => {
    setCode(v);
    if (v.length < 6) return setErrors((e) => ({ ...e, code: undefined }));
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (v === "000000") setErrors({ code: "That code didn't match. Check the latest text and try again." });
      else setStage("done");
    }, 700);
  };

  return (
    <div className="w-full max-w-[460px]">
      <AnimatePresence mode="wait" initial={false}>
        {stage === "credentials" && (
          <motion.div key="cred" {...fade}>
            <h1 ref={heading} tabIndex={-1} className="text-[clamp(2.6rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] outline-none">
              Welcome back.
            </h1>
            <p className="mt-4 text-[19px] leading-relaxed text-white/65">Log in to see your portfolio, statements and tax documents.</p>

            <form onSubmit={submit} noValidate className="mt-10 space-y-5">
              <Field label="Email" htmlFor="l-email" error={errors.email}>
                <Input id="l-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={Boolean(errors.email)} placeholder="you@example.com" />
              </Field>
              <Field label="Password" htmlFor="l-password" error={errors.password}>
                <PasswordInput id="l-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={Boolean(errors.password)} />
              </Field>
              <div className="flex justify-end">
                <Link href="/help" className="text-[16px] text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <PrimaryButton loading={loading}>Log in</PrimaryButton>
            </form>

            <div className="mt-4">
              <SecondaryButton onClick={passkey}>
                <ScanSmileyIcon size={22} /> Use a passkey instead
              </SecondaryButton>
            </div>

            <p className="mt-10 text-[17px] text-white/65">
              New to Zuno?{" "}
              <Link href="/signup" className="text-accent underline-offset-4 hover:underline">
                Create an account
              </Link>
            </p>
          </motion.div>
        )}

        {stage === "passkey" && (
          <motion.div key="passkey" {...fade} className="text-center sm:text-left" role="status">
            <div className="relative mx-auto grid size-28 place-items-center sm:mx-0">
              <motion.span className="absolute inset-0 rounded-[30px] border-2 border-lime" animate={{ scale: [1, 1.12, 1], opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 1.4, repeat: Infinity }} />
              <ScanSmileyIcon size={56} className="text-accent" />
            </div>
            <h1 ref={heading} tabIndex={-1} className="mt-10 text-[clamp(2.2rem,4vw,3rem)] font-semibold leading-[1] tracking-[-0.04em] outline-none">
              Waiting for your passkey
            </h1>
            <p className="mt-4 text-[19px] text-white/65">Confirm with Face ID, Touch ID or your security key.</p>
          </motion.div>
        )}

        {stage === "code" && (
          <motion.div key="code" {...fade}>
            <button onClick={() => setStage("credentials")} className="group mb-10 inline-flex items-center gap-2 text-[17px] text-white/70 transition-colors hover:text-white">
              <ArrowLeftIcon size={18} className="transition-transform group-hover:-translate-x-1" /> Back
            </button>
            <h1 ref={heading} tabIndex={-1} className="text-[clamp(2.4rem,4.4vw,3.4rem)] font-semibold leading-[1] tracking-[-0.045em] outline-none">
              Check your phone.
            </h1>
            <p className="mt-4 text-[19px] leading-relaxed text-white/65">
              We texted a 6-digit code to <span className="text-white">(•••) •••-0142</span>. Any code works in this demo, except 000000.
            </p>
            <div className="mt-10">
              <OtpInput label="Verification code" value={code} onChange={verify} invalid={Boolean(errors.code)} autoFocus />
              {errors.code && (
                <p role="alert" className="mt-3 text-[15px] text-down">
                  {errors.code}
                </p>
              )}
            </div>
            <div className="mt-8 flex items-center justify-between text-[17px]">
              <span className="text-white/60" aria-live="polite">
                {loading ? "Checking…" : left > 0 ? `Resend in 0:${String(left).padStart(2, "0")}` : "Didn't get it?"}
              </span>
              <button
                disabled={left > 0}
                onClick={() => {
                  resetTimer();
                  setCode("");
                }}
                className="text-accent disabled:text-white/40"
              >
                Resend code
              </button>
            </div>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" {...fade} role="status">
            <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="grid size-16 place-items-center rounded-full bg-lime text-on-lime">
              <CheckIcon size={30} weight="bold" />
            </motion.span>
            <h1 ref={heading} tabIndex={-1} className="mt-8 text-[clamp(2.6rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] outline-none">
              You&apos;re in, Maya.
            </h1>
            <p className="mt-4 text-[19px] leading-relaxed text-white/65">Your portfolio is up $1,284.10 this month. Autopilot made two trades while you were away, both explained in Activity.</p>
            <div className="mt-10 space-y-3">
              <Link href="/#app" className="flex h-14 items-center justify-center rounded-[14px] bg-lime px-6 text-[17px] font-medium text-on-lime">
                Open my portfolio
              </Link>
              <Link href="/" className="flex h-14 items-center justify-center rounded-[14px] text-[17px] text-white/70 transition-colors hover:text-white">
                Back to zuno.com
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
