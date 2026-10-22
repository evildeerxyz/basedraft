"use client";

import { CheckerboardIcon, DotsNineIcon, EnvelopeIcon, GithubLogoIcon, GoogleLogoIcon, GradientIcon, LinkedinLogoIcon, SquareIcon, XLogoIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { BarList } from "../../ui/bar-list";
import { Segmented } from "../../ui/segmented";
import { Select } from "../../ui/select";

/* zuno.site's pages over two spans: the ranking shifts between them, and the rows glide. */
const PAGES = {
  week: [
    { name: "/", value: 4812 },
    { name: "/pricing", value: 2481 },
    { name: "/blog/money-that-manages-itself", value: 1734 },
    { name: "/about", value: 912 },
    { name: "/changelog", value: 640 },
    { name: "/careers", value: 388 },
  ],
  month: [
    { name: "/", value: 19240 },
    { name: "/blog/money-that-manages-itself", value: 12808 },
    { name: "/pricing", value: 9611 },
    { name: "/changelog", value: 4120 },
    { name: "/about", value: 3307 },
    { name: "/careers", value: 1452 },
  ],
};

export function Demo() {
  const [span, setSpan] = useState<"week" | "month">("week");
  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-2 flex items-center justify-between gap-3 px-2">
        <p className="text-sm font-medium text-[var(--bd-fg)]">Top pages</p>
        <Segmented
          label="Span"
          size="sm"
          value={span}
          onValueChange={(v) => setSpan(v as "week" | "month")}
          options={[
            { value: "week", label: "7 days" },
            { value: "month", label: "30 days" },
          ]}
        />
      </div>
      <BarList label="Top pages" data={PAGES[span]} limit={5} />
    </div>
  );
}

function Referrers() {
  return (
    <BarList
      label="Referrers"
      className="max-w-[400px]"
      data={[
        { name: "google.com", value: 3120, icon: <GoogleLogoIcon weight="duotone" /> },
        { name: "x.com", value: 1406, icon: <XLogoIcon weight="duotone" /> },
        { name: "github.com", value: 958, icon: <GithubLogoIcon weight="duotone" /> },
        { name: "linkedin.com", value: 702, icon: <LinkedinLogoIcon weight="duotone" /> },
        { name: "Newsletter", value: 611, icon: <EnvelopeIcon weight="duotone" /> },
      ]}
    />
  );
}

const FILLS = [
  { value: "dither", label: "Dither", icon: <CheckerboardIcon weight="duotone" /> },
  { value: "dots", label: "Dots", icon: <DotsNineIcon weight="duotone" /> },
  { value: "gradient", label: "Gradient", icon: <GradientIcon weight="duotone" /> },
  { value: "solid", label: "Solid", icon: <SquareIcon weight="duotone" /> },
];
type Fill = "dither" | "dots" | "gradient" | "solid";

function Patterns() {
  const [pattern, setPattern] = useState<Fill>("dither");
  return (
    <div className="grid w-full max-w-[400px] gap-2">
      <div className="flex items-center justify-between gap-3 px-2">
        <p className="text-sm font-medium text-[var(--bd-fg)]">Seats by plan</p>
        <Select size="sm" label="Fill" options={FILLS} value={pattern} onValueChange={(v) => setPattern(v as Fill)} className="w-[150px]!" />
      </div>
      <BarList
        label="Seats by plan"
        pattern={pattern}
        data={[
          { name: "Team", value: 1840 },
          { name: "Pro", value: 1215 },
          { name: "Free", value: 690 },
          { name: "Business", value: 312 },
        ]}
      />
    </div>
  );
}

function More() {
  return (
    <BarList
      label="Countries"
      className="max-w-[400px]"
      limit={4}
      format={(v) => `${v}%`}
      share={false}
      data={[
        { name: "United States", value: 38 },
        { name: "Germany", value: 14 },
        { name: "United Kingdom", value: 11 },
        { name: "Nigeria", value: 9 },
        { name: "India", value: 8 },
        { name: "Japan", value: 6 },
      ]}
    />
  );
}

export const examples: Record<string, ComponentType> = { referrers: Referrers, patterns: Patterns, more: More };
