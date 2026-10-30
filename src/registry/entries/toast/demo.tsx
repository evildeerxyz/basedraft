"use client";

import { ArrowCounterClockwiseIcon, EnvelopeSimpleIcon, GithubLogoIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Button } from "../../ui/button";
import { toast, Toaster } from "../../ui/toast";
import { hint } from "../_shared/kit";

/* A publish that takes a moment: the toast waits, then says it's done, in the same place. */
function publish() {
  const id = toast("Publishing to GitHub", { tone: "wait", description: "larkspur/zuno-site, 61 files", duration: Infinity });
  setTimeout(() => toast.update(id, "Published to GitHub", { tone: "ok", description: "larkspur/zuno-site is up to date.", action: { label: "Open repository", onClick: () => {} } }), 1600);
}

/** Three moments from a working day: a publish, an invite, and a push that didn't go through. */
export function Demo() {
  return (
    <div className="grid justify-items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="metal" onClick={publish}>
          <GithubLogoIcon weight="duotone" /> Publish
        </Button>
        <Button variant="outline" onClick={() => toast("Invite sent", { tone: "ok", description: "Jake Morrison will get an email to join Larkspur." })}>
          <EnvelopeSimpleIcon weight="duotone" /> Invite
        </Button>
        <Button variant="outline" onClick={() => toast("Couldn't reach GitHub", { tone: "stop", description: "Your changes are saved here. Try again in a moment.", action: { label: "Try again", onClick: publish } })}>
          Push fails
        </Button>
      </div>
      <p className={hint}>They stack at the corner; point at them to spread them out.</p>
      <Toaster />
    </div>
  );
}

function Tones() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => toast("Draft saved")}>
        Plain
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast("Template bought", { tone: "ok", description: "Zuno is on your Purchases page." })}>
        Done
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast("Building the zip", { tone: "wait", description: "Next.js 16, about 10 seconds." })}>
        Waiting
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast("That code has run out", { tone: "stop", description: "Ask for a new one; it takes a second." })}>
        Stopped
      </Button>
      <Toaster />
    </div>
  );
}

function Update() {
  return (
    <>
      <Button variant="outline" onClick={publish}>
        Publish, then update
      </Button>
      <Toaster />
    </>
  );
}

function Undo() {
  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          toast("Section deleted", {
            description: "The pricing section is gone from Zuno's home page.",
            action: { label: "Undo", onClick: () => toast("Section back", { tone: "ok" }) },
            duration: 8000,
          })
        }
      >
        <ArrowCounterClockwiseIcon weight="regular" /> Delete with undo
      </Button>
      <Toaster />
    </>
  );
}

export const examples: Record<string, ComponentType> = { tones: Tones, update: Update, action: Undo };
