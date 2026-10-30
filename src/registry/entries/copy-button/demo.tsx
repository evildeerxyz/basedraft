"use client";

import { GithubLogoIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { CopyButton } from "../../ui/copy-button";
import { Input } from "../../ui/input";

export function Demo() {
  return (
    <div className="flex w-full max-w-[330px] items-center gap-2.5 rounded-full bg-[var(--bd-surface)] py-1 pl-4 pr-1 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      <GithubLogoIcon size={16} weight="duotone" className="shrink-0 text-[var(--bd-subtle)]" />
      <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[var(--bd-muted)]">github.com/larkspur/zuno-site</span>
      <CopyButton value="https://github.com/larkspur/zuno-site" label="Copy" variant="pill" />
    </div>
  );
}

function Round() {
  return (
    <div className="flex items-center gap-3 rounded-full bg-[var(--bd-ui-field)] py-1 pl-4 pr-1 shadow-[var(--bd-ui-well)]">
      <code className="font-mono text-[13px]">npm install @basedraft/ui</code>
      <CopyButton value="npm install @basedraft/ui" label="Copy the command" />
    </div>
  );
}

function Pill() {
  return <CopyButton value="https://basedraft.site/templates/zuno" label="Copy link" variant="pill" />;
}

function Field() {
  return <Input readOnly value="bd_live_7Hq2Xc9Lm4" aria-label="API key" className="max-w-[320px] pr-1.5 font-mono" trailing={<CopyButton value="bd_live_7Hq2Xc9Lm4" label="Copy the key" />} />;
}

export const examples: Record<string, ComponentType> = { icon: Round, pill: Pill, field: Field };
