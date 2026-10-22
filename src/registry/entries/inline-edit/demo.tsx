"use client";

import { useState, type ComponentType } from "react";
import { InlineEdit } from "../../ui/inline-edit";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* A project's name at the top of Studio: click it to rename, and it saves to the account. */
export function Demo() {
  const [name, setName] = useState("Zuno, spring launch");
  return (
    <div className="grid w-full max-w-[380px] gap-1">
      <p className="px-1.5 text-xs font-medium text-[var(--bd-subtle)]">Project</p>
      <span className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[var(--bd-fg)]">
        <InlineEdit
          label="Project name"
          value={name}
          maxLength={40}
          validate={(next) => (next ? null : "Give it a name.")}
          onSave={async (next) => {
            await wait(700);
            setName(next);
          }}
        />
      </span>
      <p className="px-1.5 text-xs text-[var(--bd-subtle)]">Saved to your account. Click the name to rename it.</p>
    </div>
  );
}

function Basic() {
  const [name, setName] = useState("My first site");
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Rename <InlineEdit label="Site name" value={name} onSave={setName} className="font-medium text-[var(--bd-fg)]" /> before you share it.
    </p>
  );
}

function Refused() {
  const [name, setName] = useState("Noma docs");
  return (
    <div className="grid justify-items-center gap-2">
      <span className="text-lg font-semibold text-[var(--bd-fg)]">
        <InlineEdit
          label="Project name"
          value={name}
          onSave={async (next) => {
            await wait(600);
            if (next.toLowerCase() === "zuno") throw new Error("A project called Zuno already exists.");
            setName(next);
          }}
        />
      </span>
      <p className="text-xs text-[var(--bd-subtle)]">Try renaming it to Zuno</p>
    </div>
  );
}

function Required() {
  const [name, setName] = useState("Pricing");
  return (
    <span className="text-base font-medium text-[var(--bd-fg)]">
      <InlineEdit label="Section name" value={name} onSave={setName} validate={(next) => (next.length < 2 ? "At least two letters." : null)} />
    </span>
  );
}

function Cancel() {
  const [name, setName] = useState("Hero, version 2");
  return (
    <div className="grid justify-items-center gap-2">
      <span className="text-base font-medium text-[var(--bd-fg)]">
        <InlineEdit label="Draft name" value={name} onSave={setName} onBlur="cancel" />
      </span>
      <p className="text-xs text-[var(--bd-subtle)]">Clicking away leaves it as it was</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, refused: Refused, required: Required, cancel: Cancel };
