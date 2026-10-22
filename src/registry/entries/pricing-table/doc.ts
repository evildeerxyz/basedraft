import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  PricingTable,
  type PricingPlan,
} from "@/components/basedraft/pricing-table";

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: { monthly: 0, yearly: 0 },
    features: ["3 projects", "Community help"],
    cta: { label: "Start free", href: "/signup" },
  },
  {
    id: "team",
    name: "Team",
    price: { monthly: 18, yearly: 15 },
    seats: { min: 2, default: 3 },
    recommended: true,
    badge: "Most picked",
    features: ["Unlimited projects", "Shared libraries", "Priority help"],
    cta: { label: "Start a trial", onClick: (choice) => checkout(choice) },
  },
  {
    id: "business",
    name: "Business",
    priceLabel: "Let's talk",
    features: ["SSO and audit logs", "A named contact"],
    cta: { label: "Talk to us", href: "/contact" },
  },
];

export function Pricing() {
  return <PricingTable plans={plans} />;
}`,
  use: [
    "For a pricing page or section: plans side by side, a switch between monthly and yearly, and a comparison under them.",
    "Prices are a month's, in both periods; the saving is worked out from them and tagged on Yearly.",
    "A plan with seats gets a stepper, and its total follows the count. Its action is handed the plan, period, seats and total.",
  ],
  avoid: [
    "For choosing one option in a form: use RadioGroup, or Segmented.",
    "For one plan's details on its own: a card of your own reads better than a table of one.",
  ],
  parts: [
    {
      name: "PricingTable",
      note: "The switch, the plans and the comparison. Side by side from about 768px; below that the plans are a row you swipe, landing on the recommended one.",
      props: [
        { name: "plans", type: "PricingPlan[]", note: "The plans, in order.", required: true },
        { name: "period / defaultPeriod", type: '"monthly" | "yearly"', default: '"yearly"', note: "Which prices show, kept by you or by the table." },
        { name: "onPeriodChange", type: "(period) => void", note: "Hears the switch." },
        { name: "currency", type: "string", default: '"USD"', note: "Any currency code Intl knows." },
        { name: "locale", type: "string", default: '"en-US"', note: "How amounts are written." },
        { name: "compare", type: "PricingCompareGroup[]", note: "Every feature, plan by plan, in groups. Opens under the plans, its plan names held at the top as you scroll." },
        { name: "defaultCompareOpen", type: "boolean", default: "false", note: "Whether the comparison starts open." },
        { name: "stickyTop", type: "number", default: "0", note: "Where the comparison's plan names stick, from the top of the window: your header's height." },
        { name: "label", type: "string", default: '"Pricing"', note: "What this pricing is, for screen readers." },
      ],
    },
    {
      name: "PricingPlan",
      note: "One plan's card.",
      props: [
        { name: "id", type: "string", note: "Unique, and the key its comparison values use.", required: true },
        { name: "name", type: "ReactNode", note: "The plan's name.", required: true },
        { name: "cta", type: "{ label, href?, onClick?(choice) }", note: "The plan's one action: a link, or a button handed what was chosen.", required: true },
        { name: "description", type: "ReactNode", note: "Who it's for, in a line." },
        { name: "price", type: "{ monthly: number; yearly: number }", note: "A month's price in each period. Leave it out for a plan you price by talking." },
        { name: "priceLabel", type: "ReactNode", note: "Shown in the price's place without one: \"Let's talk\"." },
        { name: "seats", type: "{ min?, max?, default? }", note: "Priced per seat: the price is one seat's, and a stepper sets the count." },
        { name: "features", type: "PricingFeature[]", note: "Words, or { label, included: false, note } for what it doesn't have." },
        { name: "recommended", type: "boolean", note: "The plan you'd pick: lit by the hero's light and fine dots, its action in metal. One at most." },
        { name: "badge", type: "ReactNode", note: "A word on the recommended plan: \"Most picked\"." },
      ],
    },
    {
      name: "PricingCompareGroup",
      note: "A group of rows in the comparison.",
      props: [
        { name: "label", type: "ReactNode", note: "The group's heading.", required: true },
        { name: "rows", type: "{ label, note?, values }[]", note: "values is by plan id: true for a tick, false for a dash, or words.", required: true },
      ],
    },
  ],
  examples: [
    { id: "compare", title: "With a comparison", note: "Every feature by plan, open from the start.", code: `<PricingTable
  plans={plans}
  compare={groups}
  defaultCompareOpen
  stickyTop={64}
/>` },
    { id: "monthly", title: "Starting on monthly, in euros", note: "The period and the currency are yours to set.", code: `<PricingTable
  plans={plans}
  defaultPeriod="monthly"
  currency="EUR"
  locale="de-DE"
/>` },
  ],
  keyboard: [
    { keys: "Left / Right", does: "Switches between monthly and yearly, or between plans in the comparison on a phone." },
    { keys: "Up / Down", does: "Adds or takes away a seat. Page Up and Page Down move by five." },
    { keys: "Home / End", does: "Sets the fewest or the most seats." },
    { keys: "Enter / Space", does: "Opens or closes the comparison, or presses a plan's action." },
  ],
  a11y: [
    "The period switch is a radio group; each plan is an article named for the plan.",
    "Rolling prices are read once, as the whole amount, not digit by digit.",
    "The seat stepper is a spinbutton that says \"3 seats\"; its plus and minus are for the pointer, the arrows do the same.",
    "Ticks and dashes in the comparison are read as Included and Not included.",
  ],
};
