// Moves quiz answers out of the public lab files and into the server-only
// answer key (lib/quiz-keys.js), so students can't read them in the browser.
//
//   node tools/quiz-keys.mjs
//
// To add or change a quiz: write it in the lab file with `answer: N` on each
// question as usual, then run this script. It copies the answers into
// lib/quiz-keys.js and removes them from the lab file. Quizzes that already
// have no answers keep their existing key (the question count must match).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root    = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site    = path.join(root, 'public');
const keyFile = path.join(root, 'lib', 'quiz-keys.js');

// Lab files in the same order the lab pages load them (a later file wins,
// as it does in the browser).
function scriptsOf(page) {
  const html = fs.readFileSync(path.join(site, page), 'utf8');
  const dir  = path.dirname(path.join(site, page));
  return [...html.matchAll(/<script src="([^"]*\/labs\/(?:topic|daa)-\d{2}-[^"]+\.js)"/g)]
    .map(m => path.resolve(dir, m[1]));
}
const files = [...scriptsOf('dsa/lab.html'), ...scriptsOf('daa/lab.html')];


// Finds each `quiz: [ ... ]` in real code (not inside strings or comments)
// and returns its bracket span plus the lab key it belongs to.
function findQuizzes(src) {
  const found = [];
  let lastKey = null;
  let i = 0;
  const stack = [];          // open brackets; template-literal ${ } nesting too
  let quizStart = -1, quizDepth = -1;

  function skipString(q) {    // i is on the opening quote
    i++;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { i += 2; continue; }
      if (q === '`' && c === '$' && src[i + 1] === '{') { stack.push('${'); i += 2; return 'interp'; }
      if (c === q) { i++; return 'done'; }
      i++;
    }
    return 'done';
  }

  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 2; continue; }
    if (c === '"' || c === "'" || c === '`') { skipString(c); continue; }
    if (c === '}' && stack[stack.length - 1] === '${') {   // back into the template literal
      stack.pop();
      i--; skipString('`');   // resume scanning the template from here
      continue;
    }
    const km = /^(?:DAA_)?LAB_DATA\[\s*(['"])([^'"]+)\1\s*\]/.exec(src.slice(i, i + 80));
    if (km && !/[\w$]/.test(src[i - 1] || '')) { lastKey = km[2]; i += km[0].length; continue; }
    const qm = /^quiz\s*:\s*\[/.exec(src.slice(i, i + 20));
    if (qm && !/[\w$.]/.test(src[i - 1] || '') && quizStart < 0) {
      quizStart = i + qm[0].length - 1; quizDepth = stack.length;
      stack.push('['); i += qm[0].length; continue;
    }
    if (c === '[' || c === '{' || c === '(') stack.push(c);
    if (c === ']' || c === '}' || c === ')') {
      stack.pop();
      if (c === ']' && quizStart >= 0 && stack.length === quizDepth) {
        found.push({ key: lastKey, start: quizStart, end: i + 1 });
        quizStart = -1;
      }
    }
    i++;
  }
  return found;
}

const evalArray = text => vm.runInNewContext(`(${text})`, {});

// Removes `answer: N` properties from a quiz array's source text.
function stripAnswers(text) {
  return text
    .replace(/\n[ \t]*answer\s*:\s*\d+\s*,?[ \t]*(?=\r?\n)/g, '')
    .replace(/,\s*answer\s*:\s*\d+(?=\s*[,}])/g, '')
    .replace(/\banswer\s*:\s*\d+\s*,\s*/g, '');
}

function readExistingKeys() {
  if (!fs.existsSync(keyFile)) return {};
  const ctx = {};
  vm.runInNewContext(fs.readFileSync(keyFile, 'utf8').replace(/^export const QUIZ_KEYS =/m, 'this.QUIZ_KEYS ='), ctx);
  return ctx.QUIZ_KEYS;
}
const existing = readExistingKeys();

// A lab defined in more than one file (e.g. Topic 11) uses the last one, as
// the browser does; earlier copies are hidden, so only their answers are removed.
const lastFileFor = {};
for (const file of files) {
  for (const q of findQuizzes(fs.readFileSync(file, 'utf8'))) lastFileFor[q.key] = file;
}

const keys = {};
const pendingWrites = [];   // written only after every quiz checks out
let moved = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const quizzes = findQuizzes(src);
  let changed = false;
  // Work from the end so earlier offsets stay valid.
  for (const q of quizzes.reverse()) {
    if (!q.key) throw new Error(`${path.relative(root, file)}: quiz without a LAB_DATA key`);
    const text = src.slice(q.start, q.end);
    const quiz = evalArray(text);
    const hasAnswers = quiz.every(item => Number.isInteger(item.answer));
    if (lastFileFor[q.key] !== file) {
      if (quiz.some(item => 'answer' in item)) {
        src = src.slice(0, q.start) + stripAnswers(text) + src.slice(q.end);
        changed = true;
      }
      continue;
    }
    if (hasAnswers) {
      const stripped = evalArray(stripAnswers(text));
      const same = stripped.length === quiz.length && stripped.every((s, n) =>
        !('answer' in s) && s.question === quiz[n].question &&
        JSON.stringify(s.options) === JSON.stringify(quiz[n].options));
      if (!same) throw new Error(`${q.key}: could not remove answers cleanly`);
      keys[q.key] = quiz.map(item => item.answer);
      src = src.slice(0, q.start) + stripAnswers(text) + src.slice(q.end);
      changed = true; moved++;
    } else if (quiz.some(item => 'answer' in item)) {
      throw new Error(`${q.key}: some questions have an answer and some don't`);
    } else {
      const prev = existing[q.key];
      if (!prev) throw new Error(`${q.key}: no answers in the lab file and none in lib/quiz-keys.js`);
      if (prev.length !== quiz.length) throw new Error(`${q.key}: ${quiz.length} questions but the key has ${prev.length} answers`);
      keys[q.key] = prev;
    }
  }
  if (changed) pendingWrites.push([file, src]);
}

for (const [file, src] of pendingWrites) fs.writeFileSync(file, src);

const sorted = Object.fromEntries(Object.keys(keys).sort().map(k => [k, keys[k]]));
const body = Object.entries(sorted).map(([k, v]) => `  '${k}': [${v.join(', ')}],`).join('\n');
fs.mkdirSync(path.dirname(keyFile), { recursive: true });
fs.writeFileSync(keyFile,
`// Quiz answer key (index of the correct option for each question).
// Server-only: this folder is not served to browsers. Generated by
// tools/quiz-keys.mjs; edit quizzes in the lab files and re-run it.
export const QUIZ_KEYS = {
${body}
};
`);
console.log(`${Object.keys(sorted).length} quizzes in the key; moved answers out of ${moved} quizzes.`);
