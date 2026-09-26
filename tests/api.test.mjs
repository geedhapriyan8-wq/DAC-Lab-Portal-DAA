// API tests against an in-memory Postgres (PGlite).  Run: npm test
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

process.env.SESSION_SECRET = 'test-secret-that-is-long-enough-for-hmac-signing';
process.env.ADMIN_USER_IDS = 'boss';

const pg = new PGlite();
globalThis.__DAC_LOCAL_DB__ = { query: async (text, params) => (await pg.query(text, params)).rows };

const { QUIZ_KEYS } = await import('../lib/quiz-keys.js');
const routes = {
  register: await import('../api/auth/register.js'),
  login:    await import('../api/auth/login.js'),
  logout:   await import('../api/auth/logout.js'),
  change:   await import('../api/auth/change-password.js'),
  me:       await import('../api/me.js'),
  submit:   await import('../api/labs/submit.js'),
  admin:    await import('../api/admin/users.js'),
};

async function call(mod, method, { body, cookie, origin } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (cookie) headers.cookie = cookie;
  if (origin) headers.origin = origin;
  const res = await mod[method](new Request('http://localhost/api/x', {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, data: await res.json(), cookie: setCookie ? setCookie.split(';')[0] : null };
}

const register = (userId, program, password = 'Password1!') =>
  call(routes.register, 'POST', { body: { userId, password, displayName: `User ${userId}`, program } });
const login = async (userId, password = 'Password1!') => call(routes.login, 'POST', { body: { userId, password } });
const submit = (cookie, labKey, answers) => call(routes.submit, 'POST', { cookie, body: { labKey, answers } });
// The first `right` answers correct, the rest wrong.
const partlyRight = (key, right) => key.map((a, i) => (i < right ? a : (a === 0 ? 1 : 0)));

let studentCookie, bossCookie;

before(async () => {
  assert.equal((await register('student.one', 'daa')).status, 201);
  assert.equal((await register('boss', 'dsa')).status, 201);
  studentCookie = (await login('student.one')).cookie;
  bossCookie    = (await login('boss')).cookie;
});

test('registration validates input and rejects duplicate IDs', async () => {
  assert.equal((await register('no-programme', 'xyz')).status, 400);
  assert.equal((await register('ab', 'dsa')).status, 400);
  assert.equal((await register('Bad Id!', 'dsa')).status, 400);
  assert.equal((await register('shortpw', 'dsa', 'short')).status, 400);
  const dup = await register('STUDENT.ONE', 'dsa');
  assert.equal(dup.status, 409);
});

test('login: same message for unknown user and wrong password; session cookie works', async () => {
  const unknown = await login('nobody');
  const wrong   = await login('student.one', 'Wrong-password');
  assert.equal(unknown.status, 401);
  assert.equal(unknown.data.message, wrong.data.message);

  const me = await call(routes.me, 'GET', { cookie: studentCookie });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.program, 'daa');
  assert.equal(me.data.user.isAdmin, false);

  assert.equal((await call(routes.me, 'GET')).status, 401);
  const tampered = studentCookie.replace(/.$/, c => (c === 'A' ? 'B' : 'A'));
  assert.equal((await call(routes.me, 'GET', { cookie: tampered })).status, 401);
});

test('quiz grading: gate, validation, fail, pass, topic badge', async () => {
  const dsaKey = QUIZ_KEYS['topic-01_lab1'];
  assert.equal((await submit(studentCookie, 'topic-01_lab1', dsaKey)).status, 403, 'DAA student cannot do DSA labs');
  assert.equal((await submit(studentCookie, 'daa-99_lab1', [0])).status, 404);

  const key = QUIZ_KEYS['daa-02_lab1'];   // single-lab topic
  assert.equal((await submit(studentCookie, 'daa-02_lab1', key.slice(1))).status, 400);

  const fail = await submit(studentCookie, 'daa-02_lab1', partlyRight(key, 0));
  assert.equal(fail.status, 200);
  assert.equal(fail.data.passed, false);
  assert.equal(fail.data.correctAnswers, null, 'answers stay hidden after a fail');
  assert.equal(fail.data.results.length, key.length);

  const pass = await submit(studentCookie, 'daa-02_lab1', key);
  assert.equal(pass.data.passed, true);
  assert.equal(pass.data.score, 100);
  assert.deepEqual(pass.data.correctAnswers, key);
  assert.match(pass.data.evidence.proofHash, /^DAA-PROOF-[0-9A-F]{16}$/);
  assert.equal(pass.data.topicBadgeEarned, true);
  assert.equal(pass.data.user.daa.progress['daa-02'].lab1, true);
  assert.deepEqual(pass.data.user.daa.badges, ['daa-02']);

  const again = await submit(studentCookie, 'daa-02_lab1', key);
  assert.equal(again.data.topicBadgeEarned, false, 'badge is only announced once');
});

test('80% is enough to pass', async () => {
  const pass = await submit(studentCookie, 'daa-01_lab1', partlyRight(QUIZ_KEYS['daa-01_lab1'], 8));  // 8/10
  assert.equal(pass.data.score, 80);
  assert.equal(pass.data.passed, true);
  const fail = await submit(studentCookie, 'daa-01_lab2', partlyRight(QUIZ_KEYS['daa-01_lab2'], 7));  // 7/10
  assert.equal(fail.data.score, 70);
  assert.equal(fail.data.passed, false);
});

test('completing every DAA lab earns the master badge exactly once', async () => {
  const daaLabs = Object.keys(QUIZ_KEYS).filter(k => k.startsWith('daa-'));
  let masterSeen = 0;
  for (const labKey of daaLabs) {
    const r = await submit(studentCookie, labKey, QUIZ_KEYS[labKey]);
    assert.equal(r.data.passed, true, labKey);
    if (r.data.masterBadgeEarned) masterSeen++;
  }
  assert.equal(masterSeen, 1);
  const me = await call(routes.me, 'GET', { cookie: studentCookie });
  assert.equal(me.data.user.daa.masterBadge, true);
  assert.equal(me.data.user.daa.badges.length, 9);
});

test('admin: only admins, list, change programme', async () => {
  assert.equal((await call(routes.admin, 'GET', { cookie: studentCookie })).status, 403);
  const list = await call(routes.admin, 'GET', { cookie: bossCookie });
  assert.equal(list.status, 200);
  const s = list.data.users.find(u => u.userId === 'student.one');
  assert.equal(s.labsDone, 14);
  assert.equal(s.totalLabs, 14);
  assert.equal(s.masterBadge, true);

  const moved = await call(routes.admin, 'POST', { cookie: bossCookie, body: { action: 'set-program', userId: 'student.one', program: 'dsa' } });
  assert.equal(moved.data.user.program, 'dsa');
  assert.equal(moved.data.user.labsDone, 0, 'DSA progress starts empty');
  assert.equal((await submit(studentCookie, 'daa-02_lab1', QUIZ_KEYS['daa-02_lab1'])).status, 403);
  // Moving back restores the DAA progress, which is kept.
  const back = await call(routes.admin, 'POST', { cookie: bossCookie, body: { action: 'set-program', userId: 'student.one', program: 'daa' } });
  assert.equal(back.data.user.labsDone, 14);
});

test('admin password reset forces a new password and signs out old sessions', async () => {
  const reset = await call(routes.admin, 'POST', { cookie: bossCookie, body: { action: 'reset-password', userId: 'student.one' } });
  assert.equal(reset.status, 200);
  const temp = reset.data.tempPassword;
  assert.match(temp, /^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);

  assert.equal((await call(routes.me, 'GET', { cookie: studentCookie })).status, 401, 'old session ended');
  assert.equal((await login('student.one')).status, 401, 'old password no longer works');

  const tempLogin = await login('student.one', temp);
  assert.equal(tempLogin.status, 200);
  assert.equal(tempLogin.data.user.mustChangePassword, true);
  assert.equal((await submit(tempLogin.cookie, 'daa-02_lab1', QUIZ_KEYS['daa-02_lab1'])).status, 403, 'must change password first');

  const same = await call(routes.change, 'POST', { cookie: tempLogin.cookie, body: { currentPassword: temp, newPassword: temp } });
  assert.equal(same.status, 400);
  const changed = await call(routes.change, 'POST', { cookie: tempLogin.cookie, body: { currentPassword: temp, newPassword: 'Brand-new-1' } });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.user.mustChangePassword, false);
  studentCookie = changed.cookie;
  assert.equal((await call(routes.me, 'GET', { cookie: studentCookie })).status, 200);
  assert.equal((await login('student.one', 'Brand-new-1')).status, 200);

  assert.equal((await call(routes.admin, 'POST', { cookie: bossCookie, body: { action: 'reset-password', userId: 'boss' } })).status, 400);
});

test('admin delete removes the account and progress', async () => {
  await register('to.delete', 'dsa');
  const c = (await login('to.delete')).cookie;
  assert.equal((await submit(c, 'topic-01_lab1', QUIZ_KEYS['topic-01_lab1'])).data.passed, true);
  assert.equal((await call(routes.admin, 'POST', { cookie: bossCookie, body: { action: 'delete', userId: 'boss' } })).status, 400);
  const del = await call(routes.admin, 'POST', { cookie: bossCookie, body: { action: 'delete', userId: 'to.delete' } });
  assert.equal(del.status, 200);
  assert.equal((await call(routes.me, 'GET', { cookie: c })).status, 401);
  const rows = await pg.query("SELECT count(*)::int AS n FROM lab_completions WHERE user_id = 'to.delete'");
  assert.equal(rows.rows[0].n, 0);
});

test('ten wrong passwords lock the account for 15 minutes', async () => {
  await register('locky', 'daa');
  for (let i = 0; i < 10; i++) assert.equal((await login('locky', 'nope-nope')).status, 401);
  const locked = await login('locky');
  assert.equal(locked.status, 429);
});

test('cross-site POSTs are refused', async () => {
  const r = await call(routes.login, 'POST', { body: { userId: 'boss', password: 'Password1!' }, origin: 'https://evil.example' });
  assert.equal(r.status, 403);
});

test('logout clears the cookie', async () => {
  const r = await call(routes.logout, 'POST');
  assert.match(r.cookie, /^dac_session=$/);
});
