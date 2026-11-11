"use client";

import { useState, type ComponentType } from "react";
import { Funnel } from "../../ui/funnel";
import { Segmented } from "../../ui/segmented";

const MONTH = [
  { label: "Visited", value: 18400 },
  { label: "Opened Studio", value: 9120 },
  { label: "Signed up", value: 4860 },
  { label: "Published", value: 2905 },
  { label: "Went Pro", value: 1180 },
];

export function Demo() {
  const [fill, setFill] = useState("dither");
  return (
    <div className="grid w-full max-w-[620px] gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--bd-fg)]">From visit to Pro, October</p>
          <p className="text-xs text-[var(--bd-muted)]">6.4% made it all the way</p>
        </div>
        <Segmented
          label="Lost"
          size="sm"
          value={fill}
          onValueChange={setFill}
          options={[
            { value: "dither", label: "Dither" },
            { value: "wash", label: "Wash" },
          ]}
        />
      </div>
      <Funnel label="From visit to Pro, October" steps={MONTH} dither={fill === "dither"} />
    </div>
  );
}

function Short() {
  return (
    <div className="w-full max-w-[420px]">
      <Funnel
        label="Checkout"
        height={160}
        color="var(--bd-ui-viz-2)"
        steps={[
          { label: "Cart", value: 1840 },
          { label: "Details", value: 1210 },
          { label: "Paid", value: 968 },
        ]}
      />
    </div>
  );
}

function Wash() {
  return (
    <div className="w-full max-w-[560px]">
      <Funnel label="Invites" dither={false} steps={[
        { label: "Sent", value: 920 },
        { label: "Opened", value: 611 },
        { label: "Joined", value: 402 },
        { label: "Edited", value: 233 },
      ]} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { short: Short, wash: Wash };
