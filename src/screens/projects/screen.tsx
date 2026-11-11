"use client";

import { ArchiveIcon, ArrowClockwiseIcon, ArrowUpRightIcon, BookOpenTextIcon, CalendarDotsIcon, ChartLineIcon, ChatCircleIcon, CheckIcon, CoinsIcon, CopyIcon, CreditCardIcon, CubeIcon, DeviceMobileIcon, DotsThreeIcon, EnvelopeSimpleIcon, FolderIcon, FoldersIcon, GearSixIcon, GiftIcon, GitBranchIcon, GlobeHemisphereWestIcon, GlobeSimpleIcon, HouseIcon, LightningIcon, ListIcon, LockKeyIcon, MagnifyingGlassIcon, MegaphoneIcon, NewspaperIcon, PaletteIcon, PlusIcon, PulseIcon, PushPinIcon, RocketLaunchIcon, ShieldCheckIcon, SidebarSimpleIcon, StorefrontIcon, UserPlusIcon, UsersThreeIcon, WarningCircleIcon, XIcon, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccountMenu } from "@/registry/ui/account-menu";
import { Allowance } from "@/registry/ui/allowance";
import { AppSidebar, type SidebarSection, type SidebarView } from "@/registry/ui/app-sidebar";
import { Commit } from "@/registry/ui/commit";
import { DataTable, type DataTableColumn } from "@/registry/ui/data-table";
import { AvatarGroup } from "@/registry/ui/avatar";
import { Breadcrumb } from "@/registry/ui/breadcrumb";
import { Button } from "@/registry/ui/button";
import { Input } from "@/registry/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/registry/ui/menu";
import { Segmented } from "@/registry/ui/segmented";
import { Sparkline } from "@/registry/ui/sparkline";
import { toast } from "@/registry/ui/toast";

/*
 * A workspace's projects, in an app's frame, as one table: each project's name and address, how it
 * stands (ready, building, failed), its last deployment and the commit in it (or why it needs you),
 * its requests this week, when it last changed, who ships it, and a menu. Every column sorts; pick
 * rows, Shift for a range, and an ink bar offers what can be done to them. What needs you comes
 * first and is named over the table. Filter to the pinned ones or the ones that need you, or
 * search. Click a row and the project's page opens beside the table: what's live, what needs you,
 * its traffic, its last releases and who ships it. It fills the box it's in and scrolls inside, so
 * give that box a height, like h-dvh. The toasts need <Toaster /> once in your root layout.
 */

const SECTIONS: SidebarSection[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <HouseIcon weight="duotone" />, href: "/acme" },
      { id: "projects", label: "Projects", icon: <FoldersIcon weight="duotone" />, count: 14, href: "/acme/projects" },
      { id: "deployments", label: "Deployments", icon: <RocketLaunchIcon weight="duotone" />, busy: true, href: "/acme/storefront/deployments" },
      { id: "analytics", label: "Analytics", icon: <ChartLineIcon weight="duotone" />, href: "/acme/storefront/analytics" },
      { id: "roadmap", label: "Roadmap", icon: <CalendarDotsIcon weight="duotone" />, tag: "New", href: "/acme/roadmap" },
    ],
  },
  {
    label: "Pinned",
    action: { label: "Pin a project", onSelect: () => undefined },
    items: [
      { id: "p-storefront", label: "storefront", icon: <FolderIcon weight="duotone" />, dot: true, href: "/acme/storefront" },
      { id: "p-docs", label: "docs", icon: <FolderIcon weight="duotone" />, href: "/acme/docs" },
      { id: "p-api", label: "api", icon: <FolderIcon weight="duotone" />, href: "/acme/api" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "members", label: "Members", icon: <UsersThreeIcon weight="duotone" />, href: "/acme/members" },
      { id: "billing", label: "Usage and billing", icon: <CreditCardIcon weight="duotone" />, href: "/acme/billing" },
      { id: "settings", label: "Settings", icon: <GearSixIcon weight="duotone" />, href: "/acme/settings" },
    ],
  },
];

/* The sidebar's other view: what happened across the workspace, newest first. */
const VIEWS: SidebarView[] = [
  { id: "home", label: "Home" },
  {
    id: "activity",
    label: "Activity",
    sections: [
      {
        label: "Today",
        items: [
          { id: "a-promote", label: "7c2e9a1 is live", icon: <RocketLaunchIcon weight="duotone" />, count: "2m" },
          { id: "a-failed", label: "gift-cards failed", icon: <WarningCircleIcon weight="duotone" />, dot: true },
          { id: "a-comment", label: "Lauren on Checkout", icon: <ChatCircleIcon weight="duotone" />, count: "1h" },
        ],
      },
      {
        label: "Yesterday",
        items: [
          { id: "a-credits", label: "$100 of credits", icon: <CoinsIcon weight="duotone" />, count: "5pm" },
          { id: "a-invite", label: "Tyler Hayes joined", icon: <UserPlusIcon weight="duotone" />, count: "3pm" },
        ],
      },
    ],
  },
];


/** The workspace's logo: basedraft's mark on an ink tile, standing in for yours. */
function Mark() {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-[7px] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]">
      <svg width={16} height={16} viewBox="0 0 40 40" aria-hidden>
        <path d="M6.85547 27.2182V12.6708C6.85547 11.2225 7.81635 9.95166 9.20555 9.56255L22.5167 5.83433C24.5479 5.26541 26.565 6.78215 26.5931 8.89956L26.7742 22.5376C26.7927 23.9328 25.9163 25.1818 24.6017 25.6336L11.1095 30.2712C9.02405 30.9879 6.85547 29.4317 6.85547 27.2182Z" fill="currentColor" />
        <path d="M28.6015 10.8973L16.0958 17.0783L16.0698 17.0949C15.1656 17.6727 14.6078 18.6652 14.5825 19.7411L14.3291 30.5163C14.2766 32.7474 16.4414 34.3571 18.5513 33.6561L31.0303 29.5082C32.3457 29.0709 33.2339 27.8362 33.2339 26.4448V13.7925C33.2339 11.4025 30.7368 9.84189 28.6015 10.8973Z" fill="currentColor" fillOpacity={0.7} />
      </svg>
    </span>
  );
}

/** The app around the page: the sidebar (a drawer where it doesn't fit), and the page on a panel under its header, with room on the panel for an inspector. */
function AppFrame({ page, crumbs, actions, panel, children }: { page: string; crumbs: string[]; actions?: ReactNode; panel?: ReactNode; children: ReactNode }) {
  const [mode, setMode] = useState<"side" | "drawer">("side");
  const [open, setOpen] = useState(false);
  return (
    <div className="@container relative flex h-full min-h-0 bg-[var(--bd-well)] text-[var(--bd-fg)]">
      <AppSidebar
        plain
        contained
        breakpoint={900}
        sections={SECTIONS}
        views={VIEWS}
        active={page}
        workspaces={[
          { id: "acme", name: "Acme", plan: "Team", logo: <Mark /> },
          { id: "personal", name: "Personal", plan: "Hobby" },
        ]}
        defaultWorkspace="acme"
        footer={(rail) => <Allowance label="Build minutes" used={5046} limit={6000} projected={6210} note="Renews Nov 30" compact={rail} className={rail ? "mx-auto" : undefined} />}
        account={(rail) => (
          <AccountMenu
            user={{ name: "Emily Carter", email: "emily@acme.com" }}
            trigger={rail ? "face" : "row"}
            defaultNote="Planning the fourth quarter"
            workspaces={[
              { id: "acme", name: "Acme", role: "Owner", logo: <Mark /> },
              { id: "personal", name: "Personal", role: "Hobby" },
            ]}
            workspace="acme"
            onPreferences={() => undefined}
            onSignOut={() => undefined}
          />
        )}
        onSearch={() => undefined}
        open={open}
        onOpenChange={setOpen}
        onModeChange={setMode}
      />
      <div className="flex min-w-0 flex-1 flex-col @3xl:py-2 @3xl:pr-2">
        <main className="@container/main relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bd-surface)] @3xl:rounded-[14px] @3xl:shadow-[0_0_0_1px_var(--bd-line-subtle),0_1px_3px_rgb(var(--bd-shade)/0.06)]">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--bd-line-subtle)] px-3 @3xl:px-5">
            {mode === "drawer" && (
              <button type="button" onClick={() => setOpen(true)} aria-label="Open the menu" className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.06)]">
                <ListIcon weight="regular" size={17} />
              </button>
            )}
            <span className="min-w-0 @max-xl:hidden">
              <Breadcrumb items={crumbs.map((label, i) => (i < crumbs.length - 1 ? { label, href: `/${crumbs.slice(0, i + 1).join("/").toLowerCase()}` } : { label }))} />
            </span>
            {/* Where there's no room for the trail, the page's name alone. */}
            <span className="truncate text-[13.5px] font-medium @xl:hidden">{crumbs.at(-1)}</span>
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </header>
          {/* The page, and beside it what's opened from it, which pushes the page left as it opens. */}
          <div className="relative flex min-h-0 flex-1">
            {/* It scrolls without a bar, the way an app's page does. */}
            <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
            {panel}
          </div>
        </main>
      </div>
    </div>
  );
}


const DAY = 86_400_000;
const HOUR = 3_600_000;
/* Now is Thursday, Nov 12, at 3pm; the history is the two weeks before it. */
const NOW = Date.UTC(2026, 10, 12, 15, 0);
const FROM = Date.UTC(2026, 9, 30);

/** A small seeded random, so the made-up history is the same on the server and in the browser. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Times across the two weeks, mostly on weekdays and in working hours, as people ship. */
function times(seed: number, n: number) {
  const r = seeded(seed);
  const out: number[] = [];
  for (let tries = 0; out.length < n && tries < 400; tries++) {
    const day = FROM + Math.floor(r() * 14) * DAY;
    const weekend = [0, 6].includes(new Date(day).getUTCDay());
    if (weekend && r() < 0.85) continue;
    const at = day + (9 + r() * 10) * HOUR;
    if (at < NOW - HOUR) out.push(at);
  }
  return out.sort((a, b) => a - b);
}
const sha = (seed: number) => Math.floor(seeded(seed)() * 0xfffffff).toString(16).padStart(7, "0");

/** What needs you: how the lead says it after the name, the row's short note, the page's full account, and what to do. */
type Need = { tone: "stop" | "wait"; lead: string; note: string; long: string; action: string };
type Event = { id: string; at: number; kind: "ship" | "try" | "fail" | "run"; label: string };
type Project = {
  id: string;
  url: string | null;
  framework: string;
  icon: Icon;
  people: string[];
  /** Requests in the last seven days, and the change on the seven before. */
  requests: number | null;
  change?: number;
  ships: number;
  tries: number;
  seed: number;
  fails?: number[];
  running?: boolean;
  pinned?: boolean;
  needs?: Need;
  live?: { message: string; branch: string };
  region: string;
  created: string;
};

const PROJECTS: Project[] = [
  { id: "storefront", url: "acme.com", framework: "Next.js 16", icon: StorefrontIcon, people: ["Jake Morrison", "Sarah Mitchell", "Megan Turner", "Emily Carter"], requests: 1_820_000, change: 12, ships: 9, tries: 16, seed: 11, running: true, pinned: true, live: { message: "Gift card balance on checkout", branch: "main" }, region: "iad1, fra1", created: "Mar 4, 2025" },
  { id: "api", url: "api.acme.com", framework: "Node 22", icon: LightningIcon, people: ["Ryan Brooks", "Tyler Hayes"], requests: 3_140_000, change: 4, ships: 5, tries: 7, seed: 23, fails: [Date.UTC(2026, 10, 10, 16, 20)], pinned: true, needs: { tone: "wait", lead: "'s errors are up 3× since Tuesday", note: "Errors are up 3×", long: "Errors are three times higher since Tuesday's release, mostly timeouts on /v2/orders.", action: "Open logs" }, live: { message: "Paginate orders by cursor", branch: "main" }, region: "iad1", created: "Jan 18, 2025" },
  { id: "gift-cards", url: null, framework: "Next.js 16", icon: GiftIcon, people: ["Megan Turner", "Jake Morrison"], requests: null, ships: 0, tries: 9, seed: 37, fails: [Date.UTC(2026, 10, 12, 13, 5)], needs: { tone: "stop", lead: " failed to build 2h ago", note: "Failed to build 2h ago", long: "The last build failed with 2 type errors in checkout/gift-card.tsx, so its preview is behind main.", action: "See the log" }, region: "iad1", created: "Oct 27, 2026" },
  { id: "docs", url: "docs.acme.com", framework: "Astro 5", icon: BookOpenTextIcon, people: ["Sarah Mitchell", "Lauren Price"], requests: 412_000, change: -3, ships: 4, tries: 6, seed: 41, pinned: true, live: { message: "Webhooks guide for gift cards", branch: "main" }, region: "iad1", created: "Feb 2, 2025" },
  { id: "search", url: "search.acme.com", framework: "Node 22", icon: MagnifyingGlassIcon, people: ["Megan Turner"], requests: 640_000, change: 21, ships: 3, tries: 5, seed: 53, live: { message: "Forgive one typo per word", branch: "main" }, region: "iad1, fra1", created: "Jun 9, 2025" },
  { id: "marketing-site", url: "launch.acme.com", framework: "Astro 5", icon: MegaphoneIcon, people: ["Emily Carter", "Lauren Price"], requests: 96_000, change: 38, ships: 3, tries: 4, seed: 67, live: { message: "Holiday campaign page", branch: "main" }, region: "iad1", created: "Apr 21, 2025" },
  { id: "mobile-web", url: "m.acme.com", framework: "Next.js 16", icon: DeviceMobileIcon, people: ["Jake Morrison"], requests: 210_000, change: 2, ships: 2, tries: 3, seed: 79, live: { message: "Faster product images on 4G", branch: "main" }, region: "iad1", created: "Aug 14, 2025" },
  { id: "admin", url: "admin.acme.com", framework: "Next.js 16", icon: ShieldCheckIcon, people: ["Tyler Hayes", "Ryan Brooks"], requests: 18_400, change: 0, ships: 2, tries: 2, seed: 83, live: { message: "Refunds in two clicks", branch: "main" }, region: "iad1", created: "Mar 30, 2025" },
  { id: "design-system", url: "ui.acme.com", framework: "Storybook 9", icon: PaletteIcon, people: ["Lauren Price", "Sarah Mitchell"], requests: 6_100, change: 9, ships: 4, tries: 3, seed: 97, live: { message: "Hold button for refunds", branch: "main" }, region: "iad1", created: "May 5, 2025" },
  { id: "blog", url: "blog.acme.com", framework: "Astro 5", icon: NewspaperIcon, people: ["Emily Carter"], requests: 74_000, change: -8, ships: 2, tries: 1, seed: 101, live: { message: "Why we moved to fra1", branch: "main" }, region: "iad1", created: "Feb 11, 2025" },
  { id: "auth", url: "auth.acme.com", framework: "Node 22", icon: LockKeyIcon, people: ["Ryan Brooks"], requests: 880_000, change: 1, ships: 1, tries: 2, seed: 113, live: { message: "Passkeys on by default", branch: "main" }, region: "iad1, fra1", created: "Jan 18, 2025" },
  { id: "emails", url: null, framework: "React Email", icon: EnvelopeSimpleIcon, people: ["Lauren Price"], requests: null, ships: 0, tries: 4, seed: 127, region: "iad1", created: "Sep 22, 2025" },
  { id: "cdn-edge", url: "cdn.acme.com", framework: "Worker", icon: GlobeSimpleIcon, people: ["Tyler Hayes"], requests: 9_400_000, change: 6, ships: 1, tries: 0, seed: 131, live: { message: "Cache product images a day", branch: "main" }, region: "Global", created: "Jan 18, 2025" },
  { id: "status-page", url: "status.acme.com", framework: "Astro 5", icon: PulseIcon, people: ["Ryan Brooks"], requests: 41_000, change: -12, ships: 1, tries: 0, seed: 149, live: { message: "Show fra1 on the map", branch: "main" }, region: "iad1", created: "Jul 1, 2025" },
];

/** A project's two weeks: what shipped, what was tried, what failed, and what's building now. */
function eventsOf(p: Project): Event[] {
  return [
    ...times(p.seed, p.ships).map((at, i) => ({ id: `${p.id}-s${i}`, at, kind: "ship" as const, label: `Released ${sha(p.seed * 31 + i)}` })),
    ...times(p.seed * 7 + 3, p.tries).map((at, i) => ({ id: `${p.id}-t${i}`, at, kind: "try" as const, label: `Preview ${sha(p.seed * 17 + i)}` })),
    ...(p.fails ?? []).map((at, i) => ({ id: `${p.id}-f${i}`, at, kind: "fail" as const, label: "Build failed" })),
    ...(p.running ? [{ id: `${p.id}-run`, at: NOW, kind: "run" as const, label: "Building now" }] : []),
  ].sort((a, b) => a.at - b.at);
}
const EVENTS = Object.fromEntries(PROJECTS.map((p) => [p.id, eventsOf(p)]));
const lastOf = (p: Project) => EVENTS[p.id].reduce((m, e) => Math.max(m, e.at), 0);
const lastShipOf = (p: Project) => EVENTS[p.id].reduce((m, e) => (e.kind === "ship" ? Math.max(m, e.at) : m), lastOf(p) - 30 * DAY);
/** What needs you first, then the pinned, then the rest by their latest release. */
const ORDER = [...PROJECTS].sort((a, b) => Number(!!b.needs) - Number(!!a.needs) || Number(!!b.pinned) - Number(!!a.pinned) || lastShipOf(b) - lastShipOf(a));

/** Fourteen days of a project's requests: weekdays busier than weekends, its own wobble. */
function trafficOf(p: Project) {
  if (!p.requests) return [];
  const r = seeded(p.seed * 3);
  return Array.from({ length: 14 }, (_, i) => {
    const weekend = [0, 6].includes(new Date(FROM + i * DAY).getUTCDay());
    const base = (p.requests! / 7) * (weekend ? 0.72 : 1.1);
    return Math.round(base * (0.86 + r() * 0.28) * (1 + ((p.change ?? 0) / 100) * (i / 13)));
  });
}

const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const ago = (t: number) => {
  const h = (NOW - t) / HOUR;
  if (h < 1) return "Just now";
  if (h < 24) return `${Math.round(h)}h ago`;
  if (h < 48) return "Yesterday";
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};

const TONE = { stop: "bg-[var(--bd-ui-stop)]", wait: "bg-[var(--bd-ui-wait)]" } as const;

/** A project's mark: its icon on a quiet tile, with a dot at the corner when it needs you. */
function Tile({ p, size = "md" }: { p: Project; size?: "md" | "lg" }) {
  return (
    <span className={`relative grid shrink-0 place-items-center bg-[var(--bd-raised)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_1px_2px_rgb(var(--bd-shade)/0.06)] ${size === "lg" ? "size-11 rounded-[12px] [&_svg]:size-[22px]" : "size-8 rounded-[9px] [&_svg]:size-[17px]"}`}>
      <p.icon weight="duotone" aria-hidden />
      {p.needs && <span aria-hidden className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full shadow-[0_0_0_2px_var(--bd-surface)] ${TONE[p.needs.tone]}`} />}
    </span>
  );
}

/** A name in the lead's sentence that opens its project. */
function Named({ p, onOpen }: { p: Project; onOpen: (id: string) => void }) {
  return (
    <button type="button" onClick={() => onOpen(p.id)} className="font-medium text-[var(--bd-fg)] underline decoration-[rgb(var(--bd-ink)/0.2)] underline-offset-[5px] transition-colors hover:decoration-[var(--bd-fg)]">
      {p.id}
    </button>
  );
}

/** A quiet button that copies an address, with a check for a moment once it has. */
function CopyAddress({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setDone(false), 1400);
    return () => window.clearTimeout(t);
  }, [done]);
  return (
    <button type="button" onClick={() => void navigator.clipboard?.writeText(`https://${url}`).then(() => setDone(true))} aria-label={done ? "Copied" : `Copy ${url}`} className="grid size-7 place-items-center rounded-full text-[var(--bd-subtle)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]">
      {done ? <CheckIcon weight="bold" className="size-3.5 text-[var(--bd-fg)]" /> : <CopyIcon weight="regular" className="size-3.5" />}
    </button>
  );
}

/** Under a small title, rows ruled by hairlines. */
function Ruled({ title, end, children }: { title: string; end?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h3 className="text-[12.5px] font-medium text-[var(--bd-muted)]">{title}</h3>
        {end}
      </div>
      <div className="divide-y divide-[var(--bd-line-subtle)] border-y border-[var(--bd-line-subtle)]">{children}</div>
    </section>
  );
}

const KIND = {
  ship: "h-3.5 w-[3px] rounded-full bg-[var(--bd-fg)]",
  try: "h-2.5 w-[2px] rounded-full bg-[rgb(var(--bd-ink)/0.3)]",
  fail: "size-[7px] rounded-full bg-[var(--bd-ui-stop)]",
  run: "size-[8px] rounded-full border-2 border-[var(--bd-fg)]",
} as const;

/**
 * A project's page, beside the list: its name and address, what needs you, what's live, how it's
 * set up, its traffic, its last releases and who ships it, with a way into the project at its foot.
 */
function ProjectPage({ p, onClose }: { p: Project; onClose: () => void }) {
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => head.current?.focus({ preventScroll: true }), [p.id]);
  const events = [...EVENTS[p.id]].reverse().slice(0, 5);
  const traffic = trafficOf(p);
  const lastShip = [...EVENTS[p.id]].reverse().find((e) => e.kind === "ship");
  const soon = (what: string) => toast(what, { description: `In your app this opens ${p.id}'s own page.` });
  const specs: Array<[Icon, string, ReactNode]> = [
    [CubeIcon, "Framework", p.framework],
    [GlobeHemisphereWestIcon, "Regions", p.region],
    [UsersThreeIcon, "People", (
      <span key="people" className="flex items-center justify-end gap-2.5">
        <AvatarGroup people={p.people.map((name) => ({ name }))} max={3} size="sm" />
        <span className="tabular-nums">{p.people.length}</span>
      </span>
    )],
    [CalendarDotsIcon, "Created", p.created],
  ];
  return (
    <motion.div
      aria-labelledby="project-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented) {
          e.preventDefault();
          onClose();
        }
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <header className="flex items-center gap-3 border-b border-[var(--bd-line-subtle)] px-5 py-4">
        <Tile p={p} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 id="project-title" ref={head} tabIndex={-1} className="truncate text-[17px] font-semibold tracking-[-0.012em] outline-none">
            {p.id}
          </h2>
          <p className="flex min-w-0 items-center gap-1 text-[13px] text-[var(--bd-muted)]">
            {p.url ? (
              <>
                <span className="truncate font-mono text-[12.5px]">{p.url}</span>
                <CopyAddress url={p.url} />
              </>
            ) : (
              "Previews only, not in production yet"
            )}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 grid size-8 shrink-0 place-items-center self-start rounded-full text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]">
          <XIcon weight="regular" className="size-4" />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 content-start gap-7 overflow-y-auto px-5 pb-6 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* What needs you, first, when something does. */}
        {p.needs && (
          <div className="grid gap-3 rounded-[14px] bg-[rgb(var(--bd-ink)/0.035)] p-4 shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.05)]">
            <p className="flex items-start gap-2.5 text-[14px] leading-relaxed">
              <WarningCircleIcon weight="duotone" aria-hidden className={`mt-[3px] size-[18px] shrink-0 ${p.needs.tone === "stop" ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-ui-wait)]"}`} />
              {p.needs.long}
            </p>
            <Button variant="outline" size="sm" className="justify-self-start" onClick={() => toast(p.needs!.action, { description: `In your app this opens ${p.id}'s logs.` })}>
              {p.needs.action}
            </Button>
          </div>
        )}

        {/* What's live. */}
        {p.live && lastShip ? (
          <section aria-label="Live now" className="grid gap-3">
            <h3 className="text-[12.5px] font-medium text-[var(--bd-muted)]">Live now</h3>
            <Commit layout="stack" message={p.live.message} sha={`${sha(p.seed * 31 + EVENTS[p.id].filter((e) => e.kind === "ship").length - 1)}e1c4b29a0f3d`} branch={p.live.branch} author={p.people[0]} time={ago(lastShip.at)} />
          </section>
        ) : (
          <p className="text-[14px] leading-relaxed text-[var(--bd-muted)]">Nothing is live yet. Its previews build on every push; promote one when it&apos;s ready.</p>
        )}

        {/* Traffic, when it has any. */}
        {traffic.length > 0 && (
          <section aria-label="Traffic" className="grid gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[12.5px] font-medium text-[var(--bd-muted)]">Requests, 7 days</h3>
              <span className="text-[12.5px] tabular-nums text-[var(--bd-muted)]">{p.change ? `${p.change > 0 ? "Up" : "Down"} ${Math.abs(p.change)}% on the week before` : "Level with the week before"}</span>
            </div>
            <p className="text-[28px] font-semibold leading-none tracking-[-0.025em] tabular-nums">{compact(p.requests!)}</p>
            <Sparkline data={traffic} height={56} color="var(--bd-fg)" label={`${p.id} requests, last 14 days`} />
          </section>
        )}

        <Ruled title="Project">
          {specs.map(([I, k, v]) => (
            <div key={k} className="flex min-h-11 items-center justify-between gap-4 py-2">
              <span className="flex items-center gap-3 text-[13px] text-[var(--bd-muted)]">
                <I weight="duotone" aria-hidden className="size-4 shrink-0 text-[var(--bd-subtle)]" />
                {k}
              </span>
              <span className="min-w-0 truncate text-right text-[13.5px]">{v}</span>
            </div>
          ))}
        </Ruled>

        <Ruled title="Lately" end={<span className="text-[12px] text-[var(--bd-subtle)]">Two weeks</span>}>
          {events.length ? (
            events.map((e) => (
              <div key={e.id} className="flex min-h-11 items-center gap-3 py-2 text-[13.5px]">
                <span className="grid size-4 shrink-0 place-items-center" aria-hidden>
                  <span className={KIND[e.kind]} />
                </span>
                <span className={`min-w-0 flex-1 truncate ${e.kind === "fail" ? "text-[var(--bd-ui-stop)]" : ""}`}>{e.label}</span>
                <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--bd-subtle)]">{e.kind === "run" ? "Now" : ago(e.at)}</span>
              </div>
            ))
          ) : (
            <p className="py-3 text-[13.5px] text-[var(--bd-muted)]">Nothing in two weeks.</p>
          )}
        </Ruled>
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-[var(--bd-line-subtle)] px-5 py-3">
        {p.url && (
          <Button variant="ghost" size="sm" onClick={() => toast(`Opening ${p.url}`, { description: "In your app this opens in a new tab." })}>
            Visit <ArrowUpRightIcon weight="regular" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => soon("Settings")}>
          Settings
        </Button>
        <Button size="sm" onClick={() => soon("Open project")}>
          Open project
        </Button>
      </footer>
    </motion.div>
  );
}

/* The side panel's width, open. */
const SIDE = 440;

/**
 * Where an opened deployment shows, at the page's right. It opens by widening from nothing, so on a
 * wide screen the page eases left to make room, and on a narrow one, with no room to share, it lies
 * over the page instead. What's in it keeps its full width throughout, held to the right, so it
 * slides in rather than squeezes.
 */
function Side({ label, children }: { label: string; children: ReactNode }) {
  const still = useReducedMotion();
  return (
    <motion.aside
      aria-label={label}
      initial={{ width: 0 }}
      animate={{ width: SIDE }}
      exit={{ width: 0 }}
      transition={still ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 40, mass: 0.9 }}
      className="relative h-full max-w-full shrink-0 overflow-hidden border-l border-[var(--bd-line-subtle)] bg-[var(--bd-surface)] @max-4xl/main:absolute @max-4xl/main:inset-y-0 @max-4xl/main:right-0 @max-4xl/main:z-20 @max-4xl/main:border-l-0 @max-4xl/main:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),-24px_0_48px_-24px_rgb(var(--bd-shade)/0.4)]"
    >
      <div className="absolute inset-y-0 right-0 w-[min(440px,100cqw)]">{children}</div>
    </motion.aside>
  );
}


/** How a project stands now: a dot and a word, and its place when sorting by it, worst first. */
function lookOf(p: Project) {
  if (p.needs?.tone === "stop") return { dot: "bg-[var(--bd-ui-stop)]", word: "Failed", live: false, rank: 0 };
  if (p.needs) return { dot: "bg-[var(--bd-ui-wait)]", word: "Errors", live: false, rank: 1 };
  if (p.running) return { dot: "bg-[var(--bd-ui-wait)]", word: "Building", live: true, rank: 2 };
  if (p.url) return { dot: "bg-[var(--bd-ui-ok)]", word: "Ready", live: false, rank: 3 };
  return { dot: "bg-[var(--bd-subtle)]", word: "Previews", live: false, rank: 4 };
}

/** A project's state: a dot and its word. The dot breathes while it builds. */
function Status({ p }: { p: Project }) {
  const still = useReducedMotion();
  const look = lookOf(p);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13.5px]">
      <span className="relative grid size-2 shrink-0 place-items-center">
        {look.live && !still && <motion.span className={`absolute inset-0 rounded-full ${look.dot}`} animate={{ scale: [1, 2.4], opacity: [0.5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }} />}
        <span className={`relative size-2 rounded-full ${look.dot}`} />
      </span>
      {look.word}
    </span>
  );
}

const lastShipEvent = (p: Project) => [...EVENTS[p.id]].reverse().find((e) => e.kind === "ship");
const shaOf = (p: Project) => sha(p.seed * 31 + EVENTS[p.id].filter((e) => e.kind === "ship").length - 1);

/** What a project can do, in its row's menu. */
function RowMenu({ p, onOpen }: { p: Project; onOpen: (id: string) => void }) {
  const say = (what: string, description: string) => () => toast(what, { description });
  return (
    <Menu>
      <MenuTrigger aria-label={`More for ${p.id}`} className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.07)] hover:text-[var(--bd-fg)] aria-expanded:bg-[rgb(var(--bd-ink)/0.07)]">
        <DotsThreeIcon weight="bold" className="size-4" />
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem icon={<SidebarSimpleIcon weight="duotone" />} onSelect={() => onOpen(p.id)}>
          Open beside the list
        </MenuItem>
        {p.url && (
          <MenuItem icon={<ArrowUpRightIcon weight="regular" />} onSelect={say(`Opening ${p.url}`, "In your app this opens in a new tab.")}>
            Visit {p.url}
          </MenuItem>
        )}
        <MenuItem icon={<ArrowClockwiseIcon weight="regular" />} onSelect={say(`Redeploying ${p.id}`, "Production builds again from main.")}>
          Redeploy
        </MenuItem>
        <MenuItem icon={<PushPinIcon weight="duotone" />} onSelect={say(p.pinned ? `Unpinned ${p.id}` : `Pinned ${p.id}`, "The sidebar shows your pinned projects.")}>
          {p.pinned ? "Unpin" : "Pin to the sidebar"}
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<GearSixIcon weight="duotone" />} onSelect={say("Settings", `In your app this opens ${p.id}'s settings.`)}>
          Settings
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/* The columns that step out first when there's no room for them, in order. */
const OUT = ["people", "updated", "requests", "last", "status"];

/** The table's columns: what each shows, and how it sorts. */
const columnsFor = (onOpen: (id: string) => void): DataTableColumn<Project>[] => [
  {
    key: "project",
    header: "Project",
    width: "220px",
    sortBy: (p) => p.id,
    cell: (p) => (
      <span className="flex w-[188px] min-w-0 items-center gap-3 normal-nums">
        <Tile p={p} />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium">{p.id}</span>
          <span className="block truncate text-[12.5px] font-normal text-[var(--bd-muted)]">{p.url ?? "Previews only"}</span>
        </span>
      </span>
    ),
  },
  { key: "status", header: "Status", width: "120px", sortBy: (p) => lookOf(p).rank, cell: (p) => <Status p={p} /> },
  {
    key: "last",
    header: "Last deployment",
    cell: (p) => {
      const last = lastShipEvent(p);
      return (
        // No width of its own (w-0), then all the room the other columns leave (min-w-full): this
        // column gives way first, truncating, so the table never has to be wider than its box.
        <span className="block w-0 min-w-full normal-nums">
          {p.needs ? (
            <>
              <span className={`block truncate text-[13.5px] ${p.needs.tone === "stop" ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-ui-wait)]"}`}>{p.needs.tone === "stop" ? "Build failed with 2 type errors" : "Errors up 3× since Tuesday"}</span>
              <span className="block truncate font-mono text-[12px] text-[var(--bd-subtle)]">{p.needs.tone === "stop" ? "main · checkout/gift-card.tsx" : `main · ${shaOf(p)}`}</span>
            </>
          ) : p.live && last ? (
            <>
              <span className="block truncate text-[13.5px]">{p.live.message}</span>
              <span className="flex items-center gap-1.5 truncate font-mono text-[12px] text-[var(--bd-subtle)]">
                <GitBranchIcon weight="regular" aria-hidden className="size-3 shrink-0" />
                {p.live.branch} · {shaOf(p)}
              </span>
            </>
          ) : (
            <>
              <span className="block truncate text-[13.5px] text-[var(--bd-muted)]">No release yet</span>
              <span className="block truncate text-[12px] text-[var(--bd-subtle)]">{EVENTS[p.id].filter((e) => e.kind === "try").length} previews built</span>
            </>
          )}
        </span>
      );
    },
  },
  {
    key: "requests",
    header: "Requests, 7d",
    align: "end",
    width: "136px",
    sortBy: (p) => p.requests ?? -1,
    cell: (p) =>
      p.requests ? (
        <span className="inline-flex items-baseline justify-end gap-2 whitespace-nowrap">
          <span className="text-[13.5px]">{compact(p.requests)}</span>
          <span className={`w-11 text-right text-[12px] ${p.change && p.change < -5 ? "text-[var(--bd-ui-wait)]" : "text-[var(--bd-subtle)]"}`}>{p.change ? `${p.change > 0 ? "+" : "−"}${Math.abs(p.change)}%` : "0%"}</span>
        </span>
      ) : (
        <span className="text-[13.5px] text-[var(--bd-subtle)]">None</span>
      ),
  },
  { key: "updated", header: "Updated", align: "end", width: "112px", sortBy: (p) => lastOf(p), cell: (p) => <span className="whitespace-nowrap text-[13.5px] text-[var(--bd-muted)]">{p.running ? "Building" : ago(lastOf(p))}</span> },
  {
    key: "people",
    header: "People",
    width: "120px",
    sortBy: (p) => p.people.length,
    cell: (p) => <AvatarGroup people={p.people.map((name) => ({ name }))} max={3} size="sm" />,
  },
  { key: "menu", header: <span className="sr-only">Actions</span>, width: "56px", cell: (p) => <RowMenu p={p} onOpen={onOpen} /> },
];

export default function ProjectsScreen() {
  const [show, setShow] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const needing = PROJECTS.filter((p) => p.needs);
  const weekShips = Object.values(EVENTS)
    .flat()
    .filter((e) => e.kind === "ship" && e.at > NOW - 7 * DAY).length;
  const q = query.trim().toLowerCase();
  const shown = ORDER.filter((p) => (show === "pinned" ? p.pinned : show === "needs" ? p.needs : true)).filter((p) => !q || p.id.includes(q) || (p.url ?? "").includes(q));
  const project = PROJECTS.find((p) => p.id === open);
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));
  // The table always fits the space it has, never scrolling sideways: the last deployment takes
  // what's left and truncates, and as the space narrows the columns that matter least step out,
  // people first, then the figures, then the last deployment itself.
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(1176);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setRoom(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // The fixed columns with 220 for the last deployment need 1,028 with everyone, 908 without
  // people, 660 without the figures and 440 without the last deployment; each step keeps 30 spare.
  const stepped = room < 540 ? 5 : room < 690 ? 4 : room < 940 ? 3 : room < 1060 ? 1 : 0;
  const hidden = new Set(OUT.slice(0, stepped));
  const columns = columnsFor(toggle).filter((c) => !hidden.has(c.key));
  const many = (ids: string[]) => (ids.length === 1 ? ids[0] : `${ids.length} projects`);

  return (
    <AppFrame
      page="projects"
      crumbs={["Acme", "Projects"]}
      actions={
        <Button size="sm" onClick={() => toast("New project", { description: "In your app this imports a repository." })}>
          <PlusIcon weight="regular" /> New project
        </Button>
      }
      panel={
        <AnimatePresence initial={false}>
          {project && (
            <Side key="side" label={`${project.id}`}>
              <ProjectPage key={project.id} p={project} onClose={() => setOpen(null)} />
            </Side>
          )}
        </AnimatePresence>
      }
    >
      <div className="@container/page mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(0,1fr)] gap-6 px-4 pb-16 pt-8 @2xl:px-8 @2xl:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="grid gap-1.5">
            <h1 className="flex items-baseline gap-2.5 text-[26px] font-semibold leading-tight tracking-[-0.025em]">
              Projects <span className="text-[17px] font-medium tabular-nums text-[var(--bd-subtle)]">{PROJECTS.length}</span>
            </h1>
            <p className="text-[14.5px] text-[var(--bd-muted)]">
              <span className="tabular-nums text-[var(--bd-fg)]">{weekShips}</span> releases this week.{" "}
              {needing.length > 0 && (
                <>
                  {needing.map((p, i) => (
                    <span key={p.id}>
                      {i > 0 && (i === needing.length - 1 ? " and " : ", ")}
                      <Named p={p} onOpen={toggle} />
                    </span>
                  ))}{" "}
                  need you.
                </>
              )}
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 @2xl/page:w-auto">
            <Segmented
              size="sm"
              label="Show"
              value={show}
              onValueChange={setShow}
              options={[
                { value: "all", label: "All" },
                { value: "pinned", label: "Pinned" },
                { value: "needs", label: `Needs you ${needing.length}` },
              ]}
            />
            <Input size="sm" placeholder="Find a project" aria-label="Find a project" value={query} onChange={(e) => setQuery(e.target.value)} leading={<MagnifyingGlassIcon weight="regular" />} className="min-w-0 flex-1 @2xl/page:w-[220px] @2xl/page:flex-none" />
          </div>
        </div>

        <div ref={box} className="min-w-0">
        <DataTable
          label="Projects"
          rows={shown}
          columns={columns}
          rowKey={(p) => p.id}
          rowLabel={(p) => p.id}
          selectable={room >= 540}
          stickyFirstColumn
          onRowClick={(p) => toggle(p.id)}
          active={open}
          empty={<span className="text-[14px] text-[var(--bd-muted)]">No project called &ldquo;{query}&rdquo;.</span>}
          actions={(picked, clear) => (
            <>
              <button type="button" onClick={() => {
                  toast(`Redeploying ${many(picked)}`, { description: "Production builds again from main." });
                  clear();
                }}>
                <ArrowClockwiseIcon weight="regular" /> Redeploy
              </button>
              <button type="button" onClick={() => {
                  toast(`Pinned ${many(picked)}`, { description: "The sidebar shows your pinned projects." });
                  clear();
                }}>
                <PushPinIcon weight="duotone" /> Pin
              </button>
              <button type="button" onClick={() => {
                  toast(`Archived ${many(picked)}`, { description: "Archived projects stop building and keep their history." });
                  clear();
                }}>
                <ArchiveIcon weight="duotone" /> Archive
              </button>
            </>
          )}
        />
        </div>
      </div>
    </AppFrame>
  );
}
