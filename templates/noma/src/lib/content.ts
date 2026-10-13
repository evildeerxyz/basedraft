/**
 * Marketing copy and mock company data for the Noma site. Everything is
 * fictional (customers, investors, people) and lives here so pages stay lean.
 * House style: short, specific, benefit-led. No em dashes.
 */

/** Where "Start free" and "Sign in" go. Set NEXT_PUBLIC_APP_URL to your app; without it they open the demo page. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "/contact";

export const FUNDING = {
  round: "Series B",
  amount: "$48M",
  lead: "Northwind Ventures",
  date: "October 7, 2026",
  total: "$73.5M",
  rounds: [
    { label: "Pre-seed", amount: 1.5, year: "2023", lead: "Field Fund" },
    { label: "Seed", amount: 6, year: "2024", lead: "Orbit Partners" },
    { label: "Series A", amount: 18, year: "2025", lead: "Lumen Capital" },
    { label: "Series B", amount: 48, year: "2026", lead: "Northwind Ventures" },
  ],
};

export const INVESTORS = [
  { name: "Northwind Ventures", role: "Lead · Series B" },
  { name: "Lumen Capital", role: "Lead · Series A" },
  { name: "Orbit Partners", role: "Lead · Seed" },
  { name: "Field Fund", role: "Pre-seed" },
  { name: "Halcyon Angels", role: "Syndicate" },
  { name: "Lattice Collective", role: "Strategic" },
];

export const METRICS = [
  { value: 2400, suffix: "+", label: "data teams on Noma" },
  { value: 4.2, suffix: "M", decimals: 1, label: "questions answered every month" },
  { value: 12, suffix: "B", label: "rows read safely every week" },
  { value: 840, suffix: "ms", label: "median time to an answer" },
];

export const LOGOS = ["Northbeam", "Ledgerly", "Parcelworks", "Quanta", "Helio", "Mosaic", "Arcadia", "Fernway", "Brightline", "Kiln"];

export type Testimonial = { quote: string; name: string; role: string; company: string; color: string };

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Our ops team stopped filing SQL tickets. They ask Noma, review the query and ship the answer the same afternoon.",
    name: "Priya Raman",
    role: "Head of Data",
    company: "Ledgerly",
    color: "#2F7F7A",
  },
  {
    quote: "The approval gate sold our security team in one meeting. Nothing touches production until a human reads the SQL.",
    name: "Marcus Hale",
    role: "VP Engineering",
    company: "Parcelworks",
    color: "#B0563A",
  },
  {
    quote: "We retired three dashboards and a backlog of 140 analytics requests in month one. It feels like cheating.",
    name: "Sofia Lindqvist",
    role: "COO",
    company: "Northbeam",
    color: "#7A5FD0",
  },
  {
    quote: "Noma reads our schema better than most new hires. The SQL it writes is cleaner than ours was.",
    name: "Daniel Okafor",
    role: "Staff Engineer",
    company: "Quanta",
    color: "#7A7A2E",
  },
  {
    quote: "‘Which customers churned after the price change?’ used to take a week. Now it takes a sentence.",
    name: "Hannah Brooks",
    role: "Product Lead",
    company: "Mosaic",
    color: "#F762F4",
  },
];

export const CASE_STUDIES = [
  {
    company: "Ledgerly",
    industry: "Fintech",
    metric: "78%",
    metricLabel: "smaller analytics backlog",
    summary: "How a 40-person finance team made every ledger question self-serve.",
    color: "#2F7F7A",
  },
  {
    company: "Parcelworks",
    industry: "Commerce",
    metric: "6×",
    metricLabel: "faster incident triage",
    summary: "Support engineers query live shipment data in plain English, mid-incident.",
    color: "#B0563A",
  },
  {
    company: "Northbeam",
    industry: "SaaS",
    metric: "140",
    metricLabel: "tickets closed in month one",
    summary: "Three internal dashboards replaced by a single question box.",
    color: "#7A5FD0",
  },
  {
    company: "Helio",
    industry: "Health",
    metric: "0",
    metricLabel: "unreviewed writes to prod",
    summary: "HIPAA-ready analytics, with every write signed off by clinical ops.",
    color: "#00A1FF",
  },
  {
    company: "Quanta",
    industry: "Fintech",
    metric: "92%",
    metricLabel: "of SQL drafted by Noma",
    summary: "Engineers review instead of write, and ship reports in minutes.",
    color: "#7A7A2E",
  },
  {
    company: "Mosaic",
    industry: "Commerce",
    metric: "3 min",
    metricLabel: "median time to insight",
    summary: "Merchandisers answer pricing questions without waiting on the data team.",
    color: "#F762F4",
  },
];

export const INDUSTRIES = ["All", "Fintech", "Commerce", "SaaS", "Health"] as const;

export type Plan = {
  name: string;
  monthly: number | null;
  yearly: number | null;
  unit: string;
  blurb: string;
  cta: string;
  featured?: boolean;
  blocks: number;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 0,
    yearly: 0,
    unit: "free forever",
    blurb: "For side projects and curious teams.",
    cta: "Start free",
    blocks: 1,
    features: ["1 database connection", "500 questions a month", "Ask Data and Tables", "Community support"],
  },
  {
    name: "Team",
    monthly: 29,
    yearly: 24,
    unit: "per seat / month",
    blurb: "For data teams shipping answers daily.",
    cta: "Start 14-day trial",
    featured: true,
    blocks: 3,
    features: ["Unlimited connections", "Unlimited questions", "Approval workflows", "Query history and sharing", "SSO with Google and Okta"],
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    unit: "custom contract",
    blurb: "For regulated teams at scale.",
    cta: "Talk to sales",
    blocks: 5,
    features: ["Self-host or VPC deploy", "SOC 2 Type II and HIPAA", "Audit log export", "Custom model routing", "Dedicated success team"],
  },
];

export const COMPARISON: { group: string; rows: { label: string; values: (boolean | string)[] }[] }[] = [
  {
    group: "Core",
    rows: [
      { label: "Ask Data: plain English to SQL", values: [true, true, true] },
      { label: "Tables editor", values: [true, true, true] },
      { label: "Database connections", values: ["1", "Unlimited", "Unlimited"] },
      { label: "Questions per month", values: ["500", "Unlimited", "Unlimited"] },
    ],
  },
  {
    group: "Collaboration",
    rows: [
      { label: "Approval workflows", values: [false, true, true] },
      { label: "Shared query library", values: [false, true, true] },
      { label: "Roles and permissions", values: ["Basic", "Advanced", "Custom"] },
    ],
  },
  {
    group: "Security",
    rows: [
      { label: "Single sign-on", values: [false, true, true] },
      { label: "Audit log", values: ["7 days", "90 days", "Unlimited"] },
      { label: "Self-host or VPC", values: [false, false, true] },
    ],
  },
];

export const FAQS = [
  {
    q: "Will Noma ever change my data without asking?",
    a: "Never. Noma drafts the SQL and a person approves it. Anything that writes, from INSERT to DDL, is wrapped in a transaction and blocked until someone with permission confirms it.",
  },
  {
    q: "Which databases do you support?",
    a: "Any Postgres 12 or newer, including Supabase, Neon, Amazon RDS, Aurora and Cloud SQL. MySQL and Snowflake are in private beta.",
  },
  {
    q: "Is my data used to train models?",
    a: "No. Noma reads your schema and column statistics to write SQL. Row data stays in your database, and results are never kept for training.",
  },
  {
    q: "Can we self-host?",
    a: "Yes. Enterprise customers can run Noma inside their own VPC or on-prem, with every feature of the cloud product.",
  },
  {
    q: "How does seat pricing work?",
    a: "You pay for people who ask questions or approve queries. Viewers who only open shared answers are always free.",
  },
];

export const CHANGELOG = [
  {
    version: "2.6",
    date: "Oct 7, 2026",
    tag: "AI",
    title: "Read-only suggestions now run instantly",
    body: "Follow-up suggestions execute the moment you click when the SQL is read-only. Anything that writes still waits for a human.",
  },
  {
    version: "2.5",
    date: "Sep 23, 2026",
    tag: "Tables",
    title: "Filters that read like sentences",
    body: "Build filters in plain English, like “name contains jam and status is active”, with a live row counter as you type.",
  },
  {
    version: "2.4",
    date: "Sep 9, 2026",
    tag: "AI",
    title: "Inline column references",
    body: "Type / in Ask Data to attach any column. References are highlighted inline and sent to the model as hard context.",
  },
  {
    version: "2.3",
    date: "Aug 26, 2026",
    tag: "Platform",
    title: "Command palette, everywhere",
    body: "Press ⌘K to jump to any page, table or column, or hand a question straight to Nomad AI.",
  },
  {
    version: "2.2",
    date: "Aug 12, 2026",
    tag: "Security",
    title: "Sandboxed query execution",
    body: "Every generated query now runs in an isolated sandbox with statement timeouts and row limits before results reach you.",
  },
  {
    version: "2.1",
    date: "Jul 29, 2026",
    tag: "Tables",
    title: "Charts with character",
    body: "Results render as patterned bar charts with gridlines and share of total. Export to CSV in one click.",
  },
];

export const TEAM = [
  { name: "James Carter", role: "Co-founder, CEO", bio: "Ran analytics for a 400-person fintech. Filed too many SQL tickets." },
  { name: "Emily Johnson", role: "Co-founder, CTO", bio: "Twelve years on Postgres internals and query planners." },
  { name: "Sarah Williams", role: "Head of Design", bio: "Designed admin tools that people actually enjoy opening." },
  { name: "David Brown", role: "Head of AI", bio: "Trains models to say what they are unsure about." },
  { name: "Olivia Martinez", role: "Head of Growth", bio: "Grew two dev tools from zero to their first 1,000 teams." },
  { name: "Noah Wilson", role: "Engineering Lead", bio: "Owns the review gate. Reads every write path twice." },
  { name: "Ava Robinson", role: "Security Lead", bio: "SOC 2, HIPAA and the occasional red team exercise." },
  { name: "Liam Clark", role: "Customer Success", bio: "Has onboarded more databases than anyone on the team." },
];

export const ROLES = [
  { title: "Senior Product Engineer, AI", team: "Engineering", location: "San Francisco · Remote" },
  { title: "Database Internals Engineer", team: "Engineering", location: "Remote (US/EU)" },
  { title: "Product Designer, Data Viz", team: "Design", location: "San Francisco" },
  { title: "Developer Advocate", team: "Growth", location: "Remote" },
  { title: "Enterprise Account Executive", team: "Sales", location: "New York" },
  { title: "Security Engineer", team: "Engineering", location: "Remote (US)" },
];

export const VALUES = [
  { title: "Humans approve", body: "AI drafts, people decide. Every write gets reviewed. It's a principle, not a setting." },
  { title: "Explain everything", body: "Every answer shows its SQL, its sources and its assumptions. No black boxes." },
  { title: "Fast is a feature", body: "A question should feel like a conversation. We obsess over the last 100 milliseconds." },
  { title: "Small, senior, kind", body: "A compact team of builders who write well, review generously and ship often." },
];

/** The six layers between a question and your data, bottom to top. */
export const LAYERS = [
  { id: "postgres", title: "Your Postgres", body: "Any provider, version 12 and up. Your data never leaves your VPC." },
  { id: "pool", title: "Connection pool", body: "Read replicas, statement timeouts and row limits, on by default." },
  { id: "schema", title: "Schema index", body: "Learns your tables, types and column stats. Never a single row." },
  { id: "planner", title: "Query planner", body: "Scopes every question to only the tables and columns it needs." },
  { id: "ai", title: "Noma AI layer", body: "Drafts SQL from plain English and explains every assumption it makes." },
  { id: "gate", title: "Review gate", body: "Reads run instantly. Every write waits for a human to approve it." },
] as const;
