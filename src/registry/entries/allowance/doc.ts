import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Allowance } from "@/components/basedraft/allowance";

export function Minutes() {
  return (
    <Allowance
      label="Build minutes"
      used={5046}
      limit={6000}
      unit="min"
      projected={6210}
      note="Renews Nov 30"
      action={<button onClick={addMinutes}>Add 2,000 for $10</button>}
    />
  );
}`,
  use: ["For a plan's allowance people can run out of: minutes, storage, seats, requests.", "Give it projected, where it'll be at this pace, so trouble shows before it arrives.", "In an AppSidebar's footer, pass compact on the rail: it becomes a ring with the share in it."],
  avoid: ["For a figure with no limit: use Stat.", "For progress through steps: use Stepper."],
  parts: [
    {
      name: "Allowance",
      props: [
        { name: "label", type: "string", note: "What it measures.", required: true },
        { name: "used, limit", type: "number", note: "How much is used, of how much.", required: true },
        { name: "unit", type: "string", note: "After the figures: min, GB, seats." },
        { name: "projected", type: "number", note: "Where it'll be by the period's end: hatched ahead of the fill, and amber if it passes the limit." },
        { name: "note", type: "ReactNode", note: "A line under the bar, like when it renews." },
        { name: "action", type: "ReactNode", note: "A button or link at its foot." },
        { name: "icon", type: "ReactNode", note: "A small icon tile before the label." },
        { name: "warnAt", type: "number", default: "0.8", note: "From this share up, it turns amber." },
        { name: "compact", type: "boolean", default: "false", note: "A ring with the share in it, for a rail." },
      ],
    },
  ],
  examples: [{ id: "states", title: "Fine, close, and over", note: "Ink while there's room, amber near the limit or heading past it, red once it's past.", code: `<Allowance label="Seats" used={8} limit={10} />\n<Allowance label="Build minutes" used={5046} limit={6000} projected={6210} />\n<Allowance label="Bandwidth" used={1.2} limit={1} unit="TB" />` }],
  keyboard: [{ keys: "None", does: "It shows; put any action in action." }],
  a11y: ["The bar and the ring are meters, read as the figure, the limit, the share and where it's heading.", "Amber and red come with the share in figures, never color alone."],
};
