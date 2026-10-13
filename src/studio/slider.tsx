"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * A filled-track slider: the track fills up to the value and a slim ink handle marks it. Click
 * anywhere to jump, drag to scrub, click the number to type one. A faint mark shows where the
 * template has it; double-click the track to go back there.
 */
export function Slider({
  label,
  value,
  onChange,
  onReset,
  min = 0,
  max = 100,
  step = 1,
  mark,
  format = (v) => String(v),
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  /** Back to the template's own (a double-click on the track). */
  onReset?: () => void;
  min?: number;
  max?: number;
  step?: number;
  /** Where the template has it, marked on the track. */
  mark?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const decimals = (String(step).split(".")[1] ?? "").length;
  const snap = (v: number) => {
    const s = Math.round((v - min) / step) * step + min;
    return Number(Math.min(max, Math.max(min, s)).toFixed(decimals));
  };
  const pct = (v: number) => ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100;
  const at = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return snap(min + ((clientX - r.left - 3) / (r.width - 6)) * (max - min));
  };

  const lastDown = useRef(0);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // A second press within 300ms is a double-click: back to the template's own, not a jump.
    if (e.timeStamp - lastDown.current < 300 && onReset) {
      lastDown.current = 0;
      onReset();
      return;
    }
    lastDown.current = e.timeStamp;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(at(e.clientX));
  };
  const move = (e: PointerEvent<HTMLDivElement>) => dragging && onChange(at(e.clientX));
  const up = () => setDragging(false);

  const key = (e: KeyboardEvent) => {
    const big = (max - min) / 10;
    const delta: Record<string, number> = { ArrowRight: e.shiftKey ? big : step, ArrowUp: e.shiftKey ? big : step, ArrowLeft: e.shiftKey ? -big : -step, ArrowDown: e.shiftKey ? -big : -step, PageUp: big, PageDown: -big };
    if (e.key in delta) onChange(snap(value + delta[e.key]));
    else if (e.key === "Home") onChange(min);
    else if (e.key === "End") onChange(max);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const commit = () => {
    const n = parseFloat(draft.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) onChange(snap(n));
    setEditing(false);
  };
  const p = pct(value);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="text-[12px] text-muted">
          {label}
        </span>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            aria-label={`${label} value`}
            className="h-5 w-16 rounded-[6px] bg-fg/[0.06] px-1 text-right font-mono text-[12px] tabular-nums text-fg outline-none ring-2 ring-fg/15"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
            title="Type a value"
            className="rounded-[6px] px-1 font-mono text-[12px] tabular-nums text-fg transition-colors hover:bg-fg/[0.06]"
          >
            {format(value)}
          </button>
        )}
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        className="group relative h-8 cursor-ew-resize touch-none select-none rounded-[8px] bg-fg/[0.05] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-fg/15"
      >
        <div className={cn("absolute bottom-[3px] left-[3px] top-[3px] rounded-[6px]", dragging ? "bg-fg/[0.17]" : "bg-fg/[0.11] transition-[width,background-color] duration-150 group-hover:bg-fg/[0.14]")} style={{ width: `calc((100% - 6px) * ${p / 100} + 2px)` }} />
        {mark !== undefined && Math.abs(mark - value) > step / 2 && <span aria-hidden title="The template's own" className="pointer-events-none absolute bottom-[5px] h-[5px] w-px -translate-x-1/2 bg-fg/35" style={{ left: `calc(3px + (100% - 6px) * ${pct(mark) / 100})` }} />}
        <span aria-hidden className={cn("pointer-events-none absolute top-1/2 h-[18px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg", dragging ? "scale-y-[1.2]" : "transition-[left,transform] duration-150 group-hover:scale-y-110")} style={{ left: `calc(3px + (100% - 6px) * ${p / 100} - 1px)` }} />
      </div>
    </div>
  );
}
