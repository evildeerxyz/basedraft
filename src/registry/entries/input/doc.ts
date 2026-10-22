import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { GithubLogoIcon } from "@phosphor-icons/react";
import { Input } from "@basedraft/ui";

export function Repository() {
  return (
    <Input
      leading={<GithubLogoIcon weight="duotone" />}
      placeholder="owner/repository"
      aria-label="Repository"
    />
  );
}`,
  use: [
    "For a single line of text: a name, an address, a domain, a search.",
    "Lead it with an icon that says what goes in it, and trail it with a suffix, a hint or a small button.",
  ],
  avoid: [
    "For more than a line: use Textarea.",
    "For a label, a hint and an error together: wrap it in Field.",
    "For a six-digit sign-in code: use Code input.",
    "For a choice from a fixed list: use Select, or Segmented control for two to four options.",
  ],
  parts: [
    {
      name: "Input",
      note: "A pill wrapping a native input, with optional parts before and after it.",
      props: [
        { name: "leading", type: "ReactNode", note: "Before the text, quiet: an icon, usually. Icons size to 16px." },
        { name: "trailing", type: "ReactNode", note: "After the text: a suffix, a hint, or a small button." },
        { name: "aria-invalid", type: "boolean", note: "Rims the pill in red while what's in it won't do." },
        { name: "type", type: "string", default: '"text"', note: "Any input type that's a line of text: email, url, password, search." },
        { name: "className", type: "string", note: "Goes on the pill, not the input, so it sizes and places the whole field." },
        { name: "...props", type: "input props", note: "Everything an input takes: value, onChange, placeholder, name, disabled, ref and the rest, passed to the input itself." },
      ],
    },
  ],
  examples: [
    {
      id: "leading",
      title: "With an icon",
      note: "Pressed into the page while it waits; it lifts to a white face with an ink edge as you type.",
      code: `<Input
  leading={<MagnifyingGlassIcon weight="duotone" />}
  type="search"
  placeholder="Search sections"
  aria-label="Search sections"
  className="max-w-[320px]"
/>`,
    },
    {
      id: "trailing",
      title: "With a suffix",
      note: "The trailing part sits quietly after the text, so the address reads as one.",
      code: `<Input
  leading={<GlobeIcon weight="duotone" />}
  defaultValue="zuno"
  trailing=".basedraft.site"
  aria-label="Subdomain"
  className="max-w-[320px]"
/>`,
    },
    {
      id: "invalid",
      title: "Invalid",
      note: "aria-invalid rims it in red. Say what's wrong right under it.",
      code: `<div className="grid w-full max-w-[320px] gap-1.5">
  <Input
    type="email"
    defaultValue="maya@fieldwork"
    aria-invalid
    aria-describedby="email-error"
    aria-label="Email"
  />
  <p id="email-error" className="px-4 text-xs text-[var(--bd-ui-stop)]">
    Add the part after the dot, like .co
  </p>
</div>`,
    },
    {
      id: "password",
      title: "With a button",
      note: "A small button in the trailing part, here to show the password.",
      code: `function Password() {
  const [shown, setShown] = useState(false);
  return (
    <Input
      type={shown ? "text" : "password"}
      defaultValue="draft-with-care"
      aria-label="Password"
      className="max-w-[320px] pr-1.5"
      trailing={
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide the password" : "Show the password"}
          className="grid size-8 place-items-center rounded-full hover:bg-[var(--bd-surface-2)]"
        >
          {shown ? (
            <EyeSlashIcon weight="duotone" />
          ) : (
            <EyeIcon weight="duotone" />
          )}
        </button>
      }
    />
  );
}`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "Faded, and it can't take focus.",
      code: `<Input
  leading={<LockSimpleIcon weight="duotone" />}
  defaultValue="fieldwork"
  disabled
  aria-label="Team"
  className="max-w-[320px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus into the field, then to any button in its trailing part." },
  ],
  a11y: [
    "A native input, so typing, selecting, autofill and screen readers work as usual.",
    "Give it a visible label, or an aria-label when the icon and placeholder say enough. A placeholder alone isn't a label.",
    "Point aria-describedby at an error or hint line under it, so it's read with the field.",
    "The leading and trailing parts are plain text and icons; a button in the trailing part needs its own aria-label.",
  ],
};
