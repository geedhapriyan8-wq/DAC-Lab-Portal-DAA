// POST /api/labs/submit  { labKey, answers: [optionIndex, ...], outputLog? }
// Grades a quiz against the server-only answer key and records the lab as
// complete when the score reaches the pass mark.
import { answerKey, parseLabKey, PASS_MARK } from '../../lib/curriculum.js';
import { query } from '../../lib/db.js';
import { HttpError, json, readJson, route } from '../../lib/http.js';
import { proofHash } from '../../lib/security.js';
import { completionsOf, requireUser, userState } from '../../lib/users.js';

export const POST = route(async request => {
  const row    = await requireUser(request);
  const body   = await readJson(request);
  const labKey = body.labKey;
  const lab    = parseLabKey(labKey);
  if (!lab) throw new HttpError(404, 'Unknown lab.');
  if (lab.program !== row.program) throw new HttpError(403, 'This lab belongs to the other programme.');

  const key     = answerKey(labKey);
  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length !== key.length ||
      !answers.every(a => Number.isInteger(a) && a >= 0 && a < 26)) {
    throw new HttpError(400, `Answer all ${key.length} questions.`);
  }

  const results      = key.map((correct, i) => answers[i] === correct);
  const correctCount = results.filter(Boolean).length;
  const score        = Math.round((correctCount / key.length) * 100);
  const passed       = score >= PASS_MARK;

  const before = userState(row, await completionsOf(row.user_id));
  let after = before;
  if (passed) {
    const completedAt = new Date().toISOString();
    const outputLog   = typeof body.outputLog === 'string' ? body.outputLog.slice(0, 500) : '';
    // The first passing attempt is the one on record.
    await query(
      `INSERT INTO lab_completions (user_id, lab_key, quiz_score, proof_hash, output_log, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, lab_key) DO NOTHING`,
      [row.user_id, labKey, score, proofHash(lab.program, row.user_id, labKey, score, completedAt), outputLog, completedAt]);
    after = userState(row, await completionsOf(row.user_id));
  }

  const badgesOf = s => (lab.program === 'daa' ? s.daa.badges : s.badges);
  const masterOf = s => (lab.program === 'daa' ? s.daa.masterBadge : s.dsaBadge);
  const evidence = (lab.program === 'daa' ? after.daa.evidence : after.evidence)[labKey] || null;

  return json({
    ok: true,
    passed,
    score,
    correctCount,
    total: key.length,
    results,                                   // which questions were right
    correctAnswers: passed ? key : null,       // only revealed once the lab is passed
    evidence: passed ? evidence : null,
    topicBadgeEarned: badgesOf(after).includes(lab.topicId) && !badgesOf(before).includes(lab.topicId),
    masterBadgeEarned: masterOf(after) && !masterOf(before),
    user: after,
  });
});
