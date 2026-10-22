"use client";

import type { ComponentType } from "react";
import { Avatar, AvatarGroup } from "../../ui/avatar";
import { hint, PEOPLE } from "../_shared/kit";

/** Who's on a Team license, and who's editing right now. */
export function Demo() {
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex items-center gap-3 rounded-full bg-[var(--bd-surface)] py-1.5 pl-1.5 pr-5 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
        <Avatar name="Maya Okafor" status="online" />
        <span className="text-left">
          <span className="block text-sm font-medium text-[var(--bd-fg)]">Maya Okafor</span>
          <span className="block text-xs text-[var(--bd-subtle)]">Editing the hero</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <AvatarGroup people={PEOPLE} max={4} />
        <span className={hint}>6 of 10 seats</span>
      </div>
    </div>
  );
}

function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Lea Moreau" size="sm" />
      <Avatar name="Jonah Park" size="md" />
      <Avatar name="Maya Okafor" size="lg" />
    </div>
  );
}

function Status() {
  return (
    <div className="flex items-center gap-3">
      <Avatar name="Sami Ito" status="online" />
      <Avatar name="Ana Ruiz" status="busy" />
      <Avatar name="Ben Adeyemi" status="away" />
    </div>
  );
}

function Group() {
  return (
    <div className="flex items-center gap-3">
      <AvatarGroup people={PEOPLE} max={3} size="sm" />
      <span className={hint}>6 people on this draft</span>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { sizes: Sizes, status: Status, group: Group };
