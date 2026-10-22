import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Select } from "@basedraft/ui";

export function HeadingFont() {
  return (
    <Select
      label="Heading font"
      placeholder="Choose a font"
      onValueChange={(font) => console.log(font)}
      options={[
        { value: "instrument", label: "Instrument Sans" },
        { value: "inter", label: "Inter" },
        { value: "geist", label: "Geist" },
      ]}
    />
  );
}`,
  use: [
    "For one choice from a list too long to show at once: five options or more, or a list that grows.",
    "When the options fall into groups, or carry an icon and a hint each.",
    "Inside a form, wrapped in Field for its label, hint and error.",
  ],
  avoid: [
    "For two to four short options: use Segmented control, so they're all in view.",
    "For a choice that needs a line on what each option means: use Radio group.",
    "For a list of actions rather than a value: use Menu.",
  ],
  parts: [
    {
      name: "Select",
      note: "One component: the pill you press and the card of choices it opens. The choices are data, so a list from anywhere fits.",
      props: [
        { name: "options", type: "Array<SelectOption | SelectGroup>", required: true, note: "The choices: options, or groups of them under a name. They can be mixed." },
        { name: "value", type: "string", note: "Controlled: the chosen option's value." },
        { name: "defaultValue", type: "string", note: "Where it starts, uncontrolled." },
        { name: "onValueChange", type: "(value: string) => void", note: "Called when a choice is made." },
        { name: "placeholder", type: "string", default: '"Choose one"', note: "Shown in the pill while nothing is chosen." },
        { name: "label", type: "string", note: "Names it for screen readers when no Field or visible label does. Or use aria-labelledby." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "36 or 44px tall." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded, and it won't open." },
        { name: "name", type: "string", note: "With a name, a hidden input carries the choice in a form." },
        { name: "id", type: "string", note: "Goes on the pill, so a <label htmlFor> can point at it. Field sets it for you." },
        { name: "aria-invalid", type: "boolean", note: "Rims the pill in red. Field sets it when it has an error." },
        { name: "aria-describedby", type: "string", note: "Points at a hint or error line. Field sets it for you." },
        { name: "className", type: "string", note: "Goes on the pill, to size it. It's full width until you say otherwise." },
      ],
    },
    {
      name: "SelectOption",
      note: "One choice, as data.",
      props: [
        { name: "value", type: "string", required: true, note: "What's reported when it's chosen. Unique within the list." },
        { name: "label", type: "string", required: true, note: "Its name, also what typing matches." },
        { name: "icon", type: "ReactNode", note: "Before the name, in the list and in the pill once chosen." },
        { name: "hint", type: "ReactNode", note: "Quiet, on the right of its row: a category, a size, a shortcut." },
        { name: "disabled", type: "boolean", note: "Faded and skipped: something not yet open." },
      ],
    },
    {
      name: "SelectGroup",
      note: "A name over some of the options.",
      props: [
        { name: "label", type: "string", required: true, note: "The group's name, small over its options." },
        { name: "options", type: "SelectOption[]", required: true, note: "The options under it." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "A plain list",
      note: "With a placeholder until something is chosen.",
      code: `<Select
  label="Heading font"
  placeholder="Choose a font"
  className="max-w-[260px]"
  options={[
    { value: "instrument", label: "Instrument Sans" },
    { value: "inter", label: "Inter" },
    { value: "geist", label: "Geist" },
    { value: "plex", label: "IBM Plex Sans" },
  ]}
/>`,
    },
    {
      id: "groups",
      title: "Groups, icons and hints",
      note: "Options under small names, each with an icon and a hint, one not open yet.",
      code: `<Select
  label="Template"
  defaultValue="noma"
  className="max-w-[300px]"
  options={[
    {
      label: "Templates",
      options: [
        {
          value: "zuno",
          label: "Zuno",
          icon: <ChartLineUpIcon weight="duotone" />,
          hint: "Fintech",
        },
        {
          value: "noma",
          label: "Noma",
          icon: <DatabaseIcon weight="duotone" />,
          hint: "AI and data",
        },
        {
          value: "auren",
          label: "Auren",
          icon: <CodeIcon weight="duotone" />,
          hint: "Developer tools",
        },
      ],
    },
    {
      label: "Coming next",
      options: [
        {
          value: "analytics",
          label: "Analytics dashboard",
          icon: <GaugeIcon weight="duotone" />,
          hint: "Soon",
          disabled: true,
        },
      ],
    },
  ]}
/>`,
    },
    {
      id: "field",
      title: "In a Field, with an error",
      note: "Field gives it a label and an error, and rims it in red until a choice is made.",
      code: `function SendTo() {
  const [to, setTo] = useState<string>();
  return (
    <Field
      label="Send to"
      error={to ? undefined : "Choose where to send it."}
      className="max-w-[300px]"
    >
      <Select
        value={to}
        onValueChange={setTo}
        placeholder="Choose a destination"
        options={[
          {
            value: "github",
            label: "A new GitHub repository",
            icon: <GithubLogoIcon weight="duotone" />,
          },
          {
            value: "zip",
            label: "A zip to download",
            icon: <DownloadSimpleIcon weight="duotone" />,
          },
        ]}
      />
    </Field>
  );
}`,
    },
    {
      id: "small",
      title: "Small, for a toolbar",
      code: `<Select
  size="sm"
  label="Preview width"
  defaultValue="desktop"
  className="max-w-[200px]"
  options={[
    {
      value: "desktop",
      label: "Desktop",
      icon: <MonitorIcon weight="duotone" />,
      hint: "1440",
    },
    {
      value: "tablet",
      label: "Tablet",
      icon: <DeviceTabletIcon weight="duotone" />,
      hint: "820",
    },
    {
      value: "phone",
      label: "Phone",
      icon: <DeviceMobileIcon weight="duotone" />,
      hint: "390",
    },
  ]}
/>`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "Shows the choice but won't open: for something set elsewhere.",
      code: `<Select
  disabled
  label="Framework"
  defaultValue="next"
  className="max-w-[260px]"
  options={[
    { value: "next", label: "Next.js 16" },
    { value: "astro", label: "Astro 7" },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "↓ ↑ Enter Space", does: "On the pill: opens the list, on the chosen option." },
    { keys: "↓ ↑", does: "In the list: moves to the next or previous option, skipping disabled ones and wrapping." },
    { keys: "Home End", does: "Moves to the first or last option." },
    { keys: "Enter Space", does: "Chooses the option and closes the list." },
    { keys: "Esc", does: "Closes the list without changing the choice." },
    { keys: "Tab", does: "Closes the list and moves on." },
    { keys: "A to Z", does: "Jumps to the next option starting with what's typed; letters typed quickly read as one word. On the closed pill, it chooses it straight away." },
  ],
  a11y: [
    "The pill is a combobox with aria-haspopup listbox and aria-expanded; focus stays on it while the list is open, which points at the active option with aria-activedescendant.",
    "The list is a listbox of options with aria-selected; groups are named groups, so screen readers say which group an option is in.",
    "Name it with Field, a <label htmlFor> on its id, aria-labelledby, or label. The placeholder isn't a name.",
    "The list opens in a layer over the page, so it's never cut off by a card's edge, and wears the same light or dark as the pill.",
  ],
};
