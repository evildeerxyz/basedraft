import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { RadioGroup, RadioGroupItem } from "@basedraft/ui";

export function License() {
  return (
    <RadioGroup
      variant="card"
      defaultValue="pro"
      label="License"
      onValueChange={(v) => console.log(v)}
    >
      <RadioGroupItem
        value="pro"
        label="Pro"
        description="Every template and section, and every update after."
        aside="$149"
      />
      <RadioGroupItem
        value="team"
        label="Team"
        description="Up to 10 people, client work included."
        aside="$399"
      />
    </RadioGroup>
  );
}`,
  use: [
    "For one choice out of two to six, when each needs a line on what it means.",
    "As cards when the choice is a big one, a plan or a format, with a price or a count on each.",
    "As rows inside a settings panel or a form, where cards would be too heavy.",
  ],
  avoid: [
    "For two to four short options with nothing to explain: use Segmented control.",
    "For a longer list, or one that changes: use Select.",
    "For choices that can each be on or off: use Checkbox.",
  ],
  parts: [
    {
      name: "RadioGroup",
      note: "The group: holds the choice and moves it with the arrow keys.",
      props: [
        { name: "value", type: "string", note: "Controlled: the chosen item's value." },
        { name: "defaultValue", type: "string", note: "Where it starts, uncontrolled. With none, nothing is chosen and Tab lands on the first item." },
        { name: "onValueChange", type: "(value: string) => void", note: "Called when the choice changes, by click or arrow key." },
        { name: "variant", type: '"row" | "card"', default: '"row"', note: "Rows in a list, or cards that each carry more." },
        { name: "label", type: "string", note: "Names the group for screen readers when nothing on the page does. Or use aria-labelledby." },
        { name: "name", type: "string", note: "With a name, a hidden input carries the choice in a form." },
        { name: "disabled", type: "boolean", default: "false", note: "Fades every item, and none can be chosen." },
        { name: "className", type: "string", note: "Goes on the grid, to lay the items out: sm:grid-cols-2 puts cards side by side." },
        { name: "children", type: "ReactNode", required: true, note: "RadioGroupItem, one per choice." },
      ],
    },
    {
      name: "RadioGroupItem",
      note: "One choice. Its dot fills with ink and a bead springs into its middle when it's chosen.",
      props: [
        { name: "value", type: "string", required: true, note: "What the group reports when this one is chosen." },
        { name: "label", type: "ReactNode", required: true, note: "Its name, read first." },
        { name: "description", type: "ReactNode", note: "A line on what choosing it means, read after the name." },
        { name: "aside", type: "ReactNode", note: "On the right: a price, a count." },
        { name: "icon", type: "ReactNode", note: "Before the label, on cards only. Icons size to 18px." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded, skipped by the arrow keys, and it can't be chosen." },
        { name: "className", type: "string", note: "Goes on the row or card." },
      ],
    },
  ],
  examples: [
    {
      id: "rows",
      title: "As rows",
      note: "Quiet enough for a settings panel. The row is what you click.",
      code: `<RadioGroup
  defaultValue="account"
  label="Where Studio saves your drafts"
  className="w-full max-w-[340px]"
>
  <RadioGroupItem
    value="browser"
    label="This browser"
    description="Only here, until you sign in."
  />
  <RadioGroupItem
    value="account"
    label="Your account"
    description="On every device you sign in on."
  />
  <RadioGroupItem
    value="github"
    label="GitHub"
    description="A commit for each change you make."
  />
</RadioGroup>`,
    },
    {
      id: "icons",
      title: "Cards with icons",
      note: "The chosen card takes an ink edge and lifts.",
      code: `<RadioGroup
  variant="card"
  defaultValue="figma"
  label="Copy to"
  className="w-full max-w-[340px]"
>
  <RadioGroupItem
    value="figma"
    icon={<FigmaLogoIcon weight="duotone" />}
    label="Figma"
    description="Auto layout, components and named layers."
  />
  <RadioGroupItem
    value="svg"
    icon={<FileSvgIcon weight="duotone" />}
    label="SVG"
    description="One flat picture of the section."
  />
</RadioGroup>`,
    },
    {
      id: "controlled",
      title: "Controlled",
      note: "Hold the choice yourself to act on it as it changes.",
      code: `function Width() {
  const [width, setWidth] = useState("desktop");
  return (
    <div className="grid w-full max-w-[340px] gap-3">
      <RadioGroup value={width} onValueChange={setWidth} label="Preview width">
        <RadioGroupItem
          value="desktop"
          label="Desktop"
          description="1440 pixels wide."
        />
        <RadioGroupItem
          value="phone"
          label="Phone"
          description="390 pixels wide."
        />
      </RadioGroup>
      <p className="px-3 text-xs text-[var(--bd-subtle)]">
        Previewing at {width === "desktop" ? 1440 : 390} px.
      </p>
    </div>
  );
}`,
    },
    {
      id: "side",
      title: "Side by side",
      note: "The group is a grid: give it columns and the cards sit in a row.",
      code: `<RadioGroup
  variant="card"
  defaultValue="site"
  label="Start from"
  className="w-full max-w-[520px] sm:grid-cols-2"
>
  <RadioGroupItem
    value="site"
    icon={<BrowserIcon weight="duotone" />}
    label="A whole site"
    description="Every page of a template."
  />
  <RadioGroupItem
    value="page"
    icon={<FileIcon weight="duotone" />}
    label="One page"
    description="Just its home page, to build on."
  />
</RadioGroup>`,
    },
    {
      id: "disabled",
      title: "A choice that isn't open yet",
      note: "Disable one item and say what it needs; the arrow keys pass it by.",
      code: `<RadioGroup
  variant="card"
  defaultValue="solo"
  label="Seats"
  className="w-full max-w-[340px]"
>
  <RadioGroupItem
    value="solo"
    icon={<UserCircleIcon weight="duotone" />}
    label="Just you"
    description="One person, every project of your own."
  />
  <RadioGroupItem
    value="team"
    disabled
    label="Up to 10 people"
    description="Needs a Team license."
    aside="Team"
  />
</RadioGroup>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves into the group, landing on the chosen item (or the first), and out of it again." },
    { keys: "↓ →", does: "Chooses the next item, wrapping at the end. Disabled items are skipped." },
    { keys: "↑ ←", does: "Chooses the one before." },
    { keys: "Space", does: "Chooses the focused item." },
  ],
  a11y: [
    "A radiogroup of radios with aria-checked; only the chosen one is a Tab stop, the arrow keys do the rest.",
    "Each radio is named by its label and described by its description, so the line under it is read too.",
    "Name the group with label, or aria-labelledby pointing at a visible heading.",
    "The dot is drawn, not spoken: screen readers say selected, and the position, like 2 of 3.",
  ],
};
