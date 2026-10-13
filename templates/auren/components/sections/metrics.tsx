import { CountUp, FadeIn } from "../ui/reveal";

const METRICS = [
  { value: 3.8, decimals: 1, unit: "ms", label: "Keystroke to pixel, p50" },
  { value: 41, unit: "s", label: "To index a million lines, on-device" },
  { value: 4, prefix: "×", label: "Background agents running in parallel" },
  { value: 0, unit: "B", label: "Of your code retained after a request" },
];

export function Metrics() {
  return (
    <section aria-label="Auren by the numbers" className="bg-ink pb-20 pt-20 text-paper md:pb-24 md:pt-28">
      <div className="container-x">
        <dl className="grid grid-cols-2 border-t border-paper/10 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <FadeIn
              key={m.label}
              delay={i * 0.08}
              className="border-b border-paper/10 py-7 pr-6 odd:border-r lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <dt className="sr-only">{m.label}</dt>
              <dd>
                <div className="font-dot text-[clamp(3rem,6vw,5.25rem)] font-[800] leading-none tracking-[-0.02em]">
                  {m.prefix && <span className="text-accent">{m.prefix}</span>}
                  <CountUp to={m.value} decimals={m.decimals} />
                  {m.unit && <span className="ml-1 text-[0.5em] text-paper/45">{m.unit}</span>}
                </div>
                <p className="mt-4 max-w-[24ch] text-[14px] leading-snug text-paper/50">{m.label}</p>
              </dd>
            </FadeIn>
          ))}
        </dl>
      </div>
    </section>
  );
}
