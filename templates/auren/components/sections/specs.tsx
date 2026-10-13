import { DitherShader } from "../dither/dither-shader";
import { TORUS } from "../dither/shaders";
import { CornerMarks, SectionLabel } from "../ui/primitives";
import { DitherReveal, FadeIn, RevealText } from "../ui/reveal";

const SPECS = [
  { label: "Core", value: "Rust, GPU-rendered", note: "Metal · Vulkan · DX12" },
  { label: "Keystroke to pixel", value: "3.8 ms p50", note: "7.1 ms p99, M3" },
  { label: "Cold start", value: "180 ms", note: "to an editable frame" },
  { label: "Index", value: "1M lines in 41 s", note: "incremental on save" },
  { label: "Tab model", value: "On-device, 1.2B", note: "~22 ms per prediction" },
  { label: "Agent models", value: "Hosted, self-hosted, local", note: "bring your own keys" },
  { label: "Languages", value: "160+", note: "Tree-sitter + LSP" },
  { label: "Keymaps", value: "VS Code, Vim, Emacs, JetBrains", note: "" },
  { label: "Extensions", value: "Open VSX compatible", note: "" },
  { label: "Platforms", value: "macOS 13+, Linux, Windows 11", note: "x64 · arm64" },
];

export function Specs() {
  return (
    <section id="specs" className="bg-ink py-24 text-paper md:py-32">
      <div className="container-x">
        <SectionLabel index="03">Specs</SectionLabel>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <h2 className="type-display text-[clamp(2.5rem,6vw,5.5rem)] lg:col-span-8">
            <RevealText lines={["Built like", "an instrument."]} />
          </h2>
          <FadeIn delay={0.2} className="self-end lg:col-span-4">
            <p className="max-w-[40ch] text-[17px] leading-[1.55] text-fog">
              No Electron, no input lag. Auren is written in Rust and draws every glyph on the GPU, so the editor keeps
              up with you even while four agents compile in the background.
            </p>
          </FadeIn>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <figure className="lg:col-span-5">
            <DitherReveal scale={6} duration={1200} className="relative aspect-square border border-paper/10">
              <DitherShader
                fragment={TORUS}
                pixel={4}
                inks={["var(--ink)", "#2c2a25", "var(--accent)", "var(--paper)"]}
                label="A dithered torus, lit by your cursor"
                className="absolute inset-0"
              />
              <CornerMarks />
            </DitherReveal>
          </figure>

          <dl className="border-t border-paper/10 lg:col-span-7">
            {SPECS.map((s, i) => (
              <FadeIn
                key={s.label}
                delay={i * 0.04}
                className="group relative grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-baseline gap-x-6 border-b border-paper/10 py-[18px] sm:grid-cols-[11rem_minmax(0,1fr)_auto]"
              >
                <span
                  aria-hidden
                  className="absolute -left-4 top-1/2 size-1.5 -translate-y-1/2 scale-0 bg-accent transition-transform duration-300 group-hover:scale-100"
                />
                <dt className="font-mono text-[12px] text-mute">{s.label}</dt>
                <dd className="text-[16.5px] tracking-[-0.01em] text-paper/90 transition-transform duration-300 group-hover:translate-x-1">
                  {s.value}
                </dd>
                {s.note && (
                  <dd className="col-start-2 font-mono text-[11.5px] text-mute sm:col-start-auto sm:text-right">{s.note}</dd>
                )}
              </FadeIn>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
