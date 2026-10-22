import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { GithubLogoIcon } from "@phosphor-icons/react";
import { Button } from "@basedraft/ui";

export function Publish({ busy }: { busy: boolean }) {
  return (
    <div className="flex gap-3">
      <Button variant="metal" size="lg" loading={busy}>
        <GithubLogoIcon weight="duotone" /> Publish to GitHub
      </Button>
      <Button variant="outline" size="lg">Preview</Button>
    </div>
  );
}`,
  use: [
    "For any action a person takes on the page: ink for the main one in a view, outline or ghost for the ones beside it.",
    "Metal for the one action that matters most on a whole page, used once.",
    "Set loading while an action runs, so the button keeps its width and can't be pressed twice.",
  ],
  avoid: [
    "For something that can't be undone, like deleting: use Hold button, so it takes a deliberate hold.",
    "For copying text: use Copy button, which shows that it worked.",
    "For picking one of a few options: use Segmented control.",
    "For going to another page: use a link, so it opens in a new tab and shows its address.",
  ],
  parts: [
    {
      name: "Button",
      note: "A native button element.",
      props: [
        { name: "variant", type: '"ink" | "metal" | "paper" | "glass" | "outline" | "ghost"', default: '"ink"', note: "Its material. Ink is solid; metal is charcoal inside a brushed edge that catches a sheen on hover; paper is near white; glass is frosted, for over a picture; outline and ghost are quieter." },
        { name: "size", type: '"sm" | "md" | "lg" | "icon"', default: '"md"', note: "32, 40 or 48px tall. Icon is a 40px circle for a lone icon, which then needs an aria-label." },
        { name: "loading", type: "boolean", default: "false", note: "Swaps the label for a field of dots pulsing in an ordered-dither pattern, keeps the width, sets aria-busy, and holds off clicks." },
        { name: "disabled", type: "boolean", default: "false", note: "Fades it and stops it taking clicks or focus." },
        { name: "type", type: '"button" | "submit" | "reset"', default: '"button"', note: "Button by default, so it never submits a form by accident. Set submit for a form's own button." },
        { name: "children", type: "ReactNode", note: "The label. Phosphor icons inside size themselves to the button." },
        { name: "...props", type: "button props", note: "Everything a button takes: onClick, aria-label, form and the rest." },
      ],
    },
  ],
  examples: [
    {
      id: "variants",
      title: "Six materials",
      note: "Ink for the main action, metal for the one that matters most, and four quieter ones for the rest.",
      code: `<div className="flex flex-wrap items-center gap-2.5">
  <Button>Save draft</Button>
  <Button variant="metal">Publish</Button>
  <Button variant="paper">Duplicate</Button>
  <Button variant="glass">Share</Button>
  <Button variant="outline">Preview</Button>
  <Button variant="ghost">Cancel</Button>
</div>`,
    },
    {
      id: "sizes",
      title: "Sizes",
      note: "Small for toolbars and dense rows, large for the action that leads a page, and a circle for a lone icon.",
      code: `<div className="flex items-center gap-2.5">
  <Button size="sm">Rename</Button>
  <Button size="md">Save draft</Button>
  <Button size="lg">Open Studio</Button>
  <Button size="icon" variant="outline" aria-label="Undo">
    <ArrowCounterClockwiseIcon weight="regular" />
  </Button>
</div>`,
    },
    {
      id: "icons",
      title: "With an icon",
      note: "An icon before the label says what kind of action it is; an arrow after it says where it goes.",
      code: `<div className="flex flex-wrap items-center gap-2.5">
  <Button variant="outline">
    <GithubLogoIcon weight="duotone" /> Send to GitHub
  </Button>
  <Button>
    Open in Studio <ArrowUpRightIcon weight="regular" />
  </Button>
</div>`,
    },
    {
      id: "loading",
      title: "Loading",
      note: "Press it: the label gives way to the dither while it works, and the width doesn't move.",
      code: `function Deploy() {
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
}`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "For an action that isn't available yet. Say why nearby, so it's not a dead end.",
      code: `<div className="grid justify-items-center gap-2.5">
  <div className="flex items-center gap-2.5">
    <Button disabled>Publish</Button>
    <Button variant="outline" disabled>Preview</Button>
  </div>
  <p className="text-xs text-[var(--bd-subtle)]">Connect GitHub to publish.</p>
</div>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus to the button, with an ink ring around it." },
    { keys: "Enter / Space", does: "Presses it." },
  ],
  a11y: [
    "A native button, of type button unless you set another, so keyboards and screen readers treat it as one.",
    "While loading, the label stays in place (only hidden from sight), so the button keeps its name, and aria-busy says it's working.",
    "A button with only an icon (size icon) needs an aria-label to say what it does.",
    "With reduced motion, the dither holds still and metal's sheen doesn't cross.",
  ],
};
