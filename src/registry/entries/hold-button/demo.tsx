"use client";

import { ArrowCounterClockwiseIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { HoldButton } from "../../ui/hold-button";
import { hint } from "../_shared/kit";

export function Demo() {
  return (
    <div className="grid justify-items-center gap-3">
      <HoldButton tone="stop" done="Deleted" icon={<TrashIcon weight="duotone" />}>
        Hold to delete this draft
      </HoldButton>
      <p className={hint}>Let go early to keep it.</p>
    </div>
  );
}

function Ink() {
  return (
    <HoldButton done="Published" icon={<UploadSimpleIcon weight="duotone" />}>
      Hold to publish over the live site
    </HoldButton>
  );
}

function Stop() {
  return (
    <HoldButton tone="stop" done="Deleted" icon={<TrashIcon weight="duotone" />}>
      Hold to delete Zuno&apos;s draft
    </HoldButton>
  );
}

function Duration() {
  return (
    <HoldButton duration={2600} done="Reset" icon={<ArrowCounterClockwiseIcon weight="regular" />}>
      Hold to reset the theme
    </HoldButton>
  );
}

function ClearCache() {
  const [cleared, setCleared] = useState(0);
  return (
    <div className="grid justify-items-center gap-3">
      <HoldButton done="Cleared" onConfirm={() => setCleared((n) => n + 1)}>
        Hold to clear the preview cache
      </HoldButton>
      <p className={hint}>Cleared {cleared} times</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { ink: Ink, stop: Stop, duration: Duration, confirm: ClearCache };
