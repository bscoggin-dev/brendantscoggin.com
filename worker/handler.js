// POST /api/contact: validate, save to D1 FIRST, then pick an image, then redirect back to the page.
// Once the row is saved the visitor always gets a success redirect, even if the image step fails.
import { validateSubmission } from "./validate.js";
import { pickImage } from "./images.js";
import { insertMessage, countSince } from "./db.js";
import { verifyTurnstile } from "./turnstile.js";

export const HOURLY_CAP = 30;

const redirect = (query) => new Response(null, { status: 303, headers: { Location: `/contact.html?${query}` } });

export async function handleContact(request, env, now = new Date(), rand = Math.random, manifest = {}, verify = verifyTurnstile) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/contact") return new Response("Not found", { status: 404 });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });

  let fields;
  try {
    fields = Object.fromEntries(await request.formData());
  } catch {
    return redirect("error=invalid");
  }

  const v = validateSubmission(fields);
  if (v.honeypot) return redirect("sent=1");
  if (!v.ok) return redirect(`error=invalid&field=${encodeURIComponent(v.field)}`);

  // Turnstile: nothing is saved unless the visitor's token checks out with Cloudflare.
  try {
    const human = await verify(fields["cf-turnstile-response"], env.TURNSTILE_SECRET, request.headers.get("CF-Connecting-IP"));
    if (!human) return redirect("error=captcha");
  } catch (e) {
    console.error("contact: turnstile not configured", e);
    return redirect("error=server");
  }

  try {
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    if ((await countSince(env.DB, hourAgo)) >= HOURLY_CAP) return redirect("error=busy");
    await insertMessage(env.DB, v.value, now.toISOString());
  } catch (e) {
    console.error("contact: database step failed", e);
    return redirect("error=server");
  }

  let img = null;
  try {
    img = pickImage(v.value.animal, manifest, rand);
  } catch (e) {
    console.error("contact: image pick failed after save", e);
  }
  return redirect(img ? `sent=1&img=${encodeURIComponent(img)}` : "sent=1");
}
