"use client";

import { CheckCircleIcon, DownloadSimpleIcon, GithubLogoIcon, LockSimpleIcon, ReceiptIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GitHubPanel } from "@/studio/github";
import { newProject } from "@/studio/state";
import { openAuth, useAuth } from "./auth";
import { Dialog, DialogClose } from "./dialog";
import { TEMPLATES, templateOf, templateShot, type TemplateSlug } from "./live";
import { previewHeaders, usePlan, usePurchases } from "./plan";
import { btn, btnSm } from "./sheet";
import { toast } from "./toast";

/*
 * What you've bought, and the two ways to take a template: the whole site as a zip, or a GitHub
 * repository made with it. The order email links here (?download=zuno, ?github=zuno), and Whop
 * sends people back here after checkout (?checkout=done), where the purchase shows up the moment
 * its webhook lands.
 */

const NAMES: Record<string, string> = { pro: "basedraft Pro", team: "basedraft Team" };
const nameOf = (product: string) => NAMES[product] ?? templateOf(product)?.name ?? product;
const money = (amount?: number, currency?: string) => (amount === undefined ? "" : (currency ?? "usd").toLowerCase() === "usd" ? `$${amount.toFixed(2)}` : `${amount.toFixed(2)} ${(currency ?? "").toUpperCase()}`);

async function download(slug: TemplateSlug) {
  const r = await fetch("/api/export", { method: "POST", headers: { "Content-Type": "application/json", ...previewHeaders() }, body: JSON.stringify(newProject(slug)) });
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
  // Pro (or, in development, its preview) unlocks every template; otherwise what was bought.
  const unlocked = new Set<string>(plan === "pro" ? TEMPLATES.map((t) => t.slug) : (mine?.templates ?? []));
  const bought = q.get("checkout") === "done" ? q.get("product") : null;
  const arrived = bought ? Boolean(mine?.products.includes(bought)) : false;

  const take = async (slug: TemplateSlug) => {
    setBusy(slug);
    try {
      await download(slug);
      toast(`Downloading ${templateOf(slug)!.name}`, { detail: "Unzip it, run npm install, and it runs." });
    } catch (e) {
      toast("Couldn't download that", { tone: "error", detail: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  // From the order email: start the download once we know it's theirs, once.
  const asked = useRef(false);
  const want = q.get("download");
  useEffect(() => {
    if (asked.current || !want || !unlocked.has(want)) return;
    asked.current = true;
    const id = setTimeout(() => void take(want as TemplateSlug), 0);
    return () => clearTimeout(id);
  });

  if (loading || (user && mine === undefined)) return <div className="h-[420px]" aria-busy="true" />;

  if (!user)
    return (
      <div className="bd-reveal rounded-[var(--bd-r-sheet)] bg-surface p-6 shadow-[0_0_0_1px_var(--bd-line)] md:p-8">
        <LockSimpleIcon size={22} weight="duotone" className="text-muted" />
        <h2 className="mt-3 text-heading">Sign in to see your purchases</h2>
        <p className="mt-1.5 max-w-[520px] text-body text-muted">Use the email you bought with. Your templates are waiting there, ready to download or send to GitHub.</p>
        <button type="button" onClick={() => openAuth("sign-in")} className={cn(btn.ink, "mt-5")}>
          Sign in
        </button>
      </div>
    );

  const owned = TEMPLATES.filter((t) => unlocked.has(t.slug));
  const locked = TEMPLATES.filter((t) => !unlocked.has(t.slug));
  const project = github ? newProject(github) : null;

  return (
    <div className="space-y-12">
      {bought && (
        <p role="status" className={cn("bd-reveal flex items-center gap-3 rounded-[var(--bd-r-sheet)] px-5 py-4 text-ui shadow-[0_0_0_1px_var(--bd-line)]", arrived ? "bg-surface" : "bg-surface-2")}>
          {arrived ? (
            <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-[#1f9d55]" />
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
        <p className="bd-reveal px-1 text-body text-muted">
          <span className="font-medium text-fg">{nameOf(mine.products.includes("team") ? "team" : "pro")} is yours:</span> every template, every section and every update to come.
        </p>
      )}

      <section aria-labelledby="owned-title">
        <h2 id="owned-title" className="mb-4 px-1 text-heading">
          Yours to take
        </h2>
        <ul className="space-y-3">
          {owned.map((t) => (
            <li key={t.slug} className="bd-reveal flex flex-wrap items-center gap-5 rounded-[var(--bd-r-sheet)] bg-surface p-3 shadow-[0_0_0_1px_var(--bd-line)]">
              <span className="relative block aspect-[16/10] w-[168px] shrink-0 overflow-hidden rounded-[6px] bg-surface-2 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
                <Image src={templateShot(t.slug)} alt="" fill sizes="168px" className="object-cover object-top" />
              </span>
              <div className="min-w-[180px] flex-1">
                <p className="flex items-center gap-2 text-heading">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
                  {t.name}
                </p>
                <p className="mt-0.5 text-ui text-muted">
                  {t.price === "free" ? "Free" : "Yours"}, {t.pages.length} pages, Next.js 16
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pr-2">
                <button type="button" onClick={() => void take(t.slug)} disabled={busy !== null} className={cn(btnSm.ink, "disabled:opacity-50")}>
                  {busy === t.slug ? <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <DownloadSimpleIcon size={15} weight="bold" />}
                  Download
                </button>
                <button type="button" onClick={() => setGithub(t.slug)} className={btnSm.quiet}>
                  <GithubLogoIcon size={15} weight="fill" /> Send to GitHub
                </button>
                <Link href={`/studio?template=${t.slug}`} className={btnSm.quiet}>
                  Open in Studio
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {locked.length > 0 && (
        <section aria-labelledby="more-title">
          <h2 id="more-title" className="mb-1 px-1 text-heading">
            Not yours yet
          </h2>
          <p className="mb-4 px-1 text-ui text-muted">
            Buy one, or <a href="/checkout?product=pro" className="font-medium text-fg underline-offset-2 hover:underline">get every template with Pro</a> for $149 once.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {locked.map((t) => (
              <li key={t.slug} className="bd-reveal flex items-center justify-between gap-4 rounded-[var(--bd-r-sheet)] bg-surface px-5 py-4 shadow-[0_0_0_1px_var(--bd-line)]">
                <span className="flex items-center gap-2 text-ui font-medium">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
                  {t.name}
                  <span className="font-normal text-muted">{t.tagline.split(",")[0]}</span>
                </span>
                {t.price === "free" ? (
                  // Free templates are open source: their code is on GitHub, not in a download here.
                  <a href={t.repo} target="_blank" rel="noreferrer" className={btnSm.quiet}>
                    Free on GitHub
                  </a>
                ) : (
                  <a href={`/checkout?product=${t.slug}`} className={btnSm.quiet}>
                    Buy for ${t.price}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {mine && mine.purchases.length > 0 && (
        <section aria-labelledby="receipts-title">
          <h2 id="receipts-title" className="mb-4 px-1 text-heading">
            Receipts
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]">
            {mine.purchases.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-ui">
                <span className="flex items-center gap-2.5">
                  <ReceiptIcon size={16} className="text-subtle" />
                  {nameOf(p.product)}
                </span>
                <span className="flex items-center gap-4 text-muted">
                  <span className="tabular-nums">{money(p.amount, p.currency)}</span>
                  <span className="tabular-nums">{new Date(p.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 px-1 text-ui text-muted">
            Whop emails a receipt for every purchase. For a refund within 14 days, write to{" "}
            <a href="mailto:hello@basedraft.site" className="font-medium text-fg underline-offset-2 hover:underline">
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
            <div className="px-6 pt-6">
              <h2 id="gh-title" className="text-title">
                Send {project.name} to GitHub
              </h2>
              <p className="mt-2 text-body text-muted">A new repository with the whole site in it, or a pull request on one you already have.</p>
            </div>
            <GitHubPanel project={project} onBack={() => setGithub(null)} back="Purchases" returnTo={`/purchases?github=${github}`} />
          </>
        )}
      </Dialog>
    </div>
  );
}
