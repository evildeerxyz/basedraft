import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { PasswordField } from "@basedraft/ui";

export function NewPassword() {
  return <PasswordField label="Create a password" name="password" autoComplete="new-password" />;
}`,
  use: [
    "Where someone makes a new password: signing up, resetting, changing it in settings.",
    "Pass rules for your own policy, or rules={false} and meter={false} where they're only signing in.",
    "Give it autoComplete=\"new-password\" for a new one and \"current-password\" for signing in, so password managers help.",
  ],
  avoid: [
    "For a one-time code from an email or an app: use Code input.",
    "For anything that isn't a secret: use Input, so people can see what they typed.",
  ],
  parts: [
    {
      name: "PasswordField",
      note: "A label, the field with its eye, the meter and the rules.",
      props: [
        { name: "label", type: "string", note: "Its name, above it, tied to the field." },
        { name: "rules", type: "{ label: string; test: (value) => boolean }[] | false", default: "four rules", note: "Listed under it, each ticking as it's met: 12 characters, both cases, a number, a symbol. false for none." },
        { name: "meter", type: "boolean", default: "true", note: "Shows how strong it is in four steps, with a word: Weak, Fair, Good, Strong." },
        { name: "value", type: "string", note: "What's typed, when you keep it. Leave it out and the field does." },
        { name: "onChange", type: "(event) => void", note: "Runs as it's typed in, like any input." },
        { name: "...props", type: "input props", note: "Everything an input takes: name, autoComplete, placeholder, required, aria-invalid." },
      ],
    },
  ],
  examples: [
    {
      id: "signin",
      title: "Signing in",
      note: "No meter and no rules: only the eye, and the word when Caps Lock is on.",
      code: `<PasswordField label="Password" autoComplete="current-password" rules={false} meter={false} />`,
    },
    {
      id: "rules",
      title: "Your own rules",
      note: "Any rules, each a label and a test.",
      code: `<PasswordField
  label="New password"
  autoComplete="new-password"
  rules={[
    { label: "16 characters or more", test: (v) => v.length >= 16 },
    { label: "Not your email", test: (v) => !!v && !v.includes("emily@larkspur.co") },
    { label: "No spaces", test: (v) => !!v && !/\\s/.test(v) },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves from the field to its eye." },
    { keys: "Enter Space", does: "On the eye, shows or hides the password." },
  ],
  a11y: [
    "The label is tied to the field, and the field to the strength and the rules, so a screen reader reads them with it.",
    "The eye says whether the password is shown, and it says the strength aloud as it changes.",
    "Each rule says whether it's met, not only with its tick.",
    "The field keeps password managers working: give it autoComplete.",
  ],
};
