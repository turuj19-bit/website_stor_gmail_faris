// withdrawal.js — Tarik saldo, fee, e-wallet, render riwayat penarikan & pendapatan

    // ============================================================
    // TARIK SALDO (UPDATED)
    // ============================================================
    const EWALLET_STORAGE_KEY = 'saved_ewallet_data';

    function loadSavedEwallet() {
      try {
        const data = localStorage.getItem(EWALLET_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
      } catch { return null; }
    }

    function saveEwalletData(metode, akun) {
      try {
        localStorage.setItem(EWALLET_STORAGE_KEY, JSON.stringify({ metode, akun }));
      } catch {}
    }

    function clearEwalletData() {
      try {
        localStorage.removeItem(EWALLET_STORAGE_KEY);
      } catch {}
    }

    function fillSavedEwallet() {
      const saved = loadSavedEwallet();
      if (saved) {
        const metodeSelect = safeGet('tarikMetode');
        const akunInput = safeGet('tarikAkun');
        if (metodeSelect && saved.metode) {
          const options = metodeSelect.options;
          for (let i = 0; i < options.length; i++) {
            if (options[i].value === saved.metode) {
              metodeSelect.selectedIndex = i;
              break;
            }
          }
        }
        if (akunInput && saved.akun) {
          akunInput.value = saved.akun;
        }
        const check = safeGet('saveEwalletCheck');
        if (check) check.checked = true;
      } else {
        const check = safeGet('saveEwalletCheck');
        if (check) check.checked = true;
      }
    }

    function resetTarikSaldoModal() {
      const nominalInput = safeGet('tarikNominal');
      if (nominalInput) nominalInput.value = '';
      updateFeeDisplay(0);
    }

    function formatRupiahInput(input) {
      let val = input.value.replace(/[^0-9]/g, '');
      if (val === '') { input.value = '';
        updateFeeDisplay(0); return; }
      const num = parseInt(val, 10) || 0;
      updateFeeDisplay(num);
      input.value = formatRupiah(num);
    }

    // ========== FUNGSI FEE & MINIMAL PER METODE ==========
    function getFeeByMetode(metode) {
      const map = {
        'DANA': 500,
        'ShopeePay': 500,
        'GoPay': 1000,
        'OVO': 1000
      };
      return map[metode] || 500;
    }

    function getMinimalByMetode(metode) {
      const map = {
        'DANA': 1500,
        'ShopeePay': 1500,
        'GoPay': 5000,
        'OVO': 11000
      };
      return map[metode] || 1500;
    }

    // ========== UPDATE FEE DISPLAY & KETERANGAN (FIX PERINGATAN) ==========
    function updateFeeDisplay(nominal) {
      const metode = safeGet('tarikMetode')?.value || 'DANA';
      const fee = getFeeByMetode(metode);
      const minimal = getMinimalByMetode(metode);
      const diterima = Math.max(0, nominal - fee);
      const user = getCurrentUser();
      const saldo = user ? (user.saldo || 0) : 0;

      const displayFee = safeGet('feeDisplay');
      const displayTotalBayar = safeGet('totalBayarDisplay');
      const displayDiterima = safeGet('danaDiterimaDisplay');
      const btn = safeGet('tarikSubmitBtn');
      const minimalInfo = safeGet('minimalInfo');

      // Update minimal info: selalu tampilkan teks statis, tambahkan peringatan hanya jika ada masalah
      if (minimalInfo) {
        let html = `Minimal penarikan ${metode} adalah <strong>Rp ${formatRupiah(minimal)}</strong>`;
        if (nominal > 0 && (nominal < minimal || nominal > saldo)) {
          let warning = '';
          if (nominal < minimal) {
            warning = `<span style="color:#EF4444;"> ⚠️ Nominal di bawah minimal!</span>`;
          } else if (nominal > saldo) {
            warning = `<span style="color:#EF4444;"> ⚠️ Saldo tidak cukup!</span>`;
          }
          html += ' — ' + warning;
          minimalInfo.style.color = '#EF4444';
        } else {
          // Tidak ada peringatan, warna normal
          minimalInfo.style.color = 'var(--text-secondary)';
        }
        minimalInfo.innerHTML = html;
      }

      // Tampilkan fee, nominal, dan dana diterima
      if (nominal === 0) {
        if (displayFee) displayFee.textContent = 'Rp ' + formatRupiah(fee);
        if (displayTotalBayar) displayTotalBayar.textContent = 'Rp 0';
        if (displayDiterima) displayDiterima.textContent = 'Rp 0';
        if (btn) btn.disabled = true;
        return;
      }

      if (displayFee) displayFee.textContent = 'Rp ' + formatRupiah(fee);
      if (displayTotalBayar) displayTotalBayar.textContent = 'Rp ' + formatRupiah(nominal);
      if (displayDiterima) displayDiterima.textContent = 'Rp ' + formatRupiah(diterima);

      if (btn) {
        btn.disabled = (nominal < minimal) || (nominal > saldo);
      }
    }

    // ========== HANDLE TARIK SALDO ==========
    async function handleTarikSaldo(e) {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) { showToast('error', 'Gagal', 'Anda harus login.'); return; }
      const settings = loadSettings();
      if (settings.withdrawStatus !== 'OPEN') { showToast('error', 'Ditutup', 'Penarikan sedang ditutup.'); return; }

      const nominalRaw = safeGet('tarikNominal')?.value || '0';
      const nominal = parseInt(nominalRaw.replace(/[^0-9]/g, ''), 10) || 0;
      const metode = safeGet('tarikMetode')?.value || 'DANA';
      const akun = safeGet('tarikAkun')?.value.trim() || '';
      const saveChecked = safeGet('saveEwalletCheck')?.checked || false;

      const fee = getFeeByMetode(metode);
      const minimal = getMinimalByMetode(metode);

      if (nominal < minimal) {
        showToast('error', 'Gagal', `Minimal penarikan ${metode} adalah Rp${formatRupiah(minimal)}.`);
        return;
      }
      if (nominal > (user.saldo || 0)) {
        showToast('error', 'Gagal', 'Saldo tidak cukup.');
        return;
      }
      if (!akun) {
        showToast('error', 'Gagal', 'Masukkan nomor tujuan.');
        return;
      }

      if (saveChecked) {
        saveEwalletData(metode, akun);
      } else {
        clearEwalletData();
      }

      const btn = safeGet('tarikSubmitBtn');
      if (btn) { btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'; }
      showLoading('Memproses penarikan...');
      try {
        const result = await apiRequest('createWithdrawal', { nominal, metode, akun });
        await refreshAppState();
        updateUIApp();
        showToast('success', 'Berhasil', `Penarikan Rp${formatRupiah(nominal)} (${metode}) berhasil.`);

        const now = new Date();
        const tgl = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const diterima = Math.max(0, nominal - fee);
        const text =
          `🔔 <b>PENARIKAN</b>\n👤 ${user.fullname||user.username}\n🆔 ID: ${user.id}\n💰 Nominal: Rp${formatRupiah(nominal)}\n💸 Fee: Rp${formatRupiah(fee)}\n📦 Diterima: Rp${formatRupiah(diterima)}\n🏦 Metode: ${metode}\n📱 Akun: ${akun}\n📅 Tanggal: ${tgl}\n🕒 Jam: ${jam}`;
        sendTelegramMessage(TELEGRAM_BOT_TOKEN_WITHDRAW, TELEGRAM_CHAT_ID_WITHDRAW, text);

        closeModal('modalTarikSaldo');
        resetTarikSaldoModal();
        renderWithdrawalList();
        renderPendapatanList();
        renderHistory();
      } catch (err) {
        console.error('Tarik saldo error:', err);
        showToast('error', 'Gagal', err.message || 'Terjadi kesalahan, coba lagi.');
      } finally {
        if (btn) { btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-arrow-down"></i> Tarik Saldo'; }
        hideLoading();
      }
    }

    // ============================================================
    // RENDER WITHDRAWAL & PENDAPATAN
    // ============================================================
    function renderWithdrawalList() {
      const container = safeGet('withdrawalList');
      if (!container) return;
      const data = appState.withdrawals || [];
      if (!getCurrentUser() || data.length === 0) {
        container.innerHTML =
          `<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><p>Belum ada riwayat penarikan.</p></div>`;
        return;
      }
      // Diurutkan EKSPLISIT berdasarkan tanggal terbaru (sama seperti Riwayat
      // Storan) -- sebelumnya di sini cuma .reverse() doang, yang cuma benar
      // KALAU KEBETULAN data dari server urutannya lama->baru. Begitu urutan
      // dari server berubah/beda, hasilnya malah kebalik (yang PENDING/baru
      // nongol di bawah, bukan di atas). Sort manual pakai tanggal asli
      // supaya urutannya selalu benar apa pun urutan datang datanya.
      container.innerHTML = data.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(w => {
        const nominal = typeof w.nominal === 'number' ? w.nominal : parseInt(w.nominal, 10) || 0;
        const fee = getFeeByMetode(w.metode || 'DANA');
        const diterima = Math.max(0, nominal - fee);
        const akun = w.akun ? String(w.akun) : '-';
        return `
        <div class="history-item" style="flex-direction:column;align-items:stretch;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:800;font-size:18px;color:var(--blue-bright);">Rp${formatRupiah(nominal)}</span>
            <span class="badge-status ${w.status||'pending'}">${(w.status||'pending').charAt(0).toUpperCase()+(w.status||'pending').slice(1)}</span>
          </div>
          <div style="color:var(--text-secondary);font-size:13px;">${w.metode||'DANA'} · ${sensorNomor(akun)}</div>
          <div style="color:var(--text-secondary);font-size:12px;">Fee: Rp${formatRupiah(fee)} · Diterima: Rp${formatRupiah(diterima)}</div>
          <div style="color:var(--text-secondary);font-size:12px;">${formatTime(w.date)}</div>
        </div>
      `}).join('');
    }

    function sensorNomor(str) {
      if (!str) return '-';
      const s = String(str).replace(/\s/g, '');
      if (s.length <= 4) return s;
      const first = s.slice(0, 2);
      const last = s.slice(-2);
      return first + '****' + last;
    }

    function renderPendapatanList() {
      const container = safeGet('pendapatanList');
      if (!container) return;
      const user = getCurrentUser();
      if (!user) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><p>Login dulu.</p></div>`;
        return;
      }
      let history = appState.saldoHistory || [];
      history = history.filter(h => {
        const note = (h.note || '').toLowerCase();
        return !note.includes('penarikan') && !note.includes('withdrawal') && (h.amount || 0) > 0;
      });

      if (history.length === 0) {
        container.innerHTML =
          `<div class="empty-state"><div class="empty-icon"><i class="fas fa-inbox"></i></div><p>Belum ada pendapatan.</p></div>`;
        return;
      }

      // Sama seperti perbaikan di Riwayat Penarikan: urutkan eksplisit
      // berdasarkan tanggal terbaru, bukan asal .reverse() array.
      container.innerHTML = history.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(h => {
        let amount = h.amount || 0;
        const note = h.note || '';
        const isStoran = note.toLowerCase().includes('storan gmail');
        if (isStoran) {
          const match = note.match(/(\d+)\s*email/);
          if (match) {
            const count = parseInt(match[1], 10) || 1;
            const rate = Number(appState.settings.depositPrice) || 4000;
            const expected = count * rate;
            if (amount === rate || amount !== expected) {
              amount = expected;
            }
          } else {
            const rate = Number(appState.settings.depositPrice) || 4000;
            if (amount === rate) {
              amount = rate;
            }
          }
        }
        return `
          <div class="history-item" style="flex-direction:column;align-items:stretch;gap:4px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:800;font-size:18px;color:#22C55E;">+Rp${formatRupiah(amount)}</span>
              <span class="badge-status diterima">Diterima</span>
            </div>
            <div style="color:var(--text-secondary);font-size:13px;">${h.note || '-'}</div>
            <div style="color:var(--text-secondary);font-size:12px;">${formatTime(h.date)}</div>
          </div>
        `;
      }).join('');
    }
