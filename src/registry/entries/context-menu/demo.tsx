"use client";

import { ArrowSquareOutIcon, CopyIcon, FolderSimpleIcon, GridFourIcon, LinkIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuSub, ContextMenuTrigger } from "../../ui/context-menu";
import { hint } from "../_shared/kit";
import { Placeholder, type Layout } from "../_shared/placeholder";

const SITES: Array<{ name: string; title: string; layout: Layout; edited: string }> = [
  { name: "pricing", title: "Pricing", layout: "landing", edited: "Edited 2h ago" },
  { name: "help-center", title: "Help center", layout: "article", edited: "Edited 1d ago" },
  { name: "dashboard", title: "Dashboard", layout: "dashboard", edited: "Edited Oct 20" },
];

/** A site's actions, on its card. */
function SiteMenu({ site, say }: { site: (typeof SITES)[number]; say: (s: string) => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger aria-label={`${site.title}, right-click for actions`} className="group rounded-[16px] bg-[var(--bd-surface)] p-2 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--bd-line-strong),var(--bd-shadow-resting)]">
        <Placeholder layout={site.layout} ratio={16 / 10} className="w-full rounded-[10px]" />
        <p className="mt-2 px-1 text-[13px] font-medium text-[var(--bd-fg)]">{site.title}</p>
        <p className="px-1 pb-0.5 text-xs text-[var(--bd-subtle)]">{site.edited}</p>
      </ContextMenuTrigger>
      <ContextMenuContent label={`Actions for ${site.title}`}>
        <ContextMenuItem icon={<ArrowSquareOutIcon weight="duotone" />} shortcut={["⌘", "↵"]} onSelect={() => say(`Opened ${site.title}`)}>
          Open
        </ContextMenuItem>
        <ContextMenuItem icon={<PencilSimpleIcon weight="duotone" />} shortcut={["F2"]} onSelect={() => say(`Renaming ${site.title}`)}>
          Rename
        </ContextMenuItem>
        <ContextMenuItem icon={<CopyIcon weight="duotone" />} shortcut={["⌘", "D"]} onSelect={() => say(`Duplicated ${site.name} as ${site.name}-copy`)}>
          Duplicate
        </ContextMenuItem>
        <ContextMenuSub label="Move to" icon={<FolderSimpleIcon weight="duotone" />}>
          {["Client work", "Drafts", "Archive"].map((f) => (
            <ContextMenuItem key={f} onSelect={() => say(`Moved ${site.title} to ${f}`)}>
              {f}
            </ContextMenuItem>
          ))}
        </ContextMenuSub>
        <ContextMenuItem icon={<LinkIcon weight="duotone" />} onSelect={() => say(`Copied example.com/${site.name}`)}>
          Copy link
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem tone="stop" icon={<TrashIcon weight="duotone" />} onSelect={() => say(`${site.title} is in the trash for 30 days`)}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function Demo() {
  const [said, say] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-[560px] gap-4">
      <div className="grid grid-cols-3 gap-3">
        {SITES.map((s) => (
          <SiteMenu key={s.name} site={s} say={say} />
        ))}
      </div>
      <p className={`${hint} text-center`} aria-live="polite">
        {said ?? "Right-click a site, or focus one and press Shift F10."}
      </p>
    </div>
  );
}

function Canvas() {
  const [said, say] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-[420px] gap-3">
      <ContextMenu>
        <ContextMenuTrigger aria-label="Canvas, right-click for options" className="grid h-[180px] place-items-center rounded-[18px] text-sm text-[var(--bd-subtle)] [background:var(--bd-ui-paper)] shadow-[inset_0_0_0_1px_var(--bd-line)]">
          Right-click anywhere here
        </ContextMenuTrigger>
        <ContextMenuContent label="Canvas">
          <ContextMenuLabel>View</ContextMenuLabel>
          <ContextMenuCheckboxItem defaultChecked>Show the grid</ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem defaultChecked>Snap to sections</ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem>Show outlines</ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem icon={<GridFourIcon weight="duotone" />} shortcut={["⌘", "0"]} onSelect={() => say("Zoomed to fit")}>
            Zoom to fit
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className={`${hint} text-center`}>{said ?? "Ticks stay open; actions close the menu."}</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { canvas: Canvas };
