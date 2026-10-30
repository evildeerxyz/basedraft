"use client";

import { ArrowCounterClockwiseIcon, KeyIcon, PaperPlaneTiltIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { HoldButton } from "../../ui/hold-button";
import { hint } from "../_shared/kit";

export function Demo() {
  return (
    <div className="grid justify-items-center gap-3">
      <HoldButton done="Sent to Larkspur" icon={<PaperPlaneTiltIcon weight="duotone" />}>
        Hold to send $2,400
      </HoldButton>
      <p className={hint}>Let go early and nothing moves.</p>
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
    <HoldButton tone="stop" done="Revoked" icon={<KeyIcon weight="duotone" />}>
      Hold to revoke the API key
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
