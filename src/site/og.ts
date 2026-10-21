import type { Metadata } from "next";

/*
 * A page's card for when it's shared: its title, its line, and its picture, a 1200 by 630 image in
 * public/og, drawn at /dev/og and saved by scripts/og.mjs. Each page sets the whole card, because a
 * page's openGraph replaces its layout's rather than adding to it.
 */
export function shareCard(key: string, title: string, description: string): Pick<Metadata, "openGraph" | "twitter"> {
  const image = { url: `/og/${key}.jpg`, width: 1200, height: 630, alt: title };
  return {
    openGraph: { type: "website", siteName: "basedraft", locale: "en_US", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

/** A page's title and description with its share card: the card's title is the page's, then the site's name unless it's already in it. */
export function withCard(key: string, meta: { title: string; description: string }): Metadata {
  return { ...meta, ...shareCard(key, /basedraft/i.test(meta.title) ? meta.title : `${meta.title} | basedraft`, meta.description) };
}
