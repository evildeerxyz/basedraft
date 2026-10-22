"use client";

import { CopyIcon, FileTextIcon, FigmaLogoIcon, GithubLogoIcon, MagnifyingGlassIcon, PenNibIcon, ShieldCheckIcon, TagIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Command, CommandDialog, CommandEmpty, CommandFooter, CommandGroup, CommandInput, CommandItem, CommandList } from "../../ui/command";
import { hint } from "../_shared/kit";

const PAGES = [
  { value: "home", label: "Home", path: "/" },
  { value: "autopilot", label: "Autopilot", path: "/autopilot" },
  { value: "pricing", label: "Pricing", path: "/pricing", icon: TagIcon },
  { value: "security", label: "Security", path: "/security", icon: ShieldCheckIcon },
  { value: "help", label: "Help center", path: "/help" },
];

/* Zuno's pages and the things to do with it, in groups. */
function Items({ onDo }: { onDo: (what: string) => void }) {
  return (
    <>
      <CommandGroup heading="Pages">
        {PAGES.map((p) => {
          const I = p.icon ?? FileTextIcon;
          return (
            <CommandItem key={p.value} value={p.label} keywords={[p.path]} icon={<I weight="duotone" />} hint={p.path} onSelect={() => onDo(`Opened ${p.label}`)}>
              {p.label}
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandGroup heading="Actions">
        <CommandItem value="Open in Studio" keywords={["edit"]} icon={<PenNibIcon weight="duotone" />} shortcut={["⌘", "E"]} onSelect={() => onDo("Opened Zuno in Studio")}>
          Open in Studio
        </CommandItem>
        <CommandItem value="Copy to Figma" keywords={["design", "paste"]} icon={<FigmaLogoIcon weight="duotone" />} shortcut={["⌘", "⇧", "C"]} onSelect={() => onDo("Copied the page for Figma")}>
          Copy to Figma
        </CommandItem>
        <CommandItem value="Publish to GitHub" keywords={["push", "repository"]} icon={<GithubLogoIcon weight="duotone" />} shortcut={["⌘", "P"]} onSelect={() => onDo("Published to GitHub")}>
          Publish to GitHub
        </CommandItem>
      </CommandGroup>
    </>
  );
}

/** A palette in place: type to narrow Zuno's pages and actions, arrows to move, Enter to go. */
export function Demo() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-[440px] justify-items-center gap-3">
      <Command label="Search Zuno">
        <CommandInput placeholder="Search Zuno's pages and actions" />
        <CommandList className="max-h-[204px]">
          <CommandEmpty />
          <Items onDo={setLast} />
        </CommandList>
      </Command>
      <p className={hint}>{last ?? "Try “pri” or “git”, then Enter."}</p>
    </div>
  );
}

function AsDialog() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="grid justify-items-start gap-2">
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MagnifyingGlassIcon weight="duotone" /> Search Zuno
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} shortcut={false} label="Search Zuno">
        <CommandInput placeholder="Search Zuno's pages and actions" />
        <CommandList>
          <CommandEmpty />
          <Items onDo={setLast} />
        </CommandList>
        <CommandFooter>Zuno, 25 pages</CommandFooter>
      </CommandDialog>
      {last && <p className={hint}>{last}</p>}
    </div>
  );
}

function Empty() {
  return (
    <Command label="Search sections" className="max-w-[420px]">
      <CommandInput placeholder="Search sections" />
      <CommandList className="max-h-[180px]">
        <CommandEmpty>No section by that name. Try “hero” or “pricing”.</CommandEmpty>
        <CommandGroup heading="Sections">
          {["Hero", "Ticker tape", "Manifesto", "App showcase", "Pricing", "FAQ"].map((s) => (
            <CommandItem key={s} value={s} icon={<CopyIcon weight="duotone" />}>
              {s}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function Footer() {
  return (
    <Command label="Jump to a page" className="max-w-[420px]">
      <CommandInput placeholder="Jump to a page" />
      <CommandList className="max-h-[180px]">
        <CommandEmpty />
        <CommandGroup>
          {PAGES.map((p) => (
            <CommandItem key={p.value} value={p.label} hint={p.path}>
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <CommandFooter>{PAGES.length} pages</CommandFooter>
    </Command>
  );
}

export const examples: Record<string, ComponentType> = { dialog: AsDialog, empty: Empty, footer: Footer };
