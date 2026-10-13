"use client";

import { ArrowUpRightIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { Segmented } from "@/ui/segmented";
import { CodeBlock } from "./code";
import { DesignCopyMenu } from "./design-copy";
import { DevicePicker, LiveSectionFrame, type Device, useNarrow } from "./frames";
import { SECTION_ICON } from "./icons";
import { sectionOf, sectionUrl, templateOf } from "./live";
import { usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btn, Sheet } from "./sheet";

/*
 * One real section on the component pages: live from its own template at any width, copied to
 * Figma or Paper from the template's own layouts, and the code that puts it on a page.
 */
export function LiveSectionShowcase({ template, id }: { template: string; id: string }) {
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
  const Icon = SECTION_ICON[s.kind];
  return (
    <Sheet
      id={`${template}-${id}`}
      className="scroll-mt-4"
      icon={Icon}
      title={
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
          {t.name}
          <span className="font-normal text-muted">/</span>
          {s.name}
        </span>
      }
      meta={t.tagline}
      actions={
        <>
          <DevicePicker value={device} onChange={setDevice} />
          <DesignCopyMenu targets={[{ name, get: () => null, live: { url: sectionUrl(s), names: { [s.id]: `${t.name} / ${s.name}` } } }]} />
          <Segmented id={`tab-${template}-${id}`} label="View" value={tab} onChange={setTab} options={[{ value: "preview", label: "Preview" }, { value: "code", label: "Code" }]} />
        </>
      }
    >
      <div className="bg-surface-2 p-3">
        {/* Preview and code trade places with a short fade, rather than a cut. */}
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: EASE_OUT }}>
          {tab === "preview" ? (
            <LiveSectionFrame src={sectionUrl(s)} title={`${name}, live`} device={device} />
          ) : (
            <div className="relative">
              <CodeBlock code={`${s.import}\n\n${s.tag}`} className={cn(locked && "pointer-events-none select-none blur-[5px]")} />
              {locked && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="max-w-[340px] rounded-card bg-surface p-5 text-center shadow-[0_8px_30px_rgb(var(--bd-shade)/0.12),0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
                    <LockSimpleIcon size={22} weight="duotone" className="mx-auto text-accent" />
                    <p className="mt-2 text-heading">{t.name}&apos;s code comes with Pro</p>
                    <p className="mt-1 text-ui text-muted">Preview it free at any width. Pro, or the {t.name} template on its own, brings the source.</p>
                    <button type="button" onClick={() => openPro("layout")} className={cn(btn.ink, "mt-4")}>
                      See Pro
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-meta text-muted">
          <span>From the {t.name} template&apos;s home page.</span>
          <Link href={`/studio?template=${t.slug}`} className={btn.link}>
            Open {t.name} in Studio <ArrowUpRightIcon size={13} />
          </Link>
        </div>
      </div>
    </Sheet>
  );
}
