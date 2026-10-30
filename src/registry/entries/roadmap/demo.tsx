"use client";

import { useState, type ComponentType } from "react";
import { Roadmap, type RoadmapItem } from "../../pro-ui/roadmap";
import { hint } from "../_shared/kit";

const WORK: RoadmapItem[] = [
  { id: "a", group: "Storefront", title: "Checkout redesign", start: "2026-10-12", end: "2026-11-06", status: "active", progress: 0.62, owner: "Jake Morrison" },
  { id: "b", group: "Storefront", title: "Gift cards", start: "2026-11-02", end: "2026-11-27", status: "planned", owner: "Sarah Mitchell" },
  { id: "c", group: "Platform", title: "Move to fra1", start: "2026-10-05", end: "2026-10-23", status: "done", owner: "Ryan Brooks" },
  { id: "d", group: "Platform", title: "Edge caching", start: "2026-10-26", end: "2026-11-20", status: "risk", progress: 0.3, owner: "Megan Turner" },
  { id: "e", group: "Platform", title: "Logs to S3", start: "2026-11-16", end: "2026-12-04", status: "planned", owner: "Tyler Hayes" },
];

export function Demo() {
  const [items, setItems] = useState(WORK);
  const [picked, setPicked] = useState<string | null>("a");
  return (
    <div className="grid w-full max-w-[720px] gap-3">
      <Roadmap items={items} onItemsChange={setItems} from="2026-10-05" days={63} today="2026-10-30" selected={picked} onSelect={(i) => setPicked(i.id)} />
      <p className={hint}>Drag a bar to move it, or an end to stretch it.</p>
    </div>
  );
}

function Quarter() {
  return (
    <div className="w-full max-w-[720px]">
      <Roadmap defaultItems={WORK} from="2026-10-01" days={92} today="2026-10-30" scale="month" />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { quarter: Quarter };
