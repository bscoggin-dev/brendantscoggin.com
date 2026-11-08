import { test } from "node:test";
import assert from "node:assert/strict";
import { pickImage } from "../images.js";

const m = { cats: ["cats-01.jpg", "cats-02.jpg"], dogs: ["dogs-01.jpg"], alien: ["alien-01.jpg", "alien-02.jpg"] };

test("cats picks only from cats", () => {
  for (const r of [0, 0.5, 0.999999]) assert.ok(m.cats.includes(pickImage("cats", m, () => r)));
});
test("dogs picks only from dogs", () => assert.equal(pickImage("dogs", m, () => 0.7), "dogs-01.jpg"));
test("alien picks only from alien", () => {
  for (const r of [0, 0.999999]) assert.ok(m.alien.includes(pickImage("alien", m, () => r)));
});
test("empty cats group returns null", () => assert.equal(pickImage("cats", { ...m, cats: [] }), null));
test("missing dogs group returns null", () => assert.equal(pickImage("dogs", { cats: m.cats }), null));
test("unknown animal returns null", () => assert.equal(pickImage("other", m), null));
test("rand 0.999999 stays in range", () => assert.equal(pickImage("cats", m, () => 0.999999), "cats-02.jpg"));
