import type { ReactNode } from "react";
import { Container } from "@/components/site/ui";

/* Made-up customers, drawn as their wordmarks: each its own shape, weight and case. */
const MARKS: Array<{ name: string; className: string; glyph: ReactNode }> = [
  { name: "HALDEN", className: "font-semibold tracking-[0.18em] text-[19px]", glyph: <rect x="3" y="3" width="14" height="14" rx="2" transform="rotate(45 10 10)" /> },
  { name: "brightwater", className: "font-bold tracking-[-0.045em] text-[24px]", glyph: <path d="M2 13c3-4 5-4 8 0s5 4 8 0v4H2z" /> },
  { name: "Kestrel", className: "font-semibold italic tracking-[-0.03em] text-[24px]", glyph: <path d="M2 16 10 3l8 13z" /> },
  { name: "Arbor Health", className: "font-medium tracking-[-0.02em] text-[22px]", glyph: <><circle cx="10" cy="7" r="5" /><rect x="9" y="11" width="2" height="7" /></> },
  { name: "LUMEN FREIGHT", className: "font-bold tracking-[0.08em] text-[17px]", glyph: <><rect x="2" y="4" width="16" height="3" /><rect x="2" y="9" width="11" height="3" /><rect x="2" y="14" width="6" height="3" /></> },
  { name: "Tandem", className: "font-black tracking-[-0.05em] text-[25px]", glyph: <><circle cx="7" cy="10" r="5" /><circle cx="13" cy="10" r="5" fillOpacity="0.5" /></> },
  { name: "northvale", className: "font-medium tracking-[-0.01em] text-[23px]", glyph: <path d="M3 17V3l14 14V3" fill="none" stroke="currentColor" strokeWidth="2.4" /> },
  { name: "Osprey Labs", className: "font-semibold tracking-[-0.035em] text-[23px]", glyph: <path d="M10 2a8 8 0 1 0 8 8h-8z" /> },
];

function Wordmark({ m }: { m: (typeof MARKS)[number] }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5 text-ink-2 transition-colors duration-300 hover:text-accent">
      <svg viewBox="0 0 20 20" width="22" height="22" fill="currentColor" aria-hidden>
        {m.glyph}
      </svg>
      <span className={m.className}>{m.name}</span>
    </span>
  );
}

export function Logos() {
  return (
    <section aria-label="Customers" className="pb-10 pt-4">
      <Container>
        <p className="mx-auto max-w-[620px] text-balance text-center font-display text-[30px] font-bold leading-[1.05] text-ink">1,200 companies run their people operations on pello, from 40 people to 4,000.</p>
      </Container>
      <div className="pl-marquee-wrap mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="pl-marquee flex w-max">
          <div className="flex shrink-0 items-center gap-16 pr-16">
            {MARKS.map((m) => (
              <Wordmark key={m.name} m={m} />
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-16 pr-16" aria-hidden>
            {MARKS.map((m) => (
              <Wordmark key={m.name} m={m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
