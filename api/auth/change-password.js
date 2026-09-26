// POST /api/auth/change-password  { currentPassword, newPassword }
// Used after an admin reset (the temporary password must be replaced) and
// signs out every other device by bumping the session version.
import { query } from '../../lib/db.js';
import { HttpError, json, readJson, route, sessionCookie } from '../../lib/http.js';
import { createSessionToken, hashPassword, verifyPassword } from '../../lib/security.js';
import { checkPassword, completionsOf, requireUser, userState } from '../../lib/users.js';

export const POST = route(async request => {
  const row  = await requireUser(request, { allowPasswordChange: true });
  const body = await readJson(request);

  if (typeof body.currentPassword !== 'string' || !(await verifyPassword(body.currentPassword, row.password_hash))) {
    throw new HttpError(401, 'Your current password is incorrect.');
  }
  const problem = checkPassword(body.newPassword);
  if (problem) throw new HttpError(400, problem);
  if (body.newPassword === body.currentPassword) {
    throw new HttpError(400, 'Choose a password different from your current one.');
  }

  const [updated] = await query(
    `UPDATE users SET password_hash = $2, must_change_password = FALSE,
       session_version = session_version + 1
     WHERE user_id = $1 RETURNING *`,
    [row.user_id, await hashPassword(body.newPassword)]);
  const token = createSessionToken(updated.user_id, updated.session_version);
  return json(
    { ok: true, user: userState(updated, await completionsOf(updated.user_id)) },
    200,
    { 'Set-Cookie': sessionCookie(request, token) });
});
