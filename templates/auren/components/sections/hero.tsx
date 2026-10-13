"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { AppleLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { VERSION } from "@/lib/site";
import { DitherShader } from "../dither/dither-shader";
import { AURORA } from "../dither/shaders";
import { EditorDemo } from "../editor/editor-demo";
import { CopyCommand } from "../ui/copy-command";
import { SmartLink } from "../ui/smart-link";
import { buttonClass } from "../ui/primitives";
import { FadeIn, RevealText } from "../ui/reveal";

export function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start end", "start 0.2"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);

  return (
    <section id="top" className="relative bg-ink text-paper">
      <div className="relative">
        {/* the sky ends behind the editor's top edge, so the curtain always rises from the window */}
        <DitherShader fragment={AURORA} pixel={3} className="absolute inset-x-0 top-0 -bottom-[clamp(9rem,16vh,12rem)]" />

      <div className="container-x relative pt-[calc(var(--nav-h)+clamp(2.5rem,9vh,6.5rem))]">
        <div className="flex items-start justify-between gap-6">
          <FadeIn y={8}>
            <SmartLink
              href="/blog/background-agents"
              className="group inline-flex items-center gap-3 rounded-full border border-paper/12 bg-ink py-1 pl-1 pr-3.5 text-[13px] text-fog transition-colors hover:border-paper/30 hover:text-paper"
            >
              <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[11px] font-medium text-ink">2.0</span>
              Background agents are here
            </SmartLink>
          </FadeIn>
        </div>

        <h1 className="type-display mt-8 text-[clamp(2.75rem,8.4vw,8rem)]">
          <RevealText
            lines={["Write the intent.", "Review the diff."]}
            delay={0.1}
            lineClassNames={[undefined, "text-mute"]}
          />
        </h1>

        <FadeIn delay={0.45} className="mt-9 md:mt-11">
          <p className="max-w-[46ch] text-[17px] leading-[1.55] text-fog md:text-[18px]">
            Auren is a native code editor with an agent that has read your entire codebase. Describe the change; get
            back a diff in your conventions, tested and ready to ship.
          </p>
        </FadeIn>
        <FadeIn delay={0.55} className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <SmartLink href="/download" className={buttonClass("light", "lg")}>
              <AppleLogoIcon size={17} weight="fill" />
              Download for macOS
            </SmartLink>
            <CopyCommand />
          </div>
          <p className="mt-3.5 font-mono text-[11.5px] text-mute">
            v{VERSION} · Free for individuals · Also on Linux & Windows
          </p>
        </FadeIn>
      </div>
      </div>

      <div ref={stageRef} className="container-x relative mt-[clamp(3rem,8vh,5rem)] [perspective:1800px]">
        <motion.div
          style={{ rotateX, scale, transformOrigin: "50% 0%" }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
        >
          <EditorDemo />
        </motion.div>
      </div>
    </section>
  );
}
