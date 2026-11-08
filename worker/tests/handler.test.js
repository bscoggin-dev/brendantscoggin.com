import { test } from "node:test";
import assert from "node:assert/strict";
import { createFakeD1 } from "./fake-d1.js";
import { handleContact, HOURLY_CAP } from "../handler.js";

const manifest = { cats: ["cats-01.jpg"], dogs: ["dogs-01.jpg"], alien: ["alien-01.jpg"] };
const now = new Date("2026-11-07T12:00:00.000Z");
const fields = { name: "Ada", email: "ada@example.com", subject: "Hi", message: "Hello", animal: "cats", website: "", "cf-turnstile-response": "tok" };
const human = async () => true;
const bot = async () => false;

const post = (f = fields, path = "/api/contact", method = "POST") =>
  new Request(`https://brendantscoggin.com${path}`, {
    method,
    body: method === "POST" ? new URLSearchParams(f) : undefined,
    headers: method === "POST" ? { "content-type": "application/x-www-form-urlencoded", "CF-Connecting-IP": "203.0.113.9" } : undefined,
  });
// Every call passes a Turnstile stub; the real verifier has its own tests in turnstile.test.js.
const call = (req, db, { at = now, m = manifest, verify = human, env = {} } = {}) =>
  handleContact(req, { DB: db, TURNSTILE_SECRET: "sec", ...env }, at, () => 0, m, verify);
const rows = (db) => db.sqlite.prepare("SELECT * FROM messages").all();
const loc = (r) => r.headers.get("location");

test("valid post inserts one row and redirects with img", async () => {
  const db = createFakeD1();
  const r = await call(post(), db);
  assert.equal(r.status, 303);
  assert.equal(loc(r), "/contact.html?sent=1&img=cats-01.jpg");
  const all = rows(db);
  assert.equal(all.length, 1);
  assert.equal(all[0].animal, "cats");
  assert.equal(all[0].created_at, now.toISOString());
});

test("each button redirects to its own group", async () => {
  for (const a of ["cats", "dogs", "alien"]) {
    const r = await call(post({ ...fields, animal: a }), createFakeD1());
    assert.match(loc(r), new RegExp(`img=${a}-01\\.jpg$`));
  }
});

test("row is inserted before image choice", async () => {
  const db = createFakeD1();
  const exploding = { get cats() { throw new Error("manifest broke"); } };
  const r = await call(post(), db, { m: exploding });
  assert.equal(loc(r), "/contact.html?sent=1");
  assert.equal(rows(db).length, 1);
});

test("empty group redirects sent=1 with no img", async () => {
  assert.equal(loc(await call(post(), createFakeD1(), { m: { cats: [] } })), "/contact.html?sent=1");
});

test("honeypot redirects as success and inserts nothing", async () => {
  const db = createFakeD1();
  const r = await call(post({ ...fields, website: "x" }), db);
  assert.equal(r.status, 303);
  assert.match(loc(r), /^\/contact\.html\?sent=1/);
  assert.equal(rows(db).length, 0);
});

test("invalid email redirects error=invalid with the field and inserts nothing", async () => {
  const db = createFakeD1();
  const r = await call(post({ ...fields, email: "nope" }), db);
  assert.equal(loc(r), "/contact.html?error=invalid&field=email");
  assert.equal(rows(db).length, 0);
});

test("failed Turnstile check redirects error=captcha and inserts nothing", async () => {
  const db = createFakeD1();
  const r = await call(post(), db, { verify: bot });
  assert.equal(loc(r), "/contact.html?error=captcha");
  assert.equal(rows(db).length, 0);
});

test("Turnstile gets the token, the secret and the visitor IP", async () => {
  let seen;
  await call(post(), createFakeD1(), { verify: async (...a) => { seen = a; return true; } });
  assert.deepEqual(seen, ["tok", "sec", "203.0.113.9"]);
});

test("missing Turnstile secret redirects error=server and inserts nothing", async () => {
  const db = createFakeD1();
  const throwing = async () => { throw new Error("TURNSTILE_SECRET is not configured"); };
  const r = await call(post(), db, { verify: throwing });
  assert.equal(loc(r), "/contact.html?error=server");
  assert.equal(rows(db).length, 0);
});

test("Turnstile is not consulted for honeypot or invalid submissions", async () => {
  let calls = 0;
  const counting = async () => { calls++; return true; };
  await call(post({ ...fields, website: "x" }), createFakeD1(), { verify: counting });
  await call(post({ ...fields, email: "nope" }), createFakeD1(), { verify: counting });
  assert.equal(calls, 0);
});

test(`message number ${HOURLY_CAP + 1} within an hour redirects error=busy`, async () => {
  const db = createFakeD1();
  for (let i = 0; i < HOURLY_CAP; i++) {
    assert.match(loc(await call(post(), db, { at: new Date(now.getTime() - i * 1000) })), /sent=1/);
  }
  assert.equal(loc(await call(post(), db)), "/contact.html?error=busy");
  assert.equal(rows(db).length, HOURLY_CAP);
});

test("messages older than an hour do not count toward the cap", async () => {
  const db = createFakeD1();
  const old = new Date(now.getTime() - 61 * 60 * 1000);
  for (let i = 0; i < HOURLY_CAP; i++) await call(post(), db, { at: old });
  assert.match(loc(await call(post(), db)), /sent=1/);
});

test("non-POST returns 405, other paths 404", async () => {
  assert.equal((await call(post(fields, "/api/contact", "GET"), createFakeD1())).status, 405);
  assert.equal((await call(post(fields, "/api/other"), createFakeD1())).status, 404);
});

test("D1 throwing redirects error=server", async () => {
  const db = createFakeD1();
  db.failNext = new Error("D1 down");
  assert.equal(loc(await call(post(), db)), "/contact.html?error=server");
});
