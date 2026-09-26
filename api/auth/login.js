// POST /api/auth/login  { userId, password }  -> sets the session cookie
import { query } from '../../lib/db.js';
import { HttpError, json, readJson, route, sessionCookie } from '../../lib/http.js';
import { burnPasswordCheck, createSessionToken, verifyPassword } from '../../lib/security.js';
import { completionsOf, normaliseUserId, userState } from '../../lib/users.js';

const MAX_FAILURES = 10;   // then the account is locked for 15 minutes

export const POST = route(async request => {
  const body     = await readJson(request);
  const userId   = normaliseUserId(body.userId);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!userId || !password) throw new HttpError(400, 'Please fill in all fields.');

  const wrong = new HttpError(401, 'User ID or password is incorrect.');
  const [row] = await query('SELECT * FROM users WHERE user_id = $1', [userId]);
  if (!row) {
    await burnPasswordCheck(password);
    throw wrong;
  }
  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    throw new HttpError(429, 'Too many failed attempts. Try again in 15 minutes, or ask an admin to reset your password.');
  }

  if (!(await verifyPassword(password, row.password_hash))) {
    await query(
      `UPDATE users SET
         failed_logins = CASE WHEN failed_logins + 1 >= $2 THEN 0 ELSE failed_logins + 1 END,
         locked_until  = CASE WHEN failed_logins + 1 >= $2 THEN now() + interval '15 minutes' ELSE NULL END
       WHERE user_id = $1`,
      [userId, MAX_FAILURES]);
    throw wrong;
  }

  await query(
    'UPDATE users SET failed_logins = 0, locked_until = NULL, last_active_at = now() WHERE user_id = $1',
    [userId]);
  const token = createSessionToken(row.user_id, row.session_version);
  return json(
    { ok: true, user: userState(row, await completionsOf(userId)) },
    200,
    { 'Set-Cookie': sessionCookie(request, token) });
});
