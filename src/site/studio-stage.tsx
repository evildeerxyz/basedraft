import Image from "next/image";
import { Scene, TextLink } from "./showcase";

/*
 * Studio, in the hero's light: what it does on the left, and Studio itself on the right in a
 * window, running off the card's edge. The shot inside follows the mode.
 */
export function StudioStage() {
  return (
    <Scene glow="d" className="bd-reveal grid items-center gap-12 px-6 py-12 sm:p-16 lg:min-h-[640px] lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <div>
        <h3 className="text-headline">Make it yours, right on the page</h3>
        <p className="my-6 max-w-[320px] text-body text-paper-muted">Studio opens the real site at desktop, tablet or phone width. Rearrange its sections and rewrite its words where they stand.</p>
        <TextLink href="/studio" up>
          Open Studio
        </TextLink>
      </div>
      <div className="-mr-6 sm:-mr-16 lg:-mb-16 lg:self-end">
        <div className="overflow-hidden rounded-l-[var(--bd-r-sheet)] rounded-r-none bg-surface shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)] lg:rounded-bl-none">
          {/* A window around it, so it reads as an app on a screen. */}
          <div aria-hidden className="flex h-8 items-center gap-1.5 border-b border-line px-3.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2.5 rounded-full bg-fg/15" />
            ))}
          </div>
          <div className="relative aspect-[16/10] bg-well">
            <Image src="/shots/studio-stage.jpg" alt="Studio with Zuno open: its sections on the left and the hero selected on the canvas, ready to rewrite" fill quality={85} sizes="(min-width: 1024px) 860px, 100vw" className="object-cover object-left-top dark:hidden" />
            <Image src="/shots/studio-stage-dark.jpg" alt="" aria-hidden fill quality={85} sizes="(min-width: 1024px) 860px, 100vw" className="hidden object-cover object-left-top dark:block" />
          </div>
        </div>
      </div>
    </Scene>
  );
}
