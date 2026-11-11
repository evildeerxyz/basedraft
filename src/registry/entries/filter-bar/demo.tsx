"use client";

import { CheckCircleIcon, CircleDashedIcon, GitBranchIcon, GlobeHemisphereWestIcon, PulseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { FilterBar, type Filter, type FilterField } from "../../ui/filter-bar";
import { hint } from "../_shared/kit";

const FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: <PulseIcon weight="duotone" />,
    plural: "statuses",
    options: [
      { value: "live", label: "Live", icon: <CheckCircleIcon weight="duotone" /> },
      { value: "building", label: "Building", icon: <CircleDashedIcon weight="duotone" /> },
      { value: "failed", label: "Failed", icon: <WarningCircleIcon weight="duotone" /> },
    ],
  },
  { id: "region", label: "Region", icon: <GlobeHemisphereWestIcon weight="duotone" />, plural: "regions", options: ["Frankfurt", "Washington", "São Paulo", "Tokyo", "Sydney"].map((r) => ({ value: r.toLowerCase(), label: r })) },
  { id: "branch", label: "Branch", icon: <GitBranchIcon weight="duotone" />, plural: "branches", options: ["main", "launch/storefront", "fix/checkout-rounding", "docs/v2"].map((b) => ({ value: b, label: b })) },
];

export function Demo() {
  const [filters, setFilters] = useState<Filter[]>([
    { field: "status", values: ["failed"], not: true },
    { field: "region", values: ["frankfurt", "tokyo"] },
  ]);
  return (
    <div className="grid w-full max-w-[680px] gap-3">
      <FilterBar noun="deploys" fields={FIELDS} value={filters} onValueChange={setFilters} />
      <p className={hint}>Click any dashed word to change it, or And to add a condition.</p>
    </div>
  );
}

function Empty() {
  return (
    <div className="w-full max-w-[560px] pb-56">
      <FilterBar noun="deploys" fields={FIELDS} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { empty: Empty };
