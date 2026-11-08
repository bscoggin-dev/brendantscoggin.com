// Cloudflare Turnstile server-side check. The widget alone protects nothing: every token is
// verified here before a message is saved. Tokens are single-use and expire after 5 minutes.

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token, secret, remoteip, fetchImpl = fetch) {
  if (!secret) throw new Error("TURNSTILE_SECRET is not configured");
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set("remoteip", remoteip);
  try {
    const r = await fetchImpl(SITEVERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(10_000) });
    const result = await r.json();
    if (!result.success) console.warn("contact: turnstile rejected", result["error-codes"]);
    return result.success === true;
  } catch (e) {
    console.error("contact: turnstile siteverify unreachable", e);
    return false; // fail closed: an unverifiable submission is not saved
  }
}
