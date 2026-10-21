"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion, useInView } from "motion/react";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DeviceFrame } from "./frames";
import { liveUrl, TEMPLATES, templateLogo, viewUrl, type TemplateSlug } from "./live";
import { Stage } from "./stage";

/*
 * The templates themselves, running: the sites listed down the left, and the one you pick loaded
 * beside them, at desktop, tablet or phone width. Nothing is a screenshot or a lookalike; it's
 * the site you'd ship.
 */

const SLIDE = { type: "spring", stiffness: 520, damping: 42 } as const;

export function LiveShowcase() {
  const [slug, setSlug] = useState<TemplateSlug>(TEMPLATES[0].slug);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  // The sites are real and heavy, so the frame only loads once it's near the screen.
  const near = useInView(ref, { once: true, margin: "400px" });
  const t = TEMPLATES.find((x) => x.slug === slug)!;
  return (
    <div ref={ref} className="bd-reveal grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[272px_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <LayoutGroup id={id}>
          <div role="tablist" aria-label="Template" aria-orientation="vertical" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {TEMPLATES.map((x) => {
              const on = x.slug === slug;
              return (
                <button key={x.slug} type="button" role="tab" aria-selected={on} onClick={() => setSlug(x.slug)} className={cn("group relative shrink-0 rounded-[20px] p-3 text-left transition-colors max-lg:w-[200px]", on ? "text-fg" : "text-muted hover:bg-surface-2/70 hover:text-fg")}>
                  {on && <motion.span layoutId="tpl" className="absolute inset-0 rounded-[20px] bg-surface shadow-[var(--bd-shadow-raised),inset_0_0_0_1px_var(--bd-line)]" transition={SLIDE} />}
                  <span className="relative flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={templateLogo(x.slug)} alt="" width={34} height={34} className="size-[34px] shrink-0 rounded-[9px]" />
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="block text-ui font-medium text-fg">{x.name}</span>
                      <span className="block truncate text-meta text-subtle">{x.category}</span>
                    </span>
                    <span className="pt-0.5 text-meta tabular-nums text-subtle">{x.pages.length} pages</span>
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <div className="mt-auto hidden gap-2 lg:grid">
          <Link href={`/templates/${slug}`} className="flex h-11 items-center justify-between rounded-full bg-surface-2 px-4 text-ui font-medium transition-colors hover:bg-surface-2/60">
            About {t.name} <ArrowUpRightIcon weight="regular" size={14} />
          </Link>
          <Link href={`/studio?template=${slug}`} className="btn-ink flex h-11 items-center justify-between rounded-full px-4 text-ui font-medium">
            Open in Studio <ArrowUpRightIcon weight="regular" size={14} />
          </Link>
        </div>
      </div>
      <Stage glow="b" inner="p-2 sm:p-3">
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface p-2 shadow-[var(--bd-shadow-raised)]">
          {near ? <DeviceFrame key={slug} src={liveUrl(slug)} full={viewUrl(slug)} title={`${t.name}, live`} height={600} /> : <div className="h-[648px]" />}
        </div>
      </Stage>
    </div>
  );
}
