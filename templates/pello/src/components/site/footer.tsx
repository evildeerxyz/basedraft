"use client";

import { LinkedinLogoIcon, XLogoIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Logo } from "./logo";
import { Band } from "./ui";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Ask pello", href: "/product#ask" },
      { label: "Time off", href: "/product#time-off" },
      { label: "Payroll", href: "/product#payroll" },
      { label: "Onboarding", href: "/product#features" },
      { label: "Integrations", href: "/product#integrations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/company" },
      { label: "Customers", href: "/customers" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "/security" },
      { label: "Pricing", href: "/pricing" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
];

/* Placeholder handles: swap for the real accounts before launch. */
const SOCIAL = [
  { label: "pello on X", href: "https://x.com/pello", icon: XLogoIcon },
  { label: "pello on LinkedIn", href: "https://www.linkedin.com/company/pello", icon: LinkedinLogoIcon },
];

const OFFICES = [
  { city: "Berlin", zone: "Europe/Berlin" },
  { city: "New York", zone: "America/New_York" },
];

/* What pello is audited against, as plain marks: edit them to the ones you actually hold. */
const AUDITS = ["SOC 2 Type II", "ISO 27001", "GDPR", "CCPA"];

// The clocks tick once a minute, and only in the browser, so the server's HTML never disagrees.
const minute = (fn: () => void) => {
  const t = setInterval(fn, 15_000);
  return () => clearInterval(t);
};
const now = () => Math.floor(Date.now() / 60_000);

function Clock({ zone }: { zone: string }) {
  const at = useSyncExternalStore(minute, now, () => null);
  if (at === null) return <span className="tabular font-mono">00:00</span>;
  return <span className="tabular font-mono">{new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: zone }).format(at * 60_000)}</span>;
}

export function Footer() {
  return (
    <footer>
      <Band rule inner="pb-14 pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Link href="/" aria-label="pello home" className="inline-flex rounded-[8px]">
              <Logo />
            </Link>
            <p className="mt-5 max-w-[340px] text-[16px] leading-[1.55] text-mute">The HR system that answers, approves and pays, so your people team can spend its week on people.</p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {AUDITS.map((a) => (
                <li key={a} className="flex h-9 items-center gap-2 rounded-[10px] bg-surface px-3 text-[15px] font-medium text-ink-2 shadow-[0_0_0_1px_var(--pl-line)]">
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className="text-ink">
                    <path d="M8 1.5 13.5 4v4c0 3.2-2.3 5.6-5.5 6.5C4.8 13.6 2.5 11.2 2.5 8V4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                  {a}
                </li>
              ))}
            </ul>
            <span className="mt-7 inline-flex h-9 items-center gap-2 rounded-[10px] bg-surface px-3 font-mono text-[15px] text-ink-2 shadow-[0_0_0_1px_var(--pl-line)]">
              All systems running
              <span aria-hidden className="size-2 rounded-full bg-[#16a34a]" />
            </span>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-mute">
              {OFFICES.map((o) => (
                <span key={o.city}>
                  {o.city} <Clock zone={o.zone} />
                </span>
              ))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h3 className="text-[16px] font-semibold text-ink">{c.title}</h3>
                <ul className="mt-4 grid gap-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="rounded-[4px] text-[16px] text-ink-2 transition-colors hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Band>
      <Band rule inner="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-mute">© 2026 pello Inc. All rights reserved.</p>
        <ul className="flex items-center gap-1">
          {SOCIAL.map((s) => (
            <li key={s.href}>
              <a href={s.href} aria-label={s.label} className="grid size-10 place-items-center rounded-[10px] text-ink-2 transition-colors hover:bg-surface hover:text-ink">
                <s.icon size={18} />
              </a>
            </li>
          ))}
        </ul>
      </Band>
    </footer>
  );
}
