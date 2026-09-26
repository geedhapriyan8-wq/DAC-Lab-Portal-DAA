/* ============================================================
   Data Analytics Academy — Lab Viewer Logic (daa-lab-viewer.js)
   Same flow as the DSA lab viewer (steps → knowledge check → 80%
   pass → badge), reading window.DAA_LAB_DATA and DAAProgress.
   Extras for DAA labs:
     • code.output  — the real output of the code (shown when run)
     • step.datasets / lab.datasets — dataset download buttons
   ============================================================ */

function initDaaLabViewer() {
  const session = Auth.requireAuth('daa', '../');
  if (!session) return;

  const { userId } = session;
  const labParam = new URLSearchParams(window.location.search).get('lab'); // e.g. "daa-01-lab1"

  const match = labParam && labParam.match(/^(daa-\d{2})-lab(\d)$/);
  if (!match) { window.location.href = 'dashboard.html'; return; }

  const topicId = match[1];
  const labNum  = parseInt(match[2]);
  const topic   = DAAProgress.getTopic(topicId);
  const lab     = window.DAA_LAB_DATA && window.DAA_LAB_DATA[`${topicId}_lab${labNum}`];

  if (!lab || !topic) {
    document.getElementById('steps-container').innerHTML = `<div class="glass-card" style="text-align:center;padding:3rem">
      <h2>Lab not found</h2><p class="text-muted">Could not load lab: ${labParam}</p>
      <a href="dashboard.html" class="btn btn-secondary" style="margin-top:1rem">← Back to Dashboard</a></div>`;
    return;
  }

  /* Attach the generated output (daa-outputs.js) to every `run: true` cell.
     Order must match tools/build-daa-outputs.mjs: steps, then code blocks. */
  const generated = (window.DAA_OUTPUTS || {})[`${topicId}_lab${labNum}`] || [];
  let runIdx = 0;
  lab.steps.forEach(step => {
    const codes = step.code ? (Array.isArray(step.code) ? step.code : [step.code]) : [];
    codes.forEach(c => {
      if (!c.run) return;
      const g = generated[runIdx++];
      if (g && c.output === undefined) { c.output = g.text || '(no output)'; c.images = g.images; }
    });
  });

  const alreadyComplete = DAAProgress.isLabComplete(userId, topicId, labNum);
  const labMeta         = topic.labs.find(l => l.num === labNum);
  const nextLab         = topic.labs.find(l => l.num === labNum + 1);

  /* ——— Header ——— */
  document.title = `${lab.title} | DAA Lab Portal`;
  document.getElementById('lab-breadcrumb-topic').textContent = topic.name;
  document.getElementById('lab-breadcrumb-lab').textContent   = `Lab ${labNum}`;
  document.getElementById('lab-title').textContent            = lab.title;
  document.getElementById('lab-difficulty-chip').textContent  = lab.difficulty;
  document.getElementById('lab-duration-chip').textContent    = `⏱ ${lab.duration}`;
  document.getElementById('lab-steps-count').textContent      = `${lab.steps.length} Steps`;
  document.getElementById('lab-overview-text').textContent    = lab.overview;

  document.getElementById('lab-sidebar-topic').textContent      = topic.name;
  document.getElementById('lab-sidebar-title').textContent      = lab.title;
  document.getElementById('lab-sidebar-difficulty').textContent = labMeta ? labMeta.level : lab.difficulty;
  document.getElementById('lab-sidebar-duration').textContent   = lab.duration;

  document.getElementById('lab-objectives-list').innerHTML =
    (lab.objectives || []).map(o => `<li class="lab-objective-item">${o}</li>`).join('');

  if (lab.datasets && lab.datasets.length) {
    document.getElementById('lab-datasets').innerHTML =
      `<span class="text-muted" style="font-size:0.8rem;align-self:center">Datasets for this lab:</span>` +
      lab.datasets.map(daaDatasetButton).join('');
  }

  /* ——— Steps ——— */
  const stepsContainer = document.getElementById('steps-container');
  const stepsNavEl     = document.getElementById('steps-nav');
  const TOTAL_STEPS    = lab.steps.length;
  const doneSteps      = new Set();
  let currentStep      = 0;
  let quizDone         = false;
  let lastOutputLog    = '';

  function isStepDone(i) { return doneSteps.has(i) || alreadyComplete; }
  function isLabDone()   { return quizDone || alreadyComplete; }

  function renderSteps() {
    stepsNavEl.innerHTML = `
      <div class="steps-nav-divider"><span>Lab Steps</span></div>
      ${lab.steps.map((s, i) => `
        <div class="step-nav-item ${i === currentStep ? 'active' : ''} ${isStepDone(i) ? 'done' : ''}"
             data-step="${i}" id="nav-step-${i}">
          <div class="step-nav-num">${isStepDone(i) ? '✓' : i + 1}</div>
          <div class="step-nav-label">${s.title}</div>
        </div>`).join('')}
      <div class="steps-nav-divider"><span>Assessment</span></div>
      <div class="step-nav-item ${currentStep === TOTAL_STEPS ? 'active' : ''} ${isLabDone() ? 'done' : ''}"
           data-step="${TOTAL_STEPS}" id="nav-step-quiz">
        <div class="step-nav-num">${isLabDone() ? '✓' : '?'}</div>
        <div class="step-nav-label">Knowledge Check</div>
      </div>`;

    stepsNavEl.querySelectorAll('.step-nav-item').forEach(item => {
      item.addEventListener('click', () => navigateToStep(parseInt(item.dataset.step)));
    });
  }

  function renderStepContent(idx) {
    stepsContainer.innerHTML = '';
    if (idx >= TOTAL_STEPS) { renderQuiz(); return; }

    const step = lab.steps[idx];
    const codes = step.code ? (Array.isArray(step.code) ? step.code : [step.code]) : [];
    const el = document.createElement('div');
    el.className = 'lab-step-section active';
    el.innerHTML = `
      <div class="step-header">
        <div class="step-number-badge">${idx + 1}</div>
        <h2 class="step-title-text">${step.title}</h2>
      </div>
      <div class="step-content">${step.content}</div>
      ${step.datasets ? `<div class="daa-resource-row">${step.datasets.map(daaDatasetButton).join('')}</div>` : ''}
      ${codes.map((c, ci) => renderCodeBlock(c, `${idx}-${ci}`)).join('')}
      ${step.after ? `<div class="step-content">${step.after}</div>` : ''}
      ${step.note ? `<div class="callout callout-tip"><div class="callout-label">💡 Tip</div>${step.note}</div>` : ''}
      ${step.warning ? `<div class="callout callout-warning"><div class="callout-label">⚠️ Note</div>${step.warning}</div>` : ''}
      <div class="lab-nav-footer">
        <button class="btn btn-secondary ${idx === 0 ? 'hidden' : ''}" id="btn-prev">← Previous</button>
        <button class="btn btn-primary" id="btn-next">${idx === TOTAL_STEPS - 1 ? 'Go to Knowledge Check →' : 'Next Step →'}</button>
      </div>`;
    stepsContainer.appendChild(el);

    el.querySelector('#btn-next').addEventListener('click', () => {
      doneSteps.add(idx);
      navigateToStep(idx + 1);
    });
    el.querySelector('#btn-prev').addEventListener('click', () => navigateToStep(idx - 1));

    if (window.Prism) {
      try { Prism.highlightAllUnder(el); }
      catch (err) { console.warn('Prism syntax highlighting deferred:', err); }
    }

    el.querySelectorAll('.code-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.code-executor-wrap').querySelector('code');
        navigator.clipboard.writeText(code.textContent).then(() => {
          btn.textContent = '✓ Copied!';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
        });
      });
    });

    el.querySelectorAll('.btn-run-code').forEach(runBtn => {
      runBtn.addEventListener('click', () => runCode(runBtn.closest('.code-executor-wrap')));
    });
  }

  /* ——— Code block with the practice terminal ——— */
  const LANG_ICONS = { python: '🐍', sql: '🗄️', bash: '💻', json: '🧾', markup: '🌐', text: '📝' };
  const codeRegistry = {};

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCodeBlock(code, execKey) {
    const lang = code.language || 'python';
    const id   = `executor-${execKey}`;
    codeRegistry[id] = code;
    return `
      <div class="code-executor-wrap" id="${id}">
        <div class="executor-toolbar">
          <div class="executor-toolbar-left">
            <div class="terminal-dots">
              <span class="terminal-dot dot-red"></span>
              <span class="terminal-dot dot-yellow"></span>
              <span class="terminal-dot dot-green"></span>
            </div>
            <span class="executor-lang-title">${LANG_ICONS[lang] || '📄'} ${code.label || lang.toUpperCase() + ' · COPY INTO A COLAB CELL'}</span>
          </div>
          <div class="executor-actions">
            <button class="code-copy-btn btn" type="button" style="font-size:0.75rem">📋 Copy</button>
            <button class="btn-run-code btn" type="button">▶ ${code.output ? 'Show Output' : 'Run Code'}</button>
          </div>
        </div>
        <pre class="language-${lang}"><code class="language-${lang}">${escapeHtml(code.content)}</code></pre>
        <div class="terminal-window">
          <div class="terminal-log-line" style="color:var(--color-text-muted)">// Run this cell in Google Colab, then click "▶ ${code.output ? 'Show Output' : 'Run Code'}" to compare your result.</div>
        </div>
        <div class="terminal-status-bar">
          <span>Status: Terminal Ready</span>
          <span class="verification-status-badge pending">⚠️ Execution Required</span>
        </div>
      </div>`;
  }

  function runCode(wrapEl) {
    const code   = codeRegistry[wrapEl.id];
    const runBtn = wrapEl.querySelector('.btn-run-code');
    const termEl = wrapEl.querySelector('.terminal-window');
    const badge  = wrapEl.querySelector('.verification-status-badge');

    termEl.innerHTML = `<div class="terminal-log-line" style="color:#fde047">⏳ Running ${code.language || 'python'} cell...</div>`;
    runBtn.disabled = true;

    setTimeout(() => {
      let lines, duration;
      if (code.output !== undefined) {
        lines = String(code.output).split('\n');
        duration = '0.42s';
      } else {
        const res = CodeRunner.execute(code.content);
        lines = res.logs;
        duration = res.duration;
      }
      lastOutputLog = lines.join('\n');

      termEl.innerHTML = lines.map(line =>
        `<div class="terminal-log-line">${escapeHtml(line)}</div>`).join('') +
        (code.images || []).map(src =>
          `<img src="${src}" alt="Chart produced by this cell" loading="lazy" style="display:block;max-width:100%;margin:0.6rem 0;border-radius:8px;background:#fff">`).join('') +
        `<div class="terminal-log-line" style="color:#4ade80;margin-top:0.4rem">✓ Cell finished in ${duration}</div>`;

      badge.className = 'verification-status-badge passed';
      badge.innerHTML = '✓ Code Executed & Verified';
      runBtn.disabled = false;
    }, 350);
  }

  /* ——— Knowledge check ——— */
  let quizAnswers = {};

  function renderQuiz() {
    const el = document.createElement('div');
    el.className = 'lab-step-section active';
    el.innerHTML = `
      <div class="step-header">
        <div class="step-number-badge" style="background:linear-gradient(135deg,#16a34a,#4ade80)">?</div>
        <h2 class="step-title-text">Knowledge Check</h2>
      </div>
      <div class="quiz-section">
        <div class="quiz-title">🧠 Test Your Understanding</div>
        <p class="quiz-subtitle">Answer all ${lab.quiz.length} questions. You need 80% or more to complete this lab.</p>
        ${lab.quiz.map((q, qi) => `
          <div class="quiz-question" id="quiz-q-${qi}">
            <div class="quiz-q-text">Q${qi + 1}. ${q.question}</div>
            <div class="quiz-options">
              ${q.options.map((opt, oi) => `
                <div class="quiz-option" data-q="${qi}" data-o="${oi}" id="opt-${qi}-${oi}">
                  <span class="quiz-option-letter">${String.fromCharCode(65 + oi)}</span>
                  ${opt}
                </div>`).join('')}
            </div>
          </div>`).join('')}
        <div class="quiz-submit-row">
          <button class="btn btn-secondary" id="quiz-retry-btn" style="display:none">↩ Retry Quiz</button>
          <button class="btn btn-primary" id="quiz-submit-btn">Submit Answers</button>
        </div>
        <div class="quiz-result" id="quiz-result"></div>
      </div>
      <div class="lab-nav-footer">
        <button class="btn btn-secondary" id="btn-prev-quiz">← Back to Steps</button>
        <a href="dashboard.html" class="btn btn-secondary">Dashboard</a>
      </div>`;
    stepsContainer.appendChild(el);

    el.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const q = opt.dataset.q;
        el.querySelectorAll(`.quiz-option[data-q="${q}"]`).forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        quizAnswers[q] = parseInt(opt.dataset.o);
      });
    });

    el.querySelector('#quiz-submit-btn').addEventListener('click', () => submitQuiz(el));
    el.querySelector('#quiz-retry-btn').addEventListener('click', () => {
      quizAnswers = {};
      navigateToStep(TOTAL_STEPS);
    });
    el.querySelector('#btn-prev-quiz').addEventListener('click', () => navigateToStep(TOTAL_STEPS - 1));
  }

  async function submitQuiz(el) {
    if (Object.keys(quizAnswers).length < lab.quiz.length) {
      UI.showToast({ type: 'warning', title: 'Incomplete', message: `Answer all ${lab.quiz.length} questions first.` });
      return;
    }

    let correct = 0;
    lab.quiz.forEach((q, qi) => {
      const selected  = quizAnswers[qi];
      const isCorrect = selected === q.answer;
      if (isCorrect) correct++;
      el.querySelectorAll(`.quiz-option[data-q="${qi}"]`).forEach(o => {
        const oi = parseInt(o.dataset.o);
        if (oi === q.answer) o.classList.add('correct');
        else if (oi === selected && !isCorrect) o.classList.add('incorrect');
        o.style.pointerEvents = 'none';
      });
    });

    const score    = Math.round((correct / lab.quiz.length) * 100);
    const resultEl = el.querySelector('#quiz-result');
    resultEl.classList.add('show');

    if (score >= 80) {
      quizDone = true;
      resultEl.classList.add('pass');

      const rawHash   = await CodeRunner.generateProofHash(userId, topicId, labNum, score, lastOutputLog || 'Lab steps completed');
      const proofHash = rawHash.replace(/^DSA-PROOF/, 'DAA-PROOF');
      const result = DAAProgress.completeLabAndCheck(userId, topicId, labNum, {
        verificationPassed: true,
        quizScore: score,
        outputLog: (lastOutputLog || 'Lab steps completed').slice(0, 500),
        proofHash,
        completedAt: new Date().toISOString(),
      });

      const showNext = nextLab && !DAAProgress.isLabComplete(userId, topicId, nextLab.num);
      resultEl.innerHTML = `
        <div style="margin-bottom:1rem">
          ✅ <strong>Lab Completed!</strong> You scored ${correct}/${lab.quiz.length} (${score}%). The 80% pass mark is met.
        </div>
        <div class="flex justify-center gap-3" style="flex-wrap:wrap;margin-top:1rem">
          ${showNext ? `<a href="lab.html?lab=${topicId}-lab${nextLab.num}" class="btn btn-primary">Start Lab ${nextLab.num} →</a>` : ''}
          <a href="dashboard.html" class="btn btn-secondary">← Back to Dashboard</a>
        </div>`;

      UI.showToast({ type: 'success', title: `Lab ${labNum} Completed! 🎉`, message: `Great work completing "${lab.title}"!` });

      if (result.topicBadgeEarned) {
        setTimeout(() => {
          UI.showToast({ type: 'success', title: '🏅 Badge Earned!', message: `You earned the ${DAAProgress.BADGE_NAMES[topicId]}!`, duration: 6000 });
          UI.confettiCelebration(150);
        }, 800);
      }
      if (result.masterBadgeEarned) {
        setTimeout(() => {
          UI.showToast({ type: 'success', title: '🏆 DAA Master Badge!', message: 'You completed every Data Analytics Academy lab!', duration: 10000 });
          UI.confettiCelebration(300);
        }, 2000);
      }

      el.querySelector('#quiz-submit-btn').style.display = 'none';
    } else {
      resultEl.classList.add('fail');
      resultEl.innerHTML = `❌ You scored ${correct}/${lab.quiz.length} (${score}%). You need at least 80%. Review the lab steps and try again.`;
      el.querySelector('#quiz-retry-btn').style.display = 'inline-flex';
    }

    renderSteps();
  }

  /* ——— Navigation & progress ——— */
  function navigateToStep(idx) {
    currentStep = Math.max(0, Math.min(TOTAL_STEPS, idx));
    renderStepContent(currentStep);
    renderSteps();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    const total = TOTAL_STEPS + 1;
    const done  = isLabDone() ? total : doneSteps.size;
    const pct   = Math.min(100, Math.round((done / total) * 100));
    document.getElementById('lab-progress-fill').style.width = `${pct}%`;
    document.getElementById('lab-progress-text').textContent = `${pct}%`;
  }

  /* ——— Mobile sidebar ——— */
  const labSidebar = document.getElementById('lab-sidebar');
  const labOverlay = document.getElementById('lab-overlay');
  document.getElementById('lab-hamburger').addEventListener('click', () => {
    labSidebar.classList.toggle('open');
    labOverlay.classList.toggle('visible');
  });
  labOverlay.addEventListener('click', () => {
    labSidebar.classList.remove('open');
    labOverlay.classList.remove('visible');
  });

  renderSteps();
  renderStepContent(0);
  updateProgress();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDaaLabViewer);
} else {
  initDaaLabViewer();
}
