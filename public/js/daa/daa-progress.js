/* ============================================================
   Data Analytics Academy — Progress & Badge Tracker (daa-progress.js)
   The server returns DAA progress on the account under `daa`, so a
   DAA student's data never mixes with the DSA curriculum.
   ============================================================ */

const DAAProgress = (() => {
  /* Curriculum: topics may have 1 or 2 labs. Every lab is ~2 hours. */
  const TOPICS = [
    { id: 'daa-01', name: 'Python + GitHub Integration',                   icon: '🐍', color: '#22c55e',
      labs: [
        { num: 1, title: 'Python Foundations & Your First GitHub Repository',          duration: '2 hours', level: 'Beginner' },
        { num: 2, title: 'Python Deep Dive: Dictionaries, Control Flow, Loops & Functions', duration: '2 hours', level: 'Advanced' },
      ] },
    { id: 'daa-02', name: 'AI Ethics',                                     icon: '⚖️', color: '#4ade80',
      labs: [
        { num: 1, title: 'AI Ethics in Practice: Auditing Bias in a Recruitment Dataset', duration: '2 hours', level: 'Beginner → Advanced' },
      ] },
    { id: 'daa-03', name: 'SQL (Structured Query Language)',               icon: '🗄️', color: '#2dd4bf',
      labs: [
        { num: 1, title: 'SQL I: Core Foundations: SELECT, WHERE, Aggregates & GROUP BY', duration: '2 hours', level: 'Beginner' },
        { num: 2, title: 'SQL II: JOINs & CRUD: Connecting and Modifying Tables',        duration: '2 hours', level: 'Advanced' },
      ] },
    { id: 'daa-04', name: 'EDA (Exploratory Data Analysis) & Visualization', icon: '🔍', color: '#84cc16',
      labs: [
        { num: 1, title: 'EDA I: Inspect, Clean & Summarise a Retail Dataset',   duration: '2 hours', level: 'Beginner' },
        { num: 2, title: 'EDA II: Visualisation with Matplotlib & Seaborn',      duration: '2 hours', level: 'Advanced' },
      ] },
    { id: 'daa-05', name: 'Web Scraping',                                  icon: '🕸️', color: '#10b981',
      labs: [
        { num: 1, title: 'Web Scraping with Requests & BeautifulSoup',           duration: '2 hours', level: 'Beginner → Advanced' },
      ] },
    { id: 'daa-06', name: 'Intro to Machine Learning',                     icon: '🤖', color: '#34d399',
      labs: [
        { num: 1, title: 'Your First Machine Learning Pipeline: Predicting House Prices', duration: '2 hours', level: 'Beginner → Advanced' },
      ] },
    { id: 'daa-07', name: 'Machine Learning Algorithms',                   icon: '🌳', color: '#a3e635',
      labs: [
        { num: 1, title: 'Linear & Logistic Regression, Decision Trees and Random Forests', duration: '2 hours', level: 'Beginner → Advanced' },
      ] },
    { id: 'daa-08', name: 'Natural Language Processing',                   icon: '💬', color: '#14b8a6',
      labs: [
        { num: 1, title: 'Introduction to NLP & Text Preprocessing',             duration: '2 hours', level: 'Beginner' },
        { num: 2, title: 'Sentiment Analysis: From Bag of Words to a Classifier', duration: '2 hours', level: 'Advanced' },
      ] },
    { id: 'daa-09', name: 'Prompt Engineering (Integrating with Multi-Agent)', icon: '🧠', color: '#facc15',
      labs: [
        { num: 1, title: 'Prompt Engineering with CRAFT & Designing a Multi-Agent Architecture', duration: '2 hours', level: 'Beginner' },
        { num: 2, title: 'Multi-Agent Systems: Shared State, Debate & Cyclic Workflows',          duration: '2 hours', level: 'Advanced' },
      ] },
  ];

  const TOTAL_LABS   = TOPICS.reduce((n, t) => n + t.labs.length, 0);
  const TOTAL_TOPICS = TOPICS.length;

  const BADGE_NAMES = {
    'daa-01': 'Python & GitHub Badge',
    'daa-02': 'AI Ethics Badge',
    'daa-03': 'SQL Badge',
    'daa-04': 'EDA & Visualization Badge',
    'daa-05': 'Web Scraping Badge',
    'daa-06': 'Intro to ML Badge',
    'daa-07': 'ML Algorithms Badge',
    'daa-08': 'NLP Badge',
    'daa-09': 'Prompt Engineering & Multi-Agent Badge',
    'daa':    'DAA Master Badge',
  };

  function getTopic(topicId) {
    return TOPICS.find(t => t.id === topicId) || null;
  }

  /* ——— The signed-in student's DAA progress (loaded from the server by Auth) ———
     Labs are marked complete by the server when a quiz is passed (Auth.submitQuiz). */
  function getDaaData(userId) {
    const user = Auth.getUser(userId);
    if (!user) return null;
    return user.daa || { progress: {}, badges: [], evidence: {}, masterBadge: false };
  }

  function getEvidence(userId, topicId, labNum) {
    const daa = getDaaData(userId);
    if (!daa) return null;
    return daa.evidence[`${topicId}_lab${labNum || 1}`] || null;
  }

  function isLabComplete(userId, topicId, labNum) {
    const daa = getDaaData(userId);
    return !!(daa && daa.progress[topicId] && daa.progress[topicId][`lab${labNum}`]);
  }

  function getTopicStatus(userId, topicId) {
    const topic = getTopic(topicId);
    const daa   = getDaaData(userId);
    const p     = (daa && daa.progress[topicId]) || {};
    const labs  = topic.labs.map(l => !!p[`lab${l.num}`]);
    const done  = labs.filter(Boolean).length;
    return {
      labs,
      done,
      total: topic.labs.length,
      complete: done === topic.labs.length,
      hasBadge: !!(daa && daa.badges.includes(topicId)),
    };
  }

  function getStats(userId) {
    const daa = getDaaData(userId);
    let labsComplete = 0;
    if (daa) {
      TOPICS.forEach(t => t.labs.forEach(l => {
        if (daa.progress[t.id] && daa.progress[t.id][`lab${l.num}`]) labsComplete++;
      }));
    }
    const badgesEarned = daa ? daa.badges.length : 0;
    return {
      labsComplete,
      totalLabs: TOTAL_LABS,
      badgesEarned,
      totalBadges: TOTAL_TOPICS,
      masterBadge: !!(daa && daa.masterBadge),
      percent: Math.round((labsComplete / TOTAL_LABS) * 100),
    };
  }

  /* ——— Badge artwork (same shapes as DSA, DAA colours) ——— */
  function generateBadgeSVG(topicId, color, icon, earned) {
    return Progress.generateBadgeSVG(topicId, color, icon, earned);
  }

  function generateMasterBadgeSVG(earned) {
    const color   = '#22c55e';
    const opacity = earned ? '1' : '0.3';
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="badge-svg" style="width:100px;height:100px">
  <defs>
    <radialGradient id="daaGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#daaGlow)" opacity="${earned ? 1 : 0}"/>
  <circle cx="50" cy="50" r="46" fill="none" stroke="${color}" stroke-width="2" opacity="${opacity}"/>
  <circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="1" opacity="${earned ? 0.4 : 0.1}"/>
  <polygon points="50,10 58,35 85,35 63,53 71,78 50,62 29,78 37,53 15,35 42,35" fill="${color}" opacity="${earned ? 0.2 : 0.05}"/>
  <polygon points="50,10 58,35 85,35 63,53 71,78 50,62 29,78 37,53 15,35 42,35" fill="none" stroke="${color}" stroke-width="1.5" opacity="${opacity}"/>
  <text x="50" y="58" text-anchor="middle" font-size="26" opacity="${opacity}">🏆</text>
  ${earned ? `<rect x="20" y="76" width="60" height="14" rx="7" fill="${color}" opacity="0.9"/>
  <text x="50" y="87" text-anchor="middle" font-size="7.5" fill="#04210f" font-family="sans-serif" font-weight="800" letter-spacing="1.5">DAA MASTER</text>` : `
  <text x="50" y="88" text-anchor="middle" font-size="7" fill="${color}" font-family="sans-serif" font-weight="700" opacity="0.5">COMPLETE ALL LABS</text>`}
</svg>`;
  }

  return {
    TOPICS, TOTAL_LABS, TOTAL_TOPICS, BADGE_NAMES,
    getTopic, getDaaData, getEvidence,
    isLabComplete, getTopicStatus, getStats,
    generateBadgeSVG, generateMasterBadgeSVG,
  };
})();
