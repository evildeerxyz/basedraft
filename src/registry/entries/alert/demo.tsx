"use client";

import { ArrowCounterClockwiseIcon, GitBranchIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Alert } from "../../ui/alert";
import { Button } from "../../ui/button";

/** A domain to verify and a publish that went through, each closing on its own. Again brings them back. */
function Notes({ onAgain }: { onAgain: () => void }) {
  const [notes, setNotes] = useState(["domain", "published"]);
  const close = (id: string) => setNotes((n) => n.filter((x) => x !== id));
  return (
    <div className="w-full max-w-[420px] space-y-2.5">
      {notes.includes("domain") && (
        <Alert
          dither
          tone="warn"
          title="zuno.site isn't verified yet"
          onDismiss={() => close("domain")}
          actions={
            <>
              <Button size="sm">Verify domain</Button>
              <Button size="sm" variant="ghost">
                How it works
              </Button>
            </>
          }
        >
          Add the TXT record we sent to your DNS. It can take up to an hour to show.
        </Alert>
      )}
      {notes.includes("published") && (
        <Alert tone="ok" title="Published to zuno.site" onDismiss={() => close("published")}>
          61 files, live in 38 seconds.
        </Alert>
      )}
      {notes.length === 0 && (
        <div className="grid place-items-center">
          <Button variant="ghost" size="sm" onClick={onAgain}>
            <ArrowCounterClockwiseIcon weight="regular" /> Show them again
          </Button>
        </div>
      )}
    </div>
  );
}

export function Demo() {
  const [run, setRun] = useState(0);
  return <Notes key={run} onAgain={() => setRun((r) => r + 1)} />;
}

function Tones() {
  return (
    <div className="w-full max-w-[420px] space-y-2.5">
      <Alert title="Edits save as you go">Nothing reaches zuno.site until you publish.</Alert>
      <Alert tone="ok" title="Published to zuno.site">
        61 files, live in 38 seconds.
      </Alert>
      <Alert tone="warn" title="7 of 10 seats used">
        Invite three more before your plan asks for an upgrade.
      </Alert>
      <Alert tone="stop" title="The push to GitHub failed">
        fieldwork/zuno-site turned down 2 files over 50 MB.
      </Alert>
    </div>
  );
}

function Actions() {
  return (
    <Alert
      tone="stop"
      title="The push to GitHub failed"
      actions={
        <>
          <Button size="sm">Try again</Button>
          <Button size="sm" variant="ghost">
            See the 2 files
          </Button>
        </>
      }
      className="max-w-[420px]"
    >
      fieldwork/zuno-site turned down 2 files over 50 MB. Shrink them or leave them out.
    </Alert>
  );
}

function Closing() {
  const [notes, setNotes] = useState(["seats", "domain"]);
  const close = (id: string) => setNotes((n) => n.filter((x) => x !== id));
  return (
    <div className="w-full max-w-[420px] space-y-2.5">
      {notes.includes("seats") && (
        <Alert tone="warn" title="7 of 10 seats used" onDismiss={() => close("seats")}>
          Invite three more before your plan asks for an upgrade.
        </Alert>
      )}
      {notes.includes("domain") && (
        <Alert title="Add your own domain" onDismiss={() => close("domain")}>
          Point a domain at zuno.site in Settings, then Domains.
        </Alert>
      )}
      {notes.length === 0 && (
        <div className="grid place-items-center">
          <Button variant="ghost" size="sm" onClick={() => setNotes(["seats", "domain"])}>
            <ArrowCounterClockwiseIcon weight="regular" /> Show them again
          </Button>
        </div>
      )}
    </div>
  );
}

function OwnIcon() {
  return (
    <Alert icon={<GitBranchIcon weight="duotone" />} title="You're on the branch new-hero" className="max-w-[420px]">
      Edits here reach zuno.site once you merge them.
    </Alert>
  );
}

function Dithered() {
  return (
    <div className="w-full max-w-[420px] space-y-2.5">
      <Alert dither tone="warn" title="zuno.site isn't verified yet">
        Add the TXT record we sent to your DNS.
      </Alert>
      <Alert dither tone="ok" title="Published to zuno.site">
        61 files, live in 38 seconds.
      </Alert>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { tones: Tones, actions: Actions, dismiss: Closing, dither: Dithered, icon: OwnIcon };
