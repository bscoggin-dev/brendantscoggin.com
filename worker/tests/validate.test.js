import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSubmission, LIMITS } from "../validate.js";

const good = { name: "Ada", email: "ada@example.com", subject: "Hi", message: "Hello there", animal: "cats", website: "" };

test("accepts a complete submission", () => {
  const r = validateSubmission(good);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { name: "Ada", email: "ada@example.com", subject: "Hi", message: "Hello there", animal: "cats" });
});

test("trims whitespace", () => {
  const r = validateSubmission({ ...good, name: "  Ada  ", subject: " Hi\t" });
  assert.equal(r.value.name, "Ada");
  assert.equal(r.value.subject, "Hi");
});

for (const f of ["name", "email", "subject", "message"]) {
  test(`rejects missing ${f}`, () => {
    const r = validateSubmission({ ...good, [f]: "   " });
    assert.equal(r.ok, false);
    assert.equal(r.field, f);
  });
}

test("rejects email without @ or domain dot", () => {
  assert.equal(validateSubmission({ ...good, email: "ada.example.com" }).ok, false);
  assert.equal(validateSubmission({ ...good, email: "ada@example" }).ok, false);
});

test("rejects email containing a newline", () => {
  assert.equal(validateSubmission({ ...good, email: "ada@example.com\nBcc: x@y.z" }).ok, false);
});

test("accepts message of 5000 emoji characters and rejects 5001", () => {
  assert.equal(validateSubmission({ ...good, message: "🐶".repeat(5000) }).ok, true);
  const r = validateSubmission({ ...good, message: "🐶".repeat(5001) });
  assert.equal(r.ok, false);
  assert.equal(r.field, "message");
});

test("rejects over-limit name (101), subject (201), email (255)", () => {
  assert.equal(validateSubmission({ ...good, name: "a".repeat(101) }).field, "name");
  assert.equal(validateSubmission({ ...good, subject: "a".repeat(201) }).field, "subject");
  assert.equal(validateSubmission({ ...good, email: "a".repeat(243) + "@example.com" }).field, "email");
  assert.equal(validateSubmission({ ...good, name: "a".repeat(LIMITS.name) }).ok, true);
});

test("accepts each button value and rejects unknown animal", () => {
  for (const a of ["cats", "dogs", "alien"]) assert.equal(validateSubmission({ ...good, animal: a }).value.animal, a);
  assert.equal(validateSubmission({ ...good, animal: "all" }).field, "animal");
  assert.equal(validateSubmission({ ...good, animal: undefined }).field, "animal");
});

test("honeypot filled returns { ok:false, honeypot:true }", () => {
  assert.deepEqual(validateSubmission({ ...good, website: "http://spam" }), { ok: false, honeypot: true });
});
