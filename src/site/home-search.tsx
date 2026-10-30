"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { openCommand } from "./command";
import { Keys } from "./keys";
import { GLASS } from "./library-css";

/*
 * The home page's search, in the same frosted pill as the libraries' search, set into the foot of
 * the home card (home-card.tsx) rather than in the header. It opens the site's search, the same
 * as ⌘K and "/".
 */
export function HomeSearch() {
  return (
    <div>
      <div className={cn("w-full rounded-full p-1.5 shadow-[var(--bd-shadow-float),inset_0_0_0_1px_var(--bd-line)]", GLASS)}>
        <button type="button" onClick={openCommand} className="flex h-10 w-full items-center gap-2.5 rounded-full bg-fg/[0.045] pl-3.5 pr-2 text-[13.5px] text-subtle transition-colors hover:bg-fg/[0.07] hover:text-muted">
          <MagnifyingGlassIcon weight="duotone" size={16} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">Search sites, dashboards and components</span>
          <Keys combo="Cmd K" className="max-sm:hidden" />
        </button>
      </div>
    </div>
  );
}
