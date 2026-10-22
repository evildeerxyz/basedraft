"use client";

import { WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

/*
 * Words as chips in a field pressed into the page: type one and press Enter or a comma, or paste
 * a whole list and it splits. Each chip springs in and the rest make room. Backspace on an empty
 * field marks the last chip, and a second press takes it away; the arrows walk along the chips,
 * and Enter on one (or a double click) edits it in place. A chip your check doesn't like stays,
 * rimmed in red with the reason, until it's fixed; one that can't go in at all, a repeat or one
 * past the limit, shakes the field instead.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SIZES = { sm: { field: "min-h-9 px-2 py-1 text-[13px] rounded-[18px]", chip: "h-6 text-[12px]" }, md: { field: "min-h-11 px-2.5 py-1.5 text-sm rounded-[22px]", chip: "h-7 text-[13px]" } } as const;

export type TagInputProps = {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  /** Shown while there are no tags. */
  placeholder?: string;
  /** Checks a tag as it goes in or is edited: return a reason and it's kept, rimmed in red, until it's fixed. */
  validate?: (tag: string) => string | null | undefined | void;
  /** The most tags it takes. */
  max?: number;
  /** Keys that end a tag, besides Enter. A pasted list splits on these, on new lines and on tabs too. */
  separators?: string[];
  /** Tidies each tag as it goes in, for example to lowercase. Tags are always trimmed. */
  transform?: (tag: string) => string;
  /** Lets the same tag in twice. */
  allowDuplicates?: boolean;
  size?: keyof typeof SIZES;
  disabled?: boolean;
  /** Names it for screen readers when no Field or label does. */
  label?: string;
  /** With a name, hidden inputs carry each tag in a form. */
  name?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-labelledby"?: string;
  "aria-required"?: boolean | "true" | "false";
};

export function TagInput({ value, defaultValue = [], onValueChange, placeholder = "Add a tag", validate, max, separators = [","], transform, allowDuplicates, size = "md", disabled, label, name, id, className, ...aria }: TagInputProps) {
  const reduced = useReducedMotion();
  const auto = useId();
  const [inner, setInner] = useState(defaultValue);
  const tags = value ?? inner;
  const [text, setText] = useState("");
  // The chip the keyboard is on: -1 for the field. Marked by Backspace, it's the next to go.
  const [focus, setFocus] = useState(-1);
  const [editing, setEditing] = useState(-1);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const chips = useRef<Array<HTMLSpanElement | null>>([]);
  const shake = useAnimationControls();
  const s = SIZES[size];
  const full = max !== undefined && tags.length >= max;
  const reasons = tags.map((t) => (validate ? validate(t) || "" : ""));
  const invalid = aria["aria-invalid"] === true || aria["aria-invalid"] === "true" || reasons.some(Boolean);

  const emit = (next: string[]) => {
    setInner(next);
    onValueChange?.(next);
  };

  const refuse = (why: string) => {
    setNote(why);
    if (!reduced) void shake.start({ x: [0, -6, 5, -3, 2, 0], transition: { duration: 0.36, ease: "easeOut" } });
  };

  const tidy = (raw: string) => (transform ? transform(raw.trim()) : raw.trim());

  // Adds what it can of a list of new tags, in order, and says why any couldn't go in.
  const add = (raw: string[]) => {
    const next = [...tags];
    let why = "";
    for (const r of raw) {
      const t = tidy(r);
      if (!t) continue;
      if (!allowDuplicates && next.includes(t)) why = `${t} is already in.`;
      else if (max !== undefined && next.length >= max) why = `That's the most: ${max}.`;
      else next.push(t);
    }
    if (next.length !== tags.length) emit(next);
    if (why) refuse(why);
    else setNote("");
    return next.length !== tags.length || !why;
  };

  const removeAt = (i: number, then: number) => {
    emit(tags.filter((_, j) => j !== i));
    setNote("");
    setFocus(then);
  };

  // Keyboard focus follows the chip the keyboard is on.
  useEffect(() => {
    if (editing >= 0) return;
    if (focus >= 0) chips.current[focus]?.focus();
  }, [focus, editing]);

  const split = new RegExp(`[${[...separators, "\n", "\t", ";"].map((c) => c.replace(/[\\\]^-]/g, "\\$&")).join("")}]`);

  const onFieldKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || separators.includes(e.key)) {
      if (!text.trim()) {
        if (e.key !== "Enter") e.preventDefault();
        return;
      }
      e.preventDefault();
      if (add([text])) setText("");
    } else if (e.key === "Backspace" && !text && tags.length) {
      e.preventDefault();
      setFocus(tags.length - 1);
    } else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0 && tags.length) {
      e.preventDefault();
      setFocus(tags.length - 1);
    } else if (e.key === "Escape" && text) {
      e.preventDefault();
      setText("");
      setNote("");
    }
  };

  const onChipKey = (e: KeyboardEvent<HTMLSpanElement>, i: number) => {
    const toField = () => {
      setFocus(-1);
      field.current?.focus();
    };
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const after = e.key === "Backspace" ? i - 1 : i;
      if (tags.length === 1 || (e.key === "Delete" && i === tags.length - 1)) {
        removeAt(i, -1);
        field.current?.focus();
      } else removeAt(i, Math.max(0, after));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setFocus(Math.max(0, i - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (i === tags.length - 1) toField();
      else setFocus(i + 1);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (e.key === "End") toField();
      else setFocus(0);
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      startEdit(i);
    } else if (e.key === "Escape") {
      e.preventDefault();
      toField();
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      // Typing on a chip goes on in the field.
      toField();
    }
  };

  const startEdit = (i: number) => {
    if (disabled) return;
    setEditing(i);
    setDraft(tags[i]);
    setFocus(-1);
  };

  const finishEdit = (keep: boolean) => {
    const i = editing;
    if (i < 0) return;
    setEditing(-1);
    if (!keep) {
      setFocus(i);
      return;
    }
    const t = tidy(draft);
    if (!t) return removeAt(i, Math.max(0, i - 1));
    if (!allowDuplicates && tags.some((x, j) => x === t && j !== i)) {
      refuse(`${t} is already in.`);
      setFocus(i);
      return;
    }
    emit(tags.map((x, j) => (j === i ? t : x)));
    setNote("");
    setFocus(i);
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData("text");
    if (!split.test(raw)) return;
    e.preventDefault();
    add((text + raw).split(split));
    setText("");
  };

  // A key that stays with its tag when others come and go: the tag, and which repeat of it this is.
  const keys = tags.map((t, i) => `${t}\u0000${tags.slice(0, i).filter((x) => x === t).length}`);
  const firstBad = reasons.findIndex(Boolean);
  const message = note || (firstBad >= 0 ? `${tags[firstBad]}: ${reasons[firstBad]}` : "");

  return (
    <div className={cx("grid w-full gap-1.5", className)}>
      <motion.div
        animate={shake}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setFocus(-1);
            field.current?.focus();
          }
        }}
        role="group"
        aria-label={label}
        aria-labelledby={aria["aria-labelledby"]}
        className={cx(
          "flex w-full cursor-text flex-wrap items-center gap-1.5 bg-[var(--bd-ui-field)] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
          "hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
          invalid && "shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)] focus-within:shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)]",
          disabled && "pointer-events-none opacity-50",
          s.field,
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {tags.map((t, i) => {
            const bad = !!reasons[i];
            return editing === i ? (
              <motion.span key={`${keys[i]}-edit`} layout="position" transition={reduced ? { duration: 0 } : SNAPPY} className={cx("inline-flex items-center rounded-full bg-[var(--bd-surface)] px-2.5 shadow-[0_0_0_1.5px_rgb(var(--bd-ink)/0.5)]", s.chip)}>
                <input
                  autoFocus
                  value={draft}
                  aria-label={`Edit ${t}`}
                  size={Math.max(2, draft.length)}
                  // All of it, so typing replaces the tag and an arrow puts the caret where it's wrong.
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => finishEdit(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      finishEdit(true);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      finishEdit(false);
                    }
                  }}
                  className="bg-transparent font-medium outline-none"
                />
              </motion.span>
            ) : (
              <motion.span
                key={keys[i]}
                ref={(el: HTMLSpanElement | null) => {
                  chips.current[i] = el;
                }}
                layout="position"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.75, transition: { duration: 0.12 } }}
                transition={reduced ? { duration: 0 } : SNAPPY}
                tabIndex={-1}
                role="button"
                aria-label={`${t}${bad ? `, ${reasons[i]}` : ""}. Enter to edit, Backspace to remove.`}
                title={bad ? reasons[i] : undefined}
                onKeyDown={(e) => onChipKey(e, i)}
                onFocus={() => setFocus(i)}
                onBlur={() => setFocus((f) => (f === i ? -1 : f))}
                onDoubleClick={() => startEdit(i)}
                className={cx(
                  "inline-flex max-w-full shrink-0 cursor-default select-none items-center gap-1 rounded-full pl-2.5 pr-1 font-medium outline-none transition-[background-color,box-shadow,color] duration-200",
                  s.chip,
                  bad ? "bg-[color-mix(in_oklab,var(--bd-ui-stop)_12%,var(--bd-ui-field))] text-[var(--bd-ui-stop)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-ui-stop)_45%,transparent)]" : "bg-[var(--bd-ui-track)] text-[var(--bd-fg)]",
                  focus === i && (bad ? "shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_2px_color-mix(in_oklab,var(--bd-ui-stop)_35%,transparent)]" : "shadow-[0_0_0_1.5px_rgb(var(--bd-ink)/0.55)]"),
                )}
              >
                {bad && <WarningCircleIcon size={13} weight="duotone" className="shrink-0" />}
                <span className="truncate">{t}</span>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Remove ${t}`}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => {
                    removeAt(i, -1);
                    field.current?.focus();
                  }}
                  className="grid size-5 place-items-center rounded-full opacity-70 transition-[opacity,background-color,scale] duration-150 hover:bg-[var(--bd-surface)] hover:opacity-100 active:scale-90"
                >
                  <XIcon size={10} weight="regular" />
                </button>
              </motion.span>
            );
          })}
        </AnimatePresence>
        <input
          ref={field}
          id={id ?? auto}
          value={text}
          disabled={disabled}
          placeholder={tags.length ? "" : placeholder}
          aria-label={label}
          aria-describedby={[aria["aria-describedby"], message ? `${auto}-note` : ""].filter(Boolean).join(" ") || undefined}
          aria-invalid={invalid || undefined}
          aria-required={aria["aria-required"]}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            const next = e.target.value;
            if (full && next.length > text.length) return refuse(`That's the most: ${max}.`);
            setText(next);
            if (note) setNote("");
          }}
          onKeyDown={onFieldKey}
          onPaste={onPaste}
          onFocus={() => setFocus(-1)}
          onBlur={() => {
            // A tag left typed goes in as you leave the field.
            if (text.trim() && add([text])) setText("");
          }}
          className={cx("min-w-[80px] flex-1 bg-transparent px-1 outline-none placeholder:text-[var(--bd-subtle)]", s.chip)}
        />
      </motion.div>
      <AnimatePresence initial={false}>
        {message && (
          <motion.p
            key="note"
            id={`${auto}-note`}
            role="status"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={reduced ? { duration: 0 } : SNAPPY}
            className="flex items-center gap-1.5 px-2 text-[12.5px] text-[var(--bd-ui-stop)]"
          >
            <WarningCircleIcon size={14} weight="duotone" className="shrink-0" />
            {message}
          </motion.p>
        )}
      </AnimatePresence>
      {name && tags.map((t, i) => <input key={keys[i]} type="hidden" name={name} value={t} disabled={disabled} />)}
    </div>
  );
}
