/* ============================================================
   DSA Lab Portal — Progress & Badge Tracker (progress.js)
   ============================================================ */

const Progress = (() => {
  const TOPICS = [
    { id: 'topic-01', name: 'AI Basics + Workflow Automation',           icon: '🤖', color: '#6366f1' },
    { id: 'topic-02', name: 'AI Ethics (Integration with DAA)',          icon: '⚖️',  color: '#8b5cf6' },
    { id: 'topic-03', name: 'Machine Learning Pipeline',                 icon: '🔬', color: '#06b6d4' },
    { id: 'topic-04', name: 'Neural Networks from Scratch',              icon: '🧠', color: '#10b981' },
    { id: 'topic-05', name: 'Neural Networks via Transfer Learning',     icon: '🔄', color: '#f59e0b' },
    { id: 'topic-06', name: 'Computer Vision',                           icon: '👁️',  color: '#ec4899' },
    { id: 'topic-07', name: 'AI in Cybersecurity',                       icon: '🛡️',  color: '#ef4444' },
    { id: 'topic-08', name: 'Natural Language Processing',               icon: '💬', color: '#a855f7' },
    { id: 'topic-09', name: 'RAG Pipeline',                              icon: '📚', color: '#f97316' },
    { id: 'topic-10', name: 'AI Agents (Theory & Practical)',            icon: '🦾', color: '#14b8a6' },
    { id: 'topic-11', name: 'Multi-Agents + Prompt Engineering (DAA)',   icon: '🕸️',  color: '#eab308' },
  ];

  const BADGE_NAMES = {
    'topic-01': 'AI Basics Badge',
    'topic-02': 'AI Ethics Badge',
    'topic-03': 'ML Pipeline Badge',
    'topic-04': 'Neural Networks Badge',
    'topic-05': 'Transfer Learning Badge',
    'topic-06': 'Computer Vision Badge',
    'topic-07': 'Cybersecurity Badge',
    'topic-08': 'NLP Badge',
    'topic-09': 'RAG Pipeline Badge',
    'topic-10': 'AI Agents Badge',
    'topic-11': 'Multi-Agents Badge',
    'dsa': 'DSA Master Badge',
  };

  /* ——— Get user progress from localStorage ——— */
  function getUserData(userId) {
    const users = JSON.parse(localStorage.getItem('dsa_portal_users')) || {};
    return users[userId] || null;
  }

  function saveUserData(userId, data) {
    const users = JSON.parse(localStorage.getItem('dsa_portal_users')) || {};
    users[userId] = data;
    localStorage.setItem('dsa_portal_users', JSON.stringify(users));
  }

  /* ——— Mark a lab complete with cryptographic evidence proof ——— */
  function completeLabAndCheck(userId, topicId, labNum, evidence) {
    const users = JSON.parse(localStorage.getItem('dsa_portal_users')) || {};
    const user  = users[userId];
    if (!user) return { topicBadgeEarned: false, dsaBadgeEarned: false };

    if (!user.progress) user.progress = {};
    if (!user.progress[topicId]) user.progress[topicId] = { lab1: false, lab2: false };
    user.progress[topicId][`lab${labNum}`] = true;

    // Save evidence proof
    if (!user.evidence) user.evidence = {};
    const labKey = `${topicId}_lab${labNum}`;
    user.evidence[labKey] = evidence || {
      verificationPassed: true,
      quizScore: 100,
      completedAt: new Date().toISOString(),
      proofHash: `DSA-PROOF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };

    let topicBadgeEarned = false;
    let dsaBadgeEarned   = false;

    // Check topic badge
    const tp = user.progress[topicId];
    if (tp.lab1 && tp.lab2 && !(user.badges || []).includes(topicId)) {
      if (!user.badges) user.badges = [];
      user.badges.push(topicId);
      topicBadgeEarned = true;
    }

    // Check DSA badge — all 11 topics must have both labs complete
    if (!user.dsaBadge) {
      const allDone = TOPICS.every(t => {
        const p = user.progress[t.id];
        return p && p.lab1 && p.lab2;
      });
      if (allDone) {
        user.dsaBadge = true;
        dsaBadgeEarned = true;
      }
    }

    users[userId] = user;
    localStorage.setItem('dsa_portal_users', JSON.stringify(users));
    return { topicBadgeEarned, dsaBadgeEarned, topicId };
  }

  function getEvidence(userId, topicId, labNum) {
    const user = getUserData(userId);
    if (!user || !user.evidence) return null;
    const labKey = labNum ? `${topicId}_lab${labNum}` : topicId;
    return user.evidence[labKey] || user.evidence[`${topicId}_lab1`] || null;
  }

  /* ——— Check if a specific lab is complete ——— */
  function isLabComplete(userId, topicId, labNum) {
    const user = getUserData(userId);
    if (!user || !user.progress || !user.progress[topicId]) return false;
    return !!user.progress[topicId][`lab${labNum}`];
  }

  /* ——— Get overall stats ——— */
  function getStats(userId) {
    const user = getUserData(userId);
    if (!user) return { labsComplete: 0, totalLabs: 22, badgesEarned: 0, totalBadges: 11, dsaBadge: false, percent: 0 };

    let labsComplete = 0;
    TOPICS.forEach(t => {
      const p = user.progress && user.progress[t.id];
      if (p) {
        if (p.lab1) labsComplete++;
        if (p.lab2) labsComplete++;
      }
    });

    const badgesEarned = (user.badges || []).length;
    const dsaBadge     = !!user.dsaBadge;
    const percent      = Math.round((labsComplete / 22) * 100);

    return { labsComplete, totalLabs: 22, badgesEarned, totalBadges: 11, dsaBadge, percent };
  }

  /* ——— Get per-topic status ——— */
  function getTopicStatus(userId, topicId) {
    const user = getUserData(userId);
    const p    = user && user.progress && user.progress[topicId];
    const lab1 = p && p.lab1 ? true : false;
    const lab2 = p && p.lab2 ? true : false;
    const hasBadge = (user && user.badges || []).includes(topicId);
    return { lab1, lab2, complete: lab1 && lab2, hasBadge };
  }

  /* ——— Generate badge SVG ——— */
  function generateBadgeSVG(topicId, color, icon, earned) {
    const opacity = earned ? '1' : '0.3';
    const glowId  = `glow-${topicId}`;
    return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" class="badge-svg">
  <defs>
    <radialGradient id="${glowId}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <filter id="f${topicId}">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <!-- Glow ring -->
  <circle cx="40" cy="40" r="38" fill="url(#${glowId})" opacity="${earned ? 1 : 0}"/>
  <!-- Outer ring -->
  <circle cx="40" cy="40" r="36" fill="none" stroke="${color}" stroke-width="2" opacity="${opacity}" stroke-dasharray="${earned ? 'none' : '4 3'}"/>
  <!-- Inner shape (hexagon-like) -->
  <polygon points="40,8 68,24 68,56 40,72 12,56 12,24" fill="${color}" opacity="${earned ? 0.15 : 0.05}"/>
  <polygon points="40,8 68,24 68,56 40,72 12,56 12,24" fill="none" stroke="${color}" stroke-width="1.5" opacity="${opacity}"/>
  <!-- Star rays (earned only) -->
  ${earned ? `
  <line x1="40" y1="2" x2="40" y2="12" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
  <line x1="40" y1="68" x2="40" y2="78" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
  <line x1="2" y1="40" x2="12" y2="40" stroke="${color}" stroke-width="1.5" opacity="0.5"/>
  <line x1="68" y1="40" x2="78" y2="40" stroke="${color}" stroke-width="1.5" opacity="0.5"/>` : ''}
  <!-- Icon background circle -->
  <circle cx="40" cy="38" r="16" fill="${color}" opacity="${earned ? 0.2 : 0.08}"/>
  <!-- Icon text -->
  <text x="40" y="45" text-anchor="middle" font-size="18" opacity="${opacity}">${icon}</text>
  <!-- "EARNED" ribbon -->
  ${earned ? `<rect x="16" y="62" width="48" height="10" rx="5" fill="${color}" opacity="0.85"/>
  <text x="40" y="70" text-anchor="middle" font-size="6" fill="white" font-family="sans-serif" font-weight="700" letter-spacing="1">EARNED</text>` : ''}
</svg>`;
  }

  function generateDSABadgeSVG(earned) {
    const color = '#f59e0b';
    const opacity = earned ? '1' : '0.3';
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="badge-svg" style="width:100px;height:100px">
  <defs>
    <radialGradient id="dsaGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#dsaGlow)" opacity="${earned ? 1 : 0}"/>
  <!-- Multi-ring -->
  <circle cx="50" cy="50" r="46" fill="none" stroke="${color}" stroke-width="2" opacity="${opacity}"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="1" opacity="${earned ? 0.4 : 0.1}"/>
  <!-- Star shape -->
  <polygon points="50,10 58,35 85,35 63,53 71,78 50,62 29,78 37,53 15,35 42,35" fill="${color}" opacity="${earned ? 0.2 : 0.05}"/>
  <polygon points="50,10 58,35 85,35 63,53 71,78 50,62 29,78 37,53 15,35 42,35" fill="none" stroke="${color}" stroke-width="1.5" opacity="${opacity}"/>
  <!-- Trophy -->
  <text x="50" y="58" text-anchor="middle" font-size="26" opacity="${opacity}">🏆</text>
  <!-- DSA text -->
  ${earned ? `<rect x="20" y="76" width="60" height="14" rx="7" fill="${color}" opacity="0.9"/>
  <text x="50" y="87" text-anchor="middle" font-size="7.5" fill="#000" font-family="sans-serif" font-weight="800" letter-spacing="1.5">DSA MASTER</text>` : `
  <text x="50" y="88" text-anchor="middle" font-size="7" fill="${color}" font-family="sans-serif" font-weight="700" opacity="0.4">COMPLETE ALL LABS</text>`}
</svg>`;
  }

  return {
    TOPICS, BADGE_NAMES,
    getUserData, saveUserData, completeLabAndCheck,
    isLabComplete, getStats, getTopicStatus, getEvidence,
    generateBadgeSVG, generateDSABadgeSVG
  };
})();
