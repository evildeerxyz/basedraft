import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Wizard, type WizardStep } from "@/components/basedraft/wizard";
import { Field, Input } from "@basedraft/ui";

type Values = { name: string; email: string };

const steps: WizardStep<Values>[] = [
  {
    id: "you",
    title: "About you",
    render: ({ field, errors }) => (
      <Field label="Your name" error={errors.name}>
        <Input {...field("name")} />
      </Field>
    ),
    validate: (v) => (v.name ? undefined : { name: "Add your name." }),
    summary: (v) => [{ label: "Name", value: v.name }],
  },
];

export function Signup() {
  return (
    <Wizard
      steps={steps}
      initialValues={{ name: "", email: "" }}
      onSubmit={(v) =>
        fetch("/api/signup", { method: "POST", body: JSON.stringify(v) })
      }
    />
  );
}`,
  use: [
    "For a task done in one go that's too long for one screen: signing up, setting up a workspace, a checkout.",
    "Each step renders its own fields from the api it's handed: field(name) for text, choice(name) for a radio group.",
    "validate holds Next until the step is right, and puts the cursor on what's wrong. summary is how the step reads back on the review.",
  ],
  avoid: [
    "For things someone can do in any order, over days: use the Onboarding checklist.",
    "For a short form: one screen of Fields is quicker than three steps.",
  ],
  parts: [
    {
      name: "Wizard",
      note: "The card: a rail that fills, each step sliding in from the side you're heading, a review, and a finish. It eases to each step's height.",
      props: [
        { name: "steps", type: "WizardStep<V>[]", note: "The steps, in order.", required: true },
        { name: "initialValues", type: "V", note: "Every field's starting value, which also gives the values their type.", required: true },
        { name: "onSubmit", type: "(values) => void | Promise", note: "Sent the values at the end. While its promise runs the button pulses; if it throws, its message shows." },
        { name: "review", type: "{ title?, description? } | false", default: "{}", note: "The last step, reading it all back with a way into each part. False leaves it out." },
        { name: "submitLabel", type: "string", default: '"Finish"', note: "The last button's words." },
        { name: "done", type: "{ title?, description?, action?, restart? }", note: "What it says once sent. description can be a function of the values." },
        { name: "onStepChange", type: "(index, id) => void", note: "Hears each move, to keep the step in the address or count drop-off." },
        { name: "label", type: "string", note: "Names the form for screen readers." },
      ],
    },
    {
      name: "WizardStep",
      note: "One step.",
      props: [
        { name: "id", type: "string", note: "Unique in the wizard.", required: true },
        { name: "title", type: "string", note: "The step's name, on the rail and as its heading.", required: true },
        { name: "render", type: "(api) => ReactNode", note: "The step's fields, from the api: values, errors, set, field, choice, next and back.", required: true },
        { name: "description", type: "ReactNode", note: "A line under the heading." },
        { name: "validate", type: "(values) => errors | undefined", note: "What's wrong, by field name. Next waits until it returns nothing." },
        { name: "summary", type: "(values) => { label, value }[]", note: "How the step reads back on the review." },
      ],
    },
  ],
  examples: [
    { id: "no-review", title: "Without a review", note: "Short wizards can send from the last step.", code: `<Wizard
  steps={steps}
  initialValues={initial}
  review={false}
  submitLabel="Create workspace"
/>` },
  ],
  keyboard: [
    { keys: "Enter", does: "Moves to the next step. On a choice, picks it and moves on." },
    { keys: "Tab", does: "Moves through the step's fields, then Back and Next." },
    { keys: "Up / Down", does: "Moves between the options of a choice." },
  ],
  a11y: [
    "It's a form with its own name. The rail is a progressbar that says \"Step 2 of 4: Your site\".",
    "When Next finds something wrong, the message is an alert and the cursor lands on the field.",
    "As each step arrives the cursor goes to its first field, or its heading when it has none; finishing is announced.",
  ],
};
