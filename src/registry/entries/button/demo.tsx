"use client";

import { ArrowCounterClockwiseIcon, ArrowUpRightIcon, CheckIcon, GithubLogoIcon, RocketLaunchIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { hint } from "../_shared/kit";

/** Publish: the dither runs while it pushes, then it says so, then it rests. */
export function Demo() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState(state === "busy" ? "done" : "idle"), state === "busy" ? 1800 : 2000);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-3">
      <Button variant="metal" size="lg" loading={state === "busy"} onClick={() => setState("busy")}>
        {state === "done" ? <CheckIcon weight="bold" /> : <GithubLogoIcon weight="duotone" />}
        {state === "done" ? "Published" : "Publish to GitHub"}
      </Button>
      <Button variant="outline" size="lg">
        Preview
      </Button>
    </div>
  );
}

function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button>Save draft</Button>
      <Button variant="metal">Publish</Button>
      <Button variant="paper">Duplicate</Button>
      <Button variant="glass">Share</Button>
      <Button variant="outline">Preview</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  );
}

function Sizes() {
  return (
    <div className="flex items-center gap-2.5">
      <Button size="sm">Rename</Button>
      <Button size="md">Save draft</Button>
      <Button size="lg">Open Studio</Button>
      <Button size="icon" variant="outline" aria-label="Undo">
        <ArrowCounterClockwiseIcon weight="regular" />
      </Button>
    </div>
  );
}

function Icons() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button variant="outline">
        <GithubLogoIcon weight="duotone" /> Send to GitHub
      </Button>
      <Button>
        Open in Studio <ArrowUpRightIcon weight="regular" />
      </Button>
    </div>
  );
}

function Deploy() {
  const [busy, setBusy] = useState(false);
  const deploy = () => {
    setBusy(true);
    setTimeout(() => setBusy(false), 2000);
  };
  return (
    <Button variant="metal" loading={busy} onClick={deploy}>
      <RocketLaunchIcon weight="duotone" /> Deploy
    </Button>
  );
}

function Disabled() {
  return (
    <div className="grid justify-items-center gap-2.5">
      <div className="flex items-center gap-2.5">
        <Button disabled>Publish</Button>
        <Button variant="outline" disabled>
          Preview
        </Button>
      </div>
      <p className={hint}>Connect GitHub to publish.</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { variants: Variants, sizes: Sizes, icons: Icons, loading: Deploy, disabled: Disabled };
