"use client";

import { BrowserIcon, FigmaLogoIcon, FileIcon, FileSvgIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";

/* Choosing a license: two cards, the price on each. */
export function Demo() {
  return (
    <RadioGroup variant="card" defaultValue="pro" label="License" className="w-full max-w-[340px]">
      <RadioGroupItem value="pro" label="Pro" description="Every template and section, and every update after." aside="$149" />
      <RadioGroupItem value="team" label="Team" description="Up to 10 people, client work included." aside="$399" />
    </RadioGroup>
  );
}

function Rows() {
  return (
    <RadioGroup defaultValue="account" label="Where Studio saves your drafts" className="w-full max-w-[340px]">
      <RadioGroupItem value="browser" label="This browser" description="Only here, until you sign in." />
      <RadioGroupItem value="account" label="Your account" description="On every device you sign in on." />
      <RadioGroupItem value="github" label="GitHub" description="A commit for each change you make." />
    </RadioGroup>
  );
}

function WithIcons() {
  return (
    <RadioGroup variant="card" defaultValue="figma" label="Copy to" className="w-full max-w-[340px]">
      <RadioGroupItem value="figma" icon={<FigmaLogoIcon weight="duotone" />} label="Figma" description="Auto layout, components and named layers." />
      <RadioGroupItem value="svg" icon={<FileSvgIcon weight="duotone" />} label="SVG" description="One flat picture of the section." />
    </RadioGroup>
  );
}

function Controlled() {
  const [width, setWidth] = useState("desktop");
  return (
    <div className="grid w-full max-w-[340px] gap-3">
      <RadioGroup value={width} onValueChange={setWidth} label="Preview width">
        <RadioGroupItem value="desktop" label="Desktop" description="1440 pixels wide." />
        <RadioGroupItem value="phone" label="Phone" description="390 pixels wide." />
      </RadioGroup>
      <p className="px-3 text-xs text-[var(--bd-subtle)]">Previewing at {width === "desktop" ? 1440 : 390} px.</p>
    </div>
  );
}

function Side() {
  return (
    <RadioGroup variant="card" defaultValue="site" label="Start from" className="w-full max-w-[520px] sm:grid-cols-2">
      <RadioGroupItem value="site" icon={<BrowserIcon weight="duotone" />} label="A whole site" description="Every page of a template." />
      <RadioGroupItem value="page" icon={<FileIcon weight="duotone" />} label="One page" description="Just its home page, to build on." />
    </RadioGroup>
  );
}

function Disabled() {
  return (
    <RadioGroup variant="card" defaultValue="solo" label="Seats" className="w-full max-w-[340px]">
      <RadioGroupItem value="solo" icon={<UserCircleIcon weight="duotone" />} label="Just you" description="One person, every project of your own." />
      <RadioGroupItem value="team" disabled label="Up to 10 people" description="Needs a Team license." aside="Team" />
    </RadioGroup>
  );
}

export const examples: Record<string, ComponentType> = { rows: Rows, icons: WithIcons, controlled: Controlled, side: Side, disabled: Disabled };
