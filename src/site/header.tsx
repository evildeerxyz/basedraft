"use client";

import { ArrowRightIcon, ArrowUpRightIcon, DiamondIcon, ListIcon, MagnifyingGlassIcon, PackageIcon, PenNibIcon, ReceiptIcon, SignOutIcon, UserCircleIcon, UsersThreeIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { ANNOUNCE_KEY } from "./announce-script";
import { AccountHeader, Avatar, displayName, openAuth, openProfile, signOut, useAuth } from "./auth";
import { ColorModeToggle } from "./color-mode";
import { openCommand } from "./command";
import { Keys } from "./keys";
import { SECTIONS, TEMPLATES } from "./live";
import { BaseDraftLogo } from "./logo";
import { Menu, type MenuItem } from "./menu";
import { usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btnSm, ProBadge } from "./sheet";

/*
 * The top of every page: the logo on the left, the site's places in the middle as a tab switch,
 * and search, light and dark, and your account on the right. At the top of the page it's a plain
 * bar, as wide as the page; once you scroll it gathers into a frosted capsule floating over the
 * content. On a phone, the same with a menu button, the logo, and the mode.
 */

/** Whether the page has scrolled past its top: the header turns into a capsule then. */
const onScroll = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
};
const useScrolled = () =>
  useSyncExternalStore(
    onScroll,
    () => window.scrollY > 8,
    () => false,
  );

const NAV: Array<{ href: string; label: string }> = [
  { href: "/templates", label: "Templates" },
  { href: "/components", label: "Components" },
  { href: "/blocks", label: "Blocks" },
  { href: "/studio", label: "Studio" },
  { href: "/pro", label: "Pricing" },
];

/** The libraries, components and blocks, which end without the footer. */
export const isLibrary = (path: string) => path === "/components" || path.startsWith("/components/") || path === "/blocks" || path.startsWith("/blocks/");

export const accountItems = (plan: "free" | "pro"): MenuItem[] => [
  { label: "Profile", icon: UserCircleIcon, onSelect: openProfile },
  { label: "Team", icon: UsersThreeIcon, href: "/team" },
  { label: "Purchases", icon: ReceiptIcon, href: "/purchases" },
  { label: "Open Studio", icon: PenNibIcon, href: "/studio" },
  { label: "Your drafts", icon: PackageIcon, href: "/studio#library" },
  plan === "pro" ? { label: "Pro is on", icon: DiamondIcon, href: "/purchases" } : { label: "Get Pro", icon: DiamondIcon, hint: "$149 once", onSelect: () => openPro("plan") },
  "divider",
  { label: "Sign out", icon: SignOutIcon, onSelect: signOut },
];

/* ---------- the header ---------- */

const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** The site's places as a tab switch: a pill track, the one you're on raised, sliding to the next. */
function NavTabs() {
  const path = usePathname();
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <nav aria-label="Main" className="flex items-center gap-0.5 rounded-full bg-surface-2 p-1">
        {NAV.map((n) => {
          const on = under(path, n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={cn("relative flex h-8 items-center rounded-full px-4 text-ui transition-colors", on ? "text-fg" : "text-muted hover:text-fg")}>
              {on && <motion.span layoutId="nav" className="absolute inset-0 rounded-full bg-raised shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
              <span className="relative">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}

/** Search, as a quiet pill: the glass, the word, and its keys. */
function SearchButton() {
  return (
    <button type="button" onClick={openCommand} aria-label="Search templates and sections" className="flex h-9 items-center gap-2 rounded-full bg-surface-2 px-2.5 text-ui text-muted transition-colors hover:text-fg xl:pl-3 xl:pr-1.5">
      <MagnifyingGlassIcon weight="duotone" size={15} className="shrink-0" />
      <span className="pr-4 max-2xl:hidden">Search</span>
      <Keys combo="Cmd K" className="max-xl:hidden" />
    </button>
  );
}

/** Your account, or the ways in, and the one thing to do next: open Studio. */
function Account() {
  const { user, loading } = useAuth();
  const [plan, { preview }] = usePlan();
  const path = usePathname();
  if (loading) return <span className="h-9 w-[200px]" />;
  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          {preview && (
            <Link href="/pro#buy" title="Development only: Pro without a purchase" className="rounded-full bg-[#9747ff]/12 px-2.5 py-1 text-meta font-medium text-[#7c3aed] dark:text-[#c4a5ff]">
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
        <button type="button" onClick={() => openAuth("sign-in")} className="h-9 whitespace-nowrap rounded-full px-3.5 text-ui font-medium transition-colors hover:bg-surface-2">
          Sign in
        </button>
      )}
      <Link href="/studio" className="btn-metal inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full pl-4 pr-3.5 text-ui font-medium">
        Open Studio <ArrowUpRightIcon weight="regular" size={14} />
      </Link>
    </div>
  );
}

/* ---------- on a phone ---------- */

function PhoneMenu({ onClose }: { onClose: () => void }) {
  const path = usePathname();
  const { user } = useAuth();
  const [plan] = usePlan();
  const go = "flex h-14 items-center justify-between border-b border-line text-[22px] tracking-[-0.02em]";
  return (
    <motion.div
      id="phone-menu"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="fixed inset-x-0 bottom-0 top-[72px] z-50 overflow-y-auto bg-canvas px-5 pb-10 lg:hidden"
    >
      <button
        type="button"
        onClick={() => {
          onClose();
          openCommand();
        }}
        className="mt-4 flex h-12 w-full items-center gap-3 rounded-[16px] bg-fg/[0.05] px-4 text-left text-ui text-subtle"
      >
        <MagnifyingGlassIcon weight="duotone" size={17} className="shrink-0" />
        Search templates and sections
      </button>
      <nav aria-label="Main" className="mt-4">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} onClick={onClose} aria-current={under(path, n.href) ? "page" : undefined} className={cn(go, "font-display", under(path, n.href) ? "text-fg" : "text-fg/75")}>
            {n.label}
            <ArrowRightIcon weight="regular" size={16} className="text-subtle" />
          </Link>
        ))}
      </nav>
      <p className="mt-8 text-meta text-subtle">Templates</p>
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => (
          <li key={t.slug}>
            <Link href={`/templates/${t.slug}`} onClick={onClose} className="flex h-11 items-center gap-2.5 rounded-[14px] bg-fg/[0.04] px-3.5 text-ui">
              <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-2">
        {user ? (
          accountItems(plan)
            .filter((i): i is Exclude<MenuItem, "divider"> => i !== "divider")
            .map((i) =>
              i.href ? (
                <Link key={i.label} href={i.href} onClick={onClose} className="flex h-11 items-center gap-3 px-1 text-ui">
                  {i.icon && <i.icon size={17} weight="duotone" className="text-muted" />}
                  {i.label}
                </Link>
              ) : (
                <button
                  key={i.label}
                  type="button"
                  onClick={() => {
                    onClose();
                    i.onSelect?.();
                  }}
                  className="flex h-11 items-center gap-3 px-1 text-left text-ui"
                >
                  {i.icon && <i.icon size={17} weight="duotone" className="text-muted" />}
                  {i.label}
                </button>
              ),
            )
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuth("sign-up");
              }}
              className="btn-metal h-12 rounded-full text-ui font-medium"
            >
              Create a free account
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuth("sign-in");
              }}
              className="h-12 rounded-full text-ui font-medium shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-fg)_17%,transparent)]"
            >
              Sign in
            </button>
          </>
        )}
      </div>
      <p className="mt-8 text-meta text-subtle">
        {TEMPLATES.length} templates, {SECTIONS.length} sections. <Link href="/pro" onClick={onClose} className="text-fg underline-offset-2 hover:underline">Pro is $149 once.</Link>
      </p>
    </motion.div>
  );
}

/*
 * The strip of news above the header, in the hero's light: what's new, a link to it, and a way to
 * close it for good. Closed, it's marked on <html> (see announce-script.ts), so it stays gone from
 * the first paint on.
 */
function Announcement() {
  const close = () => {
    try {
      localStorage.setItem(ANNOUNCE_KEY, "1");
    } catch {}
    document.documentElement.dataset.announce = "off";
  };
  return (
    <div className="bd-announce bd-light bd-strip relative max-sm:hidden">
      <Link href="/whats-new" className="group mx-auto flex h-10 max-w-full items-center justify-center gap-2.5 px-12 text-meta">
        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium leading-none text-brand-ink">New</span>
        <span className="truncate">basedraft UI: our own components, free, one file each.</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium max-sm:hidden">
          What&apos;s new <ArrowRightIcon weight="regular" size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </Link>
      <button type="button" onClick={close} aria-label="Dismiss announcement" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full opacity-70 transition-[opacity,background-color] hover:bg-paper-ink/[0.06] hover:opacity-100">
        <XIcon weight="regular" size={13} />
      </button>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  // On every page the header is a plain bar at the top that gathers into a capsule as you scroll.
  const scrolled = useScrolled();
  // The bar at the top of the page, and the capsule it gathers into: the same element, so the change animates.
  const bar = cn(
    "mx-auto items-center rounded-full border transition-[max-width,height,background-color,border-color,box-shadow,padding] duration-500 ease-[var(--bd-ease)]",
    scrolled ? "border-line-subtle bg-canvas/75 shadow-[0_1px_2px_rgb(var(--bd-shade)/0.03),0_6px_20px_-14px_rgb(var(--bd-shade)/0.14)] backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent shadow-none",
  );
  const width = { maxWidth: scrolled ? 1248 : "calc(100vw - 24px)" };
  // A new page, or a window grown past phone size, closes the phone menu.
  const [seen, setSeen] = useState(path);
  if (seen !== path) {
    setSeen(path);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const wide = matchMedia("(min-width: 1024px)");
    const close = () => wide.matches && setOpen(false);
    wide.addEventListener("change", close);
    document.documentElement.style.overflow = "hidden";
    return () => {
      wide.removeEventListener("change", close);
      document.documentElement.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <Announcement />
      <header className={cn("sticky top-0 z-40 px-3 transition-[padding] duration-500 ease-[var(--bd-ease)] sm:px-4", scrolled ? "pt-3" : "pt-1")}>
        {/* Desktop: three columns, so the tabs sit in the true middle however wide either side is. */}
        <div className={cn(bar, "hidden grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] gap-4 px-2 lg:grid", scrolled ? "h-14" : "h-16")} style={width}>
          <Link href="/" aria-label="basedraft home" className="ml-3 justify-self-start rounded-full">
            <BaseDraftLogo />
          </Link>
          <NavTabs />
          <div className="flex items-center gap-1 justify-self-end">
            <SearchButton />
            <ColorModeToggle />
            <Account />
          </div>
        </div>
        {/* Phone: the menu, the logo in the middle, light and dark. */}
        <div className={cn(bar, "grid grid-cols-[40px_1fr_40px] px-1.5 lg:hidden", scrolled ? "h-[52px]" : "h-14")} style={width}>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="phone-menu" className="grid size-10 place-items-center rounded-full hover:bg-surface-2">
            {open ? <XIcon weight="regular" size={20} /> : <ListIcon weight="duotone" size={20} />}
          </button>
          <Link href="/" aria-label="basedraft home" className="justify-self-center">
            <BaseDraftLogo />
          </Link>
          <ColorModeToggle />
        </div>
      </header>
      <AnimatePresence>{open && <PhoneMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

/** For the library's sidebar on phones, and anywhere a compact "Pro" chip fits. */
export function ProChip() {
  return (
    <button type="button" onClick={() => openPro("plan")} className={cn(btnSm.outline, "gap-2")}>
      <DiamondIcon size={14} weight="duotone" /> Get Pro <ProBadge>$149</ProBadge>
    </button>
  );
}
