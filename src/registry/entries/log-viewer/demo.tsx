"use client";

import { useEffect, useState, type ComponentType } from "react";
import { LogViewer, type LogLevel, type LogLine } from "../../ui/log-viewer";
import { hint } from "../_shared/kit";

/* A deploy, from clone to live, at fixed times so every visitor sees the same lines. */
const START = Date.parse("2026-10-29T14:02:11.000Z");
const DEPLOY: Array<[number, LogLevel, string, string, Record<string, unknown>?]> = [
  [0, "info", "build", "Cloning github.com/acme/web (main, 4f9c2e1)"],
  [420, "info", "build", "Using Node.js 22.11 and npm 10.9"],
  [980, "info", "install", "npm ci"],
  [5210, "warn", "install", "deprecated inflight@1.0.6: not supported, and leaks memory"],
  [8740, "info", "install", "added 812 packages in 8s"],
  [8900, "info", "build", "next build"],
  [9300, "debug", "build", "Loaded env from .env.production (12 keys)"],
  [11240, "info", "build", "Creating an optimized production build"],
  [19820, "info", "build", "Compiled successfully in 8.5s"],
  [20100, "info", "build", "Linting and checking types"],
  [24050, "warn", "lint", "src/app/page.tsx:42:7  Image elements must have an alt prop", { rule: "jsx-a11y/alt-text", file: "src/app/page.tsx", line: 42 }],
  [26300, "info", "build", "Collecting page data"],
  [28710, "error", "build", "GET /api/plans failed: 503 Service Unavailable (try 1 of 3)", { url: "https://api.acme.dev/plans", status: 503, retryIn: "2s" }],
  [30750, "info", "build", "GET /api/plans: 200 OK in 312ms"],
  [31200, "info", "build", "Generating static pages (24/24)"],
  [35900, "info", "build", "Finalizing page optimization"],
  [38200, "info", "deploy", "Uploading the build: 6.2 MB"],
  [40100, "info", "deploy", "Live at https://web-4f9c2e1.acme.app", { region: "iad1", took: "41s" }],
];
const LINES: LogLine[] = DEPLOY.map(([ms, level, source, message, fields], i) => ({ id: i, time: START + ms, level, source, message, fields }));

export function Demo() {
  const [n, setN] = useState(7);
  useEffect(() => {
    if (n >= LINES.length) return;
    const t = setTimeout(() => setN((x) => x + 1), 700);
    return () => clearTimeout(t);
  }, [n]);
  const done = n >= LINES.length;
  return (
    <div className="grid w-full max-w-[680px] gap-3">
      <LogViewer title="Deploy" live={!done} lines={LINES.slice(0, n)} height={292} />
      <div className="flex h-7 items-center justify-between gap-3 px-1">
        <p className={hint}>Filter by level, search, or open a line with ›.</p>
        {done && (
          <button type="button" onClick={() => setN(3)} className="h-7 rounded-full px-3 text-[12.5px] font-medium text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_var(--bd-line)] transition-colors hover:text-[var(--bd-fg)]">
            Run again
          </button>
        )}
      </div>
    </div>
  );
}

/* A server's requests, with what each one carried. */
const T = Date.parse("2026-10-29T09:15:00.000Z");
const SERVER: LogLine[] = [
  { time: T + 120, level: "info", source: "api", message: "GET /v1/projects 200 in 48ms", fields: { user: "u_81f2", ip: "203.0.113.24", cache: "hit" } },
  { time: T + 940, level: "info", source: "api", message: "POST /v1/projects 201 in 212ms", fields: { user: "u_81f2", project: "prj_5k2m" } },
  { time: T + 1330, level: "debug", source: "queue", message: "Enqueued build for prj_5k2m", fields: { job: "job_99ab", position: 3 } },
  { time: T + 2050, level: "warn", source: "api", message: "GET /v1/billing 429 rate limited", fields: { user: "u_02cc", limit: "60/min", retryAfter: "14s" } },
  { time: T + 2410, level: "info", source: "api", message: "GET /v1/projects/prj_5k2m 200 in 31ms" },
  { time: T + 3870, level: "error", source: "worker", message: "Build job_99ab failed: exit code 1", fields: { job: "job_99ab", step: "npm run build", error: "Module not found: Can't resolve './chart' in '/app/src/components'" } },
  { time: T + 4100, level: "info", source: "api", message: "DELETE /v1/sessions/s_77 204 in 12ms" },
  { time: T + 5320, level: "info", source: "api", message: "GET /healthz 200 in 2ms" },
];

function Server() {
  return <LogViewer title="api-7f9c" lines={SERVER} height={240} wrap className="w-full max-w-[680px]" />;
}

export const examples: Record<string, ComponentType> = { server: Server };
