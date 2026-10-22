"use client";

import { DiamondIcon, FigmaLogoIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Badge } from "../../ui/badge";

export function Demo() {
  return (
    <div className="flex max-w-[330px] flex-wrap items-center justify-center gap-2">
      <Badge variant="outline" dot="ok" live>
        Live
      </Badge>
      <Badge variant="outline" dot="wait">
        Deploying
      </Badge>
      <Badge variant="secondary" dot="idle">
        Draft
      </Badge>
      <Badge>Pro</Badge>
      <Badge variant="metal">Team</Badge>
      <Badge variant="paper">53 sections</Badge>
    </div>
  );
}

function Variants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge>Pro</Badge>
      <Badge variant="secondary">Free</Badge>
      <Badge variant="outline">Next.js</Badge>
      <Badge variant="paper">53 sections</Badge>
      <Badge variant="metal">Team</Badge>
    </div>
  );
}

function Dots() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge variant="outline" dot="ok">
        Published
      </Badge>
      <Badge variant="outline" dot="wait">
        Building
      </Badge>
      <Badge variant="outline" dot="stop">
        Failed
      </Badge>
      <Badge variant="outline" dot="idle">
        Not started
      </Badge>
    </div>
  );
}

function Live() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge variant="outline" dot="ok" live>
        3 people editing
      </Badge>
      <Badge variant="secondary" dot="wait" live>
        Deploying zuno.site
      </Badge>
    </div>
  );
}

function Icon() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Badge>
        <DiamondIcon weight="duotone" /> Pro
      </Badge>
      <Badge variant="outline">
        <FigmaLogoIcon weight="duotone" /> Copies to Figma
      </Badge>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { variants: Variants, dots: Dots, live: Live, icon: Icon };
