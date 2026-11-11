"use client";

import { LightningIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Allowance } from "../../ui/allowance";

export function Demo() {
  return (
    <div className="flex w-full max-w-[520px] items-center gap-6">
      <Allowance
        className="flex-1"
        label="Build minutes"
        icon={<LightningIcon weight="duotone" />}
        used={5046}
        limit={6000}
        unit="min"
        projected={6210}
        note="Renews Nov 30"
        action={
          <button type="button" className="inline-flex h-7 items-center gap-1 rounded-full bg-[rgb(var(--bd-ink)/0.06)] px-2.5 text-[12px] font-medium text-[var(--bd-fg)] hover:bg-[rgb(var(--bd-ink)/0.1)]">
            Add 2,000 for $10 <ArrowRightIcon weight="regular" size={12} />
          </button>
        }
      />
      <div className="grid justify-items-center gap-1.5 text-[11px] text-[var(--bd-subtle)]">
        <Allowance compact label="Build minutes" used={5046} limit={6000} />
        On a rail
      </div>
    </div>
  );
}

function States() {
  return (
    <div className="grid w-full max-w-[280px] gap-3">
      <Allowance label="Seats" used={8} limit={12} note="$20 each" />
      <Allowance label="Build minutes" used={5046} limit={6000} unit="min" projected={6210} note="Renews Nov 30" />
      <Allowance label="Bandwidth" used={1240} limit={1000} unit="GB" note="$0.15 a GB over" />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { states: States };
