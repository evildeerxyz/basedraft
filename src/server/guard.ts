import type { NextRequest } from "next/server";
import { unlocked } from "@/lib/products";
import { asUser, call, SUPABASE_ON } from "./supabase";

/*
 * Checks for the routes that hand out a template's code.
 */

/**
 * Whether the signed-in person may take this template's code: with Pro or Team, or by having
 * bought it. Everyone else is turned away, signed in or not, in development too.
 * BD_EXPORT_OPEN=1 hands out everything, for a private preview only, and in development the
 * Pro preview (src/site/plan.ts) asks for it with a header. Production ignores the header.
 */
export async function mayExport(template: string, req?: NextRequest) {
  if (process.env.BD_EXPORT_OPEN === "1") return true;
  if (process.env.NODE_ENV !== "production" && req?.headers.get("x-bd-preview") === "pro") return true;
  if (!SUPABASE_ON) return false;
  try {
    const mine = await call(await asUser(), "purchases_mine", {});
    return unlocked(mine?.products ?? []).includes(template as never);
  } catch {
    return false;
  }
}

/** A write from this site's own pages, not a form or script on another site. */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

/**
 * Whether the signed-in person has Pro or Team: for a Pro component's source. The same openings
 * as mayExport: BD_EXPORT_OPEN for a private preview, and the Pro preview header in development.
 */
export async function hasPro(req?: NextRequest) {
  if (process.env.BD_EXPORT_OPEN === "1") return true;
  if (process.env.NODE_ENV !== "production" && req?.headers.get("x-bd-preview") === "pro") return true;
  if (!SUPABASE_ON) return false;
  try {
    const products: string[] = (await call(await asUser(), "purchases_mine", {}))?.products ?? [];
    return products.includes("pro") || products.includes("team");
  } catch {
    return false;
  }
}

export const NEEDS_PRO_COMPONENT = "This component's code comes with Pro. Sign in with the email you bought Pro with.";

export const NEEDS_PRO = "Code export is in Pro, or comes with buying this template. Sign in with the email you bought with.";
