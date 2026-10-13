import { api } from "@convex/_generated/api";
import { ConvexError } from "convex/values";
import { NextResponse, type NextRequest } from "next/server";
import { fetchAuthAction, isAuthenticated } from "@/lib/auth-server";

/*
 * Buying: /checkout?product=zuno. Signed out, you sign up first and come straight back; signed in,
 * Convex opens a Whop checkout tied to your account and you're sent to it.
 */
export async function GET(req: NextRequest) {
  const product = req.nextUrl.searchParams.get("product") ?? "";
  if (!(await isAuthenticated())) {
    const up = new URL("/sign-up", req.url);
    up.searchParams.set("next", `/checkout?product=${encodeURIComponent(product)}`);
    return NextResponse.redirect(up);
  }
  try {
    const { url } = await fetchAuthAction(api.checkout.start, { product });
    return NextResponse.redirect(url);
  } catch (e) {
    const back = new URL("/pro", req.url);
    back.searchParams.set("checkout", "unavailable");
    // A ConvexError carries words meant for people; anything else stays a generic note.
    back.searchParams.set("why", e instanceof ConvexError ? String(e.data) : "Payments are being connected. Try again soon.");
    return NextResponse.redirect(back);
  }
}
