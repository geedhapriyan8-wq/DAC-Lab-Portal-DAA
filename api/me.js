// GET /api/me  -> the signed-in student's account and progress
import { json, route } from '../lib/http.js';
import { completionsOf, requireUser, userState } from '../lib/users.js';

export const GET = route(async request => {
  const row = await requireUser(request, { allowPasswordChange: true });
  return json({ ok: true, user: userState(row, await completionsOf(row.user_id)) });
});
