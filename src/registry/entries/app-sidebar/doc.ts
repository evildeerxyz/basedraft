import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  AppSidebar,
  type SidebarSection,
} from "@/components/basedraft/app-sidebar";
import { ChartLineIcon, HouseIcon, TrayIcon } from "@phosphor-icons/react";

const sections: SidebarSection[] = [
  {
    items: [
      {
        id: "home",
        label: "Home",
        icon: <HouseIcon weight="duotone" />,
        href: "/",
      },
      {
        id: "inbox",
        label: "Inbox",
        icon: <TrayIcon weight="duotone" />,
        count: 4,
        href: "/inbox",
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        id: "reports",
        label: "Reports",
        icon: <ChartLineIcon weight="duotone" />,
        items: [
          { id: "revenue", label: "Revenue", href: "/reports/revenue" },
          { id: "visitors", label: "Visitors", href: "/reports/visitors" },
        ],
      },
    ],
  },
];

export function Shell({
  children,
  page,
}: {
  children: React.ReactNode;
  page: string;
}) {
  return (
    <div className="flex h-dvh">
      <AppSidebar
        sections={sections}
        active={page}
        user={{ name: "Riley Parker", email: "riley@parker.studio" }}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}`,
  use: [
    "For the navigation of an app with more than a handful of pages: a dashboard, an admin, a workspace tool.",
    "It folds to a rail of icons, and below the breakpoint becomes a drawer. onModeChange tells your page when to show its own menu button.",
    "Give each item an href to link it, or keep the page yourself with active and onActiveChange.",
  ],
  avoid: [
    "For a marketing site's navigation: a header reads better.",
    "For moving between sections of one page: use Tabs, or a dock of links.",
  ],
  parts: [
    {
      name: "AppSidebar",
      note: "The workspace and its switcher, a search, the pages in sections, folding and you at the foot. Put it first in a row with your page.",
      props: [
        { name: "sections", type: "SidebarSection[]", note: "The pages, in sections with an optional label and a plus to add to it (action).", required: true },
        { name: "views", type: "SidebarView[]", note: "Views to switch between on a segmented control at the head, like Home and Activity. A view without sections shows the sidebar's own." },
        { name: "view, defaultView, onViewChange", type: "string, string, (id) => void", note: "The view showing, if you keep it yourself." },
        { name: "active / defaultActive", type: "string", note: "The page you're on, by id. The first item without either." },
        { name: "onActiveChange", type: "(id, item) => void", note: "Hears a page chosen." },
        { name: "collapsed / defaultCollapsed", type: "boolean", default: "false", note: "Folded to a rail of icons, whose names come up beside them." },
        { name: "onCollapsedChange", type: "(collapsed) => void", note: "Hears it fold and unfold: keep it to remember the choice." },
        { name: "workspaces", type: "SidebarWorkspace[]", note: "Adds the workspace at the top, with a menu to switch it." },
        { name: "workspace / defaultWorkspace", type: "string", note: "The workspace you're in, by id." },
        { name: "onWorkspaceChange", type: "(id) => void", note: "Hears a workspace chosen." },
        { name: "onCreateWorkspace", type: "() => void", note: "Adds New workspace to the switcher." },
        { name: "user", type: "{ name, email? }", note: "You, at the foot." },
        { name: "userMenu", type: "SidebarAction[]", note: "Your own menu: account, settings, sign out. tone: \"stop\" for the last." },
        { name: "onSearch", type: "() => void", note: "Adds the search. Bind its shortcut yourself; the sidebar only shows it." },
        { name: "searchShortcut", type: "string[]", default: '["⌘", "K"]', note: "The keys shown on the search." },
        { name: "open / defaultOpen", type: "boolean", default: "false", note: "The drawer, where there isn't room for the sidebar." },
        { name: "onOpenChange", type: "(open) => void", note: "Hears the drawer open and close." },
        { name: "breakpoint", type: "number", default: "768", note: "Under this width of the space around it, the sidebar becomes a drawer." },
        { name: "onModeChange", type: '(mode: "side" | "drawer") => void', note: "Told which it is, so the page can show its own menu button." },
        { name: "contained", type: "boolean", default: "false", note: "The drawer covers the element around it (make it relative) rather than the window." },
        { name: "plain", type: "boolean", default: "false", note: "No fill or edge of its own, so it sits on the page's ground beside a raised content panel." },
        { name: "label", type: "string", default: '"Main"', note: "The navigation's name for screen readers." },
      ],
    },
    {
      name: "SidebarItem",
      note: "One page, or a group of them.",
      props: [
        { name: "id", type: "string", note: "Unique in the sidebar.", required: true },
        { name: "label", type: "string", note: "Its name, and its tip on the rail.", required: true },
        { name: "icon", type: "ReactNode", note: "An icon: the whole item on the rail." },
        { name: "count", type: "number | string", note: "A count beside it, like unread messages, or a time." },
        { name: "tag", type: "string", note: "A short tinted tag at its end, like \"New\"." },
        { name: "dot", type: "boolean", note: "Something unread in it: a dot at its end, and on the rail." },
        { name: "busy", type: "boolean", note: "Something running in it, like a build: a small spinner at its end." },
        { name: "href", type: "string", note: "Makes it a link." },
        { name: "items", type: "SidebarItem[]", note: "Pages inside it: it opens to show them. Opening one on the rail unfolds the sidebar." },
      ],
    },
  ],
  examples: [
    { id: "rail", title: "Folded to a rail", note: "Icons only; hover one for its name.", code: `<AppSidebar sections={sections} defaultCollapsed />` },
    { id: "drawer", title: "As a drawer", note: "Under the breakpoint it waits off the side. The page's own button opens it; Esc, the backdrop or a swipe closes it.", code: `const [open, setOpen] = useState(false);
const [mode, setMode] = useState<"side" | "drawer">("side");

<div className="relative flex">
  <AppSidebar
    sections={sections}
    open={open}
    onOpenChange={setOpen}
    onModeChange={setMode}
    contained
  />
  <main>
    {mode === "drawer" && <button onClick={() => setOpen(true)}>Menu</button>}
  </main>
</div>` },
  ],
  keyboard: [
    { keys: "Up / Down", does: "Moves between the pages." },
    { keys: "Home / End", does: "Goes to the first or last page." },
    { keys: "Right / Left", does: "Opens or closes a group. On the rail, Right unfolds the sidebar into it." },
    { keys: "Enter / Space", does: "Goes to the page, or opens a menu." },
    { keys: "Esc", does: "Closes a menu, or the drawer, and returns focus to what opened it." },
  ],
  a11y: [
    "It's a nav with its own name; the page you're on is marked aria-current.",
    "On the rail every item keeps its name for screen readers, and shows it in a tip on hover.",
    "The drawer is a modal dialog: it takes focus to the page you're on and gives it back when it closes.",
    "The workspace switcher and your menu are menus, moved through with the arrows.",
  ],
};
