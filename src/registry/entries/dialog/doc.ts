import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@basedraft/ui";

export function Publish() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="metal">Publish to GitHub</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Publish Zuno to GitHub</DialogTitle>
        <DialogDescription>
          We make a new private repository and push the whole site to it.
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Not yet</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={publish}>Publish</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`,
  use: [
    "To confirm a step that matters before it happens: publishing, leaving with unsaved work, spending money.",
    "For a short task that needs the person's full attention, like naming something or answering one question.",
    "When the rest of the page should wait until it's done.",
  ],
  avoid: [
    "For a form longer than a few fields, or details someone reads while working: use Sheet, which leaves the page in view.",
    "For a small choice tied to one button, like a color: use Popover.",
    "To say something happened: use Toast, which doesn't stop the work.",
    "For deleting: a Hold button often says enough on its own, without a dialog in the way.",
  ],
  parts: [
    {
      name: "Dialog",
      note: "Holds whether it's open. Renders nothing itself.",
      props: [
        { name: "open", type: "boolean", note: "Whether it's open, when you control it. Leave it out and Dialog keeps that itself." },
        { name: "defaultOpen", type: "boolean", default: "false", note: "Open at first, when Dialog keeps the state." },
        { name: "onOpenChange", type: "(open: boolean) => void", note: "Called when it opens or closes, by a trigger, a close button, Escape or a click behind it." },
        { name: "children", type: "ReactNode", required: true, note: "The trigger and the content." },
      ],
    },
    {
      name: "DialogTrigger",
      note: "Opens it. Sets aria-haspopup and aria-expanded, and remembers itself so focus comes back to it.",
      props: [
        { name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass (your own Button) instead of a plain button." },
        { name: "...props", type: "button props", note: "Everything a button takes, when it's its own button." },
      ],
    },
    {
      name: "DialogContent",
      note: "The card, in a portal over the page, in the light or dark of the place it opened from.",
      props: [
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', note: "Its width: 400, 480 or 600px, never wider than the window." },
        { name: "glow", type: "boolean", default: "true", note: "The hero's light at its head, with faint dots fading out under it." },
        { name: "closeButton", type: "boolean", default: "true", note: "The X in the corner." },
        { name: "dismissible", type: "boolean", default: "true", note: "Whether a click behind it closes it. Escape always does." },
        { name: "className", type: "string", note: "Added to the card." },
        { name: "children", type: "ReactNode", required: true, note: "What it says and its actions." },
      ],
    },
    { name: "DialogIcon", note: "A raised tile for an icon at the card's head.", props: [{ name: "children", type: "ReactNode", required: true, note: "One icon." }] },
    { name: "DialogTitle", note: "The card's name. The dialog is labelled by it.", props: [{ name: "...props", type: "h2 props", note: "Everything a heading takes." }] },
    { name: "DialogDescription", note: "A line under the title. The dialog is described by it.", props: [{ name: "...props", type: "p props", note: "Everything a paragraph takes." }] },
    { name: "DialogFooter", note: "The actions, the main one last on the right; stacked on a phone with the main one on top.", props: [{ name: "...props", type: "div props", note: "Everything a div takes." }] },
    {
      name: "DialogClose",
      note: "Closes it.",
      props: [
        { name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass. Its own onClick runs first; call preventDefault in it to keep the dialog open." },
        { name: "...props", type: "button props", note: "Everything a button takes." },
      ],
    },
  ],
  examples: [
    {
      id: "confirm",
      title: "Confirm before leaving",
      note: "A small card with a warning icon and two actions: the safe one first, the one that goes ahead last.",
      code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Leave Studio</Button>
  </DialogTrigger>
  <DialogContent size="sm">
    <DialogIcon>
      <WarningCircleIcon weight="duotone" />
    </DialogIcon>
    <DialogTitle>Leave without saving?</DialogTitle>
    <DialogDescription>
      Your last three edits to the hero aren't saved yet.
    </DialogDescription>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Keep editing</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button>Leave</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    },
    {
      id: "form",
      title: "A field inside",
      note: "data-autofocus puts focus straight in the field, so the name can be typed at once. This one goes without the glow.",
      code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Rename draft</Button>
  </DialogTrigger>
  <DialogContent size="sm" glow={false}>
    <DialogTitle>Rename this draft</DialogTitle>
    <DialogDescription>
      Only you and your team see this name.
    </DialogDescription>
    <form className="mt-5" onSubmit={rename}>
      <Input
        data-autofocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Draft name"
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button type="submit">Save</Button>
        </DialogClose>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`,
    },
    {
      id: "locked",
      title: "A step that mustn't be lost",
      note: "dismissible={false} and no close button: a click behind it does nothing, so it's only left by its own action. Escape still closes it.",
      code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Set up your team</Button>
  </DialogTrigger>
  <DialogContent dismissible={false} closeButton={false}>
    <DialogTitle>Name your team</DialogTitle>
    <DialogDescription>
      Your Team license has 10 seats. Give the team a name so invites say who
      they're from.
    </DialogDescription>
    <div className="mt-5">
      <Input
        data-autofocus
        placeholder="Larkspur Studio"
        aria-label="Team name"
      />
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button>Continue</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    },
    {
      id: "controlled",
      title: "Opened from code",
      note: "Pass open and onOpenChange to open it when something finishes, with no trigger at all.",
      code: `const [open, setOpen] = useState(false);

<Button
  variant="outline"
  loading={busy}
  onClick={() => exportCode().then(() => setOpen(true))}
>
  Export the code
</Button>
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent size="sm">
    <DialogTitle>Your code is ready</DialogTitle>
    <DialogDescription>zuno-site.zip, Next.js 16, 2.4 MB.</DialogDescription>
    <DialogFooter>
      <DialogClose asChild>
        <Button>Download</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    },
  ],
  keyboard: [
    { keys: "Enter / Space", does: "On the trigger, opens it." },
    { keys: "Tab", does: "Moves to the next control in the card, and from the last back round to the first. Focus never leaves the card while it's open." },
    { keys: "Shift Tab", does: "Moves to the control before, round to the last." },
    { keys: "Esc", does: "Closes it and puts focus back on the trigger." },
  ],
  a11y: [
    'The card has role="dialog" and aria-modal="true", is named by DialogTitle and described by DialogDescription.',
    "When it opens, focus goes to the element with data-autofocus, or else the first control in it, or else the card itself.",
    "When it closes, focus goes back to what opened it, so a keyboard user lands where they were.",
    "The page behind it doesn't scroll while it's open.",
    "The motion turns into a plain fade when the system asks for reduced motion.",
  ],
};
