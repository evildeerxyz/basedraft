"use client";

import type { ComponentType } from "react";
import { Share, type SharePerson } from "../../pro-ui/share";
import { hint } from "../_shared/kit";

const TEAM: SharePerson[] = [
  { id: "emily", name: "Emily Carter", email: "emily@acme.com", role: "owner", you: true },
  { id: "jake", name: "Jake Morrison", email: "jake@acme.com", role: "edit" },
  { id: "sarah", name: "Sarah Mitchell", email: "sarah@acme.com", role: "edit" },
  { id: "ryan", name: "Ryan Brooks", email: "ryan@acme.com", role: "view" },
];

export function Demo() {
  return (
    <div className="grid justify-items-center gap-3">
      <Share title="Fourth quarter roadmap" url="https://relay.app/acme/roadmap" workspace="Acme" defaultPeople={TEAM} />
      <p className={hint}>Open it, paste a few addresses, and pick who else can see it.</p>
    </div>
  );
}

function Private() {
  return <Share title="Q1 plan, draft" url="https://relay.app/acme/q1" workspace="Acme" defaultAccess="invited" defaultPeople={TEAM.slice(0, 1)} />;
}

export const examples: Record<string, ComponentType> = { private: Private };
