"use client";

import { LinkedinLogoIcon, XLogoIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Logo } from "./logo";
import { Container } from "./ui";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Ask pello", href: "/product#ask" },
      { label: "Time off", href: "/product#time-off" },
      { label: "Payroll", href: "/product#payroll" },
      { label: "Onboarding", href: "/product#day-one" },
      { label: "Where it works", href: "/product#works-with" },
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
    <footer className="bg-surface">
      <Container className="pb-10 pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            <Link href="/" aria-label="pello home" className="inline-flex rounded-[6px]">
              <Logo />
            </Link>
            <p className="mt-5 max-w-[340px] text-[16px] leading-[1.55] text-mute">The HR system that answers, approves and pays, so your People team can spend its week on people.</p>
            <p className="mt-6 grid gap-1 text-[15px] text-mute">
              {OFFICES.map((o) => (
                <span key={o.city}>
                  {o.city}, it&apos;s <span className="text-ink"><Clock zone={o.zone} /></span>
                </span>
              ))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h3 className="text-[15px] text-mute">{c.title}</h3>
                <ul className="mt-4 grid gap-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="rounded-[4px] text-[16px] text-ink transition-colors hover:text-ink-2">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-line-strong pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-mute">© 2026 pello Inc. All rights reserved.</p>
          <ul className="-mr-2 flex items-center gap-1">
            {SOCIAL.map((s) => (
              <li key={s.href}>
                <a href={s.href} aria-label={s.label} className="grid size-10 place-items-center rounded-[10px] text-ink-2 transition-colors hover:text-ink">
                  <s.icon size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
