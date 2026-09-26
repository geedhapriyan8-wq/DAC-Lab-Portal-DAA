// POST /api/auth/logout  -> clears the session cookie
import { clearSessionCookie, json, route } from '../../lib/http.js';

export const POST = route(async request =>
  json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) }));
