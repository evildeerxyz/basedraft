export type Plan = {
  name: string;
  blurb: string;
  price: { monthly: number; yearly: number };
  cta: string;
  href: string;
  unit?: string;
  featured?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    name: "Hobby",
    blurb: "For evenings and weekends.",
    price: { monthly: 0, yearly: 0 },
    cta: "Download free",
    href: "/download",
    features: ["Unlimited on-device Tab", "50 agent runs a month", "Local index up to 500k lines", "Community support"],
  },
  {
    name: "Pro",
    blurb: "For people who ship every day.",
    price: { monthly: 20, yearly: 16 },
    cta: "Start a 14-day trial",
    href: "/download",
    featured: true,
    features: [
      "Everything in Hobby",
      "Unlimited agent runs, fair use",
      "4 background agents in parallel",
      "Frontier models included",
      "Bring your own keys",
    ],
  },
  {
    name: "Team",
    blurb: "For teams that share a codebase.",
    price: { monthly: 40, yearly: 32 },
    cta: "Start a team trial",
    href: "/download",
    unit: "per seat",
    features: [
      "Everything in Pro",
      "Shared indexes and team rules",
      "SSO, SCIM and audit log",
      "Zero retention, enforced org-wide",
      "Priority support",
    ],
  },
];

/** `true` = included, `false` = not included, string = specific value. */
export const COMPARISON: Array<{ group: string; rows: Array<[string, boolean | string, boolean | string, boolean | string]> }> = [
  {
    group: "Editor",
    rows: [
      ["Native GPU renderer", true, true, true],
      ["On-device Tab", "Unlimited", "Unlimited", "Unlimited"],
      ["Local index", "500k lines", "Unlimited", "Unlimited"],
      ["Remote development over SSH", true, true, true],
      ["Multiplayer editing", false, true, true],
    ],
  },
  {
    group: "Agents",
    rows: [
      ["Agent runs", "50 / month", "Unlimited", "Unlimited"],
      ["Background agents in parallel", "1", "4", "8 per seat"],
      ["Hunk-level review", true, true, true],
      ["Team rules", false, false, true],
      ["Shared indexes", false, false, true],
    ],
  },
  {
    group: "Models",
    rows: [
      ["Frontier models included", false, true, true],
      ["Bring your own keys", true, true, true],
      ["Local and self-hosted models", true, true, true],
    ],
  },
  {
    group: "Security and admin",
    rows: [
      ["Zero data retention", true, true, "Enforced"],
      ["SSO and SCIM", false, false, true],
      ["Audit log", false, false, true],
      ["Invoice billing", false, false, true],
    ],
  },
  {
    group: "Support",
    rows: [
      ["Community forum", true, true, true],
      ["Email support", false, true, true],
      ["Priority support with an SLA", false, false, true],
    ],
  },
];

export const FAQ = [
  {
    q: "What counts as an agent run?",
    a: "One request you hand to an agent, from the plan through the final diff. Follow-up questions in the same run are free. Tab completions are never counted: they run on your machine.",
  },
  {
    q: "Is my code used to train models?",
    a: "No. Requests are processed with zero data retention by us and by every model provider we use, and that is written into our contracts. Your index never leaves your machine.",
  },
  {
    q: "Can I use my own API keys or a local model?",
    a: "Yes, on every plan. Add a key or point Auren at any OpenAI-compatible server, including Ollama and llama.cpp. Runs that use your own model do not count toward your limits.",
  },
  {
    q: "What happens when I hit the Hobby limit?",
    a: "Agents pause until the next month or until you upgrade. The editor, Tab and your index keep working exactly as before.",
  },
  {
    q: "Do you offer discounts?",
    a: "Pro is free for students and for maintainers of open-source projects with an active community. Write to us from your university or project address.",
  },
  {
    q: "Can we self-host Auren?",
    a: "Enterprise customers can run the agent gateway inside their own cloud and connect it to their own models. Talk to us about volume pricing.",
  },
];
