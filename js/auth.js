/* ============================================================
   DSA Lab Portal — Authentication (auth.js)
   Uses Web Crypto API (SHA-256 + salt) — no dependencies
   ============================================================ */

const Auth = (() => {
  const USERS_KEY  = 'dsa_portal_users';
  const SESSION_KEY = 'dsa_portal_session';

  /* ——— Programmes (the 2-way gate) ———
     Each account belongs to exactly one programme, chosen at registration.
     `home` is relative to the site root. Accounts created before the gate
     existed have no programme and are treated as DSA. */
  const PROGRAMS = {
    dsa: { name: 'DSA Lab Portal',                    home: 'dashboard.html' },
    daa: { name: 'Data Analytics Academy Lab Portal', home: 'daa/dashboard.html' },
  };

  function programOf(record) {
    return (record && PROGRAMS[record.program]) ? record.program : 'dsa';
  }

  function homeFor(program, root = '') {
    return root + PROGRAMS[PROGRAMS[program] ? program : 'dsa'].home;
  }

  /* ——— Crypto Helpers ——— */
  async function hashPassword(password, salt) {
    const enc  = new TextEncoder();
    const data = enc.encode(salt + password + 'dsa_portal_2025');
    const buf  = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ——— Storage Helpers ——— */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /* ——— Register ——— */
  async function register(userId, password, displayName, program) {
    userId = userId.trim().toLowerCase();

    // Validation
    if (!PROGRAMS[program])
      return { ok: false, message: 'Please choose your programme: DSA or Data Analytics Academy.' };
    if (!userId || userId.length < 3)
      return { ok: false, message: 'User ID must be at least 3 characters.' };
    if (!/^[a-z0-9_.-]+$/.test(userId))
      return { ok: false, message: 'User ID can only contain letters, numbers, dots, hyphens, underscores.' };
    if (!password || password.length < 8)
      return { ok: false, message: 'Password must be at least 8 characters.' };
    if (!displayName || displayName.trim().length < 2)
      return { ok: false, message: 'Display name must be at least 2 characters.' };

    const users = getUsers();
    if (users[userId])
      return { ok: false, message: 'This User ID is already taken. Please choose another.' };

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    users[userId] = {
      userId,
      displayName: displayName.trim(),
      salt,
      hash,
      createdAt: new Date().toISOString(),
      program,
      progress: {},
      badges: [],
      dsaBadge: false,
    };

    saveUsers(users);
    return { ok: true, message: 'Account created successfully!' };
  }

  /* ——— Login ——— */
  async function login(userId, password) {
    userId = userId.trim().toLowerCase();
    const users = getUsers();
    const user  = users[userId];

    if (!user)
      return { ok: false, message: 'No account found with that User ID.' };

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash)
      return { ok: false, message: 'Incorrect password. Please try again.' };

    // Create session
    const session = {
      userId,
      displayName: user.displayName,
      program: programOf(user),
      loginAt: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { ok: true, user: session, home: homeFor(session.program) };
  }

  /* ——— Logout ——— */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* ——— Get current session ——— */
  function getCurrentSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  /* ——— Require auth (redirect if not logged in) ———
     program: the programme this page belongs to ('dsa' | 'daa'). A student
              from the other programme is sent to their own dashboard.
     root:    path from this page back to the site root ('' or '../'). */
  function requireAuth(program, root = '') {
    const session = getCurrentSession();
    if (!session) {
      window.location.href = root + 'index.html';
      return null;
    }
    // Re-read the programme from the account so an admin change applies on next page load
    session.program = programOf(getUser(session.userId) || session);
    if (program && session.program !== program) {
      window.location.href = homeFor(session.program, root);
      return null;
    }
    return session;
  }

  /* ——— Require no auth (redirect to the student's dashboard if already logged in) ——— */
  function requireGuest(root = '') {
    const session = getCurrentSession();
    if (session) {
      window.location.href = homeFor(programOf(getUser(session.userId) || session), root);
    }
  }

  /* ——— Get full user object ——— */
  function getUser(userId) {
    const users = getUsers();
    return users[userId] || null;
  }

  /* ——— Update user data ——— */
  function updateUser(userId, updates) {
    const users = getUsers();
    if (!users[userId]) return false;
    users[userId] = { ...users[userId], ...updates };
    saveUsers(users);
    return true;
  }

  return { PROGRAMS, homeFor, register, login, logout, getCurrentSession, requireAuth, requireGuest, getUser, updateUser };
})();

/* ============================================================
   UI Utilities (Toast, Confetti, etc.)
   ============================================================ */
const UI = (() => {
  /* ——— Toast Notifications ——— */
  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.className = 'toast-container';
      c.setAttribute('role', 'alert');
      c.setAttribute('aria-live', 'polite');
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast({ type = 'info', title, message, duration = 4000 }) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div>
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  /* ——— Confetti Burst ——— */
  function confettiBurst(x, y, count = 60) {
    const colors = ['#6366f1','#8b5cf6','#f59e0b','#10b981','#06b6d4','#ec4899','#f97316'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * 360;
      const dist  = 80 + Math.random() * 200;
      const dx = Math.cos(angle * Math.PI / 180) * dist;
      const dy = -100 - Math.random() * 200;
      const dur = 1.5 + Math.random() * 1;
      p.style.cssText = `
        left: ${x}px; top: ${y}px;
        background: ${color};
        width: ${4 + Math.random() * 8}px;
        height: ${4 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation-duration: ${dur}s;
        transform: translate(${dx}px, ${dy}px);`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), dur * 1000 + 200);
    }
  }

  /* ——— Full-screen confetti ——— */
  function confettiCelebration(count = 120) {
    confettiBurst(window.innerWidth / 2, window.innerHeight / 3, count);
  }

  /* ——— Set loading state on button ——— */
  function setLoading(btn, loading) {
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /* ——— Password strength check ——— */
  function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { score, level: 'weak',   label: 'Weak' };
    if (score === 2) return { score, level: 'fair',  label: 'Fair' };
    if (score === 3) return { score, level: 'good',  label: 'Good' };
    return               { score, level: 'strong', label: 'Strong' };
  }

  return { showToast, confettiBurst, confettiCelebration, setLoading, checkPasswordStrength };
})();
