export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: "Investing" | "Taxes" | "Product" | "Markets" | "Design";
  date: string;
  readTime: string;
  author: { name: string; role: string; seed: number };
  seed: number;
  body: BlogBlock[];
}

export const POSTS: Post[] = [
  {
    slug: "why-we-cap-single-stocks",
    title: "Why we cap single stocks at 7%",
    excerpt: "A great company can still sink a portfolio. Here's the rule we use to stop one winner from becoming your whole plan.",
    category: "Investing",
    date: "September 24, 2026",
    readTime: "5 min read",
    author: { name: "Sarah Lindqvist", role: "Head of Investing", seed: 12 },
    seed: 3,
    body: [
      { type: "p", text: "Every few years a stock does something extraordinary. It doubles, then doubles again, and anyone who owns it feels like a genius. Then, sometimes slowly and sometimes in a week, it gives a lot of that back." },
      { type: "p", text: "When one holding grows to dominate a portfolio, your financial future quietly starts depending on a single company's next earnings call. That's a lot of risk to carry without deciding to." },
      { type: "h2", text: "The rule" },
      { type: "p", text: "In every Zuno Growth portfolio, no single stock can be more than 7% of the total. If a position grows past that line, Autopilot trims it back and spreads the proceeds across the rest of your mix." },
      { type: "ul", items: ["The cap applies to individual stocks, not to broad index funds.", "Trims happen only when the position is more than 2% over the cap, so we're not trading on noise.", "In taxable accounts, Autopilot sells the lots with the smallest gains first."] },
      { type: "h2", text: "Why 7%" },
      { type: "p", text: "We tested caps from 3% to 15% against 40 years of US market data. Below about 5%, you give up too much of the upside that comes from holding real companies. Above 10%, a single bad year for one stock can cost you more than a typical year of market returns. Seven sat comfortably in the middle." },
      { type: "quote", text: "The goal isn't to avoid winners. It's to make sure no single loser can ruin the plan." },
      { type: "h2", text: "What it means for you" },
      { type: "p", text: "Most members never notice the cap. When it does kick in, Copilot tells you exactly what was sold, why, and the estimated tax impact. And if you'd rather hold more of a company you believe in, you can raise the cap in Settings. We'll just make sure you know what that means first." },
    ],
  },
  {
    slug: "tax-loss-harvesting-explained",
    title: "Tax-loss harvesting, without the jargon",
    excerpt: "Selling at a loss sounds like the opposite of investing. Done carefully, it's one of the few free lunches in personal finance.",
    category: "Taxes",
    date: "September 10, 2026",
    readTime: "6 min read",
    author: { name: "Lucas Weber", role: "Portfolio Strategist", seed: 31 },
    seed: 9,
    body: [
      { type: "p", text: "Markets go down sometimes. When they do, some of the funds you own will be worth less than you paid. Tax-loss harvesting turns those moments into something useful." },
      { type: "h2", text: "The idea in one paragraph" },
      { type: "p", text: "You sell a fund that's down, which locks in a loss on paper. That loss can cancel out taxable gains elsewhere, and up to $3,000 of your regular income each year. The same day, you buy a similar fund so your money stays invested and your plan barely changes." },
      { type: "h2", text: "A real example" },
      { type: "p", text: "Say you bought $10,000 of a total market fund and it drops to $8,700. Zuno sells it, books a $1,300 loss, and buys a different fund that tracks almost the same index. In the 24% bracket, that loss could save you about $312 on this year's taxes." },
      { type: "h2", text: "The catch" },
      { type: "ul", items: ["The wash sale rule: you can't buy back the same fund within 30 days, or the loss doesn't count. Zuno tracks this across all your accounts.", "It often defers tax rather than erasing it, because your new fund has a lower cost basis.", "It only works in taxable accounts. IRAs don't benefit."] },
      { type: "p", text: "Deferral still matters. Money you'd have paid in tax stays invested and compounds, and you may pay a lower rate later in retirement." },
      { type: "h2", text: "Why software does it better" },
      { type: "p", text: "The best opportunities are often short. A fund might dip below your cost for three days in a choppy month. People rarely notice, and advisers check quarterly at best. Zuno checks every lot, every trading day." },
    ],
  },
  {
    slug: "what-copilot-can-and-cant-do",
    title: "What Copilot can do, and what it won't",
    excerpt: "We gave an AI access to people's money. Here are the rules we wrote before we wrote any code.",
    category: "Product",
    date: "August 28, 2026",
    readTime: "4 min read",
    author: { name: "Kenji Mori", role: "Head of AI", seed: 44 },
    seed: 17,
    body: [
      { type: "p", text: "When we started building Copilot, the hardest questions weren't technical. They were about trust: what should an AI be allowed to do with someone's savings, and how would they know what it did?" },
      { type: "h2", text: "What it can do" },
      { type: "ul", items: ["Explain any trade Autopilot made, with the rule that triggered it.", "Answer questions using your real balances, holdings and transactions.", "Run retirement and spending scenarios with your actual numbers.", "Propose changes, like raising a monthly deposit or rebalancing early."] },
      { type: "h2", text: "What it won't do" },
      { type: "ul", items: ["Place a trade you haven't approved, outside rules you've switched on.", "Recommend individual stocks based on tips or headlines.", "Answer from memory when it can't ground the answer in your data.", "Hide where a number came from."] },
      { type: "quote", text: "If Copilot can't show its working, it shouldn't give the answer." },
      { type: "h2", text: "How we check it" },
      { type: "p", text: "Every week, licensed advisers review a sample of Copilot conversations against a written rubric. Answers about taxes and large withdrawals are reviewed before members see them. When we find a mistake, we fix the underlying data or rule, then re-run thousands of past questions to make sure the fix holds." },
      { type: "p", text: "Copilot will still make mistakes sometimes. Our job is to make sure they're rare, visible and cheap to undo." },
    ],
  },
  {
    slug: "the-2025-selloff-trade-by-trade",
    title: "The 2025 selloff, trade by trade",
    excerpt: "Markets fell 13% in five weeks. Here's every kind of move Autopilot made for members, and what we learned.",
    category: "Markets",
    date: "July 15, 2026",
    readTime: "7 min read",
    author: { name: "Sarah Lindqvist", role: "Head of Investing", seed: 12 },
    seed: 23,
    body: [
      { type: "p", text: "Last autumn the US market fell about 13% in five weeks. It was the sharpest drop since we launched Autopilot, and a real test of whether software can stay calm when people understandably don't." },
      { type: "h2", text: "What Autopilot did" },
      { type: "ul", items: ["Harvested losses for 71% of taxable accounts, worth a median of $412 in estimated tax savings.", "Rebalanced 58% of portfolios back toward stocks as bonds became overweight.", "Invested $96 million of scheduled deposits on time, exactly as planned.", "Paused buys in three individual stocks for 72 hours while their daily swings exceeded 9%."] },
      { type: "h2", text: "What members did" },
      { type: "p", text: "Copilot answered 214,000 questions during those five weeks, more than three times the usual volume. The most common was simply: should I sell? About 3% of members paused Autopilot. Most of them turned it back on within a month." },
      { type: "quote", text: "The best trade most people can make in a selloff is the one they don't make." },
      { type: "h2", text: "What we changed" },
      { type: "p", text: "We learned that people wanted context before they wanted advice. Copilot now opens with how today's move compares to your own history, then what Autopilot is doing about it, and only then any suggestion. We also made the pause switch slower to flip, adding a short summary of what pausing would mean for your plan." },
    ],
  },
  {
    slug: "designing-a-calm-money-app",
    title: "Designing a calm money app",
    excerpt: "Most finance apps are built to make you check them. We tried to build one you could ignore.",
    category: "Design",
    date: "June 30, 2026",
    readTime: "4 min read",
    author: { name: "Emily Chen", role: "Design Lead", seed: 58 },
    seed: 31,
    body: [
      { type: "p", text: "Open most investing apps and you're greeted by flashing tickers, red and green everywhere, and a reason to trade. That's great for engagement. It's terrible for your returns." },
      { type: "h2", text: "Three rules we design by" },
      { type: "ul", items: ["Show what you have, what changed and why. Nothing else on the home screen.", "Never celebrate a trade. No confetti, no streaks, no badges.", "Every number should answer a question someone actually asked."] },
      { type: "h2", text: "Less red" },
      { type: "p", text: "We use red only for real problems, like a failed transfer. A normal down day shows as a quiet gray dip, with Copilot's note about whether it's within your usual range. Members who see that note check the app less often during volatile weeks, and they're less likely to pause Autopilot." },
      { type: "quote", text: "If someone opens Zuno twice a month and feels fine, we've done our job." },
      { type: "h2", text: "Why dithering" },
      { type: "p", text: "Our charts and illustrations use ordered dithering, a technique from early computer graphics. It lets us show texture and depth with a single color, it renders crisply on any screen, and frankly it looks nothing like the glossy gradients every other finance brand uses. It reminds us that this is a tool, not a slot machine." },
    ],
  },
];

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
