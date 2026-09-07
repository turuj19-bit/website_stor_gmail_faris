// init.js — Inisialisasi saat DOMContentLoaded (dijalankan paling akhir)

    // ============================================================
    // INIT
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
      const chatContainer = document.getElementById('chatMessagesContainer');
      if (chatContainer) {
        chatContainer.addEventListener('scroll', updateChatScrollButtonVisibility);
      }
      window.addEventListener('resize', function() {
        const btn = document.getElementById('chatScrollBottomBtn');
        if (btn && btn.classList.contains('show')) positionChatScrollBtn();
      });
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('GANTI_DENGAN') || SUPABASE_ANON_KEY.includes('GANTI_DENGAN')) {
        alert('⚠️ Konfigurasi Supabase belum diisi! Isi SUPABASE_URL dan SUPABASE_ANON_KEY pada js/config.js dengan kredensial Supabase yang benar.');
      }
      switchAuthTab('login');
      switchRiwayatTab('storan');
      setMusicVisibility(false);

      // ============================================================
      // RESUME SESI SAAT HALAMAN DI-REFRESH/DIBUKA ULANG
      // PERBAIKAN: sebelumnya, kalau refreshAppState() gagal SEKALI SAJA
      // (misalnya karena internet lambat/putus sesaat saat refresh),
      // kode lama langsung clearToken() -> user ke-logout paksa walau
      // sesinya sebenarnya masih sah. Sekarang:
      // - Kalau refreshAppState() gagal karena sesi memang tidak valid,
      //   refreshAppState() sendiri yang sudah menghapus token (lihat
      //   core.js) -> user tetap di halaman login, itu memang benar.
      // - Kalau gagal cuma karena jaringan/timeout, token TIDAK dihapus,
      //   dan interval di bawah akan otomatis coba lagi tiap 2 detik
      //   sampai berhasil, baru user dimasukkan ke aplikasi -- tanpa
      //   perlu login ulang. Loading overlay tetap tampil selama proses
      //   ini supaya user tahu sedang dimuat, bukan logout.
      // - Menu/halaman terakhir yang dibuka (Beranda/Stor/Riwayat/dll)
      //   ikut dipulihkan lewat getSavedPage(), tidak selalu balik ke
      //   Beranda.
      // ============================================================
      let appEntered = false;
      function tryEnterAppIfNeeded() {
        if (appEntered) return;
        if (getCurrentUser()) {
          appEntered = true;
          hideLoading();
          enterApp();
          updateUIApp();
          showPage(getSavedPage());
        }
      }

      if (getToken()) {
        showLoading('Memuat sesi...');
        refreshAppState().then(() => {
          tryEnterAppIfNeeded();
          // Kalau belum berhasil masuk di sini (jaringan lambat), JANGAN
          // sembunyikan loading & JANGAN hapus token -- biarkan interval
          // di bawah yang melanjutkan retry secara diam-diam.
          if (!appEntered && !getToken()) {
            // Token sudah dihapus sendiri oleh refreshAppState() karena
            // memang sesi tidak valid -- baru di sini boleh berhenti.
            hideLoading();
            document.documentElement.classList.remove('has-session');
          }
        });
      }

      let banCheckTick = 0;
      setInterval(async () => {
        if (getToken()) {
          const ok = await refreshAppState();
          if (ok) tryEnterAppIfNeeded();
          banCheckTick++;
          if (banCheckTick % 7 === 0) await enforceBanCheck();
        } else if (!appEntered) {
          // Token memang sudah tidak ada (sesi invalid/logout) -- pastikan
          // loading tidak tertahan selamanya.
          hideLoading();
          document.documentElement.classList.remove('has-session');
        }
      }, 2000);
    });
