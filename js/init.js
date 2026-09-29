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
      // true selama loading yang tampil adalah loading "Memuat sesi..." milik resume sesi
      let resumingSession = !!getToken();
      function tryEnterAppIfNeeded() {
        if (appEntered) return;
        if (getCurrentUser()) {
          appEntered = true;
          hideLoading();
          // Lepas paksaan "sembunyikan authPage" -- mulai dari sini,
          // tampil/sembunyinya authPage & appPage sepenuhnya diatur oleh
          // enterApp()/logout seperti biasa, supaya nanti kalau user
          // logout, authPage bisa muncul kembali secara normal.
          document.documentElement.classList.remove('has-session');
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

      // ============================================================
      // v1.1 — HEMAT KUOTA: dulu refreshAppState() (ambil SEMUA data akun)
      // dipanggil tiap 2 detik terus-menerus. Sekarang:
      // - Selama belum masuk aplikasi (retry sesi) tetap cepat tiap 2 detik,
      //   sama seperti sebelumnya.
      // - Setelah masuk, refresh data cuma tiap REFRESH_EVERY_MS, dan
      //   dihentikan saat tab tidak sedang dilihat (document.hidden).
      // - Begitu tab dibuka lagi, data langsung disegarkan sekali.
      // - Tidak ada permintaan yang menumpuk (tickBusy).
      // Cek banned (enforceBanCheck) tetap kira-kira tiap 14 detik seperti
      // sebelumnya selama tab terlihat.
      // ============================================================
      const REFRESH_EVERY_MS = 25000;
      const BANCHECK_EVERY_MS = 14000;
      let lastRefreshAt = Date.now();
      let lastBanCheckAt = Date.now();
      let tickBusy = false;

      async function appTick(force) {
        if (tickBusy) return;
        tickBusy = true;
        try {
          if (getToken()) {
            const due = !appEntered || force === true || (Date.now() - lastRefreshAt >= REFRESH_EVERY_MS);
            if (due && (!document.hidden || !appEntered)) {
              lastRefreshAt = Date.now();
              const ok = await refreshAppState();
              if (ok) tryEnterAppIfNeeded();
            }
            if (!document.hidden && Date.now() - lastBanCheckAt >= BANCHECK_EVERY_MS) {
              lastBanCheckAt = Date.now();
              await enforceBanCheck();
            }
          } else if (!appEntered && resumingSession) {
            // Token memang sudah tidak ada (sesi invalid/logout) -- pastikan
            // loading "Memuat sesi..." tidak tertahan selamanya.
            // FIX: dulu cabang ini TANPA syarat resumingSession, jadi tiap 2
            // detik (selama belum masuk app & belum ada token) loading ikut
            // dimatikan -- termasuk loading "Login..." yang sedang berjalan
            // (token baru ada SETELAH login sukses). Akibatnya kalau login
            // butuh > 2 detik, amplop loading hilang padahal proses belum
            // selesai. Sekarang hanya dimatikan kalau loading itu memang
            // milik proses resume sesi.
            resumingSession = false;
            hideLoading();
            document.documentElement.classList.remove('has-session');
          }
        } finally {
          tickBusy = false;
        }
      }

      setInterval(appTick, 2000);
      document.addEventListener('visibilitychange', function() {
        if (!document.hidden && getToken()) appTick(true);
      });
    });
