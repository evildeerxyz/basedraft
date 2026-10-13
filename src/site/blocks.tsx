import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { ICON, SECTION_ICON } from "./icons";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FAQS, PLANS } from "./content";
import { WithKeys } from "./keys";
import { CardNote, DitherSky, FEATURE_ICON, FeatureList, IconTile, NOTE_ICON, PriceFoot } from "./plan-parts";
import { btn, Sheet } from "./sheet";

/*
 * The plans, each laid out like the Pro modal: icon, name, what's in it, then the price and one
 * action. They sit in a gray tray with the sheets' corner, the cards 12px in with the inset corner,
 * so every nested corner shares a center.
 */
export function PricingSheet({ id, link = true, bare = false }: { id?: string; link?: boolean; bare?: boolean }) {
  return (
    <section id={id} aria-labelledby={bare ? undefined : "pricing-title"} aria-label={bare ? "Pricing" : undefined} className="bd-reveal scroll-mt-4 rounded-[var(--bd-r-sheet)] bg-surface-2 p-3 shadow-[0_0_0_1px_var(--bd-line)]">
      {/* Bare, when the page gives it a heading of its own. */}
      <div className={cn("flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 pb-3 pt-1", bare && "hidden")}>
        <div className="flex min-w-0 flex-[1_1_200px] items-center gap-3">
          <h2 id="pricing-title" className="flex shrink-0 items-center gap-2 text-ui font-medium">
            <ICON.pro size={17} weight="duotone" className="text-accent" />
            Pricing
          </h2>
          <p className="hidden truncate text-meta text-muted sm:block">Pay once. Keep every update.</p>
        </div>
        {link && (
          <Link href="/pro#license" className={btn.link}>
            Compare licenses <ArrowRightIcon size={13} weight="bold" />
          </Link>
        )}
      </div>
      <ul className="grid gap-3 xl:grid-cols-3">
        {PLANS.map((p) => {
          // The plan we'd pick for you is an ink card, the others white.
          const dark = !!p.featured;
          return (
            <li
              key={p.name}
              className={cn(
                "@container relative flex flex-col overflow-hidden rounded-[var(--bd-r-inset)] transition-[translate,box-shadow] duration-500 ease-[var(--bd-ease)] hover:-translate-y-1",
                dark
                  ? "bg-fg text-canvas shadow-[0_28px_56px_-28px_rgb(var(--bd-shade)/0.7),inset_0_1px_0_rgb(var(--bd-paper)/0.1)]"
                  : "bg-surface shadow-[0_1px_2px_rgb(var(--bd-shade)/0.05),0_0_0_1px_rgb(var(--bd-ink)/0.06)]",
              )}
            >
              {/* The rail poster's dithered sky, in whichever ink shows on the card. */}
              <DitherSky tone={dark ? "ink" : "surface"} />
              <div className="relative px-6 pb-5 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <IconTile icon={FEATURE_ICON[p.icon]} tone={dark ? "paper" : "soft"} />
                  {/* Solid, so the sky doesn't show through it. */}
                  {p.featured && <span className="rounded-full bg-[color-mix(in_srgb,var(--bd-bg)_12%,var(--bd-fg))] px-2.5 py-1 text-meta font-medium">Most popular</span>}
                </div>
                <h3 className="mt-4 text-title">{p.name}</h3>
                <p className={cn("mt-1.5 text-body", dark ? "text-canvas/60" : "text-muted")}>{p.blurb}</p>
              </div>
              {/* Wide cards, when the plans stack, split the list into two columns. */}
              <FeatureList items={p.features} dark={dark} className="mx-3 @xl:grid @xl:grid-cols-2 @xl:gap-0.5 @xl:space-y-0" />
              {/* Takes up the slack, so the prices line up across cards. */}
              <span aria-hidden className="block min-h-5 flex-1" />
              <PriceFoot price={p.price} period={p.period} note={p.terms.t} noteIcon={NOTE_ICON[p.terms.kind]} dark={dark}>
                <Link href={p.cta.href} prefetch={false} className={dark ? btn.paper : btn.quiet}>
                  {p.cta.label}
                </Link>
              </PriceFoot>
              <CardNote icon={NOTE_ICON[p.note.kind]} dark={dark}>
                {p.note.t}
              </CardNote>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Questions as a quiet accordion: the questions scan at a glance, answers open one at a time. */
export function FaqSheet({ id, bare = false }: { id?: string; bare?: boolean }) {
  return (
    <Sheet id={id} className="scroll-mt-4" icon={bare ? undefined : SECTION_ICON.faq} title={bare ? undefined : "Questions"} meta={bare ? undefined : "Something else? hello@basedraft.site"}>
      <div className="grid md:grid-cols-2">
        {[FAQS.filter((_, i) => i % 2 === 0), FAQS.filter((_, i) => i % 2 === 1)].map((col, c) => (
          <div key={c} className={cn("divide-y divide-line", c === 1 && "border-t border-line md:border-l md:border-t-0")}>
            {col.map((f) => (
              <details key={f.q} name="faq" className="bd-faq group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-heading transition-colors hover:bg-fg/[0.02] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <PlusIcon size={15} weight="bold" className="shrink-0 text-subtle transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="-mt-1 px-6 pb-5 text-body text-muted">
                  <WithKeys text={f.a} />
                </p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
