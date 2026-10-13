"use client";

import { DeviceFrame } from "./frames";
import { composeUrl, liveUrl, templateOf, viewUrl } from "./live";

/* A template's real site in the device frame. Copying it takes the home page, every section in order. */
export function TemplatePreview({ slug }: { slug: string }) {
  const t = templateOf(slug)!;
  const names = Object.fromEntries(t.sections.map((s) => [s.id, `${t.name} / ${s.name}`]));
  const keys = t.home.map((id, i) => `${id}:home${i}`);
  return <DeviceFrame src={liveUrl(slug)} full={viewUrl(slug)} title={`${t.name} live preview`} height={760} copy={{ name: `${t.name} home`, get: () => null, live: { url: composeUrl(slug, keys), names } }} />;
}
