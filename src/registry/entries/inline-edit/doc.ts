import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { InlineEdit } from "@basedraft/ui";

export function ProjectName({ project }: { project: Project }) {
  return (
    <h1 className="text-2xl font-semibold">
      <InlineEdit
        label="Project name"
        value={project.name}
        validate={(next) => (next ? null : "Give it a name.")}
        onSave={(next) => renameProject(project.id, next)}
      />
    </h1>
  );
}`,
  use: [
    "For renaming something where its name is shown: a project, a page, a section, a file.",
    "When the edit is small and you'd rather not open a dialog or a settings page for it.",
  ],
  avoid: [
    "For a field in a form that's always editable: use Input inside a Field.",
    "For longer text: use Textarea.",
    "For anything that needs several fields at once: use Dialog with a form.",
  ],
  parts: [
    {
      name: "InlineEdit",
      note: "Text that turns into a field of the same size and type. Put it inside the element whose type it should take.",
      props: [
        { name: "value", type: "string", note: "The saved text. It doesn't change while editing; update it once onSave succeeds.", required: true },
        { name: "onSave", type: "(next: string) => void | Promise<void>", note: "Called with the trimmed text when it's changed. A promise shows it saving; throwing or rejecting keeps the field open and shows the error's message.", required: true },
        { name: "label", type: "string", note: "What the text is, for the field's name and screen readers.", required: true },
        { name: "placeholder", type: "string", default: '"Untitled"', note: "Shown when there's no text." },
        { name: "validate", type: "(next: string) => string | null | undefined", note: "A reason it can't be saved, checked before onSave; nothing means it can." },
        { name: "onBlur", type: '"save" | "cancel"', default: '"save"', note: "What clicking or tabbing away does." },
        { name: "maxLength", type: "number", note: "The most characters it takes." },
        { name: "className", type: "string", note: "Added to its box, for color or weight; size and font come from where it sits." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "In a sentence",
      note: "It takes the type of what's around it, and grows with the text without moving the words after it until it must.",
      code: `<p>
  Rename{" "}
  <InlineEdit
    label="Site name"
    value={name}
    onSave={setName}
    className="font-medium"
  />{" "}
  before you share it.
</p>`,
    },
    {
      id: "refused",
      title: "When the save is refused",
      note: "Throw from onSave and the field shakes once, keeps what was typed and says why.",
      code: `<InlineEdit
  label="Project name"
  value={name}
  onSave={async (next) => {
    await saveName(next);
    if (next.toLowerCase() === "zuno")
      throw new Error("A project called Zuno already exists.");
    setName(next);
  }}
/>`,
    },
    {
      id: "required",
      title: "Checked before saving",
      note: "validate stops a save on the spot, with no request at all.",
      code: `<InlineEdit
  label="Section name"
  value={name}
  onSave={setName}
  validate={(next) => (next.length < 2 ? "At least two letters." : null)}
/>`,
    },
    {
      id: "cancel",
      title: "Leaving it cancels",
      note: 'With onBlur="cancel", only Enter saves; clicking away puts the text back.',
      code: `<InlineEdit label="Draft name" value={name} onSave={setName} onBlur="cancel" />`,
    },
  ],
  keyboard: [
    { keys: "Enter / Space", does: "On the text, turns it into a field with the text selected." },
    { keys: "F2", does: "On the text, the same, as in a file list." },
    { keys: "Enter", does: "In the field, saves." },
    { keys: "Escape", does: "In the field, puts the text back and leaves it." },
    { keys: "Tab", does: "In the field, saves (or cancels, with onBlur=\"cancel\") and moves on." },
  ],
  a11y: [
    'The text is a button named "Project name, Zuno launch. Edit", so it says what it is, what it holds, and that it can be changed.',
    "The field is named by label, marked aria-invalid with its error linked by aria-describedby, and aria-busy while saving.",
    'Errors are role="alert"; a polite live region says "Saving" and then "Saved".',
    "After Enter or Escape, focus goes back to the text, so you can carry on from where you were.",
    "The pencil, the dots and the check sit outside the text's box and are hidden from screen readers; nothing around the text moves when it changes state.",
  ],
};
