"use client";

import { ArrowClockwiseIcon, ArrowCounterClockwiseIcon, ArrowBendDownRightIcon, ArrowUpRightIcon, CalendarDotsIcon, ChartLineIcon, CheckIcon, CircleHalfIcon, CopyIcon, EyeIcon, GlobeHemisphereWestIcon, TimerIcon, CreditCardIcon, DotsThreeIcon, FoldersIcon, GearSixIcon, GitBranchIcon, GlobeSimpleIcon, HouseIcon, LinkSimpleIcon, ListIcon, MagnifyingGlassIcon, ProhibitIcon, RocketLaunchIcon, StackIcon, UserIcon, UsersThreeIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccountMenu } from "@/registry/pro-ui/account-menu";
import { Allowance } from "@/registry/pro-ui/allowance";
import { AppSidebar, type SidebarSection } from "@/registry/pro-ui/app-sidebar";
import { Commit } from "@/registry/pro-ui/commit";
import { FilterBar, type Filter, type FilterField } from "@/registry/pro-ui/filter-bar";
import { LogViewer, type LogLine } from "@/registry/pro-ui/log-viewer";
import { formatDuration, Pipeline, type PipelineStage, type PipelineStatus } from "@/registry/pro-ui/pipeline";
import { Breadcrumb } from "@/registry/ui/breadcrumb";
import { Button } from "@/registry/ui/button";
import { HoldButton } from "@/registry/ui/hold-button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/registry/ui/menu";
import { SplitButton } from "@/registry/ui/split-button";
import { toast } from "@/registry/ui/toast";

/*
 * A project's deployments, in an app's frame. What's happening now leads: the push that's
 * building, its stages turning over on a pipeline with the stage's output under it, then, once
 * it's ready, a hold to send it to production. With nothing in flight, the lead is what's live,
 * with a hold to roll back. Under it, every deployment by day, filtered in place; open one for
 * its stages, each stage's log, its domains and what can be done with it. Redeploy builds
 * production again and puts it live when it's ready. It fills the box it's in and scrolls
 * inside, so give that box a height, like h-dvh. The toasts need <Toaster /> once in your root
 * layout.
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

type Env = "production" | "preview";
type State = "building" | "ready" | "error" | "canceled";
type StageId = "queue" | "install" | "build" | "checks" | "domains";

type Deploy = {
  id: string;
  sha: string;
  message: string;
  branch: string;
  author: string;
  env: Env;
  state: State;
  /** How long it ran, start to end. */
  took: number;
  when: string;
  day: string;
  /** How long each stage took, once a build watched here is over. */
  times?: number[];
  /** Where it stopped, and what it said there: a failed stage, or the one it was canceled in. */
  stopped?: { stage: StageId; note?: string; log?: Array<[string, "info" | "warn" | "error"]> };
};

/* The stages every deployment goes through, and the share of its time each usually takes. */
const STAGES: Array<{ id: StageId; label: string; share: number; note?: string }> = [
  { id: "queue", label: "Queued", share: 0.04 },
  { id: "install", label: "Install", share: 0.36, note: "1,204 packages" },
  { id: "build", label: "Build", share: 0.42, note: "38 pages" },
  { id: "checks", label: "Checks", share: 0.14, note: "214 tests" },
  { id: "domains", label: "Domains", share: 0.04 },
];

const PRODUCTION = ["acme.com", "www.acme.com", "storefront-acme.relay.app"];
const domainsOf = (d: Deploy) => (d.env === "production" ? PRODUCTION : [`storefront-git-${d.branch.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-acme.relay.app`]);

const DEPLOYS: Deploy[] = [
  { id: "dpl_7c2e", sha: "7c2e9a14b0d3e5f8a91c2d4e6f7a8b9c0d1e2f30", message: "Gift card balance at checkout", branch: "feat/gift-cards", author: "Sarah Mitchell", env: "preview", state: "building", took: 0, when: "just now", day: "Today" },
  { id: "dpl_a1f9", sha: "a1f9c2e47b0d3e5f8a91c2d4e6f7a8b9c0d1e2f3", message: "Round cart totals once, at checkout", branch: "main", author: "Jake Morrison", env: "production", state: "ready", took: 52000, when: "2h ago", day: "Today" },
  { id: "dpl_9c0d", sha: "9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d", message: "Search that forgives typos", branch: "feat/search", author: "Megan Turner", env: "preview", state: "ready", took: 47000, when: "3h ago", day: "Today" },
  {
    id: "dpl_4b8e",
    sha: "4b8e0f3a9c2d1e7f6a5b4c3d2e1f0a9b8c7d6e5f",
    message: "Cache product pages by region",
    branch: "fix/edge-cache",
    author: "Ryan Brooks",
    env: "preview",
    state: "error",
    took: 63000,
    when: "5h ago",
    day: "Today",
    stopped: {
      stage: "checks",
      note: "2 type errors",
      log: [
        ["Running type check", "info"],
        ["src/lib/cache.ts(42,7): Argument of type 'Region | undefined' is not assignable to parameter of type 'Region'.", "error"],
        ["src/app/products/[slug]/page.tsx(18,21): Property 'region' does not exist on type 'Headers'.", "error"],
        ["Found 2 errors. Stopping before the deploy.", "warn"],
      ],
    },
  },
  { id: "dpl_2e7d", sha: "2e7d9c4b1a0f8e7d6c5b4a3f2e1d0c9b8a7f6e5d", message: "Typo tolerance behind a flag", branch: "feat/search", author: "Megan Turner", env: "preview", state: "canceled", took: 14000, when: "6h ago", day: "Today", stopped: { stage: "install", note: "Newer push to feat/search" } },
  { id: "dpl_8f3a", sha: "8f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a", message: "Resize product images at the edge", branch: "main", author: "Tyler Hayes", env: "production", state: "ready", took: 58000, when: "4:12 PM", day: "Yesterday" },
  { id: "dpl_1d4c", sha: "1d4c6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d", message: "Referral credits on the account page", branch: "feat/referrals", author: "Lauren Price", env: "preview", state: "ready", took: 44000, when: "2:40 PM", day: "Yesterday" },
  { id: "dpl_6b2f", sha: "6b2f9d0e1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f", message: "Schedule the holiday banner", branch: "main", author: "Emily Carter", env: "production", state: "ready", took: 51000, when: "10:05 AM", day: "Yesterday" },
  {
    id: "dpl_5c1b",
    sha: "5c1b8e2d3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
    message: "Upgrade to Next 16.4",
    branch: "main",
    author: "Ryan Brooks",
    env: "production",
    state: "error",
    took: 38000,
    when: "Oct 28",
    day: "Oct 28",
    stopped: {
      stage: "build",
      note: "Module not found: sharp",
      log: [
        ['Running "next build"', "info"],
        ["Creating an optimized production build", "info"],
        ["Module not found: Can't resolve 'sharp' in node_modules/next/dist/server/image-optimizer.js", "error"],
        ["Build failed. Production still serves 3e9a7c5.", "warn"],
      ],
    },
  },
  { id: "dpl_3e9a", sha: "3e9a7c5b4d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a", message: "Tax on shipping in Colorado", branch: "main", author: "Jake Morrison", env: "production", state: "ready", took: 49000, when: "Oct 28", day: "Oct 28" },
];

/* The push building as the page opens: its stages' lengths, and how far in it is. */
const LIVE_PLAN = [2000, 17000, 14000, 6000, 2000];
const LIVE_HEAD = 24000;
const PRODUCTION_PLAN = [2000, 15000, 13000, 6000, 2000];

/* What each stage says, line by line, for a deploy. */
function lines(d: Deploy, stage: StageId): Array<[string, "info" | "warn" | "error"]> {
  if (d.stopped?.stage === stage && d.stopped.log) return d.stopped.log;
  const sha = d.sha.slice(0, 7);
  switch (stage) {
    case "queue":
      return [["Queued for a build machine in iad1", "info"], ["Picked up: 4 cores, 8 GB", "info"]];
    case "install":
      return [[`Cloning github.com/acme/storefront (branch ${d.branch}, commit ${sha})`, "info"], ["Restored the build cache from the last deployment", "info"], ['Running "npm install"', "info"], ["added 1,204 packages in 9s", "info"]];
    case "build":
      return [['Running "next build"', "info"], ["Creating an optimized production build", "info"], ["Compiled successfully in 14.2s", "info"], ["Generating static pages (38/38)", "info"], ["Finalizing page optimization", "info"]];
    case "checks":
      return [["Running type check", "info"], ["Running 214 tests in 4 workers", "info"], ["214 passed", "info"]];
    case "domains":
      return [...domainsOf(d).map((u): [string, "info"] => [`Assigned ${u}`, "info"]), ["Ready", "info"]];
  }
}

/* The times on the log lines: one fixed afternoon, so the page reads the same on the server and in the browser. */
const T0 = Date.UTC(2026, 9, 31, 14, 32, 0);

/** A deployment's stages: from its clock while it runs, from how long it took once it's over. */
function stagesOf(d: Deploy, live: { elapsed: number; plan: number[] } | null): PipelineStage[] {
  if (live) {
    let start = 0;
    return STAGES.map((s, i) => {
      const from = start;
      start += live.plan[i];
      const status: PipelineStatus = live.elapsed >= start ? "done" : live.elapsed >= from ? "running" : "waiting";
      return { id: s.id, label: s.label, status, duration: status === "done" ? live.plan[i] : status === "running" ? live.elapsed - from : undefined, estimate: status === "done" ? undefined : live.plan[i], note: status === "done" ? s.note : undefined };
    });
  }
  const stopAt = d.stopped ? STAGES.findIndex((s) => s.id === d.stopped!.stage) : -1;
  return STAGES.map((s, i) => {
    const ms = d.times?.[i] ?? Math.max(1000, Math.round((d.took * s.share) / 1000) * 1000);
    if (stopAt < 0) return { id: s.id, label: s.label, status: "done", duration: ms, note: s.note };
    if (i < stopAt) return { id: s.id, label: s.label, status: "done", duration: ms, note: s.note };
    if (i === stopAt) return { id: s.id, label: s.label, status: d.state === "error" ? "failed" : "canceled", duration: ms, note: d.stopped!.note };
    return { id: s.id, label: s.label, status: "skipped" };
  });
}

/** A stage's log: as much of it as the stage has reached (while it builds, by the build's plan). */
function logOf(d: Deploy, stage: PipelineStage | undefined, plan?: number[]): LogLine[] {
  if (!stage || stage.status === "waiting" || stage.status === "skipped") return [];
  const all = lines(d, stage.id as StageId);
  const at = STAGES.findIndex((s) => s.id === stage.id);
  const base = T0 + at * 9000;
  // Running, it has said as many of its lines as its share of time so far allows.
  const length = plan?.[at] ?? d.times?.[at] ?? Math.max(1000, d.took * STAGES[at].share);
  const shown = stage.status === "running" ? Math.max(1, Math.min(all.length - 1, Math.floor(((stage.duration ?? 0) / length) * all.length) + 1)) : all.length;
  return all.slice(0, shown).map(([message, level], i) => ({ id: `${stage.id}-${i}`, time: base + i * 1300, level, message }));
}

const LOOK: Record<State, { dot: string; word: string }> = {
  ready: { dot: "bg-[var(--bd-ui-ok)]", word: "Ready" },
  building: { dot: "bg-[var(--bd-ui-wait)]", word: "Building" },
  error: { dot: "bg-[var(--bd-ui-stop)]", word: "Error" },
  canceled: { dot: "bg-[rgb(var(--bd-ink)/0.28)]", word: "Canceled" },
};

/** A deployment's state: a dot and its word. The dot breathes while it builds. */
function Status({ state, className }: { state: State; className?: string }) {
  const still = useReducedMotion();
  return (
    <span className={`inline-flex items-center gap-2 text-[13px] ${state === "ready" ? "text-[var(--bd-fg)]" : state === "canceled" ? "text-[var(--bd-muted)]" : "text-[var(--bd-fg)]"} ${className ?? ""}`}>
      <span className="relative grid size-2 shrink-0 place-items-center">
        {state === "building" && !still && <motion.span className={`absolute inset-0 rounded-full ${LOOK[state].dot}`} animate={{ scale: [1, 2.4], opacity: [0.5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }} />}
        <span className={`relative size-2 rounded-full ${LOOK[state].dot}`} />
      </span>
      {LOOK[state].word}
    </span>
  );
}

/** Production's own mark: an ink tag on the one deployment that's live. */
const Current = () => <span className="inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]">Current</span>;

const FIELDS: FilterField[] = [
  { id: "env", label: "Environment", icon: <GlobeSimpleIcon weight="duotone" />, plural: "environments", options: [{ value: "production", label: "Production" }, { value: "preview", label: "Preview" }] },
  { id: "state", label: "Status", icon: <CircleHalfIcon weight="duotone" />, plural: "statuses", options: (Object.keys(LOOK) as State[]).map((s) => ({ value: s, label: LOOK[s].word })) },
  { id: "branch", label: "Branch", icon: <GitBranchIcon weight="duotone" />, plural: "branches", options: [...new Set(DEPLOYS.map((d) => d.branch))].map((b) => ({ value: b, label: b })) },
  { id: "author", label: "Author", icon: <UserIcon weight="duotone" />, plural: "people", options: [...new Set(DEPLOYS.map((d) => d.author))].map((a) => ({ value: a, label: a })) },
];

/* In your app, Visit opens the deployment; here it says where it would go. */
const visit = (url: string) => toast(`Opening ${url}`, { description: "In your app this opens in a new tab." });
const copyUrl = (url: string) => void navigator.clipboard?.writeText(`https://${url}`).then(() => toast("Link copied", { description: `https://${url}` }));

/** What a deployment is and where it went: its environment, and the Current tag on the live one. */
function Where({ d, current }: { d: Deploy; current: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-[13px]">
      <span className={d.env === "production" ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)]"}>{d.env === "production" ? "Production" : "Preview"}</span>
      {current && <Current />}
    </span>
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
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(`https://${url}`).then(() => setDone(true))}
      aria-label={done ? "Copied" : `Copy ${url}`}
      className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]"
    >
      {done ? <CheckIcon weight="bold" className="size-3.5 text-[var(--bd-fg)]" /> : <CopyIcon weight="regular" className="size-3.5" />}
    </button>
  );
}

/** What each address is, and its mark: the one people type, the one that sends to it, and the platform's own. */
function roleOf(d: Deploy, url: string) {
  if (d.env === "preview") return { word: "Preview address", primary: false, Icon: EyeIcon };
  if (url === "acme.com") return { word: "Primary", primary: true, Icon: GlobeSimpleIcon };
  if (url.startsWith("www.")) return { word: "Redirects to acme.com", primary: false, Icon: ArrowBendDownRightIcon };
  return { word: "relay.app address", primary: false, Icon: LinkSimpleIcon };
}

/** Under a small title, a list ruled by hairlines: the shape both columns of the details share. */
function Ruled({ title, list = false, children }: { title: string; /** A list of terms and what they are (a dl), rather than plain rows. */ list?: boolean; children: ReactNode }) {
  const Rows = list ? "dl" : "div";
  return (
    <section aria-label={title} className="min-w-0">
      <h3 className="pb-2 text-[12px] font-medium text-[var(--bd-muted)]">{title}</h3>
      <Rows className="divide-y divide-[var(--bd-line-subtle)] border-y border-[var(--bd-line-subtle)]">{children}</Rows>
    </section>
  );
}

/** A deployment's domains: each address, what it is, and (on a pointer, as it passes) copy and open. */
function Domains({ d }: { d: Deploy }) {
  return (
    <Ruled title="Domains">
      {domainsOf(d).map((u) => {
        const role = roleOf(d, u);
        return (
          <div key={u} className="group/domain flex h-11 min-w-0 items-center gap-3">
            <role.Icon weight="duotone" aria-hidden className="size-4 shrink-0 text-[var(--bd-subtle)]" />
            <span className="min-w-0 truncate font-mono text-[13px] text-[var(--bd-fg)]">{u}</span>
            {role.primary ? (
              <span className="inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium shadow-[inset_0_0_0_1px_var(--bd-line-strong)]">{role.word}</span>
            ) : (
              <span className="shrink-0 truncate text-[12px] text-[var(--bd-subtle)] @max-md:hidden">{role.word}</span>
            )}
            <span className="ml-auto flex shrink-0 items-center transition-opacity [@media(hover:hover)]:opacity-0 group-hover/domain:opacity-100 group-focus-within/domain:opacity-100">
              <CopyAddress url={u} />
              <button type="button" onClick={() => visit(u)} aria-label={`Open ${u}`} className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]">
                <ArrowUpRightIcon weight="regular" className="size-3.5" />
              </button>
            </span>
          </div>
        );
      })}
    </Ruled>
  );
}

/** What's live, as a short spec: how it was built, when and by whom, and where it runs. */
function Facts({ d }: { d: Deploy }) {
  const rows: Array<[typeof TimerIcon, string, string, string]> = [
    [TimerIcon, "Built in", formatDuration(d.took), d.times ? "Watched here, stage by stage" : "4 cores in iad1"],
    [RocketLaunchIcon, "Deployed", d.when, `By ${d.author}`],
    [GlobeHemisphereWestIcon, "Regions", "iad1, fra1", "Washington, D.C. and Frankfurt"],
  ];
  return (
    <Ruled title="Deployment" list>
      {rows.map(([Icon, k, v, sub]) => (
        <div key={k} className="grid min-h-11 grid-cols-[120px_minmax(0,1fr)] items-baseline gap-4 py-2.5">
          <dt className="flex items-center gap-3 self-start pt-px text-[12.5px] text-[var(--bd-muted)]">
            <Icon weight="duotone" aria-hidden className="size-4 shrink-0 text-[var(--bd-subtle)]" />
            {k}
          </dt>
          <dd className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium tabular-nums text-[var(--bd-fg)]">{v}</span>
            <span className="mt-0.5 block truncate text-[12px] text-[var(--bd-subtle)]">{sub}</span>
          </dd>
        </div>
      ))}
    </Ruled>
  );
}

type Acts = { promote: (d: Deploy) => void; rollback: (d: Deploy) => void; redeploy: (d: Deploy, clean?: boolean) => void; cancel: () => void; inspect: (d: Deploy) => void };

/** What a deployment can do, by where it's at, in its row's menu. */
function RowMenu({ d, current, acts }: { d: Deploy; current: boolean; acts: Acts }) {
  const url = domainsOf(d)[0];
  return (
    <Menu>
      <MenuTrigger aria-label={`More for ${d.message}`} className="relative z-10 grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.07)] hover:text-[var(--bd-fg)] aria-expanded:bg-[rgb(var(--bd-ink)/0.07)]">
        <DotsThreeIcon weight="bold" className="size-4" />
      </MenuTrigger>
      <MenuContent align="end">
        {d.state === "ready" && (
          <MenuItem icon={<ArrowUpRightIcon weight="regular" />} onSelect={() => visit(url)}>
            Visit
          </MenuItem>
        )}
        <MenuItem icon={<LinkSimpleIcon weight="duotone" />} onSelect={() => copyUrl(url)}>
          Copy its address
        </MenuItem>
        <MenuItem icon={<MagnifyingGlassIcon weight="duotone" />} onSelect={() => acts.inspect(d)}>
          Inspect
        </MenuItem>
        <MenuSeparator />
        {d.state === "ready" && d.env === "preview" && (
          <MenuItem icon={<RocketLaunchIcon weight="duotone" />} onSelect={() => acts.promote(d)}>
            Promote to production
          </MenuItem>
        )}
        {d.state === "ready" && d.env === "production" && !current && (
          <MenuItem icon={<ArrowCounterClockwiseIcon weight="regular" />} onSelect={() => acts.rollback(d)}>
            Roll back to this
          </MenuItem>
        )}
        {d.state === "building" ? (
          <MenuItem tone="stop" icon={<ProhibitIcon weight="duotone" />} onSelect={acts.cancel}>
            Cancel the build
          </MenuItem>
        ) : (
          <MenuItem icon={<ArrowClockwiseIcon weight="regular" />} onSelect={() => acts.redeploy(d)}>
            Redeploy
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}

/**
 * One deployment, one row: its state, where it went, its commit, how long it took and when, and
 * its menu. The whole row opens it; the hash and the menu work on their own. In a narrow list it
 * folds onto two lines.
 */
function Row({ d, current, open, live, acts }: { d: Deploy; current: boolean; open: boolean; live: number | null; acts: Acts }) {
  const took = d.state === "building" ? (live != null ? formatDuration(live) : "") : formatDuration(d.took);
  return (
    <li className={`group/row relative rounded-[12px] transition-colors ${open ? "bg-[rgb(var(--bd-ink)/0.055)]" : "hover:bg-[rgb(var(--bd-ink)/0.03)]"}`}>
      {/* The press that opens it, under everything else in the row. */}
      <button type="button" onClick={() => acts.inspect(d)} aria-label={`Open ${d.message}`} aria-expanded={open} className="absolute inset-0 cursor-pointer rounded-[12px] outline-none focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]" />
      {/* Wide: one line, in columns that line up down the list. */}
      <div className="pointer-events-none relative hidden h-12 grid-cols-[100px_150px_minmax(0,1fr)_64px_72px_32px] items-center gap-4 px-3 @4xl/list:grid">
        <Status state={d.state} />
        <Where d={d} current={current} />
        {/* Only the hash takes a press of its own here; the rest of the commit opens the row. */}
        <div className="min-w-0 [&_button]:pointer-events-auto">
          <Commit message={d.message} sha={d.sha} branch={d.branch} author={d.author} />
        </div>
        <span className="text-right font-mono text-[12px] tabular-nums text-[var(--bd-muted)]">{took}</span>
        <span className="truncate text-right text-[12.5px] tabular-nums text-[var(--bd-subtle)]">{d.when}</span>
        <span className="pointer-events-auto">
          <RowMenu d={d} current={current} acts={acts} />
        </span>
      </div>
      {/* Narrow: the message on top, the rest under it. */}
      <div className="pointer-events-none relative flex items-center gap-3 px-3 py-2.5 @4xl/list:hidden">
        <span className={`size-2 shrink-0 rounded-full ${LOOK[d.state].dot}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{d.message}</span>
            <span className="shrink-0 text-[12px] tabular-nums text-[var(--bd-subtle)]">{d.when}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--bd-muted)]">
            <span className="sr-only">{LOOK[d.state].word}, </span>
            {d.env === "production" ? "Production" : "Preview"}
            {current && <span className="font-medium text-[var(--bd-fg)]">· Current</span>}
            <span className="truncate font-mono">· {d.branch}</span>
            {took && <span className="font-mono tabular-nums">· {took}</span>}
          </span>
        </span>
        <span className="pointer-events-auto">
          <RowMenu d={d} current={current} acts={acts} />
        </span>
      </div>
    </li>
  );
}

/**
 * A deployment opened, over the right of the page: what it is, its stages (a failed one opens on
 * where it failed), the picked stage's log, its domains, and at its foot what it can do now.
 */
function Inspector({ d, stages, plan, current, live, acts, onClose }: { d: Deploy; stages: PipelineStage[]; plan?: number[]; current: boolean; live: boolean; acts: Acts; onClose: () => void }) {
  const head = useRef<HTMLHeadingElement>(null);
  const stoppedAt = d.stopped?.stage;
  const [picked, setPicked] = useState<string | null>(null);
  const running = stages.find((s) => s.status === "running")?.id;
  const stage = picked ?? stoppedAt ?? running ?? "domains";
  const shown = stages.find((s) => s.id === stage);
  useEffect(() => head.current?.focus({ preventScroll: true }), []);
  const after = (fn: () => void) => () => window.setTimeout(fn, 650);
  return (
    <motion.div
      aria-labelledby="deploy-title"
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
      <header className="flex items-center gap-3 border-b border-[var(--bd-line-subtle)] px-5 py-3.5">
        <Status state={d.state} />
        <span className="h-4 w-px bg-[var(--bd-line)]" />
        <Where d={d} current={current} />
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 ml-auto grid size-8 place-items-center rounded-full text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]">
          <XIcon weight="regular" className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h2 id="deploy-title" ref={head} tabIndex={-1} className="sr-only">
          {d.message}
        </h2>
        <Commit layout="stack" message={d.message} sha={d.sha} branch={d.branch} author={d.author} time={d.when} />
        <div className="mt-6">
          <Pipeline label={`Stages of ${d.sha.slice(0, 7)}`} stages={stages} selected={stage} onSelect={setPicked} />
        </div>
        <div className="mt-4">
          <LogViewer key={stage} title={shown?.label ?? "Log"} lines={logOf(d, shown, plan)} live={live && shown?.status === "running"} height={300} wrap />
        </div>
        {d.state === "ready" && (
          <div className="mt-7">
            <Domains d={d} />
          </div>
        )}
      </div>
      {/* What it can do now, at its foot. */}
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--bd-line-subtle)] px-5 py-3">
        {d.state === "building" && (
          <Button variant="outline" size="sm" onClick={acts.cancel}>
            <ProhibitIcon weight="duotone" /> Cancel the build
          </Button>
        )}
        {d.state === "ready" && (
          <Button variant="ghost" size="sm" onClick={() => visit(domainsOf(d)[0])}>
            Visit <ArrowUpRightIcon weight="regular" />
          </Button>
        )}
        {d.state === "ready" && d.env === "preview" && (
          <HoldButton done="Promoted" icon={<RocketLaunchIcon weight="duotone" />} onConfirm={after(() => acts.promote(d))}>
            Hold to promote
          </HoldButton>
        )}
        {d.state === "ready" && d.env === "production" && !current && (
          <HoldButton done="Rolled back" icon={<ArrowCounterClockwiseIcon weight="regular" />} onConfirm={after(() => acts.rollback(d))}>
            Hold to roll back
          </HoldButton>
        )}
        {(d.state !== "building" && (d.state !== "ready" || current)) && (
          <Button variant="outline" size="sm" onClick={() => acts.redeploy(d)}>
            <ArrowClockwiseIcon weight="regular" /> Redeploy
          </Button>
        )}
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

/**
 * The lead. While a push builds: what it is, its time so far, its stages turning over, and the
 * running stage's last lines; once it's ready, a hold to promote it. With nothing in flight: what
 * production serves, where, and a hold to roll back to what was live before.
 */
function Lead({ d, stages, plan, elapsed, live, current, previous, acts }: { d: Deploy; stages: PipelineStage[]; plan?: number[]; elapsed: number; live: boolean; current: boolean; previous?: Deploy; acts: Acts }) {
  const running = stages.find((s) => s.status === "running");
  const [picked, setPicked] = useState<string | null>(null);
  const stage = stages.find((s) => s.id === (picked ?? running?.id ?? "domains"));
  const tail = logOf(d, stage, plan).slice(-4);
  const ready = d.state === "ready";
  const after = (fn: () => void) => () => window.setTimeout(fn, 650);
  const word = live ? (ready ? `${d.env === "production" ? "Production" : "Preview"} ready in ${formatDuration(d.took)}` : `Building ${d.env === "production" ? "for production" : "a preview"}`) : "Live in production";
  return (
    <section aria-labelledby="lead-title" className="rounded-[22px] bg-[var(--bd-surface)] p-5 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08),0_1px_2px_rgb(var(--bd-shade)/0.05),0_16px_40px_-24px_rgb(var(--bd-shade)/0.35)] @2xl:p-7">
      {/* The head: what it is on the left, what can be done with it at the top right. */}
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-5">
        <div className="min-w-0 flex-1 basis-[360px]">
          <p id="lead-title" className="flex items-center gap-2 text-[12.5px] font-medium text-[var(--bd-muted)]">
            <Status state={d.state} className="sr-only" />
            <span className={`size-2 rounded-full ${LOOK[d.state].dot}`} aria-hidden />
            {word}
          </p>
          <div className="mt-3">
            <Commit layout="stack" size="lg" message={d.message} sha={d.sha} branch={d.branch} author={d.author} time={live && !ready ? "pushed just now" : d.when} />
          </div>
        </div>
        {/* Its clock while it builds; what it can do once it's done. */}
        <div className="-mt-1 flex shrink-0 items-center gap-2">
          {live && !ready ? (
            <>
              <span className="mr-3 font-mono text-[28px] font-medium tabular-nums tracking-[-0.03em]" aria-label={`${formatDuration(elapsed)} so far`}>
                {formatDuration(elapsed)}
              </span>
              <Button variant="outline" size="sm" onClick={acts.cancel}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => visit(domainsOf(d)[0])}>
                Visit <ArrowUpRightIcon weight="regular" />
              </Button>
              {live && ready && d.env === "preview" && (
                <HoldButton done="Promoted" icon={<RocketLaunchIcon weight="duotone" />} onConfirm={after(() => acts.promote(d))}>
                  Hold to promote
                </HoldButton>
              )}
              {!live && current && previous && (
                <HoldButton done="Rolled back" icon={<ArrowCounterClockwiseIcon weight="regular" />} onConfirm={after(() => acts.rollback(previous))}>
                  Hold to roll back
                </HoldButton>
              )}
            </>
          )}
        </div>
      </div>
      {/* Where a preview is served, in a bar of its own: where it will be while it builds, and once it's ready, to copy or open. */}
      {live && d.env === "preview" && (
        <div className="mt-6 flex h-11 min-w-0 items-center gap-3 rounded-[12px] bg-[var(--bd-ui-field)] pl-3.5 pr-1.5 shadow-[var(--bd-ui-well)]">
          <GlobeSimpleIcon weight="duotone" aria-hidden className="size-4 shrink-0 text-[var(--bd-subtle)]" />
          <span className="shrink-0 text-[12.5px] text-[var(--bd-muted)]">{ready ? "Preview" : "Will be at"}</span>
          <span className={`min-w-0 truncate font-mono text-[12.5px] ${ready ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)]"}`}>{domainsOf(d)[0]}</span>
          {ready ? (
            <span className="ml-auto flex shrink-0 items-center">
              <CopyAddress url={domainsOf(d)[0]} />
              <button type="button" onClick={() => visit(domainsOf(d)[0])} aria-label={`Open ${domainsOf(d)[0]}`} className="grid size-8 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]">
                <ArrowUpRightIcon weight="regular" className="size-3.5" />
              </button>
            </span>
          ) : (
            <span className="ml-auto shrink-0 pr-2 text-[12px] text-[var(--bd-subtle)]">Once it&apos;s ready</span>
          )}
        </div>
      )}
      {live ? (
        <>
          {/* The stages as a waterfall of time, and under the picked one, its last lines. */}
          <Pipeline className="mt-7" label={`Stages of ${d.sha.slice(0, 7)}`} stages={stages} selected={stage?.id ?? null} onSelect={setPicked}>
            <div className="flex items-center justify-between gap-3 pb-1 pl-4 pr-2 pt-2">
              <span className="flex items-center gap-2 text-[12px] font-medium text-[var(--bd-muted)]">
                Output
                {stage?.status === "running" && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--bd-fg)]">
                    <span className="size-1.5 rounded-full bg-[var(--bd-ui-wait)]" aria-hidden />
                    Live
                  </span>
                )}
              </span>
              <button type="button" onClick={() => acts.inspect(d)} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-[var(--bd-muted)] transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]">
                Full log <ArrowUpRightIcon weight="regular" className="size-3" />
              </button>
            </div>
            <div className="h-[80px] min-w-0 overflow-hidden px-4 pb-3 font-mono text-[11.5px] leading-[19px]">
              <AnimatePresence initial={false}>
                {tail.map((l, i) => (
                  <motion.p key={l.id} layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`truncate ${i === tail.length - 1 && stage?.status === "running" ? "text-[var(--bd-fg)]" : l.level === "error" ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-muted)]"}`}>
                    {l.message}
                  </motion.p>
                ))}
              </AnimatePresence>
              {!tail.length && <p className="text-[var(--bd-subtle)]">Not started yet. It usually takes {formatDuration(stage?.estimate ?? 0)}.</p>}
            </div>
          </Pipeline>
        </>
      ) : (
        // What's live, as a spec: how it was built, and where it's served.
        <div className="mt-8 grid gap-x-12 gap-y-7 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Facts d={d} />
          <Domains d={d} />
        </div>
      )}
    </section>
  );
}

type Roll = { id: string; key: number; head: number; plan: number[]; done: boolean };

export default function DeploymentsScreen() {
  const [deploys, setDeploys] = useState(DEPLOYS);
  const [current, setCurrent] = useState("dpl_a1f9");
  const [roll, setRoll] = useState<Roll | null>({ id: "dpl_7c2e", key: 1, head: LIVE_HEAD, plan: LIVE_PLAN, done: false });
  const [since, setSince] = useState({ key: 0, ms: 0 });
  const [open, setOpen] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const made = useRef(100);

  // The build in flight keeps its own time; when it's done it's ready, and production goes live on its own.
  useEffect(() => {
    if (!roll || roll.done) return;
    const { id, key, head, plan } = roll;
    const total = plan.reduce((a, b) => a + b, 0);
    const start = Date.now();
    const timer = window.setInterval(() => {
      const ms = Date.now() - start;
      if (head + ms < total) return setSince({ key, ms });
      window.clearInterval(timer);
      setSince({ key, ms: total - head });
      setDeploys((all) => all.map((x) => (x.id === id ? { ...x, state: "ready", took: total, times: plan, when: "just now" } : x)));
      setRoll((r) => (r && r.key === key ? { ...r, done: true } : r));
    }, 250);
    return () => window.clearInterval(timer);
  }, [roll]);

  const elapsed = roll ? Math.min(roll.plan.reduce((a, b) => a + b, 0), roll.head + (since.key === roll.key ? since.ms : 0)) : 0;
  const rolling = roll ? deploys.find((x) => x.id === roll.id) : undefined;
  // Production that finished building goes live by itself.
  const production = rolling && roll?.done && rolling.env === "production" && rolling.state === "ready" ? rolling : null;
  const live = current;
  const stagesFor = (d: Deploy) => stagesOf(d, roll && roll.id === d.id && !roll.done ? { elapsed, plan: roll.plan } : null);

  const say = (title: string, description: string, undo?: () => void) => toast(title, { tone: "ok", description, action: undo ? { label: "Undo", onClick: undo } : undefined });
  const acts: Acts = {
    promote: (d) => {
      const was = current;
      setDeploys((all) => all.map((x) => (x.id === d.id ? { ...x, env: "production" } : x)));
      setCurrent(d.id);
      if (roll?.id === d.id) setRoll(null);
      say("Promoted to production", `acme.com now serves ${d.sha.slice(0, 7)}.`, () => {
        setDeploys((all) => all.map((x) => (x.id === d.id ? { ...x, env: "preview" } : x)));
        setCurrent(was);
      });
    },
    rollback: (d) => {
      const was = current;
      setCurrent(d.id);
      say("Rolled back", `acme.com serves ${d.sha.slice(0, 7)} again, from ${d.when}.`, () => setCurrent(was));
    },
    redeploy: (d, clean) => {
      const id = `dpl_r${(made.current += 1)}`;
      setDeploys((all) => [{ ...d, id, env: "production", branch: "main", author: "Emily Carter", state: "building", took: 0, when: "just now", day: "Today", stopped: undefined }, ...all]);
      setRoll({ id, key: made.current, head: 0, plan: PRODUCTION_PLAN, done: false });
      setOpen(null);
      toast(clean ? "Redeploying without the build cache" : "Redeploying", { description: `${d.message}, to production.` });
    },
    cancel: () => {
      if (!roll || roll.done) return;
      const id = roll.id;
      const at = STAGES[Math.max(0, stagesOf(rolling!, { elapsed, plan: roll.plan }).findIndex((s) => s.status === "running"))].id;
      setDeploys((all) => all.map((x) => (x.id === id ? { ...x, state: "canceled", took: elapsed, stopped: { stage: at, note: "Canceled by Emily Carter" } } : x)));
      setRoll(null);
      toast("Build canceled", { description: "Production didn't change." });
    },
    inspect: (d) => setOpen(d.id),
  };

  // A production build that finished takes over from what was live.
  useEffect(() => {
    if (!production) return;
    const t = window.setTimeout(() => {
      setCurrent(production.id);
      setRoll(null);
      toast("Live in production", { tone: "ok", description: `acme.com now serves ${production.sha.slice(0, 7)}.` });
    }, 0);
    return () => window.clearTimeout(t);
  }, [production]);

  const lead = rolling && roll && !production ? rolling : deploys.find((x) => x.id === live)!;
  const leadLive = !!(rolling && roll && !production);
  // The production that was live before the current one: what a roll back goes to.
  const previous = deploys.find((x) => x.env === "production" && x.state === "ready" && x.id !== live && deploys.indexOf(x) > deploys.findIndex((y) => y.id === live));

  const shown = deploys.filter((x) => filters.every((f) => f.values.includes(String(x[f.field as keyof Deploy])) !== !!f.not));
  const days = [...new Set(shown.map((x) => x.day))];
  const opened = deploys.find((x) => x.id === open);

  return (
    <AppFrame
      page="deployments"
      crumbs={["Acme", "Storefront", "Deployments"]}
      actions={
        <>
          <Button variant="ghost" size="sm" className="@max-md:hidden" onClick={() => visit("acme.com")}>
            Visit <ArrowUpRightIcon weight="regular" />
          </Button>
          <SplitButton
            size="sm"
            actions={[
              { value: "redeploy", label: "Redeploy", description: "Build production again, with the build cache.", icon: <ArrowClockwiseIcon weight="regular" /> },
              { value: "clean", label: "Redeploy clean", description: "From a fresh install, without the cache. Slower.", icon: <StackIcon weight="duotone" /> },
            ]}
            menuLabel="More ways to redeploy"
            disabled={!!(roll && !roll.done)}
            onAction={(v) => acts.redeploy(deploys.find((x) => x.id === live)!, v === "clean")}
          />
        </>
      }
      panel={
        <AnimatePresence>
          {opened && (
            <Side key="side" label="Deployment">
              <Inspector key={opened.id} d={opened} stages={stagesFor(opened)} plan={roll && roll.id === opened.id ? roll.plan : undefined} current={opened.id === live} live={!!(roll && roll.id === opened.id && !roll.done)} acts={acts} onClose={() => setOpen(null)} />
            </Side>
          )}
        </AnimatePresence>
      }
    >
      {/* One column, never wider than the window: what's long inside truncates or wraps rather than pushing it out. */}
      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(0,1fr)] gap-8 px-4 pb-16 pt-8 @2xl:px-8">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Deployments</h1>
          <p className="mt-1 text-[13.5px] text-[var(--bd-muted)]">Pushes to main go to production. Every other branch gets a preview of its own.</p>
        </div>

        <Lead d={lead} stages={stagesFor(lead)} plan={leadLive ? roll!.plan : undefined} elapsed={elapsed} live={leadLive} current={lead.id === live} previous={previous} acts={acts} />

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
          <FilterBar noun="deployments" fields={FIELDS} value={filters} onValueChange={setFilters}>
            <span className="font-mono text-[12px] tabular-nums text-[var(--bd-muted)]">
              {shown.length} of {deploys.length}
            </span>
          </FilterBar>
          {/* Every deployment, newest first, by day. */}
          <div className="@container/list grid grid-cols-[minmax(0,1fr)] gap-5">
            {/* What each column is, once, over them all. */}
            <div aria-hidden className="-mb-2 hidden grid-cols-[100px_150px_minmax(0,1fr)_64px_72px_32px] gap-4 px-3 text-[12px] text-[var(--bd-subtle)] @4xl/list:grid">
              <span>Status</span>
              <span>Environment</span>
              <span>Commit</span>
              <span className="text-right">Took</span>
              <span className="text-right">When</span>
              <span />
            </div>
            {days.map((day) => (
              <section key={day} aria-label={day}>
                <h2 className="flex items-center gap-3 px-3 pb-2 text-[12px] font-medium text-[var(--bd-muted)]">
                  {day}
                  <span className="h-px flex-1 bg-[var(--bd-line-subtle)]" />
                </h2>
                <ul className="grid grid-cols-[minmax(0,1fr)]">
                  {shown
                    .filter((x) => x.day === day)
                    .map((x) => (
                      <Row key={x.id} d={x} current={x.id === live} open={open === x.id} live={roll && roll.id === x.id && !roll.done ? elapsed : null} acts={acts} />
                    ))}
                </ul>
              </section>
            ))}
            {!shown.length && <p className="px-3 py-10 text-center text-[13.5px] text-[var(--bd-muted)]">No deployments match. Take a filter off to see more.</p>}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
