"use client";

import { CheckIcon, EyeIcon, EyeSlashIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ClipboardEvent, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/Field";

export function PrimaryButton({ children, loading, disabled, type = "submit", onClick, className }: { children: ReactNode; loading?: boolean; disabled?: boolean; type?: "submit" | "button"; onClick?: () => void; className?: string }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-lime px-6 text-[17px] font-medium text-on-lime transition-[transform,opacity] active:scale-[0.99] disabled:opacity-50",
        className,
      )}
    >
      {loading ? <SpinnerGapIcon size={22} className="animate-spin" aria-label="Loading" /> : children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, className, type = "button" }: { children: ReactNode; onClick?: () => void; className?: string; type?: "submit" | "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn("inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-[14px] bg-white/[0.07] px-6 text-[17px] font-medium text-white transition-colors hover:bg-white/[0.11]", className)}
    >
      {children}
    </button>
  );
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-14" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-[10px] text-white/60 transition-colors hover:text-white"
      >
        {show ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
      </button>
    </div>
  );
}

export const PASSWORD_RULES = [
  { k: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { k: "A number", test: (p: string) => /\d/.test(p) },
  { k: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { k: "A symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrength({ value }: { value: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(value)).length;
  const label = ["Too weak", "Weak", "Okay", "Good", "Strong"][passed];
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden>
        {PASSWORD_RULES.map((r, i) => (
          <span key={r.k} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.span className="block h-full rounded-full bg-lime" initial={false} animate={{ width: i < passed ? "100%" : "0%" }} transition={{ duration: 0.3 }} />
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.k} className={cn("flex items-center gap-2 text-[15px] transition-colors", ok ? "text-white" : "text-white/55")}>
                <CheckIcon size={14} weight="bold" className={ok ? "text-accent" : "text-white/25"} />
                {r.k}
              </li>
            );
          })}
        </ul>
        <span className={cn("text-[15px] font-medium", passed >= 3 ? "text-accent" : "text-white/60")}>{value ? label : ""}</span>
      </div>
    </div>
  );
}

/** Six boxes for a one-time code. Typing advances, backspace goes back, pasting fills them all. */
export function OtpInput({ value, onChange, invalid, label, autoFocus }: { value: string; onChange: (v: string) => void; invalid?: boolean; label: string; autoFocus?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setAt = (i: number, d: string) => {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).replace(/\D/g, "").slice(0, 6);
    onChange(next);
  };
  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      onChange(value.slice(0, i - 1));
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent) => {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!t) return;
    e.preventDefault();
    onChange(t);
    refs.current[Math.min(t.length, 5)]?.focus();
  };

  return (
    <div role="group" aria-label={label} className="flex gap-2 sm:gap-3" onPaste={onPaste}>
      {digits.map((d, i) => (
        <motion.input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          maxLength={1}
          value={d}
          animate={invalid ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) return setAt(i, "");
            setAt(i, v.slice(-1));
            if (i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={onKey(i)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-16 w-full min-w-0 rounded-[14px] border bg-white/[0.03] text-center font-mono text-[28px] text-white outline-none transition-[border-color,background-color,box-shadow] duration-200 focus:border-lime focus:bg-white/[0.06] focus:ring-4 focus:ring-lime/30 sm:h-[72px]",
            invalid ? "border-down/70" : d ? "border-white/30" : "border-white/12",
          )}
        />
      ))}
    </div>
  );
}
