const SK = 'smm_v2';
let editIdx = null, delIdx = null;

function load() { try { return JSON.parse(localStorage.getItem(SK) || '[]') } catch { return [] } }
function save(d) { localStorage.setItem(SK, JSON.stringify(d)) }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function toast(msg, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  const map = { dashboard: 0, all: 1, search: 2, add: 3 };
  document.querySelectorAll('.nav-item')[map[id]].classList.add('active');
  if (id === 'dashboard') renderDash();
  if (id === 'all') renderAll();
}

function card(m, i) {
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
      <span class="pill pill-lav">${esc(m.frequency)}/day</span>
    </div>
    ${m.notes ? `<div class="card-notes">${esc(m.notes)}</div>` : ''}
  </div>`;
}

function emptyState(msg, sub) {
  return `<div class="empty-state" style="grid-column:1/-1">
    <svg viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
    <h3>${msg}</h3><p>${sub}</p>
  </div>`;
}

function updateSideCount() {
  document.getElementById('total-count').textContent = load().length;
}

function renderDash() {
  const d = load();
  document.getElementById('ds-total').textContent = d.length;
  document.getElementById('ds-reasons').textContent = new Set(d.map(m => m.reason.toLowerCase())).size;
  document.getElementById('ds-notes').textContent = d.filter(m => m.notes && m.notes.trim()).length;
  const recent = d.slice(-4).reverse();
  document.getElementById('recent-grid').innerHTML = recent.length
    ? recent.map((m, i) => card(m, d.length - 1 - (recent.length - 1 - i))).join('')
    : emptyState('No medicines yet', 'Add your first one above');
  updateSideCount();
}

function renderAll() {
  const d = load();
  document.getElementById('all-count-label').textContent = `${d.length} medicine${d.length !== 1 ? 's' : ''} in cabinet`;
  document.getElementById('all-grid').innerHTML = d.length
    ? d.map((m, i) => card(m, i)).join('')
    : emptyState('Cabinet is empty', 'Click "Add medicine" to get started');
  updateSideCount();
}

function doSearch() {
  const q = document.getElementById('search-q').value.trim().toLowerCase();
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

function saveMed() {
  const name = document.getElementById('f-name').value.trim();
  const reason = document.getElementById('f-reason').value.trim();
  const dosage = document.getElementById('f-dosage').value.trim();
  const duration = document.getElementById('f-dur').value.trim();
  const frequency = document.getElementById('f-freq').value.trim();
  const notes = document.getElementById('f-notes').value.trim();
  if (!name || !reason || !dosage || !duration || !frequency) { toast('Please fill in all required fields', 'err'); return; }
  const d = load();
  d.push({ name, reason, dosage, duration, frequency, notes });
  save(d); clearForm(); toast('Medicine saved!'); showPanel('dashboard');
}

function clearForm() {
  ['f-name','f-reason','f-dosage','f-dur','f-freq','f-notes'].forEach(id => document.getElementById(id).value = '');
}

function openEdit(i) {
  const m = load()[i]; editIdx = i;
  document.getElementById('e-name').value = m.name;
  document.getElementById('e-reason').value = m.reason;
  document.getElementById('e-dosage').value = m.dosage;
  document.getElementById('e-dur').value = m.duration;
  document.getElementById('e-freq').value = m.frequency;
  document.getElementById('e-notes').value = m.notes || '';
  document.getElementById('edit-overlay').classList.add('open');
}

function saveEdit() {
  const name = document.getElementById('e-name').value.trim();
  const reason = document.getElementById('e-reason').value.trim();
  const dosage = document.getElementById('e-dosage').value.trim();
  const duration = document.getElementById('e-dur').value.trim();
  const frequency = document.getElementById('e-freq').value.trim();
  const notes = document.getElementById('e-notes').value.trim();
  if (!name || !reason || !dosage || !duration || !frequency) { toast('Fill all fields', 'err'); return; }
  const d = load(); d[editIdx] = { name, reason, dosage, duration, frequency, notes }; save(d);
  closeOverlay('edit-overlay'); toast('Updated!'); renderDash(); renderAll();
  if (document.getElementById('search-q').value) doSearch();
}

function openDel(i) {
  delIdx = i;
  document.getElementById('del-name').textContent = load()[i].name;
  document.getElementById('del-overlay').classList.add('open');
}

function confirmDel() {
  const d = load(); d.splice(delIdx, 1); save(d);
  closeOverlay('del-overlay'); toast('Deleted', 'ok'); renderDash(); renderAll();
  if (document.getElementById('search-q').value) doSearch();
}

function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

document.getElementById('edit-overlay').addEventListener('click', e => { if (e.target.id === 'edit-overlay') closeOverlay('edit-overlay'); });
document.getElementById('del-overlay').addEventListener('click', e => { if (e.target.id === 'del-overlay') closeOverlay('del-overlay'); });

renderDash();