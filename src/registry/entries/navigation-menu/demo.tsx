"use client";

import { BookOpenTextIcon, CodeBlockIcon, CursorClickIcon, MegaphoneSimpleIcon, SquaresFourIcon, StackIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import type { ComponentProps, ComponentType } from "react";
import { NavigationMenu, NavigationMenuCard, NavigationMenuItem, NavigationMenuLink } from "../../pro-ui/navigation-menu";
import { hint } from "../_shared/kit";
import { Placeholder, type Layout } from "../_shared/placeholder";

/** The demo's links stay on this page. */
function Stay({ onClick, ...props }: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}

const TEMPLATES: Array<{ name: string; line: string; layout: Layout }> = [
  { name: "Landing", line: "A product's home page, with pricing.", layout: "landing" },
  { name: "Dashboard", line: "An app's numbers, with a sidebar.", layout: "dashboard" },
  { name: "Journal", line: "Long reads, with pictures.", layout: "article" },
];

/** A site's header: the mark, the menus, and a button at the end. */
function Header() {
  return (
    <div className="@container w-full max-w-[680px]">
      <div className="flex items-center gap-2 rounded-full bg-[var(--bd-surface)] py-1.5 pl-4 pr-1.5 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
        <span className="mr-1 flex items-center gap-2 text-sm font-medium tracking-[-0.02em] text-[var(--bd-fg)] max-[420px]:hidden">
          <span className="size-4 rounded-[4px] [background:var(--bd-ui-ink)]" />
          basedraft
        </span>
        <NavigationMenu label="Main" link={Stay}>
          <NavigationMenuItem label="Product" className="grid w-[min(500px,calc(100cqw-24px))] @[520px]:grid-cols-2">
            <NavigationMenuCard link={Stay} href="/studio" icon={<CursorClickIcon weight="duotone" />} title="Studio" description="Rearrange and rewrite a template on the real site." />
            <NavigationMenuCard link={Stay} href="/blocks" icon={<SquaresFourIcon weight="duotone" />} title="Blocks" description="Every section of every template, live at any width." />
            <NavigationMenuCard link={Stay} href="/components" icon={<StackIcon weight="duotone" />} title="Components" description="basedraft UI, free on npm, and Pro pieces." />
            <NavigationMenuCard link={Stay} href="/templates" icon={<CodeBlockIcon weight="duotone" />} title="Templates" description="Whole sites in Next.js and Astro." />
          </NavigationMenuItem>
          <NavigationMenuItem label="Templates" className="grid w-[min(420px,calc(100cqw-24px))] gap-1">
            {TEMPLATES.map((t) => (
              <Stay key={t.name} href={`/templates/${t.name.toLowerCase()}`} className="flex items-center gap-3 rounded-[14px] p-2 outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.04)] focus-visible:bg-[rgb(var(--bd-ink)/0.04)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                <Placeholder layout={t.layout} ratio={1.5} className="w-[72px] shrink-0 rounded-[8px]" />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-medium text-[var(--bd-fg)]">{t.name}</span>
                  <span className="block truncate text-[12.5px] text-[var(--bd-muted)]">{t.line}</span>
                </span>
              </Stay>
            ))}
          </NavigationMenuItem>
          <NavigationMenuItem label="Learn" className="grid w-[min(232px,calc(100cqw-24px))]">
            <NavigationMenuCard link={Stay} href="/components/get-started" icon={<BookOpenTextIcon weight="duotone" />} title="Get started" />
            <NavigationMenuCard link={Stay} href="/llms.txt" icon={<TerminalWindowIcon weight="duotone" />} title="For Claude Code" />
            <NavigationMenuCard link={Stay} href="/whats-new" icon={<MegaphoneSimpleIcon weight="duotone" />} title="What's new" />
          </NavigationMenuItem>
          <NavigationMenuLink href="/pro">Pricing</NavigationMenuLink>
        </NavigationMenu>
      </div>
    </div>
  );
}

export function Demo() {
  return (
    <div className="grid w-full max-w-[680px] gap-3 self-start pt-6">
      <Header />
      <p className={`${hint} text-center`}>Point at Product, then slide to Templates.</p>
    </div>
  );
}

function Bar() {
  return (
    <div className="min-h-[300px] w-full max-w-[680px]">
      <Header />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { header: Bar };
