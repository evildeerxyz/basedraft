import type { ReactNode } from "react";
import { Band } from "@/components/site/ui";

/* Made-up customers, drawn as their wordmarks: each its own shape, weight and case. */
const MARKS: Array<{ name: string; className: string; glyph: ReactNode }> = [
  { name: "HALDEN", className: "font-semibold tracking-[0.18em] text-[18px]", glyph: <rect x="3" y="3" width="14" height="14" rx="2" transform="rotate(45 10 10)" /> },
  { name: "brightwater", className: "font-bold tracking-[-0.045em] text-[24px]", glyph: <path d="M2 13c3-4 5-4 8 0s5 4 8 0v4H2z" /> },
  { name: "Kestrel", className: "font-semibold italic tracking-[-0.03em] text-[23px]", glyph: <path d="M2 16 10 3l8 13z" /> },
  { name: "Arbor Health", className: "font-medium tracking-[-0.02em] text-[22px]", glyph: <><circle cx="10" cy="7" r="5" /><rect x="9" y="11" width="2" height="7" /></> },
  { name: "LUMEN FREIGHT", className: "font-bold tracking-[0.08em] text-[16px]", glyph: <><rect x="2" y="4" width="16" height="3" /><rect x="2" y="9" width="11" height="3" /><rect x="2" y="14" width="6" height="3" /></> },
  { name: "Tandem", className: "font-black tracking-[-0.05em] text-[24px]", glyph: <><circle cx="7" cy="10" r="5" /><circle cx="13" cy="10" r="5" fillOpacity="0.5" /></> },
  { name: "northvale", className: "font-medium tracking-[-0.01em] text-[22px]", glyph: <path d="M3 17V3l14 14V3" fill="none" stroke="currentColor" strokeWidth="2.4" /> },
  { name: "Osprey Labs", className: "font-semibold tracking-[-0.035em] text-[22px]", glyph: <path d="M10 2a8 8 0 1 0 8 8h-8z" /> },
];

function Wordmark({ m }: { m: (typeof MARKS)[number] }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-ink-2 opacity-80 transition-opacity duration-300 hover:opacity-100">
      <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden>
        {m.glyph}
      </svg>
      <span className={m.className}>{m.name}</span>
    </span>
  );
}

export function Logos() {
  return (
    <Band rule inner="grid items-center gap-6 py-8 lg:grid-cols-[200px_1fr] lg:gap-10">
      <p className="text-[16px] leading-[1.4] text-mute">Trusted by People teams at 1,200 companies</p>
      <div className="pl-marquee-wrap pl-fade-x overflow-hidden" aria-label="Customers">
        <div className="pl-marquee flex w-max">
          <div className="flex shrink-0 items-center gap-12 pr-12">
            {MARKS.map((m) => (
              <Wordmark key={m.name} m={m} />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-12 pr-12" aria-hidden>
            {MARKS.map((m) => (
              <Wordmark key={m.name} m={m} />
            ))}
          </div>
        </div>
      </div>
    </Band>
  );
}
