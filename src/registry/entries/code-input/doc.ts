import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CodeInput } from "@basedraft/ui";

export function SignInCode({ email }: { email: string }) {
  const [wrong, setWrong] = useState(false);
  return (
    <CodeInput
      autoFocus
      label="Sign-in code"
      invalid={wrong}
      onValueChange={() => setWrong(false)}
      onComplete={async (code) => setWrong(!(await verify(email, code)))}
    />
  );
}`,
  use: [
    "For a one-time code sent by email or text: signing in, confirming an address, joining a team.",
    "For a short invite or pairing code that's always the same length.",
    "Check the code in onComplete, the moment the last character is in, without a button to press.",
  ],
  avoid: [
    "For a password, or anything that isn't a fixed length: use Input.",
    "For a long license key people paste rather than type: use Input with a monospace class.",
  ],
  parts: [
    {
      name: "CodeInput",
      note: "One real input over a row of cells, so typing, pasting and a phone's autofill all work as they do in any field.",
      props: [
        { name: "length", type: "number", default: "6", note: "How many characters, a cell each." },
        { name: "value", type: "string", note: "Controlled: what's typed so far." },
        { name: "defaultValue", type: "string", default: '""', note: "Where it starts, uncontrolled." },
        { name: "onValueChange", type: "(code: string) => void", note: "Called with what's typed so far, as it changes." },
        { name: "onComplete", type: "(code: string) => void", note: "Called once every cell is filled, by typing, pasting or autofill." },
        { name: "mode", type: '"numeric" | "alphanumeric"', default: '"numeric"', note: "Digits only, with the number pad on a phone; or letters too, shown in capitals." },
        { name: "split", type: "boolean", note: "A short dash between the two halves. On by default for an even length of 6 or more." },
        { name: "invalid", type: "boolean", default: "false", note: "Rims the cells in red and shakes them once. A Field with an error sets it too." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded and still, as while the code is being checked." },
        { name: "autoFocus", type: "boolean", default: "false", note: "Takes focus when it appears, ready for the first digit." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "44 or 52px tall cells." },
        { name: "label", type: "string", default: '"Code"', note: "Names it for screen readers when no Field or label does." },
        { name: "name", type: "string", note: "The code goes in a form under this name." },
        { name: "id", type: "string", note: "Goes on the input, for a <label htmlFor>. Field sets it." },
        { name: "aria-describedby", type: "string", note: "Points at a hint or error line. Field sets it." },
        { name: "className", type: "string", note: "Goes on the row of cells." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Six digits",
      note: "Type, paste or let the phone fill it from a text message; the cells follow.",
      code: `<CodeInput label="Sign-in code" />`,
    },
    {
      id: "error",
      title: "Wrong code, in a Field",
      note: "Field puts the error under it and marks it invalid, so it rims in red and shakes once.",
      code: `<Field label="Sign-in code" error="That code didn't work. Ask for a new one.">
  <CodeInput defaultValue="482915" />
</Field>`,
    },
    {
      id: "invite",
      title: "Letters and digits",
      note: "For invite codes: letters are shown in capitals, and with split off the cells run on.",
      code: `<CodeInput
  mode="alphanumeric"
  split={false}
  label="Team invite code"
  defaultValue="BD7Q"
/>`,
    },
    {
      id: "small",
      title: "Four, small",
      code: `<div className="grid justify-items-center gap-2.5">
  <p className="text-xs text-[var(--bd-muted)]">
    Enter the 4 digits Studio shows on your other device
  </p>
  <CodeInput size="sm" length={4} label="Pairing code" />
</div>`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "Hold it still while the code is being checked.",
      code: `<CodeInput disabled defaultValue="482916" label="Sign-in code" />`,
    },
  ],
  keyboard: [
    { keys: "0 to 9", does: "Fills the next cell and moves on. In alphanumeric mode, letters too." },
    { keys: "⌫", does: "Clears the last filled cell and moves back to it." },
    { keys: "⌘ V", does: "Pastes a whole code, keeping only the characters it takes, and fills every cell at once." },
    { keys: "Tab", does: "Moves in and out of it in one stop, however many cells." },
  ],
  a11y: [
    "One text input, not a field per cell, so a screen reader hears one field and its value, the code so far.",
    "autocomplete one-time-code lets phones offer the code from a text message, and inputmode numeric brings up the number pad.",
    "The cells are drawn for sight only and hidden from screen readers.",
    "Name it with Field or label; when it's wrong, aria-invalid says so and Field's error is read with it.",
  ],
};
