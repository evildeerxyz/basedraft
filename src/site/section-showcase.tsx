"use client";

import { ArrowUpRightIcon, CodeIcon, CornersOutIcon, EyeIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useId, useState } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { CodeBlock } from "./code";
import { DesignCopyMenu } from "./design-copy";
import { DevicePicker, LiveSectionFrame, type Device, useNarrow } from "./frames";
import { isFree, sectionOf, sectionUrl, templateLogo, templateOf } from "./live";
import { usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btnSm, ProBadge } from "./sheet";
import { GLOW, type Glow } from "./stage";

const TABS = [
  { id: "preview", label: "Preview", icon: EyeIcon },
  { id: "code", label: "Code", icon: CodeIcon },
] as const;

/*
 * One real section on a kind's page, on a card in the hero's light: its template's logo, its name
 * and where it's from across the top, with Preview and Code, the width, the copy to Figma or Paper
 * and full screen beside them; then the section itself, live from its own template at any width,
 * or the code that puts it on a page; and at the foot, the way into Studio with it.
 */
export function LiveSectionShowcase({ template, id, glow = "a" }: { template: string; id: string; glow?: Glow }) {
  const s = sectionOf(template, id)!;
  const t = templateOf(template)!;
  // On a phone a desktop layout scaled to the screen is too small to read: start at phone width.
  const narrow = useNarrow();
  const [picked, setDevice] = useState<Device | null>(null);
  const device = picked ?? (narrow ? "phone" : "desktop");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [plan] = usePlan();
  const locked = plan !== "pro";
  const name = `${t.name} ${s.name.toLowerCase()}`;
  const tabs = useId();
  return (
    <section id={`${template}-${id}`} aria-labelledby={`${template}-${id}-title`} className="scroll-mt-[calc(var(--bd-header-h,80px)+80px)] pt-10">
      <div className={cn("bd-panel relative isolate rounded-[28px] p-2 shadow-[inset_0_0_0_1px_var(--bd-line-subtle)] sm:p-3", GLOW[glow])}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 px-2 pb-3 pt-1 sm:px-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={templateLogo(t.slug)} alt="" width={36} height={36} className="size-9 shrink-0 rounded-[10px]" />
          <div className="min-w-0">
            <h2 id={`${template}-${id}-title`} className="flex items-center gap-2 font-display text-[20px] font-medium leading-[1.2] tracking-[-0.022em]">
              {name}
              {!isFree(s) && <ProBadge />}
            </h2>
            <Link href={`/templates/${t.slug}`} className="group inline-flex items-center gap-1 text-meta text-subtle transition-colors hover:text-fg">
              From {t.name}, {t.category.toLowerCase()}
              <ArrowUpRightIcon weight="regular" size={11} className="transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
            </Link>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
            <LayoutGroup id={tabs}>
              <div role="tablist" aria-label="View" className="flex rounded-full bg-surface-2 p-1">
                {TABS.map(({ id: v, label, icon: I }) => {
                  const on = tab === v;
                  return (
                    <button key={v} type="button" role="tab" aria-selected={on} onClick={() => setTab(v)} className={cn("relative flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors", on ? "text-canvas" : "text-subtle hover:text-fg")}>
                      {on && <motion.span layoutId="view" aria-hidden className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
                      <I weight="duotone" size={14} className="relative" />
                      <span className="relative">{label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
            {tab === "preview" && <DevicePicker value={device} onChange={setDevice} />}
            {/* Copying to Figma is for a desk; a phone keeps to looking. */}
            <span className="max-sm:hidden">
              <DesignCopyMenu targets={[{ name, get: () => null, live: { url: sectionUrl(s), names: { [s.id]: `${t.name} / ${s.name}` } } }]} />
            </span>
            <a href={sectionUrl(s)} target="_blank" rel="noreferrer" aria-label="Open full screen" title="Open full screen" className="grid size-9 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-fg">
              <CornersOutIcon weight="duotone" size={15} />
            </a>
          </div>
        </div>

        {/* Preview and code trade places with a short fade, rather than a cut. */}
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: EASE_OUT }}>
          {tab === "preview" ? (
            <div className="rounded-[20px] p-1 sm:p-2">
              <LiveSectionFrame src={sectionUrl(s)} title={`${name}, live`} device={device} />
            </div>
          ) : (
            <div className="relative">
              <CodeBlock code={`${s.import}\n\n${s.tag}`} file={`${t.name.toLowerCase()} / page.tsx`} className={cn(locked && "pointer-events-none select-none [&_pre]:blur-[5px]")} />
              {locked && (
                <div className="absolute inset-0 top-12 grid place-items-center p-4">
                  <div className="max-w-[360px] rounded-[var(--bd-r-sheet)] bg-white/70 p-6 text-center shadow-[var(--bd-shadow-float),inset_0_0_0_1px_rgb(255_255_255/0.8)] backdrop-blur-xl dark:bg-white/[0.06] dark:shadow-[var(--bd-shadow-float),inset_0_0_0_1px_rgb(255_255_255/0.1)]">
                    <span className="mx-auto grid size-10 place-items-center rounded-full bg-surface-2 text-fg">
                      <LockSimpleIcon size={18} weight="duotone" />
                    </span>
                    <p className="mt-3 text-[15px] font-medium">{t.name}&apos;s code comes with Pro</p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-muted">Preview it free at any width. Pro, or the {t.name} template on its own, brings the source.</p>
                    <button type="button" onClick={() => openPro("layout")} className={cn(btnSm.ink, "mt-4")}>
                      See Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
        <p className="flex flex-wrap items-center justify-between gap-2 px-3 pb-1 pt-3 text-[13px] text-subtle">
          <span>From the {t.name} template&apos;s home page.</span>
          <Link href={`/studio?template=${t.slug}&section=${s.id}`} className="group inline-flex items-center gap-1.5 font-medium text-fg">
            Open {t.name} in Studio
            <ArrowUpRightIcon weight="regular" size={13} className="transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
          </Link>
        </p>
      </div>
    </section>
  );
}
