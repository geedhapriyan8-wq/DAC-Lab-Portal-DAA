// Which labs exist, grouped by programme and topic. Derived from the answer
// key, so adding a quiz with tools/quiz-keys.mjs is all a new lab needs here.
import { QUIZ_KEYS } from './quiz-keys.js';

export const PROGRAMS  = ['dsa', 'daa'];
export const PASS_MARK = 80;

// 'topic-03_lab2' -> { program: 'dsa', topicId: 'topic-03', labNum: 2 }
export function parseLabKey(labKey) {
  const m = /^((topic|daa)-\d{2})_lab(\d)$/.exec(String(labKey));
  if (!m || !QUIZ_KEYS[labKey]) return null;
  return { program: m[2] === 'daa' ? 'daa' : 'dsa', topicId: m[1], labNum: Number(m[3]) };
}

// { dsa: { 'topic-01': [1, 2], ... }, daa: { 'daa-02': [1], ... } }
export const TOPICS = { dsa: {}, daa: {} };
for (const key of Object.keys(QUIZ_KEYS).sort()) {
  const { program, topicId, labNum } = parseLabKey(key);
  (TOPICS[program][topicId] ||= []).push(labNum);
}

export function labCount(program) {
  return Object.values(TOPICS[program]).reduce((n, labs) => n + labs.length, 0);
}

export function answerKey(labKey) {
  return QUIZ_KEYS[labKey];
}
