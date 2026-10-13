"use client";

import { CheckCircleIcon, CheckIcon, CopyIcon, MagnifyingGlassIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FAQList } from "../sections/FAQ";

/* ---------------- Help center ---------------- */

const HELP = [
  {
    cat: "Getting started",
    items: [
      { q: "How do I open an account?", a: "Download the app, enter your details and answer six questions about your goals. Most people are approved in under five minutes. You'll need a US address and a Social Security number." },
      { q: "Is there a minimum to start?", a: "No. You can start with $1. Fractional shares mean every dollar is invested, whatever the share price." },
      { q: "Which plan should I choose?", a: "Basic covers investing and cash. Plus adds Autopilot rebalancing, tax-loss harvesting and unlimited Copilot. Most members with more than about $5,000 invested choose Plus." },
    ],
  },
  {
    cat: "Deposits & withdrawals",
    items: [
      { q: "How long do deposits take?", a: "Up to $5,000 is available to invest instantly. The full amount settles in one to three business days." },
      { q: "When will my withdrawal arrive?", a: "Requests before 2 PM ET on a business day usually arrive the same day. Selling investments first adds one business day for the trade to settle." },
      { q: "How do I transfer from another broker?", a: "Go to Account, then Transfers, then Transfer in. We'll request the transfer for you and reimburse up to $150 in fees your old broker charges." },
      { q: "Why was my deposit returned?", a: "Usually because of insufficient funds or a closed account at your bank. The first return is free; after that there's a $15 fee." },
    ],
  },
  {
    cat: "Autopilot",
    items: [
      { q: "How do I pause Autopilot?", a: "Open the Invest tab and switch Autopilot off. New deposits will stay in cash until you switch it back on." },
      { q: "Why did Autopilot sell something?", a: "Usually to rebalance or harvest a loss. Tap the trade in Activity, or ask Copilot, to see the exact rule that triggered it." },
      { q: "Can I exclude a company or industry?", a: "Yes. Go to Invest, then Rules, then Never buy. Exclusions apply to new purchases immediately." },
    ],
  },
  {
    cat: "Taxes",
    items: [
      { q: "When are tax documents available?", a: "Form 1099 is available by February 15 each year in Account, then Tax center. We'll notify you when it's ready, and send a corrected form if anything changes." },
      { q: "Does tax-loss harvesting run in my IRA?", a: "No. Gains and losses in IRAs aren't taxed, so there's nothing to harvest." },
      { q: "Can I export to tax software?", a: "Yes. Tax center supports direct import into the major tax filing products, plus a CSV of every lot." },
    ],
  },
  {
    cat: "Security & login",
    items: [
      { q: "How do I set up a passkey?", a: "Go to Account, then Security, then Passkeys. Your device will create a passkey protected by Face ID or your device passcode." },
      { q: "I lost my phone. What should I do?", a: "Sign in on the web and remove the device under Account, then Security. Or contact support and we'll lock your account within minutes." },
      { q: "Why is my new bank account on hold?", a: "Withdrawals to a newly linked bank are held for 72 hours to protect you from account takeover." },
    ],
  },
  {
    cat: "Account & billing",
    items: [
      { q: "How do I change my plan?", a: "Account, then Plan. Upgrades take effect immediately. Downgrades take effect at the end of your billing period." },
      { q: "How do I close my account?", a: "Account, then Close account. You can transfer your investments to another broker or sell and withdraw. Closing is free." },
      { q: "Can I add a joint account?", a: "Yes. Joint and custodial accounts are available on all plans from Account, then Add account." },
    ],
  },
];

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(HELP[0].cat);
  const q = query.trim().toLowerCase();
  const results = useMemo(() => (q ? HELP.flatMap((c) => c.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q))) : null), [q]);
  const current = HELP.find((c) => c.cat === cat)!;

  return (
    <div>
      <label className="relative block max-w-[640px]">
        <span className="sr-only">Search help articles</span>
        <MagnifyingGlassIcon size={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/60" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for withdrawals, taxes, passkeys…"
          className="h-14 w-full rounded-[14px] border border-white/12 bg-white/[0.04] pl-14 pr-5 text-[17px] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-white/55 hover:border-white/25 focus:border-lime focus:ring-4 focus:ring-lime/30"
        />
      </label>

      <div className="mt-14">
        {results ? (
          <div aria-live="polite">
            <div className="mb-4 text-[16px] text-white/60">
              {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
            </div>
            {results.length ? (
              <FAQList key={q} items={results} id="help-search" />
            ) : (
              <p className="text-[16px] text-white/70">
                Nothing matched. Try another word, or{" "}
                <Link href="/contact" className="text-accent underline underline-offset-4">
                  ask a human
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
            <LayoutGroup id="help-cats">
              <nav aria-label="Help categories" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
                {HELP.map((c) => (
                  <button
                    key={c.cat}
                    onClick={() => setCat(c.cat)}
                    aria-pressed={cat === c.cat}
                    className={cn("relative shrink-0 rounded-[10px] px-4 py-2.5 text-left text-[17px] transition-colors", cat === c.cat ? "text-white" : "text-white/70 hover:text-white")}
                  >
                    {cat === c.cat && <motion.span layoutId="help-cat" className="absolute inset-0 rounded-[10px] bg-white/[0.07]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">{c.cat}</span>
                  </button>
                ))}
              </nav>
            </LayoutGroup>
            <div>
              <h2 className="mb-2 text-[26px] font-semibold tracking-[-0.03em]">{current.cat}</h2>
              <FAQList key={current.cat} items={current.items} id={`help-${current.cat.replace(/\W+/g, "-").toLowerCase()}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Status ---------------- */

const COMPONENTS = ["Mobile apps", "Web app", "Trading", "Deposits & withdrawals", "Copilot", "Market data", "Public API"];
type Day = "ok" | "minor" | "major";
const INCIDENT_DAYS: Record<string, Record<number, Day>> = {
  Copilot: { 29: "minor", 30: "minor" },
  "Deposits & withdrawals": { 66: "minor" },
  "Market data": { 6: "major" },
  "Public API": { 48: "minor" },
};

const INCIDENTS = [
  {
    title: "Copilot responses delayed",
    date: "September 12, 2026",
    impact: "minor" as Day,
    updates: [
      ["4:52 PM", "Resolved. Response times are back to normal."],
      ["3:30 PM", "A fix is rolling out. Some answers may still take up to 30 seconds."],
      ["2:58 PM", "We're investigating slower Copilot responses. Trading and Autopilot are not affected."],
    ],
  },
  {
    title: "Delayed ACH deposits from one partner bank",
    date: "August 6, 2026",
    impact: "minor" as Day,
    updates: [
      ["11:40 AM", "Resolved. All delayed deposits have been credited with their original dates."],
      ["9:05 AM", "Deposits from one partner bank are arriving about four hours late. Instant deposits are unaffected."],
    ],
  },
  {
    title: "Stale prices for some ETFs",
    date: "July 7, 2026",
    impact: "major" as Day,
    updates: [
      ["10:18 AM", "Resolved. A market data provider outage caused prices to freeze for 23 minutes. No trades were executed at stale prices."],
      ["9:55 AM", "Some ETF prices aren't updating. We've paused Autopilot trading as a precaution."],
    ],
  },
];

function days(name: string): Day[] {
  return Array.from({ length: 90 }, (_, i) => INCIDENT_DAYS[name]?.[i] ?? "ok");
}

const DAY_STYLE: Record<Day, string> = { ok: "bg-lime", minor: "bg-down/60", major: "bg-down" };

export function StatusBoard() {
  const [ago, setAgo] = useState(12);
  useEffect(() => {
    const id = setInterval(() => setAgo((a) => (a >= 59 ? 0 : a + 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const uptime = useMemo(() => Object.fromEntries(COMPONENTS.map((c) => [c, days(c).filter((d) => d !== "ok").length])), []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-lime/30 bg-lime/[0.06] px-6 py-5" role="status">
        <div className="flex items-center gap-3">
          <CheckCircleIcon size={24} weight="fill" className="text-accent" />
          <span className="text-[18px] font-medium">All systems operational</span>
        </div>
        <span className="text-[15px] tabular-nums text-white/60">Updated {ago}s ago</span>
      </div>

      <ul className="mt-10 divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {COMPONENTS.map((c) => {
          const bad = uptime[c];
          const pct = (100 - (bad * 100) / 90 / 12).toFixed(2);
          return (
            <li key={c} className="py-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[16px] font-medium">{c}</span>
                <span className="flex items-center gap-2 text-[16px] text-accent">
                  <span className="size-2 rounded-full bg-lime" /> Operational
                </span>
              </div>
              <div className="mt-4 flex h-9 gap-[2px]" role="img" aria-label={`${c}: ${pct}% uptime over 90 days`}>
                {days(c).map((d, i) => (
                  <motion.span
                    key={i}
                    title={d === "ok" ? "No incidents" : d === "minor" ? "Minor incident" : "Major incident"}
                    className={cn("flex-1 origin-bottom rounded-[2px]", DAY_STYLE[d], d === "ok" && "opacity-80 hover:opacity-100")}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.004, duration: 0.3 }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[15px] tabular-nums text-white/60">
                <span>90 days ago</span>
                <span>{pct}% uptime</span>
                <span>Today</span>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-20 text-[26px] font-semibold tracking-[-0.03em]">Past incidents</h2>
      <ul className="mt-6 space-y-4">
        {INCIDENTS.map((inc) => (
          <li key={inc.title} className="rounded-[20px] border border-white/[0.08] bg-ink-2 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-[17px] font-medium">
                {inc.impact === "major" ? <XCircleIcon size={20} weight="fill" className="text-down" /> : <WarningCircleIcon size={20} weight="fill" className="text-down/80" />}
                {inc.title}
              </h3>
              <time className="text-[15px] tabular-nums text-white/60">{inc.date}</time>
            </div>
            <ol className="mt-4 space-y-3 border-l border-white/10 pl-5">
              {inc.updates.map(([t, text]) => (
                <li key={t} className="text-[16px] leading-relaxed text-white/75">
                  <span className="mr-3 text-[15px] tabular-nums text-white/60">{t}</span>
                  {text}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Developers ---------------- */

const SAMPLES = {
  cURL: `curl https://api.zuno.com/v1/portfolios/pf_8f2k1/holdings \\
  -H "Authorization: Bearer $ZUNO_TOKEN"`,
  JavaScript: `import { Zuno } from "@zuno/sdk";

const zuno = new Zuno({ token: process.env.ZUNO_TOKEN });
const { holdings } = await zuno.portfolios.holdings("pf_8f2k1");

console.log(holdings[0]);
// { symbol: "VTI", shares: 58.4, value: 18248.83 }`,
  Python: `from zuno import Zuno

zuno = Zuno(token=os.environ["ZUNO_TOKEN"])
holdings = zuno.portfolios.holdings("pf_8f2k1")

print(holdings[0])
# Holding(symbol="VTI", shares=58.4, value=18248.83)`,
};

export function CodeSample() {
  const [lang, setLang] = useState<keyof typeof SAMPLES>("cURL");
  const [copied, setCopied] = useState(false);
  const code = SAMPLES[lang];
  const copy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <LayoutGroup id="code-tabs">
          <div className="flex gap-1" role="tablist" aria-label="Language">
            {(Object.keys(SAMPLES) as Array<keyof typeof SAMPLES>).map((l) => (
              <button key={l} role="tab" aria-selected={lang === l} onClick={() => setLang(l)} className={cn("relative h-8 rounded-[8px] px-3 text-[15px] tabular-nums", lang === l ? "text-white" : "text-white/60 hover:text-white")}>
                {lang === l && <motion.span layoutId="code-tab" className="absolute inset-0 rounded-[8px] bg-white/[0.08]" />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <button onClick={copy} aria-label="Copy code" className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[15px] text-white/70 hover:bg-white/[0.06] hover:text-white">
          {copied ? <CheckIcon size={14} weight="bold" className="text-accent" /> : <CopyIcon size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="no-scrollbar overflow-x-auto p-6 font-mono text-[15px] leading-[1.7] text-white/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}
