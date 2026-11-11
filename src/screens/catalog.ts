/* Written by scripts/screens.mjs from src/screens/<slug>: each screen's facts and the components it uses. Don't edit by hand. */
import type { ScreenMeta } from "./types";

export const SCREEN_META: ScreenMeta[] = [
  {
    "slug": "projects",
    "order": 0,
    "title": "Projects",
    "kind": "Developer tools",
    "description": "A workspace's projects on one shared axis of the last two weeks, a lane each: what shipped, what was tried, what failed and what's building now, under a sentence that names what needs you. Pick one and its page opens beside the list: what's live, its traffic, its last releases and who ships it.",
    "path": "relay.app/acme/projects",
    "added": "2026-11-02",
    "name": "ProjectsScreen",
    "uses": [
      "account-menu",
      "allowance",
      "app-sidebar",
      "commit",
      "data-table",
      "avatar",
      "breadcrumb",
      "button",
      "input",
      "menu",
      "segmented",
      "sparkline",
      "toast"
    ],
    "lines": 767
  },
  {
    "slug": "deployments",
    "order": 1,
    "title": "Deployments",
    "kind": "Developer tools",
    "description": "A project's deployments with the one in flight leading: its stages turning over and their output as it builds, then a hold to promote it. Every deployment by day under it, filtered in place, each opening onto its stages, logs and domains, with a hold to roll back.",
    "path": "relay.app/acme/storefront/deployments",
    "added": "2026-10-31",
    "name": "DeploymentsScreen",
    "uses": [
      "account-menu",
      "allowance",
      "app-sidebar",
      "commit",
      "filter-bar",
      "log-viewer",
      "pipeline",
      "breadcrumb",
      "button",
      "hold-button",
      "menu",
      "split-button",
      "toast"
    ],
    "lines": 951
  },
  {
    "slug": "billing",
    "order": 2,
    "title": "Billing",
    "kind": "Billing",
    "description": "A workspace's usage and billing: credits leading with what's left, how long it lasts at this pace and thirty days of spend you read day by day, topped up over the page in a few presses. Beside it the plan and its seats; under them what the period has used, spend by project, every invoice and what's on file.",
    "path": "relay.app/acme/billing",
    "added": "2026-11-02",
    "name": "BillingScreen",
    "uses": [
      "account-menu",
      "app-sidebar",
      "pace",
      "runway",
      "top-up",
      "avatar",
      "breadcrumb",
      "button",
      "dialog",
      "switch",
      "toast"
    ],
    "lines": 410
  },
  {
    "slug": "roadmap",
    "order": 3,
    "title": "Roadmap",
    "kind": "Planning",
    "description": "A quarter's plan with the team in it: the work on a timeline you drag in place, or the same work as a board, filtered by team and status, with everyone looking at it live and the one you pick open beside it.",
    "path": "relay.app/acme/roadmap",
    "added": "2026-10-30",
    "name": "RoadmapScreen",
    "uses": [
      "account-menu",
      "app-sidebar",
      "filter-bar",
      "kanban-board",
      "live-cursors",
      "roadmap",
      "share",
      "allowance",
      "badge",
      "breadcrumb",
      "segmented",
      "switch",
      "toast"
    ],
    "lines": 392
  }
];
