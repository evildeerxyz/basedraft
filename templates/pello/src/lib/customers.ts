/* The companies on the site, and what they say about pello. All made up, and safe to replace. */

export interface Story {
  slug: string;
  company: string;
  what: string;
  size: number;
  result: string;
  resultLabel: string;
  quote: string;
  name: string;
  role: string;
  /** A longer telling, for the customers page. */
  story: string[];
}

export const STORIES: Story[] = [
  {
    slug: "halden",
    company: "Halden",
    what: "Logistics software",
    size: 600,
    result: "40 hours",
    resultLabel: "a month back for the People team",
    quote: "We used to answer the same leave question forty times a week. Now pello answers it and links the policy, so people trust the answer because they can read it.",
    name: "Rachel Moore",
    role: "Head of People",
    story: [
      "Halden's People team is four people for 600. Before pello, a third of their week went to questions that already had an answer somewhere in the handbook.",
      "They connected the handbook from Notion on a Tuesday and turned on the Slack app the next Monday. Within a month, 74% of questions were answered without anyone on the team stepping in.",
    ],
  },
  {
    slug: "brightwater",
    company: "Brightwater",
    what: "Water infrastructure",
    size: 900,
    result: "1 day",
    resultLabel: "to run payroll, down from four",
    quote: "Payroll across three countries took us four days. Last month it took an afternoon, and most of that was me reading the changes.",
    name: "Sam Whitaker",
    role: "Finance Director",
    story: [
      "Brightwater pays 900 people in the US, the UK and Canada. Every month, hours, expenses and changes came in from four systems and met in one spreadsheet.",
      "Now they come into pello as they happen. At the end of the month, Sam reads a list of what changed and why, approves it, and the payslips go out.",
    ],
  },
  {
    slug: "kestrel",
    company: "Kestrel",
    what: "Aircraft maintenance",
    size: 320,
    result: "100%",
    resultLabel: "of new starters ready on day one",
    quote: "New starters get a laptop, accounts and a buddy before they walk in. I don't chase anyone anymore.",
    name: "Laura Chen",
    role: "People Partner",
    story: [
      "Kestrel hires engineers who need certificates checked, kit ordered and access to hangars before their first shift. Something was always missing.",
      "pello now starts each new hire's list the day the contract is signed, and only asks Laura about the parts that need her.",
    ],
  },
  {
    slug: "arbor-health",
    company: "Arbor Health",
    what: "Clinics",
    size: 1800,
    result: "6 min",
    resultLabel: "to decide on an exception, from an hour",
    quote: "It knows when not to decide. Anything unusual comes to me with the context already written up, so I can decide in minutes.",
    name: "David Park",
    role: "Chief Operating Officer",
    story: [
      "Arbor Health runs 40 clinics, each with its own rota. Time off that breaks a staffing rule can't simply be approved, and it used to sit in someone's inbox for days.",
      "pello approves what fits the rules and sends the rest to the clinic lead, with who else is out, who could cover and what the rule says.",
    ],
  },
  {
    slug: "lumen-freight",
    company: "Lumen Freight",
    what: "Freight and shipping",
    size: 900,
    result: "2 weeks",
    resultLabel: "to go live for 900 people",
    quote: "We rolled it out to 900 people in two weeks. Most of them never opened a new app. They just asked in Slack.",
    name: "Elena Rossi",
    role: "HR Lead",
    story: [
      "Half of Lumen Freight's people work in depots and rarely sit at a desk. A new HR app was the last thing they wanted.",
      "They ask pello in Slack and on Teams from their phones. The People team uses the app, and nobody else had to learn it.",
    ],
  },
  {
    slug: "tandem",
    company: "Tandem",
    what: "Payments",
    size: 140,
    result: "0",
    resultLabel: "people hired just for HR admin",
    quote: "We're 140 people and nobody's job is HR admin. pello is the reason that still works.",
    name: "Marcus Hale",
    role: "Co-founder",
    story: [
      "Tandem grew from 40 to 140 people in a year without a People team, and the founders were doing payroll at night.",
      "pello took the paperwork. Their first People hire, in March, joined to work on hiring and culture instead.",
    ],
  },
];

/** Short posts from people who use pello every day, for the wall of them on the home page. */
export const WALL: Array<{ person: string; at: string; text: string }> = [
  { person: "grace", at: "Fieldwork", text: "Asked pello about parental leave at 11pm and got the actual policy, with the line highlighted. Not a guess, not a link to a 40 page PDF." },
  { person: "leo", at: "Fieldwork", text: "First day: laptop set up, accounts working, buddy waiting at the door. I didn't fill in a single form." },
  { person: "marco", at: "Fieldwork", text: "I approve maybe one time off request a month now. The rest just happen, and I get told." },
  { person: "priya", at: "Fieldwork", text: "Expensed a monitor arm from Slack in about ten seconds. It was in my next salary." },
  { person: "tom", at: "Fieldwork", text: "Half my week used to be answering the same five questions. Now pello answers them and sends me the ones it can't." },
  { person: "nina", at: "Fieldwork", text: "The overtime flags are the best part. I hear about it before anyone burns out, not after." },
  { person: "ravi", at: "Fieldwork", text: "My payslip had overtime on it and pello explained every line before I'd even asked." },
  { person: "mei", at: "Fieldwork", text: "We rolled out a new parental policy on Monday and pello was answering questions about it by lunch." },
  { person: "oliver", at: "Fieldwork", text: "Onboarding three engineers in one week used to be my whole week. This time I just picked their buddies." },
];

