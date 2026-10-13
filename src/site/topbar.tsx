"use client";

import { ArrowRightIcon, BooksIcon, CaretDownIcon, ChatCircleIcon, DiamondIcon, MagnifyingGlassIcon, PackageIcon, PenNibIcon, ReceiptIcon, ScrollIcon, SignOutIcon, TruckIcon, UserCircleIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { AccountHeader, Avatar, displayName, openAuth, openProfile, signOut, useAuth } from "./auth";
import { openCommand } from "./command";
import { Keys } from "./keys";
import { TEMPLATES, templateShot } from "./live";
import { Menu, type MenuItem } from "./menu";
import { usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btnSm } from "./sheet";

/*
 * The bar along the top of every page, beside the rail: search on one side; on the other the
 * templates at a glance, the things people look for before they buy, pricing, and your account.
 * The rail is where you go; this bar is how you look things up and sign in.
 */

const LINK = "inline-flex h-8 items-center gap-1 rounded-control px-2.5 text-ui font-medium text-fg/80 transition-colors hover:bg-fg/[0.05] hover:text-fg aria-expanded:bg-fg/[0.06] aria-expanded:text-fg";

/** The templates as a picture menu: what each one looks like, what it's for, what it costs. */
function TemplatesMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  // Opens on hover like a site menu, with a moment's grace so crossing the gap doesn't close it.
  const hover = (v: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(v), v ? 80 : 160);
  };
  return (
    <div ref={root} className="relative" onPointerEnter={(e) => e.pointerType === "mouse" && hover(true)} onPointerLeave={(e) => e.pointerType === "mouse" && hover(false)}>
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)} className={LINK}>
        Templates <CaretDownIcon size={11} weight="bold" className={cn("text-subtle transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute right-0 top-full z-50 mt-2 w-[560px] rounded-[var(--bd-r-sheet)] bg-surface p-2 shadow-[0_24px_60px_-20px_rgb(var(--bd-shade)/0.35),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
          >
            <ul className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <li key={t.slug}>
                  <Link href={`/templates/${t.slug}`} onClick={() => setOpen(false)} className="group block rounded-[8px] p-1.5 transition-colors hover:bg-fg/[0.04]">
                    <span className="relative block aspect-[16/10] overflow-hidden rounded-[6px] bg-surface-2 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]">
                      <Image src={templateShot(t.slug)} alt="" fill sizes="200px" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
                    </span>
                    <span className="mt-2 flex items-baseline justify-between gap-2 px-0.5">
                      <span className="flex items-center gap-1.5 text-ui font-medium">
                        <span aria-hidden className="size-1.5 rounded-full" style={{ background: t.accent }} />
                        {t.name}
                      </span>
                      <span className="text-meta tabular-nums text-muted">{t.price === "free" ? "Free" : `$${t.price}`}</span>
                    </span>
                    <span className="mt-0.5 block px-0.5 text-meta text-subtle">{t.category}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-[8px] bg-fg/[0.03] px-3.5 py-2.5 text-ui">
              <span className="text-muted">Every template, every section and every update, with Pro.</span>
              <Link href="/pro" onClick={() => setOpen(false)} className="inline-flex shrink-0 items-center gap-1 font-medium">
                See Pro <ArrowRightIcon size={12} weight="bold" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const RESOURCES: MenuItem[] = [
  { label: "How you get a template", icon: TruckIcon, href: "/pro#delivery" },
  { label: "What each license covers", icon: ScrollIcon, href: "/pro#license" },
  { label: "Questions", icon: BooksIcon, href: "/pro#faq" },
  "divider",
  { label: "Write to us", icon: ChatCircleIcon, href: "mailto:hello@basedraft.site" },
];

export const accountItems = (plan: "free" | "pro"): MenuItem[] => [
  { label: "Profile", icon: UserCircleIcon, onSelect: openProfile },
  { label: "Team", icon: UsersThreeIcon, href: "/team" },
  { label: "Purchases", icon: ReceiptIcon, href: "/purchases" },
  { label: "Open Studio", icon: PenNibIcon, href: "/studio" },
  { label: "Your drafts and Library", icon: PackageIcon, href: "/studio#library" },
  plan === "pro" ? { label: "Pro is on", icon: DiamondIcon, href: "/purchases" } : { label: "Get Pro", icon: DiamondIcon, hint: "$149 once", onSelect: () => openPro("plan") },
  "divider",
  { label: "Sign out", icon: SignOutIcon, onSelect: signOut },
];

export function TopBar() {
  const { user, loading } = useAuth();
  const [plan, { preview }] = usePlan();
  // The bar stays put from page to page; a new page starts with its menus closed.
  const path = usePathname();
  return (
    <div className="sticky top-0 z-40 hidden h-[60px] items-center justify-between gap-4 bg-canvas/85 px-3 backdrop-blur-md lg:flex">
      <button type="button" onClick={openCommand} className="flex h-9 w-full max-w-[340px] items-center gap-2.5 rounded-control bg-fg/[0.04] px-3 text-left text-ui text-subtle transition-colors hover:bg-fg/[0.06] hover:text-muted">
        <MagnifyingGlassIcon size={15} className="shrink-0" />
        <span className="flex-1 truncate">Search templates and sections</span>
        <Keys combo="Cmd K" />
      </button>
      <nav aria-label="Site" className="flex items-center gap-0.5">
        <TemplatesMenu key={`t${path}`} />
        <Menu key={`r${path}`} label="Resources" align="right" buttonClassName={LINK} button={<>Resources <CaretDownIcon size={11} weight="bold" className="text-subtle" /></>} items={RESOURCES} />
        <Link href="/pro" className={LINK}>
          Pricing
        </Link>
        <span aria-hidden className="mx-2 h-5 w-px bg-line" />
        {loading ? (
          <span className="h-8 w-[150px]" />
        ) : user ? (
          <>
          {preview && (
            <Link href="/pro#buy" title="Development only: Pro without a purchase" className="mr-1.5 rounded-[5px] bg-[#9747ff]/12 px-2 py-1 text-meta font-medium text-[#7c3aed] dark:text-[#c4a5ff]">
              Pro preview
            </Link>
          )}
          <Menu
            key={`a${path}`}
            label="Account"
            align="right"
            buttonClassName="grid size-9 place-items-center rounded-full transition-shadow hover:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.08)] aria-expanded:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.12)]"
            button={<Avatar name={displayName(user)} size={30} />}
            header={<AccountHeader user={user} plan={plan} />}
            items={accountItems(plan)}
          />
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => openAuth("sign-in")} className={LINK}>
              Sign in
            </button>
            <button type="button" onClick={() => openAuth("sign-up")} className={btnSm.ink}>
              Sign up
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
