import type { ComponentDoc } from "../../types";

const passthrough = (el: string) => ({ name: "...props", type: `${el} props`, note: `Everything a ${el} takes.` });

export const doc: ComponentDoc = {
  usage: `import {
  Button,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@basedraft/ui";

export function HeroSettings() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Hero settings</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Hero settings</SheetTitle>
          <SheetDescription>Zuno, home page.</SheetDescription>
        </SheetHeader>
        <SheetBody>{/* the settings */}</SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button>Save</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}`,
  use: [
    "For settings or details about what's on the page, where seeing the page behind helps.",
    "For forms too long for a dialog: the body scrolls while the header and the actions stay put.",
    "On phones, from the bottom: a sheet the thumb can reach, dragged down by its grip to close.",
  ],
  avoid: [
    "For a quick yes or no: use Dialog, which asks for full attention.",
    "For a few options tied to one button: use Popover or Menu.",
    "For the site's main navigation on wide screens: keep it on the page, not behind a button.",
  ],
  parts: [
    {
      name: "Sheet",
      note: "Holds whether it's open. Renders nothing itself.",
      props: [
        { name: "open", type: "boolean", note: "Whether it's open, when you control it. Leave it out and Sheet keeps that itself." },
        { name: "defaultOpen", type: "boolean", default: "false", note: "Open at first, when Sheet keeps the state." },
        { name: "onOpenChange", type: "(open: boolean) => void", note: "Called when it opens or closes." },
        { name: "children", type: "ReactNode", required: true, note: "The trigger and the content." },
      ],
    },
    {
      name: "SheetTrigger",
      note: "Opens it, and remembers itself so focus comes back to it.",
      props: [{ name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass instead of a plain button." }, passthrough("button")],
    },
    {
      name: "SheetContent",
      note: "The panel, in a portal, floating 8px in from the window's edge.",
      props: [
        { name: "side", type: '"right" | "left" | "bottom"', default: '"right"', note: "The edge it comes from. Right and left are up to 420px wide; bottom is up to 640px wide and 86% of the window tall, with a grip to drag it away." },
        { name: "closeButton", type: "boolean", default: "true", note: "The X in the corner." },
        { name: "className", type: "string", note: "Added to the panel." },
        { name: "children", type: "ReactNode", required: true, note: "Its header, body and footer." },
      ],
    },
    { name: "SheetHeader", note: "The top: title and description on a faint wash of paper, above a hairline.", props: [passthrough("div")] },
    { name: "SheetTitle", note: "The panel's name. The panel is labelled by it.", props: [passthrough("h2")] },
    { name: "SheetDescription", note: "A line under the title. The panel is described by it.", props: [passthrough("p")] },
    { name: "SheetBody", note: "The middle, which scrolls on its own.", props: [passthrough("div")] },
    { name: "SheetFooter", note: "The actions, held at the foot above a hairline.", props: [passthrough("div")] },
    { name: "SheetClose", note: "Closes it.", props: [{ name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass. Its own onClick runs first." }, passthrough("button")] },
  ],
  examples: [
    {
      id: "bottom",
      title: "From the bottom",
      note: "The phone's sheet: it rises from the foot of the window with a grip. Drag the grip down far enough, or quickly, and it goes.",
      code: `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Share draft</Button>
  </SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader className="pt-3">
      <SheetTitle>Share this draft</SheetTitle>
      <SheetDescription>
        Anyone with the link can look. Only your team can edit.
      </SheetDescription>
    </SheetHeader>
    <SheetBody>
      <CopyButton
        value="https://basedraft.site/d/zuno-spring"
        label="Copy link"
        variant="pill"
      />
    </SheetBody>
  </SheetContent>
</Sheet>`,
    },
    {
      id: "left",
      title: "From the left, as a list",
      note: "Each row is wrapped in SheetClose, so choosing a page closes the panel too.",
      code: `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Pages</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Zuno's pages</SheetTitle>
    </SheetHeader>
    <SheetBody className="px-3">
      {pages.map((p) => (
        <SheetClose asChild key={p}>
          <button type="button" onClick={() => open(p)}>{p}</button>
        </SheetClose>
      ))}
    </SheetBody>
  </SheetContent>
</Sheet>`,
    },
    {
      id: "long",
      title: "A long body",
      note: "Only the body scrolls: the title stays at the top and Done stays at the foot.",
      code: `<SheetContent>
  <SheetHeader>
    <SheetTitle>What's new</SheetTitle>
    <SheetDescription>The last two weeks, newest first.</SheetDescription>
  </SheetHeader>
  <SheetBody>{changes.map((c) => <Change key={c.id} {...c} />)}</SheetBody>
  <SheetFooter>
    <SheetClose asChild>
      <Button>Done</Button>
    </SheetClose>
  </SheetFooter>
</SheetContent>`,
    },
  ],
  keyboard: [
    { keys: "Enter / Space", does: "On the trigger, opens it." },
    { keys: "Tab", does: "Moves through the panel's controls and round again; focus stays in the panel while it's open." },
    { keys: "Shift Tab", does: "Moves back, round to the last control." },
    { keys: "Esc", does: "Closes it and puts focus back on the trigger." },
  ],
  a11y: [
    'The panel has role="dialog" and aria-modal="true", named by SheetTitle and described by SheetDescription.',
    "Focus goes to the element with data-autofocus, or the first control, when it opens, and back to the trigger when it closes.",
    "The bottom sheet's grip is only for the pointer; Escape and the close button do the same for everyone else.",
    "The page behind doesn't scroll while it's open. With reduced motion, it fades instead of sliding.",
  ],
};
