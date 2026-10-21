"use client";

import { COMPONENT_ICON } from "@/site/ui-library";

/** A component's own icon, for its card: on the client, where the component icons are kept. */
export function OgComponentIcon({ name }: { name: string }) {
  const I = COMPONENT_ICON[name];
  return I ? <I size={44} weight="duotone" /> : null;
}
