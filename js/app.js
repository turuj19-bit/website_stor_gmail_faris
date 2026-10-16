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
          const captchaForm = document.getElementById('storFormCaptcha');
          if (captchaForm && captchaForm.classList.contains('show')) {
            params.jenis = 'captcha';
          } else if (bekasForm && bekasForm.classList.contains('show')) {
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
    window.apiRequest = async function(action, data, ...rest) {
      if (action === 'createStor' && data && typeof data === 'object') {
        // Jika data.jenis belum diisi, set berdasarkan form yang aktif
        if (!data.jenis) {
          // FIX: ikut cek form Biasa & Old juga (sebelumnya cuma Fresh/Bekas)
          const freshForm = document.getElementById('storFormFresh');
          const bekasForm = document.getElementById('storFormBekas');
          const biasaForm = document.getElementById('storFormBiasa');
          const oldForm = document.getElementById('storFormOld');
          const captchaForm = document.getElementById('storFormCaptcha');
          if (captchaForm && captchaForm.classList.contains('show')) {
            data.jenis = 'captcha';
          } else if (bekasForm && bekasForm.classList.contains('show')) {
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
      return originalApiRequest(action, data, ...rest);
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
      // Gmail Fresh Generate (jenis storan baru)
      settings.depositGenStatus   = window.appState.settings.depositGenStatus || settings.depositGenStatus || 'OPEN';
      settings.depositGenPrice    = window.appState.settings.depositGenPrice || settings.depositGenPrice || 0;
      settings.depositGenName     = window.appState.settings.depositGenName || settings.depositGenName || 'Gmail Fresh Generate';
      settings.depositGenInfo     = window.appState.settings.depositGenInfo || settings.depositGenInfo || '';
      // Gmail Captcha (jenis storan baru)
      settings.depositCaptchaStatus = window.appState.settings.depositCaptchaStatus || settings.depositCaptchaStatus || 'OPEN';
      settings.depositCaptchaPrice  = window.appState.settings.depositCaptchaPrice || settings.depositCaptchaPrice || 2000;
      settings.depositCaptchaName   = window.appState.settings.depositCaptchaName || settings.depositCaptchaName || 'Gmail Captcha';
      settings.depositCaptchaInfo   = window.appState.settings.depositCaptchaInfo || settings.depositCaptchaInfo || '';
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
    if (!settings.depositCaptchaStatus) {
      settings.depositCaptchaStatus = localStorage.getItem('depositCaptchaStatus') || 'OPEN';
    }
    if (!settings.depositCaptchaPrice) {
      settings.depositCaptchaPrice = parseInt(localStorage.getItem('depositCaptchaPrice')) || 2000;
    }
    if (!settings.depositCaptchaName) {
      settings.depositCaptchaName = localStorage.getItem('depositCaptchaName') || 'Gmail Captcha';
    }
    if (!settings.depositCaptchaInfo) {
      settings.depositCaptchaInfo = localStorage.getItem('depositCaptchaInfo') || '';
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
      // FIX: dulu penutup paksa 4 detik ini mematikan SIAPA PUN loading yang
      // sedang tampil -- termasuk loading "Login..." milik login berikutnya
      // kalau user keluar-masuk cepat (login dalam 4 detik setelah logout),
      // sehingga amplop hilang padahal login belum selesai. Sekarang hanya
      // menutup kalau loading yang tampil masih milik proses logout ini.
      let mySeq = null;
      const forceHide = function() {
        try {
          if (mySeq === null || window.__loadingSeq === mySeq) hideLoading();
        } catch (_) {}
      };
      let result;
      try {
        result = originalConfirmLogout.apply(this, args);
        // showLoading('Logout...') dipanggil sinkron di awal confirmLogout()
        mySeq = window.__loadingSeq;
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
    try { tryLinkPendingReferral(); } catch (_) {}
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
// Teks keterangan bawaan database (bukan password) tidak boleh tampil di kolom "Password Hari Ini".
const STOR_INFO_BUKAN_PASSWORD = ['bekas biasa, tanpa 2fa', 'akun lama, sudah lama dibuat'];
// Password bawaan lama "murah123" dianggap kosong (password diatur dari dasbor admin).
function cleanPass(v) {
  const s = String(v == null ? '' : v).trim();
  return s.toLowerCase() === 'murah123' ? '' : s;
}
function getPasswordHariIni(info) {
  const v = cleanPass(info);
  if (!v || STOR_INFO_BUKAN_PASSWORD.indexOf(v.toLowerCase()) !== -1) return '';
  return v;
}

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
    const overallOpen = (freshOpen || bekasOpen ||
      settings.depositBiasaStatus === 'OPEN' ||
      settings.depositOldStatus === 'OPEN' ||
      settings.depositCaptchaStatus === 'OPEN');
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
    if (pass) pass.textContent = cleanPass(settings.depositInfo);
    const storPass = safeGet('storPassword');
    if (storPass) storPass.value = cleanPass(settings.depositInfo);
    // Kolom "Password Hari Ini" (hanya untuk dilihat) = password yang diset admin di dashboard.
    // Password yang dikirim ke server per-email tetap yang ditaruh user di samping emailnya.
    const storBekasPass = safeGet('storBekasPassword');
    if (storBekasPass) storBekasPass.value = getPasswordHariIni(settings.depositBekasInfo);
    const storBiasaPass = safeGet('storBiasaPassword');
    if (storBiasaPass) storBiasaPass.value = getPasswordHariIni(settings.depositBiasaInfo);
    const storOldPass = safeGet('storOldPassword');
    if (storOldPass) storOldPass.value = getPasswordHariIni(settings.depositOldInfo);
    const storCaptchaPass = safeGet('storCaptchaPassword');
    if (storCaptchaPass) storCaptchaPass.value = getPasswordHariIni(settings.depositCaptchaInfo);
    const storGenPass = safeGet('storGenPassword');
    if (storGenPass) storGenPass.value = getPasswordHariIni(getStorGenConfig().info);
    if (typeof genRefreshPassword === 'function') genRefreshPassword();

    // Rules
    const rs = safeGet('rulesStatusStoran');
    if (rs) {
      const freshLabel = settings.depositStatus || 'OPEN';
      const bekasLabel = settings.depositBekasStatus || 'OPEN';
      rs.innerHTML = `Fresh: <span class="${freshLabel==='OPEN'?'success':'danger'}">${freshLabel}</span> | Bekas: <span class="${bekasLabel==='OPEN'?'success':'danger'}">${bekasLabel}</span>`;
    }
    // Status Biasa / Old / Captcha di halaman Rules (badge sama seperti Fresh & Bekas)
    [
      { id: 'rulesStatusBiasa', st: settings.depositBiasaStatus },
      { id: 'rulesStatusOld', st: settings.depositOldStatus },
      { id: 'rulesStatusCaptcha', st: settings.depositCaptchaStatus }
    ].forEach(function(r) {
      const el = safeGet(r.id);
      if (!el) return;
      const st = r.st || 'OPEN';
      el.textContent = st;
      el.className = 'badge-status ' + (st === 'OPEN' ? 'open' : 'close');
    });
    const rp = safeGet('rulesStatusPenarikan');
    // FIX: dulu className ditimpa jadi 'success'/'danger' sehingga badge Penarikan di Rules
    // kehilangan gaya OPEN/CLOSE seperti status lainnya.
    if (rp) { rp.textContent = settings.withdrawStatus || 'OPEN';
      rp.className = 'badge-status ' + ((settings.withdrawStatus || 'OPEN') === 'OPEN' ? 'open' : 'close'); }

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
    const privateBadge = isPrivate ? '<span style="background:rgba(28,79,209,0.10);color:var(--blue-bright);font-size:9px;padding:2px 8px;border-radius:99px;margin-left:6px;font-weight:600;">PRIVATE</span>' : '';
    return `
      <div class="inbox-msg" style="background:var(--bg-card-alt);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:8px;border:1px solid var(--border-subtle);transition:all 0.2s;display:flex;justify-content:space-between;align-items:center;" onclick="openMessageNotifByIndex(${idx})">
        <div>
          <div style="font-weight:700;color:var(--text-primary);">${escapeHtml(m.title||'Pesan')} ${privateBadge}</div>
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
  const sorted = allMsgs.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const msg = sorted[index];
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
  const dt = safeGet('berandaStatDitolak');
  if (dt) dt.textContent = mine.filter(h => h.status === 'ditolak').length;
  const t = safeGet('berandaStatTotal');
  if (t) t.textContent = total;
  updatePendingSaldo();
}

// ============================================================
// SALDO PENDING (di dalam banner saldo, di bawah saldo utama)
// Jumlah nilai semua setoran milik user yang masih berstatus
// 'pending'. Otomatis naik saat user stor lagi, dan turun saat
// setoran diterima (pindah ke saldo utama) atau ditolak.
// Nilai per setoran: pakai nominal yang tersimpan di data riwayat
// kalau ada, kalau tidak dihitung jumlah email x harga per email
// sesuai jenis storannya.
// ============================================================
function getPendingRatePerItem(h, settings) {
  const own = [h.price, h.rate, h.harga, h.pricePerItem, h.pricePerEmail, h.hargaSatuan];
  for (let i = 0; i < own.length; i++) {
    const n = Number(own[i]);
    if (isFinite(n) && n > 0) return n;
  }
  const jenis = String(h.jenis || h.type || 'fresh').toLowerCase();
  if (jenis === 'bekas') return Number(settings.depositBekasPrice) || 0;
  if (jenis === 'biasa') return Number(settings.depositBiasaPrice) || 0;
  if (jenis === 'old') return Number(settings.depositOldPrice) || 0;
  if (jenis === 'captcha') return Number(settings.depositCaptchaPrice) || 0;
  if (jenis === 'generate') return Number(settings.depositGenPrice) || Number(settings.depositPrice) || 0;
  return Number(settings.depositPrice) || 0;
}

function calcPendingSaldo() {
  const user = getCurrentUser();
  if (!user) return 0;
  const settings = loadSettings() || {};
  const mine = (appState.history || []).filter(h => h.userId === user.id && h.status === 'pending');
  let total = 0;
  mine.forEach(function (h) {
    const items = Number(h.items) || 0;
    const value = items * getPendingRatePerItem(h, settings);
    total += value;
  });
  return total;
}

function updatePendingSaldo() {
  try {
    const el = safeGet('berandaSaldoPendingValue');
    if (!el) return;
    el.textContent = 'Rp' + formatRupiah(calcPendingSaldo());
  } catch (e) {
    console.warn('updatePendingSaldo error:', e);
  }
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

    if (page === 'referral') loadReferral();

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
const STOR_FORM_IDS = ['storFormFresh', 'storFormBekas', 'storFormBiasa', 'storFormOld', 'storFormCaptcha', 'storFormGen'];

function showStorChoice() {
  // Keluar dari form Generate lewat jalur mana pun (Kembali / tombol back HP): reset tugas
  // supaya saat masuk lagi tampil "Cara kerja" dari awal.
  try { if (typeof genCurrent !== 'undefined' && genCurrent && typeof genCancel === 'function') genCancel(); } catch (_) {}
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

// Jenis storan baru: Gmail Captcha (pola sama seperti Bekas Biasa/Old)
function showCaptchaForm() {
  openStorForm('storFormCaptcha');
  updateCounterCaptcha();
  pushOverlayHistoryGuard();
}

// Gmail Fresh Generate
function showGenForm() {
  openStorForm('storFormGen');
  if (typeof genRestore === 'function') genRestore();
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
    info: settings.depositBiasaInfo || ''
  };
}
function getStorOldConfig() {
  const settings = loadSettings();
  return {
    status: settings.depositOldStatus || 'OPEN',
    name: settings.depositOldName || 'Gmail Bekas Old',
    price: settings.depositOldPrice || 2000,
    info: settings.depositOldInfo || ''
  };
}

function getStorCaptchaConfig() {
  const settings = loadSettings();
  return {
    status: settings.depositCaptchaStatus || 'OPEN',
    name: settings.depositCaptchaName || 'Gmail Captcha',
    price: settings.depositCaptchaPrice || 2000,
    info: settings.depositCaptchaInfo || ''
  };
}

// Gmail Fresh Generate: harga, status, nama & password diatur dari dasbor admin
// (kolom deposit_gen_* di tabel settings). Selama belum ada, harga & password
// ikut Gmail Fresh supaya menu tetap bisa dipakai.
function getStorGenConfig() {
  const settings = loadSettings();
  return {
    status: settings.depositStatus || 'OPEN',   // Generate ikut status Open/Close Fresh
    name: settings.depositGenName || 'Gmail Fresh Generate',
    price: settings.depositGenPrice || settings.depositPrice || 4000,
    info: getPasswordHariIni(settings.depositGenInfo) || cleanPass(settings.depositInfo) || ''
  };
}

function updateStorCards() {
  try {
    const settings = loadSettings();
    const freshStatus = settings.depositStatus || 'OPEN';
    const bekasStatus = settings.depositBekasStatus || 'OPEN';
    const freshName = settings.depositName || 'Gmail';
    // Nama kartu oranye WAJIB memuat "2FA" (nama dari server yang cuma "Gmail Bekas" otomatis jadi "Gmail Bekas 2FA")
    const bekasNameRaw = settings.depositBekasName || '';
    const bekasName = /2fa/i.test(bekasNameRaw) ? bekasNameRaw : 'Gmail Bekas 2FA';
    const freshPrice = settings.depositPrice || 4000;
    const bekasPrice = settings.depositBekasPrice || 3000;
    const freshInfo = cleanPass(settings.depositInfo);
    const bekasInfo = cleanPass(settings.depositBekasInfo);

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
      if (freshInfoEl) freshInfoEl.textContent = freshInfo || '-';
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
      if (bekasInfoEl) bekasInfoEl.textContent = bekasInfo || '-';
    }

    // Kartu Bekas Biasa & Bekas Old (settings dari database, lihat
    // getStorBiasaConfig() / getStorOldConfig() di atas)
    [
      { cfg: getStorBiasaConfig(), prefix: 'storCardBiasa', closedMsg: 'storBiasaClosedMsg' },
      { cfg: getStorOldConfig(), prefix: 'storCardOld', closedMsg: 'storOldClosedMsg' },
      { cfg: getStorCaptchaConfig(), prefix: 'storCardCaptcha', closedMsg: 'storCaptchaClosedMsg' },
      { cfg: getStorGenConfig(), prefix: 'storCardGen', closedMsg: 'storGenClosedMsg' }
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
      if (nameEl) nameEl.textContent = (item.prefix === 'storCardCaptcha') ? String(item.cfg.name).replace(/\bemail\b/i, 'Gmail') : item.cfg.name;
      if (infoEl) infoEl.textContent = getPasswordHariIni(item.cfg.info) || '-';
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
    const captchaCard = document.getElementById('storCardCaptcha');
    const backBtnCaptcha = document.getElementById('storBackBtnCaptcha');

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
          showErrorModal('Ditutup', 'Storan Bekas 2FA sedang ditutup oleh admin.', false);
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

    if (captchaCard) {
      captchaCard.addEventListener('click', function(e) {
        if (getStorCaptchaConfig().status !== 'OPEN') {
          showErrorModal('Ditutup', 'Storan Gmail Captcha sedang ditutup oleh admin.', false);
          return;
        }
        showCaptchaForm();
      });
    }
    if (backBtnCaptcha) {
      backBtnCaptcha.addEventListener('click', function(e) {
        confirmGoBackStor();
      });
    }

    const genCard = document.getElementById('storCardGen');
    const backBtnGen = document.getElementById('storBackBtnGen');
    if (genCard) {
      genCard.addEventListener('click', function(e) {
        if (getStorGenConfig().status !== 'OPEN') {
          showErrorModal('Ditutup', 'Storan Fresh Generate sedang ditutup oleh admin.', false);
          return;
        }
        showGenForm();
      });
    }
    if (backBtnGen) {
      backBtnGen.addEventListener('click', function(e) {
        confirmGoBackStor();
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
    const captchaInput = document.getElementById('storCaptchaInput');
    if (captchaInput) captchaInput.addEventListener('input', updateCounterCaptcha);

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
  counter.textContent = 'Terdeteksi: ' + countStorAccounts(input.value) + ' item';
}

function updateCounterOld() {
  const input = document.getElementById('storOldInput');
  const counter = document.getElementById('storOldCounter');
  if (!input || !counter) return;
  counter.textContent = 'Terdeteksi: ' + countStorAccounts(input.value) + ' item';
}

function updateCounterCaptcha() {
  const input = document.getElementById('storCaptchaInput');
  const counter = document.getElementById('storCaptchaCounter');
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
  fresh:   { password: 'storPassword',        input: 'storInput',        counter: updateCounterFresh,   submitBtn: 'storSubmitBtn' },
  bekas:   { password: 'storBekasPassword',   input: 'storBekasInput',   counter: updateCounterBekas,   submitBtn: 'storBekasSubmitBtn' },
  biasa:   { password: 'storBiasaPassword',   input: 'storBiasaInput',   counter: updateCounterBiasa,   submitBtn: 'storBiasaSubmitBtn' },
  old:     { password: 'storOldPassword',     input: 'storOldInput',     counter: updateCounterOld,     submitBtn: 'storOldSubmitBtn' },
  captcha: { password: 'storCaptchaPassword', input: 'storCaptchaInput', counter: updateCounterCaptcha, submitBtn: 'storCaptchaSubmitBtn' },
  generate: { password: 'storGenPassword',   input: 'storGenInput',     counter: function() {},        submitBtn: 'storGenDoneBtn' }
};
const STOR_TYPE_LABELS = { fresh: 'Fresh', bekas: 'Bekas 2FA', biasa: 'Bekas Biasa', old: 'Bekas Old', captcha: 'Gmail Captcha', generate: 'Fresh Generate' };

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
    else if (found === 'storFormCaptcha') type = 'captcha';
    else if (found === 'storFormGen') type = 'generate';
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
      showErrorModal('Ditutup', 'Storan Bekas 2FA sedang ditutup oleh admin.', false);
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
  } else if (type === 'generate') {
    if ((settings.depositStatus || 'OPEN') !== 'OPEN') {
      showErrorModal('Ditutup', 'Storan Fresh Generate sedang ditutup oleh admin.', false);
      return;
    }
  } else if (type === 'captcha') {
    if ((settings.depositCaptchaStatus || 'OPEN') !== 'OPEN') {
      showErrorModal('Ditutup', 'Storan Gmail Captcha sedang ditutup oleh admin.', false);
      return;
    }
  }

  const passwordEl = document.getElementById(fields.password);
  const inputEl = document.getElementById(fields.input);

  // Kolom kontak, nama, dan tanggal sudah dihapus dari form. Nilainya diisi
  // otomatis dari akun yang login supaya data ke server tetap lengkap.
  const kontakType = 'WA';
  const kontak = String(user.emailPhone || user.username || '-');
  const nama = String(user.fullname || user.username || 'User');
  const now0 = new Date();
  const tanggalStr = String(now0.getDate()).padStart(2, '0') + '/' + String(now0.getMonth() + 1).padStart(2, '0') + '/' + now0.getFullYear();
  const password = passwordEl ? passwordEl.value : '';
  const text = inputEl ? inputEl.value.trim() : '';

  if (!text) { showErrorModal('Gagal', 'Masukkan daftar email.'); return; }

  let lines = text.split('\n').map(s => s.trim()).filter(Boolean);

  if (type === 'fresh' || type === 'generate') {
    const invalid = lines.filter(e => !e.toLowerCase().endsWith('@gmail.com'));
    if (invalid.length > 0) { showErrorModal('Gagal', 'Semua harus @gmail.com: ' + invalid.join(', ')); return; }
    // FIX: tolak email berspasi / format rusak (sebelumnya cukup berakhiran @gmail.com)
    const badFmtFresh = lines.filter(e => !STOR_EMAIL_RE.test(e));
    if (badFmtFresh.length > 0) { showErrorModal('Gagal', 'Format email tidak valid (tanpa spasi, tulis satu email per baris): ' + badFmtFresh.join(', ')); return; }
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
  } else if (type === 'bekas') {
    // Bekas 2FA: format WAJIB sesuai rules, kalau beda sedikit pun ditolak dan
    // user dikasih tahu apa yang salah + cara memperbaikinya.
    const entries = text.split('\n')
      .map(function(s, i) { return { n: i + 1, v: normalizeStorLine(s) }; })
      .filter(function(e) { return e.v; });
    const problems = validateStorFormat(type, entries);
    if (problems.length > 0) { showStorFormatError(type, problems); return; }
    // Kirim versi yang sudah dirapikan (spasi tunggal, tanpa spasi tak terlihat)
    lines = entries.map(function(e) { return e.v; });
  } else if (type === 'biasa' || type === 'old') {
    // Bekas Biasa & Bekas Old: 1 akun = baris email+password lalu 5 baris kode
    // cadangan (4+4 angka). Tiap akun dikirim ke server sebagai 1 string
    // "email password kode1 kode2 ... kode5" supaya cara simpan di database tetap sama.
    const hasil = parseStorBlocks(text);
    if (hasil.problems.length > 0) { showStorFormatError(type, hasil.problems); return; }
    if (hasil.lines.length === 0) { showErrorModal('Gagal', 'Masukkan daftar email.'); return; }
    lines = hasil.lines;
  } else {
    // Captcha: sesuai Rules cukup alamat email saja (@gmail.com), satu per baris.
    // FIX: dulu teks apa pun (bahkan bukan email) bisa terkirim.
    const invalidCaptcha = lines.filter(e => !e.toLowerCase().endsWith('@gmail.com') || !STOR_EMAIL_RE.test(e));
    if (invalidCaptcha.length > 0) {
      showErrorModal('Gagal', 'Gmail Captcha hanya menerima alamat email @gmail.com saja, satu per baris (tanpa spasi/password): ' + invalidCaptcha.join(', '));
      return;
    }
  }

  // FIX: cegah email dobel dalam satu setoran untuk semua jenis (Fresh sudah punya cek sendiri)
  if (type !== 'fresh') {
    const seenAll = new Set();
    for (const ln of lines) {
      const key = ln.split(' ')[0].toLowerCase();
      if (seenAll.has(key)) { showErrorModal('Gagal', 'Duplikat: ' + ln.split(' ')[0]); return; }
      seenAll.add(key);
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
      password: password || '',
      emails: lines,
      tanggal: tanggalStr,
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
${(type === 'generate') ? `🧩 Jenis: Gmail Fresh Generate\n👤 Nama Akun: ${(typeof genCurrent !== 'undefined' && genCurrent) ? genCurrent.first + ' ' + genCurrent.last : '-'}\n🎂 Tahun Lahir: ${(typeof genCurrent !== 'undefined' && genCurrent) ? genCurrent.year : '-'}\n` : ''}${(type === 'fresh' || type === 'generate') ? `🔑 Password: ${password}\n` : ''}
📱 Kontak: ${kontakType} - ${kontak}
📅 Tanggal: ${tanggal}
🕒 Waktu: ${jam}
📋 Daftar Email:
${lines.join('\n')}`;

    sendTelegramMessage(TELEGRAM_BOT_TOKEN_STOR, TELEGRAM_CHAT_ID_STOR, textNotif);

    updatePaymentEstimate();
    openModal('modalStorSuccess');
    if (type === 'generate' && typeof onGenSubmitted === 'function') { try { onGenSubmitted(lines); } catch (_) {} }
    if (inputEl) inputEl.value = '';
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

// ============================================================
// ESTIMASI PAYMENT di popup "Setoran Berhasil"
// Tanggal dihitung otomatis dari hari ini: 24 jam = +1 hari,
// 48 jam = +2 hari, batas maksimal = +3 hari.
// ============================================================
function updatePaymentEstimate() {
  try {
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const text = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const el = document.getElementById('payEstDate' + i);
      if (el) el.textContent = text;
    }
  } catch (e) {
    console.warn('updatePaymentEstimate error:', e);
  }
}

function setTanggal() {
  setTanggalFresh();
}

function updateCounter() {
  updateCounterFresh();
}

// ============================================================
// VALIDASI FORMAT STORAN BEKAS 2FA & BEKAS BIASA (sesuai Rules)
//   Bekas 2FA   : email password 2fakey   (2fakey = 8 blok x 4 karakter)
//   Bekas Biasa : baris 1 = email password, lalu 5 baris kode cadangan (tiap baris 4 angka + 4 angka)
//   Bekas Old   : sama persis dengan Bekas Biasa
// Ubah angka di bawah kalau aturan berubah.
// ============================================================
const STOR_FORMAT = {
  key2faBlok: 8,        // jumlah blok 2FA key
  key2faPanjang: 4,     // panjang tiap blok 2FA key
  kodeJumlah: 5,        // jumlah kode cadangan (1 kode per baris)
  kodeBlok: 2,          // tiap kode terdiri dari 2 blok angka
  kodeBlokPanjang: 4    // tiap blok 4 angka (jadi 1 kode = "1234 5678")
};
const STOR_EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;

// Rapikan baris: buang spasi tak terlihat, spasi ganda/tab jadi 1 spasi
function normalizeStorLine(s) {
  return String(s || '').replace(/[\u200B-\u200D\u2060]/g, '').replace(/\s+/g, ' ').trim();
}

// entries: [{ n: nomorBaris, v: teksBaris }] -> [{ n, email, msgs: [..] }]
function validateStorFormat(type, entries) {
  const out = [];
  const K = STOR_FORMAT;
  entries.forEach(function(e) {
    const msgs = [];
    const tok = e.v.split(' ');
    const email = tok[0];
    const rest = tok.slice(2);

    if (!STOR_EMAIL_RE.test(email)) {
      msgs.push('Email "' + email + '" tidak valid. Perbaiki: tulis email lengkap, contoh nama@gmail.com.');
    }
    if (tok.length < 2) {
      msgs.push('Password belum ada. Perbaiki: tulis password setelah email, dipisah 1 spasi.');
    }

    if (type === 'bekas') {
      if (tok.length >= 2 && rest.length === 0) {
        msgs.push('2FA key belum ada. Perbaiki: tambahkan 2FA key (' + K.key2faBlok + ' blok x ' + K.key2faPanjang + ' karakter) setelah password.');
      } else if (rest.length > 0) {
        if (rest.length !== K.key2faBlok) {
          msgs.push('2FA key harus ' + K.key2faBlok + ' blok (tiap blok ' + K.key2faPanjang + ' karakter), sekarang ' + rest.length + ' blok. Perbaiki: pastikan email, password, 2FA key dipisah 1 spasi, password tanpa spasi, dan tidak ada blok kurang/lebih.');
        }
        rest.forEach(function(b, i) {
          if (msgs.length >= 4) return;
          if (b.length !== K.key2faPanjang) {
            msgs.push('Blok 2FA ke-' + (i + 1) + ' ("' + b + '") harus ' + K.key2faPanjang + ' karakter, sekarang ' + b.length + '. Perbaiki: cek lagi blok itu.');
          } else if (!/^[A-Za-z2-7]+$/.test(b)) {
            const bad = (b.match(/[^A-Za-z2-7]/g) || []).join(' ');
            msgs.push('Blok 2FA ke-' + (i + 1) + ' ("' + b + '") ada karakter tidak valid: ' + bad + '. Perbaiki: 2FA key hanya huruf a-z dan angka 2-7.');
          }
        });
      }
    }

    if (msgs.length > 0) out.push({ n: e.n, email: email, msgs: msgs });
  });
  return out;
}

// Bekas Biasa & Bekas Old: 1 akun = 1 blok baris
//   baris 1      : email password
//   baris 2 - 6  : 5 kode cadangan, 1 kode per baris, format "1234 5678"
// Email berikutnya langsung lanjut di baris bawahnya (tanpa baris kosong).
// Hasil: { lines: [satu string per akun], problems: [{ n, email, msgs }] }
function parseStorBlocks(text) {
  const K = STOR_FORMAT;
  const kodeRe = new RegExp('^\\d{' + K.kodeBlokPanjang + '} \\d{' + K.kodeBlokPanjang + '}$');
  const rows = String(text || '').split('\n')
    .map(function(s, i) { return { n: i + 1, v: normalizeStorLine(s) }; })
    .filter(function(r) { return r.v; });
  const blocks = [];
  const problems = [];
  let cur = null;
  rows.forEach(function(r) {
    const first = r.v.split(' ')[0];
    if (first.indexOf('@') !== -1) {
      cur = { n: r.n, head: r.v, codes: [] };
      blocks.push(cur);
    } else if (cur) {
      cur.codes.push(r);
    } else {
      problems.push({ n: r.n, email: '-', msgs: ['Baris ini ("' + r.v + '") tidak punya email di atasnya. Perbaiki: mulai dengan baris email dan password, baru kode cadangan di bawahnya.'] });
    }
  });
  const lines = [];
  blocks.forEach(function(bk) {
    const msgs = [];
    const tok = bk.head.split(' ');
    const email = tok[0];
    if (!STOR_EMAIL_RE.test(email)) {
      msgs.push('Email "' + email + '" tidak valid. Perbaiki: tulis email lengkap, contoh nama@gmail.com.');
    }
    if (tok.length < 2) {
      msgs.push('Password belum ada. Perbaiki: tulis password setelah email di baris pertama, dipisah 1 spasi.');
    } else if (tok.length > 2) {
      msgs.push('Baris pertama hanya boleh berisi email dan password (password tanpa spasi). Perbaiki: pindahkan kode cadangan ke baris di bawahnya, 1 kode per baris.');
    }
    bk.codes.forEach(function(c, i) {
      if (msgs.length >= 5) return;
      if (!kodeRe.test(c.v)) {
        msgs.push('Kode ke-' + (i + 1) + ' (baris ' + c.n + ': "' + c.v + '") salah format. Perbaiki: tiap baris harus ' + K.kodeBlokPanjang + ' angka + spasi + ' + K.kodeBlokPanjang + ' angka, contoh 4162 4359.');
      }
    });
    if (bk.codes.length !== K.kodeJumlah) {
      msgs.push('Jumlah kode cadangan harus ' + K.kodeJumlah + ', sekarang ' + bk.codes.length + '. Perbaiki: ' + (bk.codes.length < K.kodeJumlah ? 'tambahkan ' + (K.kodeJumlah - bk.codes.length) + ' kode lagi.' : 'kurangi ' + (bk.codes.length - K.kodeJumlah) + ' kode.'));
    }
    if (msgs.length > 0) {
      problems.push({ n: bk.n, email: email, msgs: msgs });
    } else {
      lines.push(bk.head + ' ' + bk.codes.map(function(c) { return c.v; }).join(' '));
    }
  });
  problems.sort(function(x, y) { return x.n - y.n; });
  return { lines: lines, problems: problems };
}

// Hitung jumlah akun (= jumlah baris email) untuk Bekas Biasa & Old
function countStorAccounts(text) {
  return String(text || '').split('\n').filter(function(s) {
    const f = normalizeStorLine(s).split(' ')[0];
    return f && f.indexOf('@') !== -1;
  }).length;
}

function showStorFormatError(type, problems) {
  const MAX_BARIS = 5;
  const contoh = (type === 'bekas')
    ? 'email password 2fakey\nContoh: jokopurworo@gmail.com gundulmu123 2n5a dzmc 6tiz av5l uzok vwwf mtit 7kyi'
    : 'baris 1 email + password, lalu 5 baris kode cadangan (4 angka + 4 angka)\nContoh:\njokokendi@gmail.com joko123\n4162 4359\n1739 3962\n1927 0875\n0785 9881\n9952 7681';
  let teks = 'Format belum sesuai rules, jadi belum bisa disetor. Perbaiki dulu:\n';
  problems.slice(0, MAX_BARIS).forEach(function(p) {
    teks += '\nBaris ' + p.n + ' (' + p.email + '):\n';
    p.msgs.forEach(function(m) { teks += '• ' + m + '\n'; });
  });
  if (problems.length > MAX_BARIS) {
    teks += '\n...dan ' + (problems.length - MAX_BARIS) + ' baris lain juga bermasalah.\n';
  }
  teks += '\nFormat yang benar: ' + contoh;
  const t = safeGet('errorTitle');
  const d = safeGet('errorDesc');
  if (t) t.textContent = 'Format Tidak Sesuai Rules';
  if (d) {
    d.textContent = teks;
    d.style.whiteSpace = 'pre-line';
    d.style.textAlign = 'left';
    d.style.maxHeight = '55vh';
    d.style.overflowY = 'auto';
  }
  openModal('modalError');
}

function showErrorModal(title, desc, showRulesHint) {
  const t = safeGet('errorTitle');
  const d = safeGet('errorDesc');
  if (t) t.textContent = title;
  // reset gaya khusus dari showStorFormatError supaya notif biasa tetap normal
  if (d) { d.style.whiteSpace = ''; d.style.textAlign = ''; d.style.maxHeight = ''; d.style.overflowY = ''; }
  if (d) d.textContent = (showRulesHint === false) ? desc : desc + ' Lihat rules.';
  openModal('modalError');
}

// ============================================================
// REFERAL
// Kode referal = ID numerik user (sama dengan ID di halaman Profil).
// Link = alamat web ini + ?ref=KODE. Kode dari link dipegang sementara di
// memori halaman (window.__pendingRef), tidak disimpan di browser.
// Bonus saldo diproses di server saat storan pertama user baru di-ACC.
// ============================================================
let referralData = null;

// Kode referal milik user disimpan & dibuat di Supabase (referral_get).
function getReferralCode() {
  return (referralData && referralData.code) ? String(referralData.code) : '';
}

function getReferralLink() {
  const code = getReferralCode();
  if (!code) return '';
  return location.origin + location.pathname + '?ref=' + encodeURIComponent(code);
}

// Hapus ?ref= dari alamat setelah kode terhubung
function stripRefFromUrl() {
  try {
    if (/[?&]ref=/i.test(location.search)) history.replaceState(history.state, '', location.pathname + location.hash);
  } catch (_) {}
}

// Saat daftar dengan kode referal (dari link atau diketik di form Daftar),
// dipanggil fungsi SQL register_user_ref. Kalau fungsi itu belum ada di
// database, otomatis memakai pendaftaran biasa supaya daftar tidak pernah rusak.
(function() {
  const originalApiRequest = window.apiRequest;
  if (typeof originalApiRequest !== 'function') return;
  window.apiRequest = async function(action, data, ...rest) {
    if (action === 'register' && data && typeof data === 'object') {
      let code = '';
      try {
        const inputEl = document.getElementById('regReferral');
        const typed = inputEl ? inputEl.value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) : '';
        code = typed || window.__pendingRef || '';
      } catch (_) {}

      if (code && typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.rpc) {
        const username = String(data.username || '').trim();
        const emailPhone = String(data.emailPhone || data.email || data.email_phone || '').trim();
        const password = String(data.password || '');
        const { data: json, error } = await supabaseClient.rpc('register_user_ref', {
          p_username: username,
          p_email_phone: emailPhone,
          p_password: password,
          p_referral_code: code
        });
        if (error) {
          // fungsi belum ada di database -> pakai daftar biasa
          if (/register_user_ref|schema cache|could not find/i.test(error.message || '')) {
            return originalApiRequest(action, data, ...rest);
          }
          throw new Error(error.message || 'Gagal mendaftar.');
        }
        window.__pendingRef = '';
        stripRefFromUrl();
        return json;
      }
    }
    return originalApiRequest(action, data, ...rest);
  };
})();

// Daftarkan 2 aksi baru ke ACTION_MAP (nama fungsi RPC di Supabase:
// referral_get dan referral_link; parameter p_token + p_code).
(function() {
  try {
    if (typeof ACTION_MAP === 'object' && ACTION_MAP) {
      if (!ACTION_MAP.getReferral) ACTION_MAP.getReferral = { fn: 'referral_get', needsToken: true, params: function() { return {}; } };
      if (!ACTION_MAP.linkReferral) ACTION_MAP.linkReferral = { fn: 'referral_link', needsToken: true, params: function(d) { return { p_code: String((d && d.code) || '') }; } };
    }
  } catch (e) { console.warn('ACTION_MAP referal gagal:', e); }
})();

function isReferralNetworkError(e) {
  return /timeout|koneksi|network|fetch|failed to/i.test((e && e.message) || '');
}

// User yang sudah login membuka link referal -> hubungkan ke server.
let referralLinkBusy = false;
async function tryLinkPendingReferral() {
  if (referralLinkBusy || !getToken()) return;
  const code = window.__pendingRef || '';
  if (!code) return;
  referralLinkBusy = true;
  try {
    await apiRequest('linkReferral', { code: code });
    window.__pendingRef = '';
    stripRefFromUrl();
    referralData = null;
    showToast('success', 'Referal Terhubung', 'Kode referal berhasil dihubungkan.');
  } catch (e) {
    if (!isReferralNetworkError(e)) {
      window.__pendingRef = '';
      stripRefFromUrl();
      if (!/Aksi tidak dikenal|function|schema cache/i.test(e.message || '')) showToast('error', 'Referal', e.message);
    }
  } finally {
    referralLinkBusy = false;
  }
}

// Hubungkan kode referal lewat kolom di menu Referal
async function submitReferralCode() {
  const input = safeGet('refEnterInput');
  const code = input ? input.value.replace(/[^A-Za-z0-9_-]/g, '').trim() : '';
  if (!code) { showToast('error', 'Gagal', 'Masukkan kode referal dulu.'); return; }
  showLoading('Menghubungkan...');
  try {
    await apiRequest('linkReferral', { code: code });
    window.__pendingRef = '';
    stripRefFromUrl();
    if (input) input.value = '';
    showToast('success', 'Berhasil', 'Kode referal berhasil dihubungkan.');
    referralData = null;
    await loadReferral();
  } catch (e) {
    showToast('error', 'Gagal', e.message);
  } finally {
    hideLoading();
  }
}

async function loadReferral() {
  renderReferral(referralData);
  try {
    const res = await apiRequest('getReferral', {});
    referralData = (res && (res.data || res)) || null;
  } catch (e) {
    console.warn('getReferral error:', e);
  }
  renderReferral(referralData);
}

function renderReferral(d) {
  try {
    d = d || {};
    const codeEl = safeGet('refCodeInput');
    const linkEl = safeGet('refLinkInput');
    if (codeEl) codeEl.value = getReferralCode();
    if (linkEl) linkEl.value = getReferralLink();

    const list = Array.isArray(d.list) ? d.list : [];
    const balance = Number(d.balance) || 0;
    const done = (d.totalRewarded != null) ? Number(d.totalRewarded) : list.filter(function(x) { return x && x.rewarded; }).length;
    const balEl = safeGet('refBalance');
    if (balEl) balEl.innerHTML = '<span class="currency">Rp</span>' + formatRupiah(balance);
    const doneEl = safeGet('refCountDone');
    if (doneEl) doneEl.textContent = done;
    const bonusEl = safeGet('refBonus');
    const bonusVal = Number(d.bonusPerEmail != null ? d.bonusPerEmail : d.bonusPerUser) || 0;
    if (bonusEl) bonusEl.textContent = (bonusVal > 0) ? ('Rp' + formatRupiah(bonusVal)) : '-';
    const enterCard = safeGet('refEnterCard');
    if (enterCard) enterCard.style.display = (d.linked || d.referredBy) ? 'none' : 'block';
    const cntEl = safeGet('refListCount');
    if (cntEl) cntEl.textContent = list.length;

    const box = safeGet('refUserList');
    if (!box) return;
    if (list.length === 0) {
      box.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-user-plus"></i></div><p>Belum ada yang daftar lewat link kamu.</p></div>';
      return;
    }
    box.innerHTML = list.map(function(u) {
      const name = (u && (u.fullname || u.name || u.username)) || 'User';
      let avHtml = '', avStyle = '';
      try {
        const av = buildAvatarVisual({ id: u.id, avatar: u.avatar, fullname: name, username: u.username || name });
        avHtml = av.contentHtml; avStyle = av.styleAttr;
      } catch (_) {
        avHtml = escapeHtml(String(name).charAt(0).toUpperCase());
      }
      const ok = (u && u.rewarded) ? '<i class="fas fa-circle-check ref-user-ok"></i>' : '';
      return '<div class="ref-user"><div class="user-avatar ref-av" style="' + avStyle + '">' + avHtml + '</div>' +
             '<div class="ref-user-name">' + escapeHtml(name) + '</div>' + ok + '</div>';
    }).join('');
  } catch (e) {
    console.warn('renderReferral error:', e);
  }
}

function copyReferral(kind) {
  const text = (kind === 'code') ? (safeGet('refCodeInput') || {}).value : (safeGet('refLinkInput') || {}).value;
  if (!text) return;
  const done = function() { showToast('success', 'Tersalin', (kind === 'code' ? 'Kode' : 'Link') + ' referal berhasil disalin.'); };
  const fallback = function() {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (_) { showToast('error', 'Gagal', 'Tidak bisa menyalin, salin manual ya.'); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

function shareReferral() {
  const link = getReferralLink();
  if (!link) return;
  const msg = 'Gabung S3L GM4IL 06 lewat link referal aku ya: ' + link;
  if (navigator.share) {
    navigator.share({ title: 'S3L GM4IL 06', text: msg, url: link }).catch(function() {});
  } else {
    copyReferral('link');
  }
}


// ============================================================
// MAINTENANCE (sisi user)
// - Admin menyalakan maintenance dari dasbor (panel_set_maintenance).
// - User yang BELUM centang biru ditutup oleh layar maintenance.
// - User centang biru tetap bisa masuk (hanya muncul info kecil).
// Supabase: fungsi RPC "user_get_maintenance" (p_token) -> { enabled, message, verified }
// Kalau fungsi belum dipasang, web tetap normal (tidak menutup siapa pun).
// ============================================================
(function() {
  try {
    if (typeof ACTION_MAP === 'object' && ACTION_MAP && !ACTION_MAP.getMaintenance) {
      ACTION_MAP.getMaintenance = { fn: 'user_get_maintenance', needsToken: true, params: function() { return {}; } };
    }
  } catch (e) { console.warn('ACTION_MAP maintenance gagal:', e); }
})();

const MT_DEFAULT_MSG = 'Website sedang kami tingkatkan agar lebih cepat dan nyaman. Mohon tunggu sebentar.';
let mtBusy = false;
let mtBlockedNow = false;

function mtPick(o, a, b, fallback) {
  if (o && o[a] !== undefined && o[a] !== null) return o[a];
  if (o && o[b] !== undefined && o[b] !== null) return o[b];
  return fallback;
}

function mtRender(enabled, message, verified) {
  const ov = document.getElementById('mtOverlay');
  if (!ov) return;
  const blocked = !!enabled && !verified;
  const msg = document.getElementById('mtMsg');
  if (msg) msg.textContent = (message && String(message).trim()) || MT_DEFAULT_MSG;
  ov.classList.toggle('show', blocked);
  document.documentElement.classList.toggle('mt-locked', blocked);
  const app = document.getElementById('appPage');
  if (app) { try { app.inert = blocked; } catch (_) {} }
  const pill = document.getElementById('mtVipPill');
  if (pill) {
    const showPill = !!enabled && !!verified;
    if (showPill && !mtVipShown) { pill.classList.remove('show'); void pill.offsetWidth; pill.classList.add('show'); mtVipShown = true; }
    if (!showPill) { pill.classList.remove('show'); mtVipShown = false; }
  }
  mtBlockedNow = blocked;
}
let mtVipShown = false;

async function checkMaintenance(manual) {
  if (mtBusy) return;
  const btn = document.getElementById('mtRetryBtn');
  // Belum login -> tidak ada yang ditutup (halaman login tetap bisa dibuka).
  if (typeof getToken !== 'function' || !getToken()) { mtRender(false, '', true); return; }
  mtBusy = true;
  if (manual && btn) { btn.disabled = true; btn.classList.add('is-busy'); }
  try {
    const res = await apiRequest('getMaintenance', {});
    const r = (res && (res.data || res.settings)) || res || {};
    const enabled = !!mtPick(r, 'enabled', 'maintenance', false);
    const message = mtPick(r, 'message', 'maintenanceMessage', '') || '';
    let verified;
    if (typeof r.verified === 'boolean') verified = r.verified;
    else { try { const u = getCurrentUser(); verified = !!(u && u.verified); } catch (_) { verified = false; } }
    mtRender(enabled, message, verified);
    if (manual && enabled && !verified && typeof showToast === 'function') {
      showToast('info', 'Masih Maintenance', 'Silakan coba lagi beberapa saat lagi.');
    }
  } catch (e) {
    const m = String((e && e.message) || '');
    // Fungsi Supabase belum dipasang -> jangan tutup website.
    if (/could not find the function|does not exist|schema cache|PGRST202|404|belum dipasang/i.test(m)) {
      mtRender(false, '', true);
    } else {
      console.warn('checkMaintenance gagal:', m);
    }
  } finally {
    mtBusy = false;
    if (btn) { btn.disabled = false; btn.classList.remove('is-busy'); }
  }
}

// Cek saat masuk app (login / sesi dipulihkan).
(function() {
  const orig = window.enterApp;
  if (typeof orig === 'function') {
    window.enterApp = function() {
      const r = orig.apply(this, arguments);
      try { checkMaintenance(false); } catch (_) {}
      return r;
    };
  }
})();

// Cek berkala + saat tab kembali aktif, supaya layar hilang/muncul otomatis.
setInterval(function() { if (!document.hidden) checkMaintenance(false); }, 20000);
document.addEventListener('visibilitychange', function() { if (!document.hidden) checkMaintenance(false); });
window.addEventListener('load', function() { setTimeout(function() { checkMaintenance(false); }, 1500); });

// ============================================================
// CENTANG BIRU (verified) — tampilan baru, lurus sejajar dengan nama.
// Syarat tampil tetap memakai fungsi lama (buildVerifiedBadgeHtml dari
// core.js): kalau fungsi lama bilang user tidak terverifikasi, tetap kosong.
// Hanya bentuk/posisi ikonnya yang diganti jadi segel biru + centang putih.
// ============================================================
(function() {
  const orig = window.buildVerifiedBadgeHtml;
  if (typeof orig !== 'function') return;
  const SEAL = '12.00,1.80 14.23,3.69 17.10,3.17 18.08,5.92 20.83,6.90 20.31,9.77 22.20,12.00 20.31,14.23 20.83,17.10 18.08,18.08 17.10,20.83 14.23,20.31 12.00,22.20 9.77,20.31 6.90,20.83 5.92,18.08 3.17,17.10 3.69,14.23 1.80,12.00 3.69,9.77 3.17,6.90 5.92,5.92 6.90,3.17 9.77,3.69';
  const BADGE = '<span class="vbadge" title="Akun Terverifikasi" aria-label="Akun Terverifikasi">' +
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    '<polygon points="' + SEAL + '" fill="#1D9BF0" stroke="#1D9BF0" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M7.6 12.4l3 3 5.9-6.3" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg></span>';
  window.buildVerifiedBadgeHtml = function() {
    const html = orig.apply(this, arguments);
    if (!html || !String(html).trim()) return html;
    return BADGE;
  };
})();

// ============================================================
// TEKS POPUP SELAMAT DATANG — nama selalu mengikuti akun yang login.
// ============================================================
(function() {
  const DESC = '<strong>Selamat datang di S3L GM4IL 06</strong><br>Saatnya manfaatkan email yang kamu punya untuk menghasilkan cuan. Setor Gmail dengan mudah, pantau saldo secara real-time, dan dapatkan pembayaran dengan proses yang jelas.';
  let applying = false;

  function applyWelcomeText() {
    if (applying) return;
    const t = document.getElementById('welcomeTitle');
    const d = document.getElementById('welcomeDesc');
    if (!t) return;
    let user = null;
    try { user = getCurrentUser(); } catch (_) {}
    let name = user ? String(user.fullname || user.username || '') : '';
    if (!name) {
      const m = /Selamat Datang,?\s*(.+?)\s*!/i.exec(t.textContent || '');
      name = m ? m[1] : '';
    }
    if (!name) return;
    let badge = '';
    try { badge = user ? (buildVerifiedBadgeHtml(user) || '') : ''; } catch (_) {}
    const html = '<span class="wl-eyebrow">Selamat Datang</span><span class="wl-name">' + escapeHtml(name) + badge + '</span>';
    applying = true;
    try {
      // Pakai penanda (bukan membandingkan innerHTML, karena browser menulis ulang
      // HTML-nya) supaya tidak terjadi perulangan tak berujung.
      const key = name + '|' + (badge ? '1' : '0');
      if (t.dataset.wlKey !== key || !t.querySelector('.wl-eyebrow')) {
        t.innerHTML = html;
        t.dataset.wlKey = key;
      }
      if (d && d.dataset.wlSet !== '1') { d.innerHTML = DESC; d.dataset.wlSet = '1'; }
    } finally {
      applying = false;
    }
  }

  function init() {
    const toast = document.getElementById('welcomeToast');
    const title = document.getElementById('welcomeTitle');
    if (!toast || !title) return;
    try {
      new MutationObserver(applyWelcomeText).observe(toast, { attributes: true, attributeFilter: ['class'] });
      new MutationObserver(applyWelcomeText).observe(title, { childList: true, characterData: true, subtree: true });
    } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


// ============================================================
// GMAIL FRESH GENERATE
// Sistem membuatkan nama orang + email otomatis (aturan sama seperti Gmail
// Fresh). Email yang sudah di-Done disimpan dan TIDAK akan dibuat lagi.
// ============================================================
const GEN_USED_KEY = 's3l_gen_used_emails';
const GEN_CURRENT_KEY = 's3l_gen_current';
const GEN_FORBIDDEN = ['janda', 'mewing', 'imut', 'cantik', 'ganteng', 'bohay', 'icibos', 'anjing', 'kucing', 'hamster', 'babi', 'ayam'];
const GEN_FIRST_M = ['Ahmad','Budi','Dedi','Eko','Fajar','Gilang','Hendra','Irfan','Joko','Kevin','Lukman','Nanda','Putra','Rizky','Satria','Taufik','Vino','Wahyu','Yoga','Zaki','Andi','Bagas','Dimas','Farhan','Galih','Hadi','Ilham','Reza','Rangga','Aldi','Rafli','Bayu','Dani','Fikri','Guntur','Heru','Indra','Johan','Krisna','Lutfi','Naufal','Panji','Rendi','Surya','Tegar','Wawan','Yusuf','Arif','Bima','Cahyo','Fauzan','Haikal','Ridwan','Syahrul','Alvin','Adit','Rahmat','Abdul'];
const GEN_LAST_M = ['Pratama','Saputra','Wijaya','Kusuma','Santoso','Hidayat','Nugroho','Setiawan','Ramadhan','Permana','Firmansyah','Wibowo','Susanto','Hakim','Maulana','Syahputra','Rahman','Hartono','Utomo','Lesmana','Gunawan','Purnama','Anggara','Kurniawan','Prasetyo','Hermawan','Fauzi','Ardiansyah','Mahendra','Cahyono','Suryanto','Aditya','Pramana','Sulistyo','Hariyanto'];
const GEN_FIRST_F = ['Siti','Dewi','Ayu','Rina','Sari','Wulan','Putri','Fitri','Indah','Maya','Novi','Anisa','Bella','Citra','Dina','Eka','Fani','Gita','Hana','Intan','Jihan','Kirana','Lia','Mega','Nadia','Rani','Salsa','Tiara','Vera','Winda','Yuni','Zahra','Amel','Bunga','Cindy','Devi','Elsa','Feby','Gina','Hesti','Ika','Juwita','Karin','Laila','Melati','Nisa','Rizka','Syifa','Nabila','Aulia'];
const GEN_LAST_F = ['Lestari','Wulandari','Puspita','Anggraini','Safitri','Maharani','Oktaviani','Handayani','Permata','Kartika','Amelia','Febrianti','Damayanti','Rachmawati','Yulianti','Susilowati','Saputri','Pratiwi','Rahmawati','Kusuma','Wijayanti','Purnamasari','Nuraini','Fitriani','Octaviani'];

// Tambahan nama supaya variasi email jauh lebih banyak (lebih kecil kemungkinan sudah dipakai di Google)
GEN_FIRST_M.push('Alvin','Bagas','Candra','Daffa','Evan','Farhan','Galih','Haikal','Ilham','Jovan','Krisna','Langit','Mahesa','Naufal','Oka','Panji','Raka','Surya','Tegar','Ucok','Wildan','Yusuf','Arif','Bayu','Cahyo','Dimas','Erlangga','Fikri','Gading','Hafiz');
GEN_LAST_M.push('Aditya','Prasetyo','Kurniawan','Utomo','Hartono','Pranoto','Mahendra','Purnomo','Sutrisno','Wardana','Nasution','Siregar','Harahap','Lubis','Simanjuntak','Gunawan','Rahardjo','Suryadi','Budiman','Cahyono');
GEN_FIRST_F.push('Alya','Bunga','Clarissa','Dinda','Elsa','Fara','Greta','Helena','Imelda','Jasmine','Keisha','Laras','Mutiara','Nabila','Olivia','Prisca','Qonita','Rara','Salsa','Tiara','Ulfa','Vania','Winda','Yuni','Zahra','Amanda','Bianca','Cindy','Dewi','Ervina');
GEN_LAST_F.push('Rahayu','Ningsih','Susanti','Kusumawati','Purnama','Utami','Fitriani','Agustina','Pertiwi','Larasati','Salsabila','Maulida','Nuraini','Sulistyowati','Hapsari','Andini','Nugraheni','Rosmala','Anjani','Cahyani');
let genCurrent = null;       // { first, last, email, year }
let genSeen = {};            // email yang sudah tampil di sesi ini
let genConfirmTimer = null;

function genRand(n) { return Math.floor(Math.random() * n); }
function genPick(arr) { return arr[genRand(arr.length)]; }

function genLoadUsed() {
  try {
    const arr = JSON.parse(localStorage.getItem(GEN_USED_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}
function genSaveUsed(arr) {
  try { localStorage.setItem(GEN_USED_KEY, JSON.stringify(arr.slice(-5000))); } catch (_) {}
}
// Semua email yang pernah disetor akun ini (dari riwayat) + yang sudah di-Done di perangkat ini
function genUsedSet() {
  const set = {};
  genLoadUsed().forEach(function(e) { set[String(e).toLowerCase()] = 1; });
  try {
    const hist = (window.appState && window.appState.history) || (typeof appState !== 'undefined' && appState.history) || [];
    hist.forEach(function(it) {
      let list = [];
      if (Array.isArray(it.emails)) list = it.emails;
      else if (typeof it.emails === 'string') list = it.emails.split('\n');
      list.forEach(function(x) {
        const first = String(x || '').trim().split(' ')[0].toLowerCase();
        if (first) set[first] = 1;
      });
    });
  } catch (_) {}
  return set;
}

// Cek aturan yang sama dengan validasi Gmail Fresh
function genLocalOk(local) {
  if (local.length < 6 || local.length > 26) return false;
  if ((local.match(/\d/g) || []).length > 2) return false;
  if (!/^[a-z]+\d{0,2}$/.test(local)) return false;     // angka hanya di belakang, tanpa huruf setelah angka
  if (/(.)\1\1/.test(local)) return false;               // huruf kembar 3x
  if ((local.match(/(.)\1/g) || []).length > 2) return false; // huruf double terlalu banyak
  for (let i = 0; i < GEN_FORBIDDEN.length; i++) if (local.indexOf(GEN_FORBIDDEN[i]) !== -1) return false;
  return true;
}

function genRandomDigits() {
  // 2 digit, tidak berurutan (12, 21, ...) dan tidak kembar (11, 22, ...)
  for (let k = 0; k < 50; k++) {
    const n = 13 + genRand(86);               // 13..98
    const a = Math.floor(n / 10), b = n % 10;
    if (a === b || Math.abs(a - b) === 1) continue;
    return String(n);
  }
  return '47';
}

function genMakeOne() {
  const female = Math.random() < 0.5;
  const firstPool = female ? GEN_FIRST_F : GEN_FIRST_M;
  const first = genPick(firstPool);
  let lastName = genPick(female ? GEN_LAST_F : GEN_LAST_M);
  let middle = '';
  if (Math.random() < 0.75) {
    for (let i = 0; i < 10; i++) {
      const m = genPick(firstPool);
      if (m !== first) { middle = m; break; }
    }
  }
  // Nama tengah dimasukkan ke kolom "Nama belakang" (contoh: Dimas | Arya Nugroho)
  const last = middle ? (middle + ' ' + lastName) : lastName;
  // Angka di belakang boleh tidak ada, 1 digit, atau 2 digit (maksimal 2)
  const r = Math.random();
  const digits = r < 0.35 ? '' : (r < 0.5 ? String(2 + genRand(8)) : genRandomDigits());
  const local = (first + middle + lastName).toLowerCase() + digits;
  return { first: first, last: last, local: local, email: local + '@gmail.com', year: 1999 + genRand(2) };   // tahun lahir 1999 atau 2000
}

// Kumpulkan beberapa calon email yang BELUM pernah di-Done / belum tampil di sesi ini
function genCandidates(n) {
  const used = genUsedSet();
  const out = [];
  const inOut = {};
  for (let i = 0; i < 600 && out.length < n; i++) {
    const t = genMakeOne();
    const key = t.email.toLowerCase();
    if (!genLocalOk(t.local)) continue;
    if (used[key] || genSeen[key] || inOut[key]) continue;
    inOut[key] = 1;
    out.push({ first: t.first, last: t.last, email: t.email, year: t.year });
  }
  return out;
}

// Tanya server email mana yang sudah pernah disetor siapa pun (fungsi gen_check_emails).
// Kalau server belum siap / gagal, dilewati dan cukup cek lokal saja.
async function genServerTaken(emails) {
  try {
    if (typeof supabaseClient === 'undefined' || !supabaseClient || !getToken()) return [];
    const res = await supabaseClient.rpc('gen_check_emails', { p_token: getToken(), p_emails: emails });
    const d = res && res.data;
    if (d && d.success !== false && d.data && Array.isArray(d.data.taken)) {
      return d.data.taken.map(function(e) { return String(e).toLowerCase(); });
    }
  } catch (_) {}
  return [];
}

// Buat email baru yang belum pernah dipakai
async function genNewTask() {
  for (let round = 0; round < 3; round++) {
    const cands = genCandidates(8);
    if (!cands.length) return null;
    const taken = await genServerTaken(cands.map(function(c) { return c.email; }));
    if (taken.length) {
      const used = genLoadUsed();
      taken.forEach(function(e) { if (used.indexOf(e) === -1) used.push(e); genSeen[e] = 1; });
      genSaveUsed(used);
    }
    const ok = cands.filter(function(c) { return taken.indexOf(c.email.toLowerCase()) === -1; });
    if (ok.length) { genSeen[ok[0].email.toLowerCase()] = 1; return ok[0]; }
  }
  return null;
}

function genPasswordNow() {
  const el = document.getElementById('storGenPassword');
  return el ? String(el.value || '') : '';
}

function genSaveCurrent() {
  try {
    if (genCurrent) localStorage.setItem(GEN_CURRENT_KEY, JSON.stringify(genCurrent));
    else localStorage.removeItem(GEN_CURRENT_KEY);
  } catch (_) {}
}

function genResetDoneBtn() {
  if (genConfirmTimer) { clearTimeout(genConfirmTimer); genConfirmTimer = null; }
  const t = document.getElementById('storGenDoneText');
  if (t) t.innerHTML = '<i class="fas fa-circle-check"></i> Done, Kirim Setoran';
}

function genRender() {
  const idle = document.getElementById('storGenIdle');
  const task = document.getElementById('storGenTask');
  if (!idle || !task) return;
  genResetDoneBtn();
  const explainBox = document.getElementById('genExplainBox');
  const passGroup = document.getElementById('genPassGroup');
  if (!genCurrent) {
    idle.style.display = '';
    task.style.display = 'none';
    if (explainBox) explainBox.style.display = '';
    if (passGroup) passGroup.style.display = '';
    return;
  }
  idle.style.display = 'none';
  task.style.display = '';
  // Saat tugas berjalan: Cara kerja & kolom Password disembunyikan, format salin tampil di atas
  if (explainBox) explainBox.style.display = 'none';
  if (passGroup) passGroup.style.display = 'none';
  try { const f = document.getElementById('storFormGen'); if (f) f.scrollTop = 0; } catch (_) {}
  const set = function(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('genFirst', genCurrent.first);
  set('genLast', genCurrent.last);
  set('genEmail', genCurrent.email);
  set('genYear', String(genCurrent.year));
  set('genPass', genPasswordNow() || '-');
}

function genRefreshPassword() {
  const el = document.getElementById('genPass');
  if (el && genCurrent) el.textContent = genPasswordNow() || '-';
}

// Dipanggil saat form dibuka: lanjutkan tugas yang belum selesai (kalau ada)
function genRestore() {
  genCurrent = null;
  try {
    const raw = localStorage.getItem(GEN_CURRENT_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.email && c.first && !genUsedSet()[String(c.email).toLowerCase()]) {
        genCurrent = c;
        genSeen[String(c.email).toLowerCase()] = 1;
      }
    }
  } catch (_) {}
  if (!genCurrent) genSaveCurrent();
  genRender();
}

async function genStart() {
  const cfg = getStorGenConfig();
  if (cfg.status !== 'OPEN') { showErrorModal('Ditutup', 'Storan Fresh Generate sedang ditutup oleh admin.', false); return; }
  if (!genPasswordNow()) { showErrorModal('Belum Siap', 'Password hari ini belum diatur oleh admin. Coba lagi nanti.', false); return; }
  const btn = document.getElementById('storGenStartBtn');
  if (btn) btn.disabled = true;
  try {
    const t = await genNewTask();
    if (!t) { showErrorModal('Gagal', 'Gagal membuat email baru. Coba tekan Mulai lagi.', false); return; }
    genCurrent = t;
    genSaveCurrent();
    genRender();
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function genChange() {
  const btn = document.getElementById('genChangeBtn');
  if (btn) btn.disabled = true;
  try {
    // Email yang diganti berarti tidak bisa dipakai: simpan supaya tidak muncul lagi
    if (genCurrent && genCurrent.email) {
      const usedNow = genLoadUsed();
      const oldMail = String(genCurrent.email).toLowerCase();
      if (usedNow.indexOf(oldMail) === -1) { usedNow.push(oldMail); genSaveUsed(usedNow); }
      genSeen[oldMail] = 1;
    }
    const t = await genNewTask();
    if (!t) { showErrorModal('Gagal', 'Gagal membuat email baru. Coba lagi.', false); return; }
    genCurrent = t;
    genSaveCurrent();
    genRender();
    showToast('success', 'Email diganti', 'Data akun baru sudah dibuat.');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function genCancel() {
  genCurrent = null;
  genSaveCurrent();
  genRender();
}

function genCopy(which) {
  if (!genCurrent) return;
  const map = { first: genCurrent.first, last: genCurrent.last, email: String(genCurrent.email).replace(/@gmail\.com$/i, ''), pass: genPasswordNow() };
  const text = String(map[which] || '');
  if (!text) return;
  const done = function() { showToast('success', 'Tersalin', 'Berhasil disalin.'); };
  const fallback = function() {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (_) { showToast('error', 'Gagal', 'Tidak bisa menyalin, salin manual ya.'); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
}

// Done: tekan 2x (konfirmasi) supaya tidak kepencet. Setoran lewat submitStor('generate')
async function genDone() {
  if (!genCurrent) return;
  if (!genConfirmTimer) {
    const t = document.getElementById('storGenDoneText');
    if (t) t.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Yakin akun sudah jadi? Tap lagi untuk kirim';
    genConfirmTimer = setTimeout(genResetDoneBtn, 5000);
    return;
  }
  genResetDoneBtn();
  const input = document.getElementById('storGenInput');
  if (input) input.value = genCurrent.email;
  await submitStor('generate');
  if (input && genCurrent && input.value) input.value = '';
}

// Dipanggil submitStor setelah setoran berhasil: tandai email sudah dipakai
function onGenSubmitted(lines) {
  const used = genLoadUsed();
  (lines || []).forEach(function(l) {
    const e = String(l || '').trim().split(' ')[0].toLowerCase();
    if (e && used.indexOf(e) === -1) used.push(e);
  });
  genSaveUsed(used);
  genCurrent = null;
  genSaveCurrent();
  genRender();
}
