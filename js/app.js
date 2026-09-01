// app.js — Entry point app, update UI, inbox, stats, navigasi halaman, stor submit, tombol/gesture kembali HP

// ============================================================
// VARIABEL TAMBAHAN UNTUK STOR BEKAS
// ============================================================
let depositBekasStatus = 'OPEN';
let storCardsInitialized = false;

// ============================================================
// APP ENTRY
// ============================================================
function enterApp() {
  const authPage = safeGet('authPage');
  const appPage = safeGet('appPage');
  if (authPage) authPage.classList.add('hide');
  if (appPage) appPage.classList.add('show');
  document.documentElement.classList.add('locked');
  document.body.classList.add('locked');
  window.scrollTo(0, 0);
  setMusicVisibility(true);
  updateUIApp();
  showPage('beranda');
}

function closeWelcomeToast() {
  const toast = safeGet('welcomeToast');
  if (toast) toast.classList.remove('show');
}

// ============================================================
// UPDATE UI
// ============================================================
function updateUIApp() {
  try {
    const user = getCurrentUser();
    if (!user) return;
    const headerAvatar = safeGet('headerAvatar');
    if (headerAvatar) {
      const av = buildAvatarVisual(user);
      headerAvatar.innerHTML = av.contentHtml;
      headerAvatar.setAttribute('style', av.styleAttr);
      headerAvatar.className = 'user-avatar' + buildFrameClass(user);
    }
    const headerName = safeGet('headerName');
    if (headerName) headerName.innerHTML = escapeHtml(user.fullname || user.username) + buildVerifiedBadgeHtml(user);

    const profileDisplay = safeGet('profileAvatarDisplay');
    if (profileDisplay) {
      const av = buildAvatarVisual(user);
      if (user.avatar && typeof user.avatar === 'string' && user.avatar.indexOf('preset:') !== 0) {
        profileDisplay.innerHTML =
          `<img src="${user.avatar}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--blue-primary);box-shadow:0 0 40px var(--blue-glow);" />`;
      } else {
        profileDisplay.innerHTML = `<div class="avatar-placeholder" style="${av.styleAttr}">${av.contentHtml}</div>`;
      }
      profileDisplay.className = buildFrameClass(user).trim();
    }
    const profileName = safeGet('profileNameDisplay');
    if (profileName) profileName.innerHTML = escapeHtml(user.fullname || user.username) + buildVerifiedBadgeHtml(user);
    const profileUid = safeGet('profileUid');
    if (profileUid) {
      profileUid.textContent = getNumericId(user.id);
    }
    const profileEmail = safeGet('profileEmailPhone');
    if (profileEmail) profileEmail.textContent = sensorEmailPhone(user.emailPhone || '-');
    const editName = safeGet('editName');
    const editProfileModal = safeGet('modalEditProfile');
    const editProfileModalOpen = editProfileModal && editProfileModal.classList.contains('open');
    if (editName && !editProfileModalOpen) editName.value = user.fullname || '';

    const saldo = 'Rp' + formatRupiah(user.saldo || 0);
    const profileSaldo = safeGet('profileSaldo');
    if (profileSaldo) profileSaldo.textContent = saldo;
    const berandaSaldo = safeGet('berandaSaldo');
    if (berandaSaldo) berandaSaldo.innerHTML = '<span class="currency">Rp</span>' + formatRupiah(user.saldo || 0);

    updateInboxDot();

    renderInbox();
    renderWithdrawalList();
    renderPendapatanList();

    const tarikDisplay = safeGet('tarikSaldoDisplay');
    if (tarikDisplay) tarikDisplay.innerHTML =
      '<span style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-right:2px;">Rp</span>' +
      formatRupiah(user.saldo || 0);

    const settings = loadSettings();
    const closedMsg = safeGet('tarikClosedMsg');
    const tarikBtn = safeGet('tarikSubmitBtn');
    if (closedMsg) closedMsg.style.display = (settings.withdrawStatus !== 'OPEN') ? 'block' : 'none';
    if (tarikBtn) tarikBtn.disabled = (settings.withdrawStatus !== 'OPEN');

    const storBtn = safeGet('storSubmitBtn');
    if (storBtn) storBtn.disabled = (settings.depositStatus !== 'OPEN');
    const storClosedMsg = safeGet('storClosedMsg');
    if (storClosedMsg) {
      storClosedMsg.style.display = (settings.depositStatus !== 'OPEN') ? 'block' : 'none';
    }

    renderHistory();
    updateStats();
    updateStatsRiwayat();
    updateStatsBeranda();
    updateStatsStor();
    updateStatus();      // <-- status gabungan Fresh/Bekas
    updateHargaDisplay();

    // ===== PERBAIKAN: update kartu stor dan inisialisasi event =====
    updateStorCards();
    initStorCards();

  } catch (e) {
    console.warn('Update UI error:', e);
  }
}

function updateHargaDisplay() {
  const settings = loadSettings();
  const rate = settings.depositPrice || 4000;
  const rateStr = 'Rp ' + formatRupiah(rate) + ' / email';
  const rateDisplay = safeGet('statusRate');
  if (rateDisplay) rateDisplay.textContent = rateStr;
  const hargaBeranda = safeGet('berandaHarga');
  if (hargaBeranda) hargaBeranda.textContent = 'Rp ' + formatRupiah(rate);
  const storHarga = safeGet('storHarga');
  if (storHarga) storHarga.textContent = 'Rp ' + formatRupiah(rate);
}

function sensorEmailPhone(text) {
  if (!text || text === '-') return '-';
  if (text.includes('@')) {
    const parts = text.split('@');
    const local = parts[0];
    if (local.length <= 2) return text;
    return local[0] + '****' + local[local.length - 1] + '@' + parts[1];
  }
  if (text.length <= 4) return text;
  return text.slice(0, 2) + '****' + text.slice(-2);
}

// ============================================================
// INBOX
// ============================================================
function getReadMessageIds() {
  try {
    const stored = localStorage.getItem('readPublicMessages');
    return stored ? JSON.parse(stored) : [];
  } catch (_) { return []; }
}

function setReadMessageIds(ids) {
  try {
    localStorage.setItem('readPublicMessages', JSON.stringify(ids));
  } catch (_) {}
}

function markAllMessagesAsRead() {
  const allMsgs = appState.inbox || [];
  const ids = allMsgs.map(m => m.id || m.date).filter(Boolean);
  const current = getReadMessageIds();
  const merged = [...new Set([...current, ...ids])];
  setReadMessageIds(merged);
}

function getUnreadMessages() {
  const allMsgs = appState.inbox || [];
  const readIds = getReadMessageIds();
  return allMsgs.filter(m => {
    const id = m.id || m.date;
    return id && !readIds.includes(id);
  });
}

function renderInbox() {
  const container = safeGet('inboxContentUmum');
  if (!container) return;
  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = `<div class="inbox-empty"><i class="fas fa-envelope"></i><p>Login dulu.</p></div>`;
    return;
  }
  const allMsgs = (appState.inbox || []).filter(m => {
    if (!m.targetUserId) return true;
    return m.targetUserId === user.id;
  });

  if (allMsgs.length === 0) {
    container.innerHTML = `<div class="inbox-empty"><i class="fas fa-envelope"></i><p>Belum ada pesan.</p></div>`;
    return;
  }

  const sorted = allMsgs.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map((m, idx) => {
    const isPrivate = !!m.targetUserId;
    const privateBadge = isPrivate ? '<span style="background:rgba(43,127,255,0.10);color:var(--blue-bright);font-size:9px;padding:2px 8px;border-radius:99px;margin-left:6px;font-weight:600;">PRIVATE</span>' : '';
    return `
      <div class="inbox-msg" style="background:var(--bg-card-alt);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:8px;border:1px solid var(--border-subtle);transition:all 0.2s;display:flex;justify-content:space-between;align-items:center;" onclick="openMessageNotifByIndex(${sorted.indexOf(m)})">
        <div>
          <div style="font-weight:700;color:var(--text-primary);">${m.title||'Pesan'} ${privateBadge}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${formatTime(m.date)}</div>
        </div>
        <i class="fas fa-chevron-right" style="color:var(--text-secondary);font-size:12px;"></i>
      </div>
    `;
  }).join('');
}

function openMessageNotifByIndex(index) {
  const user = getCurrentUser();
  if (!user) { showToast('error', 'Gagal', 'Login dulu.'); return; }
  const allMsgs = (appState.inbox || []).filter(m => {
    if (!m.targetUserId) return true;
    return m.targetUserId === user.id;
  });
  const msg = allMsgs[index];
  if (!msg) return;
  const titleEl = safeGet('notifMsgTitle');
  const bodyEl = safeGet('notifMsgBody');
  const timeEl = safeGet('notifMsgTime');
  if (titleEl) titleEl.textContent = msg.title || 'Pesan';
  if (bodyEl) bodyEl.textContent = msg.content || '';
  if (timeEl) timeEl.textContent = formatTime(msg.date);
  openModal('modalMessageNotif');
}

function openInbox() {
  markAllMessagesAsRead();
  renderInbox();
  updateInboxDot();
  openModal('modalInbox');
}

async function clearInbox() {
  const user = getCurrentUser();
  if (!user) { showToast('error', 'Gagal', 'Login dulu.');
    return; }
  showLoading('Menghapus semua pesan...');
  try {
    const result = await apiRequest('clearInbox', {});
    appState.inbox = [];
    if (user) user.inbox = [];
    setReadMessageIds([]);
    updateInboxDot();
    closeModal('modalInbox');
    showToast('success', 'Berhasil', 'Semua pesan telah dihapus.');
    renderInbox();
  } catch (e) {
    showToast('error', 'Gagal', e.message);
  } finally {
    hideLoading();
  }
}

function updateInboxDot() {
  const dot = safeGet('inboxDot');
  if (!dot) return;
  const unread = getUnreadMessages();
  if (unread.length > 0) dot.classList.add('show');
  else dot.classList.remove('show');
}

// ============================================================
// STATS
// ============================================================
function updateStats() {
  const user = getCurrentUser();
  if (!user) return;
  const all = appState.history || [];
  const mine = all.filter(h => h.userId === user.id);
  const pending = mine.filter(h => h.status === 'pending').length;
  const diterima = mine.filter(h => h.status === 'diterima').length;
  const ditolak = mine.filter(h => h.status === 'ditolak').length;
  document.querySelectorAll('#statPending, #statPending2').forEach(el => { if (el) el.textContent = pending; });
  document.querySelectorAll('#statDiterima, #statDiterima2').forEach(el => { if (el) el.textContent = diterima; });
  document.querySelectorAll('#statDitolak, #statDitolak2').forEach(el => { if (el) el.textContent = ditolak; });
}

function updateStatsRiwayat() {
  const user = getCurrentUser();
  if (!user) return;
  const all = appState.history || [];
  const mine = all.filter(h => h.userId === user.id);
  const pending = mine.filter(h => h.status === 'pending').length;
  const diterima = mine.filter(h => h.status === 'diterima').length;
  const total = mine.reduce((s, h) => s + (h.items || 0), 0);
  const p = safeGet('riwayatStatPending');
  if (p) p.textContent = pending;
  const d = safeGet('riwayatStatDiterima');
  if (d) d.textContent = diterima;
  const t = safeGet('riwayatStatTotal');
  if (t) t.textContent = total;
}

function updateStatsBeranda() {
  const user = getCurrentUser();
  if (!user) return;
  const all = appState.history || [];
  const mine = all.filter(h => h.userId === user.id);
  const pending = mine.filter(h => h.status === 'pending').length;
  const diterima = mine.filter(h => h.status === 'diterima').length;
  const total = mine.reduce((s, h) => s + (h.items || 0), 0);
  const p = safeGet('berandaStatPending');
  if (p) p.textContent = pending;
  const d = safeGet('berandaStatDiterima');
  if (d) d.textContent = diterima;
  const t = safeGet('berandaStatTotal');
  if (t) t.textContent = total;
}

function updateStatsStor() {
  const user = getCurrentUser();
  if (!user) return;
  const all = appState.history || [];
  const mine = all.filter(h => h.userId === user.id);
  const pending = mine.filter(h => h.status === 'pending').length;
  const diterima = mine.filter(h => h.status === 'diterima').length;
  const total = mine.reduce((s, h) => s + (h.items || 0), 0);
  const p = safeGet('storStatPending');
  if (p) p.textContent = pending;
  const d = safeGet('storStatDiterima');
  if (d) d.textContent = diterima;
  const t = safeGet('storStatTotal');
  if (t) t.textContent = total;
}

// ============================================================
// UPDATE STATUS – PERBAIKAN: status gabungan Fresh/Bekas
// ============================================================
function updateStatus() {
  const settings = loadSettings();
  const freshOpen = (settings.depositStatus === 'OPEN');
  const bekasOpen = (settings.depositBekasStatus === 'OPEN');
  const overallOpen = (freshOpen || bekasOpen); // OR logic
  const overallStatus = overallOpen ? 'OPEN' : 'CLOSE';

  // Status Penarikan (tetap sendiri)
  const pen = safeGet('statusPenarikan');
  if (pen) pen.innerHTML =
    `<span class="badge-status ${settings.withdrawStatus==='OPEN'?'open':'close'}">${settings.withdrawStatus||'OPEN'}</span>`;

  // Status Storan gabungan untuk Beranda & Rules
  const stor = safeGet('statusStoran');
  if (stor) stor.innerHTML =
    `<span class="badge-status ${overallOpen?'open':'close'}">${overallStatus}</span>`;

  // Password Hari Ini (tetap dari Fresh)
  const pass = safeGet('statusPass');
  if (pass) pass.textContent = settings.depositInfo || 'murah123';
  const storPass = safeGet('storPassword');
  if (storPass) storPass.value = settings.depositInfo || 'murah123';

  // Rate (tetap dari Fresh)
  const rate = safeGet('statusRate');
  if (rate) rate.textContent = 'Rp ' + formatRupiah(settings.depositPrice || 4000) + ' / email';

  // Rules status (individu untuk transparansi)
  const rs = safeGet('rulesStatusStoran');
  if (rs) {
    const freshLabel = settings.depositStatus || 'OPEN';
    const bekasLabel = settings.depositBekasStatus || 'OPEN';
    rs.innerHTML = `Fresh: <span class="${freshLabel==='OPEN'?'success':'danger'}">${freshLabel}</span> | Bekas: <span class="${bekasLabel==='OPEN'?'success':'danger'}">${bekasLabel}</span>`;
    rs.className = ''; // biar tidak kena style default
  }
  const rp = safeGet('rulesStatusPenarikan');
  if (rp) { rp.textContent = settings.withdrawStatus || 'OPEN';
    rp.className = (settings.withdrawStatus === 'OPEN') ? 'success' : 'danger'; }
}

// ============================================================
// NAVIGATION
// ============================================================
function showPage(page) {
  const prevPage = currentPage;
  currentPage = page;
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = safeGet('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  if (page !== 'beranda' && prevPage !== page) {
    pushOverlayHistoryGuard();
  }

  const scrollArea = safeGet('appScrollArea');
  if (scrollArea) {
    scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const needRefresh = ['beranda', 'stor', 'rules', 'riwayat', 'leaderboard', 'profil'];
  if (needRefresh.includes(page) && getToken()) {
    refreshAppState().then(() => {
      updateUIApp();
      if (page === 'riwayat') {
        renderHistory();
        updateStatsRiwayat();
        renderWithdrawalList();
        renderPendapatanList();
      }
      if (page === 'stor') {
        setTanggalFresh();
        updateStatsStor();
        updateCounterFresh();
        updateStorCards();
      }
      if (page === 'beranda') updateStatsBeranda();
      if (page === 'leaderboard') {
        const activeTab = document.querySelector('#leaderboardTabs .riwayat-tab.active');
        const period = activeTab ? activeTab.dataset.period : 'today';
        loadLeaderboard(period);
      }
    });
  } else {
    updateUIApp();
  }
}

function switchRiwayatTab(tab) {
  document.querySelectorAll('.riwayat-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  document.querySelectorAll('.riwayat-content').forEach(el => el.classList.remove('active'));
  const target = safeGet('riwayatContent' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (target) target.classList.add('active');
  if (tab === 'penarikan') renderWithdrawalList();
  if (tab === 'pendapatan') renderPendapatanList();
  if (tab === 'storan') { renderHistory();
    updateStatsRiwayat(); }
  if (tab === 'global') loadGlobalWithdrawalList();
}

// ============================================================
// STOR SUBMIT – DIPERBAIKI UNTUK FRESH & BEKAS
// ============================================================

// --- FUNGSI UNTUK KARTU STOR ---
function getBekasStatus() {
  try {
    return localStorage.getItem('depositBekasStatus') || 'OPEN';
  } catch (_) { return 'OPEN'; }
}

function updateStorCards() {
  const settings = loadSettings();
  const freshStatus = settings.depositStatus || 'OPEN';
  const bekasStatus = settings.depositBekasStatus || 'OPEN';

  const freshCard = document.getElementById('storCardFresh');
  const freshStatusEl = document.getElementById('storCardFreshStatus');
  const freshRateEl = document.getElementById('storCardFreshRate');
  if (freshCard) {
    const isOpen = freshStatus === 'OPEN';
    freshCard.style.cursor = isOpen ? 'pointer' : 'default';
    freshCard.style.opacity = isOpen ? '1' : '0.6';
    if (freshStatusEl) {
      freshStatusEl.textContent = freshStatus;
      freshStatusEl.className = 'badge-status ' + (isOpen ? 'open' : 'close');
    }
    if (freshRateEl) {
      const rate = settings.depositPrice || 4000;
      freshRateEl.textContent = 'Rp ' + formatRupiah(rate);
    }
  }

  const bekasCard = document.getElementById('storCardBekas');
  const bekasStatusEl = document.getElementById('storCardBekasStatus');
  const bekasRateEl = document.getElementById('storCardBekasRate');
  if (bekasCard) {
    const isOpen = bekasStatus === 'OPEN';
    bekasCard.style.cursor = isOpen ? 'pointer' : 'default';
    bekasCard.style.opacity = isOpen ? '1' : '0.6';
    if (bekasStatusEl) {
      bekasStatusEl.textContent = bekasStatus;
      bekasStatusEl.className = 'badge-status ' + (isOpen ? 'open' : 'close');
    }
    if (bekasRateEl) {
      const rate = settings.depositBekasPrice || 3000;
      bekasRateEl.textContent = 'Rp ' + formatRupiah(rate);
    }
  }
}

function initStorCards() {
  if (storCardsInitialized) return;
  const freshCard = document.getElementById('storCardFresh');
  const bekasCard = document.getElementById('storCardBekas');

  if (freshCard) {
    freshCard.addEventListener('click', function(e) {
      const settings = loadSettings();
      if (settings.depositStatus !== 'OPEN') {
        showToast('error', 'Ditutup', 'Storan Fresh sedang ditutup oleh admin.');
        return;
      }
      document.getElementById('storFormFresh').style.display = 'block';
      document.getElementById('storFormBekas').style.display = 'none';
      setTanggalFresh();
      updateCounterFresh();
    });
  }

  if (bekasCard) {
    bekasCard.addEventListener('click', function(e) {
      const settings = loadSettings();
      if (settings.depositBekasStatus !== 'OPEN') {
        showToast('error', 'Ditutup', 'Storan Bekas sedang ditutup oleh admin.');
        return;
      }
      document.getElementById('storFormFresh').style.display = 'none';
      document.getElementById('storFormBekas').style.display = 'block';
      setTanggalBekas();
      updateCounterBekas();
    });
  }

  // Event input untuk counter
  const freshInput = document.getElementById('storInput');
  if (freshInput) freshInput.addEventListener('input', updateCounterFresh);
  const bekasInput = document.getElementById('storBekasInput');
  if (bekasInput) bekasInput.addEventListener('input', updateCounterBekas);

  storCardsInitialized = true;
}

// --- FUNGSI TANGGAL & COUNTER ---
function setTanggalFresh() {
  const now = new Date();
  const el = document.getElementById('storTanggal');
  if (el) el.value = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
}

function setTanggalBekas() {
  const now = new Date();
  const el = document.getElementById('storBekasTanggal');
  if (el) el.value = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
}

function updateCounterFresh() {
  const input = document.getElementById('storInput');
  const counter = document.getElementById('storCounter');
  if (!input || !counter) return;
  const lines = input.value.trim() ? input.value.split('\n').filter(s => s.trim().length > 0) : [];
  counter.textContent = 'Terdeteksi: ' + lines.length + ' item';
}

function updateCounterBekas() {
  const input = document.getElementById('storBekasInput');
  const counter = document.getElementById('storBekasCounter');
  if (!input || !counter) return;
  const lines = input.value.trim() ? input.value.split('\n').filter(s => s.trim().length > 0) : [];
  counter.textContent = 'Terdeteksi: ' + lines.length + ' item';
}

// --- FUNGSI UTAMA SUBMIT STOR ---
async function submitStor(type = 'fresh') {
  const user = getCurrentUser();
  if (!user) { showToast('error', 'Harap Login', 'Anda harus login.');
    return; }
  const settings = loadSettings();

  if (type === 'fresh') {
    if (settings.depositStatus !== 'OPEN') {
      showToast('error', 'Ditutup', 'Storan Fresh sedang ditutup oleh admin.');
      return;
    }
  } else if (type === 'bekas') {
    if (settings.depositBekasStatus !== 'OPEN') {
      showToast('error', 'Ditutup', 'Storan Bekas sedang ditutup oleh admin.');
      return;
    }
  }

  // Ambil elemen sesuai tipe
  let kontakTypeEl, kontakEl, namaEl, passwordEl, inputEl, tanggalEl;
  if (type === 'fresh') {
    kontakTypeEl = document.getElementById('storKontakType');
    kontakEl = document.getElementById('storKontak');
    namaEl = document.getElementById('storNama');
    passwordEl = document.getElementById('storPassword');
    inputEl = document.getElementById('storInput');
    tanggalEl = document.getElementById('storTanggal');
  } else {
    kontakTypeEl = document.getElementById('storBekasKontakType');
    kontakEl = document.getElementById('storBekasKontak');
    namaEl = document.getElementById('storBekasNama');
    passwordEl = null;
    inputEl = document.getElementById('storBekasInput');
    tanggalEl = document.getElementById('storBekasTanggal');
  }

  const kontakType = kontakTypeEl ? kontakTypeEl.value : 'WA';
  const kontak = kontakEl ? kontakEl.value.trim() : '';
  const nama = namaEl ? namaEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : 'murah123';
  const text = inputEl ? inputEl.value.trim() : '';

  if (!kontak || !nama) { showErrorModal('Data Tidak Lengkap', 'Isi kontak dan nama.'); return; }
  if (!text) { showErrorModal('Gagal', 'Masukkan daftar email.'); return; }

  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

  // Validasi khusus Fresh
  if (type === 'fresh') {
    const invalid = lines.filter(e => !e.toLowerCase().endsWith('@gmail.com'));
    if (invalid.length > 0) { showErrorModal('Gagal', 'Semua harus @gmail.com: ' + invalid.join(', ')); return; }
    const forbidden = ['janda', 'mewing', 'imut', 'cantik', 'ganteng', 'bohay', 'icibos', 'anjing', 'kucing', 'hamster', 'babi', 'ayam'];
    const seen = new Set();
    for (const email of lines) {
      const local = email.split('@')[0].toLowerCase();
      if (seen.has(email.toLowerCase())) { showErrorModal('Gagal', 'Duplikat: ' + email); return; }
      seen.add(email.toLowerCase());
      if (local.length < 3) { showErrorModal('Gagal', 'Email terlalu pendek: ' + email); return; }
      for (const w of forbidden)
        if (local.includes(w)) { showErrorModal('Gagal', 'Kata terlarang: ' + email); return; }
      if ((local.match(/\d/g) || []).length > 2) { showErrorModal('Gagal', 'Angka >2: ' + email); return; }
    }
  } else {
    // Bekas: validasi ringan, misal tidak boleh ada baris kosong
    if (lines.some(e => e.length < 1)) {
      showErrorModal('Gagal', 'Ada baris kosong.');
      return;
    }
  }

  const btn = type === 'fresh' ? document.getElementById('storSubmitBtn') : document.getElementById('storBekasSubmitBtn');
  if (btn) { btn.disabled = true;
    btn.classList.add('loading'); }
  showLoading('Mengirim setoran...');
  try {
    const result = await apiRequest('createStor', {
      kontakType,
      kontak,
      nama,
      password: password || 'murah123',
      emails: lines,
      tanggal: tanggalEl ? tanggalEl.value : '',
      jenis: type  // <-- KIRIM JENIS KE SERVER
    });
    await refreshAppState();

    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const textNotif = `📩 STORAN GMAIL ${type.toUpperCase()} BARU
👤 Nama: ${nama}
🆔 ID User: ${user.id}
📧 Jumlah: ${lines.length} email
${type === 'fresh' ? `🔑 Password: ${password}\n` : ''}
📱 Kontak: ${kontakType} - ${kontak}
📅 Tanggal: ${tanggal}
🕒 Waktu: ${jam}
📋 Daftar Email:
${lines.join('\n')}`;

    sendTelegramMessage(TELEGRAM_BOT_TOKEN_STOR, TELEGRAM_CHAT_ID_STOR, textNotif);

    openModal('modalStorSuccess');
    if (inputEl) inputEl.value = '';
    if (kontakEl) kontakEl.value = '';
    if (namaEl) namaEl.value = '';
    if (type === 'fresh') {
      updateCounterFresh();
    } else {
      updateCounterBekas();
    }
    renderHistory();
    updateStats();
    updateStatsRiwayat();
    updateStatsBeranda();
    updateStatsStor();
  } catch (err) { showToast('error', 'Gagal', err.message); } finally {
    if (btn) { btn.disabled = false;
      btn.classList.remove('loading'); }
    hideLoading();
  }
}

// Fungsi setTanggal yang lama (dipakai oleh inisialisasi lama) – kita ganti dengan setTanggalFresh
function setTanggal() {
  setTanggalFresh();
}

// Fungsi updateCounter lama
function updateCounter() {
  updateCounterFresh();
}

function showErrorModal(title, desc) {
  const t = safeGet('errorTitle');
  const d = safeGet('errorDesc');
  if (t) t.textContent = title;
  if (d) d.textContent = desc + ' Lihat rules.';
  openModal('modalError');
}

// ============================================================
// TOMBOL/GESTURE KEMBALI HP: tutup menu/overlay yang lagi buka,
// jangan sampai malah keluar dari web.
// ============================================================
let overlayHistoryDepth = 0;
let ignoreNextPopState = false;

function pushOverlayHistoryGuard() {
  overlayHistoryDepth++;
  try { history.pushState({ overlayGuard: true, depth: overlayHistoryDepth }, ''); } catch (_) {}
}

function popOverlayHistoryGuard() {
  if (overlayHistoryDepth <= 0) return;
  overlayHistoryDepth--;
  try {
    if (history.state && history.state.overlayGuard) {
      ignoreNextPopState = true;
      history.back();
    }
  } catch (_) {}
}

window.addEventListener('popstate', function() {
  if (ignoreNextPopState) {
    ignoreNextPopState = false;
    return;
  }
  const emojiPickerEl = document.getElementById('emojiPicker');
  if (emojiPickerEl && emojiPickerEl.classList.contains('show')) {
    if (overlayHistoryDepth > 0) overlayHistoryDepth--;
    closeEmojiPicker(true);
    const input = document.getElementById('chatInput');
    if (input) setTimeout(() => input.focus(), 50);
    return;
  }
  const chatOverlay = document.getElementById('chatPublicOverlay');
  if (chatOverlay && chatOverlay.classList.contains('show')) {
    if (overlayHistoryDepth > 0) overlayHistoryDepth--;
    closeChatPublic(true);
    showPage('beranda');
    return;
  }
  const openModalEl = document.querySelector('.modal-overlay.open');
  if (openModalEl) {
    if (overlayHistoryDepth > 0) overlayHistoryDepth--;
    closeModal(openModalEl.id, true);
    return;
  }
  if (currentPage !== 'beranda') {
    if (overlayHistoryDepth > 0) overlayHistoryDepth--;
    showPage('beranda');
    return;
  }
});