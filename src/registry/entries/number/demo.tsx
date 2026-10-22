"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { RollingNumber } from "../../ui/number";
import { Segmented } from "../../ui/segmented";

/*
 * The templates' own numbers: pick one and its pages, sections and downloads this month roll over
 * to it, a digit at a time.
 */

const TEMPLATES = {
  zuno: { pages: 25, sections: 15, downloads: 1284 },
  noma: { pages: 12, sections: 12, downloads: 2051 },
  auren: { pages: 11, sections: 12, downloads: 968 },
};
type Slug = keyof typeof TEMPLATES;

export function Demo() {
  const [slug, setSlug] = useState<Slug>("zuno");
  const t = TEMPLATES[slug];
  const stats = [
    { label: "Pages", value: t.pages },
    { label: "Sections", value: t.sections },
    { label: "Downloads", value: t.downloads },
  ];
  return (
    <div className="grid w-full max-w-[360px] justify-items-center gap-6">
      <Segmented
        label="Template"
        size="sm"
        value={slug}
        onValueChange={(v) => setSlug(v as Slug)}
        options={[
          { value: "zuno", label: "Zuno" },
          { value: "noma", label: "Noma" },
          { value: "auren", label: "Auren" },
        ]}
      />
      <dl className="grid w-full grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse items-center">
            <dt className="mt-1.5 text-xs text-[var(--bd-muted)]">{s.label}</dt>
            <dd className="text-[30px] font-semibold tracking-[-0.03em] text-[var(--bd-fg)]">
              <RollingNumber value={s.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CurrencyExample() {
  const [pro, setPro] = useState(false);
  return (
    <div className="grid justify-items-center gap-4">
      <RollingNumber value={pro ? 149 : 79} format="currency" className="text-5xl font-semibold tracking-tight" />
      <Button variant="outline" size="sm" onClick={() => setPro((p) => !p)}>
        {pro ? "One template" : "Every template, with Pro"}
      </Button>
    </div>
  );
}

function CompactExample() {
  const [downloads, setDownloads] = useState(12_400);
  return (
    <div className="grid justify-items-center gap-4">
      <p className="text-sm text-[var(--bd-muted)]">
        <RollingNumber value={downloads} format="compact" className="text-4xl font-semibold text-[var(--bd-fg)]" /> downloads
      </p>
      <Button variant="outline" size="sm" onClick={() => setDownloads((d) => d + 1_250)}>
        Add a week
      </Button>
    </div>
  );
}

function LiveExample() {
  const [seats, setSeats] = useState(4);
  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" size="icon" aria-label="One seat fewer" onClick={() => setSeats((s) => Math.max(1, s - 1))}>
        <MinusIcon weight="regular" />
      </Button>
      <p className="text-sm text-[var(--bd-muted)]">
        <RollingNumber value={seats} live className="text-3xl font-semibold text-[var(--bd-fg)]" /> of 10 seats
      </p>
      <Button variant="outline" size="icon" aria-label="One seat more" onClick={() => setSeats((s) => Math.min(10, s + 1))}>
        <PlusIcon weight="regular" />
      </Button>
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  currency: CurrencyExample,
  compact: CompactExample,
  percent: () => <RollingNumber value={0.024} format="percent" decimals={1} className="text-4xl font-semibold tracking-tight" />,
  live: LiveExample,
};
