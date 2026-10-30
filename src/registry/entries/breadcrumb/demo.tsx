"use client";

import { BookOpenTextIcon, HouseIcon } from "@phosphor-icons/react";
import type { ComponentProps, ComponentType } from "react";
import { Breadcrumb } from "../../ui/breadcrumb";
import { hint } from "../_shared/kit";

/** The demos' links stay on this page: a click shows what would happen, without going anywhere. */
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

const SITES = [
  { label: "Zuno", href: "/sites/zuno" },
  { label: "Noma", href: "/sites/noma" },
  { label: "Auren", href: "/sites/auren" },
];

/** A light bar, the way a breadcrumb sits at the top of an app. */
const BAR = "w-full min-w-0 max-w-[460px] rounded-full bg-[var(--bd-surface)] p-1 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]";

export function Demo() {
  return (
    <div className="grid w-full min-w-0 max-w-[460px] gap-3">
      <div className={BAR}>
        <Breadcrumb
          link={Stay}
          items={[
            { label: "Larkspur", href: "/", icon: <HouseIcon weight="duotone" /> },
            { label: "Zuno", href: "/sites/zuno", siblings: SITES },
            { label: "Pages", href: "/sites/zuno/pages" },
            { label: "Pricing" },
          ]}
        />
      </div>
      <div className={BAR}>
        <Breadcrumb
          link={Stay}
          max={4}
          items={[
            { label: "Docs", href: "/docs", icon: <BookOpenTextIcon weight="duotone" /> },
            { label: "Components", href: "/docs/components" },
            { label: "Data", href: "/docs/components/data" },
            { label: "Charts", href: "/docs/components/data/charts" },
            { label: "Bar chart", href: "/docs/components/data/charts/bar" },
            { label: "Stacked" },
          ]}
        />
      </div>
      <p className={`${hint} text-center`}>Open the caret beside Zuno, or the fold in the docs path.</p>
    </div>
  );
}

function Basic() {
  return (
    <Breadcrumb
      link={Stay}
      items={[
        { label: "Larkspur", href: "/", icon: <HouseIcon weight="duotone" /> },
        { label: "Templates", href: "/templates" },
        { label: "Zuno" },
      ]}
    />
  );
}

function Folded() {
  return (
    <Breadcrumb
      link={Stay}
      max={4}
      items={[
        { label: "Docs", href: "/docs" },
        { label: "Components", href: "/docs/components" },
        { label: "Data", href: "/docs/components/data" },
        { label: "Charts", href: "/docs/components/data/charts" },
        { label: "Bar chart", href: "/docs/components/data/charts/bar" },
        { label: "Stacked" },
      ]}
    />
  );
}

function Siblings() {
  return (
    <Breadcrumb
      link={Stay}
      items={[
        { label: "Larkspur", href: "/" },
        { label: "Zuno", href: "/sites/zuno", siblings: SITES },
        { label: "Settings" },
      ]}
    />
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, folded: Folded, siblings: Siblings };
