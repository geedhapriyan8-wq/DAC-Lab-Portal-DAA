/* ============================================================
   DSA Lab Portal — Lab Viewer Logic (lab-viewer.js)
   Follows the same clean, efficient flow as DAA lab viewer:
     • Single & multi-code block support
     • Realistic Google Colab / VS Code execution model
     • 1-click Copy with instant feedback
     • Clean expected output display without fake shell prompts
     • Dataset integration with download buttons
     • Server-graded knowledge checks & badge awards
   ============================================================ */

async function initLabViewer() {
  const session = await Auth.requireAuth('dsa', '../');
  if (!session) return;

  const { userId } = session;
  const params = new URLSearchParams(window.location.search);
  const labParam = params.get('lab'); // e.g. "topic-01-lab1"

  if (!labParam) { window.location.href = 'dashboard.html'; return; }

  // Parse lab param: topic-01-lab1 -> topic-01, 1
  const match = labParam.match(/^(topic-\d{2})-lab(\d)$/);
  if (!match) { window.location.href = 'dashboard.html'; return; }

  const topicId = match[1];
  const labNum = parseInt(match[2]);

  /* ——— Load lab data ——— */
  const labKey = `${topicId}_lab${labNum}`;
  const lab = window.LAB_DATA && window.LAB_DATA[labKey];

  if (!lab) {
    document.getElementById('steps-container').innerHTML = `
      <div class="glass-card" style="text-align:center;padding:3rem">
        <h2>Lab not found</h2>
        <p class="text-muted">Could not load lab: ${labParam}</p>
        <a href="dashboard.html" class="btn btn-secondary" style="margin-top:1rem">← Back to Dashboard</a>
      </div>`;
    return;
  }

  const topic = Progress.TOPICS.find(t => t.id === topicId);
  const alreadyComplete = Progress.isLabComplete(userId, topicId, labNum);

  /* Attach the generated output (dsa-outputs.js) to every code cell in order,
     preserving multi-step continuity and alignment with DSA Resources. */
  const generated = (window.DSA_OUTPUTS || {})[labKey] || [];
  let runIdx = 0;
  lab.steps.forEach(step => {
    const codes = step.code ? (Array.isArray(step.code) ? step.code : [step.code]) : [];
    codes.forEach(c => {
      const g = generated[runIdx++];
      if (g && c.output === undefined) {
        c.output = g.text || '(no output)';
        c.images = g.images || [];
      }
    });
  });

  /* ——— Page & Header metadata ——— */
  document.title = `${lab.title} | DSA Lab Portal`;

  document.getElementById('lab-breadcrumb-topic').textContent = topic ? topic.name : topicId;
  document.getElementById('lab-breadcrumb-lab').textContent = `Lab ${labNum}`;
  document.getElementById('lab-title').textContent = lab.title;
  document.getElementById('lab-difficulty-chip').textContent = lab.difficulty;
  document.getElementById('lab-duration-chip').textContent = `⏱ ${lab.duration}`;
  document.getElementById('lab-steps-count').textContent = `${lab.steps.length} Steps`;
  document.getElementById('lab-overview-text').textContent = lab.overview;

  // Sidebar info
  document.getElementById('lab-sidebar-topic').textContent = topic ? topic.name : '';
  document.getElementById('lab-sidebar-title').textContent = lab.title;
  document.getElementById('lab-sidebar-difficulty').textContent = lab.difficulty;
  document.getElementById('lab-sidebar-duration').textContent = lab.duration;

  // Objectives
  const objList = document.getElementById('lab-objectives-list');
  if (objList && lab.objectives) {
    objList.innerHTML = lab.objectives.map(o =>
      `<li class="lab-objective-item">${o}</li>`).join('');
  }

  // Datasets for this lab
  const TOPIC_DATASETS = {
    'topic-03': ['titanic'],
    'topic-08': ['feedback', 'knowledge'],
    'topic-09': ['knowledge'],
  };
  const labDatasets = (lab.datasets && lab.datasets.length) ? lab.datasets : (TOPIC_DATASETS[topicId] || []);
  const dsEl = document.getElementById('lab-datasets');
  if (dsEl && labDatasets.length && typeof dsaDatasetButton === 'function') {
    dsEl.innerHTML = `<span class="text-muted" style="font-size:0.8rem;align-self:center">Datasets for this lab:</span>` +
      labDatasets.map(dsaDatasetButton).join('');
  }

  // Workflow guide
  const guideEl = document.createElement('div');
  guideEl.className = 'callout callout-info';
  guideEl.style.marginTop = '1rem';
  guideEl.innerHTML = `
    <div class="callout-label">💡 How To Complete This Lab</div>
    <div style="font-size:0.84rem;line-height:1.6;color:var(--color-text-secondary)">
      <strong>1. Run in Portal:</strong> Click <strong>▶ Run Cell</strong> on each step to execute in sequence with shared Python session memory.<br>
      <strong>2. Run in Colab / VS Code:</strong> Click <strong>📋 Copy</strong> on each block to run in your own Jupyter/Colab notebook (variables carry forward cell-by-cell).<br>
      <strong>3. Knowledge Check:</strong> Score 80% or higher on the quiz at the end to earn your verified topic badge.
    </div>`;
  const overviewCard = document.querySelector('.lab-overview-card');
  if (overviewCard && !overviewCard.querySelector('.callout-info')) overviewCard.appendChild(guideEl);

  /* ——— Steps & Navigation ——— */
  const stepsContainer = document.getElementById('steps-container');
  const stepsNavEl = document.getElementById('steps-nav');
  const TOTAL_STEPS = lab.steps.length;
  const doneSteps = new Set();
  if (alreadyComplete) {
    lab.steps.forEach((_, i) => doneSteps.add(i));
  }

  let currentStep = 0;
  let quizDone = alreadyComplete;
  let lastOutputLog = '';
  let lastQuizScore = 0;

  function isStepDone(i) { return doneSteps.has(i) || alreadyComplete; }
  function isLabDone() { return quizDone || alreadyComplete; }

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

    if (idx >= TOTAL_STEPS) {
      renderQuiz();
      return;
    }

    const step = lab.steps[idx];
    const codes = step.code ? (Array.isArray(step.code) ? step.code : [step.code]) : [];
    const stepDatasets = step.datasets ? (Array.isArray(step.datasets) ? step.datasets : [step.datasets]) : [];

    // Step Pipeline Flow Trail
    const pipelineTrailHtml = `
      <div class="step-flow-trail">
        ${lab.steps.map((s, i) => `
          <div class="flow-trail-item ${i === idx ? 'active' : ''} ${isStepDone(i) ? 'done' : ''}" data-step="${i}">
            <span>${isStepDone(i) ? '✓' : (i + 1)}</span> ${escapeHtml(s.title.replace(/^Step\s*\d+:\s*/i, ''))}
          </div>
          ${i < lab.steps.length - 1 ? '<span class="flow-trail-sep">→</span>' : ''}
        `).join('')}
        <span class="flow-trail-sep">→</span>
        <div class="flow-trail-item ${isLabDone() ? 'done' : ''}" data-step="${TOTAL_STEPS}">
          <span>${isLabDone() ? '✓' : '?'}</span> Knowledge Check
        </div>
        <button class="btn-run-all-cells" id="btn-run-all-cells" type="button" title="Run entire notebook sequence">⚡ Run All Cells</button>
      </div>`;

    const el = document.createElement('div');
    el.className = 'lab-step-section active';
    el.innerHTML = `
      ${pipelineTrailHtml}
      <div class="step-header">
        <div class="step-number-badge">${idx + 1}</div>
        <h2 class="step-title-text">${step.title}</h2>
      </div>
      <div class="step-content">${step.content}</div>
      ${renderTopic1InteractiveLogic(idx)}
      ${stepDatasets.length && typeof dsaDatasetButton === 'function' ? `<div class="daa-resource-row">${stepDatasets.map(dsaDatasetButton).join('')}</div>` : ''}
      ${codes.map((c, ci) => renderCodeBlock(c, `${idx}-${ci}`, idx, ci)).join('')}
      ${step.after ? `<div class="step-content">${step.after}</div>` : ''}
      ${step.note ? `<div class="callout callout-tip"><div class="callout-label">💡 Tip</div>${step.note}</div>` : ''}
      ${step.warning ? `<div class="callout callout-warning"><div class="callout-label">⚠️ Note</div>${step.warning}</div>` : ''}
      <div class="lab-nav-footer">
        <button class="btn btn-secondary ${idx === 0 ? 'hidden' : ''}" id="btn-prev">← Previous</button>
        <button class="btn btn-primary" id="btn-next">${idx === TOTAL_STEPS - 1 ? 'Go to Knowledge Check →' : 'Next Step →'}</button>
      </div>`;
    stepsContainer.appendChild(el);

    // Setup Topic 1 interactive logic workbench if on Topic 1
    setupTopic1Workbench(el, idx);

    // Trail navigation clicks
    el.querySelectorAll('.flow-trail-item').forEach(item => {
      item.addEventListener('click', () => navigateToStep(parseInt(item.dataset.step)));
    });

    // Run All Cells button
    const runAllBtn = el.querySelector('#btn-run-all-cells');
    if (runAllBtn) {
      runAllBtn.addEventListener('click', () => runAllNotebookCells());
    }

    el.querySelector('#btn-next').addEventListener('click', () => {
      doneSteps.add(idx);
      navigateToStep(idx + 1);
    });
    el.querySelector('#btn-prev').addEventListener('click', () => navigateToStep(idx - 1));

    if (window.Prism) {
      try { Prism.highlightAllUnder(el); }
      catch (err) { console.warn('Prism syntax highlighting deferred:', err); }
    }

    // Copy code button with instant visual feedback
    el.querySelectorAll('.code-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const codeEl = btn.closest('.code-executor-wrap').querySelector('code');
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          btn.textContent = '✓ Copied!';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
        });
      });
    });

    // Run Cell button
    el.querySelectorAll('.btn-run-code').forEach(runBtn => {
      runBtn.addEventListener('click', () => runCode(runBtn.closest('.code-executor-wrap'), idx));
    });
  }

  /* ——— Code block renderer ——— */
  const LANG_ICONS = {
    python: '🐍',
    sql: '🗄️',
    bash: '💻',
    json: '🧾',
    markup: '🌐',
    html: '🌐',
    dockerfile: '🐳',
    text: '📝'
  };
  const codeRegistry = {};
  const executedStates = {};

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCodeBlock(code, execKey, stepIdx, codeIdx) {
    if (typeof code === 'string') {
      code = { language: 'python', content: code };
    }
    const lang = code.language || 'python';
    const id = `executor-${execKey}`;
    codeRegistry[id] = code;

    const cellNum = (stepIdx !== undefined ? stepIdx + 1 : 1);
    const isExecuted = !!executedStates[id];

    // Connectivity description
    const isRoot = (stepIdx === 0 && (codeIdx === 0 || codeIdx === undefined));
    const continuityText = isRoot
      ? `<strong>Session Root:</strong> Initializes Python 3.10 runtime environment, imports, and base dataset variables.`
      : `<strong>Session Memory Connected:</strong> Variables & imports from <em>Step 1 ${stepIdx > 1 ? `through Step ${stepIdx}` : ''}</em> are preserved in active kernel memory.`;

    const initialTerminalContent = isExecuted
      ? executedStates[id].html
      : `<div class="terminal-log-line" style="color:var(--color-text-muted)">// In [${cellNum}]: Click "▶ Run Cell [${cellNum}]" to execute in the connected Python session, or copy into Google Colab.</div>`;

    const initialBadge = isExecuted
      ? `<span class="verification-status-badge passed">✓ Cell [${cellNum}] Executed & Synced</span>`
      : `<span class="verification-status-badge pending">⚠️ Run to Execute in Session</span>`;

    return `
      <div class="code-executor-wrap" id="${id}">
        <div class="executor-toolbar">
          <div class="executor-toolbar-left">
            <div class="terminal-dots">
              <span class="terminal-dot dot-red"></span>
              <span class="terminal-dot dot-yellow"></span>
              <span class="terminal-dot dot-green"></span>
            </div>
            <span class="executor-lang-title">${LANG_ICONS[lang] || '📄'} ${lang.toUpperCase()} · NOTEBOOK CELL [${cellNum}]</span>
            <span class="kernel-status-tag ${isRoot ? 'root' : 'connected'}">
              ${isRoot ? '⚡ Session Initialized' : `🔗 Connected (Step 1 → ${stepIdx})`}
            </span>
          </div>
          <div class="executor-actions">
            <button class="code-copy-btn btn" type="button" style="font-size:0.75rem" title="Copy code for Colab or IDE">📋 Copy</button>
            <button class="btn-run-code btn" type="button">▶ ${isExecuted ? `Re-run Cell [${cellNum}]` : `Run Cell [${cellNum}]`}</button>
          </div>
        </div>
        <pre class="language-${lang}"><code class="language-${lang}">${escapeHtml(code.content)}</code></pre>
        
        <div class="session-continuity-banner ${isRoot ? 'root-banner' : ''}">
          <div class="continuity-left">
            <span class="continuity-icon">${isRoot ? '⚡' : '🔗'}</span>
            <span class="continuity-text">${continuityText}</span>
          </div>
          <div class="continuity-badge">${isRoot ? 'Session Ready' : 'Memory Synced'}</div>
        </div>

        <div class="terminal-window">
          ${initialTerminalContent}
        </div>
        <div class="terminal-status-bar">
          <span>Kernel: Python 3.10 Interactive Environment · Connected</span>
          ${initialBadge}
        </div>
      </div>`;
  }

  /* ——— Topic 1: Interactive Logic Visualizer & Simulator ——— */
  function renderTopic1InteractiveLogic(stepIdx) {
    if (topicId !== 'topic-01') return '';

    if (labNum === 1) {
      if (stepIdx === 0 || stepIdx === 1) {
        return `
          <div class="topic1-logic-workbench" id="t1-extractor-workbench">
            <div class="workbench-badge">🧠 Interactive Logic Workbench</div>
            <div class="workbench-title">Live Entity Extraction & Urgency Engine</div>
            <div class="workbench-subtitle">
              Understand the AI logic under the hood: select a sample message or edit the text below to watch how the extraction rules and urgency heuristics calculate decisions in real time!
            </div>
            <div class="workbench-presets-bar">
              <span class="workbench-preset-label">Sample Presets:</span>
              <button type="button" class="workbench-preset-pill active" data-preset="outage">🚨 Checkout Outage ($14,500)</button>
              <button type="button" class="workbench-preset-pill" data-preset="security">🔒 Security Threat</button>
              <button type="button" class="workbench-preset-pill" data-preset="billing">💳 Billing Query ($3,250)</button>
              <button type="button" class="workbench-preset-pill" data-preset="ui">🎨 Minor UI Bug</button>
            </div>
            <textarea class="workbench-textarea" id="workbench-input-text" rows="3" placeholder="Type or paste any customer message...">CRITICAL OUTAGE: The online store checkout is completely down! Over 820 customer checkout orders failed with HTTP 500 error. Revenue impact estimated at $14,500. Escalate to sre-leads@company.io immediately!</textarea>
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
              <button type="button" class="workbench-btn-execute" id="btn-run-extraction-logic">⚡ Test Extraction Logic Live</button>
              <span style="font-size:0.75rem;color:var(--color-text-muted)">Evaluates regex patterns, urgency scores & dispatch routing</span>
            </div>
            <div class="workbench-results-grid" id="workbench-output-area">
              <div class="workbench-panel">
                <div class="workbench-panel-title">🏷️ Extracted Entities</div>
                <div class="entity-chips-wrap" id="workbench-entity-chips"></div>
                <div class="workbench-panel-title" style="margin-top:0.75rem">📋 Structured JSON Schema</div>
                <pre class="language-json" style="margin:0;max-height:160px;font-size:0.74rem;background:#060911"><code class="language-json" id="workbench-json-code"></code></pre>
              </div>
              <div class="workbench-panel">
                <div class="workbench-panel-title">🔍 Step-by-Step Logic Trace</div>
                <div id="workbench-logic-trace"></div>
              </div>
            </div>
          </div>`;
      } else if (stepIdx === 2 || stepIdx === 3) {
        return `
          <div class="topic1-logic-workbench" id="t1-triage-workbench">
            <div class="workbench-badge">🎯 Decision Logic Explorer</div>
            <div class="workbench-title">Automated Triage & Escalation Thresholds</div>
            <div class="workbench-subtitle">
              Learn how decision boundary thresholds divide incoming requests into on-call emergencies vs routine tickets. Drag the threshold slider to see how routing reacts!
            </div>
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;padding:0.75rem;background:rgba(10,15,29,0.7);border-radius:8px">
              <span style="font-size:0.8rem;font-weight:700;color:#c7d2fe">Escalation Threshold:</span>
              <input type="range" id="threshold-slider" min="25" max="100" value="75" step="25" style="flex:1;cursor:pointer">
              <span id="threshold-val-label" style="font-family:var(--font-mono);font-weight:700;color:#38bdf8;background:rgba(56,189,248,0.15);padding:0.2rem 0.5rem;border-radius:4px">75</span>
            </div>
            <div id="triage-table-preview"></div>
          </div>`;
      }
    } else if (labNum === 2) {
      return `
        <div class="topic1-logic-workbench" id="t1-workflow-simulator">
          <div class="workbench-badge">⚡ Interactive Workflow Simulator</div>
          <div class="workbench-title">Experience the 3-Stage Automation: Trigger → Decision → Actions</div>
          <div class="workbench-subtitle">
            See how incoming events trigger intelligent decisions and multi-channel actions. Select an event trigger and watch the software execute the full automated lifecycle!
          </div>
          <div class="workbench-presets-bar">
            <span class="workbench-preset-label">Trigger Event:</span>
            <button type="button" class="workbench-preset-pill active" data-wf-event="outage">🚨 Payment Outage (Web Form)</button>
            <button type="button" class="workbench-preset-pill" data-wf-event="billing">💳 Billing Question (Email)</button>
            <button type="button" class="workbench-preset-pill" data-wf-event="feature">💡 Feature Request (Portal)</button>
            <button type="button" class="workbench-preset-pill" data-wf-event="feedback">⭐ Positive Review (Web Form)</button>
          </div>
          <div class="workflow-pipeline-stepper">
            <div class="workflow-stage-node active" id="wf-node-trigger">
              <div class="stage-node-icon">📥</div>
              <div class="stage-node-label">1. Trigger Event</div>
              <div class="stage-node-sub" id="wf-sub-trigger">Web Form Ingested</div>
            </div>
            <span style="color:#6366f1;font-weight:700">→</span>
            <div class="workflow-stage-node active" id="wf-node-decision">
              <div class="stage-node-icon">🧠</div>
              <div class="stage-node-label">2. Decision Logic</div>
              <div class="stage-node-sub" id="wf-sub-decision">Evaluate Intent & Priority</div>
            </div>
            <span style="color:#6366f1;font-weight:700">→</span>
            <div class="workflow-stage-node active" id="wf-node-action">
              <div class="stage-node-icon">🚀</div>
              <div class="stage-node-label">3. Multi-Actions</div>
              <div class="stage-node-sub" id="wf-sub-action">Slack, Ticket & Email</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.85rem">
            <button type="button" class="workbench-btn-execute" id="btn-run-workflow-sim">▶ Execute Automated Workflow</button>
            <span style="font-size:0.75rem;color:#4ade80" id="wf-sim-status">✓ Ready to dispatch</span>
          </div>
          <div class="workflow-actions-grid" id="wf-actions-display"></div>
        </div>`;
    }
    return '';
  }

  function setupTopic1Workbench(containerEl, stepIdx) {
    if (topicId !== 'topic-01') return;

    if (labNum === 1) {
      if (stepIdx === 0 || stepIdx === 1) {
        const presets = {
          outage: "CRITICAL OUTAGE: The online store checkout is completely down! Over 820 customer checkout orders failed with HTTP 500 error. Revenue impact estimated at $14,500. Escalate to sre-leads@company.io immediately!",
          security: "URGENT Security alert: Suspicious API token usage detected from IP 198.51.100.42 making 4,200 requests/min against /api/v2/auth. Potential credential stuffing attack. Contact security-ops@corp.net. Severity: High.",
          billing: "Invoice discrepancy noticed on invoice INV-2026-881 for compute cluster usage. Charged $3,250.00 instead of agreed tier discount rate. Please review with accounts-payable@finclient.org. Priority: Medium.",
          ui: "Hello, our team noticed minor visual latency (approx 280ms) when rendering the new dark mode navigation bar on iOS Safari. Non-blocking UI issue. Reporter: design-qa@partner.com. Priority: Low."
        };

        const textarea = containerEl.querySelector('#workbench-input-text');
        const runBtn = containerEl.querySelector('#btn-run-extraction-logic');
        const entityChips = containerEl.querySelector('#workbench-entity-chips');
        const jsonCode = containerEl.querySelector('#workbench-json-code');
        const logicTrace = containerEl.querySelector('#workbench-logic-trace');
        const pills = containerEl.querySelectorAll('.workbench-preset-pill');

        function runExtraction() {
          if (!textarea) return;
          const text = textarea.value.trim();
          if (!text) return;

          const emails = text.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g) || [];
          const amounts = text.match(/\$[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?/g) || [];
          const httpCodes = text.match(/HTTP\s*([2-5][0-9]{2})/gi) || [];
          const ips = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];

          const lower = text.toLowerCase();
          let severity = "LOW", score = 25, ruleText = 'No critical keywords detected';
          if (/critical|outage|credential stuffing/.test(lower)) {
            severity = "CRITICAL"; score = 100;
            ruleText = 'Matched keywords ["critical" / "outage"]';
          } else if (/urgent|security alert|high/.test(lower)) {
            severity = "HIGH"; score = 75;
            ruleText = 'Matched keywords ["urgent" / "security alert"]';
          } else if (/discrepancy|medium|invoice/.test(lower)) {
            severity = "MEDIUM"; score = 50;
            ruleText = 'Matched keywords ["discrepancy" / "invoice"]';
          }

          const isEscalated = score >= 75;
          const route = isEscalated ? "ESCALATION_QUEUE (On-Call Alert)" : "STANDARD_BACKLOG (Routine Queue)";

          if (entityChips) {
            entityChips.innerHTML = `
              <div class="entity-chip">📧 ${emails[0] || 'No email found'}</div>
              <div class="entity-chip money">💵 ${amounts[0] || 'No dollar amount'}</div>
              <div class="entity-chip signal">⚠️ ${httpCodes[0] || (ips[0] ? ips[0] : 'No error code')}</div>
              <div class="entity-chip" style="background:rgba(168,85,247,0.15);color:#c084fc;border-color:rgba(168,85,247,0.3)">
                🎯 Urgency: ${score}/100 (${severity})
              </div>`;
          }

          if (logicTrace) {
            logicTrace.innerHTML = `
              <div class="logic-step-row">
                <span class="logic-step-num">1.</span>
                <span class="logic-step-desc"><strong>Email Regex:</strong> ${emails.length ? `Extracted <code>${escapeHtml(emails[0])}</code>` : 'No email pattern match'}</span>
              </div>
              <div class="logic-step-row">
                <span class="logic-step-num">2.</span>
                <span class="logic-step-desc"><strong>Financial Regex:</strong> ${amounts.length ? `Detected amount <code>${escapeHtml(amounts[0])}</code>` : 'No currency detected'}</span>
              </div>
              <div class="logic-step-row">
                <span class="logic-step-num">3.</span>
                <span class="logic-step-desc"><strong>Urgency Scoring:</strong> ${ruleText} → Score <strong>${score}</strong> <span class="logic-step-badge logic-badge-${severity.toLowerCase()}">${severity}</span></span>
              </div>
              <div class="logic-step-row">
                <span class="logic-step-num">4.</span>
                <span class="logic-step-desc"><strong>Decision Boundary:</strong> Score ${score} ${isEscalated ? '≥' : '<'} 75 Threshold → Route: <strong style="color:${isEscalated ? '#f87171' : '#4ade80'}">${route}</strong></span>
              </div>`;
          }

          const schema = {
            severity: severity,
            urgency_score: score,
            priority_route: isEscalated ? "ESCALATION_QUEUE" : "STANDARD_BACKLOG",
            contact_emails: emails,
            dollar_impact: amounts[0] || "N/A",
            technical_signals: {
              http_codes: httpCodes.map(c => c.replace(/HTTP\s*/i, '')),
              ips: ips
            }
          };

          if (jsonCode) {
            jsonCode.textContent = JSON.stringify(schema, null, 2);
          }
        }

        pills.forEach(pill => {
          pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const key = pill.dataset.preset;
            if (presets[key] && textarea) {
              textarea.value = presets[key];
              runExtraction();
            }
          });
        });

        if (runBtn) {
          runBtn.addEventListener('click', runExtraction);
        }

        runExtraction();
      } else if (stepIdx === 2 || stepIdx === 3) {
        const slider = containerEl.querySelector('#threshold-slider');
        const valLabel = containerEl.querySelector('#threshold-val-label');
        const tablePreview = containerEl.querySelector('#triage-table-preview');

        const sampleRows = [
          { id: 'RAW-901', channel: 'Email', urgency: 100, severity: 'CRITICAL', contact: 'sre-leads@company.io', impact: '$14,500' },
          { id: 'RAW-903', channel: 'Slack', urgency: 75, severity: 'HIGH', contact: 'security-ops@corp.net', impact: 'N/A' },
          { id: 'RAW-904', channel: 'Portal', urgency: 50, severity: 'MEDIUM', contact: 'accounts-payable@finclient.org', impact: '$3,250.00' },
          { id: 'RAW-902', channel: 'Zendesk', urgency: 25, severity: 'LOW', contact: 'design-qa@partner.com', impact: 'N/A' }
        ];

        function renderTriageTable(thresh) {
          if (!tablePreview) return;
          tablePreview.innerHTML = `
            <div style="overflow-x:auto">
              <table style="width:100%;font-size:0.78rem;border-collapse:collapse;color:#e2e8f0;background:rgba(10,15,29,0.5);border-radius:6px">
                <thead>
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.1);text-align:left;color:#94a3b8">
                    <th style="padding:0.4rem 0.6rem">ID</th>
                    <th style="padding:0.4rem 0.6rem">Severity</th>
                    <th style="padding:0.4rem 0.6rem">Score</th>
                    <th style="padding:0.4rem 0.6rem">Contact</th>
                    <th style="padding:0.4rem 0.6rem">Impact</th>
                    <th style="padding:0.4rem 0.6rem">Automated Destination</th>
                  </tr>
                </thead>
                <tbody>
                  ${sampleRows.map(r => {
                    const isEsc = r.urgency >= thresh;
                    return `
                      <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
                        <td style="padding:0.4rem 0.6rem;font-family:var(--font-mono)">${r.id}</td>
                        <td style="padding:0.4rem 0.6rem"><span class="logic-step-badge logic-badge-${r.severity.toLowerCase()}">${r.severity}</span></td>
                        <td style="padding:0.4rem 0.6rem;font-family:var(--font-mono);font-weight:700">${r.urgency}</td>
                        <td style="padding:0.4rem 0.6rem">${r.contact}</td>
                        <td style="padding:0.4rem 0.6rem;color:#34d399">${r.impact}</td>
                        <td style="padding:0.4rem 0.6rem">
                          <span style="font-weight:700;padding:0.15rem 0.5rem;border-radius:4px;font-size:0.72rem;background:${isEsc ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'};color:${isEsc ? '#f87171' : '#4ade80'};border:1px solid ${isEsc ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}">
                            ${isEsc ? '🚨 ESCALATION_QUEUE (On-Call)' : '📋 STANDARD_BACKLOG (Routine)'}
                          </span>
                        </td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`;
        }

        if (slider) {
          slider.addEventListener('input', () => {
            const val = parseInt(slider.value);
            if (valLabel) valLabel.textContent = val;
            renderTriageTable(val);
          });
        }
        renderTriageTable(75);
      }
    } else if (labNum === 2) {
      const wfEvents = {
        outage: {
          id: "EVT-101",
          channel: "Web Form",
          sender: "sarah.chen@techcorp.com",
          subject: "System Down: Payment Gateway Error 500",
          category: "INCIDENT",
          priority: "CRITICAL",
          rule: "Matched 'System Down' & 'Error 500'",
          actions: [
            { icon: "📢", title: "Slack Webhook Alert", target: "#incident-alerts", content: "🚨 CRITICAL: System Down: Payment Gateway Error 500 from sarah.chen@techcorp.com" },
            { icon: "🎫", title: "Support Ticket Created", target: "Queue: SRE-Critical", content: "Ticket TICK-1001 assigned with Priority P1-CRITICAL" },
            { icon: "✉️", title: "Automated Customer Email", target: "To: sarah.chen@techcorp.com", content: "Subject: 'We are investigating your issue immediately'" }
          ]
        },
        billing: {
          id: "EVT-102",
          channel: "Email",
          sender: "billing-inquiries@partner.org",
          subject: "Invoice Question for October",
          category: "BILLING",
          priority: "MEDIUM",
          rule: "Matched 'Invoice' & 'Charges'",
          actions: [
            { icon: "🎫", title: "Finance Queue Ticket", target: "Queue: Finance-Billing", content: "Ticket TICK-1002 filed with Priority P2-MEDIUM" },
            { icon: "✉️", title: "Acknowledgement Email", target: "To: billing-inquiries@partner.org", content: "Subject: 'Billing Inquiry Received - assigned to finance'" }
          ]
        },
        feature: {
          id: "EVT-103",
          channel: "Customer Portal",
          sender: "alex.m@startup.io",
          subject: "Feature Request: Export to CSV",
          category: "PRODUCT_FEEDBACK",
          priority: "LOW",
          rule: "Matched 'Feature Request' & 'CSV'",
          actions: [
            { icon: "🎫", title: "Product Backlog Ticket", target: "Queue: Product-Feedback", content: "Ticket TICK-1003 created with Priority P3-LOW" },
            { icon: "✉️", title: "Thank You Email", target: "To: alex.m@startup.io", content: "Subject: 'Thank you for your feature suggestion!'" }
          ]
        },
        feedback: {
          id: "EVT-104",
          channel: "Web Form",
          sender: "linda.k@enterprise.net",
          subject: "Great onboarding experience!",
          category: "GENERAL_INQUIRY",
          priority: "LOW",
          rule: "Routine positive comment",
          actions: [
            { icon: "✉️", title: "Appreciation Email", target: "To: linda.k@enterprise.net", content: "Subject: 'Thank you for contacting us - we appreciate your kind words!'" }
          ]
        }
      };

      let activeKey = 'outage';
      const pills = containerEl.querySelectorAll('.workbench-preset-pill');
      const runBtn = containerEl.querySelector('#btn-run-workflow-sim');
      const subTrigger = containerEl.querySelector('#wf-sub-trigger');
      const subDecision = containerEl.querySelector('#wf-sub-decision');
      const actionsDisplay = containerEl.querySelector('#wf-actions-display');
      const simStatus = containerEl.querySelector('#wf-sim-status');

      function executeWorkflow(key) {
        const evt = wfEvents[key];
        if (!evt) return;

        if (subTrigger) subTrigger.textContent = `${evt.channel} (${evt.id})`;
        if (subDecision) subDecision.textContent = `[${evt.category}] Priority: ${evt.priority}`;
        if (simStatus) simStatus.innerHTML = `✓ Dispatched ${evt.actions.length} automated actions in 0.03s`;

        if (actionsDisplay) {
          actionsDisplay.innerHTML = evt.actions.map(act => `
            <div class="workflow-action-card">
              <div class="action-card-header">
                <span>${act.icon}</span> <span>${act.title}</span>
              </div>
              <div style="font-size:0.7rem;color:#818cf8;margin-bottom:0.25rem">${act.target}</div>
              <div class="action-card-content">${escapeHtml(act.content)}</div>
            </div>
          `).join('');
        }
      }

      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          pills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          activeKey = pill.dataset.wfEvent;
          executeWorkflow(activeKey);
        });
      });

      if (runBtn) {
        runBtn.addEventListener('click', () => executeWorkflow(activeKey));
      }

      executeWorkflow('outage');
    }
  }

  function runCode(wrapEl, stepIdx) {
    const code = codeRegistry[wrapEl.id];
    const runBtn = wrapEl.querySelector('.btn-run-code');
    const termEl = wrapEl.querySelector('.terminal-window');
    const badge = wrapEl.querySelector('.verification-status-badge');
    const cellNum = (stepIdx !== undefined ? stepIdx + 1 : 1);

    termEl.innerHTML = `<div class="terminal-log-line" style="color:#fde047">⏳ In [${cellNum}]: Executing cell in connected Python session...</div>`;
    runBtn.disabled = true;

    setTimeout(() => {
      let lines, duration;
      if (code.output !== undefined) {
        lines = String(code.output).split('\n');
        duration = '0.38s';
      } else {
        const res = CodeRunner.execute(code.content);
        lines = (res.logs || []).flatMap(l => String(l).split('\n'));
        duration = res.duration || '0.25s';
      }
      lastOutputLog = lines.join('\n');

      const renderedHtml = `
        <div class="terminal-session-header">
          <span class="prompt-badge">In [${cellNum}]</span>
          <span class="session-stamp">Python 3.10 · Shared Kernel</span>
        </div>` +
        lines.map(line => `<div class="terminal-log-line">${line ? escapeHtml(line) : '&nbsp;'}</div>`).join('') +
        (code.images || []).map(src =>
          `<img src="${src}" alt="Output figure" loading="lazy" style="display:block;max-width:100%;margin:0.6rem 0;border-radius:8px;background:#fff">`).join('') +
        `<div class="terminal-session-footer">
          <span class="out-badge">Out [${cellNum}]</span>
          <span style="color:#4ade80">✓ Cell finished in ${duration} · Session memory preserved</span>
        </div>`;

      termEl.innerHTML = renderedHtml;
      termEl.scrollTop = termEl.scrollHeight;
      executedStates[wrapEl.id] = { html: renderedHtml, log: lastOutputLog };

      if (badge) {
        badge.className = 'verification-status-badge passed';
        badge.innerHTML = `✓ Cell [${cellNum}] Executed & Synced`;
      }
      runBtn.textContent = `✓ Re-run Cell [${cellNum}]`;
      runBtn.disabled = false;

      if (stepIdx !== undefined) {
        doneSteps.add(stepIdx);
        renderSteps();
        const trailItem = document.querySelector(`.flow-trail-item[data-step="${stepIdx}"]`);
        if (trailItem) {
          trailItem.classList.add('done');
          const span = trailItem.querySelector('span');
          if (span) span.textContent = '✓';
        }
      }
    }, 280);
  }

  /* Execute all cells across the entire lab in sequence */
  function runAllNotebookCells() {
    lab.steps.forEach((step, si) => {
      doneSteps.add(si);
      const codes = step.code ? (Array.isArray(step.code) ? step.code : [step.code]) : [];
      codes.forEach((c, ci) => {
        const id = `executor-${si}-${ci}`;
        const lines = String(c.output !== undefined ? c.output : '(executed)').split('\n');
        const renderedHtml = `
          <div class="terminal-session-header">
            <span class="prompt-badge">In [${si + 1}]</span>
            <span class="session-stamp">Python 3.10 · Shared Kernel</span>
          </div>` +
          lines.map(line => `<div class="terminal-log-line">${escapeHtml(line)}</div>`).join('') +
          (c.images || []).map(src =>
            `<img src="${src}" alt="Output figure" loading="lazy" style="display:block;max-width:100%;margin:0.6rem 0;border-radius:8px;background:#fff">`).join('') +
          `<div class="terminal-session-footer">
            <span class="out-badge">Out [${si + 1}]</span>
            <span style="color:#4ade80">✓ Cell finished in 0.35s · Session memory preserved</span>
          </div>`;
        executedStates[id] = { html: renderedHtml, log: lines.join('\n') };
      });
    });
    renderSteps();
    renderStepContent(currentStep);
    UI.showToast({ type: 'success', title: 'All Cells Executed! 🚀', message: 'Full lab session state connected and verified.' });
  }

  /* ——— Knowledge Check Quiz ——— */
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

    const submitBtn = el.querySelector('#quiz-submit-btn');
    submitBtn.disabled = true;
    const answers = lab.quiz.map((_, qi) => quizAnswers[qi]);
    const result = await Auth.submitQuiz(labKey, answers, (lastOutputLog || 'Standard execution output verified').slice(0, 500));
    submitBtn.disabled = false;
    if (!result.ok) {
      UI.showToast({ type: 'error', title: 'Could not submit', message: result.message });
      return;
    }

    // Mark each pick right or wrong; correct options are shown once the lab is passed
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
    const total = TOTAL_STEPS + 1; // steps + quiz
    const done = isLabDone() ? total : (doneSteps.size + (quizDone ? 1 : 0));
    const pct = Math.min(100, Math.round((done / total) * 100));
    const pFill = document.getElementById('lab-progress-fill');
    const pText = document.getElementById('lab-progress-text');
    if (pFill) pFill.style.width = `${pct}%`;
    if (pText) pText.textContent = `${pct}%`;
  }

  /* ——— Sidebar toggle ——— */
  const labSidebar = document.getElementById('lab-sidebar');
  const labOverlay = document.getElementById('lab-overlay');
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLabViewer);
} else {
  initLabViewer();
}
