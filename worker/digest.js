// Scheduled digest: one plain-text email listing unsent messages, on a minimum-gap cadence.
// Rows are marked only after the send succeeds, so a failed send is retried next hour.
import { pendingMessages, pendingCount, markDigested, getSetting, setSetting } from "./db.js";

export const DIGEST_SUBJECT = "New contact messages"; // static: no visitor text ever reaches a header
export const DIGEST_LIMIT = 50;
export const SENDER = "contact@brendantscoggin.com";
// Must equal send_email.destination_address in wrangler.jsonc (the binding refuses any other address).
// Passed explicitly because the local `wrangler dev` email simulator throws when `to` is omitted.
export const RECIPIENT = "brendantscoggin@gmail.com";

export function isDue(intervalHours, lastDigestAt, pending, now) {
  if (pending < 1) return false;
  const last = lastDigestAt ? Date.parse(lastDigestAt) : NaN;
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= intervalHours * 3600e3;
}

export function buildDigest(messages, totalPending) {
  const parts = messages.map((m) =>
    [
      `Time:    ${m.created_at}`,
      `Name:    ${m.name}`,
      `Email:   ${m.email}`,
      `Subject: ${m.subject}`,
      `Button:  ${m.animal}`,
      "",
      m.message,
    ].join("\n"),
  );
  let text = `${messages.length} new message${messages.length === 1 ? "" : "s"} from brendantscoggin.com/contact.html\n\n`;
  text += parts.join("\n\n----------------------------------------\n\n");
  if (totalPending > messages.length) text += `\n\nand ${totalPending - messages.length} more`;
  return { subject: DIGEST_SUBJECT, text: text + "\n" };
}

export async function runDigest(env, now) {
  const raw = Number(await getSetting(env.DB, "digest_interval_hours"));
  const interval = Number.isFinite(raw) && raw > 0 ? raw : 24;
  const last = await getSetting(env.DB, "last_digest_at");
  const total = await pendingCount(env.DB);
  if (!isDue(interval, last, total, now)) return { sent: 0 };

  const rows = await pendingMessages(env.DB, DIGEST_LIMIT);
  const { subject, text } = buildDigest(rows, total);
  await env.EMAIL.send({ from: SENDER, to: RECIPIENT, subject, text });

  const nowIso = now.toISOString();
  await markDigested(env.DB, rows.map((r) => r.id), nowIso);
  await setSetting(env.DB, "last_digest_at", nowIso);
  return { sent: rows.length };
}
