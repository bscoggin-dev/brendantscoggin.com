// All D1 reads and writes for the contact form. Every value is bound, never interpolated.

export async function insertMessage(db, m, nowIso) {
  const r = await db
    .prepare("INSERT INTO messages (created_at, name, email, subject, message, animal) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(nowIso, m.name, m.email, m.subject, m.message, m.animal)
    .run();
  return r.meta.last_row_id;
}

export async function countSince(db, sinceIso) {
  return Number(await db.prepare("SELECT count(*) AS n FROM messages WHERE created_at >= ?").bind(sinceIso).first("n"));
}

export async function pendingMessages(db, limit) {
  const r = await db
    .prepare("SELECT id, created_at, name, email, subject, message, animal FROM messages WHERE digested_at IS NULL ORDER BY id LIMIT ?")
    .bind(limit)
    .all();
  return r.results;
}

export async function pendingCount(db) {
  return Number(await db.prepare("SELECT count(*) AS n FROM messages WHERE digested_at IS NULL").first("n"));
}

// ids come from pendingMessages (at most 50), well under D1's 100 bound-parameter limit.
export async function markDigested(db, ids, nowIso) {
  if (ids.length === 0) return;
  const marks = ids.map(() => "?").join(", ");
  await db.prepare(`UPDATE messages SET digested_at = ? WHERE id IN (${marks})`).bind(nowIso, ...ids).run();
}

export async function getSetting(db, key) {
  const v = await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first("value");
  return v ?? null;
}

export async function setSetting(db, key, value) {
  await db
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, value)
    .run();
}
