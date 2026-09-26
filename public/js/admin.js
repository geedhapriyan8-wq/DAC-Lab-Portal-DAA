/* ============================================================
   DAC Lab Portal — Admin page (admin.js)
   Lists every student with their progress, and lets an admin change a
   student's programme, reset their password or delete their account.
   Admins are the User IDs listed in the ADMIN_USER_IDS setting on Vercel.
   ============================================================ */

async function initAdmin() {
  const session = await Auth.requireAuth(null);
  if (!session) return;
  if (!session.isAdmin) { window.location.href = Auth.homeFor(session.program); return; }

  document.getElementById('admin-self').textContent = `@${session.userId}`;
  document.getElementById('my-dashboard-link').href = Auth.homeFor(session.program);
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await Auth.logout();
    window.location.href = 'index.html';
  });

  const body   = document.getElementById('students-body');
  const search = document.getElementById('search');
  const filter = document.getElementById('program-filter');
  let students = [];
  const expanded = new Set();

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const TOPIC_INFO = {
    dsa: Object.fromEntries(Progress.TOPICS.map(t => [t.id, t])),
    daa: Object.fromEntries(DAAProgress.TOPICS.map(t => [t.id, t])),
  };
  let curriculum = { dsa: {}, daa: {} };

  function timeAgo(isoString) {
    if (!isoString) return '<span class="muted">Never</span>';
    const mins = Math.round((Date.now() - new Date(isoString)) / 60000);
    const label = mins < 2 ? 'Just now'
      : mins < 60 ? `${mins} min ago`
      : mins < 60 * 24 ? `${Math.round(mins / 60)} h ago`
      : `${Math.round(mins / 1440)} days ago`;
    return `<span title="${esc(new Date(isoString).toLocaleString())}">${label}</span>`;
  }

  /* ——— Load ——— */
  async function load() {
    const r = await Auth.adminListUsers();
    if (!r.ok) {
      body.innerHTML = `<tr><td colspan="6" class="empty-state">${esc(r.message)}</td></tr>`;
      return;
    }
    students   = r.users;
    curriculum = r.curriculum;
    render();
  }

  /* ——— Render ——— */
  function detailHtml(s) {
    const done = Object.fromEntries(s.completions.map(c => [c.labKey, c]));
    const topics = Object.entries(curriculum[s.program]).map(([topicId, labs]) => {
      const info = TOPIC_INFO[s.program][topicId];
      const labLines = labs.map(n => {
        const c = done[`${topicId}_lab${n}`];
        return c
          ? `<div class="detail-lab done">✓ Lab ${n} · ${c.quizScore}% · ${esc(new Date(c.completedAt).toLocaleDateString())}</div>`
          : `<div class="detail-lab">○ Lab ${n} · not completed</div>`;
      }).join('');
      return `<div class="detail-topic"><strong>${info ? `${info.icon} ${esc(info.name)}` : esc(topicId)}</strong>${labLines}</div>`;
    }).join('');
    const other = s.completions.filter(c => !c.labKey.startsWith(s.program === 'daa' ? 'daa-' : 'topic-')).length;
    const note = other ? `<p class="muted" style="margin:var(--space-3) 0 0;font-size:0.8rem">Also has ${other} completed lab(s) from the other programme, kept in case they move back.</p>` : '';
    return `<tr class="detail-row"><td colspan="6"><div class="detail-grid">${topics}</div>${note}</td></tr>`;
  }

  function rowHtml(s) {
    const pct = s.totalLabs ? Math.round((s.labsDone / s.totalLabs) * 100) : 0;
    const isSelf = s.userId === session.userId;
    return `
      <tr data-user="${esc(s.userId)}">
        <td data-label="Student">
          <div class="student-name">${esc(s.displayName)}${s.isAdmin ? '<span class="chip chip-admin">ADMIN</span>' : ''}${s.mustChangePassword ? '<span class="chip chip-warn" title="Must choose a new password at next sign-in">TEMP PASSWORD</span>' : ''}</div>
          <div class="student-id">@${esc(s.userId)}</div>
        </td>
        <td data-label="Programme">
          <select class="program-select" data-action="set-program" aria-label="Programme for ${esc(s.userId)}">
            <option value="dsa" ${s.program === 'dsa' ? 'selected' : ''}>DSA</option>
            <option value="daa" ${s.program === 'daa' ? 'selected' : ''}>DAA</option>
          </select>
        </td>
        <td data-label="Progress">
          <div class="mini-progress">
            <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
            <span>${s.labsDone}/${s.totalLabs} labs</span>
          </div>
        </td>
        <td data-label="Badges">${s.badges.length}${s.masterBadge ? ' · 🏆' : ''}</td>
        <td data-label="Last active">${timeAgo(s.lastActiveAt)}</td>
        <td data-label="Actions">
          <div class="row-actions">
            <button class="btn btn-secondary" type="button" data-action="toggle">${expanded.has(s.userId) ? 'Hide' : 'View'} progress</button>
            ${isSelf ? '' : `
            <button class="btn btn-secondary" type="button" data-action="reset-password">Reset password</button>
            <button class="btn btn-danger" type="button" data-action="delete">Delete</button>`}
          </div>
        </td>
      </tr>
      ${expanded.has(s.userId) ? detailHtml(s) : ''}`;
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const p = filter.value;
    const shown = students.filter(s =>
      (!p || s.program === p) &&
      (!q || s.userId.includes(q) || s.displayName.toLowerCase().includes(q)));

    document.getElementById('stat-total').textContent  = students.length;
    document.getElementById('stat-dsa').textContent    = students.filter(s => s.program === 'dsa').length;
    document.getElementById('stat-daa').textContent    = students.filter(s => s.program === 'daa').length;
    document.getElementById('stat-master').textContent = students.filter(s => s.masterBadge).length;

    body.innerHTML = shown.length
      ? shown.map(rowHtml).join('')
      : `<tr><td colspan="6" class="empty-state">${students.length ? 'No students match your search.' : 'No students have registered yet.'}</td></tr>`;
  }

  function replaceStudent(updated) {
    students = students.map(s => (s.userId === updated.userId ? updated : s));
    render();
  }

  /* ——— Dialogs ——— */
  const confirmDialog = document.getElementById('confirm-dialog');
  function confirmAction({ title, text, okLabel, danger = false, typeToConfirm = null }) {
    return new Promise(resolve => {
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-text').textContent  = text;
      const okBtn = document.getElementById('confirm-ok');
      okBtn.textContent = okLabel;
      okBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
      const typeGroup = document.getElementById('confirm-type-group');
      const typeInput = document.getElementById('confirm-type-input');
      typeGroup.style.display = typeToConfirm ? '' : 'none';
      typeInput.value = '';
      document.getElementById('confirm-type-label').textContent = typeToConfirm ? `Type ${typeToConfirm} to confirm` : '';
      okBtn.disabled = !!typeToConfirm;
      typeInput.oninput = () => { okBtn.disabled = typeInput.value.trim().toLowerCase() !== typeToConfirm; };

      const finish = value => { confirmDialog.close(); resolve(value); };
      okBtn.onclick = () => finish(true);
      document.getElementById('confirm-cancel').onclick = () => finish(false);
      confirmDialog.oncancel = () => resolve(false);
      confirmDialog.showModal();
      (typeToConfirm ? typeInput : okBtn).focus();
    });
  }

  const tempDialog = document.getElementById('temp-password-dialog');
  document.getElementById('close-temp-btn').addEventListener('click', () => tempDialog.close());
  document.getElementById('copy-temp-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById('temp-password-value').textContent);
      UI.showToast({ type: 'success', title: 'Copied', message: 'Temporary password copied.' });
    } catch {
      UI.showToast({ type: 'warning', title: 'Copy failed', message: 'Select the password and copy it manually.' });
    }
  });

  /* ——— Actions ——— */
  body.addEventListener('change', async e => {
    const select = e.target.closest('select[data-action="set-program"]');
    if (!select) return;
    const userId = select.closest('tr').dataset.user;
    const s = students.find(x => x.userId === userId);
    const name = select.value === 'daa' ? 'Data Analytics Academy (DAA)' : 'DSA';
    const ok = await confirmAction({
      title: 'Change programme?',
      text: `Move ${s.displayName} (@${userId}) to ${name}? They'll see the ${select.value.toUpperCase()} dashboard next time a page loads. Progress in the old programme is kept.`,
      okLabel: 'Change programme',
    });
    if (!ok) { select.value = s.program; return; }
    const r = await Auth.adminAction('set-program', userId, { program: select.value });
    if (!r.ok) { select.value = s.program; UI.showToast({ type: 'error', title: 'Not changed', message: r.message }); return; }
    UI.showToast({ type: 'success', title: 'Programme changed', message: r.message });
    replaceStudent(r.user);
  });

  body.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const userId = btn.closest('tr').dataset.user;
    const s = students.find(x => x.userId === userId);

    if (btn.dataset.action === 'toggle') {
      expanded.has(userId) ? expanded.delete(userId) : expanded.add(userId);
      render();
      return;
    }

    if (btn.dataset.action === 'reset-password') {
      const ok = await confirmAction({
        title: 'Reset password?',
        text: `${s.displayName} (@${userId}) will be signed out everywhere and given a temporary password. They must choose a new one when they next sign in.`,
        okLabel: 'Reset password',
      });
      if (!ok) return;
      const r = await Auth.adminAction('reset-password', userId);
      if (!r.ok) { UI.showToast({ type: 'error', title: 'Not reset', message: r.message }); return; }
      document.getElementById('temp-password-for').textContent = `For ${s.displayName} (@${userId})`;
      document.getElementById('temp-password-value').textContent = r.tempPassword;
      tempDialog.showModal();
      replaceStudent(r.user);
      return;
    }

    if (btn.dataset.action === 'delete') {
      const ok = await confirmAction({
        title: 'Delete account?',
        text: `This permanently deletes ${s.displayName} (@${userId}) and all their lab progress, badges and certificates. It can't be undone.`,
        okLabel: 'Delete permanently',
        danger: true,
        typeToConfirm: userId,
      });
      if (!ok) return;
      const r = await Auth.adminAction('delete', userId);
      if (!r.ok) { UI.showToast({ type: 'error', title: 'Not deleted', message: r.message }); return; }
      UI.showToast({ type: 'success', title: 'Account deleted', message: r.message });
      students = students.filter(x => x.userId !== userId);
      expanded.delete(userId);
      render();
    }
  });

  search.addEventListener('input', render);
  filter.addEventListener('change', render);
  document.getElementById('refresh-btn').addEventListener('click', load);

  await load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
