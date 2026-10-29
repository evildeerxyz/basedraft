import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `// app/layout.tsx
import { Consent } from "@basedraft/ui";

<Consent
  categories={[
    { id: "necessary", label: "Necessary", required: true },
    { id: "analytics", label: "Analytics", description: "Which pages are read." },
  ]}
  policyHref="/privacy"
  onSave={(choices) => choices.analytics && startAnalytics()}
/>

// Anywhere else, before loading a script:
import { readConsent, openConsent } from "@basedraft/ui";
if (readConsent()?.choices.analytics) startAnalytics();
<button onClick={() => openConsent()}>Cookie settings</button>`,
  use: [
    "Once, in the root layout, on a site that sets cookies it doesn't strictly need: analytics, ads, embeds.",
    "Load those scripts only after readConsent() or onSave says yes, never before the choice.",
    "Link Cookie settings in the footer to openConsent(), so the choice can be changed later.",
  ],
  avoid: [
    "When the site only sets the cookies it needs to work: you don't need to ask.",
    "For terms people must accept before going on: use Dialog.",
    "For a message across the top of the site: use Banner.",
  ],
  parts: [
    {
      name: "Consent",
      note: "The card, shown until it's answered.",
      props: [
        { name: "categories", type: "{ id, label, description?, required? }[]", note: "The kinds of cookie. required ones are always on.", required: true },
        { name: "onSave", type: "(choices: Record<string, boolean>) => void", note: "Runs with each kind's choice when the card is answered." },
        { name: "storageKey", type: "string", default: '"consent"', note: "Where the choice is kept in this browser." },
        { name: "position", type: '"bottom-left" | "bottom-right" | "inline"', default: '"bottom-left"', note: "A corner of the page, or in place." },
        { name: "title", type: "ReactNode", default: '"We use cookies"', note: "The card's heading." },
        { name: "description", type: "ReactNode", note: "A line on why." },
        { name: "policyHref", type: "string", note: "Links the privacy policy from the card." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link." },
      ],
    },
    { name: "readConsent", note: "readConsent(storageKey?) returns { choices, at } once answered, or null.", props: [] },
    { name: "openConsent", note: "openConsent(storageKey?) shows the card again, with the choices as they were.", props: [] },
  ],
  examples: [
    { id: "short", title: "Two kinds", note: "A shorter card for a site with only analytics.", code: `<Consent title="Cookies, briefly" description="Only to count visits. Nothing is sold." categories={[necessary, analytics]} />` },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves through the policy link, Customize, Reject all and Accept all, and each switch once open." },
    { keys: "Enter Space", does: "Presses a button, or flips a switch." },
  ],
  a11y: [
    "A dialog named by its title and described by its line; it doesn't take focus or block the page.",
    "Reject all and Accept all are the same size, color and weight, so neither is pushed.",
    "Each kind's switch is a switch named by the kind; a required one says Always on and can't be turned off.",
  ],
};
