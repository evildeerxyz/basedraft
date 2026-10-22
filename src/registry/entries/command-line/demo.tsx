"use client";

import type { ComponentType } from "react";
import { CommandLine } from "../../ui/command-line";

export function Demo() {
  return <CommandLine label="zuno, unzipped" className="w-full max-w-[360px]" commands={{ npm: "npm install && npm run dev", pnpm: "pnpm install && pnpm dev", bun: "bun install && bun dev" }} />;
}

function Single() {
  return <CommandLine command="npm install @basedraft/ui" />;
}

function Managers() {
  return (
    <CommandLine
      commands={{
        npm: "npm install @basedraft/ui motion",
        pnpm: "pnpm add @basedraft/ui motion",
        bun: "bun add @basedraft/ui motion",
        yarn: "yarn add @basedraft/ui motion",
      }}
    />
  );
}

function Labeled() {
  return <CommandLine label="in the zuno folder" command="git clone https://github.com/fieldwork/zuno-site && cd zuno-site" />;
}

export const examples: Record<string, ComponentType> = { single: Single, managers: Managers, labeled: Labeled };
