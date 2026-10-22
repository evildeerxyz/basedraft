"use client";

import type { ComponentType } from "react";
import { Kbd, KbdGroup } from "../../ui/kbd";
import { hint } from "../_shared/kit";

export function Demo() {
  const rows: Array<[string, string[]]> = [
    ["Search", ["⌘", "K"]],
    ["Undo", ["⌘", "Z"]],
    ["Preview", ["P"]],
  ];
  return (
    <div className="grid w-full max-w-[280px] gap-3">
      {rows.map(([label, keys]) => (
        <div key={label} className="flex items-center justify-between gap-4 text-sm text-[var(--bd-muted)]">
          {label}
          <KbdGroup>
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </KbdGroup>
        </div>
      ))}
      <p className={`${hint} pt-1 text-center`}>Press them on your keyboard.</p>
    </div>
  );
}

function Keys() {
  return (
    <div className="flex items-center gap-2">
      <Kbd>Esc</Kbd>
      <Kbd>↵</Kbd>
      <Kbd>⌫</Kbd>
    </div>
  );
}

function Combo() {
  return (
    <div className="flex items-center gap-3 text-sm text-[var(--bd-muted)]">
      Open the command menu
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
    </div>
  );
}

function Sizes() {
  return (
    <div className="flex items-center gap-4">
      <KbdGroup>
        <Kbd size="sm">⌘</Kbd>
        <Kbd size="sm">S</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>S</Kbd>
      </KbdGroup>
    </div>
  );
}

function Inline() {
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Press <Kbd size="sm">⌘</Kbd> <Kbd size="sm">Z</Kbd> to undo, or <Kbd size="sm">P</Kbd> to preview.
    </p>
  );
}

export const examples: Record<string, ComponentType> = { keys: Keys, combo: Combo, sizes: Sizes, inline: Inline };
