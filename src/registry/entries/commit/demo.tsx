"use client";

import type { ComponentType } from "react";
import { Commit } from "../../pro-ui/commit";

/* The storefront's last few commits, one to a line, as they'd sit in a list of deploys or a branch's history. */
const COMMITS = [
  { message: "Gift card balance at checkout", sha: "7c2e9a14b0d3e5f8a91c2d4e6f7a8b9c0d1e2f30", branch: "feat/gift-cards", author: "Sarah Mitchell", time: "just now" },
  { message: "Round cart totals once, at checkout", sha: "a1f9c2e47b0d3e5f8a91c2d4e6f7a8b9c0d1e2f3", branch: "main", author: "Jake Morrison", time: "2h ago" },
  { message: "Search that forgives typos", sha: "9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d", branch: "feat/search", author: "Megan Turner", time: "5h ago" },
];

export function Demo() {
  return (
    <ul className="w-full max-w-[560px] divide-y divide-[var(--bd-line-subtle)]">
      {COMMITS.map((c) => (
        <li key={c.sha} className="py-2.5 first:pt-0 last:pb-0">
          <Commit {...c} />
        </li>
      ))}
    </ul>
  );
}

function Stack() {
  return (
    <div className="w-full max-w-[420px]">
      <Commit layout="stack" message="Gift card balance at checkout, and a field to redeem a code before paying" sha="7c2e9a14b0d3e5f8a91c2d4e6f7a8b9c0d1e2f30" branch="feat/gift-cards" author="Sarah Mitchell" time="just now" />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { stack: Stack };
