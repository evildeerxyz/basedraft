import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Combobox } from "@basedraft/ui";

export function AddSections() {
  return (
    <Combobox
      multiple
      label="Sections to add"
      placeholder="Search sections"
      onValueChange={(sections) => console.log(sections)}
      options={[
        {
          label: "Hero",
          options: [
            { value: "zuno-hero", label: "Zuno hero", hint: "Fintech" },
            { value: "noma-hero", label: "Noma hero", hint: "AI and data" },
          ],
        },
        {
          label: "Pricing",
          options: [
            { value: "zuno-pricing", label: "Zuno pricing", hint: "Fintech" },
          ],
        },
      ]}
    />
  );
}`,
  use: [
    "For one choice, or several, from a list long enough that finding beats scrolling: fonts, sections, people, countries.",
    "When the choices come from a search of your own as people type, with onSearch and loading.",
    "When people may need a choice that isn't there yet: onCreate offers to make it.",
  ],
  avoid: [
    "For a short, known list with nothing to search: use Select.",
    "For free words with no list behind them, like keywords or emails: use Tag input.",
    "For two to four options: use Segmented control or Radio group, so they're all in view.",
  ],
  parts: [
    {
      name: "Combobox",
      note: "One component: the field you type in, the chips it holds in multiple mode, and the card of choices. The choices are data.",
      props: [
        { name: "options", type: "Array<ComboboxOption | ComboboxGroup>", required: true, note: "The choices: options, or groups of them under a name. They can be mixed." },
        { name: "multiple", type: "boolean", default: "false", note: "Holds several choices as chips; then value is a string[] and the list stays open as you pick." },
        { name: "value", type: "string | null, or string[] when multiple", note: "Controlled: the chosen value, or values." },
        { name: "defaultValue", type: "string | null, or string[] when multiple", note: "Where it starts, uncontrolled." },
        { name: "onValueChange", type: "(value: string | null) => void, or (value: string[]) => void when multiple", note: "Called with the new choice, or the whole new list." },
        { name: "onSearch", type: "(query: string) => void", note: "Called with what's typed as it changes, for choices that come from your own search. Pair it with filter={false} and loading." },
        { name: "filter", type: "boolean", default: "true", note: "Narrows the options to the typed words, in each label and its keywords. Turn it off when onSearch already does." },
        { name: "loading", type: "boolean", default: "false", note: "Shows a row that says it's searching, while results are on their way." },
        { name: "onCreate", type: "(query: string) => void", note: "Offers a Create row when no choice is called what's typed. It's called with the text, and the new choice is picked straight away; add it to options to keep it." },
        { name: "empty", type: "ReactNode", default: '"Nothing matches that."', note: "What the card says when nothing matches." },
        { name: "placeholder", type: "string", default: '"Search"', note: "Shown in the field while it's empty." },
        { name: "label", type: "string", note: "Names it for screen readers when no Field or visible label does. Or use aria-labelledby." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "36 or 44px tall before chips wrap." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded, and it won't open." },
        { name: "name", type: "string", note: "With a name, hidden inputs carry the choice, or one per choice, in a form." },
        { name: "id", type: "string", note: "Goes on the field's input, so a <label htmlFor> can point at it. Field sets it for you." },
        { name: "aria-invalid", type: "boolean", note: "Rims it in red. Field sets it when it has an error." },
        { name: "className", type: "string", note: "Goes on the field, to size it. It's full width until you say otherwise." },
      ],
    },
    {
      name: "ComboboxOption",
      note: "One choice, as data.",
      props: [
        { name: "value", type: "string", required: true, note: "What's reported when it's chosen. Unique within the list." },
        { name: "label", type: "string", required: true, note: "Its name: what's shown, matched, and drawn with the matching letters in ink." },
        { name: "keywords", type: "string[]", note: "More words it answers to: faq for Questions, a country's code for its name." },
        { name: "icon", type: "ReactNode", note: "Before the name in the list." },
        { name: "hint", type: "ReactNode", note: "Quiet, on the right of its row." },
        { name: "disabled", type: "boolean", note: "Faded and skipped by the arrows." },
      ],
    },
    {
      name: "ComboboxGroup",
      note: "A name over some of the options. A group with no match is hidden while filtering.",
      props: [
        { name: "label", type: "string", required: true, note: "The group's name." },
        { name: "options", type: "ComboboxOption[]", required: true, note: "The options under it." },
      ],
    },
  ],
  examples: [
    {
      id: "single",
      title: "One choice, in groups",
      note: "Type to narrow a long list. Focus selects what's there, so typing replaces it.",
      code: `<Combobox
  label="Heading font"
  placeholder="Search fonts"
  defaultValue="instrument"
  className="max-w-[280px]"
  options={[
    {
      label: "Sans",
      options: [
        { value: "instrument", label: "Instrument Sans" },
        { value: "inter", label: "Inter" },
        { value: "geist", label: "Geist" },
        { value: "plex", label: "IBM Plex Sans" },
        { value: "manrope", label: "Manrope" },
        { value: "space", label: "Space Grotesk" },
      ],
    },
    {
      label: "Serif",
      options: [
        { value: "fraunces", label: "Fraunces" },
        { value: "newsreader", label: "Newsreader" },
        { value: "instrument-serif", label: "Instrument Serif" },
      ],
    },
  ]}
/>`,
    },
    {
      id: "multiple",
      title: "Several, as chips",
      note: "The list stays open while you pick. Backspace on an empty field marks the last chip, and a second press takes it away.",
      code: `<Combobox
  multiple
  label="Sections to add"
  placeholder="Search sections"
  defaultValue={["zuno-hero"]}
  className="max-w-[340px]"
  options={[
    {
      label: "Hero",
      options: [
        {
          value: "zuno-hero",
          label: "Zuno hero",
          icon: <TextHOneIcon weight="duotone" />,
          hint: "Fintech",
        },
        {
          value: "noma-hero",
          label: "Noma hero",
          icon: <TextHOneIcon weight="duotone" />,
          hint: "AI and data",
        },
        {
          value: "auren-hero",
          label: "Auren hero",
          icon: <TextHOneIcon weight="duotone" />,
          hint: "Developer tools",
        },
      ],
    },
    {
      label: "Pricing",
      options: [
        {
          value: "zuno-pricing",
          label: "Zuno pricing",
          icon: <TagIcon weight="duotone" />,
          hint: "Fintech",
        },
        {
          value: "auren-pricing",
          label: "Auren pricing",
          icon: <TagIcon weight="duotone" />,
          hint: "Developer tools",
        },
      ],
    },
    {
      label: "Questions",
      options: [
        {
          value: "zuno-faq",
          label: "Zuno questions",
          icon: <QuestionIcon weight="duotone" />,
          hint: "Fintech",
          keywords: ["faq"],
        },
        {
          value: "noma-faq",
          label: "Noma questions",
          icon: <QuestionIcon weight="duotone" />,
          hint: "AI and data",
          keywords: ["faq"],
        },
      ],
    },
  ]}
/>`,
    },
    {
      id: "create",
      title: "Create what isn't there",
      note: "Type a label that doesn't exist and the last row offers to create it.",
      code: `function Labels() {
  const [labels, setLabels] = useState<ComboboxOption[]>([
    {
      value: "fintech",
      label: "Fintech",
      icon: <ChartLineUpIcon weight="duotone" />,
    },
    {
      value: "data",
      label: "AI and data",
      icon: <DatabaseIcon weight="duotone" />,
    },
    {
      value: "devtools",
      label: "Developer tools",
      icon: <CodeIcon weight="duotone" />,
    },
  ]);
  return (
    <Combobox
      multiple
      label="Labels"
      placeholder="Add a label"
      defaultValue={["fintech"]}
      options={labels}
      onCreate={(name) =>
        setLabels((l) => [
          ...l,
          {
            value: name,
            label: name,
            icon: <SquaresFourIcon weight="duotone" />,
          },
        ])
      }
      className="max-w-[320px]"
    />
  );
}`,
    },
    {
      id: "async",
      title: "From your own search",
      note: "onSearch fetches as you type; filter is off because the results are already matched, and loading shows while they come.",
      code: `const TEAM = [
  "Maya Okafor",
  "Jonah Park",
  "Lea Moreau",
  "Sami Ito",
  "Ana Ruiz",
  "Ben Adeyemi",
];

function AssignTo() {
  const [results, setResults] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Combobox
      label="Assign to"
      placeholder="Search your team"
      filter={false}
      loading={loading}
      options={results}
      empty="No one on the team by that name."
      onSearch={(q) => {
        clearTimeout(timer.current);
        if (!q.trim()) {
          setLoading(false);
          return setResults([]);
        }
        setLoading(true);
        timer.current = setTimeout(() => {
          setResults(
            TEAM.filter((n) =>
              n.toLowerCase().includes(q.trim().toLowerCase()),
            ).map((n) => ({ value: n, label: n })),
          );
          setLoading(false);
        }, 450);
      }}
      className="max-w-[280px]"
    />
  );
}`,
    },
    {
      id: "small",
      title: "Small, for a toolbar",
      code: `<Combobox
  size="sm"
  label="Template"
  placeholder="Template"
  defaultValue="noma"
  className="max-w-[220px]"
  options={[
    { value: "zuno", label: "Zuno", hint: "Fintech" },
    { value: "noma", label: "Noma", hint: "AI and data" },
    { value: "auren", label: "Auren", hint: "Developer tools" },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "A to Z", does: "Types in the field: opens the list and narrows it to what matches, highlighting the first match." },
    { keys: "↓ ↑", does: "Opens the list, then moves the highlight through it, skipping disabled choices and wrapping at the ends." },
    { keys: "Enter", does: "Picks the highlighted choice, or creates what's typed on the Create row. In multiple mode it adds or removes it and the list stays open." },
    { keys: "Esc", does: "Closes the list; with it closed, clears what's typed." },
    { keys: "Backspace", does: "In multiple mode with the field empty: the first press marks the last chip, the second removes it." },
    { keys: "Tab", does: "Closes the list and moves on, leaving the choice as it was." },
  ],
  a11y: [
    "The field is an input with role combobox, aria-autocomplete list and aria-expanded; focus stays in it while the arrows move through the list, which it points at with aria-activedescendant.",
    "The list is a listbox of options with aria-selected (aria-multiselectable in multiple mode); groups are named groups. The searching and nothing-matches rows are status messages.",
    "Each chip's cross is a button named Remove and the chip's label. The crosses aren't Tab stops; Backspace reaches them from the keyboard.",
    "Name it with Field, a <label htmlFor> on its id, aria-labelledby, or label. The placeholder isn't a name.",
    "The card opens in a layer over the page, in the field's own light or dark; with reduced motion it fades rather than slides.",
  ],
};
