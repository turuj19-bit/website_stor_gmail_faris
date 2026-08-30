// core.js — State/helper global: session/token, apiRequest, musik, modal generik, utilitas (formatRupiah, formatTime, showToast)

    // ============================================================
    // SESSION & STATE
    // ============================================================
    const SESSION_KEY = 'storfaris_api_token';

    function getToken() { try { return localStorage.getItem(SESSION_KEY) || ''; } catch (_) { return ''; } }
    function setToken(t) { try { localStorage.setItem(SESSION_KEY, t || ''); } catch (_) {} }
    function clearToken() { try { localStorage.removeItem(SESSION_KEY); } catch (_) {} }

    const appState = {
      user: null,
      settings: { depositStatus: 'OPEN', depositPrice: 4000, depositInfo: 'murah123', withdrawStatus: 'OPEN' },
      history: [],
      withdrawals: [],
      inbox: [],
      saldoHistory: []
    };
    let historyDisplayLimit = 20;
    let historyFullData = [];
    let currentPage = 'beranda';
    let periodFilter = 'today';

    function getCurrentUser() { return appState.user; }
    function setCurrentUser(u) { appState.user = u; }
    function loadSettings() { return appState.settings; }
    function loadHistory() { return appState.history; }

    function getNumericId(uuid) {
      if (!uuid) return '00000000';
      let hash = 0;
      for (let i = 0; i < uuid.length; i++) {
        const char = uuid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const num = Math.abs(hash) % 100000000;
      return num.toString().padStart(8, '0');
    }

    function safeGet(id) {
      const el = document.getElementById(id);
      if (!el) console.warn('Element not found:', id);
      return el;
    }

    function showLoading(text = 'Memproses...') {
      const overlay = safeGet('loadingOverlay');
      const textEl = overlay?.querySelector('.loading-text');
      if (textEl) textEl.textContent = text;
      if (overlay) overlay.classList.add('show');
    }

    function hideLoading() {
      const overlay = safeGet('loadingOverlay');
      if (overlay) overlay.classList.remove('show');
    }

    // ============================================================
    // API REQUEST
    // ============================================================
    async function apiRequest(action, data = {}, authenticated = true, timeoutMs = 20000) {
      const map = ACTION_MAP[action];
      if (!map) throw new Error('Aksi tidak dikenal: ' + action);

      const params = map.params ? map.params(data) : {};
      if (map.needsToken) {
        const token = getToken();
        if (!token) throw new Error('Sesi tidak ditemukan, silakan login ulang.');
        params.p_token = token;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const { data: json, error } = await supabaseClient.rpc(map.fn, params, { signal: controller.signal });
        if (error) throw new Error(error.message || 'Server error.');
        if (!json || json.success === false) throw new Error(json?.message || 'Server error.');
        return json;
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('Koneksi timeout. Coba lagi.');
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }

    // ============================================================
    // REFRESH APP STATE
    // ============================================================
    async function refreshAppState() {
      if (!getToken()) return false;
      try {
        const result = await apiRequest('bootstrap');
        appState.user = result.data.user;
        appState.settings = result.data.settings || appState.settings;
        appState.history = Array.isArray(result.data.history) ? result.data.history : [];
        appState.withdrawals = Array.isArray(result.data.withdrawals) ? result.data.withdrawals : [];
        appState.inbox = Array.isArray(result.data.messages) ? result.data.messages : [];
        appState.saldoHistory = Array.isArray(result.data.saldoHistory) ? result.data.saldoHistory : [];
        historyFullData = [...appState.history];
        historyDisplayLimit = 20;
        updateUIApp();
        return true;
      } catch (e) {
        console.warn('Refresh gagal:', e.message);
        return false;
      }
    }

    async function sendTelegramMessage(token, chatId, text) {
      if (!token || !chatId) return;
      try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        });
      } catch (_) {}
    }

    // ============================================================
    // MUSIK
    // ============================================================
    const audio = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicToggle');
    const musicIcon = document.getElementById('musicIcon');
    let isMusicPlaying = false;

    function setMusicIconUI(playing) {
      if (playing) {
        musicBtn.classList.add('playing');
        if (musicIcon) { musicIcon.classList.remove('fa-play'); musicIcon.classList.add('fa-music'); }
      } else {
        musicBtn.classList.remove('playing');
        if (musicIcon) { musicIcon.classList.remove('fa-music'); musicIcon.classList.add('fa-play'); }
      }
    }

    function toggleMusic() {
      if (isMusicPlaying) {
        audio.pause();
        setMusicIconUI(false);
        isMusicPlaying = false;
      } else {
        audio.play().then(() => {
          setMusicIconUI(true);
          isMusicPlaying = true;
        }).catch(() => {
          setMusicIconUI(false);
          isMusicPlaying = false;
        });
      }
    }

    function setMusicVisibility(show) {
      if (show) {
        musicBtn.style.display = 'flex';
        if (!isMusicPlaying) {
          audio.play().then(() => {
            setMusicIconUI(true);
            isMusicPlaying = true;
          }).catch(() => {});
        }
      } else {
        musicBtn.style.display = 'none';
        if (isMusicPlaying) {
          audio.pause();
          setMusicIconUI(false);
          isMusicPlaying = false;
        }
      }
    }

    // Sembunyikan tombol musik sementara saat Chat Public dibuka (tanpa menghentikan musik)
    function hideMusicButtonForChat() {
      if (musicBtn) musicBtn.dataset.hiddenByChat = musicBtn.style.display !== 'none' ? '1' : '0';
      if (musicBtn) musicBtn.style.display = 'none';
    }
    function restoreMusicButtonAfterChat() {
      if (musicBtn && musicBtn.dataset.hiddenByChat === '1') {
        musicBtn.style.display = 'flex';
        delete musicBtn.dataset.hiddenByChat;
      }
    }

    // ===== Tombol musik bisa digeser (drag), otomatis nempel ke tepi kiri/kanan =====
    (function initMusicDrag() {
      if (!musicBtn) return;
      const THRESHOLD = 6;
      const EDGE_GAP = 12;
      let dragging = false, moved = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;

      function getPoint(e) {
        if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
      }

      function savePos(left, top) {
        try { localStorage.setItem('musicBtnPos', JSON.stringify({ left, top })); } catch (_) {}
      }

      function clampTop(top) {
        const maxTop = window.innerHeight - musicBtn.offsetHeight - EDGE_GAP;
        return Math.min(Math.max(EDGE_GAP, top), Math.max(EDGE_GAP, maxTop));
      }

      function applyPosFree(left, top) {
        const maxLeft = window.innerWidth - musicBtn.offsetWidth - EDGE_GAP;
        left = Math.min(Math.max(EDGE_GAP, left), Math.max(EDGE_GAP, maxLeft));
        top = clampTop(top);
        musicBtn.style.left = left + 'px';
        musicBtn.style.top = top + 'px';
        musicBtn.style.right = 'auto';
        musicBtn.style.bottom = 'auto';
      }

      // Nempel ke tepi kiri atau kanan terdekat (tidak boleh berhenti di tengah)
      function snapToEdge(top) {
        const rect = musicBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const snapLeft = centerX < window.innerWidth / 2
          ? EDGE_GAP
          : window.innerWidth - musicBtn.offsetWidth - EDGE_GAP;
        const snapTop = clampTop(top);
        musicBtn.style.transition = 'left 0.28s cubic-bezier(.34,1.56,.64,1), top 0.2s ease';
        musicBtn.style.left = snapLeft + 'px';
        musicBtn.style.top = snapTop + 'px';
        musicBtn.style.right = 'auto';
        musicBtn.style.bottom = 'auto';
        savePos(snapLeft, snapTop);
        setTimeout(() => { musicBtn.style.transition = 'box-shadow var(--transition), transform 0.15s'; }, 300);
      }

      // Pulihkan posisi tersimpan (langsung nempel ke tepi juga)
      try {
        const saved = JSON.parse(localStorage.getItem('musicBtnPos') || 'null');
        if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
          applyPosFree(saved.left, saved.top);
        }
      } catch (_) {}

      function onDown(e) {
        dragging = true; moved = false;
        const p = getPoint(e);
        startX = p.x; startY = p.y;
        const rect = musicBtn.getBoundingClientRect();
        origLeft = rect.left; origTop = rect.top;
        musicBtn.style.transition = 'none';
      }

      function onMove(e) {
        if (!dragging) return;
        const p = getPoint(e);
        const dx = p.x - startX;
        const dy = p.y - startY;
        if (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD) moved = true;
        if (moved) {
          if (e.cancelable) e.preventDefault();
          applyPosFree(origLeft + dx, origTop + dy);
        }
      }

      function onUp() {
        if (!dragging) return;
        dragging = false;
        if (moved) {
          const rect = musicBtn.getBoundingClientRect();
          snapToEdge(rect.top);
        }
      }

      musicBtn.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);

      musicBtn.addEventListener('click', function (e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
          return;
        }
        toggleMusic();
      });
    })();

    // ============================================================
    // MODAL
    // ============================================================
    function openModal(id) {
      const el = safeGet(id);
      if (el) { el.classList.add('open');
        document.body.style.overflow = 'hidden';
        pushOverlayHistoryGuard(); }
      if (id === 'modalTarikSaldo') {
        const user = getCurrentUser();
        if (user) {
          const display = safeGet('tarikSaldoDisplay');
          if (display) display.innerHTML =
            '<span style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-right:2px;">Rp</span>' +
            formatRupiah(user.saldo || 0);
        }
        updateFeeDisplay(0);
        fillSavedEwallet();
        // ===== PERBAIKAN: setelah mengisi ewallet, update fee =====
        onMetodeChange();
        resetTarikSaldoModal();
        const metodeSelect = safeGet('tarikMetode');
        if (metodeSelect) {
          metodeSelect.removeEventListener('change', onMetodeChange);
          metodeSelect.addEventListener('change', onMetodeChange);
        }
      }
      if (id === 'modalInbox') {
        markAllMessagesAsRead();
        renderInbox();
        updateInboxDot();
      }
      if (id === 'modalEditProfile') {
        renderAvatarPickerGrid();
        renderFramePickerGrid();
      }
    }

    function onMetodeChange() {
      const nominalRaw = safeGet('tarikNominal')?.value || '0';
      const nominal = parseInt(nominalRaw.replace(/[^0-9]/g, ''), 10) || 0;
      updateFeeDisplay(nominal);
    }

    function closeModal(id, fromPopState) {
      const el = safeGet(id);
      if (el) { el.classList.remove('open');
        document.body.style.overflow = ''; }
      if (id === 'modalTarikSaldo') {
        resetTarikSaldoModal();
        const metodeSelect = safeGet('tarikMetode');
        if (metodeSelect) {
          metodeSelect.removeEventListener('change', onMetodeChange);
        }
      }
      if (!fromPopState) popOverlayHistoryGuard();
    }

    document.querySelectorAll('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', function(e) { if (e.target === this) { this.classList.remove('open');
          document.body.style.overflow = '';
          popOverlayHistoryGuard();
          if (this.id === 'modalTarikSaldo') resetTarikSaldoModal(); } });
    });

    function showConfirmDelete() {
      const periodName = periodFilter === 'today' ? 'hari ini' : (periodFilter === '7days' ? '7 hari terakhir' :
        '1 bulan terakhir');
      const title = safeGet('confirmTitle');
      const desc = safeGet('confirmDesc');
      if (title) title.textContent = `Hapus Riwayat ${periodName}?`;
      if (desc) desc.textContent = `Yakin hapus riwayat ${periodName}? Tindakan tidak dapat dibatalkan.`;
      openModal('modalConfirmDelete');
    }

    async function executeDelete() {
      closeModal('modalConfirmDelete');
      const user = getCurrentUser();
      if (!user) { showToast('error', 'Gagal', 'Login dulu.');
        return; }
      let days = periodFilter === 'today' ? 1 : (periodFilter === '7days' ? 7 : 30);
      showLoading('Menghapus riwayat...');
      try {
        await apiRequest('deleteHistoryByPeriod', { days });
        await refreshAppState();
        showToast('success', 'Berhasil', 'Riwayat terhapus.');
        renderHistory();
        updateStats();
        updateStatsRiwayat();
        updateStatsBeranda();
        updateStatsStor();
      } catch (e) {
        showToast('error', 'Gagal', e.message);
      } finally {
        hideLoading();
      }
    }

    // ============================================================
    // UTILITY
    // ============================================================
    function formatRupiah(n) {
      if (n === undefined || n === null) return '0';
      let num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, '')) : n;
      if (isNaN(num) || !isFinite(num)) return '0';
      return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function formatTime(ts) {
      const d = new Date(ts);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d
        .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    function showToast(type, title, desc) {
      const container = safeGet('toastContainer');
      if (!container) return;
      const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML =
        `<span class="toast-icon ${type}"><i class="${icons[type] || icons.info}"></i></span><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-desc">${desc}</div></div>`;
      container.appendChild(toast);
      setTimeout(() => { toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300); }, 3000);
    }
