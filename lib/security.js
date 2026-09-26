// Passwords, session cookies and proof hashes. Uses only Node's built-in crypto.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export const SESSION_COOKIE = 'dac_session';
export const SESSION_DAYS   = 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters.');
  }
  return s;
}

/* ——— Passwords (scrypt, per-user random salt) ——— */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual   = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
  return crypto.timingSafeEqual(actual, expected);
}

// Spends the same time as a real check, so unknown user IDs can't be told apart by timing.
const DUMMY_HASH = hashPassword('not-a-real-password');
export async function burnPasswordCheck(password) {
  await verifyPassword(password, await DUMMY_HASH);
}

// Readable temporary password for admin resets (no 0/O, 1/l/I).
export function temporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
}

/* ——— Session tokens: base64url(payload).HMAC ——— */
const b64url = buf => Buffer.from(buf).toString('base64url');

function sign(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

export function createSessionToken(userId, sessionVersion) {
  const payload = b64url(JSON.stringify({
    u: userId,
    v: sessionVersion,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  }));
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given    = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.u !== 'string' || !Number.isInteger(data.v) || data.exp < Date.now()) return null;
    return { userId: data.u, sessionVersion: data.v };
  } catch {
    return null;
  }
}

/* ——— Proof hash shown on completion certificates ——— */
export function proofHash(program, userId, labKey, score, completedAt) {
  const mac = crypto.createHmac('sha256', secret())
    .update(`proof|${userId}|${labKey}|${score}|${completedAt}`)
    .digest('hex').toUpperCase();
  return `${program.toUpperCase()}-PROOF-${mac.slice(0, 16)}`;
}
