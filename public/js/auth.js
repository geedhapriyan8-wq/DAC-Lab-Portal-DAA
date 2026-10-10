/* ============================================================
   DAC Lab Portal — Authentication (auth.js)
   Accounts, sessions and progress live on the server (/api/*).
   The signed-in student's data is loaded once per page and kept
   in memory, so progress.js and daa-progress.js can read it
   synchronously.
   ============================================================ */

const Auth = (() => {
  /* ——— Programmes (the 2-way gate) ———
     Each account belongs to exactly one programme, chosen at registration.
     Only an admin can move a student to the other programme.
     `home` is relative to the site root. */
  const PROGRAMS = {
    dsa: { name: 'DSA Lab Portal',                    home: 'dsa/dashboard.html' },
    daa: { name: 'Data Analytics Academy Lab Portal', home: 'daa/dashboard.html' },
  };

  function homeFor(program, root = '') {
    return root + PROGRAMS[PROGRAMS[program] ? program : 'dsa'].home;
  }

  let currentUser = null;   // the signed-in student's account + progress

  /* ——— Talking to the API ——— */
  async function api(path, { method = 'GET', body } = {}) {
    try {
      const res = await fetch(`/api/${path}`, {
        method,
        credentials: 'same-origin',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = {};
      try { data = await res.json(); } catch { /* empty or non-JSON reply */ }
      if (!res.ok && data.ok === undefined) data.ok = false;
      return { status: res.status, message: data.message || (res.ok ? '' : `Server error (${res.status}).`), ...data };
    } catch {
      return { ok: false, status: 0, message: 'Could not reach the server. Check your internet connection and try again.' };
    }
  }

  /* ——— Register ——— */
  async function register(userId, password, displayName, program) {
    if (!PROGRAMS[program])
      return { ok: false, message: 'Please choose your programme: DSA or Data Analytics Academy.' };
    return api('auth/register', { method: 'POST', body: { userId, password, displayName, program } });
  }

  /* ——— Login ——— */
  async function login(userId, password) {
    const r = await api('auth/login', { method: 'POST', body: { userId, password } });
    if (!r.ok) return r;
    currentUser = r.user;
    return { ok: true, user: sessionOf(r.user), home: homeFor(r.user.program), mustChangePassword: r.user.mustChangePassword };
  }

  /* ——— Change password (required after an admin reset) ——— */
  async function changePassword(currentPassword, newPassword) {
    const r = await api('auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
    if (r.ok) currentUser = r.user;
    return r.ok ? { ok: true, home: homeFor(r.user.program) } : r;
  }

  /* ——— Logout ——— */
  async function logout() {
    currentUser = null;
    await api('auth/logout', { method: 'POST' });
  }

  function sessionOf(user) {
    return user && {
      userId: user.userId,
      displayName: user.displayName,
      program: user.program,
      isAdmin: user.isAdmin,
      mustChangePassword: user.mustChangePassword,
    };
  }

  /* ——— Load the signed-in student from the server (null if signed out) ——— */
  async function loadSession() {
    const r = await api('me');
    currentUser = r.ok ? r.user : null;
    return currentUser;
  }

  function getCurrentSession() {
    return sessionOf(currentUser);
  }

  /* ——— Require auth (redirect if not logged in) ———
     program: the programme this page belongs to ('dsa' | 'daa'), or null
              for pages any signed-in user may open. A student from the
              other programme is sent to their own dashboard.
     root:    path from this page back to the site root ('' or '../'). */
  async function requireAuth(program, root = '') {
    const user = await loadSession();
    if (!user || user.mustChangePassword) {
      window.location.href = root + 'index.html';
      return null;
    }
    if (program && user.program !== program) {
      window.location.href = homeFor(user.program, root);
      return null;
    }
    return sessionOf(user);
  }

  /* ——— Require no auth (redirect to the student's dashboard if already logged in) ———
     Returns the session when the student still has to choose a new password. */
  async function requireGuest(root = '') {
    const user = await loadSession();
    if (user && !user.mustChangePassword) {
      window.location.href = homeFor(user.program, root);
      return null;
    }
    return sessionOf(user);
  }

  /* ——— The signed-in student's full account and progress ——— */
  function getUser(userId) {
    return currentUser && currentUser.userId === userId ? currentUser : null;
  }

  /* ——— Quiz submission: graded on the server ———
     Returns { ok, passed, score, correctCount, total, results, correctAnswers,
               evidence, topicBadgeEarned, masterBadgeEarned } */
  async function submitQuiz(labKey, answers, outputLog) {
    const r = await api('labs/submit', { method: 'POST', body: { labKey, answers, outputLog } });
    if (r.ok) currentUser = r.user;
    return r;
  }

  /* ——— Admin ——— */
  function adminListUsers() {
    return api('admin/users');
  }

  function adminAction(action, userId, extra = {}) {
    return api('admin/users', { method: 'POST', body: { action, userId, ...extra } });
  }

  return {
    PROGRAMS, homeFor, register, login, logout, changePassword,
    loadSession, getCurrentSession, requireAuth, requireGuest, getUser,
    submitQuiz, adminListUsers, adminAction,
  };
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
