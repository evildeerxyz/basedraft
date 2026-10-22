"use client";

import { ArrowCounterClockwiseIcon, CopySimpleIcon, CursorIcon, DotsSixVerticalIcon, ExportIcon, ImageSquareIcon, LinkSimpleIcon, TextTIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Button } from "../../ui/button";
import { Tooltip } from "../../ui/tooltip";
import { hint } from "../_shared/kit";

/** Studio's toolbar, its tools named on hover with their keys. */
export function Demo() {
  const tools: Array<[ComponentType<{ size?: number; weight?: "duotone" }>, string, string[]]> = [
    [CursorIcon, "Select", ["V"]],
    [TextTIcon, "Text", ["T"]],
    [ImageSquareIcon, "Image", ["I"]],
    [ExportIcon, "Export", ["⌘", "E"]],
  ];
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex items-center gap-0.5 rounded-full bg-[var(--bd-surface)] p-1 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]">
        {tools.map(([I, label, keys]) => (
          <Tooltip key={label} content={label} keys={keys}>
            <button type="button" aria-label={label} className="grid size-10 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[var(--bd-surface-2)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
              <I size={18} weight="duotone" />
            </button>
          </Tooltip>
        ))}
      </div>
      <p className={hint}>Point at a tool, or tab to it.</p>
    </div>
  );
}

function Basic() {
  return (
    <Tooltip content="Duplicate section">
      <Button size="icon" variant="outline" aria-label="Duplicate section">
        <CopySimpleIcon weight="duotone" />
      </Button>
    </Tooltip>
  );
}

function Keys() {
  return (
    <Tooltip content="Undo" keys={["⌘", "Z"]}>
      <Button size="icon" variant="outline" aria-label="Undo">
        <ArrowCounterClockwiseIcon weight="regular" />
      </Button>
    </Tooltip>
  );
}

function Bottom() {
  return (
    <Tooltip content="Share a preview link" side="bottom">
      <Button variant="outline" size="sm">
        <LinkSimpleIcon weight="duotone" /> Share
      </Button>
    </Tooltip>
  );
}

function Delay() {
  return (
    <Tooltip content="Drag to reorder" delay={600}>
      <Button size="icon" variant="ghost" aria-label="Drag to reorder">
        <DotsSixVerticalIcon weight="bold" />
      </Button>
    </Tooltip>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, keys: Keys, bottom: Bottom, delay: Delay };
