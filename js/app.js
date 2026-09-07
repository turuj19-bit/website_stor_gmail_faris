// ============================================================
// PATCH EKSTRA: paksa supabase.rpc('createStor') selalu
// menyertakan parameter 'jenis' yang benar.
// ============================================================
(function() {
  // Simpan referensi ke supabase.rpc asli
  const originalRpc = window.supabase?.rpc;
  if (originalRpc && typeof originalRpc === 'function') {
    window.supabase.rpc = function(fnName, params) {
      if (fnName === 'createStor' && params && typeof params === 'object') {
        // Jika params belum punya 'jenis', set berdasarkan form yang terbuka
        if (!params.jenis) {
          // FIX: ikut cek form Biasa & Old juga (sebelumnya cuma Bekas)
          const bekasForm = document.getElementById('storFormBekas');
          const biasaForm = document.getElementById('storFormBiasa');
          const oldForm = document.getElementById('storFormOld');
          if (bekasForm && bekasForm.classList.contains('show')) {
            params.jenis = 'bekas';
          } else if (biasaForm && biasaForm.classList.contains('show')) {
            params.jenis = 'biasa';
          } else if (oldForm && oldForm.classList.contains('show')) {
            params.jenis = 'old';
          } else {
            params.jenis = 'fresh';
          }
        }
        // Tambahkan log untuk debugging (bisa dihapus nanti)
        console.log('[PATCH] createStor params:', params);
      }
      // Panggil fungsi asli
      return originalRpc.call(window.supabase, fnName, params);
    };
    console.log('[PATCH] supabase.rpc berhasil di-override.');
  } else {
    console.warn('[PATCH] supabase.rpc tidak ditemukan, patch gagal.');
  }
})();

// ============================================================
// OVERRIDE apiRequest agar selalu mengirim parameter jenis untuk createStor
// (ini sudah ada, tapi kita perkuat dengan pengecekan ganda)
// ============================================================
(function() {
  const originalApiRequest = window.apiRequest;
  if (typeof originalApiRequest === 'function') {
    window.apiRequest = async function(action, data) {
      if (action === 'createStor' && data && typeof data === 'object') {
        // Jika data.jenis belum diisi, set berdasarkan form yang aktif
        if (!data.jenis) {
          // FIX: ikut cek form Biasa & Old juga (sebelumnya cuma Fresh/Bekas)
          const freshForm = document.getElementById('storFormFresh');
          const bekasForm = document.getElementById('storFormBekas');
          const biasaForm = document.getElementById('storFormBiasa');
          const oldForm = document.getElementById('storFormOld');
          if (bekasForm && bekasForm.classList.contains('show')) {
            data.jenis = 'bekas';
          } else if (biasaForm && biasaForm.classList.contains('show')) {
            data.jenis = 'biasa';
          } else if (oldForm && oldForm.classList.contains('show')) {
            data.jenis = 'old';
          } else if (freshForm && freshForm.classList.contains('show')) {
            data.jenis = 'fresh';
          } else {
            // fallback: cek style.display (untuk kompatibilitas)
            if (bekasForm && bekasForm.style.display !== 'none') {
              data.jenis = 'bekas';
            } else {
              data.jenis = 'fresh';
            }
          }
        }
        // PASTIKAN data.jenis selalu ada
        if (!data.jenis) data.jenis = 'fresh';
        console.log('[apiRequest] createStor data:', data);
      }
      return originalApiRequest(action, data);
    };
  }
})();

// ============================================================
// OVERRIDE loadSettings() agar membaca setting Bekas dari appState
// (tidak diubah, tetap seperti aslinya)
// ============================================================
(function() {
  const originalLoadSettings = window.loadSettings;
  window.loadSettings = function() {
    let settings = {};
    if (typeof originalLoadSettings === 'function') {
      settings = originalLoadSettings() || {};
    }
    if (window.appState && window.appState.settings) {
      settings.depositBekasStatus = window.appState.settings.depositBekasStatus || settings.depositBekasStatus || 'OPEN';
      settings.depositBekasPrice  = window.appState.settings.depositBekasPrice || settings.depositBekasPrice || 3000;
      settings.depositBekasName   = window.appState.settings.depositBekasName || settings.depositBekasName || 'Gmail';
      settings.depositBekasInfo   = window.appState.settings.depositBekasInfo || settings.depositBekasInfo || '';
      // FIX: ikut bawa settings Bekas Biasa & Bekas Old (sebelumnya nilai
      // tetap, sekarang dari database sama seperti Bekas)
      settings.depositBiasaStatus = window.appState.settings.depositBiasaStatus || settings.depositBiasaStatus || 'OPEN';
      settings.depositBiasaPrice  = window.appState.settings.depositBiasaPrice || settings.depositBiasaPrice || 2500;
      settings.depositBiasaName   = window.appState.settings.depositBiasaName || settings.depositBiasaName || 'Gmail Bekas Biasa';
      settings.depositBiasaInfo   = window.appState.settings.depositBiasaInfo || settings.depositBiasaInfo || '';
      settings.depositOldStatus   = window.appState.settings.depositOldStatus || settings.depositOldStatus || 'OPEN';
      settings.depositOldPrice    = window.appState.settings.depositOldPrice || settings.depositOldPrice || 2000;
      settings.depositOldName     = window.appState.settings.depositOldName || settings.depositOldName || 'Gmail Bekas Old';
      settings.depositOldInfo     = window.appState.settings.depositOldInfo || settings.depositOldInfo || '';
    }
    if (!settings.depositBekasStatus) {
      settings.depositBekasStatus = localStorage.getItem('depositBekasStatus') || 'OPEN';
    }
    if (!settings.depositBekasPrice) {
      settings.depositBekasPrice = parseInt(localStorage.getItem('depositBekasPrice')) || 3000;
    }
    if (!settings.depositBekasName) {
      settings.depositBekasName = localStorage.getItem('depositBekasName') || 'Gmail';
    }
    if (!settings.depositBekasInfo) {
      settings.depositBekasInfo = localStorage.getItem('depositBekasInfo') || '';
    }
    if (!settings.depositBiasaStatus) {
      settings.depositBiasaStatus = localStorage.getItem('depositBiasaStatus') || 'OPEN';
    }
    if (!settings.depositBiasaPrice) {
      settings.depositBiasaPrice = parseInt(localStorage.getItem('depositBiasaPrice')) || 2500;
    }
    if (!settings.depositBiasaName) {
      settings.depositBiasaName = localStorage.getItem('depositBiasaName') || 'Gmail Bekas Biasa';
    }
    if (!settings.depositBiasaInfo) {
      settings.depositBiasaInfo = localStorage.getItem('depositBiasaInfo') || '';
    }
    if (!settings.depositOldStatus) {
      settings.depositOldStatus = localStorage.getItem('depositOldStatus') || 'OPEN';
    }
    if (!settings.depositOldPrice) {
      settings.depositOldPrice = parseInt(localStorage.getItem('depositOldPrice')) || 2000;
    }
    if (!settings.depositOldName) {
      settings.depositOldName = localStorage.getItem('depositOldName') || 'Gmail Bekas Old';
    }
    if (!settings.depositOldInfo) {
      settings.depositOldInfo = localStorage.getItem('depositOldInfo') || '';
    }
    return settings;
  };
})();

// ============================================================
// PATCH: cegah overlay loading macet tak tertutup setelah Logout.
// confirmLogout() aslinya ada di auth.js -- kita bungkus di sini
// supaya, apapun hasil/errornya, overlay "Logout..." dipaksa hilang
// (langsung begitu prosesnya selesai, atau maksimal 4 detik sebagai
// jaring pengaman kalau ada yang gagal ke-handle di dalamnya).
// ============================================================
(function() {
  const originalConfirmLogout = window.confirmLogout;
  if (typeof originalConfirmLogout === 'function') {
    window.confirmLogout = function(...args) {
      const forceHide = function() { try { hideLoading(); } catch (_) {} };
      let result;
      try {
        result = originalConfirmLogout.apply(this, args);
      } catch (e) {
        forceHide();
        throw e;
      }
      if (result && typeof result.finally === 'function') {
        result.finally(forceHide);
      }
      setTimeout(forceHide, 4000);
      return result;
    };
  }
})();

// ============================================================
// VARIABEL TAMBAHAN
// ============================================================
let depositBekasStatus = 'OPEN';
let storCardsInitialized = false;
let showChoiceMode = true;

// ============================================================
// APP ENTRY
// ============================================================
function enterApp() {
  try {
    const authPage = safeGet('authPage');
    const appPage = safeGet('appPage');
    if (authPage) authPage.classList.add('hide');
    if (appPage) appPage.classList.add('show');
    document.documentElement.classList.add('locked');
    document.body.classList.add('locked');
    window.scrollTo(0, 0);
    updateUIApp();
    showPage('beranda');
    startInboxFloatNotifLoop();
  } catch (e) {
    console.warn('enterApp error:', e);
  }
}

function closeWelcomeToast() {
  const toast = safeGet('welcomeToast');
  if (toast) toast.classList.remove('show');
}

// ============================================================
// UPDATE UI (dengan try-catch agar tidak crash)
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
    if (profileUid) profileUid.textContent = getNumericId(user.id);
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

    // Status Storan (gabungan)
    const freshOpen = (settings.depositStatus === 'OPEN');
    const bekasOpen = (settings.depositBekasStatus === 'OPEN');
    const overallOpen = (freshOpen || bekasOpen);
    const stor = safeGet('statusStoran');
    if (stor) stor.innerHTML =
      `<span class="badge-status ${overallOpen?'open':'close'}">${overallOpen?'OPEN':'CLOSE'}</span>`;

    // Status Penarikan
    const pen = safeGet('statusPenarikan');
    if (pen) pen.innerHTML =
      `<span class="badge-status ${settings.withdrawStatus==='OPEN'?'open':'close'}">${settings.withdrawStatus||'OPEN'}</span>`;

    // Password & Rate (tetap untuk Fresh)
    const rate = safeGet('statusRate');
    if (rate) rate.textContent = 'Rp ' + formatRupiah(settings.depositPrice || 4000) + ' / email';
    const pass = safeGet('statusPass');
    if (pass) pass.textContent = settings.depositInfo || 'murah123';
    const storPass = safeGet('storPassword');
    if (storPass) storPass.value = settings.depositInfo || 'murah123';
    const storBekasPass = safeGet('storBekasPassword');
    if (storBekasPass) storBekasPass.value = settings.depositBekasInfo || 'murah123';
    const storBiasaPass = safeGet('storBiasaPassword');
    if (storBiasaPass) storBiasaPass.value = settings.depositBiasaInfo || 'murah123';
    const storOldPass = safeGet('storOldPassword');
    if (storOldPass) storOldPass.value = settings.depositOldInfo || 'murah123';

    // Rules
    const rs = safeGet('rulesStatusStoran');
    if (rs) {
      const freshLabel = settings.depositStatus || 'OPEN';
      const bekasLabel = settings.depositBekasStatus || 'OPEN';
      rs.innerHTML = `Fresh: <span class="${freshLabel==='OPEN'?'success':'danger'}">${freshLabel}</span> | Bekas: <span class="${bekasLabel==='OPEN'?'success':'danger'}">${bekasLabel}</span>`;
    }
    const rp = safeGet('rulesStatusPenarikan');
    if (rp) { rp.textContent = settings.withdrawStatus || 'OPEN';
      rp.className = (settings.withdrawStatus === 'OPEN') ? 'success' : 'danger'; }

    // Harga
    const hargaBeranda = safeGet('berandaHarga');
    if (hargaBeranda) hargaBeranda.textContent = 'Rp ' + formatRupiah(settings.depositPrice || 4000);

    // Stats
    renderHistory();
    updateStats();
    updateStatsRiwayat();
    updateStatsBeranda();
    updateStatsStor();

    // Update kartu dan inisialisasi
    updateStorCards();
    initStorCards();

    // Jika di halaman stor, atur tampilan
    if (currentPage === 'stor') {
      if (showChoiceMode) {
        showStorChoice();
      }
    }

  } catch (e) {
    console.warn('updateUIApp error:', e);
  }
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
// INBOX (dari original)
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
  hideInboxFloatNotif();
  openModal('modalInbox');
}

async function clearInbox() {
  const user = getCurrentUser();
  if (!user) { showToast('error', 'Gagal', 'Login dulu.'); return; }
  showLoading('Menghapus semua pesan...');
  try {
    await apiRequest('clearInbox', {});
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
// NOTIF MENGAMBANG: PESAN MASUK (INBOX)
// Selama masih ada pesan yang belum dibaca, notif ini akan:
// - muncul (melayang) selama 30 detik, lalu hilang otomatis
// - muncul lagi 30 detik kemudian kalau masih ada yang belum dibaca
// - berhenti total begitu inbox dibuka (pesan dianggap sudah dibaca)
// ============================================================
let inboxFloatNotifStarted = false;
let inboxFloatLoopTimer = null;
let inboxFloatHideTimer = null;

let inboxNotifAudioCtx = null;
function playInboxNotifSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!inboxNotifAudioCtx) inboxNotifAudioCtx = new AC();
    const ctx = inboxNotifAudioCtx;
    // Browser sering nge-suspend AudioContext sampai ada interaksi user;
    // karena app ini baru bisa dipakai setelah user login (klik tombol),
    // resume() di sini biasanya langsung berhasil.
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});

    function tone(freq, startTime, duration, peakVol) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakVol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    }

    const now = ctx.currentTime;
    // Bunyi lonceng "ding-dong" 2 nada, dibuat keras & jelas (bukan
    // beep pelan) supaya user langsung sadar ada pesan masuk.
    tone(1318.51, now, 0.55, 0.6);       // ding (E6)
    tone(987.77, now + 0.20, 0.65, 0.55); // dong (B5)
  } catch (e) {
    console.warn('playInboxNotifSound error:', e);
  }
}

function showInboxFloatNotif() {
  const el = safeGet('inboxFloatNotif');
  if (!el) return;
  const unread = getUnreadMessages();
  if (unread.length === 0) return;
  const subEl = safeGet('inboxFloatNotifSub');
  if (subEl) {
    subEl.textContent = (unread.length === 1)
      ? (unread[0].title || 'Anda punya 1 pesan baru')
      : ('Anda punya ' + unread.length + ' pesan baru');
  }
  el.classList.add('show');
  playInboxNotifSound();
  clearTimeout(inboxFloatHideTimer);
  inboxFloatHideTimer = setTimeout(function () {
    el.classList.remove('show');
  }, 30000);
}

function hideInboxFloatNotif() {
  const el = safeGet('inboxFloatNotif');
  if (el) el.classList.remove('show');
  clearTimeout(inboxFloatHideTimer);
}

function handleInboxFloatNotifClick() {
  hideInboxFloatNotif();
  clearTimeout(inboxFloatLoopTimer);
  openInbox();
}

function inboxFloatNotifLoop() {
  clearTimeout(inboxFloatLoopTimer);
  const unread = getUnreadMessages();
  if (unread.length > 0) {
    showInboxFloatNotif();
    inboxFloatLoopTimer = setTimeout(function () {
      hideInboxFloatNotif();
      inboxFloatLoopTimer = setTimeout(inboxFloatNotifLoop, 30000);
    }, 30000);
  } else {
    // Tidak ada pesan baru: cek ulang berkala kalau-kalau ada pesan
    // baru masuk dari admin.
    inboxFloatLoopTimer = setTimeout(inboxFloatNotifLoop, 5000);
  }
}

function startInboxFloatNotifLoop() {
  if (inboxFloatNotifStarted) return;
  inboxFloatNotifStarted = true;
  inboxFloatNotifLoop();
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
// NAVIGATION
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
  if (currentPage === 'stor' && !showChoiceMode) {
    showChoiceMode = true;
    showStorChoice();
    pushOverlayHistoryGuard();
    return;
  }
  if (currentPage !== 'beranda') {
    if (overlayHistoryDepth > 0) overlayHistoryDepth--;
    showPage('beranda');
    return;
  }
});

function showPage(page) {
  try {
    const prevPage = currentPage;
    currentPage = page;
    saveLastPage(page);
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = safeGet('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    if (page !== 'beranda' && prevPage !== page) {
      pushOverlayHistoryGuard();
    }

    if (page === 'stor' && prevPage !== page) {
      showChoiceMode = true;
      showStorChoice();
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
          updateStatsStor();
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
  } catch (e) {
    console.warn('showPage error:', e);
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
// STOR CARDS & FORM DISPLAY
// ============================================================
// FIX: daftar semua ID form full-screen Stor, dipakai bareng supaya nambah
// jenis storan baru (Biasa, Old) tidak perlu ubah banyak tempat.
const STOR_FORM_IDS = ['storFormFresh', 'storFormBekas', 'storFormBiasa', 'storFormOld'];

function showStorChoice() {
  showChoiceMode = true;
  const choiceContainer = document.getElementById('storChoiceContainer');
  if (choiceContainer) choiceContainer.style.display = 'flex';
  STOR_FORM_IDS.forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  });
}

function openStorForm(formId) {
  showChoiceMode = false;
  const choiceContainer = document.getElementById('storChoiceContainer');
  if (choiceContainer) choiceContainer.style.display = 'none';
  STOR_FORM_IDS.forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('show', id === formId);
  });
}

function showFreshForm() {
  openStorForm('storFormFresh');
  setTanggalFresh();
  updateCounterFresh();
  pushOverlayHistoryGuard();
}

function showBekasForm() {
  openStorForm('storFormBekas');
  setTanggalBekas();
  updateCounterBekas();
  pushOverlayHistoryGuard();
}

// FIX: 2 jenis storan baru — Bekas Biasa & Bekas Old (pola sama persis
// seperti Bekas 2FA, tanpa validasi khusus)
function showBiasaForm() {
  openStorForm('storFormBiasa');
  setTanggalBiasa();
  updateCounterBiasa();
  pushOverlayHistoryGuard();
}

function showOldForm() {
  openStorForm('storFormOld');
  setTanggalOld();
  updateCounterOld();
  pushOverlayHistoryGuard();
}

function goBackToStorChoice() {
  showChoiceMode = true;
  showStorChoice();
  popOverlayHistoryGuard();
}

function confirmGoBackStor() {
  openModal('modalConfirmBackStor');
}

function confirmBackToStorChoice() {
  const modalEl = document.getElementById('modalConfirmBackStor');
  if (modalEl) modalEl.classList.remove('open');
  goBackToStorChoice();
}

// ============================================================
// UPDATE STOR CARDS
// ============================================================
// ============================================================
// Gmail Bekas Biasa & Gmail Bekas Old
// ============================================================
// UPDATE: harga, status OPEN/CLOSE, nama, dan info storan Bekas Biasa &
// Bekas Old sekarang sudah bisa diatur dari dashboard admin (kolom
// deposit_biasa_* / deposit_old_* di tabel settings, disimpan lewat
// panel_update_settings), sama seperti Fresh & Bekas. Nilai di bawah ini
// cuma dipakai sebagai fallback kalau settings dari server belum sempat
// termuat.
function getStorBiasaConfig() {
  const settings = loadSettings();
  return {
    status: settings.depositBiasaStatus || 'OPEN',
    name: settings.depositBiasaName || 'Gmail Bekas Biasa',
    price: settings.depositBiasaPrice || 2500,
    info: settings.depositBiasaInfo || '-'
  };
}
function getStorOldConfig() {
  const settings = loadSettings();
  return {
    status: settings.depositOldStatus || 'OPEN',
    name: settings.depositOldName || 'Gmail Bekas Old',
    price: settings.depositOldPrice || 2000,
    info: settings.depositOldInfo || '-'
  };
}

function updateStorCards() {
  try {
    const settings = loadSettings();
    const freshStatus = settings.depositStatus || 'OPEN';
    const bekasStatus = settings.depositBekasStatus || 'OPEN';
    const freshName = settings.depositName || 'Gmail';
    const bekasName = settings.depositBekasName || 'Gmail';
    const freshPrice = settings.depositPrice || 4000;
    const bekasPrice = settings.depositBekasPrice || 3000;
    const freshInfo = settings.depositInfo || '';
    const bekasInfo = settings.depositBekasInfo || '';

    const freshCard = document.getElementById('storCardFresh');
    const freshStatusEl = document.getElementById('storCardFreshStatus');
    const freshRateEl = document.getElementById('storCardFreshRate');
    const freshNameEl = document.getElementById('storCardFreshName');
    const freshInfoEl = document.getElementById('storCardFreshInfo');
    if (freshCard) {
      const isOpen = freshStatus === 'OPEN';
      freshCard.style.cursor = isOpen ? 'pointer' : 'default';
      freshCard.style.opacity = isOpen ? '1' : '0.6';
      if (freshStatusEl) {
        freshStatusEl.textContent = freshStatus;
        freshStatusEl.className = 'badge-status ' + (isOpen ? 'open' : 'close');
      }
      if (freshRateEl) freshRateEl.textContent = 'Rp ' + formatRupiah(freshPrice);
      const freshLabel = /fresh/i.test(freshName) ? freshName : (freshName + ' Fresh');
      if (freshNameEl) freshNameEl.textContent = freshLabel;
      if (freshInfoEl) freshInfoEl.textContent = freshInfo || '';
    }

    const bekasCard = document.getElementById('storCardBekas');
    const bekasStatusEl = document.getElementById('storCardBekasStatus');
    const bekasRateEl = document.getElementById('storCardBekasRate');
    const bekasNameEl = document.getElementById('storCardBekasName');
    const bekasInfoEl = document.getElementById('storCardBekasInfo');
    if (bekasCard) {
      const isOpen = bekasStatus === 'OPEN';
      bekasCard.style.cursor = isOpen ? 'pointer' : 'default';
      bekasCard.style.opacity = isOpen ? '1' : '0.6';
      if (bekasStatusEl) {
        bekasStatusEl.textContent = bekasStatus;
        bekasStatusEl.className = 'badge-status ' + (isOpen ? 'open' : 'close');
      }
      if (bekasRateEl) bekasRateEl.textContent = 'Rp ' + formatRupiah(bekasPrice);
      if (bekasNameEl) bekasNameEl.textContent = bekasName;
      if (bekasInfoEl) bekasInfoEl.textContent = bekasInfo || '';
    }

    // Kartu Bekas Biasa & Bekas Old (settings dari database, lihat
    // getStorBiasaConfig() / getStorOldConfig() di atas)
    [
      { cfg: getStorBiasaConfig(), prefix: 'storCardBiasa', closedMsg: 'storBiasaClosedMsg' },
      { cfg: getStorOldConfig(), prefix: 'storCardOld', closedMsg: 'storOldClosedMsg' }
    ].forEach(function(item) {
      const card = document.getElementById(item.prefix);
      const statusEl = document.getElementById(item.prefix + 'Status');
      const rateEl = document.getElementById(item.prefix + 'Rate');
      const nameEl = document.getElementById(item.prefix + 'Name');
      const infoEl = document.getElementById(item.prefix + 'Info');
      const closedMsgEl = document.getElementById(item.closedMsg);
      const isOpen = item.cfg.status === 'OPEN';
      if (card) {
        card.style.cursor = isOpen ? 'pointer' : 'default';
        card.style.opacity = isOpen ? '1' : '0.6';
      }
      if (statusEl) {
        statusEl.textContent = item.cfg.status;
        statusEl.className = 'badge-status ' + (isOpen ? 'open' : 'close');
      }
      if (rateEl) rateEl.textContent = 'Rp ' + formatRupiah(item.cfg.price);
      if (nameEl) nameEl.textContent = item.cfg.name;
      if (infoEl) infoEl.textContent = item.cfg.info || '';
      if (closedMsgEl) closedMsgEl.style.display = isOpen ? 'none' : 'block';
    });

    const freshClosedMsg = document.getElementById('storClosedMsg');
    if (freshClosedMsg) freshClosedMsg.style.display = (freshStatus !== 'OPEN') ? 'block' : 'none';
    const bekasClosedMsg = document.getElementById('storBekasClosedMsg');
    if (bekasClosedMsg) bekasClosedMsg.style.display = (bekasStatus !== 'OPEN') ? 'block' : 'none';
  } catch (e) {
    console.warn('updateStorCards error:', e);
  }
}

// ============================================================
// Pindahkan form full-screen Stor ke <body>
// ============================================================
function relocateStorFormsToBody() {
  try {
    STOR_FORM_IDS.forEach(function(id) {
      const el = document.getElementById(id);
      if (el && el.parentElement !== document.body) {
        document.body.appendChild(el);
      }
    });
  } catch (e) {
    console.warn('relocateStorFormsToBody error:', e);
  }
}

function initStorCards() {
  if (storCardsInitialized) return;
  try {
    relocateStorFormsToBody();

    const freshCard = document.getElementById('storCardFresh');
    const bekasCard = document.getElementById('storCardBekas');
    const biasaCard = document.getElementById('storCardBiasa');
    const oldCard = document.getElementById('storCardOld');
    const backBtnFresh = document.getElementById('storBackBtnFresh');
    const backBtnBekas = document.getElementById('storBackBtnBekas');
    const backBtnBiasa = document.getElementById('storBackBtnBiasa');
    const backBtnOld = document.getElementById('storBackBtnOld');

    if (freshCard) {
      freshCard.addEventListener('click', function(e) {
        const settings = loadSettings();
        if (settings.depositStatus !== 'OPEN') {
          showErrorModal('Ditutup', 'Storan Fresh sedang ditutup oleh admin.', false);
          return;
        }
        showFreshForm();
      });
    }

    if (bekasCard) {
      bekasCard.addEventListener('click', function(e) {
        const settings = loadSettings();
        if (settings.depositBekasStatus !== 'OPEN') {
          showErrorModal('Ditutup', 'Storan Bekas sedang ditutup oleh admin.', false);
          return;
        }
        showBekasForm();
      });
    }

    // Kartu Bekas Biasa & Bekas Old (lihat getStorBiasaConfig()/getStorOldConfig())
    if (biasaCard) {
      biasaCard.addEventListener('click', function(e) {
        if (getStorBiasaConfig().status !== 'OPEN') {
          showErrorModal('Ditutup', 'Storan Bekas Biasa sedang ditutup oleh admin.', false);
          return;
        }
        showBiasaForm();
      });
    }
    if (oldCard) {
      oldCard.addEventListener('click', function(e) {
        if (getStorOldConfig().status !== 'OPEN') {
          showErrorModal('Ditutup', 'Storan Bekas Old sedang ditutup oleh admin.', false);
          return;
        }
        showOldForm();
      });
    }

    if (backBtnFresh) {
      backBtnFresh.addEventListener('click', function(e) {
        confirmGoBackStor();
      });
    }
    if (backBtnBekas) {
      backBtnBekas.addEventListener('click', function(e) {
        confirmGoBackStor();
      });
    }
    if (backBtnBiasa) {
      backBtnBiasa.addEventListener('click', function(e) {
        confirmGoBackStor();
      });
    }
    if (backBtnOld) {
      backBtnOld.addEventListener('click', function(e) {
        confirmGoBackStor();
      });
    }

    const freshInput = document.getElementById('storInput');
    if (freshInput) freshInput.addEventListener('input', updateCounterFresh);
    const bekasInput = document.getElementById('storBekasInput');
    if (bekasInput) bekasInput.addEventListener('input', updateCounterBekas);
    const biasaInput = document.getElementById('storBiasaInput');
    if (biasaInput) biasaInput.addEventListener('input', updateCounterBiasa);
    const oldInput = document.getElementById('storOldInput');
    if (oldInput) oldInput.addEventListener('input', updateCounterOld);

    storCardsInitialized = true;
  } catch (e) {
    console.warn('initStorCards error:', e);
  }
}

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

function setTanggalBiasa() {
  const now = new Date();
  const el = document.getElementById('storBiasaTanggal');
  if (el) el.value = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
}

function setTanggalOld() {
  const now = new Date();
  const el = document.getElementById('storOldTanggal');
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

function updateCounterBiasa() {
  const input = document.getElementById('storBiasaInput');
  const counter = document.getElementById('storBiasaCounter');
  if (!input || !counter) return;
  const lines = input.value.trim() ? input.value.split('\n').filter(s => s.trim().length > 0) : [];
  counter.textContent = 'Terdeteksi: ' + lines.length + ' item';
}

function updateCounterOld() {
  const input = document.getElementById('storOldInput');
  const counter = document.getElementById('storOldCounter');
  if (!input || !counter) return;
  const lines = input.value.trim() ? input.value.split('\n').filter(s => s.trim().length > 0) : [];
  counter.textContent = 'Terdeteksi: ' + lines.length + ' item';
}

// ============================================================
// SUBMIT STOR — DIPERBAIKI dengan pengecekan & logging lebih kuat
// ============================================================
// FIX: peta ID elemen per jenis storan, supaya nambah jenis baru (Biasa,
// Old) tidak perlu bikin banyak percabangan if/else terpisah lagi.
const STOR_TYPE_FIELDS = {
  fresh: { kontakType: 'storKontakType', kontak: 'storKontak', nama: 'storNama', password: 'storPassword', input: 'storInput', tanggal: 'storTanggal', counter: updateCounterFresh, submitBtn: 'storSubmitBtn' },
  bekas: { kontakType: 'storBekasKontakType', kontak: 'storBekasKontak', nama: 'storBekasNama', password: 'storBekasPassword', input: 'storBekasInput', tanggal: 'storBekasTanggal', counter: updateCounterBekas, submitBtn: 'storBekasSubmitBtn' },
  biasa: { kontakType: 'storBiasaKontakType', kontak: 'storBiasaKontak', nama: 'storBiasaNama', password: 'storBiasaPassword', input: 'storBiasaInput', tanggal: 'storBiasaTanggal', counter: updateCounterBiasa, submitBtn: 'storBiasaSubmitBtn' },
  old:   { kontakType: 'storOldKontakType',   kontak: 'storOldKontak',   nama: 'storOldNama',   password: 'storOldPassword',   input: 'storOldInput',   tanggal: 'storOldTanggal',   counter: updateCounterOld,   submitBtn: 'storOldSubmitBtn' }
};
const STOR_TYPE_LABELS = { fresh: 'Fresh', bekas: 'Bekas', biasa: 'Bekas Biasa', old: 'Bekas Old' };

async function submitStor(type) {
  // Jika type tidak diberikan, coba deteksi otomatis dari form yang lagi tampil
  if (!type) {
    const found = STOR_FORM_IDS.find(function(id) {
      const el = document.getElementById(id);
      return el && el.classList.contains('show');
    });
    if (found === 'storFormBekas') type = 'bekas';
    else if (found === 'storFormBiasa') type = 'biasa';
    else if (found === 'storFormOld') type = 'old';
    else if (found === 'storFormFresh') type = 'fresh';
    else {
      showToast('error', 'Error', 'Tidak ada form storan yang aktif.');
      return;
    }
  }

  const fields = STOR_TYPE_FIELDS[type];
  if (!fields) {
    showToast('error', 'Error', 'Jenis storan tidak valid.');
    return;
  }

  const user = getCurrentUser();
  if (!user) { showToast('error', 'Harap Login', 'Anda harus login.');
    return; }
  const settings = loadSettings();

  if (type === 'fresh') {
    if (settings.depositStatus !== 'OPEN') {
      showErrorModal('Ditutup', 'Storan Fresh sedang ditutup oleh admin.', false);
      return;
    }
  } else if (type === 'bekas') {
    if (settings.depositBekasStatus !== 'OPEN') {
      showErrorModal('Ditutup', 'Storan Bekas sedang ditutup oleh admin.', false);
      return;
    }
  } else if (type === 'biasa') {
    if ((settings.depositBiasaStatus || 'OPEN') !== 'OPEN') {
      showErrorModal('Ditutup', 'Storan Bekas Biasa sedang ditutup oleh admin.', false);
      return;
    }
  } else if (type === 'old') {
    if ((settings.depositOldStatus || 'OPEN') !== 'OPEN') {
      showErrorModal('Ditutup', 'Storan Bekas Old sedang ditutup oleh admin.', false);
      return;
    }
  }

  const kontakTypeEl = document.getElementById(fields.kontakType);
  const kontakEl = document.getElementById(fields.kontak);
  const namaEl = document.getElementById(fields.nama);
  const passwordEl = document.getElementById(fields.password);
  const inputEl = document.getElementById(fields.input);
  const tanggalEl = document.getElementById(fields.tanggal);

  const kontakType = kontakTypeEl ? kontakTypeEl.value : 'WA';
  const kontak = kontakEl ? kontakEl.value.trim() : '';
  const nama = namaEl ? namaEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : 'murah123';
  const text = inputEl ? inputEl.value.trim() : '';

  if (!kontak || !nama) { showErrorModal('Data Tidak Lengkap', 'Isi kontak dan nama.'); return; }
  if (!text) { showErrorModal('Gagal', 'Masukkan daftar email.'); return; }

  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

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
    // Bekas / Biasa / Old: tanpa validasi khusus, cukup pastikan tidak ada baris kosong
    if (lines.some(e => e.length < 1)) {
      showErrorModal('Gagal', 'Ada baris kosong.');
      return;
    }
  }

  const btn = document.getElementById(fields.submitBtn);
  if (btn) { btn.disabled = true;
    btn.classList.add('loading'); }
  showLoading('Mengirim setoran...');
  try {
    // Buat payload dengan JENIS yang sudah dipastikan
    const payload = {
      kontakType,
      kontak,
      nama,
      password: password || 'murah123',
      emails: lines,
      tanggal: tanggalEl ? tanggalEl.value : '',
      jenis: type   // <-- PASTIKAN ADA
    };
    console.log('[submitStor] payload dikirim:', payload);

    const result = await apiRequest('createStor', payload);
    await refreshAppState();

    const now = new Date();
    const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const textNotif = `📩 STORAN GMAIL ${(STOR_TYPE_LABELS[type] || type).toUpperCase()} BARU
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
    if (fields.counter) fields.counter();
    renderHistory();
    updateStats();
    updateStatsRiwayat();
    updateStatsBeranda();
    updateStatsStor();
  } catch (err) { 
    console.error('[submitStor] error:', err);
    showToast('error', 'Gagal', err.message); 
  } finally {
    if (btn) { btn.disabled = false;
      btn.classList.remove('loading'); }
    hideLoading();
  }
}

function setTanggal() {
  setTanggalFresh();
}

function updateCounter() {
  updateCounterFresh();
}

function showErrorModal(title, desc, showRulesHint) {
  const t = safeGet('errorTitle');
  const d = safeGet('errorDesc');
  if (t) t.textContent = title;
  if (d) d.textContent = (showRulesHint === false) ? desc : desc + ' Lihat rules.';
  openModal('modalError');
}