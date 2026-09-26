// Accounts, sessions and progress summaries.
import { query } from './db.js';
import { TOPICS, labCount, parseLabKey } from './curriculum.js';
import { getCookie, HttpError } from './http.js';
import { SESSION_COOKIE, readSessionToken } from './security.js';

/* ——— Validation (same rules the register page shows) ——— */
export function checkUserId(userId) {
  if (typeof userId !== 'string' || userId.length < 3) return 'User ID must be at least 3 characters.';
  if (userId.length > 40) return 'User ID can be at most 40 characters.';
  if (!/^[a-z0-9_.-]+$/.test(userId)) return 'User ID can only contain letters, numbers, dots, hyphens, underscores.';
  return null;
}

export function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 200) return 'Password can be at most 200 characters.';
  return null;
}

export function checkDisplayName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) return 'Display name must be at least 2 characters.';
  if (name.trim().length > 60) return 'Display name can be at most 60 characters.';
  return null;
}

export const normaliseUserId = id => (typeof id === 'string' ? id.trim().toLowerCase() : '');

/* ——— Admins are listed in the ADMIN_USER_IDS environment variable ——— */
export function isAdmin(userId) {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',').map(normaliseUserId).filter(Boolean)
    .includes(userId);
}

const iso = v => (v == null ? null : new Date(v).toISOString());

/* ——— Progress in the shape the pages already use ——— */
function programmeProgress(program, completions) {
  const progress = {}, evidence = {}, badges = [];
  let labsDone = 0;
  for (const c of completions) {
    const lab = parseLabKey(c.lab_key);
    if (!lab || lab.program !== program) continue;
    (progress[lab.topicId] ||= {})[`lab${lab.labNum}`] = true;
    evidence[c.lab_key] = {
      verificationPassed: true,
      quizScore: c.quiz_score,
      proofHash: c.proof_hash,
      completedAt: iso(c.completed_at),
      outputLog: c.output_log || '',
    };
    labsDone++;
  }
  for (const [topicId, labs] of Object.entries(TOPICS[program])) {
    if (labs.every(n => progress[topicId]?.[`lab${n}`])) badges.push(topicId);
  }
  const master = badges.length === Object.keys(TOPICS[program]).length;
  return { progress, evidence, badges, master, labsDone, totalLabs: labCount(program) };
}

export function userState(row, completions) {
  const dsa = programmeProgress('dsa', completions);
  const daa = programmeProgress('daa', completions);
  return {
    userId: row.user_id,
    displayName: row.display_name,
    program: row.program,
    isAdmin: isAdmin(row.user_id),
    mustChangePassword: !!row.must_change_password,
    createdAt: iso(row.created_at),
    // DSA progress (same fields as before the backend)
    progress: dsa.progress,
    badges: dsa.badges,
    dsaBadge: dsa.master,
    evidence: dsa.evidence,
    // DAA progress
    daa: { progress: daa.progress, badges: daa.badges, evidence: daa.evidence, masterBadge: daa.master },
  };
}

// One line per student for the admin page.
export function adminSummary(row, completions) {
  const mine = programmeProgress(row.program, completions);
  return {
    userId: row.user_id,
    displayName: row.display_name,
    program: row.program,
    isAdmin: isAdmin(row.user_id),
    mustChangePassword: !!row.must_change_password,
    createdAt: iso(row.created_at),
    lastActiveAt: iso(row.last_active_at),
    labsDone: mine.labsDone,
    totalLabs: mine.totalLabs,
    badges: mine.badges,
    masterBadge: mine.master,
    completions: completions.map(c => ({
      labKey: c.lab_key,
      quizScore: c.quiz_score,
      completedAt: iso(c.completed_at),
    })),
  };
}

export function completionsOf(userId) {
  return query(
    'SELECT lab_key, quiz_score, proof_hash, output_log, completed_at FROM lab_completions WHERE user_id = $1 ORDER BY completed_at',
    [userId]);
}

/* ——— Sessions ——— */
// Returns the signed-in user's database row, or throws 401/403.
export async function requireUser(request, { allowPasswordChange = false } = {}) {
  const session = readSessionToken(getCookie(request, SESSION_COOKIE));
  if (!session) throw new HttpError(401, 'Please sign in.');
  const [row] = await query('SELECT * FROM users WHERE user_id = $1', [session.userId]);
  if (!row || row.session_version !== session.sessionVersion) {
    throw new HttpError(401, 'Your session has ended. Please sign in again.');
  }
  if (row.must_change_password && !allowPasswordChange) {
    throw new HttpError(403, 'Please set a new password first.');
  }
  await query(
    `UPDATE users SET last_active_at = now()
     WHERE user_id = $1 AND (last_active_at IS NULL OR last_active_at < now() - interval '5 minutes')`,
    [row.user_id]);
  return row;
}

export async function requireAdmin(request) {
  const row = await requireUser(request);
  if (!isAdmin(row.user_id)) throw new HttpError(403, 'Admins only.');
  return row;
}
