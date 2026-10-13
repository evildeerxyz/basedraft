"use client";

import { useEffect, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { ChartBarIcon, ChatCircleTextIcon, SealCheckIcon, SparkleIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { StepsScene, type StepIndex } from "@/components/gl/lazy";

const STORY: { icon: Icon; title: string; body: string }[] = [
  { icon: ChatCircleTextIcon, title: "Ask", body: "A question in plain English, typed like a message." },
  { icon: SparkleIcon, title: "Draft", body: "Nomad AI writes the SQL and explains each join." },
  { icon: SealCheckIcon, title: "Approve", body: "Someone with access signs off before it runs." },
  { icon: ChartBarIcon, title: "Chart", body: "The rows come back as a chart you can share." },
];

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return narrow;
}

/** Four stations, one per step, each sitting above the step it plays. */
export function Showcase({ className }: { className?: string }) {
  const [step, setStep] = useState<StepIndex>(0);
  const narrow = useNarrow();
  return (
    <div className={className}>
      {/* On narrow screens the row slides past, so its sides fade out instead of stopping hard at the frame. */}
      <div className="relative aspect-[4/3] w-full border-y border-line max-md:[mask-image:linear-gradient(to_right,transparent,#000_14%,#000_86%,transparent)] md:aspect-[13/5]">
        <StepsScene className="absolute inset-0" onStep={setStep} follow={narrow} />
      </div>
      <ol className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        {STORY.map(({ icon: StepIcon, title, body }, i) => {
          const on = step === i;
          return (
            <li key={title} className={cn("flex gap-3 border-line p-5", i % 2 === 1 && "border-l", i > 1 && "max-md:border-t", i === 2 && "md:border-l")}>
              <StepIcon size={22} weight="duotone" className={cn("mt-0.5 shrink-0 transition-colors duration-300", on ? "text-accent" : "text-ink-3")} />
              <div>
                <p className={cn("text-[15px] font-medium transition-colors duration-300", on ? "text-ink" : "text-ink-2")}>
                  {i + 1}. {title}
                </p>
                <p className="mt-1 text-[13.5px] leading-snug text-ink-3">{body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
