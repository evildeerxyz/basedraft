/*
 * Continue with Google, through this site rather than through Supabase's own address: Google
 * sends people back to <site>/api/auth/callback/google (the address its OAuth client already
 * allows, and the one its consent screen names), the site trades the code for Google's ID token,
 * and Supabase signs them in with it (signInWithIdToken). Needs GOOGLE_CLIENT_ID and
 * GOOGLE_CLIENT_SECRET here, and the same client id on Supabase's Google provider.
 */

/** The round trip's state, in an httpOnly cookie on the auth routes only, for ten minutes. */
export const GOOGLE_COOKIE = "bd-google";

export const googleRedirect = (origin: string) => `${process.env.NEXT_PUBLIC_SITE_URL || origin}/api/auth/callback/google`;

/** Only ever a page of this site. */
export const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

const b64url = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const random = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

/** Where to send someone to choose their Google account, and what to remember until they're back. */
export async function googleStart(origin: string, next: string) {
  const state = random();
  const verifier = random(48);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const to = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  to.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirect(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { to, saved: JSON.stringify({ state, verifier, next }) };
}

/** Google's tokens for the code it sent back, or null. */
export async function googleTokens(origin: string, code: string, verifier: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: googleRedirect(origin), grant_type: "authorization_code", code_verifier: verifier }),
  });
  const body = (await res.json().catch(() => ({}))) as { id_token?: string; access_token?: string };
  return res.ok && body.id_token ? { idToken: body.id_token, accessToken: body.access_token } : null;
}
