"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useInView } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { liveUrl, TEMPLATES, viewUrl, type TemplateSlug } from "./live";
import { btn } from "./sheet";
import { DeviceFrame } from "./frames";

/*
 * The templates themselves, running: pick one and its real site loads in the frame, at desktop,
 * tablet or phone width. Nothing is a screenshot or a lookalike; it's the site you'd ship.
 */
export function LiveShowcase() {
  const [slug, setSlug] = useState<TemplateSlug>(TEMPLATES[0].slug);
  const ref = useRef<HTMLDivElement>(null);
  // The sites are real and heavy, so the frame only loads once it's near the screen.
  const near = useInView(ref, { once: true, margin: "400px" });
  const t = TEMPLATES.find((x) => x.slug === slug)!;
  return (
    <div ref={ref} className="overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface-2 shadow-[0_0_0_1px_var(--bd-line)]">
      {/* The three sites, as tabs that say what each one is for. */}
      <div role="tablist" aria-label="Template" className="grid grid-cols-3 gap-1 border-b border-line bg-surface p-1.5">
        {TEMPLATES.map((x) => {
          const on = x.slug === slug;
          return (
            <button
              key={x.slug}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSlug(x.slug)}
              className={cn("flex min-w-0 items-center gap-2.5 rounded-[7px] px-3 py-2 text-left transition-colors", on ? "bg-fg/[0.06]" : "hover:bg-fg/[0.03]")}
            >
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: x.accent }} />
              <span className="min-w-0">
                <span className={cn("block truncate text-ui font-medium", !on && "text-fg/70")}>{x.name}</span>
                <span className="hidden truncate text-meta text-subtle sm:block">{x.category}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="p-3">
        {near ? <DeviceFrame key={slug} src={liveUrl(slug)} full={viewUrl(slug)} title={`${t.name}, live`} height={600} /> : <div className="h-[648px]" />}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-ui text-muted">
            {t.tagline} {t.pages.length} pages, all in the download.
          </p>
          <Link href={`/templates/${slug}`} className={btn.quiet}>
            About {t.name} <ArrowUpRightIcon size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
