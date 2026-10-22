"use client";

import { ArrowFatLinesUpIcon, CheckIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState, type ComponentProps, type KeyboardEvent } from "react";

/*
 * A password field that helps while you type: an eye that shows what you've written, a meter of
 * four segments that fills as it grows stronger with a word for how strong, and a short list of
 * rules that tick as each one is met. It says so when Caps Lock is on.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type PasswordRule = { label: string; test: (value: string) => boolean };

const RULES: PasswordRule[] = [
  { label: "12 characters or more", test: (v) => v.length >= 12 },
  { label: "Upper and lower case", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "A number", test: (v) => /\d/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

/** How strong, from 0 (empty) to 4: length counts most, then variety; the obvious ones never pass weak. */
function strengthOf(v: string) {
  if (!v) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(v)).length;
  let s = (v.length >= 8 ? 1 : 0) + (v.length >= 12 ? 1 : 0) + (v.length >= 16 ? 1 : 0) + (kinds >= 3 ? 1 : 0);
  if (/^(.)\1*$/.test(v) || /password|qwerty|letmein|welcome|admin|123456|abcdef/i.test(v)) s = Math.min(s, 1);
  return Math.max(1, Math.min(4, s));
}

const LEVELS = [
  { word: "", tone: "" },
  { word: "Weak", tone: "var(--bd-ui-stop)" },
  { word: "Fair", tone: "var(--bd-ui-wait)" },
  { word: "Good", tone: "var(--bd-ui-ok)" },
  { word: "Strong", tone: "var(--bd-ui-ok)" },
];

export type PasswordFieldProps = Omit<ComponentProps<"input">, "type"> & {
  /** Its name, shown above it. */
  label?: string;
  /** The rules listed under it, each ticking as it's met; false for none. */
  rules?: PasswordRule[] | false;
  /** Shows the strength meter. Leave it on for a new password, off for signing in. */
  meter?: boolean;
};

export function PasswordField({ label, rules = RULES, meter = true, className, id, value, defaultValue, onChange, onKeyDown, onKeyUp, ...props }: PasswordFieldProps) {
  const auto = useId();
  const field = id ?? auto;
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const text = value !== undefined ? String(value) : inner;
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const still = useReducedMotion();
  const score = meter ? strengthOf(text) : 0;
  const level = LEVELS[score];
  const caps2 = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  const describedBy = [meter && `${field}-strength`, rules && rules.length && `${field}-rules`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("grid w-full gap-2", className)}>
      {label && (
        <label htmlFor={field} className="text-sm font-medium text-[var(--bd-fg)]">
          {label}
        </label>
      )}
      <span
        className={cx(
          "flex h-11 w-full items-center gap-2 rounded-full bg-[var(--bd-ui-field)] pl-4 pr-1.5 text-sm text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
          "hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
          "has-[[aria-invalid=true]]:shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)] has-[:disabled]:opacity-50",
        )}
      >
        <input
          id={field}
          type={shown ? "text" : "password"}
          value={text}
          onChange={(e) => {
            if (value === undefined) setInner(e.target.value);
            onChange?.(e);
          }}
          onKeyDown={(e) => {
            caps2(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            caps2(e);
            onKeyUp?.(e);
          }}
          onBlur={() => setCaps(false)}
          aria-describedby={describedBy}
          spellCheck={false}
          autoCapitalize="none"
          className={cx("h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--bd-subtle)] disabled:cursor-not-allowed", !shown && text && "tracking-[0.12em]")}
          {...props}
        />
        <button
          type="button"
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          aria-controls={field}
          onClick={() => setShown((s) => !s)}
          className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={shown ? "hide" : "show"} initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -30 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 30 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} className="grid place-items-center">
              {shown ? <EyeSlashIcon weight="duotone" className="size-4" /> : <EyeIcon weight="duotone" className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </span>
      <AnimatePresence initial={false}>
        {caps && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 overflow-hidden px-1 text-xs font-medium text-[var(--bd-ui-wait)]">
            <ArrowFatLinesUpIcon weight="duotone" className="size-3.5" /> Caps Lock is on
          </motion.p>
        )}
      </AnimatePresence>
      {meter && (
        <div className="flex items-center gap-3 px-1">
          <div aria-hidden className="grid flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className="h-1 overflow-hidden rounded-full bg-[var(--bd-ui-track)]">
                <motion.span className="block h-full origin-left rounded-full" initial={false} animate={{ scaleX: score >= n ? 1 : 0, backgroundColor: level.tone || "transparent" }} transition={still ? { duration: 0 } : { scaleX: { type: "spring", stiffness: 300, damping: 30, delay: (n - 1) * 0.04 }, backgroundColor: { duration: 0.25 } }} />
              </span>
            ))}
          </div>
          <span id={`${field}-strength`} aria-live="polite" className="w-12 text-right text-xs font-medium" style={{ color: level.tone || "var(--bd-subtle)" }}>
            {level.word ? <span className="sr-only">Strength: </span> : null}
            {level.word}
          </span>
        </div>
      )}
      {rules && rules.length > 0 && (
        <ul id={`${field}-rules`} className="grid gap-1.5 px-1 pt-0.5 sm:grid-cols-2">
          {rules.map((r) => {
            const met = r.test(text);
            return (
              <li key={r.label} className={cx("flex items-center gap-2 text-xs transition-colors duration-200", met ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)]")}>
                <span aria-hidden className={cx("grid size-3.5 shrink-0 place-items-center rounded-full transition-[background,box-shadow] duration-200", met ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.18)]")}>
                  <AnimatePresence initial={false}>
                    {met && (
                      <motion.span initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }} transition={{ type: "spring", stiffness: 700, damping: 28 }} className="grid place-items-center">
                        <CheckIcon weight="bold" className="size-2" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                {r.label}
                <span className="sr-only">{met ? ", met" : ", not yet"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
