"use client";

import { LinkedinLogoIcon, XLogoIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DitherField } from "./dither";
import { Logo } from "./logo";
import { Container } from "./ui";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Ask pello", href: "/product#ask" },
      { label: "Time off", href: "/product#time-off" },
      { label: "Onboarding", href: "/product#onboarding" },
      { label: "Payroll", href: "/product#payroll" },
      { label: "Insights", href: "/product#insights" },
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
    <footer className="relative overflow-hidden bg-page pt-24">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" aria-label="pello home" className="inline-flex rounded-[4px]">
              <Logo />
            </Link>
            <p className="mt-6 max-w-[340px] text-[18px] leading-[1.5] text-ink-2">The HR system that answers, approves and pays, so your people team can spend its week on people.</p>
            <ul className="mt-8 grid gap-2 text-[16px] text-ink-2">
              {OFFICES.map((o) => (
                <li key={o.city} className="flex items-center gap-3">
                  <span className="w-[88px]">{o.city}</span>
                  <Clock zone={o.zone} />
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h3 className="font-display text-[22px] font-extrabold text-ink">{c.title}</h3>
                <ul className="mt-5 grid gap-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="rounded-[2px] text-[17px] text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 py-6 text-[15px] text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 pello Inc. All rights reserved.</p>
          <ul className="flex items-center gap-2">
            {SOCIAL.map((s) => (
              <li key={s.href}>
                <a href={s.href} aria-label={s.label} className="grid size-11 place-items-center rounded-[4px] text-ink-2 transition-colors hover:bg-ink hover:text-page">
                  <s.icon size={20} />
                </a>
              </li>
            ))}
          </ul>
        </div>

      </Container>

      {/* The name, big, cut off by the bottom of the page, over vermilion printed rising from it. */}
      <div className="relative mt-4">
        <DitherField inks={["accent", "page"]} shape="rise" reach={0.95} cell={4} drift className="absolute inset-0" />
        <Container className="relative">
          <p className="-mb-[0.14em] select-none font-display text-[clamp(8rem,38vw,34rem)] font-extrabold leading-[0.8] tracking-[-0.02em] text-ink">pello</p>
        </Container>
      </div>
    </footer>
  );
}
