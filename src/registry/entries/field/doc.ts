import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Field, Input } from "@basedraft/ui";

export function SiteName() {
  const [name, setName] = useState("");
  return (
    <Field
      label="Site name"
      hint="Shown in the browser tab."
      error={name ? undefined : "Give the site a name."}
      count={name.length}
      max={40}
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} />
    </Field>
  );
}`,
  use: [
    "Around any control in a form that needs a visible label, and a hint or an error under it.",
    "To show what's wrong right where it's wrong: the error takes the hint's place and rims the control in red.",
    "With count and max, for anything with a limit people should see coming.",
  ],
  avoid: [
    "For a checkbox or a radio: their rows carry their own label and description.",
    "For a search box in a toolbar that the icon already explains: an Input with an aria-label is enough.",
  ],
  parts: [
    {
      name: "Field",
      note: "Wraps one control and wires it: the label points at it, and the hint or error describes it.",
      props: [
        { name: "label", type: "ReactNode", required: true, note: "Above the control, pointing at it, so clicking it focuses the control." },
        { name: "hint", type: "ReactNode", note: "A line under the control: what to put in it, or what it's for." },
        { name: "error", type: "ReactNode", note: "What's wrong. Takes the hint's place, rises in, and marks the control aria-invalid so it rims in red." },
        { name: "required", type: "boolean", default: "false", note: "Sets aria-required on the control and a quiet mark by the label. Add required to the input too for the browser's own check." },
        { name: "optional", type: "boolean", default: "false", note: "Says Optional across from the label." },
        { name: "count", type: "number", note: "How much is in the control. With max, shows count / max on the right." },
        { name: "max", type: "number", note: "The limit count is measured against. Turns amber near it and red past it." },
        { name: "id", type: "string", note: "The control's id. Otherwise the control's own id is kept, or one is made." },
        { name: "className", type: "string", note: "Goes on the field, to size it." },
        { name: "children", type: "ReactElement", required: true, note: "One control: Input, Textarea, Select, Code input, or a native input. It gets id, aria-describedby, aria-invalid and aria-required." },
      ],
    },
  ],
  examples: [
    {
      id: "hint",
      title: "With a hint",
      code: `<Field
  label="Site name"
  hint="Shown in the browser tab and when a link is shared."
  className="max-w-[320px]"
>
  <Input defaultValue="Zuno" />
</Field>`,
    },
    {
      id: "error",
      title: "With an error",
      note: "The error is read with the field, and the control rims in red.",
      code: `<Field
  label="Email"
  error="Add the part after the dot, like .co"
  className="max-w-[320px]"
>
  <Input type="email" defaultValue="maya@fieldwork" />
</Field>`,
    },
    {
      id: "required",
      title: "Required and optional",
      note: "Mark whichever is rarer in the form; here, the optional one says so.",
      code: `<div className="grid w-full max-w-[320px] gap-4">
  <Field label="Your name" required>
    <Input defaultValue="Maya Okafor" autoComplete="name" />
  </Field>
  <Field label="Company" optional>
    <Input placeholder="Fieldwork" autoComplete="organization" />
  </Field>
</div>`,
    },
    {
      id: "count",
      title: "Counting toward a limit",
      note: "The count turns amber near the limit and red past it.",
      code: `function Brief() {
  const [text, setText] = useState("Make the hero about tax-loss harvesting.");
  return (
    <Field
      label="Tell Claude Code what to change"
      count={text.length}
      max={160}
      error={text.length > 160 ? "Keep it to 160 characters." : undefined}
      className="max-w-[360px]"
    >
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
    </Field>
  );
}`,
    },
    {
      id: "select",
      title: "Around a Select",
      note: "Any control works: the label opens the Select when clicked.",
      code: `<Field
  label="Framework"
  hint="Change it later from your Purchases page."
  className="max-w-[300px]"
>
  <Select
    defaultValue="next"
    options={[
      { value: "next", label: "Next.js 16" },
      { value: "astro", label: "Astro 7" },
    ]}
  />
</Field>`,
    },
  ],
  keyboard: [{ keys: "Tab", does: "Field adds no stops of its own; focus goes straight to the control inside it." }],
  a11y: [
    "The label is a <label> pointing at the control's id, so it names the control and clicking it focuses it.",
    "The hint, or the error in its place, is linked with aria-describedby, so it's read after the name; any aria-describedby already on the control is kept.",
    "An error sets aria-invalid on the control. It's announced politely as it appears, without taking focus.",
    "required sets aria-required; the mark by the label is hidden from screen readers, so it isn't read twice.",
  ],
};
