/* Written by scripts/screens.mjs from src/screens/<slug>: each screen's facts and the components it uses. Don't edit by hand. */
import type { ScreenMeta } from "./types";

export const SCREEN_META: ScreenMeta[] = [
  {
    "slug": "deployments",
    "order": 1,
    "title": "Deployments",
    "kind": "Developer tools",
    "description": "A project's deployments with the one in flight leading: its stages turning over and their output as it builds, then a hold to promote it. Every deployment by day under it, filtered in place, each opening onto its stages, logs and domains, with a hold to roll back.",
    "path": "relay.app/acme/storefront/deployments",
    "pro": true,
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
    "lines": 911
  },
  {
    "slug": "roadmap",
    "order": 3,
    "title": "Roadmap",
    "kind": "Planning",
    "description": "A quarter's plan with the team in it: the work on a timeline you drag in place, or the same work as a board, filtered by team and status, with everyone looking at it live and the one you pick open beside it.",
    "path": "relay.app/acme/roadmap",
    "pro": true,
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
    "lines": 342
  }
];
