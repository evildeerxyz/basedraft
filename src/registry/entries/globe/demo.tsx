"use client";

import { useState, type ComponentType } from "react";
import { Globe, type GlobeArc, type GlobeMarker } from "../../pro-ui/globe";

/* Where requests are served from, and how far each is from a visitor in London. */
type Region = GlobeMarker & { code: string; ms: number };
const REGIONS: Region[] = ([
  { id: "lhr", code: "lhr", label: "London", lat: 51.5, lon: -0.1, ms: 4, tone: "ink", detail: "You are here" },
  { id: "fra", code: "fra", label: "Frankfurt", lat: 50.1, lon: 8.7, ms: 14, tone: "ok" },
  { id: "iad", code: "iad", label: "Washington", lat: 38.9, lon: -77, ms: 76, tone: "ok" },
  { id: "bom", code: "bom", label: "Mumbai", lat: 19.1, lon: 72.9, ms: 112, tone: "ok" },
  { id: "sfo", code: "sfo", label: "San Francisco", lat: 37.8, lon: -122.4, ms: 138, tone: "ok" },
  { id: "jnb", code: "jnb", label: "Johannesburg", lat: -26.2, lon: 28, ms: 158, tone: "warn" },
  { id: "sin", code: "sin", label: "Singapore", lat: 1.35, lon: 103.8, ms: 168, tone: "ok" },
  { id: "gru", code: "gru", label: "São Paulo", lat: -23.5, lon: -46.6, ms: 182, tone: "ok" },
  { id: "nrt", code: "nrt", label: "Tokyo", lat: 35.7, lon: 139.7, ms: 214, tone: "ok" },
  { id: "syd", code: "syd", label: "Sydney", lat: -33.9, lon: 151.2, ms: 262, tone: "ok" },
] as Region[]).map((r) => ({ ...r, detail: r.detail ?? `${r.ms} ms from you${r.tone === "warn" ? ", slow today" : ""}` }));
const ARCS: GlobeArc[] = ["iad", "sfo", "sin", "gru", "bom"].map((to) => ({ from: "lhr", to }));

const DOT = { ok: "bg-[var(--bd-ui-ok)]", warn: "bg-[var(--bd-ui-wait)]", ink: "bg-[var(--bd-fg)]" } as const;

export function Demo() {
  const [at, setAt] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-[640px] flex-wrap items-center justify-center gap-x-8 gap-y-4">
      <Globe markers={REGIONS} arcs={ARCS} selected={at} onSelect={(m) => setAt(m?.id ?? null)} center={{ lat: 32, lon: 6 }} label="Edge network" className="w-[min(340px,100%)]" />
      <div className="w-[210px]">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bd-subtle)]">Edge regions</p>
        <ul className="grid">
          {REGIONS.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={at === r.id}
                onClick={() => setAt(at === r.id ? null : r.id)}
                className={`flex h-8 w-full items-center gap-2.5 rounded-[10px] px-2 text-left text-[13px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] ${at === r.id ? "bg-[rgb(var(--bd-ink)/0.07)] text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.04)] hover:text-[var(--bd-fg)]"}`}
              >
                <span className={`size-1.5 shrink-0 rounded-full ${DOT[r.tone as keyof typeof DOT]}`} />
                <span className="w-8 shrink-0 font-mono text-[11.5px] uppercase text-[var(--bd-subtle)]">{r.code}</span>
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                <span className="font-mono text-[11.5px] tabular-nums text-[var(--bd-subtle)]">{r.ms}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* Shipping lanes between ports, in round dots that fade. */
const PORTS: GlobeMarker[] = [
  { id: "rtm", label: "Rotterdam", lat: 51.9, lon: 4.5, detail: "14.4M containers a year" },
  { id: "sha", label: "Shanghai", lat: 31.2, lon: 121.5, detail: "47.3M containers a year" },
  { id: "sin", label: "Singapore", lat: 1.26, lon: 103.8, detail: "37.3M containers a year" },
  { id: "lax", label: "Los Angeles", lat: 33.7, lon: -118.3, detail: "8.6M containers a year" },
  { id: "ssz", label: "Santos", lat: -23.96, lon: -46.3, detail: "4.8M containers a year" },
  { id: "dxb", label: "Jebel Ali", lat: 25, lon: 55.1, detail: "14.5M containers a year" },
];
const LANES: GlobeArc[] = [
  { from: "sha", to: "lax" },
  { from: "sin", to: "rtm" },
  { from: "sha", to: "sin" },
  { from: "rtm", to: "ssz" },
  { from: "dxb", to: "sin" },
];

function Routes() {
  return <Globe markers={PORTS} arcs={LANES} dither={false} autoRotate={10} center={{ lat: 18, lon: 70 }} label="Shipping lanes" className="w-[min(320px,100%)]" />;
}

/* One place, held still, its name showing. */
function Office() {
  return <Globe markers={[{ id: "lis", label: "Lisbon studio", detail: "Open 9 to 6, Mon to Fri", lat: 38.7, lon: -9.1 }]} defaultSelected="lis" autoRotate={0} center={{ lat: 38.7, lon: -9.1 }} label="Where we are" className="w-[min(260px,100%)]" />;
}

export const examples: Record<string, ComponentType> = { routes: Routes, office: Office };
