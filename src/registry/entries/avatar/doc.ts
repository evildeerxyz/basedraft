import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Avatar, AvatarGroup } from "@basedraft/ui";

export function Seats() {
  return (
    <div className="flex items-center gap-4">
      <Avatar name="Emily Carter" status="online" />
      <AvatarGroup
        people={[
          { name: "Jake Morrison" },
          { name: "Sarah Mitchell" },
          { name: "Ryan Brooks" },
        ]}
        max={2}
      />
    </div>
  );
}`,
  use: [
    "Wherever a person is named: who's editing, who's on a Team license, who left a change.",
    "Initials on a tint drawn from the name, so the same person always looks the same, with or without a picture.",
    "AvatarGroup for several people in one place, with a count for the rest.",
  ],
  avoid: [
    "For a company or a product: use its logo, not initials.",
    "For a long list of people: list them with names, rather than a pile of faces.",
  ],
  parts: [
    {
      name: "Avatar",
      note: "One person.",
      props: [
        { name: "name", type: "string", note: "Gives the initials, their tint, the tooltip and what a screen reader hears.", required: true },
        { name: "src", type: "string", note: "A picture. Initials show if there's none, or if it fails to load." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', note: "28, 36 or 48px." },
        { name: "status", type: '"online" | "busy" | "away"', note: "A dot in the corner: green, red or amber." },
        { name: "...props", type: "span props", note: "Everything a span takes." },
      ],
    },
    {
      name: "AvatarGroup",
      note: "People overlapping in a row, fanning out when pointed at.",
      props: [
        { name: "people", type: '{ name: string; src?: string; status?: "online" | "busy" | "away" }[]', note: "Everyone, in order.", required: true },
        { name: "max", type: "number", default: "4", note: "How many show before the rest become a +N count." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', note: "Each avatar's size." },
        { name: "className", type: "string", note: "Added to the row." },
      ],
    },
  ],
  examples: [
    {
      id: "sizes",
      title: "Sizes",
      note: "Small in dense rows, large beside a name that leads.",
      code: `<div className="flex items-center gap-3">
  <Avatar name="Sarah Mitchell" size="sm" />
  <Avatar name="Jake Morrison" size="md" />
  <Avatar name="Emily Carter" size="lg" />
</div>`,
    },
    {
      id: "status",
      title: "With a status",
      note: "Here, busy or away, in the corner.",
      code: `<div className="flex items-center gap-3">
  <Avatar name="Ryan Brooks" status="online" />
  <Avatar name="Ashley Cooper" status="busy" />
  <Avatar name="Brandon Reed" status="away" />
</div>`,
    },
    {
      id: "group",
      title: "A group",
      note: "Point at it and the faces fan out; the count's tooltip names the rest.",
      code: `const PEOPLE = [
  { name: "Emily Carter" },
  { name: "Jake Morrison" },
  { name: "Sarah Mitchell" },
  { name: "Ryan Brooks" },
  { name: "Ashley Cooper" },
  { name: "Brandon Reed" },
];

<div className="flex items-center gap-3">
  <AvatarGroup people={PEOPLE} max={3} size="sm" />
  <span className="text-xs text-[var(--bd-subtle)]">
    6 people on this draft
  </span>
</div>`,
    },
  ],
  a11y: [
    "Initials are an image named by name, and a picture's alt text is the name, so a person is read as who they are, not as letters.",
    "The status dot is an image named online, busy or away.",
    "The +N count shows the rest by name in its tooltip; list them in text too where it matters.",
  ],
};
