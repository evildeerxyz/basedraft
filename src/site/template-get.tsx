"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { REPO } from "@/registry";
import { templateOf, type TemplateSlug } from "./live";

/*
 * A template page's main action: its code, free, in basedraft's repository on GitHub (or its own
 * repository, for one that has one). The words lead and the icon follows, as on every button that
 * goes somewhere.
 */
export function TemplateGet({ slug, className }: { slug: TemplateSlug; className: string }) {
  const t = templateOf(slug)!;
  return (
    <a href={t.repo ?? `${REPO}/tree/main/templates/${slug}`} target="_blank" rel="noreferrer" className={className}>
      Get the code <ArrowUpRightIcon weight="regular" size={15} />
    </a>
  );
}
