import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import Link from "next/link";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@basedraft/ui";

export function TemplateLink() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Link href="/templates/zuno">Zuno</Link>
      </HoverCardTrigger>
      <HoverCardContent>
        <TemplatePreview slug="zuno" />
      </HoverCardContent>
    </HoverCard>
  );
}`,
  use: [
    "For a link whose destination is worth a glance first: a template, a person, a page.",
    "When the preview is a bonus, and everything in it can also be reached at the link.",
  ],
  avoid: [
    "For a short label on an icon: use Tooltip.",
    "For anything people need to act on (a form, buttons): use Popover, which opens on a press and takes focus.",
    "On touch screens it doesn't open; don't put anything there that phones need.",
  ],
  parts: [
    {
      name: "HoverCard",
      note: "Holds whether it's open, and its timing.",
      props: [
        { name: "openDelay", type: "number", default: "400", note: "Milliseconds of resting on the link before it shows." },
        { name: "closeDelay", type: "number", default: "200", note: "Milliseconds of grace after the pointer leaves the link and the card." },
        { name: "children", type: "ReactNode", note: "A HoverCardTrigger and a HoverCardContent.", required: true },
      ],
    },
    {
      name: "HoverCardTrigger",
      note: "The link. Takes every prop an <a> does.",
      props: [
        { name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass (your router's Link) instead of an <a> of its own." },
        { name: "href", type: "string", note: "Where it goes." },
        { name: "...props", type: "<a> props", note: "Everything an <a> takes." },
      ],
    },
    {
      name: "HoverCardContent",
      note: "The card, in a portal, with a caret that points back at the link.",
      props: [
        { name: "side", type: '"top" | "bottom"', default: '"bottom"', note: "Where it opens; it flips when there's no room." },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', note: "How it lines up with the link; it stays inside the window either way." },
        { name: "gap", type: "number", default: "10", note: "Pixels between the link and the card." },
        { name: "className", type: "string", note: "Added to the card; it's 300px wide unless you change it." },
        { name: "children", type: "ReactNode", note: "The preview.", required: true },
      ],
    },
  ],
  examples: [
    {
      id: "template",
      title: "A template's preview",
      note: "Rest on the link, then move to the card along any path toward it: the triangle from the pointer to the card keeps it open.",
      code: `<HoverCard>
  <HoverCardTrigger href="/templates/zuno">Zuno</HoverCardTrigger>
  <HoverCardContent>
    <TemplateCard template={zuno} />
  </HoverCardContent>
</HoverCard>`,
    },
    {
      id: "person",
      title: "A person",
      note: "Who they are and what they last did.",
      code: `<HoverCard>
  <HoverCardTrigger href="/team/maya">Maya Okafor</HoverCardTrigger>
  <HoverCardContent className="w-[260px]">
    <div className="flex items-center gap-3">
      <Avatar name="Maya Okafor" size="lg" status="online" />
      <div>
        <p className="text-sm font-semibold">Maya Okafor</p>
        <p className="text-xs text-[var(--bd-subtle)]">
          Designer at Fieldwork
        </p>
      </div>
    </div>
    <p className="mt-3 text-[13px]">
      Rewrote Zuno's hero and moved Pricing above the FAQ, two hours ago.
    </p>
  </HoverCardContent>
</HoverCard>`,
    },
    {
      id: "above",
      title: "Above, lined up with the start",
      note: "It flips below on its own when there isn't room above.",
      code: `<HoverCardContent side="top" align="start">
  <TemplateCard template={noma} />
</HoverCardContent>`,
    },
    {
      id: "timing",
      title: "Its own timing",
      note: "Quicker to show and slower to go, for a dense list people skim.",
      code: `<HoverCard openDelay={120} closeDelay={400}>
  <HoverCardTrigger href="/templates/zuno">Zuno</HoverCardTrigger>
  <HoverCardContent>
    <TemplateCard template={zuno} />
  </HoverCardContent>
</HoverCard>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focusing the link with the keyboard opens the card after the same pause; tabbing away closes it." },
    { keys: "Escape", does: "Closes the card at once." },
    { keys: "Enter", does: "Follows the link, as any link does." },
  ],
  a11y: [
    "The trigger stays an ordinary link, read and followed as one; the card adds to it and never replaces it.",
    "It opens on hover with a mouse and on keyboard focus, never on touch, so a tap always just follows the link.",
    "The card isn't focusable and doesn't trap focus; keep anything people must reach at the link itself.",
    "It closes on Escape, when focus leaves the link, and a moment after the pointer leaves both the link and the card.",
    "It enters on a soft spring of transform and opacity; with reduced motion it fades.",
  ],
};
