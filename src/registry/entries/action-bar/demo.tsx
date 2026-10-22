"use client";

import { CopySimpleIcon, ExportIcon, MinusIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { ActionBar, ActionBarButton } from "../../ui/action-bar";
import { Button } from "../../ui/button";
import { CheckboxRow } from "../../ui/checkbox";

const SECTIONS = ["Navigation", "Hero", "Features", "Pricing", "FAQ"];

/* Zuno's home page in Studio: tick sections and the bar rises with what you can do to all of them. */
export function Demo() {
  const [list, setList] = useState(SECTIONS);
  const [picked, setPicked] = useState<string[]>(["Hero", "Pricing"]);
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  return (
    <div className="relative w-full max-w-[520px] overflow-hidden rounded-[18px] bg-[var(--bd-surface)] p-2 pb-20 shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      <div className="grid gap-0.5">
        {list.map((s) => (
          <CheckboxRow key={s} label={s} checked={picked.includes(s)} onCheckedChange={() => toggle(s)} className="rounded-[12px] px-2 py-1.5" />
        ))}
        {list.length === 0 && (
          <button type="button" onClick={() => setList(SECTIONS)} className="py-6 text-sm text-[var(--bd-subtle)] underline-offset-4 hover:underline">
            Every section deleted. Bring them back
          </button>
        )}
      </div>
      <ActionBar position="absolute" count={picked.length} onClear={() => setPicked([])} label="Sections">
        <ActionBarButton icon={<CopySimpleIcon weight="duotone" />}>Duplicate</ActionBarButton>
        <ActionBarButton icon={<ExportIcon weight="duotone" />}>Export</ActionBarButton>
        <ActionBarButton
          tone="stop"
          icon={<TrashIcon weight="duotone" />}
          onClick={() => {
            setList((l) => l.filter((s) => !picked.includes(s)));
            setPicked([]);
          }}
        >
          Delete
        </ActionBarButton>
      </ActionBar>
    </div>
  );
}

function Basic() {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  return (
    <div className="relative w-full max-w-[360px] overflow-hidden rounded-[18px] bg-[var(--bd-surface)] p-2 pb-20 shadow-[0_0_0_1px_var(--bd-line)]">
      {["Zuno", "Noma", "Auren"].map((s) => (
        <CheckboxRow key={s} label={s} checked={picked.includes(s)} onCheckedChange={() => toggle(s)} className="rounded-[12px] px-2 py-1.5" />
      ))}
      <ActionBar position="absolute" count={picked.length} onClear={() => setPicked([])} label="Templates">
        <ActionBarButton icon={<ExportIcon weight="duotone" />}>Export</ActionBarButton>
      </ActionBar>
    </div>
  );
}

function Fixed() {
  const [count, setCount] = useState(0);
  return (
    <div className="grid justify-items-center gap-3">
      <Button variant="outline" onClick={() => setCount(count ? 0 : 3)}>
        {count ? "Let them go" : "Select 3 sections"}
      </Button>
      <p className="text-xs text-[var(--bd-subtle)]">The bar rises at the foot of the window</p>
      <ActionBar count={count} onClear={() => setCount(0)} label="Sections">
        <ActionBarButton icon={<CopySimpleIcon weight="duotone" />}>Duplicate</ActionBarButton>
        <ActionBarButton tone="stop" icon={<TrashIcon weight="duotone" />} onClick={() => setCount(0)}>
          Delete
        </ActionBarButton>
      </ActionBar>
    </div>
  );
}

function Count() {
  const [count, setCount] = useState(4);
  return (
    <div className="relative grid h-[200px] w-full max-w-[360px] place-items-start justify-items-center overflow-hidden rounded-[18px] bg-[var(--bd-surface)] pt-6 shadow-[0_0_0_1px_var(--bd-line)]">
      <div className="flex gap-2">
        <Button variant="outline" size="icon" aria-label="One fewer" onClick={() => setCount((c) => Math.max(0, c - 1))}>
          <MinusIcon weight="regular" />
        </Button>
        <Button variant="outline" size="icon" aria-label="One more" onClick={() => setCount((c) => c + 1)}>
          <PlusIcon weight="regular" />
        </Button>
      </div>
      <ActionBar position="absolute" count={count} onClear={() => setCount(0)} label="Pages" noun="pages">
        <ActionBarButton icon={<ExportIcon weight="duotone" />}>Export</ActionBarButton>
      </ActionBar>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, fixed: Fixed, count: Count };
