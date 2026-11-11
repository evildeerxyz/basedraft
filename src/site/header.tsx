"use client";

import { AppWindowIcon, ArrowRightIcon, ArrowUpRightIcon, BookOpenTextIcon, CaretDownIcon, ListIcon, MagnifyingGlassIcon, PackageIcon, PenNibIcon, SignOutIcon, SquaresFourIcon, StackIcon, UserCircleIcon, XIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { COMPONENTS, isNew, REPO } from "@/registry";
import { SCREENS } from "@/screens";
import { ANNOUNCE_KEY } from "./announce-script";
import { AccountHeader, Avatar, displayName, openAuth, openProfile, signOut, useAuth } from "./auth";
import { ClaudeMark } from "./claude-mark";
import { ThemeMenu } from "./color-mode";
import { openCommand } from "./command";
import { Keys } from "./keys";
import { SECTIONS, TEMPLATES, templateLogo } from "./live";
import { BaseDraftLogo } from "./logo";
import { Menu, type MenuItem } from "./menu";
import { TipButton } from "./tip";

/*
 * The top of every page: the logo on the left, the site's places in the middle (Templates and
 * Components each open a menu of what's under them), and search, light and dark, and your account
 * on the right. At the top of the page it's a plain
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

/*
 * The site's places, grouped. Templates and Components each open a menu: the sites themselves and
 * what's built from them, or the library and what's made of it. Studio and Pricing are plain links.
 */
type Place = { href: string; label: string; line: string; icon: Icon | typeof ClaudeMark };
type Group = { id: string; label: string; href: string; under: string[] };

const GROUPS: Group[] = [
  { id: "templates", label: "Templates", href: "/templates", under: ["/templates", "/blocks"] },
  { id: "components", label: "Components", href: "/components", under: ["/components", "/screens"] },
];
const LINKS = [{ href: "/studio", label: "Studio" }];

const BUILD: Place[] = [
  { href: "/blocks", label: "Blocks", line: `All ${SECTIONS.length} sections from the sites, live at any width.`, icon: SquaresFourIcon },
  { href: "/studio", label: "Studio", line: "Rearrange and rewrite a site on the real thing, free.", icon: PenNibIcon },
];
const LIBRARY: Place[] = [
  { href: "/components", label: "Components", line: `${COMPONENTS.length} React components, one npm package.`, icon: StackIcon },
  { href: "/screens", label: "Screens", line: `${SCREENS.length === 1 ? "A whole app page" : `${SCREENS.length} whole app pages`} made of them.`, icon: AppWindowIcon },
  { href: "/components/get-started", label: "Get started", line: "The package, the styles, the first one.", icon: BookOpenTextIcon },
  { href: "/llms.txt", label: "For Claude Code", line: "The guide an agent reads, in one file.", icon: ClaudeMark },
];
/* The newest components, the newest day first. */
const JUST_ADDED = COMPONENTS.filter(isNew)
  .sort((a, b) => (b.added ?? "").localeCompare(a.added ?? "") || a.title.localeCompare(b.title))
  .slice(0, 5);

/* The phone's menu: the same groups, as lists. */
const PHONE: Array<{ label: string; links: Array<{ href: string; label: string }> }> = [
  { label: "Templates", links: [{ href: "/templates", label: "All templates" }, ...BUILD] },
  { label: "Components", links: LIBRARY.slice(0, 3) },
  { label: "", links: [{ href: REPO, label: "GitHub" }] },
];

/** The libraries: components, screens and blocks. */
export const isLibrary = (path: string) => /^\/(components|screens|blocks)(\/|$)/.test(path);

export const accountItems = (): MenuItem[] => [
  { label: "Profile", icon: UserCircleIcon, onSelect: openProfile },
  { label: "Open Studio", icon: PenNibIcon, href: "/studio" },
  { label: "Your drafts", icon: PackageIcon, href: "/studio#library" },
  "divider",
  { label: "Sign out", icon: SignOutIcon, onSelect: signOut },
];

/* ---------- the header ---------- */

const under = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** A menu's row: an icon in a tile, its name and one line, the whole of it a link. */
function PlaceRow({ p, onGo }: { p: Place; onGo: () => void }) {
  const I = p.icon;
  return (
    <Link href={p.href} onClick={onGo} className="group/row flex items-start gap-3 rounded-[14px] p-2.5 outline-none transition-colors hover:bg-fg/[0.045] focus-visible:bg-fg/[0.045]">
      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line)]">
        <I size={16} weight="duotone" />
      </span>
      <span className="min-w-0 pt-px">
        <span className="block text-ui font-medium text-fg">{p.label}</span>
        <span className="mt-0.5 block text-meta leading-snug text-muted">{p.line}</span>
      </span>
    </Link>
  );
}

/** A menu's small heading. */
const MenuHead = ({ children }: { children: ReactNode }) => <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-subtle">{children}</p>;

/** The foot of a menu: a line about it, and the way to all of it. */
function MenuFoot({ text, href, label, onGo }: { text: ReactNode; href: string; label: string; onGo: () => void }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-4 border-t border-line-subtle px-4 pb-1.5 pt-3 text-meta">
      <span className="text-muted">{text}</span>
      <Link href={href} onClick={onGo} className="group/foot inline-flex items-center gap-1.5 font-medium text-fg outline-none hover:underline focus-visible:underline">
        {label}
        <ArrowRightIcon weight="regular" size={12} className="transition-transform duration-200 group-hover/foot:translate-x-0.5" />
      </Link>
    </div>
  );
}

/** What the Templates menu holds: the sites, by their marks, and what's built from them. */
function TemplatesMenu({ onGo }: { onGo: () => void }) {
  return (
    <div className="w-[680px]">
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2">
        <div>
          <MenuHead>The sites</MenuHead>
          {TEMPLATES.map((t) => (
            <Link key={t.slug} href={`/templates/${t.slug}`} onClick={onGo} className="flex items-start gap-3 rounded-[14px] p-2.5 outline-none transition-colors hover:bg-fg/[0.045] focus-visible:bg-fg/[0.045]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={templateLogo(t.slug)} alt="" width={36} height={36} className="size-9 shrink-0 rounded-[11px] shadow-[var(--bd-shadow-resting)]" />
              <span className="min-w-0 flex-1 pt-px">
                <span className="flex items-center gap-2">
                  <span className="text-ui font-medium text-fg">{t.name}</span>
                  <span className="text-meta text-subtle">{t.category}</span>
                </span>
                <span className="mt-0.5 block text-meta leading-snug text-muted">{t.tagline}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="rounded-[16px] bg-fg/[0.025] p-1">
          <MenuHead>Built from them</MenuHead>
          {BUILD.map((p) => (
            <PlaceRow key={p.href} p={p} onGo={onGo} />
          ))}
        </div>
      </div>
      <MenuFoot text={`${TEMPLATES.length} complete sites, in Next.js and Astro.`} href="/templates" label="All templates" onGo={onGo} />
    </div>
  );
}

/** What the Components menu holds: the library and what's made of it, and what was just added. */
function ComponentsMenu({ onGo }: { onGo: () => void }) {
  return (
    <div className="w-[640px]">
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2">
        <div>
          <MenuHead>basedraft UI</MenuHead>
          {LIBRARY.map((p) => (
            <PlaceRow key={p.href} p={p} onGo={onGo} />
          ))}
        </div>
        <div className="rounded-[16px] bg-fg/[0.025] p-1">
          <MenuHead>Just added</MenuHead>
          {JUST_ADDED.map((c) => (
            <Link key={c.name} href={`/components/${c.name}`} onClick={onGo} className="flex h-10 items-center gap-2.5 rounded-[12px] px-2.5 text-ui outline-none transition-colors hover:bg-fg/[0.045] focus-visible:bg-fg/[0.045]">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-fg/30" />
              <span className="min-w-0 flex-1 truncate text-fg">{c.title}</span>
              <span className="text-meta text-subtle">{c.group}</span>
            </Link>
          ))}
        </div>
      </div>
      <MenuFoot text="One npm package, @basedraft/ui." href="/whats-new" label="What's new" onGo={onGo} />
    </div>
  );
}

const MENUS: Record<string, (p: { onGo: () => void }) => ReactNode> = { templates: TemplatesMenu, components: ComponentsMenu };

/**
 * The site's places: Templates and Components open their menus under them, after a short beat
 * when pointed at, or at once when pressed; moving to the other one swaps the menu straight away,
 * and leaving both closes it after a moment, so the pointer can cross the gap. The arrow keys open
 * a menu from its name and walk it; Escape closes it. Where you are wears a short ink line.
 */
function NavTabs() {
  const path = usePathname();
  const id = useId();
  const [hover, setHover] = useState<string | null>(null);
  // The open menu, with the page it was opened on: on another page it's closed.
  const [menu, setMenu] = useState<{ id: string; path: string } | null>(null);
  const open = menu?.path === path ? menu.id : null;
  const setOpen = (id: string | null) => setMenu(id ? { id, path } : null);
  const nav = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !nav.current?.contains(e.target as Node) && setMenu(null);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      nav.current?.querySelector<HTMLElement>(`[data-menu="${open}"]`)?.focus();
      setMenu(null);
    };
    addEventListener("pointerdown", away);
    addEventListener("keydown", esc);
    return () => {
      removeEventListener("pointerdown", away);
      removeEventListener("keydown", esc);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const close = () => setOpen(null);
  // Down from a menu's name opens it and goes to its first link; up and down then walk its links.
  const keys = (e: ReactKeyboardEvent, g?: string) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const panel = nav.current?.querySelector<HTMLElement>("[data-menu-panel]");
    if (g && open !== g) {
      e.preventDefault();
      setOpen(g);
      requestAnimationFrame(() => nav.current?.querySelector<HTMLElement>("[data-menu-panel] a")?.focus());
      return;
    }
    if (!panel) return;
    e.preventDefault();
    const all = [...panel.querySelectorAll<HTMLElement>("a")];
    const at = all.indexOf(document.activeElement as HTMLElement);
    all[(at + (e.key === "ArrowDown" ? 1 : -1) + all.length) % all.length]?.focus();
  };
  const item = "relative flex h-9 items-center gap-1 px-3.5 text-ui outline-none transition-colors duration-200";
  const mark = <motion.span layoutId="nav-mark" aria-hidden className="absolute bottom-0.5 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-fg" transition={{ type: "spring", stiffness: 420, damping: 34 }} />;
  const glow = (key: string) => hover === key && <motion.span layoutId="nav-hover" aria-hidden className="absolute inset-0 rounded-full bg-fg/[0.05]" transition={{ type: "spring", stiffness: 520, damping: 44 }} />;
  const Panel = open ? MENUS[open] : null;
  return (
    <LayoutGroup id={id}>
      <nav
        ref={nav}
        aria-label="Main"
        className="relative flex items-center"
        onPointerEnter={() => clearTimeout(timer.current)}
        onPointerLeave={() => {
          setHover(null);
          later(close, 160);
        }}
        onKeyDown={(e) => keys(e)}
      >
        {GROUPS.map((g) => {
          const on = g.under.some((h) => under(path, h));
          return (
            <button
              key={g.id}
              type="button"
              data-menu={g.id}
              aria-expanded={open === g.id}
              aria-haspopup="true"
              onPointerEnter={() => {
                setHover(g.id);
                if (open) setOpen(g.id);
                else later(() => setOpen(g.id), 90);
              }}
              onClick={() => setOpen(open === g.id ? null : g.id)}
              onKeyDown={(e) => {
                e.stopPropagation();
                keys(e, g.id);
              }}
              onFocus={() => setHover(g.id)}
              onBlur={() => setHover(null)}
              className={cn(item, on || open === g.id ? "text-fg" : "text-muted hover:text-fg", on && "font-medium")}
            >
              {glow(g.id)}
              <span className="relative">{g.label}</span>
              <CaretDownIcon weight="bold" size={10} aria-hidden className={cn("relative mt-px opacity-50 transition-transform duration-200", open === g.id && "rotate-180")} />
              {on && mark}
            </button>
          );
        })}
        {LINKS.map((n) => {
          const on = under(path, n.href);
          return (
            <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} onPointerEnter={() => (setHover(n.href), later(close, 160))} onFocus={() => setHover(n.href)} onBlur={() => setHover(null)} className={cn(item, on ? "font-medium text-fg" : "text-muted hover:text-fg")}>
              {glow(n.href)}
              <span className="relative">{n.label}</span>
              {on && mark}
            </Link>
          );
        })}
        {/* basedraft is open source: its code, on GitHub, in a tab of its own. */}
        <a href={REPO} target="_blank" rel="noreferrer" onPointerEnter={() => (setHover(REPO), later(close, 160))} onFocus={() => setHover(REPO)} onBlur={() => setHover(null)} className={cn(item, "text-muted hover:text-fg")}>
          {glow(REPO)}
          <span className="relative inline-flex items-center gap-1">
            GitHub <ArrowUpRightIcon weight="regular" size={12} className="opacity-60" />
          </span>
        </a>
        {/* The open menu, centered under the places, on a bridge of its own height so the pointer can cross the gap. */}
        <AnimatePresence>
          {Panel && (
            <motion.div
              key="panel"
              data-menu-panel=""
              initial={{ opacity: 0, y: -6, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.12 } }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
            >
              <div className="origin-top overflow-hidden rounded-[22px] bg-surface p-2 shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div key={open} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                    <Panel onGo={close} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
  const path = usePathname();
  if (loading) return <span className="h-9 w-[200px]" />;
  return (
    <div className="flex items-center gap-2">
      {user ? (
        <>
          <Menu
            key={`a${path}`}
            label="Account"
            align="right"
            buttonClassName="grid size-9 place-items-center rounded-full transition-shadow hover:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.08)] aria-expanded:shadow-[0_0_0_3px_rgb(var(--bd-ink)/0.12)]"
            button={<Avatar name={displayName(user)} size={30} />}
            header={<AccountHeader user={user} />}
            items={accountItems()}
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
  const go = "flex h-14 items-center justify-between border-b border-line text-[22px] tracking-[-0.02em]";
  return (
    <motion.div
      id="phone-menu"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="fixed inset-x-0 bottom-0 top-[72px] z-[60] overflow-y-auto bg-canvas px-5 pb-10 lg:hidden"
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
      {/* The same groups as the menus on a desk: the sites and what's built from them, then the library. */}
      <nav aria-label="Main" className="mt-4">
        {PHONE.map((g) => (
          <div key={g.label} className="pt-6 first:pt-2">
            {g.label && <p className="text-meta text-subtle">{g.label}</p>}
            {g.links.map((n) => (
              <Link key={n.href} href={n.href} onClick={onClose} aria-current={under(path, n.href) ? "page" : undefined} className={cn(go, "font-display", under(path, n.href) ? "text-fg" : "text-fg/75")}>
                {n.label}
                <ArrowRightIcon weight="regular" size={16} className="text-subtle" />
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <p className="mt-8 text-meta text-subtle">The sites</p>
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
      <TipButton size="lg" className="mt-8 w-full" />
      <div className="mt-6 grid gap-2">
        {user ? (
          accountItems()
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
        {TEMPLATES.length} templates, {SECTIONS.length} sections, free and{" "}
        <a href={REPO} target="_blank" rel="noreferrer" className="text-fg underline-offset-2 hover:underline">
          open source
        </a>
        .
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
        <span className="truncate">basedraft is now free and open source: every template, component and screen.</span>
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
  // On the home page it's the capsule from the start, floating over the hero that fills the screen.
  const capsule = scrolled || path === "/";
  // The bar at the top of the page, and the capsule it gathers into: the same element, so the change animates.
  const bar = cn(
    "mx-auto items-center rounded-full border transition-[max-width,height,background-color,border-color,box-shadow,padding] duration-500 ease-[var(--bd-ease)]",
    capsule ? "border-line-subtle bg-canvas/75 shadow-[0_1px_2px_rgb(var(--bd-shade)/0.03),0_6px_20px_-14px_rgb(var(--bd-shade)/0.14)] backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent shadow-none",
  );
  const width = { maxWidth: capsule ? 1248 : "calc(100vw - 24px)" };
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
      <header className={cn("sticky top-0 z-40 px-3 transition-[padding] duration-500 ease-[var(--bd-ease)] sm:px-4", capsule ? "pt-3" : "pt-1")}>
        {/* Desktop: three columns, so the tabs sit in the true middle however wide either side is. */}
        {/* On the home page the capsule is narrower than the card, so it can sit in a pocket cut into the card's top edge (home-card.tsx measures it). */}
        <div data-capsule={path === "/" ? "" : undefined} className={cn(bar, "hidden grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] gap-4 px-2 lg:grid", capsule ? "h-14" : "h-16")} style={path === "/" ? { maxWidth: "min(1100px, calc(100vw - 200px))" } : width}>
          <Link href="/" aria-label="basedraft home" className="ml-3 justify-self-start rounded-full">
            <BaseDraftLogo />
          </Link>
          <NavTabs />
          <div className="flex items-center gap-1 justify-self-end">
            {/* On the home page the search floats at the foot of the screen instead (home-search.tsx). */}
            {path !== "/" && <SearchButton />}
            {/* Buying basedraft's maker a Claude plan, open to everyone: in words where there's room, the mark where there isn't. */}
            <TipButton className="mr-1 max-xl:hidden" />
            <TipButton size="mark" className="xl:hidden" />
            <ThemeMenu />
            <Account />
          </div>
        </div>
        {/* Phone: the menu, the logo in the middle, the theme. */}
        <div className={cn(bar, "grid grid-cols-[40px_1fr_40px] px-1.5 lg:hidden", capsule ? "h-[52px]" : "h-14")} style={width}>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="phone-menu" className="grid size-10 place-items-center rounded-full hover:bg-surface-2">
            {open ? <XIcon weight="regular" size={20} /> : <ListIcon weight="duotone" size={20} />}
          </button>
          <Link href="/" aria-label="basedraft home" className="justify-self-center">
            <BaseDraftLogo />
          </Link>
          <ThemeMenu />
        </div>
      </header>
      <AnimatePresence>{open && <PhoneMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
