// POST /api/auth/register  { userId, password, displayName, program }
import { query } from '../../lib/db.js';
import { PROGRAMS } from '../../lib/curriculum.js';
import { HttpError, json, readJson, route } from '../../lib/http.js';
import { hashPassword } from '../../lib/security.js';
import { checkDisplayName, checkPassword, checkUserId, normaliseUserId } from '../../lib/users.js';

export const POST = route(async request => {
  const body        = await readJson(request);
  const userId      = normaliseUserId(body.userId);
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';

  if (!PROGRAMS.includes(body.program)) {
    throw new HttpError(400, 'Please choose your programme: DSA or Data Analytics Academy.');
  }
  const problem = checkUserId(userId) || checkPassword(body.password) || checkDisplayName(displayName);
  if (problem) throw new HttpError(400, problem);

  const created = await query(
    `INSERT INTO users (user_id, display_name, program, password_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING user_id`,
    [userId, displayName, body.program, await hashPassword(body.password)]);
  if (!created.length) throw new HttpError(409, 'This User ID is already taken. Please choose another.');

  return json({ ok: true, message: 'Account created successfully!' }, 201);
});
