import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakeD1 } from "./fake-d1.js";
import { isDue, buildDigest, runDigest, DIGEST_SUBJECT, DIGEST_LIMIT } from "../digest.js";
import { insertMessage, getSetting, setSetting, pendingCount } from "../db.js";

const now = new Date("2026-11-07T12:00:00.000Z");
const hoursAgo = (h) => new Date(now.getTime() - h * 3600e3).toISOString();
const msg = (n, extra = {}) => ({ name: `N${n}`, email: `n${n}@x.co`, subject: `S${n}`, message: `M${n}`, animal: "dogs", ...extra });
const fakeEmail = (fail = false) => {
  const sent = [];
  return { sent, async send(m) { if (fail) throw Object.assign(new Error("send failed"), { code: "E_TEST" }); sent.push(m); return { messageId: "id" + sent.length }; } };
};

test("not due when nothing pending", () => assert.equal(isDue(24, null, 0, now), false));
test("due immediately when last digest is null and one pending", () => assert.equal(isDue(24, null, 1, now), true));
test("not due before interval elapsed", () => assert.equal(isDue(24, hoursAgo(23.9), 5, now), false));
test("due exactly at interval", () => assert.equal(isDue(24, hoursAgo(24), 1, now), true));
test("unreadable last digest time counts as never sent", () => assert.equal(isDue(24, "garbage", 1, now), true));

test("buildDigest keeps HTML as literal text", () => {
  const d = buildDigest([{ id: 1, created_at: now.toISOString(), ...msg(1, { message: "<script>alert(1)</script> & co" }) }], 1);
  assert.match(d.text, /<script>alert\(1\)<\/script> & co/);
});

test("buildDigest subject is static even if a subject contains newlines", () => {
  const d = buildDigest([{ id: 1, created_at: now.toISOString(), ...msg(1, { subject: "Hi\r\nBcc: evil@x.co" }) }], 1);
  assert.equal(d.subject, DIGEST_SUBJECT);
  assert.equal(DIGEST_SUBJECT, "New contact messages");
});

test('buildDigest adds "and 12 more" when 62 pending and 50 listed', () => {
  const rows = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, created_at: now.toISOString(), ...msg(i) }));
  const d = buildDigest(rows, 62);
  assert.match(d.text, /and 12 more/);
  assert.doesNotMatch(buildDigest(rows, 50).text, /more/);
});

test("runDigest sends once, marks rows, sets last_digest_at", async () => {
  const db = createFakeD1();
  await insertMessage(db, msg(1), hoursAgo(2));
  await insertMessage(db, msg(2), hoursAgo(1));
  const EMAIL = fakeEmail();
  const r = await runDigest({ DB: db, EMAIL }, now);
  assert.deepEqual(r, { sent: 2 });
  assert.equal(EMAIL.sent.length, 1);
  assert.equal(EMAIL.sent[0].from, "contact@brendantscoggin.com");
  assert.equal(EMAIL.sent[0].to, "brendantscoggin@gmail.com");
  assert.equal(await pendingCount(db), 0);
  assert.equal(await getSetting(db, "last_digest_at"), now.toISOString());
  // the next run, with nothing new, sends nothing
  assert.deepEqual(await runDigest({ DB: db, EMAIL }, new Date(now.getTime() + 48 * 3600e3)), { sent: 0 });
  assert.equal(EMAIL.sent.length, 1);
});

test("runDigest with failing send leaves rows unmarked and last_digest_at unchanged", async () => {
  const db = createFakeD1();
  await insertMessage(db, msg(1), hoursAgo(1));
  await assert.rejects(runDigest({ DB: db, EMAIL: fakeEmail(true) }, now), /send failed/);
  assert.equal(await pendingCount(db), 1);
  assert.equal(await getSetting(db, "last_digest_at"), null);
});

test("runDigest when marking fails after send throws and rows stay pending (resend next run)", async () => {
  const db = createFakeD1();
  await insertMessage(db, msg(1), hoursAgo(1));
  const EMAIL = fakeEmail();
  const realPrepare = db.prepare.bind(db);
  db.prepare = (sql) => { if (sql.startsWith("UPDATE messages")) throw new Error("mark failed"); return realPrepare(sql); };
  await assert.rejects(runDigest({ DB: db, EMAIL }, now), /mark failed/);
  assert.equal(EMAIL.sent.length, 1);
  db.prepare = realPrepare;
  assert.equal(await pendingCount(db), 1); // at-least-once: it will be sent again next run
});

test("runDigest with nothing pending does not call send", async () => {
  const EMAIL = fakeEmail();
  assert.deepEqual(await runDigest({ DB: createFakeD1(), EMAIL }, now), { sent: 0 });
  assert.equal(EMAIL.sent.length, 0);
});

test("runDigest respects the interval setting", async () => {
  const db = createFakeD1();
  await setSetting(db, "last_digest_at", hoursAgo(5));
  await setSetting(db, "digest_interval_hours", "6");
  await insertMessage(db, msg(1), hoursAgo(1));
  const EMAIL = fakeEmail();
  assert.deepEqual(await runDigest({ DB: db, EMAIL }, now), { sent: 0 });
  await setSetting(db, "digest_interval_hours", "abc"); // unreadable falls back to 24
  assert.deepEqual(await runDigest({ DB: db, EMAIL }, now), { sent: 0 });
  await setSetting(db, "digest_interval_hours", "4");
  assert.deepEqual(await runDigest({ DB: db, EMAIL }, now), { sent: 1 });
});

test(`runDigest lists at most ${DIGEST_LIMIT} and marks only those`, async () => {
  const db = createFakeD1();
  for (let i = 0; i < DIGEST_LIMIT + 3; i++) await insertMessage(db, msg(i), hoursAgo(1));
  const EMAIL = fakeEmail();
  assert.deepEqual(await runDigest({ DB: db, EMAIL }, now), { sent: DIGEST_LIMIT });
  assert.match(EMAIL.sent[0].text, /and 3 more/);
  assert.equal(await pendingCount(db), 3);
});
