import { NextResponse, type NextRequest } from "next/server";
import { asUser, signedInUser, SUPABASE_ON } from "@/server/supabase";
import { CheckoutError, startCheckout } from "@/server/whop";

/*
 * Buying: /checkout?product=zuno. Signed out, you sign up first and come straight back; signed in,
 * a Whop checkout tied to your account opens and you're sent to it.
 */
export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product") ?? "";
  const user = SUPABASE_ON ? await signedInUser(await asUser()) : null;
  if (!user) {
    const up = new URL("/sign-up", req.url);
    up.searchParams.set("next", `/checkout?product=${encodeURIComponent(product)}`);
    return NextResponse.redirect(up);
  }
  try {
    return NextResponse.redirect(await startCheckout(product, { id: user.id, email: user.email ?? "" }));
  } catch (e) {
    const back = new URL("/pro", req.url);
    back.searchParams.set("checkout", "unavailable");
    // A CheckoutError carries words meant for people; anything else stays a generic note.
    back.searchParams.set("why", e instanceof CheckoutError ? e.message : "Payments are being connected. Try again soon.");
    return NextResponse.redirect(back);
  }
}
