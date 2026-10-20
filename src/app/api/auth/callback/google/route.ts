import { cookies } from "next/headers";
import { after, NextResponse, type NextRequest } from "next/server";
import { GOOGLE_COOKIE, googleTokens, safeNext } from "@/server/google";
import { later, welcomeOnce } from "@/server/mail";
import { asUser } from "@/server/supabase";

/*
 * Back from Google: the code becomes Google's ID token, and the ID token a Supabase session, in
 * this site's cookies. Then on to the page they set out from. Anything amiss (an old or forged
 * round trip, a cancelled choice) just goes back there, signed out.
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
  const back = NextResponse.redirect(new URL(safeNext(saved.next ?? null), req.url));
  const q = req.nextUrl.searchParams;
  const code = q.get("code");
  if (!code || !saved.state || !saved.verifier || q.get("state") !== saved.state) return back;
  const tokens = await googleTokens(req.nextUrl.origin, code, saved.verifier);
  if (!tokens) return back;
  const db = await asUser();
  const { data } = await db.auth.signInWithIdToken({ provider: "google", token: tokens.idToken, access_token: tokens.accessToken });
  const user = data.user;
  if (user && Date.now() - new Date(user.created_at).getTime() < 120_000) after(later(() => welcomeOnce(db, user)));
  return back;
}
