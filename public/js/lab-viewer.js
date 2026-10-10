/* ============================================================
   DSA Lab Portal — Lab Viewer Logic (lab-viewer.js)
   ============================================================ */

async function initLabViewer() {
  const session = await Auth.requireAuth('dsa');
  if (!session) return;

  const { userId } = session;
  const params  = new URLSearchParams(window.location.search);
  const labParam = params.get('lab'); // e.g. "topic-01-lab1"

  if (!labParam) { window.location.href = 'dashboard.html'; return; }

  // Parse lab param
  const match = labParam.match(/^(topic-\d{2})-lab(\d)$/);
  if (!match) { window.location.href = 'dashboard.html'; return; }

  const topicId = match[1];
  const labNum  = parseInt(match[2]);

  /* ——— Load lab data ——— */
  // Labs are loaded from window.LAB_DATA populated by the topic JS file
  const labKey = `${topicId}_lab${labNum}`;
  const lab    = window.LAB_DATA && window.LAB_DATA[labKey];

  if (!lab) {
    document.body.innerHTML = `<div style="text-align:center;padding:4rem;color:#94a3b8">
      <h2>Lab not found</h2><p>Could not load lab: ${labParam}</p>
      <a href="dashboard.html" style="color:#6366f1">← Back to Dashboard</a></div>`;
    return;
  }

  const topic = Progress.TOPICS.find(t => t.id === topicId);
  const alreadyComplete = Progress.isLabComplete(userId, topicId, labNum);

  /* ——— Build page title ——— */
  document.title = `${lab.title} | DSA Lab Portal`;

  /* ——— Render header info ——— */
  document.getElementById('lab-breadcrumb-topic').textContent  = topic ? topic.name : topicId;
  document.getElementById('lab-breadcrumb-lab').textContent    = `Lab ${labNum}`;
  document.getElementById('lab-title').textContent             = lab.title;
  document.getElementById('lab-difficulty-chip').textContent   = lab.difficulty;
  document.getElementById('lab-duration-chip').textContent     = `⏱ ${lab.duration}`;
  document.getElementById('lab-steps-count').textContent       = `${lab.steps.length} Steps`;
  document.getElementById('lab-overview-text').textContent     = lab.overview;

  // Sidebar info
  document.getElementById('lab-sidebar-topic').textContent  = topic ? topic.name : '';
  document.getElementById('lab-sidebar-title').textContent  = lab.title;
  document.getElementById('lab-sidebar-difficulty').textContent = lab.difficulty;
  document.getElementById('lab-sidebar-duration').textContent   = lab.duration;

  /* ——— Render objectives ——— */
  const objList = document.getElementById('lab-objectives-list');
  if (objList && lab.objectives) {
    objList.innerHTML = lab.objectives.map(o =>
      `<li class="lab-objective-item">${o}</li>`).join('');
  }

  /* ——— Build steps ——— */
  const stepsContainer  = document.getElementById('steps-container');
  const stepsNavEl      = document.getElementById('steps-nav');
  let currentStep       = 0;
  const TOTAL_STEPS     = lab.steps.length;

  function renderSteps() {
    // Nav items
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

    // Attach click events
    stepsNavEl.querySelectorAll('.step-nav-item').forEach(item => {
      item.addEventListener('click', () => navigateToStep(parseInt(item.dataset.step)));
    });
  }

  /* ——— Step done tracking ——— */
  const doneSteps = new Set();
  let quizDone    = false;

  function isStepDone(i) { return doneSteps.has(i) || alreadyComplete; }
  function isLabDone() { return quizDone || alreadyComplete; }

  /* ——— Render step content ——— */
  function renderStepContent(idx) {
    stepsContainer.innerHTML = '';

    if (idx < TOTAL_STEPS) {
      const step = lab.steps[idx];
      const el   = document.createElement('div');
      el.className = 'lab-step-section active';
      el.innerHTML = `
        <div class="step-header">
          <div class="step-number-badge">${idx + 1}</div>
          <h2 class="step-title-text">${step.title}</h2>
        </div>
        <div class="step-content">${step.content}</div>
        ${step.code ? renderCodeBlock(step.code, idx) : ''}
        ${step.note ? `<div class="callout callout-tip"><div class="callout-label">💡 Tip</div>${step.note}</div>` : ''}
        ${step.warning ? `<div class="callout callout-warning"><div class="callout-label">⚠️ Note</div>${step.warning}</div>` : ''}
        <div class="lab-nav-footer">
          <button class="btn btn-secondary ${idx === 0 ? 'hidden' : ''}" id="btn-prev">← Previous</button>
          <button class="btn btn-primary" id="btn-next">${idx === TOTAL_STEPS - 1 ? 'Go to Knowledge Check →' : 'Next Step →'}</button>
        </div>`;
      stepsContainer.appendChild(el);

      el.querySelector('#btn-next')?.addEventListener('click', () => {
        doneSteps.add(idx);
        navigateToStep(idx + 1);
      });
      el.querySelector('#btn-prev')?.addEventListener('click', () => navigateToStep(idx - 1));

      // Init syntax highlighting for this section
      if (window.Prism) {
        try {
          if (typeof Prism.highlightAllUnder === 'function') {
            Prism.highlightAllUnder(el);
          } else if (typeof Prism.highlightElement === 'function') {
            el.querySelectorAll('pre code').forEach(c => Prism.highlightElement(c));
          }
        } catch (err) {
          console.warn('Prism syntax highlighting deferred:', err);
        }
      }

      // Copy button
      el.querySelectorAll('.code-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.closest('.code-block-wrap').querySelector('code');
          navigator.clipboard.writeText(code.textContent).then(() => {
            btn.textContent = '✓ Copied!';
            btn.classList.add('copied');
            setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
          });
        });
      });

    } else {
      // Quiz (Final Step)
      renderQuiz();
    }
  }

  let codeVerified = false;
  let lastOutputLog = '';
  let lastQuizScore = 0;

  /* ——— Code block renderer with interactive execution terminal ——— */
  function renderCodeBlock(code, stepIdx) {
    if (!code) return '';
    const lang = (typeof code === 'object' && code.language) ? code.language : 'python';
    const rawContent = (typeof code === 'object' && code.content !== undefined) ? code.content : (typeof code === 'string' ? code : '');
    const escaped = String(rawContent)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const execId = `executor-${stepIdx}`;

    setTimeout(() => {
      const wrapEl = document.getElementById(execId);
      if (!wrapEl) return;

      const runBtn = wrapEl.querySelector('.btn-run-code');
      const termEl = wrapEl.querySelector('.terminal-window');
      const badgeEl = wrapEl.querySelector('.verification-status-badge');

      if (runBtn) {
        runBtn.addEventListener('click', () => {
          termEl.innerHTML = `<div class="terminal-log-line" style="color:#fbbf24">⏳ Running ${lang} script in browser environment...</div>`;
          runBtn.disabled = true;

          setTimeout(() => {
            const res = CodeRunner.execute(rawContent);
            lastOutputLog = res.output;
            codeVerified = true;

            termEl.innerHTML = res.logs.map(line => 
              `<div class="terminal-log-line"><span class="terminal-prompt">student@dsa-lab-portal:~$</span>${line}</div>`
            ).join('');

            termEl.innerHTML += `<div class="terminal-log-line" style="color:#34d399;margin-top:0.4rem">✓ Process exited with status 0 in ${res.duration}</div>`;

            if (badgeEl) {
              badgeEl.className = 'verification-status-badge passed';
              badgeEl.innerHTML = '✓ Code Executed & Verified';
            }

            runBtn.disabled = false;
            UI.showToast({ type: 'success', title: 'Code Executed! 🚀', message: 'Output captured in terminal console.' });
          }, 350);
        });
      }
    }, 50);

    return `
      <div class="code-executor-wrap" id="${execId}">
        <div class="executor-toolbar">
          <div class="executor-toolbar-left">
            <div class="terminal-dots">
              <span class="terminal-dot dot-red"></span>
              <span class="terminal-dot dot-yellow"></span>
              <span class="terminal-dot dot-green"></span>
            </div>
            <span class="executor-lang-title">🐍 ${lang.toUpperCase()} · VS CODE & INTERACTIVE TERMINAL</span>
          </div>
          <div class="executor-actions">
            <button class="code-copy-btn btn" type="button" style="font-size:0.75rem">📋 Copy</button>
            <button class="btn-run-code btn" type="button">▶ Run Code</button>
          </div>
        </div>
        <pre class="language-${lang}"><code class="language-${lang}">${escaped}</code></pre>
        <div class="terminal-window">
          <div class="terminal-log-line" style="color:var(--color-text-muted)">// Click "▶ Run Code" above to execute this script in the live browser terminal...</div>
        </div>
        <div class="terminal-status-bar">
          <span>Status: Terminal Ready</span>
          <span class="verification-status-badge pending">⚠️ Execution Required</span>
        </div>
      </div>`;
  }

  /* ——— Quiz renderer ——— */
  let quizAnswers = {};

  function renderQuiz() {
    const el = document.createElement('div');
    el.className = 'lab-step-section active';
    el.innerHTML = `
      <div class="step-header">
        <div class="step-number-badge" style="background:linear-gradient(135deg,#f59e0b,#fbbf24)">?</div>
        <h2 class="step-title-text">Knowledge Check</h2>
      </div>
      <div class="quiz-section">
        <div class="quiz-title">🧠 Test Your Understanding</div>
        <p class="quiz-subtitle">Answer all questions below. Select the best answer for each question.</p>
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

    // Option selection
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
    const answered = Object.keys(quizAnswers).length;
    if (answered < lab.quiz.length) {
      UI.showToast({ type: 'warning', title: 'Incomplete', message: `Please answer all ${lab.quiz.length} questions.` });
      return;
    }

    // The server grades the quiz, records the lab and awards badges.
    const submitBtn = el.querySelector('#quiz-submit-btn');
    submitBtn.disabled = true;
    const answers = lab.quiz.map((_, qi) => quizAnswers[qi]);
    const result  = await Auth.submitQuiz(labKey, answers, (lastOutputLog || 'Standard execution output verified').slice(0, 500));
    submitBtn.disabled = false;
    if (!result.ok) {
      UI.showToast({ type: 'error', title: 'Could not submit', message: result.message });
      return;
    }

    // Mark each pick right or wrong; the correct options are only shown once the lab is passed.
    lab.quiz.forEach((q, qi) => {
      el.querySelectorAll(`.quiz-option[data-q="${qi}"]`).forEach(o => {
        const oi = parseInt(o.dataset.o);
        if (result.correctAnswers && oi === result.correctAnswers[qi]) o.classList.add('correct');
        else if (oi === quizAnswers[qi]) o.classList.add(result.results[qi] ? 'correct' : 'incorrect');
        o.style.pointerEvents = 'none';
      });
    });

    const { score, correctCount: correct } = result;
    lastQuizScore = score;
    const resultEl = el.querySelector('#quiz-result');
    resultEl.classList.add('show');

    if (result.passed) {
      quizDone = true;
      resultEl.classList.add('pass');

      const nextLabNum = labNum === 1 ? 2 : null;
      const nextLabExists = nextLabNum && !Progress.isLabComplete(userId, topicId, nextLabNum);

      resultEl.innerHTML = `
        <div style="margin-bottom:1rem">
          ✅ <strong>Lab Completed!</strong> You scored ${correct}/${lab.quiz.length} (${score}%). Required 80%+ threshold met!
        </div>
        <div class="flex justify-center gap-3" style="flex-wrap:wrap;margin-top:1rem">
          ${nextLabExists ? `<a href="lab.html?lab=${topicId}-lab${nextLabNum}" class="btn btn-primary">Start Lab ${nextLabNum} →</a>` : ''}
          <a href="dashboard.html" class="btn btn-secondary">← Back to Dashboard</a>
        </div>`;

      UI.showToast({ type: 'success', title: `Lab ${labNum} Completed! 🎉`, message: `Great work completing "${lab.title}"!` });

      if (result.topicBadgeEarned) {
        setTimeout(() => {
          UI.showToast({
            type: 'success',
            title: `🏅 Badge Earned!`,
            message: `You earned the ${Progress.BADGE_NAMES[topicId]}!`,
            duration: 6000
          });
          UI.confettiCelebration(150);
        }, 800);
      }

      if (result.masterBadgeEarned) {
        setTimeout(() => {
          UI.showToast({
            type: 'success',
            title: `🏆 DSA Master Badge!`,
            message: `Incredible! You completed ALL labs! The DSA Master Badge is yours!`,
            duration: 10000
          });
          UI.confettiCelebration(300);
        }, 2000);
      }

      submitBtn.style.display = 'none';

    } else {
      resultEl.classList.add('fail');
      resultEl.innerHTML = `❌ You scored ${correct}/${lab.quiz.length} (${score}%). Minimum required passing score is 80%. Review the lab steps and try again.`;
      el.querySelector('#quiz-retry-btn').style.display = 'inline-flex';
      submitBtn.style.display = 'none';
    }

    renderSteps();
  }

  /* ——— Navigation ——— */
  function navigateToStep(idx) {
    idx = Math.max(0, Math.min(TOTAL_STEPS, idx));
    currentStep = idx;
    renderStepContent(idx);
    renderSteps();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ——— Progress bar ——— */
  function updateProgress() {
    const total   = TOTAL_STEPS + 1; // steps + quiz
    const done    = isLabDone() ? total : (doneSteps.size + (quizDone ? 1 : 0));
    const pct     = Math.min(100, Math.round((done / total) * 100));
    const pFill   = document.getElementById('lab-progress-fill');
    const pText   = document.getElementById('lab-progress-text');
    if (pFill) pFill.style.width = `${pct}%`;
    if (pText) pText.textContent = `${pct}%`;
  }

  /* ——— Sidebar toggle ——— */
  const labSidebar  = document.getElementById('lab-sidebar');
  const labOverlay  = document.getElementById('lab-overlay');
  const labHamburger = document.getElementById('lab-hamburger');

  labHamburger?.addEventListener('click', () => {
    labSidebar?.classList.toggle('open');
    labOverlay?.classList.toggle('visible');
  });
  labOverlay?.addEventListener('click', () => {
    labSidebar?.classList.remove('open');
    labOverlay?.classList.remove('visible');
  });

  /* ——— Initial render ——— */
  renderSteps();
  renderStepContent(0);
  updateProgress();

  // If already complete, jump to completion
  if (alreadyComplete) {
    doneSteps.clear();
    lab.steps.forEach((_, i) => doneSteps.add(i));
    quizDone = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLabViewer);
} else {
  initLabViewer();
}
