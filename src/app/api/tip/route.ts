import type { NextRequest } from "next/server";
import { sameOrigin } from "@/server/guard";
import { CheckoutError, startTip, tipsOpen } from "@/server/whop";

/** Whether payments are connected, so the dialog can say so up front. */
export function GET() {
  return Response.json({ open: tipsOpen() }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * A checkout for a Claude plan, for the amount in the body: { amount } in dollars. Answers with
 * { url }, Whop's checkout page, or { error } in words for the person paying. No sign in needed.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { amount?: unknown } | null;
  const amount = typeof body?.amount === "number" ? body.amount : Number(body?.amount);
  try {
    return Response.json({ url: await startTip(amount) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof CheckoutError) return Response.json({ error: e.message }, { status: tipsOpen() ? 400 : 503 });
    console.error("Tip checkout:", e instanceof Error ? e.message : e);
    return Response.json({ error: "Whop didn't open a checkout. Try again in a moment." }, { status: 502 });
  }
}
