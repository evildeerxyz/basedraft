"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowRightIcon, ListIcon, MoonIcon, SunIcon, XIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { APP_URL } from "@/lib/content";
import { applyStoredTheme, switchThemeWithReveal } from "@/lib/theme";
import { ButtonLink, Container, Logo } from "./ui";

const LINKS = [
  { label: "Product", href: "/product" },
  { label: "Customers", href: "/customers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Changelog", href: "/changelog" },
  { label: "Company", href: "/company" },
];

export function ThemeToggle({ className }: { className?: string }) {
  // React's dev-mode remount clears the attribute the inline script set.
  useEffect(() => applyStoredTheme(), []);
  return (
    <motion.button
      type="button"
      onClick={(event) => switchThemeWithReveal(event.clientX, event.clientY)}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle color theme"
      className={cn("relative grid size-10 place-items-center overflow-hidden text-ink-2 transition-colors hover:bg-hover hover:text-ink", className)}
    >
      <SunIcon size={17} weight="duotone" className="absolute transition-all duration-300 dark:-translate-y-5 dark:rotate-90 dark:opacity-0" />
      <MoonIcon size={17} weight="duotone" className="absolute translate-y-5 -rotate-90 opacity-0 transition-all duration-300 dark:translate-y-0 dark:rotate-0 dark:opacity-100" />
    </motion.button>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 24));

  return (
    <header className={cn("sticky top-0 z-50 border-b bg-page transition-[border-color] duration-300", scrolled ? "border-line" : "border-transparent")}>
      <Container className="grid h-16 grid-cols-[1fr_auto] items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <Logo />
        <nav aria-label="Main" className="hidden items-center md:flex">
          {LINKS.map((link) => {
            const on = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn("relative flex h-10 items-center px-3.5 text-[14.5px] font-medium transition-colors", on ? "text-ink" : "text-ink-2 hover:text-ink")}
              >
                {link.label}
                {on && (
                  <motion.svg layoutId="nav-active" viewBox="0 0 10 6" className="absolute bottom-0.5 left-1/2 h-1.5 w-2.5 -translate-x-1/2" aria-hidden>
                    <path d="M5 0 10 6H0Z" fill="var(--accent)" />
                  </motion.svg>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-end gap-1">
          <ThemeToggle />
          <a href={APP_URL} className="hidden h-10 items-center px-3 text-[14.5px] font-medium text-ink transition-colors hover:text-ink-2 sm:flex">
            Sign in
          </a>
          <ButtonLink href={APP_URL} variant="accent" size="sm" className="ml-1 max-sm:hidden">
            Start free
          </ButtonLink>
          <button type="button" onClick={() => setMobileOpen((value) => !value)} aria-label="Menu" aria-expanded={mobileOpen} className="grid size-10 place-items-center border border-line md:hidden">
            {mobileOpen ? <XIcon size={16} /> : <ListIcon size={16} />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line bg-page md:hidden">
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="grid p-4">
              {[...LINKS, { label: "Talk to sales", href: "/contact" }].map((link) => (
                <motion.li key={link.href} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  <Link href={link.href} onClick={() => setMobileOpen(false)} className="flex h-12 items-center justify-between border-b border-line text-[17px] text-ink">
                    {link.label}
                    <ArrowRightIcon size={14} className="text-ink-3" />
                  </Link>
                </motion.li>
              ))}
              <li className="mt-4">
                <ButtonLink href={APP_URL} variant="accent" className="w-full">
                  Start free
                </ButtonLink>
              </li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
