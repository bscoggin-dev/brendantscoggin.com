import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakeD1 } from "./fake-d1.js";
import { insertMessage, countSince, pendingMessages, pendingCount, markDigested, getSetting, setSetting } from "../db.js";

const msg = (n) => ({ name: `N${n}`, email: `n${n}@x.co`, subject: `S${n}`, message: `M${n}`, animal: "cats" });

test("insertMessage returns increasing ids", async () => {
  const db = createFakeD1();
  const a = await insertMessage(db, msg(1), "2026-11-07T10:00:00.000Z");
  const b = await insertMessage(db, msg(2), "2026-11-07T10:01:00.000Z");
  assert.ok(b > a);
});

test("pendingMessages returns oldest first and respects limit", async () => {
  const db = createFakeD1();
  for (let i = 1; i <= 3; i++) await insertMessage(db, msg(i), `2026-11-07T10:0${i}:00.000Z`);
  const rows = await pendingMessages(db, 2);
  assert.deepEqual(rows.map((r) => r.name), ["N1", "N2"]);
  assert.equal(await pendingCount(db), 3);
});

test("markDigested removes rows from pending", async () => {
  const db = createFakeD1();
  const a = await insertMessage(db, msg(1), "2026-11-07T10:00:00.000Z");
  await insertMessage(db, msg(2), "2026-11-07T10:01:00.000Z");
  await markDigested(db, [a], "2026-11-07T11:00:00.000Z");
  assert.deepEqual((await pendingMessages(db, 10)).map((r) => r.name), ["N2"]);
});

test("countSince counts only rows at or after the cutoff", async () => {
  const db = createFakeD1();
  await insertMessage(db, msg(1), "2026-11-07T09:59:59.999Z");
  await insertMessage(db, msg(2), "2026-11-07T10:00:00.000Z");
  await insertMessage(db, msg(3), "2026-11-07T10:30:00.000Z");
  assert.equal(await countSince(db, "2026-11-07T10:00:00.000Z"), 2);
});

test("getSetting returns seeded 24", async () => {
  assert.equal(await getSetting(createFakeD1(), "digest_interval_hours"), "24");
});

test("setSetting overwrites and inserts", async () => {
  const db = createFakeD1();
  await setSetting(db, "digest_interval_hours", "6");
  await setSetting(db, "last_digest_at", "2026-11-07T10:00:00.000Z");
  assert.equal(await getSetting(db, "digest_interval_hours"), "6");
  assert.equal(await getSetting(db, "last_digest_at"), "2026-11-07T10:00:00.000Z");
});

test("getSetting unknown key returns null", async () => {
  assert.equal(await getSetting(createFakeD1(), "nope"), null);
});

test("markDigested with no ids is a no-op", async () => {
  const db = createFakeD1();
  await insertMessage(db, msg(1), "2026-11-07T10:00:00.000Z");
  await markDigested(db, [], "2026-11-07T11:00:00.000Z");
  assert.equal(await pendingCount(db), 1);
});
