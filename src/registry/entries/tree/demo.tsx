"use client";

import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Tree, type TreeNode } from "../../pro-ui/tree";
import { hint } from "../_shared/kit";

/* A git status letter: modified in amber, new in green. */
const M = <span className="font-medium text-[var(--bd-ui-wait)]">M</span>;
const U = <span className="font-medium text-[var(--bd-ui-ok)]">U</span>;

const REPO: TreeNode[] = [
  {
    id: "app",
    label: "app",
    children: [
      { id: "app/layout.tsx", label: "layout.tsx" },
      { id: "app/page.tsx", label: "page.tsx" },
      {
        id: "app/pricing",
        label: "pricing",
        children: [
          { id: "app/pricing/page.tsx", label: "page.tsx", meta: M },
          { id: "app/pricing/plans.ts", label: "plans.ts", meta: U },
        ],
      },
      { id: "app/globals.css", label: "globals.css" },
    ],
  },
  {
    id: "components",
    label: "components",
    children: [
      { id: "components/hero.tsx", label: "hero.tsx", meta: M },
      { id: "components/footer.tsx", label: "footer.tsx" },
      { id: "components/logo.svg", label: "logo.svg" },
    ],
  },
  {
    id: "public",
    label: "public",
    children: [
      { id: "public/og.png", label: "og.png" },
      { id: "public/favicon.svg", label: "favicon.svg" },
    ],
  },
  { id: "package.json", label: "package.json" },
  { id: "README.md", label: "README.md" },
];

const CARD = "w-full max-w-[300px] rounded-[20px] bg-[var(--bd-surface)] p-2 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]";

export function Demo() {
  const [file, setFile] = useState("app/pricing/page.tsx");
  return (
    <div className="grid w-full justify-items-center gap-3">
      <div className={CARD}>
        <Tree label="zuno-site" items={REPO} defaultExpanded={["app", "app/pricing", "components"]} selected={file} onSelect={(id, node) => !node.children && setFile(id)} />
      </div>
      <p className={`${hint} font-mono`}>zuno-site/{file}</p>
    </div>
  );
}

function Files() {
  return (
    <div className={CARD}>
      <Tree
        label="zuno-site"
        defaultExpanded={["app", "components"]}
        defaultSelected="components/hero.tsx"
        items={[
          {
            id: "app",
            label: "app",
            children: [
              { id: "app/layout.tsx", label: "layout.tsx" },
              { id: "app/page.tsx", label: "page.tsx" },
              { id: "app/globals.css", label: "globals.css" },
            ],
          },
          {
            id: "components",
            label: "components",
            children: [
              { id: "components/hero.tsx", label: "hero.tsx", meta: M },
              { id: "components/pricing.tsx", label: "pricing.tsx", meta: U },
            ],
          },
          { id: "README.md", label: "README.md" },
        ]}
      />
    </div>
  );
}

function Plain() {
  return (
    <div className={CARD}>
      <Tree
        label="Docs"
        icons="none"
        defaultExpanded={["components"]}
        defaultSelected="data"
        items={[
          { id: "start", label: "Get started" },
          {
            id: "components",
            label: "Components",
            meta: 79,
            children: [
              { id: "actions", label: "Actions", meta: 8 },
              { id: "forms", label: "Forms", meta: 18 },
              { id: "data", label: "Data", meta: 11 },
            ],
          },
          { id: "theming", label: "Theming" },
        ]}
      />
    </div>
  );
}

const ASSETS: TreeNode[] = [
  {
    id: "public",
    label: "public",
    children: [
      {
        id: "public/people",
        label: "people",
        children: [
          { id: "public/people/maya.jpg", label: "maya.jpg" },
          { id: "public/people/jonah.jpg", label: "jonah.jpg" },
        ],
      },
      { id: "public/og.png", label: "og.png" },
    ],
  },
  { id: "fonts", label: "fonts", children: [{ id: "fonts/inter.woff2", label: "inter.woff2" }] },
];

function Controlled() {
  const [open, setOpen] = useState<string[]>([]);
  return (
    <div className="grid w-full justify-items-center gap-3">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(["public", "public/people", "fonts"])}>
          Open all
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen([])}>
          Close all
        </Button>
      </div>
      <div className={CARD}>
        <Tree label="Assets" items={ASSETS} expanded={open} onExpandedChange={setOpen} />
      </div>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { files: Files, plain: Plain, controlled: Controlled };
