"use client";

import { GitBranchIcon, MagnetIcon } from "@phosphor-icons/react";
import { useState, type ComponentType, type ReactNode } from "react";
import { Switch } from "../../ui/switch";

/** Studio's settings, a switch each. */
export function Demo() {
  const rows: Array<[ReactNode, string, boolean]> = [
    [<MagnetIcon key="i" size={16} weight="duotone" />, "Snap to sections", true],
    [<GitBranchIcon key="i" size={16} weight="duotone" />, "Save each change to GitHub", false],
  ];
  return (
    <div className="w-full max-w-[330px] divide-y divide-[var(--bd-line-subtle)] rounded-[20px] bg-[var(--bd-surface)] px-4 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      {rows.map(([icon, label, on]) => (
        <label key={label} className="flex cursor-pointer items-center justify-between gap-4 py-3.5 text-sm text-[var(--bd-fg)]">
          <span className="flex items-center gap-2.5">
            <span className="text-[var(--bd-subtle)]">{icon}</span>
            {label}
          </span>
          <Switch defaultChecked={on} />
        </label>
      ))}
    </div>
  );
}

function Sizes() {
  return (
    <div className="grid w-full max-w-[300px] gap-3">
      <label className="flex items-center justify-between gap-6 text-[13px]">
        Show grid lines
        <Switch size="sm" />
      </label>
      <label className="flex items-center justify-between gap-6 text-sm">
        Publish on every save
        <Switch defaultChecked />
      </label>
    </div>
  );
}

function Autosave() {
  const [on, setOn] = useState(true);
  return (
    <label className="flex items-center gap-3 text-sm">
      <Switch checked={on} onCheckedChange={setOn} />
      Autosave is {on ? "on" : "off"}
    </label>
  );
}

function Disabled() {
  return (
    <div className="grid w-full max-w-[300px] gap-3 text-sm text-[var(--bd-muted)]">
      <label className="flex items-center justify-between gap-6">
        Client projects, with Team
        <Switch disabled />
      </label>
      <label className="flex items-center justify-between gap-6">
        Every future update
        <Switch defaultChecked disabled />
      </label>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { sizes: Sizes, controlled: Autosave, disabled: Disabled };
