import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstile, SITEVERIFY_URL } from "../turnstile.js";

const fakeFetch = (reply, calls = []) => async (url, init) => {
  calls.push({ url, body: Object.fromEntries(init.body) });
  if (reply instanceof Error) throw reply;
  return { ok: true, json: async () => reply };
};

test("passes when siteverify says success, and sends secret, token and ip", async () => {
  const calls = [];
  assert.equal(await verifyTurnstile("tok", "sec", "1.2.3.4", fakeFetch({ success: true }, calls)), true);
  assert.equal(calls[0].url, SITEVERIFY_URL);
  assert.deepEqual(calls[0].body, { secret: "sec", response: "tok", remoteip: "1.2.3.4" });
});

test("omits remoteip when unknown", async () => {
  const calls = [];
  await verifyTurnstile("tok", "sec", null, fakeFetch({ success: true }, calls));
  assert.deepEqual(calls[0].body, { secret: "sec", response: "tok" });
});

test("fails when siteverify says no", async () => {
  assert.equal(await verifyTurnstile("tok", "sec", null, fakeFetch({ success: false, "error-codes": ["invalid-input-response"] })), false);
});

test("fails without calling siteverify for a missing, empty or oversized token", async () => {
  const calls = [];
  for (const t of [undefined, "", "x".repeat(2049)]) assert.equal(await verifyTurnstile(t, "sec", null, fakeFetch({ success: true }, calls)), false);
  assert.equal(calls.length, 0);
});

test("fails closed when siteverify is unreachable", async () => {
  assert.equal(await verifyTurnstile("tok", "sec", null, fakeFetch(new Error("network down"))), false);
});

test("throws when the secret is not configured (a setup error, not a visitor error)", async () => {
  await assert.rejects(verifyTurnstile("tok", undefined, null, fakeFetch({ success: true })), /TURNSTILE_SECRET/);
});
