"use client";

import { CalendarDotsIcon, ChartLineIcon, CircleHalfIcon, CreditCardIcon, CursorIcon, FoldersIcon, GearSixIcon, HouseIcon, KanbanIcon, ListIcon, RocketLaunchIcon, UserIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { AccountMenu } from "@/registry/pro-ui/account-menu";
import { AppSidebar, type SidebarSection } from "@/registry/pro-ui/app-sidebar";
import { FilterBar, type Filter, type FilterField } from "@/registry/pro-ui/filter-bar";
import { KanbanBoard, type KanbanColumn } from "@/registry/pro-ui/kanban-board";
import { LiveCursors, Viewers, type Presence } from "@/registry/pro-ui/live-cursors";
import { Roadmap, type RoadmapItem } from "@/registry/pro-ui/roadmap";
import { Share } from "@/registry/pro-ui/share";
import { Allowance } from "@/registry/pro-ui/allowance";
import { Badge } from "@/registry/ui/badge";
import { Breadcrumb } from "@/registry/ui/breadcrumb";
import { Segmented } from "@/registry/ui/segmented";
import { Switch } from "@/registry/ui/switch";
import { toast } from "@/registry/ui/toast";

/*
 * A quarter's plan with the team in it, in an app's frame. The work on a timeline you drag in
 * place, or the same work as a board where moving a card changes its status. Filter by team,
 * status or who has it. See who else is looking: their pointers move over the plan as they do,
 * and the Cursors switch hides them. Pick a piece of work to see it under the plan. It fills the
 * box it's in and scrolls inside, so give that box a height, like h-dvh. The toasts need
 * <Toaster /> once in your root layout.
 */

const SECTIONS: SidebarSection[] = [
  {
    items: [
      { id: "overview", label: "Overview", icon: <HouseIcon weight="duotone" />, href: "/acme" },
      { id: "projects", label: "Projects", icon: <FoldersIcon weight="duotone" />, count: 14, href: "/acme/projects" },
      { id: "deployments", label: "Deployments", icon: <RocketLaunchIcon weight="duotone" />, href: "/acme/storefront/deployments" },
      { id: "analytics", label: "Analytics", icon: <ChartLineIcon weight="duotone" />, href: "/acme/storefront/analytics" },
      { id: "roadmap", label: "Roadmap", icon: <CalendarDotsIcon weight="duotone" />, href: "/acme/roadmap" },
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
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bd-surface)] @3xl:rounded-[14px] @3xl:shadow-[0_0_0_1px_var(--bd-line-subtle),0_1px_3px_rgb(var(--bd-shade)/0.06)]">
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
          <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

type Status = NonNullable<RoadmapItem["status"]>;

const WORK: RoadmapItem[] = [
  { id: "checkout", group: "Storefront", title: "Checkout redesign", start: "2026-10-12", end: "2026-11-06", status: "active", progress: 0.62, owner: "Jake Morrison" },
  { id: "gift", group: "Storefront", title: "Gift cards", start: "2026-11-02", end: "2026-11-27", status: "planned", owner: "Sarah Mitchell" },
  { id: "search", group: "Storefront", title: "Search that forgives typos", start: "2026-11-16", end: "2026-12-18", status: "planned", owner: "Megan Turner" },
  { id: "fra1", group: "Platform", title: "Move to fra1", start: "2026-10-05", end: "2026-10-23", status: "done", owner: "Ryan Brooks" },
  { id: "edge", group: "Platform", title: "Edge caching", start: "2026-10-26", end: "2026-11-20", status: "risk", progress: 0.3, owner: "Ryan Brooks" },
  { id: "logs", group: "Platform", title: "Logs to S3", start: "2026-11-23", end: "2026-12-11", status: "planned", owner: "Tyler Hayes" },
  { id: "launch", group: "Growth", title: "Autumn launch", start: "2026-10-05", end: "2026-10-16", status: "done", owner: "Emily Carter" },
  { id: "referrals", group: "Growth", title: "Referral credits", start: "2026-10-19", end: "2026-11-13", status: "active", progress: 0.45, owner: "Lauren Price" },
  { id: "holiday", group: "Growth", title: "Holiday campaign", start: "2026-11-09", end: "2026-12-24", status: "planned", owner: "Emily Carter" },
];
const NAMES = ["Jake Morrison", "Sarah Mitchell", "Megan Turner", "Ryan Brooks", "Tyler Hayes", "Emily Carter", "Lauren Price"];
const STATUSES: Array<{ id: Status; title: string }> = [
  { id: "planned", title: "Planned" },
  { id: "active", title: "Under way" },
  { id: "risk", title: "At risk" },
  { id: "done", title: "Done" },
];
const FIELDS: FilterField[] = [
  { id: "group", label: "Team", icon: <UsersThreeIcon weight="duotone" />, plural: "teams", options: ["Storefront", "Platform", "Growth"].map((t) => ({ value: t, label: t })) },
  { id: "status", label: "Status", icon: <CircleHalfIcon weight="duotone" />, plural: "statuses", options: STATUSES.map((s) => ({ value: s.id, label: s.title })) },
  { id: "owner", label: "Owner", icon: <UserIcon weight="duotone" />, plural: "people", options: NAMES.map((n) => ({ value: n, label: n })) },
];

/** The others here, by the colors their pointers and faces wear. */
const OTHERS = [
  { id: "jake", name: "Jake", color: "oklch(0.62 0.12 250)" },
  { id: "ryan", name: "Ryan", color: "oklch(0.64 0.11 160)" },
  { id: "lauren", name: "Lauren", color: "oklch(0.66 0.12 60)" },
];
/** Where each of them reads: a center on the plan, how far they wander from it, and how fast. */
const DRIFT: Record<string, { x: number; y: number; rx: number; ry: number; speed: number; phase: number }> = {
  jake: { x: 0.5, y: 0.31, rx: 0.09, ry: 0.04, speed: 0.00095, phase: 0 },
  ryan: { x: 0.66, y: 0.57, rx: 0.08, ry: 0.045, speed: 0.0008, phase: 2.1 },
  lauren: { x: 0.37, y: 0.8, rx: 0.09, ry: 0.03, speed: 0.00088, phase: 4.2 },
};

/**
 * The others' pointers over the plan, drifting the way people's do as they read: slow loops of
 * two speeds mixed, each their own, worked out fifteen times a second with the cursors' glide
 * filling in between. Its own little component, so only the pointers draw again, not the plan.
 */
function Crowd({ on, children }: { on: boolean; children: ReactNode }) {
  const [t, setT] = useState(0);
  const still = useReducedMotion();
  useEffect(() => {
    if (!on || still) return;
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 66) return;
      last = now;
      setT(now - start);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on, still]);
  const at = (id: string) => {
    const d = DRIFT[id];
    const a = t * d.speed + d.phase;
    return { x: d.x + d.rx * (Math.sin(a) * 0.75 + Math.sin(a * 2.3 + 1) * 0.25), y: d.y + d.ry * (Math.sin(a * 1.6 + 2) * 0.8 + Math.cos(a * 3.1) * 0.2) };
  };
  const second = Math.floor(t / 1000);
  const people: Presence[] = OTHERS.map((o) => ({
    ...o,
    ...at(o.id),
    message: o.id === "jake" && second % 12 < 6 ? "Checkout slips a week?" : undefined,
    typing: o.id === "lauren" && second % 10 >= 7,
  }));
  return (
    <LiveCursors people={on ? people : []} you={{ id: "emily", name: "Emily", color: "oklch(0.3 0 0)" }} className="min-w-0 rounded-[16px]">
      {children}
    </LiveCursors>
  );
}

const short = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default function RoadmapScreen() {
  const [items, setItems] = useState(WORK);
  const [view, setView] = useState("timeline");
  const [scale, setScale] = useState<"week" | "month">("week");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [picked, setPicked] = useState<string | null>("edge");
  // Everyone else's pointers and what they say, over the plan; off, only their faces show who's here.
  const [cursors, setCursors] = useState(true);

  const shown = items.filter((i) => filters.every((f) => f.values.includes(String(i[f.field as keyof RoadmapItem])) !== !!f.not));
  const item = items.find((i) => i.id === picked);
  const columns: KanbanColumn[] = STATUSES.map((s) => ({
    id: s.id,
    title: s.title,
    cards: shown.filter((i) => i.status === s.id).map((i) => ({ id: i.id, title: i.title, tags: [i.group ?? ""], people: i.owner ? [i.owner] : [], meta: `${short(i.start)} to ${short(i.end)}` })),
  }));
  const moveCards = (next: KanbanColumn[]) => {
    const status = new Map(next.flatMap((c) => c.cards.map((card) => [card.id, c.id as Status] as const)));
    setItems((all) => all.map((i) => (status.has(i.id) && status.get(i.id) !== i.status ? { ...i, status: status.get(i.id), progress: status.get(i.id) === "done" ? 1 : i.progress } : i)));
  };

  return (
    <AppFrame
      page="roadmap"
      crumbs={["Acme", "Roadmap"]}
      actions={
        <>
          <label className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-2.5 pr-1 text-[12.5px] text-[var(--bd-muted)] transition-colors hover:text-[var(--bd-fg)]">
            <CursorIcon size={15} weight="duotone" className="shrink-0" />
            <span className="@max-md:hidden">Cursors</span>
            <Switch size="sm" aria-label="Show everyone's cursors" checked={cursors} onCheckedChange={setCursors} />
          </label>
          <Viewers people={OTHERS} max={3} className="@max-md:hidden" />
          <Share
            title="Fourth quarter"
            url="https://relay.app/acme/roadmap"
            workspace="Acme"
            defaultPeople={[
              { id: "emily", name: "Emily Carter", email: "emily@acme.com", role: "owner", you: true },
              { id: "jake", name: "Jake Morrison", email: "jake@acme.com", role: "edit" },
              { id: "ryan", name: "Ryan Brooks", email: "ryan@acme.com", role: "edit" },
              { id: "lauren", name: "Lauren Price", email: "lauren@acme.com", role: "view" },
            ]}
            onInvite={(emails, role) => toast(emails.length === 1 ? `Invited ${emails[0]}` : `${emails.length} people invited`, { tone: "ok", description: role === "edit" ? "They can edit the plan." : "They can view the plan." })}
            onCopy={() => toast("Link copied", { description: "Anyone in Acme can open it." })}
          />
        </>
      }
    >
      <div className="mx-auto grid w-full max-w-[1280px] gap-5 px-4 pb-12 pt-7 @2xl:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Fourth quarter</h1>
            <p className="mt-1 text-[13.5px] text-[var(--bd-muted)]">
              {items.length} pieces of work across 3 teams. {items.filter((i) => i.status === "risk").length} at risk, {items.filter((i) => i.status === "done").length} done.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {view === "timeline" && (
              <Segmented
                size="sm"
                label="Scale"
                value={scale}
                onValueChange={(v) => setScale(v as "week" | "month")}
                options={[
                  { value: "week", label: "Weeks" },
                  { value: "month", label: "Quarter" },
                ]}
              />
            )}
            <Segmented
              size="sm"
              label="View"
              value={view}
              onValueChange={setView}
              options={[
                { value: "timeline", label: "Timeline", icon: <CalendarDotsIcon weight="duotone" /> },
                { value: "board", label: "Board", icon: <KanbanIcon weight="duotone" /> },
              ]}
            />
          </div>
        </div>

        <FilterBar noun="work" fields={FIELDS} value={filters} onValueChange={setFilters}>
          <span className="font-mono text-[12px] tabular-nums text-[var(--bd-muted)]">
            {shown.length} of {items.length}
          </span>
        </FilterBar>

        <div className="grid gap-5">
          <Crowd on={cursors}>
            {view === "timeline" ? (
              <Roadmap
                items={shown}
                onItemsChange={(_, moved) => setItems((all) => all.map((i) => (i.id === moved.id ? moved : i)))}
                from="2026-10-05"
                days={scale === "week" ? 56 : 91}
                today="2026-10-30"
                scale={scale}
                selected={picked}
                onSelect={(i) => setPicked(i.id)}
              />
            ) : (
              <KanbanBoard label="Roadmap board" columns={columns} onColumnsChange={moveCards} size="sm" />
            )}
          </Crowd>

          {/* The piece of work that's picked. */}
          {item && (
            <aside className="grid gap-x-8 gap-y-4 rounded-[20px] bg-[var(--bd-surface)] p-5 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_1px_2px_rgb(var(--bd-shade)/0.05)] @4xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] @4xl:items-center">
              <div className="min-w-0">
                <p className="text-[12px] text-[var(--bd-muted)]">{item.group}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[16px] font-semibold tracking-[-0.01em]">
                  {item.title}
                  <Badge variant="outline" dot={item.status === "done" ? "ok" : item.status === "risk" ? "wait" : item.status === "active" ? "ok" : "idle"}>
                    {STATUSES.find((s) => s.id === item.status)?.title}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--bd-muted)]">Dates</p>
                <p className="mt-0.5 font-mono text-[12.5px] tabular-nums">
                  {short(item.start)} to {short(item.end)}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[var(--bd-muted)]">Owner</p>
                <p className="mt-0.5 text-[13px]">{item.owner}</p>
              </div>
              <div>
                <p className="flex justify-between text-[12px] text-[var(--bd-muted)]">
                  Progress <span className="font-mono tabular-nums text-[var(--bd-fg)]">{Math.round((item.progress ?? (item.status === "done" ? 1 : 0)) * 100)}%</span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bd-ui-track)]">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${item.status === "risk" ? "bg-[var(--bd-ui-wait)]" : "bg-[var(--bd-fg)]"}`} style={{ width: `${(item.progress ?? (item.status === "done" ? 1 : 0)) * 100}%` }} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
