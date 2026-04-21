// ════════════════════════════════════════════
//  Smart Medicine Manager — script.js
// ════════════════════════════════════════════

const SK         = 'smm_v2';
const SK_HISTORY = 'smm_history'; // { "YYYY-MM-DD": { "MedName|Slot": true } }

let editIdx = null, delIdx = null;

// ── Storage helpers ──
function load()        { try { return JSON.parse(localStorage.getItem(SK) || '[]') }        catch { return [] } }
function save(d)       { localStorage.setItem(SK, JSON.stringify(d)) }
function loadHistory() { try { return JSON.parse(localStorage.getItem(SK_HISTORY) || '{}') } catch { return {} } }
function saveHistory(h){ localStorage.setItem(SK_HISTORY, JSON.stringify(h)) }

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ── Toast ──
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

// ── Slot label toggle (visual checked state) ──
function toggleSlotLabel(cb) {
  cb.closest('.slot-label').classList.toggle('checked', cb.checked);
}

// ── Greeting ──
function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('dash-greeting');
  if (el) el.textContent = g;
}

// ════════════════════════════════════════════
// Navigation
// ════════════════════════════════════════════
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  const map = { dashboard: 0, all: 1, add: 2, search: 3, today: 4, stats: 5 };
  const items = document.querySelectorAll('.nav-item');
  if (items[map[id]]) items[map[id]].classList.add('active');

  if (id === 'dashboard') renderDash();
  if (id === 'all')       renderAll();
  if (id === 'today')     renderToday();
  if (id === 'stats')     renderStats();
}

// ════════════════════════════════════════════
// Medicine Cards
// ════════════════════════════════════════════
function card(m, i) {
  const slotPills = (m.slots || []).map(s => `<span class="pill pill-slot">${esc(s)}</span>`).join('');
  return `<div class="card">
    <div class="card-top">
      <div class="card-avatar">
        <svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <div class="card-actions">
        <button class="icn" onclick="openEdit(${i})" title="Edit">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icn del" onclick="openDel(${i})" title="Delete">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg>
        </button>
      </div>
    </div>
    <div class="card-name">${esc(m.name)}</div>
    <div class="card-reason">${esc(m.reason)}</div>
    <div class="card-pills">
      <span class="pill pill-mint">${esc(m.dosage)}</span>
      <span class="pill pill-gold">${esc(m.duration)} days</span>
      <span class="pill pill-lav">${esc(m.frequency)}</span>
      ${slotPills}
    </div>
    ${m.notes ? `<div class="card-notes">${esc(m.notes)}</div>` : ''}
  </div>`;
}

function emptyState(msg, sub) {
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
    <h3>${msg}</h3><p>${sub}</p>
  </div>`;
}

function updateSideCount() {
  const el = document.getElementById('total-count');
  if (el) el.textContent = load().length;
}

// ════════════════════════════════════════════
// Dashboard
// ════════════════════════════════════════════
function renderDash() {
  setGreeting();
  const d = load();
  const h = loadHistory();
  const today = todayKey();
  const todayH = h[today] || {};

  // count taken & total slots
  let totalSlots = 0, takenCount = 0;
  d.forEach(m => {
    const slots = m.slots && m.slots.length ? m.slots : [];
    slots.forEach(slot => {
      totalSlots++;
      if (todayH[`${m.name}|${slot}`]) takenCount++;
    });
  });
  const missedCount = Math.max(0, totalSlots - takenCount);

  document.getElementById('ds-total').textContent   = d.length;
  document.getElementById('ds-reasons').textContent = new Set(d.map(m => m.reason.toLowerCase())).size;
  document.getElementById('ds-taken').textContent   = takenCount;
  document.getElementById('ds-taken-sub').textContent = `of ${totalSlots} doses`;
  document.getElementById('ds-missed').textContent  = missedCount;

  // alert banner for pending medicines
  const alertEl = document.getElementById('dash-alert');
  if (alertEl) {
    if (missedCount > 0 && totalSlots > 0) {
      alertEl.innerHTML = `<div class="alert-banner">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        You have <strong>&nbsp;${missedCount} pending dose${missedCount > 1 ? 's' : ''}&nbsp;</strong> for today.
        <button onclick="showPanel('today')" style="margin-left:auto;font-size:12px;color:#b87400;background:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:500">View →</button>
      </div>`;
    } else {
      alertEl.innerHTML = '';
    }
  }

  const recent = d.slice(-4).reverse();
  document.getElementById('recent-grid').innerHTML = recent.length
    ? recent.map((m, i) => card(m, d.length - 1 - (recent.length - 1 - i))).join('')
    : emptyState('No medicines yet', 'Add your first medicine to get started');
  updateSideCount();
}

// ════════════════════════════════════════════
// All Medicines
// ════════════════════════════════════════════
function renderAll() {
  const d = load();
  document.getElementById('all-count-label').textContent =
    `${d.length} medicine${d.length !== 1 ? 's' : ''} in cabinet`;
  document.getElementById('all-grid').innerHTML = d.length
    ? d.map((m, i) => card(m, i)).join('')
    : emptyState('Cabinet is empty', 'Click "Add medicine" to get started');
  updateSideCount();
}

// ════════════════════════════════════════════
// Search
// ════════════════════════════════════════════
function doSearch() {
  const q  = document.getElementById('search-q').value.trim().toLowerCase();
  const sp = document.getElementById('search-prompt');
  const se = document.getElementById('search-empty');
  const sg = document.getElementById('search-grid');
  if (!q) { sp.style.display = ''; se.style.display = 'none'; sg.innerHTML = ''; return; }
  sp.style.display = 'none';
  const d = load();
  const res = d.map((m, i) => ({ m, i })).filter(({ m }) =>
    Object.values(m).some(v => String(v).toLowerCase().includes(q))
  );
  if (!res.length) { se.style.display = ''; sg.innerHTML = ''; return; }
  se.style.display = 'none';
  sg.innerHTML = res.map(({ m, i }) => card(m, i)).join('');
}

// ════════════════════════════════════════════
// TODAY'S DOSES
// ════════════════════════════════════════════
const SLOTS = [
  { name: 'Morning',   time: '8:00 AM',  hour: 8  },
  { name: 'Afternoon', time: '1:00 PM',  hour: 13 },
  { name: 'Night',     time: '9:00 PM',  hour: 21 },
];

function renderToday() {
  const d       = load();
  const h       = loadHistory();
  const today   = todayKey();
  if (!h[today]) h[today] = {};
  const todayH  = h[today];
  const now     = new Date();
  const nowHour = now.getHours();

  // set date label
  const dateLabel = document.getElementById('today-date-label');
  if (dateLabel) {
    dateLabel.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  const container = document.getElementById('today-content');
  if (!container) return;

  // compute totals
  let totalSlots = 0, takenCount = 0;
  d.forEach(m => {
    (m.slots || []).forEach(slot => {
      totalSlots++;
      if (todayH[`${m.name}|${slot}`]) takenCount++;
    });
  });
  const pct = totalSlots ? Math.round((takenCount / totalSlots) * 100) : 0;
  const fillColor = pct === 100 ? '#00c896' : pct >= 50 ? '#f5a623' : '#ff6b6b';

  let html = '';

  // progress bar
  html += `<div class="today-progress">
    <div class="prog-header">
      <span class="prog-title">Today's adherence</span>
      <span class="prog-count">${takenCount} of ${totalSlots} doses taken</span>
    </div>
    <div class="prog-bar">
      <div class="prog-fill" style="width:${pct}%;background:${fillColor}"></div>
    </div>
    <div class="prog-pct">${pct}% complete</div>
  </div>`;

  let anySlotHasMeds = false;

  // render each slot
  SLOTS.forEach(slot => {
    const medsInSlot = d.filter(m => (m.slots || []).includes(slot.name));
    if (!medsInSlot.length) return;
    anySlotHasMeds = true;
    const isPast = nowHour > slot.hour;

    html += `<div class="slot-section">
      <div class="slot-head">
        <span class="slot-head-label">${slot.name}</span>
        <span class="slot-head-time">${slot.time}</span>
        <div class="slot-head-line"></div>
      </div>`;

    medsInSlot.forEach(m => {
      const key    = `${m.name}|${slot.name}`;
      const taken  = !!todayH[key];
      const missed = isPast && !taken;
      let badgeHtml = taken
        ? `<span class="today-badge badge-taken">✓ Taken</span>`
        : missed
          ? `<span class="today-badge badge-missed">✗ Missed</span>`
          : `<span class="today-badge badge-pending">Pending</span>`;

      html += `<div class="today-card ${taken ? 'taken' : missed ? 'missed' : ''}">
        <input type="checkbox" class="today-checkbox"
          ${taken ? 'checked' : ''}
          onchange="toggleTaken('${esc(m.name)}', '${slot.name}', this.checked)"
          title="Mark as taken"/>
        <div class="today-info">
          <div class="today-name">${esc(m.name)}</div>
          <div class="today-detail">${esc(m.dosage)} &nbsp;·&nbsp; ${esc(m.reason)}</div>
        </div>
        ${badgeHtml}
      </div>`;
    });

    html += `</div>`;
  });

  // medicines with no slots
  const noSlotMeds = d.filter(m => !m.slots || m.slots.length === 0);
  if (noSlotMeds.length) {
    anySlotHasMeds = true;
    html += `<div class="slot-section">
      <div class="slot-head">
        <span class="slot-head-label">No slot assigned</span>
        <div class="slot-head-line"></div>
      </div>`;
    noSlotMeds.forEach(m => {
      html += `<div class="today-card" style="border-style:dashed;opacity:.7">
        <div class="today-info">
          <div class="today-name">${esc(m.name)}</div>
          <div class="today-detail">${esc(m.dosage)} · no reminder slot set — <button onclick="openEdit(${d.indexOf(m)})" style="font-size:11px;color:var(--mint);background:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif">add slot</button></div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  if (!anySlotHasMeds && !noSlotMeds.length) {
    html += emptyState('No medicines added yet', 'Add medicines and assign reminder slots to track them here');
  }

  container.innerHTML = html;
}

function toggleTaken(medName, slot, checked) {
  const h     = loadHistory();
  const today = todayKey();
  if (!h[today]) h[today] = {};
  h[today][`${medName}|${slot}`] = checked;
  saveHistory(h);
  renderToday();
  renderDash();
  toast(checked ? `${medName} marked as taken ✓` : `${medName} unmarked`);
}

// ════════════════════════════════════════════
// STATISTICS
// ════════════════════════════════════════════
function renderStats() {
  const container = document.getElementById('stats-content');
  if (!container) return;

  const d     = load();
  const h     = loadHistory();
  const today = todayKey();

  // build last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    days.push(dt.toISOString().slice(0, 10));
  }

  const totalSlots = d.reduce((acc, m) => acc + (m.slots || []).length, 0);

  const takenArr  = [];
  const missedArr = [];

  days.forEach(dk => {
    const dayH  = h[dk] || {};
    const taken = Object.values(dayH).filter(Boolean).length;
    takenArr.push(taken);
    missedArr.push(Math.max(0, totalSlots - taken));
  });

  const avgTaken    = takenArr.length ? (takenArr.reduce((a,b) => a+b, 0) / takenArr.length).toFixed(1) : 0;
  const bestDay     = Math.max(...takenArr, 0);
  const streak      = calcStreak(days, h, totalSlots);
  const todayTaken  = takenArr[takenArr.length - 1] || 0;

  container.innerHTML = `
    <div class="stats-meta">
      <div class="meta-card">
        <div class="meta-label">Avg doses/day</div>
        <div class="meta-val">${avgTaken}</div>
        <div class="meta-sub">last 14 days</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Best day</div>
        <div class="meta-val">${bestDay}<span style="font-size:14px;font-weight:400;color:var(--ink3)">/${totalSlots}</span></div>
        <div class="meta-sub">doses in a day</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Current streak</div>
        <div class="meta-val">${streak}<span style="font-size:14px;font-weight:400;color:var(--ink3)">d</span></div>
        <div class="meta-sub">days in a row</div>
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-title">14-day adherence — taken vs missed</div>
      <canvas id="adherence-canvas" height="200" style="width:100%"></canvas>
      <div class="chart-legend">
        <div class="leg-item"><div class="leg-dot" style="background:#00c896"></div> Taken</div>
        <div class="leg-item"><div class="leg-dot" style="background:#ff6b6b"></div> Missed</div>
      </div>
    </div>
    <div class="breakdown-list">
      <div class="breakdown-title">Daily breakdown</div>
      <div id="bd-rows"></div>
    </div>
  `;

  drawBarChart(days, takenArr, missedArr, totalSlots);
  renderBreakdown(days, takenArr, totalSlots, today);
}

function calcStreak(days, h, totalSlots) {
  if (!totalSlots) return 0;
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const dayH  = h[days[i]] || {};
    const taken = Object.values(dayH).filter(Boolean).length;
    if (taken >= totalSlots) streak++;
    else break;
  }
  return streak;
}

function drawBarChart(days, takenArr, missedArr, totalSlots) {
  const canvas = document.getElementById('adherence-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.parentElement.clientWidth - 40 || 620;
  const H   = 200;
  canvas.width  = W;
  canvas.height = H;

  const pad  = { top: 12, bottom: 32, left: 28, right: 12 };
  const cW   = W - pad.left - pad.right;
  const cH   = H - pad.top - pad.bottom;
  const n    = days.length;
  const grpW = cW / n;
  const bW   = Math.min(16, grpW * 0.32);
  const maxV = Math.max(totalSlots, 1);

  ctx.clearRect(0, 0, W, H);

  // grid
  [0, 0.25, 0.5, 0.75, 1].forEach(pct => {
    const y = pad.top + cH * (1 - pct);
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle   = '#aab0c0';
    ctx.font        = '9px sans-serif';
    ctx.fillText(Math.round(maxV * pct), 2, y + 3);
  });

  days.forEach((dk, i) => {
    const cx = pad.left + i * grpW + grpW / 2;

    // taken bar
    const tH = (takenArr[i] / maxV) * cH;
    ctx.fillStyle = '#00c896';
    ctx.fillRect(cx - bW - 2, pad.top + cH - tH, bW, tH || 2);

    // missed bar
    const mH = (missedArr[i] / maxV) * cH;
    ctx.fillStyle = missedArr[i] > 0 ? '#ff6b6b' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(cx + 2, pad.top + cH - mH, bW, mH || 2);

    // x-label — show every other on small widths
    if (i % 2 === 0 || n <= 10) {
      const dt = new Date(dk);
      const lbl = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      ctx.fillStyle   = '#8888a8';
      ctx.font        = '9px sans-serif';
      ctx.textAlign   = 'center';
      ctx.fillText(lbl, cx, H - 6);
    }
  });
}

function renderBreakdown(days, takenArr, totalSlots, today) {
  const container = document.getElementById('bd-rows');
  if (!container) return;

  container.innerHTML = days.slice().reverse().map((dk, ri) => {
    const i      = days.length - 1 - ri;
    const taken  = takenArr[i];
    const pct    = totalSlots ? Math.round((taken / totalSlots) * 100) : 0;
    const isToday = dk === today;
    const color  = pct === 100 ? '#00c896' : pct >= 50 ? '#f5a623' : pct > 0 ? '#ff6b6b' : '#cccccc';
    const dt     = new Date(dk);
    const lbl    = dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    return `<div class="bd-row">
      <span class="bd-date">
        ${isToday ? '<span class="bd-today-tag">Today</span>' : lbl}
      </span>
      <div class="bd-bar-track">
        <div class="bd-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="bd-pct" style="color:${color}">${taken}/${totalSlots}</span>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotif(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

function checkAlerts() {
  const d      = load();
  const h      = loadHistory();
  const today  = todayKey();
  const todayH = h[today] || {};
  const now    = new Date();
  const hr     = now.getHours();
  const mn     = now.getMinutes();

  SLOTS.forEach(slot => {
    // fire within a 2-minute window of slot time
    if (hr === slot.hour && mn >= 0 && mn <= 2) {
      const pending = d.filter(m => {
        const key = `${m.name}|${slot.name}`;
        return (m.slots || []).includes(slot.name) && !todayH[key];
      });
      if (pending.length) {
        sendNotif(
          `💊 ${slot.name} medicines due`,
          pending.map(m => m.name).join(', ')
        );
      }
    }
  });

  // missed medicine summary at 11 PM
  if (hr === 23 && mn === 0) {
    const missed = [];
    d.forEach(m => {
      (m.slots || []).forEach(slot => {
        if (!todayH[`${m.name}|${slot}`]) missed.push(`${m.name} (${slot})`);
      });
    });
    if (missed.length) {
      sendNotif('⚠️ Missed medicines today', missed.join(', '));
    }
  }
}

setInterval(checkAlerts, 60000);

// ════════════════════════════════════════════
// Add / Edit / Delete
// ════════════════════════════════════════════
async function saveMed() {
  const medName   = document.getElementById('f-name').value.trim();
  const reason    = document.getElementById('f-reason').value.trim();
  const dosage    = document.getElementById('f-dosage').value.trim();
  const duration  = document.getElementById('f-dur').value.trim();
  const frequency = document.getElementById('f-freq').value.trim();
  const notes     = document.getElementById('f-notes').value.trim();
  const slots     = Array.from(document.querySelectorAll('.slot-cb:checked')).map(cb => cb.value);

  if (!medName || !reason || !dosage || !duration || !frequency) {
    toast('Please fill in all required fields', 'err');
    return;
  }

  const warnings  = await checkWarning(medName);
  const hasIssues = warnings.some(w => w.startsWith('⚠️'));
  if (hasIssues) {
    const proceed = confirm(warnings.join('\n') + '\n\nDo you still want to save?');
    if (!proceed) return;
  }

  const d = load();
  d.push({ name: medName, reason, dosage, duration, frequency, notes, slots });
  save(d);
  clearForm();
  toast('Medicine saved!');
  showPanel('dashboard');
}

function clearForm() {
  ['f-name','f-reason','f-dosage','f-dur','f-freq','f-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('.slot-cb').forEach(cb => {
    cb.checked = false;
    cb.closest('.slot-label').classList.remove('checked');
  });
}

function openEdit(i) {
  const m = load()[i];
  editIdx = i;
  document.getElementById('e-name').value    = m.name;
  document.getElementById('e-reason').value  = m.reason;
  document.getElementById('e-dosage').value  = m.dosage;
  document.getElementById('e-dur').value     = m.duration;
  document.getElementById('e-freq').value    = m.frequency;
  document.getElementById('e-notes').value   = m.notes || '';
  document.querySelectorAll('.edit-slot-cb').forEach(cb => {
    cb.checked = (m.slots || []).includes(cb.value);
    cb.closest('.slot-label').classList.toggle('checked', cb.checked);
  });
  document.getElementById('edit-overlay').classList.add('open');
}

function saveEdit() {
  const name      = document.getElementById('e-name').value.trim();
  const reason    = document.getElementById('e-reason').value.trim();
  const dosage    = document.getElementById('e-dosage').value.trim();
  const duration  = document.getElementById('e-dur').value.trim();
  const frequency = document.getElementById('e-freq').value.trim();
  const notes     = document.getElementById('e-notes').value.trim();
  const slots     = Array.from(document.querySelectorAll('.edit-slot-cb:checked')).map(cb => cb.value);
  if (!name || !reason || !dosage || !duration || !frequency) { toast('Fill all fields', 'err'); return; }
  const d = load();
  d[editIdx] = { name, reason, dosage, duration, frequency, notes, slots };
  save(d);
  closeOverlay('edit-overlay');
  toast('Updated!');
  renderDash(); renderAll();
  if (document.getElementById('search-q').value) doSearch();
}

function openDel(i) {
  delIdx = i;
  document.getElementById('del-name').textContent = load()[i].name;
  document.getElementById('del-overlay').classList.add('open');
}

function confirmDel() {
  const d = load();
  d.splice(delIdx, 1);
  save(d);
  closeOverlay('del-overlay');
  toast('Deleted', 'ok');
  renderDash(); renderAll();
  if (document.getElementById('search-q').value) doSearch();
}

function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

document.getElementById('edit-overlay').addEventListener('click', e => {
  if (e.target.id === 'edit-overlay') closeOverlay('edit-overlay');
});
document.getElementById('del-overlay').addEventListener('click', e => {
  if (e.target.id === 'del-overlay') closeOverlay('del-overlay');
});

// ════════════════════════════════════════════
// AI Features (Flask backend)
// ════════════════════════════════════════════
async function getMedicineInfo(medName) {
  try {
    const res  = await fetch('http://127.0.0.1:5000/medicine-info', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: medName })
    });
    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  } catch {
    alert('Could not fetch medicine info. Is the Flask server running?');
  }
}

async function checkWarning(medName) {
  const meds = load().map(m => m.name);
  try {
    const res  = await fetch('http://127.0.0.1:5000/check-warning', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_med: medName, existing_meds: meds })
    });
    const data = await res.json();
    return data.warnings;
  } catch {
    return ['⚠️ Warning system unavailable (server offline)'];
  }
}

async function getSuggestion(problem) {
  try {
    const res  = await fetch('http://127.0.0.1:5000/suggest', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem })
    });
    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  } catch {
    alert('Could not fetch suggestion. Is the Flask server running?');
  }
}

// ── Init ──
requestNotifPermission();
renderDash();
