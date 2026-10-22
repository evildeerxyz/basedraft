"use client";

import { DeviceMobileIcon, DeviceTabletIcon, MonitorIcon, TextAlignCenterIcon, TextAlignLeftIcon, TextAlignRightIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Segmented } from "../../ui/segmented";

const WIDTHS: Record<string, string> = { desktop: "1440", tablet: "820", phone: "390" };

export function Demo() {
  const [w, setW] = useState("desktop");
  return (
    <div className="grid justify-items-center gap-3">
      <Segmented
        label="Preview width"
        value={w}
        onValueChange={setW}
        options={[
          { value: "desktop", label: "Desktop", icon: <MonitorIcon weight="duotone" /> },
          { value: "tablet", label: "Tablet", icon: <DeviceTabletIcon weight="duotone" /> },
          { value: "phone", label: "Phone", icon: <DeviceMobileIcon weight="duotone" /> },
        ]}
      />
      <p className="font-mono text-xs tabular-nums text-[var(--bd-subtle)]">{WIDTHS[w]} px wide</p>
    </div>
  );
}

function Text() {
  return (
    <Segmented
      label="Theme"
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ]}
    />
  );
}

function Icons() {
  return (
    <Segmented
      label="Text alignment"
      options={[
        { value: "left", label: "Left", icon: <TextAlignLeftIcon weight="duotone" /> },
        { value: "center", label: "Center", icon: <TextAlignCenterIcon weight="duotone" /> },
        { value: "right", label: "Right", icon: <TextAlignRightIcon weight="duotone" /> },
      ]}
    />
  );
}

function Small() {
  return (
    <Segmented
      size="sm"
      label="Framework"
      options={[
        { value: "next", label: "Next.js" },
        { value: "astro", label: "Astro" },
      ]}
    />
  );
}

const PLACES: Record<string, string> = { figma: "Figma", code: "a zip of the code", github: "a new GitHub repository" };

function Export() {
  const [to, setTo] = useState("figma");
  return (
    <div className="grid justify-items-center gap-3">
      <Segmented
        label="Export to"
        value={to}
        onValueChange={setTo}
        options={[
          { value: "figma", label: "Figma" },
          { value: "code", label: "Code" },
          { value: "github", label: "GitHub" },
        ]}
      />
      <p className="text-xs text-[var(--bd-subtle)]">Exports to {PLACES[to]}</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { text: Text, icons: Icons, small: Small, controlled: Export };
