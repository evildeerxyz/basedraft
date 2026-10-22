"use client";

import { MagnifyingGlassIcon, NotePencilIcon, ReceiptIcon, UsersThreeIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Button } from "../../ui/button";
import { EmptyState } from "../../ui/empty-state";

/* Studio's drafts before the first one: what will be here, and the way to start it. */

export function Demo() {
  return (
    <EmptyState
      icon={<NotePencilIcon weight="duotone" />}
      title="No drafts yet"
      description="Open a template in Studio and every change you make is kept here as a draft."
      action={
        <>
          <Button variant="metal" size="sm">
            Open Studio
          </Button>
          <Button variant="ghost" size="sm">
            See templates
          </Button>
        </>
      }
      className="w-full max-w-[420px]"
    />
  );
}

export const examples: Record<string, ComponentType> = {
  plain: () => (
    <div className="w-full max-w-[380px] rounded-[20px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]">
      <EmptyState
        variant="plain"
        icon={<ReceiptIcon weight="duotone" />}
        title="Nothing bought yet"
        description="Templates you buy land here, ready to download or send to GitHub."
        action={
          <Button variant="outline" size="sm">
            Browse templates
          </Button>
        }
      />
    </div>
  ),
  search: () => (
    <EmptyState
      size="sm"
      icon={<MagnifyingGlassIcon weight="duotone" />}
      title="No sections match “pricng”"
      description="Check the spelling, or try a kind like hero or footer."
      action={
        <Button variant="ghost" size="sm">
          Clear search
        </Button>
      }
      className="w-full max-w-[360px]"
    />
  ),
  team: () => (
    <EmptyState
      icon={<UsersThreeIcon weight="duotone" />}
      title="Just you so far"
      description="Your Team license has room for 9 more. Invite them by email."
      action={<Button size="sm">Invite people</Button>}
      className="w-full max-w-[420px]"
    />
  ),
};
