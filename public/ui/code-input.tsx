"use client";

import { AnimatePresence, motion, useAnimationControls, MotionConfig } from "motion/react";
import { useEffect, useId, useState } from "react";

/*
 * A one-time code, a cell for each character: empty cells pressed into the page, each filled one
 * lifting to a raised face as its character drops in, the one you're on ringed in ink with a
 * caret. One real input sits over the cells, so typing moves along, Backspace goes back, a pasted
 * or autofilled code fills them all at once, and a phone offers the code from a text message.
 * Wrong, it shakes and rims in red.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SIZES = {
  sm: { cell: "h-11 w-9 rounded-[11px] text-base", gap: "gap-1.5" },
  md: { cell: "h-[52px] w-11 rounded-[13px] text-xl", gap: "gap-2" },
} as const;

export type CodeInputProps = {
  /** How many characters. */
  length?: number;
  value?: string;
  defaultValue?: string;
  /** Called with what's typed so far, as it changes. */
  onValueChange?: (code: string) => void;
  /** Called once every cell is filled. */
  onComplete?: (code: string) => void;
  /** Digits only, or letters too (shown in capitals). */
  mode?: "numeric" | "alphanumeric";
  /** A short dash between the two halves, as a 6-digit code reads. On by default for an even length of 6 or more. */
  split?: boolean;
  /** Rims it in red and shakes it once, for a code that didn't work. */
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  size?: keyof typeof SIZES;
  /** Names it for screen readers when no Field or label does. */
  label?: string;
  /** With a name, the code goes in a form under it. */
  name?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  /** Set by a Field with an error; reads the same as invalid. */
  "aria-invalid"?: boolean | "true" | "false";
};

export function CodeInput({ length = 6, value, defaultValue = "", onValueChange, onComplete, mode = "numeric", split, invalid: flagged = false, disabled, autoFocus, size = "md", label = "Code", name, id, className, "aria-invalid": ariaInvalid, ...aria }: CodeInputProps) {
  const invalid = flagged || ariaInvalid === true || ariaInvalid === "true";
  const auto = useId();
  const [inner, setInner] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const shake = useAnimationControls();
  const code = (value ?? inner).slice(0, length);
  const s = SIZES[size];
  const half = (split ?? (length >= 6 && length % 2 === 0)) ? length / 2 : -1;
  const at = Math.min(code.length, length - 1);

  // A code that didn't work shakes once as it turns red.
  useEffect(() => {
    if (invalid) void shake.start({ x: [0, -7, 6, -4, 3, 0], transition: { duration: 0.42, ease: "easeOut" } });
  }, [invalid, shake]);

  const clean = (raw: string) => (mode === "numeric" ? raw.replace(/\D/g, "") : raw.replace(/[^a-z0-9]/gi, "").toUpperCase()).slice(0, length);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div animate={shake} className={cx("relative inline-flex w-fit", disabled && "opacity-50", className)}>
        <input
          id={id ?? auto}
          name={name}
          value={code}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={label}
          aria-invalid={invalid || undefined}
          inputMode={mode === "numeric" ? "numeric" : "text"}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={length}
          pattern={mode === "numeric" ? `[0-9]{${length}}` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          // The caret always sits after the last character, so typing adds and Backspace takes away.
          onSelect={(e) => {
            const el = e.currentTarget;
            if (el.selectionStart !== el.value.length) el.setSelectionRange(el.value.length, el.value.length);
          }}
          onChange={(e) => {
            const next = clean(e.target.value);
            setInner(next);
            onValueChange?.(next);
            if (next.length === length && next !== code) onComplete?.(next);
          }}
          className="absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent disabled:cursor-not-allowed"
          {...aria}
        />
        <div aria-hidden className={cx("flex items-center", s.gap)}>
          {Array.from({ length }, (_, i) => {
            const ch = code[i];
            const here = focused && i === at;
            return (
              <div key={i} className={cx("flex items-center", s.gap)}>
                {i === half && <span className="mx-0.5 h-[2px] w-2.5 rounded-full bg-[var(--bd-line-strong)]" />}
                <span
                  className={cx(
                    "relative grid place-items-center font-medium tabular-nums text-[var(--bd-fg)] transition-[background,box-shadow] duration-200 ease-[var(--bd-ease)]",
                    s.cell,
                    ch ? "[background:var(--bd-ui-raised)]" : "bg-[var(--bd-ui-field)]",
                    invalid
                      ? "shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_3px_color-mix(in_oklab,var(--bd-ui-stop)_12%,transparent)]"
                      : here
                        ? "shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.45),0_0_0_4px_rgb(var(--bd-ink)/0.06)]"
                        : ch
                          ? "shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]"
                          : "shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.1),inset_0_0_0_1px_rgb(var(--bd-ink)/0.14)]",
                  )}
                >
                  <AnimatePresence initial={false}>
                    {ch && (
                      <motion.span key={ch + i} initial={{ y: -6, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.1 } }} transition={{ type: "spring", stiffness: 620, damping: 30 }} className="absolute">
                        {ch}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {here && !ch && <span className="h-[45%] w-[1.5px] animate-[bd-ui-dither_1s_steps(1)_infinite] rounded-full bg-[var(--bd-fg)]" />}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </MotionConfig>
  );
}
