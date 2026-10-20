/*
 * Standard Webhooks (standardwebhooks.com), as Whop's webhook and Supabase's auth hooks both sign:
 * HMAC-SHA256 of "{webhook-id}.{webhook-timestamp}.{body}", in base64, in webhook-signature.
 */

const enc = new TextEncoder();
const b64 = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

/**
 * The key a secret signs with. Standard Webhooks' `whsec_` secrets (Supabase's come as
 * `v1,whsec_…`) sign with the base64 after the prefix; Whop's `ws_` ones with their own bytes.
 */
function keyBytes(secret: string) {
  const s = secret.replace(/^v1,/, "");
  return s.startsWith("whsec_") ? Uint8Array.from(atob(s.slice(6)), (c) => c.charCodeAt(0)) : enc.encode(s);
}

export async function verified(req: Request, body: string, secret: string | undefined) {
  const id = req.headers.get("webhook-id");
  const ts = req.headers.get("webhook-timestamp");
  const sigs = req.headers.get("webhook-signature");
  if (!secret || !id || !ts || !sigs) return false;
  // Older than five minutes, or from the future: a replay.
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", keyBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = b64(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${body}`)));
  // The header can carry several signatures, "v1,<sig> v1,<sig>", while a secret rotates.
  return sigs.split(" ").some((s) => {
    const sig = s.split(",")[1] ?? "";
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}
