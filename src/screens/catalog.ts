/* Written by scripts/screens.mjs from src/screens/<slug>: each screen's facts and the components it uses. Don't edit by hand. */
import type { ScreenMeta } from "./types";

export const SCREEN_META: ScreenMeta[] = [
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
