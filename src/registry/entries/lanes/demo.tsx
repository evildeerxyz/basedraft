"use client";

import { BookOpenTextIcon, LightningIcon, StorefrontIcon } from "@phosphor-icons/react";
import { useState, type ComponentType, type ReactNode } from "react";
import { Lanes, type LaneEvent, type LaneRow } from "../../ui/lanes";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 12, 15, 0);
const FROM = Date.UTC(2026, 9, 30);
const TO = Date.UTC(2026, 10, 13);
const at = (day: number, hour: number) => FROM + day * DAY + hour * 3_600_000;

/* Three services over two weeks: when each shipped, what was tried, what failed. */
const EVENTS: Record<string, Array<[number, number, LaneEvent["kind"], string]>> = {
  storefront: [[1, 10, "try", "Preview 1f3c2a9"], [4, 11, "ship", "Released 7c2e9a1"], [5, 15, "ship", "Released 3be01d4"], [6, 9, "try", "Preview a90c771"], [6, 16, "ship", "Released 0d2f8e1"], [10, 11, "try", "Preview 5e1b9c0"], [11, 14, "ship", "Released e8e1b1d"]],
  api: [[2, 13, "ship", "Released 44a1c0e"], [5, 10, "try", "Preview c0ffee1"], [7, 17, "ship", "Released 91b2d3a"], [11, 16, "fail", "Build failed"], [12, 11, "ship", "Released 7d1e0c2"]],
  docs: [[0, 12, "ship", "Released 2a7f9e3"], [3, 15, "try", "Preview 6b2d1f0"], [10, 10, "ship", "Released 8e0a5c4"]],
};
const tile = (icon: ReactNode) => <span className="grid size-8 place-items-center rounded-[9px] bg-[var(--bd-raised)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)] [&_svg]:size-[17px]">{icon}</span>;

const rows = (running: boolean): LaneRow[] => [
  { id: "storefront", label: "storefront", sub: "acme.com", lead: tile(<StorefrontIcon weight="duotone" />), aside: "1.8M", events: [...EVENTS.storefront.map(([d, h, kind, label], i) => ({ id: `s${i}`, at: at(d, h), kind, label })), ...(running ? [{ id: "run", at: NOW, kind: "run" as const, label: "Building now" }] : [])] },
  { id: "api", label: "api", sub: "api.acme.com", lead: tile(<LightningIcon weight="duotone" />), aside: "3.1M", events: EVENTS.api.map(([d, h, kind, label], i) => ({ id: `a${i}`, at: at(d, h), kind, label })) },
  { id: "docs", label: "docs", sub: "docs.acme.com", lead: tile(<BookOpenTextIcon weight="duotone" />), aside: "412K", events: EVENTS.docs.map(([d, h, kind, label], i) => ({ id: `d${i}`, at: at(d, h), kind, label })) },
];

export function Demo() {
  const [picked, setPicked] = useState<string | null>("storefront");
  return (
    <div className="w-full max-w-[860px]">
      <Lanes label="Projects" rows={rows(true)} from={FROM} to={TO} now={NOW} aside="Requests, 7d" selected={picked} onSelect={(id) => setPicked((p) => (p === id ? null : id))} />
    </div>
  );
}

function Narrow() {
  return (
    <div className="w-full max-w-[360px]">
      <Lanes label="Projects" rows={rows(false)} from={FROM} to={TO} now={NOW} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { narrow: Narrow };
