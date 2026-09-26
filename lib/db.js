// Database access. On Vercel this talks to Neon Postgres through
// DATABASE_URL (added automatically when you connect Neon to the project).
// Locally, tools/dev-server.mjs and the tests plug in an in-memory Postgres.
import { neon } from '@neondatabase/serverless';

let client = null;
let schemaReady = null;

function getClient() {
  if (globalThis.__DAC_LOCAL_DB__) return globalThis.__DAC_LOCAL_DB__;
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Connect a Neon database to this Vercel project.');
    }
    const sql = neon(process.env.DATABASE_URL);
    client = { query: (text, params) => sql.query(text, params) };
  }
  return client;
}

// Tables are created on first use, so a fresh Neon database needs no manual setup.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     user_id          TEXT PRIMARY KEY,
     display_name     TEXT NOT NULL,
     program          TEXT NOT NULL CHECK (program IN ('dsa', 'daa')),
     password_hash    TEXT NOT NULL,
     must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
     session_version  INTEGER NOT NULL DEFAULT 1,
     failed_logins    INTEGER NOT NULL DEFAULT 0,
     locked_until     TIMESTAMPTZ,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
     last_active_at   TIMESTAMPTZ
   )`,
  `CREATE TABLE IF NOT EXISTS lab_completions (
     user_id      TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
     lab_key      TEXT NOT NULL,
     quiz_score   INTEGER NOT NULL,
     proof_hash   TEXT NOT NULL,
     output_log   TEXT,
     completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (user_id, lab_key)
   )`,
];

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const statement of SCHEMA) await getClient().query(statement, []);
    })().catch(err => { schemaReady = null; throw err; });
  }
  return schemaReady;
}

// Runs one parameterised statement ($1, $2, ...) and returns the rows.
export async function query(text, params = []) {
  await ensureSchema();
  return getClient().query(text, params);
}

// Lets tests start from an empty schema check with a new database.
export function resetForTests() {
  schemaReady = null;
}
