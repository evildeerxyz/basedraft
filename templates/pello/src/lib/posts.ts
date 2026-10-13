import { SCENES } from "./photos";

/* The blog. Made up, and safe to replace: each post is a list of blocks, drawn by the post page. */

export type Block = { h2: string } | { p: string } | { list: string[] } | { quote: string; by: string };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  role: string;
  minutes: number;
  /** A photo for the top of the post, printed like the rest. */
  cover: string;
  body: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "answers-you-can-check",
    cover: SCENES.meeting,
    title: "Answers you can check",
    excerpt: "Why every answer pello gives comes with the passage it used, and what it does when there isn't one.",
    date: "October 6, 2026",
    author: "Anna Weber",
    role: "Co-founder and CEO",
    minutes: 5,
    body: [
      { p: "When I ran People at a 900 person company, the question I answered most was how many days off someone had left. The second was where to find the parental leave policy. Neither needed me. Both took me away from the work that did." },
      { p: "So when we started pello, answering questions was the first thing we built. And the first thing we learned was that a right answer isn't enough. People have to believe it." },
      { h2: "A right answer nobody trusts" },
      { p: "In our first pilot, pello answered 80% of questions correctly. People still asked the People team to confirm half of them. They had no way to tell a right answer from a confident wrong one, so they checked, and the team was as busy as before." },
      { p: "We changed one thing. Every answer now comes with the passage from the company's own handbook that it was based on, with the relevant words marked. You can open it in one click." },
      { quote: "Once people could see the line it came from, they stopped asking us to double check.", by: "Rachel Moore, Head of People at Halden" },
      { h2: "When there isn't a passage" },
      { p: "The harder part was teaching pello to say it doesn't know. If the handbook doesn't cover something, pello says so plainly and sends the question to the right person on the People team, with the question and who asked it. It never fills the gap with what most companies do." },
      { p: "That turns out to be useful in a second way. Every question pello can't answer is a gap in the handbook. Each month, the People team gets a list of them, ranked by how often they came up." },
      { h2: "What we measure" },
      { list: ["How many questions are answered without a person: 71% on average after three months.", "How often an answer is checked with the People team afterwards: under 4%.", "How many gaps in the handbook get filled each month."] },
      { p: "The last one is my favourite. The handbook gets better because people asked questions, and the questions get answered because the handbook got better." },
    ],
  },
  {
    slug: "rules-not-approvals",
    cover: SCENES.planning,
    title: "Write rules, not approvals",
    excerpt: "Most time off requests don't need a manager. How to write the rules that let them through, and catch the ones that do.",
    date: "September 22, 2026",
    author: "Sophie Martin",
    role: "Head of Product",
    minutes: 6,
    body: [
      { p: "Across our customers, 92% of time off requests are approved. Most of them are approved without the manager looking at anything but the dates. That's a lot of clicking for a decision that was already made." },
      { h2: "What a manager is really checking" },
      { p: "We asked 200 managers what they look at before approving time off. The answers were the same four things: whether the person has the days, whether they gave enough notice, whether too many of the team are out, and whether anything important is booked." },
      { p: "All four can be written down. When they are, pello checks them on every request and approves the ones that pass. The manager is told, and can undo it, but doesn't have to do anything." },
      { h2: "Keep the ones that need a person" },
      { p: "A rule that fails doesn't mean no. It means a person should decide. pello sends it to the manager with the reason it couldn't approve it, who else is out, and who could cover. Most of those decisions take a minute." },
      { list: ["Start with notice and team limits. They cover most cases.", "Add calendar checks for teams with customer meetings.", "Look at what gets sent to managers after a month, and adjust."] },
      { p: "Teams that do this see the time from request to answer drop from two days to four minutes. Managers see one request in ten instead of all of them." },
    ],
  },
  {
    slug: "payroll-in-one-afternoon",
    cover: SCENES.desk,
    title: "Payroll in one afternoon",
    excerpt: "What changed for Brightwater when the month's changes arrived as they happened, instead of on the 28th.",
    date: "September 8, 2026",
    author: "James Clarke",
    role: "Head of Payroll",
    minutes: 4,
    body: [
      { p: "Payroll is mostly waiting. Waiting for hours from one system, expenses from another, new salaries from a spreadsheet in someone's inbox. Then three days of checking that it all adds up." },
      { p: "Brightwater pays 900 people in three countries. Their finance team used to start payroll on the 25th and finish on the 29th." },
      { h2: "Changes as they happen" },
      { p: "With pello, every change arrives when it's made. Overtime is added when a manager approves it. An expense is added when the receipt is. A new salary is added when the contract is signed. By the end of the month, the run is already done. It just needs checking." },
      { h2: "Checking, with reasons" },
      { p: "pello compares each country's total with last month and lists every change that explains the difference, with who made it and why. If something can't be explained, it's marked, and nobody is paid until a person has looked." },
      { quote: "Most of the afternoon was me reading the changes. That's the part I should be doing.", by: "Sam Whitaker, Finance Director at Brightwater" },
    ],
  },
  {
    slug: "the-first-day",
    cover: SCENES.laptops,
    title: "Everything ready for the first day",
    excerpt: "A new starter's first morning says a lot about a company. We looked at 3,000 of them.",
    date: "August 25, 2026",
    author: "Lena Hoffmann",
    role: "Design Lead",
    minutes: 4,
    body: [
      { p: "We looked at the first days of 3,000 new starters at our customers, before and after pello. Before, 39% started without something they needed: a laptop, an account, a desk, or just someone expecting them." },
      { h2: "The list starts with the contract" },
      { p: "Now the list starts the day the contract is signed. pello orders the laptop, makes the accounts, books the first week and asks the manager to pick a buddy. Each task belongs to someone, and pello follows up until it's done." },
      { list: ["Two weeks before: contract, right to work, payroll and pension.", "One week before: laptop, accounts and a buddy.", "The Friday before: a welcome note and a calendar for the first week.", "Day one: setup with the buddy, and lunch with the team."] },
      { p: "After three months on pello, 98% of new starters have everything on their first morning. The other 2% are usually laptops stuck at customs." },
    ],
  },
];

export const postOf = (slug: string) => POSTS.find((p) => p.slug === slug);
