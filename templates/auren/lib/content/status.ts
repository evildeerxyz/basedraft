export type DayState = "ok" | "degraded" | "outage";

export type Service = { name: string; detail: string; days: DayState[] };

// Deterministic history so server and client render the same bars.
function history(seed: number, incidents: Array<[number, DayState]>): DayState[] {
  const days: DayState[] = Array.from({ length: 90 }, () => "ok");
  for (const [day, state] of incidents) days[day] = state;
  // a little texture: rare brief degradations
  for (let i = 0; i < 90; i++) {
    const h = Math.sin((i + 1) * (seed + 1) * 12.9898) * 43758.5453;
    if (h - Math.floor(h) > 0.985 && days[i] === "ok") days[i] = "degraded";
  }
  return days;
}

export const SERVICES: Service[] = [
  { name: "Agent API", detail: "Hosted agent runs and model routing", days: history(1, [[61, "outage"], [62, "degraded"]]) },
  { name: "Tab model downloads", detail: "On-device model updates", days: history(2, []) },
  { name: "Accounts and billing", detail: "Sign in, plans and invoices", days: history(3, [[33, "degraded"]]) },
  { name: "Editor updates", detail: "Release channel and auto-update", days: history(4, []) },
  { name: "Team sync", detail: "Shared indexes and rules", days: history(5, [[78, "degraded"]]) },
  { name: "Website and docs", detail: "auren.dev", days: history(6, []) },
];

export const uptime = (days: DayState[]) => {
  const lost = days.reduce((n, d) => n + (d === "outage" ? 0.02 : d === "degraded" ? 0.004 : 0), 0);
  return (100 - (lost / days.length) * 100).toFixed(2);
};

export const INCIDENTS = [
  {
    date: "Sep 9, 2026",
    title: "Elevated agent latency in US regions",
    state: "Resolved",
    body: "A model provider slowed down for 38 minutes. We shifted traffic to a second region; runs were slower but none were lost.",
  },
  {
    date: "Aug 10, 2026",
    title: "Agent runs failing to start",
    state: "Resolved",
    body: "A configuration change to the gateway rejected new runs for 22 minutes. We rolled it back and added a canary stage to the deploy.",
  },
  {
    date: "Jul 8, 2026",
    title: "Delayed invoice emails",
    state: "Resolved",
    body: "Invoices for the July billing cycle were sent up to six hours late. No charges were affected.",
  },
];
