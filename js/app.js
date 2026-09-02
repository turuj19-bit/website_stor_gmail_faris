// app.js — Entry point app, update UI, inbox, stats, navigasi halaman, stor submit, tombol/gesture kembali HP

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
        updateStatus();
        updateHargaDisplay();
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

    function updateStatus() {
      const settings = loadSettings();
      const pen = safeGet('statusPenarikan');
      if (pen) pen.innerHTML =
        `<span class="badge-status ${settings.withdrawStatus==='OPEN'?'open':'close'}">${settings.withdrawStatus||'OPEN'}</span>`;
      const stor = safeGet('statusStoran');
      if (stor) stor.innerHTML =
        `<span class="badge-status ${settings.depositStatus==='OPEN'?'open':'close'}">${settings.depositStatus||'OPEN'}</span>`;
      const pass = safeGet('statusPass');
      if (pass) pass.textContent = settings.depositInfo || 'murah123';
      // Field password di halaman Stor sekarang ikut disinkronkan otomatis
      // dari pengaturan admin -- BUKAN lagi dropdown pilihan bebas milik
      // user, supaya tidak mungkin salah pilih password yang sedang tidak
      // aktif dipakai.
      const storPass = safeGet('storPassword');
      if (storPass) storPass.value = settings.depositInfo || 'murah123';
      const rate = safeGet('statusRate');
      if (rate) rate.textContent = 'Rp ' + formatRupiah(settings.depositPrice || 4000) + ' / email';

      const rs = safeGet('rulesStatusStoran');
      if (rs) { rs.textContent = settings.depositStatus || 'OPEN';
        rs.className = (settings.depositStatus === 'OPEN') ? 'success' : 'danger'; }
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

      // TOMBOL KEMBALI HP: kalau pindah ke menu selain beranda, simpan jejak
      // supaya tombol back HP kembali ke beranda, bukan keluar dari web.
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
            setTanggal();
            updateStatsStor();
            // ===== PERBAIKAN: update counter saat halaman stor ditampilkan =====
            updateCounter();
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
    // STOR SUBMIT
    // ============================================================
    function setTanggal() {
      const now = new Date();
      const el = safeGet('storTanggal');
      if (el) el.value = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') +
        '/' + now.getFullYear();
    }

    async function submitStor() {
      const user = getCurrentUser();
      if (!user) { showToast('error', 'Harap Login', 'Anda harus login.');
        return; }
      const settings = loadSettings();
      if (settings.depositStatus !== 'OPEN') {
        showToast('error', 'Ditutup', 'Storan sedang ditutup oleh admin.');
        return;
      }
      const kontakType = safeGet('storKontakType')?.value || 'WA';
      const kontak = safeGet('storKontak')?.value.trim() || '';
      const nama = safeGet('storNama')?.value.trim() || '';
      const password = safeGet('storPassword')?.value || 'murah123';
      const input = safeGet('storInput');
      const text = input ? input.value.trim() : '';
      if (!kontak || !nama) { showErrorModal('Data Tidak Lengkap', 'Isi kontak dan nama.'); return; }
      if (!text) { showErrorModal('Gagal', 'Masukkan daftar Gmail.'); return; }
      const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
      const invalid = lines.filter(e => !e.toLowerCase().endsWith('@gmail.com'));
      if (invalid.length > 0) { showErrorModal('Gagal', 'Semua harus @gmail.com: ' + invalid.join(', ')); return; }
      const forbidden = ['janda', 'mewing', 'imut', 'cantik', 'ganteng', 'bohay', 'icibos', 'anjing', 'kucing', 'hamster',
        'babi', 'ayam'
      ];
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
      const btn = safeGet('storSubmitBtn');
      if (btn) { btn.disabled = true;
        btn.classList.add('loading'); }
      showLoading('Mengirim setoran...');
      try {
        const result = await apiRequest('createStor', {
          kontakType,
          kontak,
          nama,
          password,
          emails: lines,
          tanggal: safeGet('storTanggal')?.value || ''
        });
        await refreshAppState();

        const now = new Date();
        const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const textNotif = `📩 STORAN GMAIL BARU
  👤 Nama: ${nama}
  🆔 ID User: ${user.id}
  📧 Jumlah: ${lines.length} email
  🔑 Password: ${password}
  📱 Kontak: ${kontakType} - ${kontak}
  📅 Tanggal: ${tanggal}
  🕒 Waktu: ${jam}
  📋 Daftar Email:
  ${lines.join('\n')}`;

        sendTelegramMessage(TELEGRAM_BOT_TOKEN_STOR, TELEGRAM_CHAT_ID_STOR, textNotif);

        openModal('modalStorSuccess');
        if (input) input.value = '';
        const kontakInput = safeGet('storKontak');
        if (kontakInput) kontakInput.value = '';
        const namaInput = safeGet('storNama');
        if (namaInput) namaInput.value = '';
        updateCounter();
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

    // ============================================================
    // COUNTER – PERBAIKAN: otomatis update saat mengetik
    // ============================================================
    function updateCounter() {
      const input = safeGet('storInput');
      const counter = safeGet('storCounter');
      if (!input || !counter) return;
      const lines = input.value.trim() ? input.value.split('\n').filter(s => s.trim().length > 0) : [];
      counter.textContent = 'Terdeteksi: ' + lines.length + ' item';
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
    // Ditambahkan saat menu/modal ditutup manual (tombol X, tombol Batal, klik
    // di luar modal, dll). Kita sendiri yang memicu history.back() di bawah
    // supaya riwayat browser tetap sinkron, tapi itu artinya event 'popstate'
    // akan ikut kepicu walau UI-nya sudah kita tutup duluan. Tanpa flag ini,
    // handler popstate di bawah akan mengira ini "tombol kembali HP" beneran
    // dan malah lempar balik ke halaman Beranda. Flag ini bikin popstate hasil
    // history.back() milik kita sendiri itu diabaikan sekali saja.
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
      // Panel emoji dicek DULUAN sebelum overlay chat: kalau lagi kebuka,
      // tombol/gesture kembali HP cukup nutup panel emoji-nya aja (balik ke
      // mode ngetik biasa), jangan langsung nendang keluar dari Chat Public.
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
      // TOMBOL KEMBALI HP di menu manapun (Riwayat, Stor, Rules, Peringkat, Profil, dll)
      // arahkan ke Beranda, jangan sampai keluar dari web.
      if (currentPage !== 'beranda') {
        if (overlayHistoryDepth > 0) overlayHistoryDepth--;
        showPage('beranda');
        return;
      }
    });
