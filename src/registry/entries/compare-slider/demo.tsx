"use client";

/* eslint-disable @next/next/no-img-element */
import type { ComponentType } from "react";
import { CompareSlider } from "../../ui/compare-slider";
import { hint } from "../_shared/kit";
import { Placeholder } from "../_shared/placeholder";

export function Demo() {
  return (
    <div className="grid w-full max-w-[560px] gap-3">
      <CompareSlider
        label="A page in light and dark"
        labels={["Light", "Dark"]}
        defaultValue={58}
        before={
          <div className="bd-light size-full bg-[var(--bd-surface)]">
            <Placeholder layout="landing" ratio={16 / 10} label="The page in light" className="size-full" />
          </div>
        }
        after={
          <div data-theme="dark" className="size-full bg-[var(--bd-surface)]">
            <Placeholder layout="landing" ratio={16 / 10} label="The page in dark" className="size-full" />
          </div>
        }
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
      before={<div className="grid size-full place-items-center bg-[var(--bd-surface)] px-6 text-center font-medium tracking-[-0.03em] text-[var(--bd-muted)] text-2xl">A platform that helps teams plan their work better</div>}
      after={<div className="grid size-full place-items-center bg-[oklch(19%_0.004_265)] px-6 text-center font-medium tracking-[-0.03em] text-white text-2xl">Plan the week in ten minutes.</div>}
      className="w-full max-w-[460px] shadow-[inset_0_0_0_1px_var(--bd-line)]"
    />
  );
}

export const examples: Record<string, ComponentType> = { edit: Edit, quiet: Quiet };
