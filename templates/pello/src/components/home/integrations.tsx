"use client";

import { motion } from "motion/react";
import { BrandMark } from "@/components/site/brand";
import { Band, ButtonLink } from "@/components/site/ui";
import type { Brand } from "@/lib/brands";

/* The tools pello reads from and writes to, in a grid ruled like a sheet of stamps. */

const TOOLS: Array<{ brand: Brand; name: string }> = [
  { brand: "slack", name: "Slack" },
  { brand: "teams", name: "Microsoft Teams" },
  { brand: "notion", name: "Notion" },
  { brand: "drive", name: "Google Drive" },
  { brand: "confluence", name: "Confluence" },
  { brand: "okta", name: "Okta" },
  { brand: "xero", name: "Xero" },
  { brand: "calendar", name: "Google Calendar" },
];

export function Integrations() {
  return (
    <Band rule id="integrations" inner="py-6">
      <div className="pl-card -mx-2 grid items-center gap-12 overflow-hidden rounded-[16px] px-6 py-14 sm:-mx-6 sm:px-12 lg:-mx-[64px] lg:grid-cols-[1fr_1fr] lg:px-16 lg:py-20">
        <div>
          <h2 className="text-balance font-display text-[clamp(2.3rem,4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-ink">Works with the tools you already have</h2>
          <p className="mt-4 max-w-[480px] text-[18px] leading-[1.55] text-mute">People ask where they already work. Policies come from where you keep them. Hours and expenses land in your books without anyone copying them across.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <ButtonLink href="/contact">Book a demo</ButtonLink>
            <ButtonLink href="/product#integrations" kind="light">
              All integrations
            </ButtonLink>
          </div>
        </div>
        <ul className="relative mx-auto grid w-full max-w-[460px] grid-cols-4">
          {TOOLS.map((t, i) => (
            <li key={t.brand} className="relative">
              <motion.span whileHover={{ y: -3, scale: 1.06 }} transition={{ type: "spring", stiffness: 420, damping: 20 }} className="grid aspect-square place-items-center" title={t.name}>
                <BrandMark brand={t.brand} className="size-11" title={t.name} />
              </motion.span>
              {/* Hairlines between the cells, and a cross where they meet. */}
              {i % 4 !== 3 && <span aria-hidden className="absolute inset-y-3 right-0 w-px bg-line" />}
              {i < 4 && <span aria-hidden className="absolute inset-x-3 bottom-0 h-px bg-line" />}
              {i < 3 && (
                <span aria-hidden className="absolute bottom-0 right-0 size-[13px] translate-x-1/2 translate-y-1/2">
                  <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line-strong" />
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-line-strong" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}
