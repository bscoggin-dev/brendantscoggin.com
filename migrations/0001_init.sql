-- Contact form: every message, plus settings for the digest email.
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  animal TEXT NOT NULL,
  digested_at TEXT
);
CREATE INDEX messages_pending ON messages (digested_at, id);
CREATE INDEX messages_created ON messages (created_at);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES ('digest_interval_hours', '24');
