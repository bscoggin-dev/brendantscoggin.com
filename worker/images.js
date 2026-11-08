// Pick one image filename for the button the visitor pressed.
// manifest shape: { cats: [...], dogs: [...], alien: [...] }. Returns null when the group is empty or missing.

export function pickImage(animal, manifest, rand = Math.random) {
  const pool = manifest && Array.isArray(manifest[animal]) ? manifest[animal] : [];
  if (pool.length === 0) return null;
  const i = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
  return pool[i];
}
