import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { DeviceMobileIcon, MonitorIcon } from "@phosphor-icons/react";
import { Segmented } from "@basedraft/ui";

export function Width() {
  return (
    <Segmented
      label="Preview width"
      options={[
        {
          value: "desktop",
          label: "Desktop",
          icon: <MonitorIcon weight="duotone" />,
        },
        {
          value: "phone",
          label: "Phone",
          icon: <DeviceMobileIcon weight="duotone" />,
        },
      ]}
    />
  );
}`,
  use: [
    "For one choice of two to four that changes a view at once: a preview width, a theme, a framework.",
    "When every option is short enough to read side by side.",
  ],
  avoid: [
    "For five options or more, or long ones: use Select, or Radio group in a form.",
    "For switching between panels of content: use Tabs.",
    "For on or off: use Switch.",
  ],
  parts: [
    {
      name: "Segmented",
      note: "A radio group in a machined track, the chosen option on a raised thumb.",
      props: [
        { name: "options", type: "{ value: string; label: ReactNode; icon?: ReactNode }[]", note: "The choices, in order. Icons size to 16px, 14px when small.", required: true },
        { name: "label", type: "string", note: "Names the group for screen readers.", required: true },
        { name: "value", type: "string", note: "The chosen option, when you control it." },
        { name: "defaultValue", type: "string", default: "the first option", note: "Where it starts, when it keeps its own state." },
        { name: "onValueChange", type: "(value: string) => void", note: "Called when the choice changes." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "28 or 36px tall inside its track." },
        { name: "className", type: "string", note: "Added to the track, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "text",
      title: "Words only",
      note: "The plainest form: a few short names.",
      code: `<Segmented
  label="Theme"
  options={[
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ]}
/>`,
    },
    {
      id: "icons",
      title: "With icons",
      note: "An icon each, before the name.",
      code: `<Segmented
  label="Text alignment"
  options={[
    {
      value: "left",
      label: "Left",
      icon: <TextAlignLeftIcon weight="duotone" />,
    },
    {
      value: "center",
      label: "Center",
      icon: <TextAlignCenterIcon weight="duotone" />,
    },
    {
      value: "right",
      label: "Right",
      icon: <TextAlignRightIcon weight="duotone" />,
    },
  ]}
/>`,
    },
    {
      id: "small",
      title: "Small",
      note: "For a toolbar or a dense panel.",
      code: `<Segmented
  size="sm"
  label="Framework"
  options={[
    { value: "next", label: "Next.js" },
    { value: "astro", label: "Astro" },
  ]}
/>`,
    },
    {
      id: "controlled",
      title: "Controlled",
      note: "value and onValueChange, when the choice changes something else.",
      code: `const PLACES: Record<string, string> = {
  figma: "Figma",
  code: "a zip of the code",
  github: "a new GitHub repository",
};

function Export() {
  const [to, setTo] = useState("figma");
  return (
    <div className="grid justify-items-center gap-3">
      <Segmented
        label="Export to"
        value={to}
        onValueChange={setTo}
        options={[
          { value: "figma", label: "Figma" },
          { value: "code", label: "Code" },
          { value: "github", label: "GitHub" },
        ]}
      />
      <p className="text-xs text-[var(--bd-subtle)]">Exports to {PLACES[to]}</p>
    </div>
  );
}`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus to the chosen option." },
    { keys: "← / →, ↑ / ↓", does: "Chooses the previous or next option, wrapping at the ends." },
  ],
  a11y: [
    "A radiogroup named by label, each option a radio with aria-checked.",
    "Only the chosen option is in the tab order; the arrow keys move between them, as in any radio group.",
    "The thumb's slide is motion only; the choice is in aria-checked and in the raised face.",
  ],
};
