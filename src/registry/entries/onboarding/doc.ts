import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  OnboardingChecklist,
  type OnboardingStep,
} from "@/components/basedraft/onboarding";

const steps: OnboardingStep[] = [
  {
    id: "site",
    title: "Make your first site",
    meta: "2 min",
    description: "Start from a template, or a blank page.",
    action: { label: "Choose a template", href: "/templates" },
  },
  {
    id: "domain",
    title: "Connect a domain",
    description: "Point your own address at it.",
    action: {
      label: "Add a domain",
      href: "/settings/domains",
      completes: false,
    },
  },
  {
    id: "invite",
    title: "Invite your team",
    action: { label: "Invite people", onClick: openInvite },
  },
];

export function Setup({ done }: { done: string[] }) {
  return (
    <OnboardingChecklist
      steps={steps}
      done={done}
      onDoneChange={save}
      onDismiss={hideForGood}
    />
  );
}`,
  use: [
    "For the few things a new account should do first, kept in view until they're done.",
    "It floats in a corner and folds into a pill with the count, or sits in the page with placement=\"inline\".",
    "A step's action ticks it when pressed. Set completes: false and pass done when your app should tick it, once it's really done.",
  ],
  avoid: [
    "For a task someone must finish in one go, like signing up: use Wizard.",
    "For a tour that points at parts of the page: a popover on each part reads better than a list.",
  ],
  parts: [
    {
      name: "OnboardingChecklist",
      note: "The card: a ring that fills, the steps, and a finish that blooms. The next step opens on its own when one is ticked.",
      props: [
        { name: "steps", type: "OnboardingStep[]", note: "What to do, in order.", required: true },
        { name: "title", type: "ReactNode", default: '"Get started"', note: "The card's heading." },
        { name: "description", type: "ReactNode", note: "A line under it." },
        { name: "done / defaultDone", type: "string[]", default: "[]", note: "The ids of the steps that are done, kept by you or by the checklist." },
        { name: "onDoneChange", type: "(done) => void", note: "Hears a step ticked or unticked: save it to the account." },
        { name: "collapsed / defaultCollapsed", type: "boolean", default: "false", note: "Folded into the pill." },
        { name: "onCollapsedChange", type: "(collapsed) => void", note: "Hears it fold and open." },
        { name: "onDismiss", type: "() => void", note: "Called once the card has gone, after its close button." },
        { name: "dismissible", type: "boolean", default: "true", note: "Shows the close button." },
        { name: "finished", type: "{ title?, description?, action? }", note: "What it says when everything's done." },
        { name: "placement", type: '"corner" | "inline"', default: '"corner"', note: "Floating in a corner, or in the page where you put it." },
        { name: "corner", type: '"bottom-right" | "bottom-left"', default: '"bottom-right"', note: "Which corner it floats in." },
        { name: "contained", type: "boolean", default: "false", note: "In the corner of the element around it (make it relative) rather than the window's." },
        { name: "pillLabel", type: "string", default: '"Setup"', note: "The folded pill's word." },
      ],
    },
    {
      name: "OnboardingStep",
      note: "One thing to do.",
      props: [
        { name: "id", type: "string", note: "Unique, and what done holds.", required: true },
        { name: "title", type: "string", note: "What to do, short.", required: true },
        { name: "description", type: "ReactNode", note: "Why, or how, shown when the step is open." },
        { name: "meta", type: "string", note: "A short note at the end of the row: \"2 min\"." },
        { name: "action", type: "{ label, href?, onClick?, completes? }", note: "The button that does it. completes: false leaves the ticking to you." },
      ],
    },
  ],
  examples: [
    { id: "inline", title: "In the page", note: "Inline, on a dashboard's home, two steps already done.", code: `<OnboardingChecklist
  steps={steps}
  placement="inline"
  defaultDone={["site", "template"]}
/>` },
    { id: "finished", title: "All done", note: "With what to do next once everything's ticked.", code: `<OnboardingChecklist
  steps={steps}
  placement="inline"
  defaultDone={steps.map((s) => s.id)}
  finished={{
    title: "Your studio is ready",
    action: { label: "Open the dashboard", href: "/" },
  }}
/>` },
  ],
  keyboard: [
    { keys: "Up / Down", does: "Moves between the steps." },
    { keys: "Home / End", does: "Goes to the first or last step." },
    { keys: "Enter / Space", does: "Opens a step, ticks it from its circle, or presses its action." },
    { keys: "Esc", does: "Folds the floating card into its pill." },
  ],
  a11y: [
    "Each step's circle is a checkbox named for the step; each row opens its own region.",
    "The ring is a progressbar that says \"2 of 5 done\", and the pill says the same.",
    "Ticking a step is announced, and so is finishing.",
  ],
};
