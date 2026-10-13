"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, GithubLogoIcon, LinkedinLogoIcon, XLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/ssr";
import { Container, Logo } from "./ui";
import { ThemeToggle } from "./nav";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Ask Data", href: "/product#ask" },
      { label: "Tables", href: "/product#tables" },
      { label: "SQL Editor", href: "/product#editor" },
      { label: "Relationships", href: "/product#graph" },
      { label: "Insights", href: "/product#insights" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Security", href: "/security" },
      { label: "Architecture", href: "/product#architecture" },
      { label: "Integrations", href: "/product#integrations" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/company" },
      { label: "Customers", href: "/customers" },
      { label: "Careers", href: "/company#careers", badge: "Hiring" },
      { label: "Series B news", href: "/blog/series-b" },
      { label: "Talk to sales", href: "/contact" },
    ],
  },
];

const LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Security", href: "/security" },
  { label: "Status", href: "/status" },
];

/* Placeholder handles: swap for the real accounts before launch. */
const SOCIAL = [
  { label: "X", href: "https://x.com/noma", icon: XLogoIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/noma", icon: LinkedinLogoIcon },
  { label: "GitHub", href: "https://github.com/noma", icon: GithubLogoIcon },
  { label: "YouTube", href: "https://www.youtube.com/@noma", icon: YoutubeLogoIcon },
];

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (email.trim()) setDone(true);
      }}
      className="flex h-12 w-full max-w-[400px] items-stretch overflow-hidden rounded-[6px] border border-ink bg-surface focus-within:[box-shadow:var(--focus-ring)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 items-center gap-2 px-4 text-[14px] text-ink">
            <span className="grid size-5 place-items-center bg-ok text-white">
              <CheckIcon size={11} weight="bold" />
            </span>
            You are on the list.
          </motion.p>
        ) : (
          <motion.input
            key="input"
            exit={{ opacity: 0, y: -6 }}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            aria-label="Email address"
            className="min-w-0 flex-1 border-0 bg-transparent px-4 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:shadow-none"
          />
        )}
      </AnimatePresence>
      {!done && (
        <button type="submit" className="bg-inverse px-4 text-[13.5px] font-medium text-inverse-fg transition-colors hover:bg-inverse-hover">
          Subscribe
        </button>
      )}
    </form>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <Container className="grid gap-14 pb-10 pt-16 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-6 max-w-[360px] text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-ink">The AI layer for Postgres. Ask in English, approve the SQL, share the answer.</p>
          <p className="mt-8 text-[14px] text-ink-2">Product notes, once a month.</p>
          <div className="mt-3">
            <Newsletter />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[13.5px] text-ink-3">{column.title}</h3>
              <ul className="mt-4 grid gap-3">
                {column.links.map((link) => (
                  <li key={link.label} className="flex items-center gap-2">
                    <Link href={link.href} className="text-[15px] text-ink transition-colors hover:text-ink-2">
                      {link.label}
                    </Link>
                    {"badge" in link && link.badge && <span className="bg-accent px-1.5 py-0.5 text-[11px] font-medium text-[#1d1a15]">{link.badge}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <Container className="@container">
        <p aria-hidden className="engraved select-none pb-[0.04em] text-[37cqw] font-semibold leading-[0.92] tracking-[-0.065em]">
          Noma
        </p>
      </Container>
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line py-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-ink-2">
            <span>© 2026 Noma, Inc.</span>
            {LEGAL.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {SOCIAL.map(({ label, href, icon: SocialIcon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Noma on ${label}`}
                className="grid size-10 place-items-center rounded-[6px] text-ink-2 transition-colors hover:bg-hover hover:text-ink"
              >
                <SocialIcon size={18} weight="duotone" />
              </a>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </footer>
  );
}
