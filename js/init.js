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
      if (SUPABASE_URL.includes('GANTI_DENGAN') || SUPABASE_ANON_KEY.includes('GANTI_DENGAN')) {
        alert('⚠️ Konfigurasi Supabase belum diisi! Buka file index.html dan ganti SUPABASE_URL dan SUPABASE_ANON_KEY dengan kredensial nyata dari dashboard Supabase.');
      }
      switchAuthTab('login');
      switchRiwayatTab('storan');
      setMusicVisibility(false);
      if (getToken()) {
        refreshAppState().then(() => {
          if (getCurrentUser()) {
            enterApp();
            updateUIApp();
            showPage('beranda');
          } else {
            clearToken();
          }
        }).catch(() => { clearToken(); });
      }

      let banCheckTick = 0;
      setInterval(async () => {
        if (getToken()) {
          await refreshAppState();
          banCheckTick++;
          if (banCheckTick % 7 === 0) await enforceBanCheck();
        }
      }, 2000);
    });
