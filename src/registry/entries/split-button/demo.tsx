"use client";

import { CalendarDotsIcon, FlaskIcon, GlobeIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { SplitButton } from "../../ui/split-button";
import { hint } from "../_shared/kit";

const MERGE = [
  { value: "merge", label: "Merge", description: "Every commit is added to main." },
  { value: "squash", label: "Squash and merge", description: "The commits become one on main." },
  { value: "rebase", label: "Rebase and merge", description: "The commits are replayed on top of main." },
];

export function Demo() {
  const [last, setLast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid justify-items-center gap-4">
      <SplitButton
        defaultValue="squash"
        loading={busy}
        onAction={(v) => {
          setBusy(true);
          setTimeout(() => {
            setBusy(false);
            setLast(MERGE.find((m) => m.value === v)?.label ?? v);
          }, 1300);
        }}
        actions={MERGE}
        menuLabel="Other ways to merge"
      />
      <p className={hint}>{last ? `${last}: done. new-hero is on main.` : "Pick another way from the caret, then press."}</p>
    </div>
  );
}

function Publish() {
  const [busy, setBusy] = useState(false);
  return (
    <SplitButton
      loading={busy}
      onAction={() => {
        setBusy(true);
        setTimeout(() => setBusy(false), 1600);
      }}
      actions={[
        { value: "live", label: "Publish", icon: <GlobeIcon weight="duotone" />, description: "Live on zuno.site now." },
        { value: "staging", label: "Publish to staging", icon: <FlaskIcon weight="duotone" />, description: "On staging.zuno.site, for a last look." },
        { value: "schedule", label: "Schedule", icon: <CalendarDotsIcon weight="duotone" />, description: "Pick a time, and it goes live then." },
      ]}
    />
  );
}

function Outline() {
  return (
    <SplitButton
      variant="outline"
      size="sm"
      actions={[
        { value: "zip", label: "Export as zip" },
        { value: "figma", label: "Copy to Figma" },
        { value: "github", label: "Push to GitHub" },
      ]}
    />
  );
}

export const examples: Record<string, ComponentType> = { publish: Publish, outline: Outline };
