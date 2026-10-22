"use client";

import { EyeIcon, EyeSlashIcon, GithubLogoIcon, GlobeIcon, LockSimpleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Input } from "../../ui/input";

export function Demo() {
  return (
    <div className="grid w-full max-w-[330px] gap-2.5">
      <Input leading={<GithubLogoIcon weight="duotone" />} defaultValue="fieldwork/zuno-site" aria-label="Repository" />
      <Input leading={<GlobeIcon weight="duotone" />} placeholder="Custom domain" trailing="Optional" aria-label="Custom domain" />
    </div>
  );
}

function Leading() {
  return <Input leading={<MagnifyingGlassIcon weight="duotone" />} type="search" placeholder="Search sections" aria-label="Search sections" className="max-w-[320px]" />;
}

function Trailing() {
  return <Input leading={<GlobeIcon weight="duotone" />} defaultValue="zuno" trailing=".basedraft.site" aria-label="Subdomain" className="max-w-[320px]" />;
}

function Invalid() {
  return (
    <div className="grid w-full max-w-[320px] gap-1.5">
      <Input type="email" defaultValue="maya@fieldwork" aria-invalid aria-describedby="email-error" aria-label="Email" />
      <p id="email-error" className="px-4 text-xs text-[var(--bd-ui-stop)]">
        Add the part after the dot, like .co
      </p>
    </div>
  );
}

function Password() {
  const [shown, setShown] = useState(false);
  return (
    <Input
      type={shown ? "text" : "password"}
      defaultValue="draft-with-care"
      aria-label="Password"
      className="max-w-[320px] pr-1.5"
      trailing={
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? "Hide the password" : "Show the password"} className="grid size-8 place-items-center rounded-full hover:bg-[var(--bd-surface-2)]">
          {shown ? <EyeSlashIcon weight="duotone" /> : <EyeIcon weight="duotone" />}
        </button>
      }
    />
  );
}

function Disabled() {
  return <Input leading={<LockSimpleIcon weight="duotone" />} defaultValue="fieldwork" disabled aria-label="Team" className="max-w-[320px]" />;
}

export const examples: Record<string, ComponentType> = { leading: Leading, trailing: Trailing, invalid: Invalid, password: Password, disabled: Disabled };
