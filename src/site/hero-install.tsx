"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { ADD, installCommand, type Runner } from "@/registry";
import { ShellLine } from "./shell-line";

/*
 * Under the hero's buttons, one frosted row: the command that installs basedraft UI, our npm
 * package, with what it leans on, in the package manager you pick, and a button to copy it.
 */

const MANAGERS = Object.keys(ADD) as Runner[];

const SLIDE = { type: "spring", stiffness: 520, damping: 42 } as const;

export function HeroInstall() {
  const id = useId();
  const [manager, setManager] = useState<Runner>("npm");
  const command = installCommand(manager);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <LayoutGroup id={id}>
      {/* On a phone the command takes a second line under the tabs, so it's never cut short. */}
      <div className="mt-12 flex max-w-full flex-wrap items-center gap-1 rounded-[20px] bg-paper/60 p-1 max-sm:w-full sm:flex-nowrap sm:rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_9%,transparent),var(--bd-shadow-resting)] backdrop-blur-md">
        <div role="tablist" aria-label="Package manager" className="flex shrink-0">
          {MANAGERS.map((m) => {
            const on = m === manager;
            return (
              <button key={m} type="button" role="tab" aria-selected={on} onClick={() => setManager(m)} className={cn("relative h-8 rounded-full px-2.5 font-mono text-[12px] transition-colors", on ? "text-brand-ink" : "text-paper-muted hover:text-paper-ink")}>
                {on && <motion.span layoutId="manager" className="absolute inset-0 rounded-full bg-brand-soft" transition={SLIDE} />}
                <span className="relative">{m}</span>
              </button>
            );
          })}
        </div>
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-paper-ink/10 max-sm:hidden" />
        <ShellLine command={command} prompt={false} className="min-w-0 truncate px-1.5 max-sm:order-last max-sm:basis-full max-sm:px-3 max-sm:pb-2.5 max-sm:pt-1.5 max-sm:text-left" />
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(command).then(() => setCopied(true));
          }}
          aria-label={copied ? "Copied" : `Copy: ${command}`}
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-paper-muted transition-colors hover:bg-paper-ink/[0.06] hover:text-paper-ink"
        >
          {copied ? <CheckIcon size={14} weight="regular" className="text-brand-ink" /> : <CopyIcon size={14} weight="duotone" />}
        </button>
      </div>
    </LayoutGroup>
  );
}
