// history.js — Riwayat storan & riwayat penarikan global

    // ============================================================
    // RIWAYAT STORAN
    // ============================================================
    function renderHistory() {
      const container = safeGet('historyList');
      if (!container) return;
      const user = getCurrentUser();
      if (!user) {
        container.innerHTML = '<div class="empty-state"><p>Login dulu.</p></div>';
        return;
      }
      let filtered = (appState.history || []).filter(h => h.userId === user.id);
      const search = safeGet('historySearch')?.value?.toLowerCase() || '';
      if (search) {
        filtered = filtered.filter(h =>
          h.id?.toLowerCase().includes(search) ||
          h.username?.toLowerCase().includes(search) ||
          (h.data && h.data.some(d => String(d).toLowerCase().includes(search)))
        );
      }
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      historyFullData = filtered;

      if (filtered.length === 0) {
        container.innerHTML =
          '<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><p>Tidak ada riwayat stor.</p></div>';
        const loadMore = safeGet('loadMoreBtn');
        if (loadMore) loadMore.style.display = 'none';
        return;
      }

      const display = filtered.slice(0, historyDisplayLimit);
      container.innerHTML = display.map(h => {
        const date = new Date(h.date);
        const dStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const tStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const last = h.lastEmail || (h.data && h.data.length ? h.data[h.data.length - 1] : '-');
        const status = h.status || 'pending';
        // Gunakan jumlah yang benar-benar diterima jika tersedia, fallback ke h.items untuk data lama
        const acceptedCount = (h.accepted !== undefined && h.accepted !== null) ? h.accepted :
                              (h.acceptedCount !== undefined && h.acceptedCount !== null) ? h.acceptedCount :
                              h.items;
        return `<div class="history-item">
          <div class="hi-left">
            <div class="hi-id">📩 Stor Gmail</div>
            <div class="hi-date">${dStr} · ${tStr}</div>
            <div class="hi-email">📧 ${last}</div>
          </div>
          <div class="hi-right">
            <span style="font-weight:700;">${acceptedCount}</span>
            <span class="badge-status ${status}">${status}</span>
          </div>
        </div>`;
      }).join('');

      const loadMore = safeGet('loadMoreBtn');
      if (loadMore) {
        if (filtered.length > historyDisplayLimit) {
          loadMore.style.display = 'block';
          loadMore.textContent = `Muat Lebih Banyak (${filtered.length - historyDisplayLimit} tersisa)`;
        } else {
          loadMore.style.display = 'none';
        }
      }
    }

    function loadMoreHistory() {
      historyDisplayLimit += 20;
      renderHistory();
    }

    // ============================================================
    // RIWAYAT PENARIKAN GLOBAL (SEMUA USER) -- tab "Global" di halaman
    // Riwayat. Beda dari renderWithdrawalList() yang cuma tampilkan punya
    // user yang lagi login, ini nampilin punya semua user (nominal +
    // username + waktu) supaya member bisa lihat aktivitas penarikan
    // komunitas tanpa perlu integrasi channel WA/Telegram.
    // ============================================================
    let globalWithdrawalsLoading = false;
    async function loadGlobalWithdrawalList() {
      if (globalWithdrawalsLoading) return;
      const container = safeGet('globalWithdrawalList');
      if (!container) return;
      globalWithdrawalsLoading = true;
      container.innerHTML =
        `<div class="empty-state"><div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div><p>Memuat data...</p></div>`;
      try {
        const result = await apiRequest('getPublicWithdrawals', { limit: 50 });
        const data = result.data || [];
        renderGlobalWithdrawalList(data);
      } catch (err) {
        console.error('Gagal memuat riwayat penarikan global:', err);
        container.innerHTML =
          `<div class="empty-state"><div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div><p>Gagal memuat data. Coba lagi.</p></div>`;
      } finally {
        globalWithdrawalsLoading = false;
      }
    }

    function renderGlobalWithdrawalList(data) {
      const container = safeGet('globalWithdrawalList');
      if (!container) return;
      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML =
          `<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><p>Belum ada data.</p></div>`;
        return;
      }
      container.innerHTML = data.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50).map(w => {
        const nominal = typeof w.nominal === 'number' ? w.nominal : parseInt(w.nominal, 10) || 0;
        const d = new Date(w.date);
        const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const waktu = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        return `
        <div class="receipt-card">
          <div class="receipt-header">🎉 PENARIKAN BERHASIL</div>
          <div class="receipt-body">
            <div class="receipt-row"><span class="r-icon">👤</span><span class="r-label">Nama User</span><span class="r-sep">:</span><span class="r-value">${w.username || 'User'}</span></div>
            <div class="receipt-row"><span class="r-icon">💰</span><span class="r-label">Nominal</span><span class="r-sep">:</span><span class="r-value r-nominal">Rp${formatRupiah(nominal)}</span></div>
            <div class="receipt-row"><span class="r-icon">🏦</span><span class="r-label">Metode</span><span class="r-sep">:</span><span class="r-value">${w.metode || '-'}</span></div>
            <div class="receipt-row"><span class="r-icon">📅</span><span class="r-label">Tanggal</span><span class="r-sep">:</span><span class="r-value">${tanggal}</span></div>
            <div class="receipt-row"><span class="r-icon">⏰</span><span class="r-label">Waktu</span><span class="r-sep">:</span><span class="r-value">${waktu}</span></div>
            <div class="receipt-row"><span class="r-icon">🔖</span><span class="r-label">ID Transaksi</span><span class="r-sep">:</span><span class="r-value">${w.id || '-'}</span></div>
            <div class="receipt-row"><span class="r-icon">✅</span><span class="r-label">Status</span><span class="r-sep">:</span><span class="r-value r-status">Berhasil</span></div>
          </div>
        </div>
      `}).join('');
    }