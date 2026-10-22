"use client";

import { CodeIcon, EyeIcon, FigmaLogoIcon, GithubLogoIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

/** Where a page can go from Studio, a tab each. */
export function Demo() {
  const panel = "flex w-full items-center gap-3 rounded-[16px] bg-[var(--bd-surface)] p-3 pr-4 text-left text-sm text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]";
  const tile = "grid size-9 shrink-0 place-items-center rounded-[10px] bg-[color-mix(in_oklab,var(--bd-ui-track)_40%,var(--bd-surface))] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)]";
  return (
    <Tabs defaultValue="figma" className="w-full max-w-[380px] items-center">
      <TabsList>
        <TabsTrigger value="figma">Figma</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="github">GitHub</TabsTrigger>
      </TabsList>
      <TabsContent value="figma" className={panel}>
        <span className={tile}>
          <FigmaLogoIcon size={18} weight="duotone" />
        </span>
        Pasted as auto layout, every layer named.
      </TabsContent>
      <TabsContent value="code" className={panel}>
        <span className={tile}>
          <CodeIcon size={18} weight="duotone" />
        </span>
        Next.js or Astro, ready for npm run dev.
      </TabsContent>
      <TabsContent value="github" className={panel}>
        <span className={tile}>
          <GithubLogoIcon size={18} weight="duotone" />
        </span>
        A new repository, or a pull request to yours.
      </TabsContent>
    </Tabs>
  );
}

function Basic() {
  return (
    <Tabs defaultValue="desktop" className="items-center">
      <TabsList>
        <TabsTrigger value="desktop">Desktop</TabsTrigger>
        <TabsTrigger value="phone">Phone</TabsTrigger>
      </TabsList>
      <TabsContent value="desktop" className="text-sm text-[var(--bd-muted)]">
        1440 px wide, with the full navigation.
      </TabsContent>
      <TabsContent value="phone" className="text-sm text-[var(--bd-muted)]">
        390 px wide, the menu behind a button.
      </TabsContent>
    </Tabs>
  );
}

function Icons() {
  return (
    <Tabs defaultValue="preview" className="items-center">
      <TabsList>
        <TabsTrigger value="preview">
          <EyeIcon weight="duotone" /> Preview
        </TabsTrigger>
        <TabsTrigger value="code">
          <CodeIcon weight="duotone" /> Code
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="text-sm text-[var(--bd-muted)]">
        The section, live, at any width.
      </TabsContent>
      <TabsContent value="code" className="font-mono text-[13px] text-[var(--bd-muted)]">
        {"<ZunoHero />"}
      </TabsContent>
    </Tabs>
  );
}

function Pages() {
  const [page, setPage] = useState("home");
  return (
    <Tabs value={page} onValueChange={setPage} className="items-center">
      <TabsList>
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="blog">Blog</TabsTrigger>
      </TabsList>
      <TabsContent value="home" className="text-sm text-[var(--bd-muted)]">
        12 sections
      </TabsContent>
      <TabsContent value="pricing" className="text-sm text-[var(--bd-muted)]">
        5 sections
      </TabsContent>
      <TabsContent value="blog" className="text-sm text-[var(--bd-muted)]">
        3 sections
      </TabsContent>
      <p className="font-mono text-xs text-[var(--bd-subtle)]">Editing /{page === "home" ? "" : page}</p>
    </Tabs>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, icons: Icons, controlled: Pages };
