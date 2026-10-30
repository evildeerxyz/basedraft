"use client";

import { useEffect, useState, type ComponentType } from "react";
import { SplitFlap } from "../../pro-ui/split-flap";

const FLIGHTS: Array<[time: string, to: string, gate: string]> = [
  ["14:20", "LISBON", "A12"],
  ["14:35", "NEW YORK", "B04"],
  ["14:50", "TOKYO", "C21"],
  ["15:05", "NAIROBI", "A07"],
  ["15:15", "OSLO", "B11"],
  ["15:30", "SEOUL", "C02"],
  ["15:45", "MONTREAL", "A03"],
  ["16:00", "BERLIN", "B09"],
];
const AMBER = "oklch(0.82 0.15 78)";
const GREEN = "oklch(0.84 0.15 150)";

/** What row r says at this point: the first one boards, calls and leaves; then the board moves up. */
function statusOf(r: number, flight: number, phase: number): [string, string | undefined] {
  if (r === 0) return [["BOARDING", "LAST CALL", "DEPARTED"][phase], phase < 2 ? GREEN : undefined];
  if (r === 1) return phase === 2 ? ["BOARDING", GREEN] : ["ON TIME", undefined];
  if (flight % 3 === 2) return ["DELAYED", AMBER];
  return [flight % 4 === 0 ? "GATE OPEN" : "ON TIME", undefined];
}

const LABEL = "font-mono text-[0.5em] uppercase tracking-[0.14em] text-[oklch(0.62_0.01_85)]";

export function Demo() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3400);
    return () => clearInterval(t);
  }, []);
  const phase = tick % 3;
  const top = Math.floor(tick / 3) % FLIGHTS.length;
  return (
    <div className="@container w-full max-w-[640px]">
      <div className="rounded-[22px] p-[1.1em] text-[12px] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(0_0_0/0.4),0_24px_50px_-24px_rgb(0_0_0/0.7)] @[480px]:text-[15px] @[620px]:text-[19px]" style={{ background: "linear-gradient(180deg, oklch(0.16 0.003 270), oklch(0.11 0.003 270))" }}>
        <div className="mb-[0.9em] flex items-center justify-between">
          <SplitFlap value="DEPARTURES" />
          <SplitFlap value="14:05" />
        </div>
        <div className="grid gap-[0.32em]">
          {/* Each label as wide as its column of tiles: n tiles of 0.8em with 0.06em between. */}
          <div className="flex gap-[0.7em] pb-[0.15em]">
            {(
              [
                ["Time", 5],
                ["To", 8],
                ["Gate", 3],
                ["Status", 9],
              ] as const
            ).map(([name, n]) => (
              <span key={name} className="shrink-0" style={{ width: `${n * 0.8 + (n - 1) * 0.06}em` }}>
                <span className={LABEL}>{name}</span>
              </span>
            ))}
          </div>
          {Array.from({ length: 5 }, (_, r) => {
            const f = (top + r) % FLIGHTS.length;
            const [time, to, gate] = FLIGHTS[f];
            const [status, color] = statusOf(r, f, phase);
            return (
              <div key={r} className="flex gap-[0.7em]">
                <SplitFlap value={time} length={5} />
                <SplitFlap value={to} length={8} />
                <SplitFlap value={gate} length={3} />
                <SplitFlap value={status} length={9} color={color} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Whatever you type, on twelve tiles. */
function Type() {
  const [text, setText] = useState("HELLO THERE");
  return (
    // One column: the input as wide as the board, both with the same corners.
    <div className="inline-grid gap-3">
      <div className="flex justify-center rounded-[16px] p-3 text-[22px] shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(0_0_0/0.4)] max-[480px]:text-[15px]" style={{ background: "linear-gradient(180deg, oklch(0.16 0.003 270), oklch(0.11 0.003 270))" }}>
        <SplitFlap value={text} length={12} speed={45} stagger={30} />
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 12))}
        aria-label="What the board says"
        placeholder="Type up to 12 letters"
        className="h-11 w-full rounded-[16px] bg-[var(--bd-ui-field)] px-4 text-center font-mono text-[14px] uppercase tracking-[0.1em] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--bd-subtle)] focus-visible:shadow-[var(--bd-ui-well),0_0_0_2px_var(--bd-ui-focus)]"
      />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { type: Type };
