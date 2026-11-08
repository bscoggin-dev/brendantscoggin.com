// Parse and validate one contact-form submission. No dependencies.
// Limits are in characters (code points), not bytes, so emoji count as one.

export const LIMITS = { name: 100, email: 254, subject: 200, message: 5000 };
export const ANIMALS = ["cats", "dogs", "alien"];

const chars = (s) => [...s].length;

export function validateSubmission(fields) {
  // Honeypot first: a bot that filled the hidden field gets a fake success and nothing is stored.
  if (typeof fields.website === "string" && fields.website.trim() !== "") {
    return { ok: false, honeypot: true };
  }

  const value = {};
  for (const f of ["name", "email", "subject", "message"]) {
    const raw = typeof fields[f] === "string" ? fields[f] : "";
    const v = raw.trim();
    if (v === "") return { ok: false, error: `${f} is required`, field: f };
    if (chars(v) > LIMITS[f]) return { ok: false, error: `${f} is too long`, field: f };
    value[f] = v;
  }

  // One line, something@something.tld, no whitespace anywhere (blocks header injection).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
    return { ok: false, error: "email is not valid", field: "email" };
  }

  if (!ANIMALS.includes(fields.animal)) {
    return { ok: false, error: "animal is not valid", field: "animal" };
  }
  value.animal = fields.animal;

  return { ok: true, value };
}
