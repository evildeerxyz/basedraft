import { cookies } from "next/headers";
import { after, NextResponse, type NextRequest } from "next/server";
import { GOOGLE_COOKIE, googleTokens, safeNext, signInFailed } from "@/server/google";
import { later, welcomeOnce } from "@/server/mail";
import { asUser } from "@/server/supabase";

/*
 * Back from Google: the code becomes Google's ID token, and the ID token a Supabase session, in
 * this site's cookies. Then on to the page they set out from. A cancelled choice just goes back
 * there; anything else amiss goes back saying so, with the reason in the log.
 */
export async function GET(req: NextRequest) {
  const jar = await cookies();
  let saved: { state?: string; verifier?: string; next?: string } = {};
  try {
    saved = JSON.parse(jar.get(GOOGLE_COOKIE)?.value ?? "{}");
  } catch {
    /* none */
  }
  jar.delete({ name: GOOGLE_COOKIE, path: "/api/auth" });
  const next = safeNext(saved.next ?? null);
  const back = NextResponse.redirect(new URL(next, req.url));
  const failed = (detail: string) => NextResponse.redirect(signInFailed(req, next, "failed", `Google: ${detail}`));
  const q = req.nextUrl.searchParams;
  const code = q.get("code");
  if (q.get("error") === "access_denied") return back;
  if (!code) return failed(q.get("error") ?? "no code came back");
  if (!saved.state || !saved.verifier || q.get("state") !== saved.state) return failed("the round trip's cookie was missing or didn't match");
  const tokens = await googleTokens(req.nextUrl.origin, code, saved.verifier);
  if (!tokens) return failed("Google wouldn't trade the code for a token (check the client secret and the redirect address)");
  const db = await asUser();
  const { data, error } = await db.auth.signInWithIdToken({ provider: "google", token: tokens.idToken, access_token: tokens.accessToken });
  if (error || !data.user) return failed(`Supabase refused the token: ${error?.message ?? "no user"} (check the client id under Authentication, Providers, Google)`);
  const user = data.user;
  if (user && Date.now() - new Date(user.created_at).getTime() < 120_000) after(later(() => welcomeOnce(db, user)));
  return back;
}
