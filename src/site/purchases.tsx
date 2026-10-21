"use client";

import { ArrowRightIcon, ArrowUpRightIcon, CheckCircleIcon, DownloadSimpleIcon, GithubLogoIcon, LockSimpleIcon, ReceiptIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GitHubPanel } from "@/studio/github";
import { newProject } from "@/studio/state";
import { openAuth, useAuth } from "./auth";
import { refresh } from "./db";
import { Dialog, DIALOG_BODY, DIALOG_TITLE, DialogClose } from "./dialog";
import { TEMPLATES, templateOf, templateShot, type TemplateSlug } from "./live";
import { previewHeaders, usePlan, usePurchases } from "./plan";
import { IconTile } from "./plan-parts";
import { btn, btnLg, ProBadge } from "./sheet";
import { toast } from "./toast";
import { FrameworkSwitch, useFramework, type Framework } from "./framework";

/*
 * What you've bought, and the two ways to take a template: the whole site as a zip, or a GitHub
 * repository made with it. The order email links here (?download=zuno, ?github=zuno), and Whop
 * sends people back here after checkout (?checkout=done), where the purchase shows up as soon as
 * its webhook lands: until then, the page asks every few seconds.
 */

const NAMES: Record<string, string> = { pro: "basedraft Pro", team: "basedraft Team" };
const nameOf = (product: string) => NAMES[product] ?? templateOf(product)?.name ?? product;
const money = (amount?: number, currency?: string) => (amount === undefined ? "" : (currency ?? "usd").toLowerCase() === "usd" ? `$${amount.toFixed(2)}` : `${amount.toFixed(2)} ${(currency ?? "").toUpperCase()}`);

/* A quiet gray frame with 34px corners, and the white panels set in it at 26px. */
const FRAME = "rounded-[var(--bd-r-stage)] bg-surface-2 p-2";
const PANEL = "rounded-[var(--bd-r-sheet)] bg-surface";

async function download(slug: TemplateSlug, framework: Framework) {
  const r = await fetch(`/api/export?framework=${framework}`, { method: "POST", headers: { "Content-Type": "application/json", ...previewHeaders() }, body: JSON.stringify(newProject(slug)) });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "The download didn't start");
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? `${slug}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Purchases() {
  const q = useSearchParams();
  const { user, loading } = useAuth();
  const mine = usePurchases();
  const [busy, setBusy] = useState<TemplateSlug | null>(null);
  const [github, setGithub] = useState<TemplateSlug | null>(() => (templateOf(q.get("github") ?? "") ? (q.get("github") as TemplateSlug) : null));
  const [plan] = usePlan();
  const [framework, setFramework] = useFramework();
  // Pro (or, in development, its preview) unlocks every template; otherwise what was bought.
  const unlocked = new Set<string>(plan === "pro" ? TEMPLATES.map((t) => t.slug) : (mine?.templates ?? []));
  const bought = q.get("checkout") === "done" ? q.get("product") : null;
  const arrived = bought ? Boolean(mine?.products.includes(bought)) : false;
  const waiting = Boolean(bought && user && !arrived);
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => refresh("purchases_mine"), 3000);
    return () => clearInterval(t);
  }, [waiting]);

  const take = async (slug: TemplateSlug, as: Framework = framework) => {
    setBusy(slug);
    try {
      await download(slug, as);
      toast(`Downloading ${templateOf(slug)!.name}${as === "astro" ? " for Astro" : ""}`, { detail: as === "astro" ? "Unzip it, run npm install and npm run dev (Node.js 22.12 or newer)." : "Unzip it, run npm install, and it runs." });
    } catch (e) {
      toast("Couldn't download that", { tone: "error", detail: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  // From the order email: start the download once we know it's theirs, once (its Astro link says so).
  const asked = useRef(false);
  const want = q.get("download");
  useEffect(() => {
    if (asked.current || !want || !unlocked.has(want)) return;
    asked.current = true;
    const as: Framework = q.get("framework") === "astro" ? "astro" : framework;
    if (as !== framework) setFramework(as);
    const id = setTimeout(() => void take(want as TemplateSlug, as), 0);
    return () => clearTimeout(id);
  });

  if (loading || (user && mine === undefined)) return <div className="h-[420px]" aria-busy="true" />;

  if (!user)
    return (
      <div className={cn(FRAME, "bd-reveal mx-auto max-w-[720px]")}>
        <div className={cn(PANEL, "p-7 sm:p-9")}>
          <IconTile icon={LockSimpleIcon} />
          <h2 className="mt-5 text-[22px] font-medium leading-[1.1] tracking-[-0.02em]">Sign in to see your purchases</h2>
          <p className="mt-3 max-w-[520px] text-ui leading-[1.55] text-muted">Use the email you bought with. Your templates are waiting there, ready to download or send to GitHub.</p>
          <button type="button" onClick={() => openAuth("sign-in")} className={cn(btnLg.ink, "mt-7")}>
            Sign in
          </button>
        </div>
      </div>
    );

  const owned = TEMPLATES.filter((t) => unlocked.has(t.slug));
  const locked = TEMPLATES.filter((t) => !unlocked.has(t.slug));
  const project = github ? newProject(github) : null;

  return (
    <div className="mx-auto max-w-[1120px] space-y-20">
      {(bought || (plan === "pro" && mine)) && (
        <div className="space-y-2">
          {bought && (
            <p role="status" className={cn(PANEL, "bd-reveal flex items-center gap-3 border border-line-subtle px-6 py-5 text-ui")}>
              {arrived ? (
                <CheckCircleIcon size={20} weight="duotone" className="shrink-0 text-[oklch(0.62_0.17_150)]" />
              ) : (
                <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-fg/30 border-t-fg" />
              )}
              <span>
                <span className="font-medium">{arrived ? `${nameOf(bought)} is yours.` : "Confirming your payment with Whop."}</span>{" "}
                <span className="text-muted">{arrived ? "We've emailed you the links too." : "This takes a few seconds; the page updates on its own."}</span>
              </span>
            </p>
          )}
          {plan === "pro" && mine && (
            <p className={cn(PANEL, "bd-reveal flex items-center gap-3 border border-line-subtle px-6 py-5 text-ui")}>
              <ProBadge />
              <span>
                <span className="font-medium">{nameOf(mine.products.includes("team") ? "team" : "pro")} is yours:</span> <span className="text-muted">every template, every section and every update to come.</span>
              </span>
            </p>
          )}
        </div>
      )}

      <section aria-labelledby="owned-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="owned-title" className="text-title">
            Yours to take
          </h2>
          {/* Every template comes both ways: its own Next.js code, or its Astro version. */}
          <div className="flex items-center gap-2.5 text-ui text-muted">
            Download for
            <FrameworkSwitch value={framework} onChange={setFramework} label="Download for" />
          </div>
        </div>
        <ul className={cn(FRAME, "space-y-2")}>
          {owned.map((t) => (
            <li key={t.slug} className={cn(PANEL, "bd-reveal flex flex-wrap items-center gap-5 p-3 pr-5")}>
              <span className="relative block aspect-[16/10] w-[176px] shrink-0 overflow-hidden rounded-[var(--bd-r-inset)] border border-line bg-surface-2">
                <Image src={templateShot(t.slug)} alt="" fill sizes="176px" className="object-cover object-top" />
              </span>
              <div className="min-w-[180px] flex-1">
                <p className="flex items-center gap-2 text-[16px] font-medium tracking-[-0.02em]">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
                  {t.name}
                </p>
                <p className="mt-1.5 text-ui text-muted">
                  {t.price === "free" ? "Free" : "Yours"}, {t.pages.length} pages, Next.js 16 or Astro 7
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void take(t.slug)} disabled={busy !== null} className={cn(btn.ink, "disabled:opacity-50")}>
                  {busy === t.slug ? <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <DownloadSimpleIcon weight="duotone" size={15} />}
                  Download
                </button>
                <button type="button" onClick={() => setGithub(t.slug)} className={btn.outline}>
                  <GithubLogoIcon size={15} weight="duotone" /> Send to GitHub
                </button>
                <Link href={`/studio?template=${t.slug}`} className={btn.outline}>
                  Open in Studio
                </Link>
              </div>
            </li>
          ))}
          {!owned.length && <li className={cn(PANEL, "px-6 py-10 text-center text-ui text-muted")}>Nothing here yet. Buy a template below, or get every one with Pro.</li>}
        </ul>
      </section>

      {locked.length > 0 && (
        <section aria-labelledby="more-title">
          <div className="mb-8">
            <h2 id="more-title" className="text-title">
              Not yours yet
            </h2>
            <p className="mt-3 text-ui text-muted">
              Buy one, or{" "}
              <a href="/checkout?product=pro" className="font-medium text-fg transition-opacity hover:opacity-70">
                get every template with Pro
              </a>{" "}
              for $149 once.
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {locked.map((t) => (
              <li key={t.slug} className="bd-reveal grid gap-3.5 rounded-[var(--bd-r-sheet)] border border-line-subtle bg-surface p-[26px]">
                <span className="flex items-center gap-2.5">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
                  <span className="text-[16px] font-medium">{t.name}</span>
                  <span className="text-ui text-muted">{t.price === "free" ? "Free" : `$${t.price}`}</span>
                </span>
                <span className="text-ui leading-[1.55] text-muted">{t.tagline}</span>
                {t.price === "free" ? (
                  // Free templates are open source: their code is on GitHub, not in a download here.
                  <a href={t.repo} target="_blank" rel="noreferrer" className="bd-link inline-flex w-fit items-center gap-2 text-meta font-medium">
                    Free on GitHub <ArrowUpRightIcon weight="regular" size={12} />
                  </a>
                ) : (
                  <a href={`/checkout?product=${t.slug}`} className="bd-link inline-flex w-fit items-center gap-2 text-meta font-medium">
                    Buy for ${t.price} <ArrowRightIcon weight="regular" size={12} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {mine && mine.purchases.length > 0 && (
        <section aria-labelledby="receipts-title">
          <h2 id="receipts-title" className="mb-8 text-title">
            Receipts
          </h2>
          <ul className="space-y-0.5 rounded-[var(--bd-r-stage)] bg-surface-2 p-3 sm:p-6">
            {mine.purchases.map((p) => (
              <li key={p.id} className="flex h-11 items-center justify-between gap-4 rounded-[14px] bg-surface px-3 text-ui">
                <span className="flex min-w-0 items-center gap-2.5">
                  <ReceiptIcon weight="duotone" size={15} className="shrink-0 text-muted" />
                  <span className="truncate">{nameOf(p.product)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-6 text-meta text-muted">
                  <span className="tabular-nums">{money(p.amount, p.currency)}</span>
                  <span className="tabular-nums">{new Date(p.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-ui text-muted">
            Whop emails a receipt for every purchase. For a refund within 14 days, write to{" "}
            <a href="mailto:hello@basedraft.site" className="font-medium text-fg transition-opacity hover:opacity-70">
              hello@basedraft.site
            </a>
            .
          </p>
        </section>
      )}

      <Dialog open={project !== null} onClose={() => setGithub(null)} labelledBy="gh-title" className="max-w-[640px]">
        {project && (
          <>
            <DialogClose onClose={() => setGithub(null)} />
            <div className="px-7 pr-16 pt-7">
              <h2 id="gh-title" className={DIALOG_TITLE}>
                Send {project.name} to GitHub
              </h2>
              <p className={DIALOG_BODY}>A new repository with the whole site in it, or a pull request on one you already have.</p>
            </div>
            <GitHubPanel project={project} framework={framework} onBack={() => setGithub(null)} back="Purchases" returnTo={`/purchases?github=${github}`} />
          </>
        )}
      </Dialog>
    </div>
  );
}
