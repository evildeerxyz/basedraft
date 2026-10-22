import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Alert, Button } from "@basedraft/ui";

export function DomainCheck() {
  return (
    <Alert
      tone="warn"
      title="zuno.site isn't verified yet"
      actions={<Button size="sm">Verify domain</Button>}
    >
      Add the TXT record we sent to your DNS. It can take up to an hour to show.
    </Alert>
  );
}`,
  use: [
    "For something on this page that needs reading: a domain to verify, a push that failed, a plan about to run out.",
    "Pick the tone by what it means: info for a note, ok when something worked, warn when something needs doing soon, stop when something failed.",
    "Give it actions when there's a next step, so no one has to go looking for it.",
  ],
  avoid: [
    "For a quick word after an action, that should leave on its own: use Toast.",
    "For a question that has to be answered before going on: use Dialog.",
    "For a state beside a name, like Live or Draft: use Badge.",
  ],
  parts: [
    {
      name: "Alert",
      note: "A note in the flow of the page.",
      props: [
        { name: "tone", type: '"info" | "ok" | "warn" | "stop"', default: '"info"', note: "Sets the icon and the color that comes in from the edge. Stop is announced at once to screen readers." },
        { name: "title", type: "ReactNode", note: "The line it leads with." },
        { name: "children", type: "ReactNode", note: "More on it, in muted text under the title." },
        { name: "actions", type: "ReactNode", note: "Buttons or links, in a row under the text." },
        { name: "icon", type: "ReactNode | false", note: "In place of the tone's icon, or false for none." },
        { name: "dither", type: "boolean", default: "false", note: "The tone bleeds in from the left edge as a band of dots through an ordered dither, instead of a plain wash." },
        { name: "onDismiss", type: "() => void", note: "Shows a close button. It runs once the alert has folded away, so take it out of your state then." },
        { name: "dismissLabel", type: "string", default: '"Dismiss"', note: "What the close button says to a screen reader." },
        { name: "...props", type: "div props", note: "Everything a div takes, on the alert itself." },
      ],
    },
  ],
  examples: [
    {
      id: "tones",
      title: "Four tones",
      note: "Each has its own icon and its own words, so color is never the only sign.",
      code: `<div className="w-full max-w-[420px] space-y-2.5">
  <Alert title="Edits save as you go">Nothing reaches zuno.site until you publish.</Alert>
  <Alert tone="ok" title="Published to zuno.site">61 files, live in 38 seconds.</Alert>
  <Alert tone="warn" title="7 of 10 seats used">Invite three more before your plan asks for an upgrade.</Alert>
  <Alert tone="stop" title="The push to GitHub failed">fieldwork/zuno-site turned down 2 files over 50 MB.</Alert>
</div>`,
    },
    {
      id: "actions",
      title: "With a next step",
      note: "Actions sit under the text, the main one in ink.",
      code: `<Alert
  tone="stop"
  title="The push to GitHub failed"
  actions={
    <>
      <Button size="sm">Try again</Button>
      <Button size="sm" variant="ghost">See the 2 files</Button>
    </>
  }
  className="max-w-[420px]"
>
  fieldwork/zuno-site turned down 2 files over 50 MB. Shrink them or leave them out.
</Alert>`,
    },
    {
      id: "dismiss",
      title: "Closing",
      note: "It folds away, and with space-y on the list the gap closes with it.",
      code: `function Notes() {
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
    </div>
  );
}`,
    },
    {
      id: "dither",
      title: "A dithered edge",
      note: "With dither, the tone comes in from the left edge as dots, strong at the edge and thinning out, like ink in paper.",
      code: `<div className="w-full max-w-[420px] space-y-2.5">
  <Alert dither tone="warn" title="zuno.site isn't verified yet">
    Add the TXT record we sent to your DNS.
  </Alert>
  <Alert dither tone="ok" title="Published to zuno.site">
    61 files, live in 38 seconds.
  </Alert>
</div>`,
    },
    {
      id: "icon",
      title: "Its own icon",
      note: "Any icon in place of the tone's, or icon={false} for none.",
      code: `<Alert
  icon={<GitBranchIcon weight="duotone" />}
  title="You're on the branch new-hero"
  className="max-w-[420px]"
>
  Edits here reach zuno.site once you merge them.
</Alert>`,
    },
  ],
  a11y: [
    "Stop is role alert, so a screen reader reads it out as soon as it appears; the other tones are role status and wait their turn.",
    "The band and the icon are drawn only. The title and the words carry the meaning, so color is never the only sign.",
    "The close button is a real button named by dismissLabel, reached with Tab.",
  ],
};
