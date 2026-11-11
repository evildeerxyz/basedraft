"use client";

import { useState, type ComponentType } from "react";
import { ParticleText } from "../../ui/particle-text";
import { Segmented } from "../../ui/segmented";
import { hint } from "../_shared/kit";

export function Demo() {
  const [look, setLook] = useState("dither");
  return (
    <div className="grid w-full max-w-[640px] justify-items-center gap-4">
      <Segmented
        label="The letters"
        size="sm"
        value={look}
        onValueChange={setLook}
        options={[
          { value: "dither", label: "Dither" },
          { value: "solid", label: "Solid" },
        ]}
      />
      <ParticleText words={["draft", "design", "ship"]} dither={look === "dither"} height={200} className="font-display" />
      <p className={hint}>Move your pointer through the letters.</p>
    </div>
  );
}

/* One word, held: only the pointer moves it. */
function Still() {
  return <ParticleText words={["basedraft"]} height={150} gap={3} repel={70} weight={500} className="max-w-[520px] font-display" />;
}

export const examples: Record<string, ComponentType> = { still: Still };
