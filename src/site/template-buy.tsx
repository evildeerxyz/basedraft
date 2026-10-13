"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { ICON } from "./icons";
import { templateOf, type TemplateSlug } from "./live";
import { usePlan, usePurchases } from "./plan";

/** Whether someone has a template's code: with Pro, or by buying it. */
function useOwned(slug: TemplateSlug) {
  const mine = usePurchases();
  const [plan] = usePlan();
  return { owned: plan === "pro" || Boolean((mine?.templates as readonly string[] | undefined)?.includes(slug)), pro: plan === "pro" };
}

/** A template's price, or that it's already yours. */
export function TemplatePrice({ slug, className }: { slug: TemplateSlug; className?: string }) {
  const t = templateOf(slug)!;
  const { owned, pro } = useOwned(slug);
  return <span className={className}>{owned ? (pro ? "In your Pro" : "Yours") : t.price === "free" ? "Free" : `$${t.price}`}</span>;
}

/*
 * A template page's main action: buy it, or, for someone who already has it (with Pro, or bought
 * on its own), download it. Drawn as Buy on the server, and as what's true once the account is known.
 */
export function TemplateBuy({ slug, className }: { slug: TemplateSlug; className: string }) {
  const t = templateOf(slug)!;
  const { owned } = useOwned(slug);
  if (owned)
    return (
      <Link href="/purchases" className={className}>
        <DownloadSimpleIcon size={16} weight="bold" />
        Download
      </Link>
    );
  const free = t.price === "free";
  return (
    <Link href={free && t.repo ? t.repo : `/checkout?product=${slug}`} prefetch={false} className={className}>
      <ICON.pro size={16} weight="duotone" />
      {free ? "Get it on GitHub" : `Buy for $${t.price}`}
    </Link>
  );
}
