"use client";

import { ChartLineIcon, FilesIcon, GearSixIcon, HouseIcon, ListIcon, SignOutIcon, SquaresFourIcon, TrayIcon, UserIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { AppSidebar, type SidebarSection } from "../../pro-ui/app-sidebar";

const SECTIONS: SidebarSection[] = [
  {
    items: [
      { id: "home", label: "Home", icon: <HouseIcon weight="duotone" /> },
      { id: "inbox", label: "Inbox", icon: <TrayIcon weight="duotone" />, count: 4 },
      { id: "sites", label: "Sites", icon: <SquaresFourIcon weight="duotone" />, count: 12 },
    ],
  },
  {
    label: "Studio",
    items: [
      {
        id: "reports",
        label: "Reports",
        icon: <ChartLineIcon weight="duotone" />,
        items: [
          { id: "revenue", label: "Revenue" },
          { id: "visitors", label: "Visitors" },
          { id: "templates", label: "Templates sold" },
        ],
      },
      { id: "files", label: "Files", icon: <FilesIcon weight="duotone" /> },
      { id: "team", label: "Team", icon: <UsersThreeIcon weight="duotone" /> },
      { id: "settings", label: "Settings", icon: <GearSixIcon weight="duotone" /> },
    ],
  },
];

const WORKSPACES = [
  { id: "parker", name: "Parker Studio", plan: "Team, 4 seats" },
  { id: "riley", name: "Riley's sites", plan: "Pro" },
];

const MENU = [
  { label: "Your account", icon: <UserIcon weight="duotone" /> },
  { label: "Sign out", icon: <SignOutIcon weight="duotone" />, tone: "stop" as const },
];

const label = (id: string) => SECTIONS.flatMap((s) => s.items.flatMap((i) => [i, ...(i.items ?? [])])).find((i) => i.id === id)?.label;

/** A small app around the sidebar: the page beside it says where you are, and gets a menu button when it's a drawer. */
function App({ collapsed = false, breakpoint = 380 }: { collapsed?: boolean; breakpoint?: number }) {
  const [page, setPage] = useState("home");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"side" | "drawer">("side");
  return (
    <div className="relative flex h-[460px] w-full max-w-[860px] overflow-hidden rounded-[18px] bg-[var(--bd-surface)] shadow-[var(--bd-shadow-resting),0_0_0_1px_var(--bd-line)]">
      <AppSidebar
        sections={SECTIONS}
        active={page}
        onActiveChange={setPage}
        defaultCollapsed={collapsed}
        workspaces={WORKSPACES}
        onCreateWorkspace={() => {}}
        user={{ name: "Riley Parker", email: "riley@parker.studio" }}
        userMenu={MENU}
        onSearch={() => {}}
        open={open}
        onOpenChange={setOpen}
        onModeChange={setMode}
        breakpoint={breakpoint}
        contained
      />
      <main className="min-w-0 flex-1 p-5">
        <div className="flex h-9 items-center gap-2">
          {mode === "drawer" && (
            <button type="button" aria-label="Open the menu" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-full text-[var(--bd-fg)] transition-[scale] duration-150 [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08)] active:scale-[0.96]">
              <ListIcon className="size-[18px]" />
            </button>
          )}
          <p className="text-[15px] font-semibold text-[var(--bd-fg)]">{label(page)}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-[14px] bg-[var(--bd-ui-track)] opacity-60" />
          ))}
        </div>
        <div className="mt-3 h-40 rounded-[14px] bg-[var(--bd-ui-track)] opacity-40" />
      </main>
    </div>
  );
}

export function Demo() {
  return <App />;
}

function Rail() {
  return <App collapsed />;
}

function Drawer() {
  return <App breakpoint={2000} />;
}

export const examples: Record<string, ComponentType> = { rail: Rail, drawer: Drawer };
