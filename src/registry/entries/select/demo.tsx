"use client";

import { ChartLineUpIcon, CodeIcon, DatabaseIcon, DeviceMobileIcon, DeviceTabletIcon, DownloadSimpleIcon, GaugeIcon, GithubLogoIcon, MonitorIcon } from "@phosphor-icons/react";
import { useId, useState, type ComponentType } from "react";
import { Field } from "../../ui/field";
import { Select } from "../../ui/select";

/* Which template to open in Studio, the templates in one group and what's coming in another. */
const TEMPLATES = [
  {
    label: "Templates",
    options: [
      { value: "zuno", label: "Zuno", icon: <ChartLineUpIcon weight="duotone" />, hint: "Fintech" },
      { value: "noma", label: "Noma", icon: <DatabaseIcon weight="duotone" />, hint: "AI and data" },
      { value: "auren", label: "Auren", icon: <CodeIcon weight="duotone" />, hint: "Developer tools" },
    ],
  },
  {
    label: "Coming next",
    options: [{ value: "analytics", label: "Analytics dashboard", icon: <GaugeIcon weight="duotone" />, hint: "Soon", disabled: true }],
  },
];

export function Demo() {
  const id = useId();
  return (
    <div className="grid w-full max-w-[300px] gap-2">
      <p id={id} className="px-1 text-xs font-medium text-[var(--bd-muted)]">
        Open in Studio
      </p>
      <Select aria-labelledby={id} defaultValue="zuno" options={TEMPLATES} />
    </div>
  );
}

function Basic() {
  return <Select label="Heading font" placeholder="Choose a font" className="max-w-[260px]" options={[{ value: "instrument", label: "Instrument Sans" }, { value: "inter", label: "Inter" }, { value: "geist", label: "Geist" }, { value: "plex", label: "IBM Plex Sans" }]} />;
}

function Groups() {
  return <Select label="Template" defaultValue="noma" className="max-w-[300px]" options={TEMPLATES} />;
}

function WithField() {
  const [to, setTo] = useState<string>();
  return (
    <Field label="Send to" error={to ? undefined : "Choose where to send it."} className="max-w-[300px]">
      <Select
        value={to}
        onValueChange={setTo}
        placeholder="Choose a destination"
        options={[
          { value: "github", label: "A new GitHub repository", icon: <GithubLogoIcon weight="duotone" /> },
          { value: "zip", label: "A zip to download", icon: <DownloadSimpleIcon weight="duotone" /> },
        ]}
      />
    </Field>
  );
}

function Small() {
  return (
    <Select
      size="sm"
      label="Preview width"
      defaultValue="desktop"
      className="max-w-[200px]"
      options={[
        { value: "desktop", label: "Desktop", icon: <MonitorIcon weight="duotone" />, hint: "1440" },
        { value: "tablet", label: "Tablet", icon: <DeviceTabletIcon weight="duotone" />, hint: "820" },
        { value: "phone", label: "Phone", icon: <DeviceMobileIcon weight="duotone" />, hint: "390" },
      ]}
    />
  );
}

function Disabled() {
  return <Select disabled label="Framework" defaultValue="next" className="max-w-[260px]" options={[{ value: "next", label: "Next.js 16" }, { value: "astro", label: "Astro 7" }]} />;
}

export const examples: Record<string, ComponentType> = { basic: Basic, groups: Groups, field: WithField, small: Small, disabled: Disabled };
