"use client";

/* eslint-disable @next/next/no-img-element */
import type { ComponentType } from "react";
import { CompareSlider } from "../../ui/compare-slider";
import { hint } from "../_shared/kit";

export function Demo() {
  return (
    <div className="grid w-full max-w-[560px] gap-3">
      <CompareSlider
        label="Studio in light and dark"
        labels={["Light", "Dark"]}
        defaultValue={58}
        before={<img src="/shots/studio-stage.jpg" alt="basedraft Studio in light" />}
        after={<img src="/shots/studio-stage-dark.jpg" alt="basedraft Studio in dark" />}
        className="shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]"
      />
      <p className={`${hint} text-center`}>Drag the line, or press anywhere on the picture.</p>
    </div>
  );
}

function Edit() {
  return (
    <CompareSlider
      label="The portrait, before and after its edit"
      ratio={1}
      before={<img src="/demo/people/ava-robinson.jpg" alt="Ava Robinson in black and white" style={{ filter: "grayscale(1) contrast(1.08)" }} />}
      after={<img src="/demo/people/ava-robinson.jpg" alt="Ava Robinson in color" />}
      className="w-full max-w-[300px]"
    />
  );
}

function Quiet() {
  return (
    <CompareSlider
      label="The headline, before and after"
      labels={false}
      ratio={2}
      defaultValue={40}
      before={<div className="grid size-full place-items-center bg-[var(--bd-surface)] px-6 text-center font-medium tracking-[-0.03em] text-[var(--bd-muted)] text-2xl">An AI investment manager for everyone</div>}
      after={<div className="grid size-full place-items-center bg-[oklch(19%_0.004_265)] px-6 text-center font-medium tracking-[-0.03em] text-white text-2xl">Money that manages itself.</div>}
      className="w-full max-w-[460px] shadow-[inset_0_0_0_1px_var(--bd-line)]"
    />
  );
}

export const examples: Record<string, ComponentType> = { edit: Edit, quiet: Quiet };
