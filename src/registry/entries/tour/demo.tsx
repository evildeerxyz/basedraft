"use client";

import { DesktopIcon, DeviceMobileIcon, DeviceTabletIcon, EyeIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import { useRef, useState, type ComponentType } from "react";
import { Tour } from "../../pro-ui/tour";
import { Button } from "../../ui/button";

/** A small Studio: the sections down the side, a device switch, Preview and Publish. The tour points at each. */
function Studio({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const sections = useRef<HTMLDivElement>(null);
  const devices = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLButtonElement>(null);
  const publish = useRef<HTMLButtonElement>(null);
  const steps = [
    { target: sections, side: "right" as const, title: "Your page, section by section", body: "Every section of the page, in order. Drag one to move it, or click to edit its words." },
    { target: devices, side: "bottom" as const, title: "See it on every screen", body: "Switch between desktop, tablet and phone. Each edit shows on all three." },
    { target: preview, side: "bottom" as const, title: "Preview before it's live", body: "Opens the site as visitors will see it, without the editor around it." },
    { target: publish, side: "bottom" as const, title: "Publish when it's ready", body: "Your site goes live on zuno.site in under a minute. Every publish is kept, so you can go back." },
  ];
  return (
    <div className="grid w-full max-w-[600px] justify-items-center gap-4">
      <div className="w-full overflow-hidden rounded-[18px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]">
        <div className="flex items-center gap-2 border-b border-[var(--bd-line-subtle)] px-3 py-2">
          <span className="flex gap-1.5 pr-1">
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-2.5 rounded-full bg-[var(--bd-ui-track)]" />
            ))}
          </span>
          <span className="truncate text-xs font-medium text-[var(--bd-muted)]">zuno.site</span>
          <div ref={devices} className="ml-auto flex items-center rounded-full bg-[var(--bd-ui-track)] p-0.5 max-sm:hidden">
            {[DesktopIcon, DeviceTabletIcon, DeviceMobileIcon].map((I, k) => (
              <span key={k} className={`grid size-6 place-items-center rounded-full ${k === 0 ? "bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[var(--bd-ui-lift)]" : "text-[var(--bd-subtle)]"}`}>
                <I weight="duotone" className="size-3.5" />
              </span>
            ))}
          </div>
          <Button ref={preview} size="sm" variant="ghost" className="max-sm:ml-auto">
            <EyeIcon weight="duotone" /> Preview
          </Button>
          <Button ref={publish} size="sm">
            Publish
          </Button>
        </div>
        <div className={`grid grid-cols-[132px_minmax(0,1fr)] ${compact ? "h-[150px]" : "h-[190px]"}`}>
          <div ref={sections} className="grid content-start gap-0.5 border-r border-[var(--bd-line-subtle)] p-2">
            {["Hero", "Numbers", "Pricing", "Questions", "Footer"].map((s, k) => (
              <span key={s} className={`rounded-[8px] px-2.5 py-1.5 text-xs ${k === 0 ? "bg-[var(--bd-ui-track)] font-medium text-[var(--bd-fg)]" : "text-[var(--bd-muted)]"}`}>
                {s}
              </span>
            ))}
          </div>
          <div className="grid place-items-center bg-[color-mix(in_oklab,var(--bd-surface)_96%,var(--bd-fg))] p-4">
            <div className="grid w-full max-w-[260px] gap-2">
              <span className="h-3 w-3/4 rounded-full bg-[var(--bd-ui-track)]" />
              <span className="h-3 w-1/2 rounded-full bg-[var(--bd-ui-track)]" />
              <span className="mt-2 h-7 w-24 rounded-full [background:var(--bd-ui-ink)] opacity-80" />
            </div>
          </div>
        </div>
      </div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MapTrifoldIcon weight="duotone" /> Take the tour
      </Button>
      <Tour steps={steps} open={open} onOpenChange={setOpen} label="Studio tour" />
    </div>
  );
}

export function Demo() {
  return <Studio />;
}

function Compact() {
  return <Studio compact />;
}

export const examples: Record<string, ComponentType> = { studio: Compact };
