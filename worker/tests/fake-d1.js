// In-memory stand-in for a D1 database, backed by node:sqlite and loaded from the real migration.
// Mimics the parts of the D1 API the Worker uses: prepare(sql).bind(...).run() / .all() / .first().
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

const MIGRATION = new URL("../../migrations/0001_init.sql", import.meta.url);

export function createFakeD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(MIGRATION, "utf8"));
  const db = {
    sqlite,
    failNext: null, // set to an Error to make the next statement throw
    prepare(sql) {
      let args = [];
      const guard = () => {
        if (db.failNext) { const e = db.failNext; db.failNext = null; throw e; }
      };
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async run() {
          guard();
          const r = sqlite.prepare(sql).run(...args);
          return { success: true, meta: { last_row_id: Number(r.lastInsertRowid), changes: Number(r.changes) } };
        },
        async all() { guard(); return { success: true, results: sqlite.prepare(sql).all(...args) }; },
        async first(col) {
          guard();
          const row = sqlite.prepare(sql).get(...args);
          if (row === undefined) return null;
          return col ? row[col] : row;
        },
      };
      return stmt;
    },
  };
  return db;
}
