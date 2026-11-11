"use client";

import { ArrowUpRightIcon, CalendarDotsIcon, ChartLineIcon, ChatCircleIcon, CloudArrowUpIcon, CoinsIcon, CreditCardIcon, DownloadSimpleIcon, FolderIcon, FoldersIcon, FunctionIcon, GearSixIcon, HouseIcon, ImageSquareIcon, ListIcon, RocketLaunchIcon, TimerIcon, UserPlusIcon, UsersThreeIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import {
  AccountMenu,
  AppSidebar,
  AvatarGroup,
  Breadcrumb,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Pace,
  Runway,
  type SidebarSection,
  type SidebarView,
  Switch,
  toast,
  TopUp,
  type TopUpMethod,
} from "@basedraft/ui";

/*
 * A workspace's usage and billing, in an app's frame. The balance leads, said as a sentence: what's
 * in credits and how long it lasts. Under it the runway: the balance day by day up to today, and
 * from there where it's heading at this pace, down to the day it runs out. Turn on the top-up that
 * runs by itself and the line ahead becomes a saw that never reaches zero; add credits and it jumps
 * today and reaches further. Under that, quieter, the period's usage paced against the plan, the
 * plan and what's on file as a ruled list, and the invoices, with a word only where one's out of
 * the ordinary. It fills the box it's in and scrolls inside, so give that box a height, like h-dvh.
 * The toasts need <Toaster /> once in your root layout.
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

/** The app around the page: the sidebar (a drawer where it doesn't fit), and the page on a panel under its header. */
function AppFrame({ page, crumbs, actions, children }: { page: string; crumbs: string[]; actions?: ReactNode; children: ReactNode }) {
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
        account={(rail) => (
          <AccountMenu
            user={{ name: "Emily Carter", email: "emily@acme.com" }}
            trigger={rail ? "face" : "row"}
            defaultNote="Closing the month"
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
          {/* It scrolls without a bar, the way an app's page does. */}
          <div className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
const round = (n: number) => Math.round(n * 100) / 100;

/* What credits paid for each day, Oct 14 to today, Nov 12: quiet weekends, a launch on Oct 28. */
const SPEND = [7.2, 8.1, 9.4, 6.3, 4.1, 3.8, 8.8, 9.9, 10.6, 9.2, 7.7, 4.6, 4.2, 9.6, 15.8, 17.9, 13.1, 11.4, 6.2, 5.1, 10.2, 11.6, 12.4, 10.9, 9.8, 5.4, 4.9, 10.8, 12.1, 10.6];
const START = "2026-10-14";
/* $100 was added on Oct 22, the ninth day. */
const TOPUPS: Record<number, number> = { 8: 100 };
/** The balance at the end of each day, worked back from today's. */
const HISTORY = SPEND.reduceRight<number[]>((acc, _, i) => (i === SPEND.length - 1 ? [184.2] : [round(acc[0] + SPEND[i + 1] - (TOPUPS[i + 1] ?? 0)), ...acc]), []);
/** The pace: what the last two weeks spent in a day. */
const BURN = round(SPEND.slice(-14).reduce((a, b) => a + b, 0) / 14);
const AUTO = { amount: 100, below: 20 };

const METHODS: TopUpMethod[] = [
  { id: "visa", brand: "Visa", last4: "4242", expires: "08/28" },
  { id: "amex", brand: "Amex", last4: "1005", expires: "02/27" },
];

const DAY_OF_PERIOD = 12;
const PERIOD = 30;

/* What the plan includes this period, used by day 12 of 30, and what each costs past it. */
const USAGE = [
  { id: "minutes", label: "Build minutes", short: "Minutes", icon: <TimerIcon weight="duotone" />, used: 2380, limit: 6000, unit: "min", rate: 0.008 },
  { id: "bandwidth", label: "Bandwidth", short: "Bandwidth", icon: <CloudArrowUpIcon weight="duotone" />, used: 312, limit: 1000, unit: "GB", rate: 0.15 },
  { id: "images", label: "Image optimizations", short: "Images", icon: <ImageSquareIcon weight="duotone" />, used: 3140, limit: 5000, unit: "", rate: 0.005 },
  { id: "functions", label: "Function invocations", short: "Functions", icon: <FunctionIcon weight="duotone" />, used: 1_420_000, limit: 5_000_000, unit: "", rate: 0.0000006 },
].map((u) => ({ ...u, projected: Math.round((u.used / DAY_OF_PERIOD) * PERIOD) }));
/* The first allowance that passes the plan at this pace: the day it does, and what the rest of the period costs. */
const PASSING = USAGE.filter((u) => u.projected > u.limit).map((u) => ({ ...u, on: Math.ceil(u.limit / (u.used / DAY_OF_PERIOD)), cost: Math.round((u.projected - u.limit) * u.rate) }));

/* The invoices, a month at a time. */
type Line = { id: string; what: string; amount: number; refunded?: boolean };
const MONTHS: Array<{ month: string; paid: string; lines: Line[] }> = [
  { month: "November", paid: "Nov 1", lines: [{ id: "INV-2611", what: "Team plan, 8 seats", amount: 160 }] },
  {
    month: "October",
    paid: "Oct 1 and 22",
    lines: [
      { id: "INV-2610", what: "Team plan, 8 seats", amount: 160 },
      { id: "INV-2610-C", what: "Credits", amount: 103.2 },
    ],
  },
  { month: "September", paid: "Sep 1", lines: [{ id: "INV-2609", what: "Team plan, 7 seats", amount: 140 }] },
  {
    month: "August",
    paid: "Aug 1",
    lines: [
      { id: "INV-2608", what: "Team plan, 7 seats", amount: 140 },
      { id: "INV-2608-C", what: "Credits", amount: 51.75, refunded: true },
    ],
  },
];

const SEATS = ["Emily Carter", "Jake Morrison", "Sarah Mitchell", "Ryan Brooks", "Megan Turner", "Tyler Hayes", "Lauren Price", "Chris Bennett"].map((name) => ({ name }));

/** A part of the page under the lead: its title, with a note or an action at its end. */
function Part({ title, end, children }: { title: string; end?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="grid min-w-0 content-start gap-5">
      <div className="flex h-8 items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold tracking-[-0.012em]">{title}</h2>
        {end}
      </div>
      {children}
    </section>
  );
}

/**
 * A bill, set the same way as every other so their parts line up across a row: what it is with an
 * action level with it, the amount, its lines, and a foot held to the bottom. The next one is raised.
 */
function Bill({ next = false, label, action, amount, to, lines, foot }: { next?: boolean; label: string; action: ReactNode; amount: number; /** Where it's charged, beside the amount. */ to?: string; lines: Array<{ what: string; amount: string; quiet?: boolean }>; foot: ReactNode }) {
  return (
    <li className={`flex min-w-0 flex-col rounded-[18px] p-5 ${next ? "@2xl/main:col-span-2 @5xl/main:col-span-1 bg-[var(--bd-raised)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_1px_2px_rgb(var(--bd-shade)/0.05),0_12px_28px_-16px_rgb(var(--bd-shade)/0.25)]" : "shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.08)]"}`}>
      <div className="flex h-8 items-center justify-between gap-3">
        <p className={`truncate text-[14px] ${next ? "font-medium text-[var(--bd-fg)]" : "text-[var(--bd-muted)]"}`}>{label}</p>
        {action}
      </div>
      <p className="mt-3 flex items-baseline justify-between gap-3">
        <span className="text-[28px] font-semibold leading-none tracking-[-0.028em] tabular-nums">{usd(amount)}</span>
        {to && <span className="truncate text-[13px] tabular-nums text-[var(--bd-muted)]">{to}</span>}
      </p>
      <div className="mt-5 grid gap-1.5 border-t border-[var(--bd-line-subtle)] pt-3.5">
        {lines.map((l) => (
          <p key={l.what} className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-[var(--bd-muted)]">{l.what}</span>
            <span className={`shrink-0 tabular-nums ${l.quiet ? "text-[var(--bd-muted)]" : ""}`}>{l.amount}</span>
          </p>
        ))}
      </div>
      {/* At least a step of room, and all the rest, so every foot sits on the same line. */}
      <div aria-hidden className="min-h-5 flex-1" />
      <div className="flex min-h-[46px] items-center justify-between gap-3 whitespace-nowrap border-t border-[var(--bd-line-subtle)] pt-3.5 text-[13px] text-[var(--bd-muted)]">{foot}</div>
    </li>
  );
}

export default function BillingScreen() {
  const [added, setAdded] = useState(0);
  const [adding, setAdding] = useState(false);
  const [auto, setAuto] = useState(false);
  const [topups, setTopups] = useState<Array<{ date: string; label: string }>>([{ date: "2026-10-22", label: "+$100" }]);
  const history = [...HISTORY.slice(0, -1), round(HISTORY[HISTORY.length - 1] + added)];
  const balance = history[history.length - 1];
  const days = Math.floor(balance / BURN);
  const runsOut = new Date(Date.UTC(2026, 10, 12 + days)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const soon = (what: string) => toast(what, { description: "In your app this opens its own page." });
  const autoSwitch = (on: boolean) => {
    setAuto(on);
    toast(on ? "Auto top-up on" : "Auto top-up off", { description: on ? `Adds ${usd(AUTO.amount)} whenever credits fall under ${usd(AUTO.below)}.` : "Credits only go up when you add them." });
  };

  return (
    <AppFrame
      page="billing"
      crumbs={["Acme", "Usage and billing"]}
      actions={
        <Button variant="ghost" size="sm" onClick={() => soon("Pricing")}>
          Pricing <ArrowUpRightIcon weight="regular" />
        </Button>
      }
    >
      <div className="mx-auto grid w-full max-w-[1040px] grid-cols-[minmax(0,1fr)] gap-14 px-4 pb-20 pt-9 @2xl:px-8 @2xl:pt-12">
        {/* The lead: the balance in a sentence, and its runway. */}
        <section aria-label="Credits" className="grid gap-9">
          <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-5">
            <div className="grid max-w-[620px] gap-3">
              <h1 className="text-balance text-[27px] font-semibold leading-[1.18] tracking-[-0.028em] @2xl/main:text-[34px]">
                <span className="tabular-nums">{usd(balance)}</span> <span className="text-[var(--bd-subtle)]">in credits, {auto ? "topped up by itself before it runs low." : `enough until about ${runsOut}.`}</span>
              </h1>
              <p className="text-pretty text-[15px] leading-relaxed text-[var(--bd-muted)]">
                You spend about {usd(BURN)} a day, most of it on storefront. Whatever goes past the plan is paid from here, and credits never expire.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-[var(--bd-muted)]">
                Auto top-up
                <Switch size="sm" aria-label="Auto top-up" checked={auto} onCheckedChange={autoSwitch} />
              </label>
              <Button size="sm" onClick={() => setAdding(true)}>
                Add credits
              </Button>
            </div>
          </div>
          <Runway history={history} start={START} burn={BURN} ahead={30} autoReload={auto ? AUTO : null} events={topups} marks={[{ date: "2026-12-01", label: "Next bill" }]} label="Credits" height={220} />
        </section>

        <Part title="This period" end={<span className="text-[13.5px] tabular-nums text-[var(--bd-muted)]">Nov 1 to 30, day {DAY_OF_PERIOD}</span>}>
          {/* The answer first: does this period cost more than the plan? */}
          <p className="max-w-[720px] text-pretty text-[15px] leading-relaxed text-[var(--bd-muted)]">
            {PASSING.length ? (
              <>
                <span className="text-[var(--bd-fg)]">{PASSING[0].label}</span> pass the plan around <span className="text-[var(--bd-fg)]">Nov {PASSING[0].on}</span>, about {usd(PASSING[0].cost)} more from credits. Everything else fits.
              </>
            ) : (
              "Everything fits in the plan at this pace."
            )}
          </p>
          <Pace items={USAGE} end="Nov 30" label="This period's allowances" />
        </Part>

        <Part
          title="Bills"
          end={
            <Button variant="ghost" size="sm" className="-mr-3.5" onClick={() => soon("All invoices")}>
              All invoices
            </Button>
          }
        >
          {/* The next bill and the last two, each set the same way so their parts line up across. */}
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 @2xl/main:grid-cols-2 @5xl/main:grid-cols-3">
            <Bill
              next
              label="Next, Dec 1"
              action={
                <Button variant="outline" size="sm" onClick={() => soon("Change plan")}>
                  Change plan
                </Button>
              }
              amount={160}
              to="Visa ···· 4242"
              lines={[
                { what: "Team plan, 8 seats", amount: usd(160) },
                ...PASSING.map((u) => ({ what: `${u.short} past the plan`, amount: `~${usd(u.cost)}`, quiet: true })),
              ]}
              foot={
                <span className="flex items-center gap-2.5">
                  <AvatarGroup people={SEATS} max={3} size="sm" />
                  <span className="tabular-nums">8 of 10 seats</span>
                </span>
              }
            />
            {MONTHS.slice(0, 2).map((m) => (
              <Bill
                key={m.month}
                label={m.month}
                action={
                  <button type="button" aria-label={`Download ${m.month}'s invoices`} onClick={() => toast(`${m.month} 2026.pdf`, { description: `${m.lines.length === 1 ? "The invoice" : `${m.lines.length} invoices`}, in one file.` })} className="-mr-1.5 grid size-8 place-items-center rounded-full text-[var(--bd-subtle)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]">
                    <DownloadSimpleIcon weight="regular" className="size-4" />
                  </button>
                }
                amount={m.lines.reduce((a, l) => a + (l.refunded ? 0 : l.amount), 0)}
                lines={m.lines.map((l) => ({ what: l.what, amount: usd(l.amount) }))}
                foot={
                  <>
                    <span>Paid {m.paid}</span>
                    <span className="tabular-nums">{m.lines.length === 1 ? m.lines[0].id : `${m.lines.length} invoices`}</span>
                  </>
                }
              />
            ))}
          </ul>
          <p className="text-[13px] text-[var(--bd-subtle)]">Receipts go to billing@acme.com. Usage past the plan comes out of credits, not the card.</p>
        </Part>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent size="md" glow={false}>
          <DialogTitle className="sr-only">Add credits</DialogTitle>
          <TopUp
            plain
            title="Add credits"
            balance={balance}
            pace={{ perDay: BURN, from: "2026-11-12" }}
            methods={METHODS}
            autoReload={auto ? undefined : AUTO}
            receipt="billing@acme.com"
            onConfirm={(r) =>
              new Promise<void>((done) =>
                setTimeout(() => {
                  setAdded((a) => round(a + r.amount));
                  setTopups((t) => [...t.filter((e) => e.date !== "2026-11-12"), { date: "2026-11-12", label: `+${usd(r.amount).replace(/\.00$/, "")}` }]);
                  if (r.autoReload) setAuto(true);
                  done();
                }, 1400),
              )
            }
            onDone={() => setAdding(false)}
            onAddMethod={() => soon("Add a card")}
          />
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
