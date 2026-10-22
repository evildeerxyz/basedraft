import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { TagInput } from "@basedraft/ui";

export function Keywords() {
  return (
    <TagInput
      label="Keywords"
      placeholder="Add a keyword"
      defaultValue={["fintech", "dark"]}
      transform={(t) => t.toLowerCase()}
      onValueChange={(tags) => console.log(tags)}
    />
  );
}`,
  use: [
    "For a handful of free words with no list behind them: keywords, emails to invite, page paths, labels.",
    "When people often have a list ready to paste: it splits on commas, new lines, tabs and semicolons.",
    "When each word needs checking, and fixing one in place is easier than starting again.",
  ],
  avoid: [
    "When the words have to come from a known list: use Combobox with multiple, so only real choices go in.",
    "For one value: use Input.",
    "For a long text: use Textarea.",
  ],
  props: [
    { name: "value", type: "string[]", note: "Controlled: the tags." },
    { name: "defaultValue", type: "string[]", default: "[]", note: "Where it starts, uncontrolled." },
    { name: "onValueChange", type: "(tags: string[]) => void", note: "Called with the whole new list whenever a tag goes in, comes out or is edited." },
    { name: "validate", type: "(tag: string) => string | null | undefined", note: "Checks each tag. Return a reason and the tag stays, rimmed in red with the reason, until it's fixed or removed; the field reads as invalid meanwhile." },
    { name: "max", type: "number", note: "The most tags it takes. Past it, typing or pasting shakes the field and says so." },
    { name: "separators", type: "string[]", default: '[","]', note: "Keys that end a tag, besides Enter. A pasted list splits on these, on new lines, tabs and semicolons too." },
    { name: "transform", type: "(tag: string) => string", note: "Tidies each tag as it goes in or is edited, for example to lowercase. Tags are always trimmed." },
    { name: "allowDuplicates", type: "boolean", default: "false", note: "Lets the same tag in twice. Otherwise a repeat is refused and the field shakes." },
    { name: "placeholder", type: "string", default: '"Add a tag"', note: "Shown while there are no tags." },
    { name: "label", type: "string", note: "Names it for screen readers when no Field or visible label does. Or use aria-labelledby." },
    { name: "size", type: '"sm" | "md"', default: '"md"', note: "36 or 44px tall before tags wrap." },
    { name: "disabled", type: "boolean", default: "false", note: "Faded and still." },
    { name: "name", type: "string", note: "With a name, hidden inputs carry each tag in a form." },
    { name: "id", type: "string", note: "Goes on the text field, so a <label htmlFor> can point at it. Field sets it for you." },
    { name: "aria-invalid", type: "boolean", note: "Rims it in red. Field sets it when it has an error." },
    { name: "className", type: "string", note: "Goes on the outer box, to size it." },
  ],
  examples: [
    {
      id: "keywords",
      title: "Keywords, lowercased",
      note: "transform tidies each one as it goes in.",
      code: `<TagInput
  label="Keywords"
  placeholder="Add a keyword"
  defaultValue={["fintech", "dark", "dithered"]}
  transform={(t) => t.toLowerCase()}
  className="max-w-[360px]"
/>`,
    },
    {
      id: "emails",
      title: "Checked as they go in",
      note: "A tag the check refuses stays, in red with the reason. Double-click it, or press Enter on it, to fix it in place.",
      code: `const email = (t: string) =>
  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(t) ? null : "not an email address";

<TagInput
  label="Invite"
  placeholder="Add an email, then Enter"
  defaultValue={["maya@fieldwork.co", "sami@fieldwork"]}
  validate={email}
  max={10}
  className="max-w-[360px]"
/>`,
    },
    {
      id: "limit",
      title: "A limit",
      note: "At three, the field shakes and says that's the most.",
      code: `<TagInput
  label="Accent colors"
  placeholder="Up to three"
  defaultValue={["lime", "ink"]}
  max={3}
  className="max-w-[320px]"
/>`,
    },
    {
      id: "separators",
      title: "Space ends a tag too",
      note: "For words without spaces, like page paths: a space or a comma finishes each.",
      code: `<TagInput
  label="Pages"
  placeholder="Type, then space or comma"
  defaultValue={["home", "pricing"]}
  separators={[",", " "]}
  transform={(t) => t.toLowerCase().replace(/^\\/+/, "")}
  className="max-w-[340px]"
/>`,
    },
    {
      id: "small",
      title: "Small",
      code: `<TagInput
  size="sm"
  label="Labels"
  defaultValue={["launch", "q4"]}
  className="max-w-[280px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Enter / Comma", does: "In the field: adds what's typed as a tag. Any other separators you set do the same." },
    { keys: "Backspace", does: "In an empty field: puts focus on the last tag. On a tag: removes it and moves to the one before." },
    { keys: "Delete", does: "On a tag: removes it and moves to the one after." },
    { keys: "← →", does: "Moves between tags; ← from the start of the field reaches the last tag, → past the last tag returns to the field." },
    { keys: "Home / End", does: "On a tag: the first tag, or back to the field." },
    { keys: "Enter / F2", does: "On a tag: edits it in place. Enter keeps the change, Esc drops it, and an emptied tag is removed." },
    { keys: "Esc", does: "In the field: clears what's typed. On a tag: back to the field." },
  ],
  a11y: [
    "The text field is the one Tab stop; tags are reached with the arrow keys, each a button named for its text, its problem if it has one, and what Enter and Backspace do.",
    "Each tag's cross is a button named Remove and the tag. Edits happen in a small input named Edit and the tag.",
    "Why something didn't go in (a repeat, the limit) and the first tag with a problem are read out from a status line tied to the field with aria-describedby; the field is marked invalid while any tag has a problem.",
    "With reduced motion, tags fade rather than spring, and the field doesn't shake.",
  ],
};
