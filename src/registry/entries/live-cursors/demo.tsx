"use client";

import { useEffect, useState, type ComponentType } from "react";
import { LiveCursors, Viewers, type Person, type Presence } from "../../pro-ui/live-cursors";

const MAYA: Person = { id: "maya", name: "Emily Carter", color: "oklch(0.64 0.15 38)" };
const JONAH: Person = { id: "jonah", name: "Jake Morrison", color: "oklch(0.6 0.1 178)" };
const PRIYA: Person = { id: "priya", name: "Megan Turner", color: "oklch(0.7 0.12 82)", avatar: "/demo/people/priya-raman.jpg" };
const SAMI: Person = { id: "sami", name: "Ryan Brooks", color: "oklch(0.58 0.07 250)" };
const YOU: Person = { id: "you", name: "You", color: "oklch(0.55 0 0)" };

/* The board's notes, placed as parts of its width and height, so a selection can wrap one. */
const NOTES = [
  { id: "LP-01", title: "Pick the launch day", owner: "MO", done: true, x: 0.05, y: 0.1 },
  { id: "LP-04", title: "Write the announcement", owner: "MO", done: false, x: 0.37, y: 0.08 },
  { id: "LP-07", title: "Record the demo video", owner: "JP", done: false, x: 0.69, y: 0.12 },
  { id: "LP-09", title: "Email the waitlist", owner: "PR", done: false, x: 0.09, y: 0.54 },
  { id: "LP-12", title: "Fix onboarding step 3", owner: "JP", done: true, x: 0.4, y: 0.52 },
  { id: "LP-15", title: "Pricing page copy", owner: "MO", done: false, x: 0.71, y: 0.56 },
];
const NOTE = { w: 0.26, h: 0.3 };
const around = (i: number) => ({ x: NOTES[i].x - 0.012, y: NOTES[i].y - 0.02, w: NOTE.w + 0.024, h: NOTE.h + 0.04 });

/* What each person does, one beat at a time, round and round. */
type Beat = Partial<Omit<Presence, keyof Person>> & { x: number; y: number };
const SCRIPT: Record<string, Beat[]> = {
  maya: [
    { x: 0.28, y: 0.32 },
    { x: 0.4, y: 0.22 },
    { x: 0.44, y: 0.27, selection: around(1) },
    { x: 0.45, y: 0.29, selection: around(1), message: "Can we lead with the video?" },
    { x: 0.46, y: 0.3, selection: around(1), message: "Can we lead with the video?" },
    { x: 0.5, y: 0.4 },
    { x: 0.8, y: 0.66 },
    { x: 0.74, y: 0.72 },
  ],
  jonah: [
    { x: 0.84, y: 0.3 },
    { x: 0.8, y: 0.36 },
    { x: 0.72, y: 0.48 },
    { x: 0.64, y: 0.6 },
    { x: 0.6, y: 0.64, typing: true },
    { x: 0.6, y: 0.64, message: "Yes, it's ready by Monday" },
    { x: 0.58, y: 0.68, message: "Yes, it's ready by Monday" },
    { x: 0.7, y: 0.4 },
  ],
  priya: [
    { x: 0.16, y: 0.7 },
    { x: 0.22, y: 0.64 },
    { x: 0.2, y: 0.72 },
    { x: 0.26, y: 0.76 },
    { x: 0.3, y: 0.68 },
    { x: 0.24, y: 0.6 },
    { x: 0.24, y: 0.6, idle: true },
    { x: 0.24, y: 0.6, idle: true },
  ],
};

function Board() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[20px] bg-[var(--bd-surface-2)] shadow-[inset_0_0_0_1px_var(--bd-line)] max-sm:aspect-square">
      {NOTES.map((n) => (
        <div key={n.id} className="absolute flex flex-col justify-between rounded-[12px] p-3 shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.07)] [background:var(--bd-ui-raised)] max-sm:p-2" style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%`, width: `${NOTE.w * 100}%`, height: `${NOTE.h * 100}%` }}>
          <span className="flex items-center justify-between font-mono text-[10.5px] text-[var(--bd-subtle)]">
            {n.id}
            <span className={`grid size-3.5 place-items-center rounded-[4px] ${n.done ? "bg-[var(--bd-fg)] text-[var(--bd-surface)]" : "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.25)]"}`}>
              {n.done && (
                <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M2.5 6.2 5 8.5 9.5 3.5" />
                </svg>
              )}
            </span>
          </span>
          <span className={`text-[13px] font-medium leading-snug tracking-[-0.01em] max-sm:text-[11px] ${n.done ? "text-[var(--bd-subtle)] line-through decoration-[rgb(var(--bd-ink)/0.3)]" : "text-[var(--bd-fg)]"}`}>{n.title}</span>
          <span className="self-end font-mono text-[10.5px] text-[var(--bd-muted)] max-sm:hidden">{n.owner}</span>
        </div>
      ))}
    </div>
  );
}

export function Demo() {
  const [beat, setBeat] = useState(0);
  const [following, setFollowing] = useState<string | null>(null);
  useEffect(() => {
    const t = setInterval(() => setBeat((b) => b + 1), 1500);
    return () => clearInterval(t);
  }, []);
  const people: Presence[] = [MAYA, JONAH, PRIYA].map((p) => ({ ...p, ...SCRIPT[p.id][beat % SCRIPT[p.id].length] }));
  return (
    <div className="grid w-full max-w-[720px] gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[14px] font-medium text-[var(--bd-fg)]">Launch plan</p>
          <p className="text-[12.5px] text-[var(--bd-subtle)]">Press / over the board to say something</p>
        </div>
        <Viewers people={[MAYA, JONAH, PRIYA, SAMI, YOU]} max={4} following={following} onFollow={setFollowing} />
      </div>
      <LiveCursors people={people} you={YOU} following={following} onStopFollowing={() => setFollowing(null)} className="rounded-[20px]">
        <Board />
      </LiveCursors>
    </div>
  );
}

/* Just the faces, over a doc's title. */
function Faces() {
  const [following, setFollowing] = useState<string | null>("maya");
  return (
    <div className="flex w-full max-w-[460px] items-center justify-between gap-4 rounded-[18px] bg-[var(--bd-surface)] px-4 py-3 shadow-[inset_0_0_0_1px_var(--bd-line)]">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-[var(--bd-fg)]">Q4 roadmap</p>
        <p className="text-[12.5px] text-[var(--bd-subtle)]">{following ? `Following ${[MAYA, JONAH, PRIYA, SAMI].find((p) => p.id === following)?.name.split(" ")[0]}` : "6 people here"}</p>
      </div>
      <Viewers people={[MAYA, JONAH, PRIYA, SAMI, { id: "a", name: "Ava Robinson", color: "oklch(0.6 0.15 340)" }, { id: "b", name: "Sarah Mitchell", color: "oklch(0.58 0.12 120)" }]} max={4} following={following} onFollow={setFollowing} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { faces: Faces };
