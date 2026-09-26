// GET  /api/admin/users  -> every account with its progress
// POST /api/admin/users  { action, userId, program? }
//   action: 'set-program' | 'reset-password' | 'delete'
import { PROGRAMS, TOPICS } from '../../lib/curriculum.js';
import { query } from '../../lib/db.js';
import { HttpError, json, readJson, route } from '../../lib/http.js';
import { hashPassword, temporaryPassword } from '../../lib/security.js';
import { adminSummary, completionsOf, normaliseUserId, requireAdmin } from '../../lib/users.js';

export const GET = route(async request => {
  await requireAdmin(request);
  const users       = await query('SELECT * FROM users ORDER BY created_at DESC');
  const completions = await query(
    'SELECT user_id, lab_key, quiz_score, completed_at FROM lab_completions ORDER BY completed_at');
  const byUser = {};
  for (const c of completions) (byUser[c.user_id] ||= []).push(c);
  return json({
    ok: true,
    curriculum: TOPICS,
    users: users.map(u => adminSummary(u, byUser[u.user_id] || [])),
  });
});

export const POST = route(async request => {
  const admin  = await requireAdmin(request);
  const body   = await readJson(request);
  const userId = normaliseUserId(body.userId);
  const [target] = await query('SELECT * FROM users WHERE user_id = $1', [userId]);
  if (!target) throw new HttpError(404, 'No account found with that User ID.');

  switch (body.action) {
    case 'set-program': {
      if (!PROGRAMS.includes(body.program)) throw new HttpError(400, 'Programme must be dsa or daa.');
      const [row] = await query('UPDATE users SET program = $2 WHERE user_id = $1 RETURNING *', [userId, body.program]);
      return json({
        ok: true,
        message: `${row.display_name} is now in ${body.program.toUpperCase()}.`,
        user: adminSummary(row, await completionsOf(userId)),
      });
    }
    case 'reset-password': {
      if (userId === admin.user_id) throw new HttpError(400, "You can't reset your own password here.");
      const tempPassword = temporaryPassword();
      const [row] = await query(
        `UPDATE users SET password_hash = $2, must_change_password = TRUE,
           session_version = session_version + 1, failed_logins = 0, locked_until = NULL
         WHERE user_id = $1 RETURNING *`,
        [userId, await hashPassword(tempPassword)]);
      return json({
        ok: true,
        message: `Temporary password set for ${row.display_name}. They must choose a new one when they sign in.`,
        tempPassword,
        user: adminSummary(row, await completionsOf(userId)),
      });
    }
    case 'delete': {
      if (userId === admin.user_id) throw new HttpError(400, "You can't delete your own account.");
      await query('DELETE FROM users WHERE user_id = $1', [userId]);
      return json({ ok: true, message: `Deleted ${target.display_name} (@${userId}) and all their progress.` });
    }
    default:
      throw new HttpError(400, 'Unknown action.');
  }
});
