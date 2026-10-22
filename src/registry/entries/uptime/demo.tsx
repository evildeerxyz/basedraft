"use client";

import type { ComponentType } from "react";
import { Uptime, type UptimeDay, type UptimeIncident } from "../../pro-ui/uptime";

/* The demos' last day: fixed, so the page is the same for everyone and builds without a clock. */
const END = Date.parse("2026-10-17T00:00:00Z");
const DAY = 86_400_000;

/** 90 days of a service: all well, but for the incidents on the days given (days ago), and nothing before `since`. */
function history(incidents: Record<number, UptimeIncident[]>, since = 90): UptimeDay[] {
  return Array.from({ length: 90 }, (_, i) => {
    const ago = 89 - i;
    const date = new Date(END - ago * DAY).toISOString().slice(0, 10);
    if (ago >= since) return { date };
    const list = incidents[ago];
    if (!list) return { date, up: 1 };
    const slow = list.filter((x) => x.tone === "warn").reduce((s, x) => s + x.minutes, 0) / 1440;
    const down = list.filter((x) => x.tone !== "warn").reduce((s, x) => s + x.minutes, 0) / 1440;
    return { date, up: 1 - slow - down, degraded: slow, incidents: list };
  });
}

const WEBSITE = history({
  61: [{ title: "Slow pages in Europe", minutes: 42, tone: "warn" }],
  23: [{ title: "Certificate renewal failed", minutes: 18, tone: "stop" }],
});
const API = history({
  77: [{ title: "Elevated error rate", minutes: 26, tone: "warn" }],
  44: [
    { title: "Database failover", minutes: 94, tone: "stop" },
    { title: "Slow writes after failover", minutes: 140, tone: "warn" },
  ],
  12: [{ title: "Rate limits too strict", minutes: 35, tone: "warn" }],
  0: [{ title: "Slow responses in us-east", minutes: 22, tone: "warn" }],
});
const BUILDS = history(
  {
    30: [{ title: "Build queue stuck", minutes: 310, tone: "stop" }],
    9: [{ title: "Slow installs", minutes: 55, tone: "warn" }],
  },
  70,
);

const CARD = "w-full max-w-[720px] rounded-[28px] bg-[var(--bd-surface)] p-6 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]";

export function Demo() {
  return (
    <div className={`${CARD} grid gap-7`}>
      <Uptime name="Website" days={WEBSITE} />
      <Uptime name="API" days={API} status="degraded" />
      <Uptime name="Builds" days={BUILDS} />
    </div>
  );
}

function System() {
  return (
    <div className={`${CARD} grid gap-7`}>
      <Uptime name="Website" days={WEBSITE} />
      <Uptime name="API" days={API} status="degraded" />
      <Uptime name="Builds" days={BUILDS} />
    </div>
  );
}

function Month() {
  return (
    <div className="w-full max-w-[460px]">
      <Uptime name="Dashboard" days={API} span={30} dither={false} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { system: System, month: Month };
