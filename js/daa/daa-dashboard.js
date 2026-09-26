/* ============================================================
   Data Analytics Academy — Dashboard Logic (daa-dashboard.js)
   Same layout and behaviour as the DSA dashboard, driven by the
   DAA curriculum in daa-progress.js (topics may have 1 or 2 labs).
   ============================================================ */

function initDaaDashboard() {
  const session = Auth.requireAuth('daa', '../');
  if (!session) return;

  const { userId, displayName } = session;

  /* ——— Populate user info ——— */
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.querySelectorAll('.user-initials').forEach(el => el.textContent = initials);
  document.querySelectorAll('.user-display-name').forEach(el => el.textContent = displayName);
  document.querySelectorAll('.user-id').forEach(el => el.textContent = `@${userId}`);

  /* ——— Render Stats ——— */
  function renderStats() {
    const stats = DAAProgress.getStats(userId);
    document.getElementById('stat-labs').textContent    = stats.labsComplete;
    document.getElementById('stat-badges').textContent  = stats.badgesEarned;
    document.getElementById('stat-percent').textContent = `${stats.percent}%`;
    document.getElementById('stat-topics').textContent  = stats.badgesEarned;

    ['overall-progress-fill', 'overall-progress-fill-sidebar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) setTimeout(() => { el.style.width = `${stats.percent}%`; }, 200);
    });

    document.getElementById('overall-progress-text').textContent = `${stats.labsComplete} / ${stats.totalLabs} labs completed`;
    document.getElementById('stat-percent-sidebar').textContent  = `${stats.percent}%`;

    const section = document.getElementById('dsa-badge-section');
    document.getElementById('dsa-badge-svg-wrap').innerHTML = DAAProgress.generateMasterBadgeSVG(stats.masterBadge);
    if (stats.masterBadge) {
      section.classList.add('earned');
      document.getElementById('dsa-badge-title').textContent = '🏆 DAA Master Badge: Earned!';
      document.getElementById('dsa-badge-desc').textContent  = 'Congratulations! You completed every lab in the Data Analytics Academy curriculum.';
    }
  }

  /* ——— Render Topic Cards ——— */
  function renderTopics() {
    const container = document.getElementById('topics-grid');

    container.innerHTML = DAAProgress.TOPICS.map((topic, i) => {
      const status = DAAProgress.getTopicStatus(userId, topic.id);

      const labs = topic.labs.map((lab, li) => {
        const done  = status.labs[li];
        const labId = `${topic.id}-lab${lab.num}`;
        const chip  = lab.level === 'Advanced' ? 'badge-advanced'
                    : lab.level === 'Beginner' ? 'badge-simple' : 'badge-intermediate';
        return `<a href="lab.html?lab=${labId}" class="lab-row ${done ? 'completed' : ''}" id="lab-row-${labId}">
          <span class="lab-status-icon">${done ? '✅' : '⭕'}</span>
          <div class="lab-row-info">
            <div class="lab-row-title">Lab ${lab.num}: ${lab.title}</div>
            <div class="lab-row-meta">⏱ ${lab.duration}</div>
          </div>
          <span class="badge-chip ${chip}">${lab.level}</span>
        </a>`;
      }).join('');

      const topicBadge = DAAProgress.generateBadgeSVG(topic.id, topic.color, topic.icon, status.hasBadge);
      const pctWidth   = (status.done / status.total) * 100;

      return `
        <div class="glass-card topic-card ${status.complete ? 'completed' : ''}" id="card-${topic.id}">
          <div class="topic-card-header">
            <div class="topic-icon" style="background: ${topic.color}22; border-color: ${topic.color}33; color: ${topic.color};">${topic.icon}</div>
            <div class="topic-info">
              <div class="topic-number">Topic ${i + 1} of ${DAAProgress.TOTAL_TOPICS}</div>
              <div class="topic-name">${topic.name}</div>
            </div>
            <div class="topic-badge-icon" title="${DAAProgress.BADGE_NAMES[topic.id]}">${topicBadge}</div>
          </div>
          <div class="topic-labs">${labs}</div>
          <div class="topic-progress">
            <div class="progress-bar-wrap" style="flex:1">
              <div class="progress-bar-fill" style="width: ${pctWidth}%; background: linear-gradient(90deg, ${topic.color}, ${topic.color}aa)"></div>
            </div>
            <span class="topic-progress-text">${status.done}/${status.total} ${status.total === 1 ? 'lab' : 'labs'}</span>
          </div>
        </div>`;
    }).join('');
  }

  /* ——— Render Datasets ——— */
  function renderDatasets() {
    const list = document.getElementById('datasets-list');
    list.innerHTML = Object.keys(DAADatasets).map(key => {
      const d = DAADatasets[key];
      return `<div style="display:flex;flex-direction:column;gap:0.3rem">
        ${daaDatasetButton(key)}
        <span class="text-muted" style="font-size:0.72rem;padding-left:0.2rem">${d.label} · ${d.usedIn}</span>
      </div>`;
    }).join('');
  }

  /* ——— Render Badges Gallery ——— */
  function renderBadges() {
    const container = document.getElementById('badges-grid');

    container.innerHTML = DAAProgress.TOPICS.map(topic => {
      const status = DAAProgress.getTopicStatus(userId, topic.id);
      return `
        <div class="glass-card badge-card ${status.hasBadge ? 'unlocked' : 'locked'}" id="badge-${topic.id}" data-topic-id="${topic.id}">
          <div class="badge-icon-wrap">
            ${DAAProgress.generateBadgeSVG(topic.id, topic.color, topic.icon, status.hasBadge)}
            ${!status.hasBadge ? '<div class="badge-lock-overlay">🔒</div>' : ''}
          </div>
          <span class="badge-name">${DAAProgress.BADGE_NAMES[topic.id]}</span>
          ${status.hasBadge ? '<span class="badge-chip badge-simple" style="font-size:0.65rem">View Proof 📜</span>' : ''}
        </div>`;
    }).join('');

    container.querySelectorAll('.badge-card.unlocked').forEach(card => {
      card.addEventListener('click', () => showEvidenceModal(card.dataset.topicId));
    });
  }

  /* ——— Show Evidence Certificate Modal ——— */
  function showEvidenceModal(topicId) {
    const modal    = document.getElementById('evidence-modal');
    const topic    = DAAProgress.getTopic(topicId);
    const lastLab  = topic.labs[topic.labs.length - 1].num;
    const evidence = DAAProgress.getEvidence(userId, topicId, lastLab) || DAAProgress.getEvidence(userId, topicId, 1);

    document.getElementById('cert-topic-title').textContent = topic.name;
    document.getElementById('cert-student-id').textContent = `Student ID: @${userId}`;

    if (evidence) {
      document.getElementById('cert-quiz-score').textContent = `${evidence.quizScore}% (Passed >=80% Threshold)`;
      document.getElementById('cert-timestamp').textContent  = new Date(evidence.completedAt).toLocaleString();
      document.getElementById('cert-hash').textContent       = evidence.proofHash;
      document.getElementById('cert-log').textContent        = evidence.outputLog || '✓ Lab steps completed.';
    }

    modal.style.display = 'flex';

    const closeModal = () => { modal.style.display = 'none'; };
    document.getElementById('modal-close-btn').onclick = closeModal;
    document.getElementById('modal-done-btn').onclick  = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    document.getElementById('modal-copy-hash-btn').onclick = () => {
      const hash = document.getElementById('cert-hash').textContent;
      navigator.clipboard.writeText(hash).then(() => {
        UI.showToast({ type: 'success', title: 'Copied!', message: 'Proof hash copied to clipboard.' });
      });
    };
  }

  /* ——— Sidebar toggle (mobile) ——— */
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });

  /* ——— Logout ——— */
  document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.logout();
    UI.showToast({ type: 'info', title: 'Logged out', message: 'See you next time!' });
    setTimeout(() => { window.location.href = '../index.html'; }, 800);
  });

  /* ——— Section navigation ——— */
  document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const target = document.getElementById(item.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.innerWidth < 900) {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
      }
    });
  });

  renderStats();
  renderTopics();
  renderDatasets();
  renderBadges();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDaaDashboard);
} else {
  initDaaDashboard();
}
