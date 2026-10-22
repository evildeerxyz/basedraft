"use client";

import { CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

/*
 * Text that becomes a field where it stands: a click, Enter or F2 turns it into a field the same
 * size, in the same type, so nothing around it moves; the field grows with what's typed. Enter
 * saves, Escape puts it back, and leaving the field saves. While a save is on its way the field
 * waits with three dots; a check confirms it, and a refusal shakes the field once and says why.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;

type Status = "idle" | "saving" | "saved";

export type InlineEditProps = {
  value: string;
  /** Called with the new text. Return a promise to show it saving; throw (or reject) to keep editing and show why. */
  onSave: (next: string) => void | Promise<void>;
  /** What the text is, for screen readers and the field's name: "Project name". */
  label: string;
  placeholder?: string;
  /** A reason the text can't be saved, or nothing when it can. Checked before onSave. */
  validate?: (next: string) => string | null | undefined;
  /** What leaving the field does. */
  onBlur?: "save" | "cancel";
  maxLength?: number;
  className?: string;
};

export function InlineEdit({ value, onSave, label, placeholder = "Untitled", validate, onBlur = "save", maxLength, className }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const display = useRef<HTMLButtonElement>(null);
  const [box, animate] = useAnimate();
  const still = useReducedMotion();
  const errorId = useId();
  const done = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(done.current), []);

  const start = () => {
    setDraft(value);
    setError(null);
    setEditing(true);
  };
  useEffect(() => {
    if (!editing) return;
    field.current?.focus();
    field.current?.select();
  }, [editing]);

  const shake = () => {
    if (!still && box.current) animate(box.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.36 });
  };
  const finish = (refocus: boolean) => {
    setEditing(false);
    setError(null);
    if (refocus) requestAnimationFrame(() => display.current?.focus());
  };
  const cancel = (refocus = true) => {
    if (status === "saving") return;
    setDraft(value);
    finish(refocus);
  };
  const commit = async (refocus = true) => {
    if (status === "saving") return;
    const next = draft.trim();
    if (next === value) return finish(refocus);
    const problem = validate?.(next);
    if (problem) {
      setError(problem);
      shake();
      return;
    }
    setStatus("saving");
    try {
      await onSave(next);
      setStatus("saved");
      finish(refocus);
      clearTimeout(done.current);
      done.current = setTimeout(() => setStatus("idle"), 1400);
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error && e.message ? e.message : "That didn't save. Try again.");
      shake();
      field.current?.focus();
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    }
  };

  // The two states share one box: same padding, same type, so the swap moves nothing.
  const PAD = "px-1.5 py-0.5";
  return (
    <span ref={box} className={cx("group/edit relative inline-grid max-w-full align-baseline", className)}>
      {editing ? (
        <>
          <motion.span aria-hidden initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={SNAPPY} className={cx("col-start-1 row-start-1 rounded-[9px] bg-[var(--bd-ui-field)]", error ? "shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_3px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)]" : "shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_3px_rgb(var(--bd-ink)/0.06)]")} />
          {/* The field's width comes from this copy of its text: as wide as the text it replaced, growing as you type. */}
          <span aria-hidden className={cx("invisible col-start-1 row-start-1 whitespace-pre", PAD)}>
            {draft || placeholder}
          </span>
          <input
            ref={field}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={onKey}
            onBlur={() => (onBlur === "save" ? void commit(false) : cancel(false))}
            readOnly={status === "saving"}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            aria-busy={status === "saving" || undefined}
            className={cx("relative col-start-1 row-start-1 w-[calc(100%+2px)] min-w-0 bg-transparent text-inherit outline-none [font:inherit] [letter-spacing:inherit] placeholder:text-[var(--bd-subtle)]", PAD)}
            size={1}
          />
        </>
      ) : (
        <button
          ref={display}
          type="button"
          onClick={start}
          onKeyDown={(e) => {
            if (e.key === "F2") {
              e.preventDefault();
              start();
            }
          }}
          aria-label={`${label}, ${value || placeholder}. Edit`}
          className={cx(
            "col-start-1 row-start-1 cursor-text rounded-[9px] text-left outline-none decoration-[rgb(var(--bd-ink)/0.28)] decoration-dashed underline-offset-[5px] transition-[text-decoration-color] duration-150 hover:underline focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]",
            PAD,
            !value && "text-[var(--bd-subtle)]",
          )}
        >
          {value || placeholder}
        </button>
      )}
      {/* Beside the text, outside its box: the pencil on hover, the dots while saving, the check once saved. */}
      <span aria-hidden className="pointer-events-none absolute left-full top-1/2 ml-1 grid size-5 -translate-y-1/2 place-items-center text-[var(--bd-subtle)]">
        <AnimatePresence mode="popLayout" initial={false}>
          {status === "saving" ? (
            <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-[3px] rounded-full bg-current animate-[bd-ui-dither_1s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${i * 0.16}s` }} />
              ))}
            </motion.span>
          ) : status === "saved" ? (
            <motion.span key="saved" initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={SNAPPY} className="grid size-4 place-items-center rounded-full text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
              <CheckIcon weight="bold" size={10} />
            </motion.span>
          ) : !editing ? (
            <span key="pencil" className="opacity-0 transition-opacity duration-150 group-hover/edit:opacity-100 group-focus-within/edit:opacity-100">
              <PencilSimpleIcon weight="duotone" size={14} />
            </span>
          ) : null}
        </AnimatePresence>
      </span>
      {/* Why it didn't save, under the field, without pushing anything down. */}
      <AnimatePresence>
        {error && editing && (
          <motion.span
            id={errorId}
            role="alert"
            initial={still ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={SNAPPY}
            className="absolute left-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-[8px] bg-[var(--bd-surface)] px-2 py-1 font-sans text-[12px] font-medium tracking-normal text-[var(--bd-ui-stop)] shadow-[var(--bd-shadow-raised),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {status === "saving" ? "Saving" : status === "saved" ? "Saved" : ""}
      </span>
    </span>
  );
}
