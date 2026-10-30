"use client";

import type { ComponentType } from "react";
import { AccountMenu } from "../../pro-ui/account-menu";
import { hint } from "../_shared/kit";

const ME = { name: "Emily Carter", email: "emily@acme.com" };
const PLACES = [
  { id: "acme", name: "Acme", role: "Owner" },
  { id: "larkspur", name: "Larkspur Studio", role: "Member" },
  { id: "personal", name: "Personal", role: "Hobby" },
];

export function Demo() {
  return (
    <div className="grid w-full max-w-[260px] gap-3">
      <div className="rounded-[16px] bg-[var(--bd-surface)] p-2 shadow-[0_0_0_1px_var(--bd-line-subtle)]">
        <AccountMenu user={ME} defaultNote="Planning the fourth quarter" workspaces={PLACES} workspace="acme" onPreferences={() => undefined} onSignOut={() => undefined} side="bottom" />
      </div>
      <p className={hint}>Open it and say where you are: the dot on your face follows.</p>
    </div>
  );
}

function Face() {
  return <AccountMenu user={ME} defaultStatus="focus" trigger="face" side="bottom" align="end" onSignOut={() => undefined} className="!w-11" />;
}

export const examples: Record<string, ComponentType> = { face: Face };
