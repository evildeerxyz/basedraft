"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@/lib/site";
import { LINE_H, PANE_SCROLL } from "./bits";
import { Code } from "./highlight";
import { predict } from "./workspace";

export type Cursor = { line: number; col: number };

const GUTTER = 48;
const PAD = 12;

/** Pure text edit for one key press; null when the key is not an edit. */
function edit(lines: string[], c: Cursor, key: string): { lines: string[]; cursor: Cursor } | null {
  const next = lines.slice();
  const line = next[c.line] ?? "";
  switch (key) {
    case "Backspace":
      if (c.col > 0) {
        next[c.line] = line.slice(0, c.col - 1) + line.slice(c.col);
        return { lines: next, cursor: { line: c.line, col: c.col - 1 } };
      }
      if (c.line > 0) {
        const prev = next[c.line - 1];
        next.splice(c.line - 1, 2, prev + line);
        return { lines: next, cursor: { line: c.line - 1, col: prev.length } };
      }
      return null;
    case "Delete":
      if (c.col < line.length) {
        next[c.line] = line.slice(0, c.col) + line.slice(c.col + 1);
        return { lines: next, cursor: c };
      }
      if (c.line < next.length - 1) {
        next.splice(c.line, 2, line + next[c.line + 1]);
        return { lines: next, cursor: c };
      }
      return null;
    case "Enter": {
      const indent = /^\s*/.exec(line)![0];
      next.splice(c.line, 1, line.slice(0, c.col), indent + line.slice(c.col).trimStart());
      return { lines: next, cursor: { line: c.line + 1, col: indent.length } };
    }
    default:
      if (key.length !== 1) return null;
      next[c.line] = line.slice(0, c.col) + key + line.slice(c.col);
      return { lines: next, cursor: { line: c.line, col: c.col + 1 } };
  }
}

function move(lines: string[], c: Cursor, key: string): Cursor | null {
  const len = (l: number) => (lines[l] ?? "").length;
  switch (key) {
    case "ArrowLeft":
      return c.col > 0 ? { ...c, col: c.col - 1 } : c.line > 0 ? { line: c.line - 1, col: len(c.line - 1) } : c;
    case "ArrowRight":
      return c.col < len(c.line) ? { ...c, col: c.col + 1 } : c.line < lines.length - 1 ? { line: c.line + 1, col: 0 } : c;
    case "ArrowUp":
      return c.line > 0 ? { line: c.line - 1, col: Math.min(c.col, len(c.line - 1)) } : { ...c, col: 0 };
    case "ArrowDown":
      return c.line < lines.length - 1 ? { line: c.line + 1, col: Math.min(c.col, len(c.line + 1)) } : { ...c, col: len(c.line) };
    case "Home":
      return { ...c, col: 0 };
    case "End":
      return { ...c, col: len(c.line) };
  }
  return null;
}

/**
 * A deliberately small editor: click to place the cursor, type, move with the
 * keyboard, undo and save. Tab accepts a prediction when one is showing.
 */
export function CodeEditor({
  lines,
  cursor,
  onChange,
  onCursor,
  onUndo,
  onSave,
  onFirstInput,
  ghost,
  onAcceptGhost,
  showCaret,
  fresh,
  tabEnabled,
  label,
}: {
  lines: string[];
  cursor: Cursor;
  onChange: (lines: string[], cursor: Cursor) => void;
  onCursor: (cursor: Cursor) => void;
  onUndo: () => void;
  onSave: () => void;
  /** Called before the first real interaction, so the demo can hand over control. */
  onFirstInput?: () => void;
  /** An externally driven suggestion at the cursor (the opening demo). */
  ghost?: string | null;
  onAcceptGhost?: () => void;
  showCaret?: boolean;
  fresh?: number[];
  tabEnabled: boolean;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [focused, setFocused] = useState(false);
  const [chW, setChW] = useState(7.5);

  useLayoutEffect(() => {
    const measure = () => probe.current && setChW(probe.current.getBoundingClientRect().width / 40);
    measure();
    document.fonts?.ready.then(measure);
  }, []);

  // keep the cursor in view while typing or moving
  useEffect(() => {
    const el = ref.current;
    if (!el || !focused) return;
    const top = PAD + cursor.line * LINE_H;
    if (top < el.scrollTop) el.scrollTop = top - LINE_H;
    else if (top + LINE_H > el.scrollTop + el.clientHeight) el.scrollTop = top + 2 * LINE_H - el.clientHeight;
  }, [cursor, focused]);

  const line = lines[cursor.line] ?? "";
  const prediction = !ghost && tabEnabled && focused && cursor.col === line.length ? predict(line) : null;
  const shownGhost = ghost ?? prediction;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      onFirstInput?.();
      return onUndo();
    }
    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      return onSave();
    }
    if (mod || e.altKey) return;
    if (e.key === "Escape") return ref.current?.blur();
    if (e.key === "Tab") {
      if (e.shiftKey) return;
      if (ghost && onAcceptGhost) {
        e.preventDefault();
        return onAcceptGhost();
      }
      if (prediction) {
        e.preventDefault();
        onFirstInput?.();
        const next = lines.slice();
        next[cursor.line] = line + prediction;
        return onChange(next, { line: cursor.line, col: next[cursor.line].length });
      }
      return;
    }
    const moved = move(lines, cursor, e.key);
    if (moved) {
      e.preventDefault();
      onFirstInput?.();
      return onCursor(moved);
    }
    const result = edit(lines, cursor, e.key);
    if (result) {
      e.preventDefault();
      onFirstInput?.();
      onChange(result.lines, result.cursor);
    }
  };

  const place = (e: MouseEvent, row: number) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const col = Math.round((e.clientX - r.left - GUTTER) / chW);
    onFirstInput?.();
    onCursor({ line: row, col: Math.max(0, Math.min(col, (lines[row] ?? "").length)) });
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="textbox"
      aria-multiline="true"
      aria-label={label}
      data-lenis-prevent
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseDown={(e) => {
        // clicks below the last line put the cursor at the end of the file
        if (e.target === e.currentTarget) {
          onFirstInput?.();
          const last = lines.length - 1;
          onCursor({ line: last, col: (lines[last] ?? "").length });
        }
      }}
      className={cn("relative h-full cursor-text bg-ink font-mono text-[12.5px] outline-none", PANE_SCROLL)}
      style={{ paddingTop: PAD, paddingBottom: PAD * 4 }}
    >
      <span ref={probe} aria-hidden className="pointer-events-none invisible absolute whitespace-pre">
        {"0".repeat(40)}
      </span>
      {lines.map((text, i) => {
        const current = i === cursor.line;
        return (
          <div
            key={i}
            onMouseDown={(e) => place(e, i)}
            className={cn(
              "relative flex whitespace-pre pr-4",
              current && focused && "bg-paper/[0.03]",
              fresh?.includes(i) && "[animation:settle_1.6s_ease-out]",
            )}
            style={{ height: LINE_H, lineHeight: `${LINE_H}px` }}
          >
            <span className={cn("w-12 shrink-0 select-none pr-4 text-right", current ? "text-paper/60" : "text-paper/20")}>
              {i + 1}
            </span>
            <span>
              <Code line={text} />
            </span>
            {current && shownGhost && (
              <>
                <span className="text-paper/30">{shownGhost}</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (ghost && onAcceptGhost) return onAcceptGhost();
                    const next = lines.slice();
                    next[i] = text + shownGhost;
                    onChange(next, { line: i, col: next[i].length });
                    ref.current?.focus();
                  }}
                  className="ml-3 inline-flex h-[18px] translate-y-px items-center gap-1.5 rounded-[3px] border border-accent/50 bg-accent/10 px-1.5 font-sans text-[10.5px] font-medium text-accent transition-colors hover:bg-accent hover:text-ink"
                >
                  Tab <span className="hidden font-normal opacity-70 sm:inline">to accept · on-device</span>
                </button>
              </>
            )}
            {current && (focused || showCaret) && (
              <span
                aria-hidden
                className="pointer-events-none absolute top-[3px] h-[14px] w-[2px] bg-accent [animation:blink_1s_steps(1)_infinite]"
                style={{ left: GUTTER + cursor.col * chW }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
