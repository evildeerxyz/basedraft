"use client";

import { ArrowRightIcon, ListIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { ButtonLink, Container } from "./ui";

export const LINKS = [
  { label: "Product", href: "/product" },
  { label: "Customers", href: "/customers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Company", href: "/company" },
];

/*
 * A plain bar across the top of the page, on the page's own white, with a hairline under it. The
 * page you're on is underlined. On a phone the links open as a sheet under the bar.
 */
export function Nav() {
  const pathname = usePathname();
  // The menu is open on the page it was opened on, so going to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-page shadow-[0_1px_0_var(--pl-line)]">
      <Container className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="pello home" className="rounded-[6px]">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {LINKS.map((l) => {
                const on = pathname.startsWith(l.href);
                return (
                  <li key={l.href}>
                    <Link href={l.href} aria-current={on ? "page" : undefined} className={cn("relative flex h-16 items-center text-[15px] font-medium transition-colors", on ? "text-ink" : "text-mute hover:text-ink")}>
                      {l.label}
                      {on && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-ink" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/login" className="hidden rounded-[6px] text-[15px] font-medium text-ink transition-colors hover:text-ink-2 sm:block">
            Sign in
          </Link>
          <ButtonLink href="/contact" size="sm" className="max-sm:hidden">
            Book a demo
          </ButtonLink>
          <button type="button" onClick={() => setOpenOn(open ? null : pathname)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" className="pl-btn-light grid size-10 place-items-center rounded-[10px] lg:hidden">
            {open ? <XIcon size={18} /> : <ListIcon size={18} />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div id="mobile-menu" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden border-t border-line bg-page lg:hidden">
            <Container className="pb-6 pt-2">
              <ul>
                {[...LINKS, { label: "Sign in", href: "/login" }].map((l) => (
                  <li key={l.href} className="border-b border-line">
                    <Link href={l.href} onClick={() => setOpenOn(null)} className="flex h-14 items-center justify-between text-[20px] font-medium tracking-[-0.02em] text-ink">
                      {l.label}
                      <ArrowRightIcon size={18} className="text-mute" />
                    </Link>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/contact" size="lg" className="mt-5 w-full">
                Book a demo
              </ButtonLink>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
