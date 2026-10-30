"use client";

import type { ComponentType } from "react";
import { KanbanBoard, type KanbanColumn } from "../../pro-ui/kanban-board";

/* A template's launch, from the first idea to what's live. */
const LAUNCH: KanbanColumn[] = [
  { id: "ideas", title: "Ideas", cards: [{ id: "a", title: "A pricing page for Auren", note: "Three plans, per-seat Team", tags: ["Copy"] }, { id: "b", title: "Noma in dark mode", tags: ["Design"] }] },
  { id: "writing", title: "Writing", limit: 3, cards: [{ id: "c", title: "Zuno hero, take two", note: "Shorter promise, one action", people: ["Olivia Bennett"], meta: "Fri" }] },
  { id: "review", title: "In review", cards: [{ id: "d", title: "Security section", people: ["Jake Morrison", "Sarah Mitchell"], meta: "2 notes" }] },
  { id: "shipped", title: "Shipped", cards: [{ id: "e", title: "Changelog, October", tags: ["Live"] }] },
];

let next = 0;
const add = (_: string, title: string) => ({ id: `new-${next++}`, title });

export function Demo() {
  return (
    <div className="w-full max-w-[1040px]">
      <KanbanBoard label="Zuno launch" defaultColumns={LAUNCH} onAddCard={add} size="sm" />
    </div>
  );
}

function Limits() {
  return (
    <div className="w-full max-w-[760px]">
      <KanbanBoard
        label="Review queue"
        size="sm"
        enforceLimits
        defaultColumns={[
          { id: "todo", title: "To review", cards: [{ id: "1", title: "Noma pricing" }, { id: "2", title: "Auren FAQ" }] },
          { id: "doing", title: "Reviewing", limit: 2, cards: [{ id: "3", title: "Zuno manifesto" }, { id: "4", title: "Noma stats" }] },
          { id: "done", title: "Approved", cards: [] },
        ]}
      />
    </div>
  );
}

function Compact() {
  return (
    <div className="w-full max-w-[640px]">
      <KanbanBoard label="This week" size="sm" defaultCollapsed={["shipped"]} defaultColumns={LAUNCH} />
    </div>
  );
}

const ORDERS: KanbanColumn[] = [
  { id: "new", title: "New", cards: [{ id: "o1", title: "Pro, Riley Parker", meta: "$149" }, { id: "o2", title: "Zuno, Sam Ito", meta: "$79" }] },
  { id: "sent", title: "Delivered", cards: [{ id: "o3", title: "Team, Parker Studio", meta: "$399" }] },
];

function Custom() {
  return (
    <div className="w-full max-w-[600px]">
      <KanbanBoard
        label="Orders"
        size="sm"
        defaultColumns={ORDERS}
        renderCard={(o) => (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{o.title}</span>
            <span className="text-xs tabular-nums text-[var(--bd-muted)]">{o.meta}</span>
          </div>
        )}
      />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { limits: Limits, compact: Compact, custom: Custom };
