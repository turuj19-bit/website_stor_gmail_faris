// chat.js — Chat public: pesan, realtime, reaksi, pin, hapus, tema, swipe/gesture

    // ============================================================
    // CHAT PUBLIC
    // ============================================================
    let chatMessages = [];
    let hiddenChatMsgIds = new Set();
    try { hiddenChatMsgIds = new Set(JSON.parse(localStorage.getItem('chatHiddenIds') || '[]')); } catch (_) { hiddenChatMsgIds = new Set(); }
    function saveHiddenChatMsgIds() {
      try { localStorage.setItem('chatHiddenIds', JSON.stringify(Array.from(hiddenChatMsgIds))); } catch (_) {}
    }
    let ctxMenuTargetId = null;
    let deleteSheetTargetId = null;
    let pinDurationTargetId = null;
    let emojiPickerMode = 'input';
    let reactionTargetId = null;
    const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    // Untuk animasi "mengembang" saat kirim pesan: id pesan yang baru saja
    // dikirim sendiri, dan daftar id yang sudah pernah dapat animasi biar
    // tidak diputar ulang tiap kali chat di-render ulang (polling dll).
    let lastSentChatMsgId = null;
    let animatedChatMsgIds = new Set();
    // Pesan ORANG LAIN yang baru saja "masuk" (lewat realtime/polling, bukan
    // riwayat awal saat chat baru dibuka) -- dipakai supaya pesan masuk juga
    // dapat animasi "mengembang" yang sama kayak pesan yang kita kirim sendiri.
    // Lihat loadChatMessages() (yang mengisinya) & renderChatMessages() (yang
    // membacanya lalu langsung membuang entrinya begitu dipakai).
    let incomingPopMsgIds = new Set();
    // Penanda riwayat chat sudah pernah dimuat minimal 1x di sesi ini --
    // supaya loadChatMessages() tidak salah menganggap SEMUA pesan riwayat
    // awal (saat chat baru dibuka) sebagai "pesan baru masuk" dan
    // memutar animasi mengembang untuk puluhan bubble sekaligus.
    let chatHistoryLoadedOnce = false;
    let chatPollingInterval = null;
    // ===== SEMATKAN PESAN (pin ala WA/Telegram) =====
    // Cuma akun centang biru (verified) yang boleh menyematkan/melepas --
    // lihat isVerifiedUser() & ctxPin(). Durasi sematan bisa dipilih admin:
    // 24 Jam atau 7 Hari, lalu lepas otomatis begitu kedaluwarsa (lihat
    // renderChatPinnedBar() & scheduleChatPinExpiryCheck()).
    // CATATAN JUJUR: penyimpanan sematan ini SEKARANG baru per-perangkat
    // (localStorage) -- kode sudah mencoba sinkron ke server lewat
    // apiRequest('pinChatMessage'/'unpinChatMessage', ...) tapi kalau
    // backend/Supabase belum punya endpoint itu, panggilannya akan gagal
    // diam-diam (ditangkap di catch) dan sematan cuma kelihatan di HP admin
    // yang menyematkan -- BUKAN otomatis muncul di HP user lain sampai
    // backend-nya dilengkapi.
    let chatPinned = null; // {id, name, snippet, pinnedAt, expiresAt, pinnedBy}
    try {
      const __rawPin = localStorage.getItem('chatPinnedMsg');
      if (__rawPin) chatPinned = JSON.parse(__rawPin);
    } catch (_) { chatPinned = null; }
    let chatPinExpiryTimer = null;
    // PENTING (perbaikan bug refresh & hapus permanen, 29 Agu 2026):
    // Sebelumnya di sini ada "chatLastSeen" yang dipakai sebagai penanda
    // "sudah dimuat sampai sini" untuk polling INCREMENTAL (cuma minta pesan
    // yang timestamp-nya lebih baru dari itu ke server). Itu penyebab 2 bug:
    // 1) Refresh browser -> variabel di memori JS ke-reset ke [], tapi
    //    "chatLastSeen" di localStorage sudah dekat dengan waktu sekarang ->
    //    pemuatan pertama cuma minta pesan yang LEBIH BARU dari itu -> semua
    //    riwayat lama (bahkan yang baru) kelihatan kosong.
    // 2) Karena polling cuma MENAMBAH pesan baru dan tidak pernah mengecek
    //    ulang pesan lama, pesan yang di-hapus permanen oleh orang lain tidak
    //    pernah hilang dari layar kita sampai benar-benar refresh manual.
    // Sekarang loadChatMessages() SELALU meminta seluruh jendela pesan yang
    // masih ada di server (since=0) tiap polling, lalu direkonsiliasi penuh
    // terhadap array lokal (pesan yang sudah tidak ada di hasil server ikut
    // dibuang dari layar -- termasuk yang baru saja dihapus permanen orang
    // lain). "chatClearedBefore" di bawah ini ADALAH pengganti khusus utk
    // fitur tombol tong sampah header ("Hapus Riwayat Chat utk saya") --
    // beda tujuan dari chatLastSeen yang lama, jadi TIDAK dipakai utk
    // membatasi query ke server, cuma dipakai sebagai filter tampilan lokal.
    let chatClearedBefore = parseInt(localStorage.getItem('chatClearedBefore') || '0', 10);
    // Sejak realtime dipakai sebagai jalur UTAMA (lihat subscribeChatRealtime
    // di bawah), polling ini cuma jaring pengaman + penyinkron bingkai
    // avatar/centang verified -- makanya jaraknya dilonggarkan (dulu 3
    // detik) supaya tidak boros data di koneksi lambat.
    const CHAT_POLL_INTERVAL = 10000;
    let replyTarget = null;
    // Dipakai buat "menyatukan" beberapa panggilan stickChatToBottom/resize
    // keyboard yang numpuk barengan (misal pas kirim pesan + keyboard sempat
    // kedip), supaya tidak ada banyak timer nulis scrollTop yang tabrakan
    // dan bikin navigasi ketik pesan di bawah kelihatan goyang/getar.
    let __chatStickTimers = [];
    // Timer debounce buat event resize keyboard (bukan rAF lagi — lihat
    // penjelasan di listener visualViewport 'resize' di bawah).
    let __vvResizeDebounce = null;
    // Deteksi otomatis link/tautan (http/https, www, atau domain umum seperti contoh.com)
    const CHAT_LINK_REGEX = /((https?:\/\/|www\.)\S+)|(\b[a-zA-Z0-9][a-zA-Z0-9-]{1,63}\.(com|net|org|id|co|io|me|xyz|info|link|gg|ly|to|vip|club|site|online|shop|biz|tv|app|dev|my|asia|net\.id|co\.id|web\.id)\b\S*)/i;

    // Format pesan balas disisipkan sebagai marker di dalam teks pesan itu sendiri:
    // [[REPLY:id:nama:cuplikan]]isi pesan asli
    function parseReplyMessage(raw) {
      if (typeof raw !== 'string') return { reply: null, text: raw || '' };
      const m = raw.match(/^\[\[REPLY:([^:]+):([^:]+):([^\]]+)\]\]([\s\S]*)$/);
      if (!m) return { reply: null, text: raw };
      let reply = null;
      try {
        reply = { id: decodeURIComponent(m[1]), name: decodeURIComponent(m[2]), snippet: decodeURIComponent(m[3]) };
      } catch (_) { reply = null; }
      return { reply, text: m[4] };
    }

    function setReplyTargetById(id) {
      const msg = chatMessages.find(m => String(m.id) === String(id));
      if (!msg) return;
      // PENTING: fokuskan kolom ketik DULUAN, sebelum DOM lain (reply bar dll)
      // diubah. Kalau layout berubah (reply bar muncul & geser konten) sebelum
      // focus() dipanggil, browser HP sering "lupa" ini masih bagian dari
      // sentuhan/tap user, jadi keyboard nggak otomatis naik.
      const input = document.getElementById('chatInput');
      if (input) input.focus();
      const parsed = parseReplyMessage(msg.message);
      const name = (msg.fullname || msg.username || 'User').slice(0, 40);
      const snippet = (parsed.text || '').slice(0, 80);
      replyTarget = { id: msg.id, name, snippet };
      const bar = document.getElementById('chatReplyBar');
      const nameEl = document.getElementById('chatReplyName');
      const snippetEl = document.getElementById('chatReplySnippet');
      if (nameEl) nameEl.textContent = name;
      if (snippetEl) snippetEl.textContent = snippet;
      if (bar) bar.classList.add('show');
      if (input) {
        // Fokus ulang setelah reply bar tampil (layout barusan geser lagi),
        // lalu fallback beberapa kali lewat rAF & timer buat jaga-jaga
        // browser HP belum mau munculin keyboard di percobaan pertama.
        input.focus();
        if (document.activeElement !== input) {
          if (window.requestAnimationFrame) requestAnimationFrame(function () { input.focus(); });
          setTimeout(function () { input.focus(); }, 60);
          setTimeout(function () { input.focus(); }, 200);
        }
      }
      const scrollBtn = document.getElementById('chatScrollBottomBtn');
      if (scrollBtn && scrollBtn.classList.contains('show')) positionChatScrollBtn();
    }

    // Tap bar "Membalas ..." di atas kolom ketik -> lompat & sorot ke pesan
    // aslinya yang sedang dibalas, persis kayak tap kutipan balasan di WA/Telegram.
    function jumpToReplyBarTarget() {
      if (replyTarget && replyTarget.id) jumpToChatMessage(replyTarget.id);
    }

    function cancelReply() {
      replyTarget = null;
      const bar = document.getElementById('chatReplyBar');
      if (bar) bar.classList.remove('show');
      const scrollBtn = document.getElementById('chatScrollBottomBtn');
      if (scrollBtn && scrollBtn.classList.contains('show')) positionChatScrollBtn();
      // Jaga supaya keyboard HP tetap terbuka (fokus balik ke kolom ketik),
      // biar tombol X ini tidak menutup keyboard secara tidak sengaja.
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    }

    function openChatPublic() {
      const overlay = document.getElementById('chatPublicOverlay');
      if (!overlay) return;
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
      hideMusicButtonForChat();
      pushOverlayHistoryGuard();
      loadEmojis();
      loadChatMessages(true);
      renderChatPinnedBar();
      scheduleChatPinExpiryCheck();
      if (chatPollingInterval) clearInterval(chatPollingInterval);
      // Polling tetap dipertahankan sebagai JARING PENGAMAN (kalau koneksi
      // realtime di bawah putus/gagal connect), tapi jalur UTAMA sekarang
      // realtime -- lihat subscribeChatRealtime().
      chatPollingInterval = setInterval(loadChatMessages, CHAT_POLL_INTERVAL);
      subscribeChatRealtime();
      sendChatHeartbeat();
      const input = document.getElementById('chatInput');
      if (input) setTimeout(() => input.focus(), 300);
    }

    // ============================================================
    // REALTIME (diminta & dipercepat lagi, 29 Agu 2026): supaya pesan baru &
    // hapus permanen langsung nongol di Chat Public user lain TANPA delay.
    // PENTING -- versi awal di sini cuma memakai event realtime sebagai
    // "pemicu" utk manggil ulang loadChatMessages() (fetch penuh ulang
    // sampai 200 pesan + reaksi). Itu justru jadi SUMBER lag 6-8 detik yang
    // dikeluhkan: di koneksi lambat, round-trip fetch penuh itu sendiri yang
    // makan waktu, bukan realtime-nya. Sekarang data dari event realtime
    // (payload.new / payload.old) LANGSUNG dipakai buat update chatMessages
    // di memori -- TIDAK ADA fetch/network round-trip tambahan sama sekali,
    // jadi pesan baru & hapus permanen tampil begitu push-nya nyampe (murni
    // dibatasi kecepatan jaringan bawaan, bukan lagi nunggu request lain).
    // Konsekuensinya: bingkai avatar/centang verified pengirim lain (yang
    // datanya dari JOIN ke tabel users, bukan ada di baris chat_messages
    // mentah) baru menyusul lewat polling latar belakang di bawah -- isi
    // pesan & balasannya sendiri sudah tampil seketika.
    // ============================================================
    let chatRealtimeChannel = null;
    let chatLoadInFlight = false;
    let chatLoadQueued = false;

    function applyRealtimeInsert(row) {
      if (!row || row.id == null) return;
      const id = String(row.id);
      if (chatMessages.some(m => String(m.id) === id)) return; // sudah ada (mis. pesan sendiri yg baru dikonfirmasi)
      if (hiddenChatMsgIds.has(id)) return;
      const ts = row.created_at ? new Date(row.created_at).getTime() : Date.now();
      if (!(ts > chatClearedBefore)) return;
      chatMessages.push({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        fullname: row.fullname || row.username,
        avatar: row.avatar || null,
        avatarFrame: null, // menyusul lewat sinkron polling latar belakang
        verified: false,   // menyusul lewat sinkron polling latar belakang
        message: row.message,
        timestamp: ts,
        reactions: []
      });
      // Pesan BARU dari orang lain yang masuk lewat realtime -> kasih animasi
      // "mengembang" yang sama persis kayak pas kita kirim pesan sendiri
      // (pesan sendiri sudah dapat animasi lewat lastSentChatMsgId di jalur
      // pengiriman, jadi di sini sengaja cuma yang BUKAN dari diri sendiri).
      const __me = getCurrentUser();
      if (!__me || row.user_id !== __me.id) {
        incomingPopMsgIds.add(row.id);
      }
      renderChatMessages(false);
    }

    function applyRealtimeDelete(oldRow) {
      if (!oldRow || oldRow.id == null) return;
      const id = String(oldRow.id);
      const before = chatMessages.length;
      chatMessages = chatMessages.filter(m => String(m.id) !== id);
      if (chatMessages.length !== before) renderChatMessages(false);
    }

    function subscribeChatRealtime() {
      if (chatRealtimeChannel || !window.supabase || !supabaseClient) return;
      try {
        chatRealtimeChannel = supabaseClient
          .channel('chat_messages_realtime')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
            applyRealtimeInsert(payload && payload.new);
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
            applyRealtimeDelete(payload && payload.old);
          })
          .subscribe();
      } catch (_) {
        chatRealtimeChannel = null;
      }
    }

    function unsubscribeChatRealtime() {
      if (chatRealtimeChannel) {
        try { supabaseClient.removeChannel(chatRealtimeChannel); } catch (_) {}
        chatRealtimeChannel = null;
      }
    }

    function closeChatPublic(fromPopState) {
      const overlay = document.getElementById('chatPublicOverlay');
      if (overlay) overlay.classList.remove('show');
      document.body.style.overflow = '';
      closeEmojiPicker();
      closeChatContextMenu();
      closeChatDeleteSheet();
      emojiPickerMode = 'input';
      reactionTargetId = null;
      if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
      }
      unsubscribeChatRealtime();
      cancelReply();
      restoreMusicButtonAfterChat();
      if (!fromPopState) popOverlayHistoryGuard();
    }

    async function loadChatMessages(forceScrollBottom) {
      const container = document.getElementById('chatMessagesContainer');
      if (!container) return;
      const user = getCurrentUser();
      if (!user) {
        container.innerHTML = '<div class="empty-state"><p>Login dulu untuk melihat chat.</p></div>';
        return;
      }
      // Sekarang loadChatMessages() bisa dipicu dari beberapa sumber
      // sekaligus (timer polling, event realtime INSERT, event realtime
      // DELETE, pemanggilan manual) -- kalau ada yang masih berjalan,
      // cukup tandai supaya diulang sekali lagi begitu yang berjalan
      // selesai, jangan tembak beberapa request bersamaan yang responsnya
      // bisa datang tidak berurutan.
      if (chatLoadInFlight) { chatLoadQueued = chatLoadQueued || forceScrollBottom; return; }
      chatLoadInFlight = true;
      try {
        // Selalu minta seluruh jendela pesan yang MASIH ADA di server (bukan
        // cuma yang "baru" sejak terakhir dilihat) -- lihat catatan panjang
        // di deklarasi chatClearedBefore di atas kenapa ini penting.
        const result = await apiRequest('getChatMessages', { since: 0 });
        const serverMessages = result.data || [];

        // Sinkronkan status sematan (pin) GLOBAL dari server -- supaya pesan
        // yang disematkan admin centang biru kelihatan sama persis di HP
        // semua user, bukan cuma di HP yang menyematkan. Server adalah
        // sumber kebenaran: kalau beda dari yang tersimpan lokal (disematkan
        // baru, dilepas, ganti pesan lain, atau sudah kedaluwarsa di server),
        // langsung timpa state lokal & localStorage-nya.
        // PENGAMAN (29 Agu 2026): dibungkus try/catch SENDIRI -- apa pun yang
        // terjadi di sini TIDAK BOLEH pernah menggagalkan/menghentikan proses
        // reconcile daftar pesan chat di bawahnya. Sebelumnya blok ini tidak
        // dibungkus, jadi kalau ada error tak terduga di sini, seluruh sisa
        // fungsi (termasuk update daftar pesan) ikut batal jalan utk siklus
        // poll itu.
        let pinChanged = false;
        try {
          const serverPinned = result.pinned || null;
          const localPinKey = chatPinned ? String(chatPinned.id) + ':' + chatPinned.expiresAt : '';
          const serverPinKey = serverPinned ? String(serverPinned.id) + ':' + serverPinned.expiresAt : '';
          pinChanged = localPinKey !== serverPinKey;
          if (pinChanged) {
            if (serverPinned) {
              const p = parseReplyMessage(serverPinned.message || '');
              chatPinned = {
                id: serverPinned.id,
                name: serverPinned.name || 'User',
                snippet: (p.text || '').slice(0, 80),
                pinnedAt: serverPinned.pinnedAt || Date.now(),
                expiresAt: serverPinned.expiresAt,
                pinnedBy: serverPinned.pinnedBy || ''
              };
            } else {
              chatPinned = null;
            }
            savePinnedLocal();
            renderChatPinnedBar();
            scheduleChatPinExpiryCheck();
          }
        } catch (pinErr) {
          console.warn('Gagal sinkron status sematan (diabaikan, tidak ganggu pesan lain):', pinErr);
        }
        // Terapkan status "disembunyikan utk saya" (per-pesan, lewat tombol
        // Hapus utk saya) dan "riwayat dibersihkan" (lewat tombol tong sampah
        // header) -- dua-duanya murni filter tampilan lokal, tidak pernah
        // mengubah apa pun di server.
        const visibleServer = serverMessages.filter(m =>
          !hiddenChatMsgIds.has(String(m.id)) && (m.timestamp || 0) > chatClearedBefore
        );
        // Pesan yang baru saja dikirim dari perangkat ini dan belum
        // dikonfirmasi server (masih pakai id sementara "temp_...") harus
        // tetap dipertahankan apa adanya supaya tidak berkedip hilang
        // sesaat sebelum respons server datang.
        const pendingLocal = chatMessages.filter(m =>
          typeof m.id === 'string' && m.id.indexOf('temp_') === 0
        );
        const merged = [...visibleServer, ...pendingLocal];

        // Cuma render ulang kalau memang ada perubahan nyata (pesan baru
        // ATAU pesan yang hilang karena dihapus permanen oleh siapa pun) --
        // biar list chat tidak "dibangun ulang" tiap kali dipicu tanpa
        // alasan (bikin scroll mulus & ringan), sama seperti perilaku
        // sebelumnya.
        const oldIds = chatMessages.map(m => String(m.id)).sort();
        const newIds = merged.map(m => String(m.id)).sort();
        const hasChange = oldIds.length !== newIds.length || oldIds.some((id, i) => id !== newIds[i]);

        // Jaring pengaman kalau realtime lagi putus/gagal connect: tandai
        // pesan orang lain yang baru nongol lewat polling ini juga biar dapat
        // animasi "mengembang" -- TAPI jangan pas pemuatan riwayat PERTAMA
        // kali chat dibuka (kalau tidak, puluhan bubble lama ikut "mengembang"
        // sekaligus, bukan cuma yang benar-benar baru).
        if (chatHistoryLoadedOnce) {
          const oldIdSet = new Set(oldIds);
          for (const m of merged) {
            const idStr = String(m.id);
            if (!oldIdSet.has(idStr) && m.userId !== user.id && !animatedChatMsgIds.has(m.id)) {
              incomingPopMsgIds.add(m.id);
            }
          }
        }
        chatHistoryLoadedOnce = true;

        chatMessages = merged;

        if (hasChange || forceScrollBottom || pinChanged) {
          renderChatMessages(forceScrollBottom);
        }
        syncChatReactions();
      } catch (err) {
        console.warn('Gagal muat chat:', err);
        if (forceScrollBottom) renderChatMessages(forceScrollBottom);
      } finally {
        chatLoadInFlight = false;
        if (chatLoadQueued) {
          const wantScroll = chatLoadQueued === true;
          chatLoadQueued = false;
          loadChatMessages(wantScroll);
        }
      }
    }

    // Sinkronkan reaksi emoji utk pesan yang sudah termuat (supaya reaksi di pesan
    // LAMA juga ikut update tanpa perlu buka-tutup chat), tanpa harus fetch ulang pesannya.
    async function syncChatReactions() {
      if (!chatMessages.length) return;
      const ids = chatMessages
        .slice(-80)
        .map(m => m.id)
        .filter(id => typeof id === 'string' && id.indexOf('temp_') !== 0 && id.indexOf('msg_') !== 0);
      if (!ids.length) return;
      try {
        const result = await apiRequest('getChatReactions', { ids });
        const map = (result && result.data) || {};
        let changed = false;
        chatMessages.forEach(m => {
          const arr = map[m.id] || [];
          const curStr = JSON.stringify(m.reactions || []);
          if (JSON.stringify(arr) !== curStr) { m.reactions = arr; changed = true; }
        });
        if (changed) renderChatMessages();
      } catch (_) {}
    }

    // ============================================================
    // TOMBOL "KE PESAN TERBARU" DI CHAT PUBLIC
    // Muncul cuma kalau user lagi scroll ke atas (bukan lagi di bawah).
    // Auto-scroll ke bawah HANYA kalau user memang lagi di dekat bawah,
    // supaya kalau lagi baca pesan lama di atas, tidak ditarik paksa turun.
    // ============================================================
    function isChatNearBottom(container) {
      if (!container) return true;
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      return dist < 60;
    }

    function updateChatScrollButtonVisibility() {
      const container = document.getElementById('chatMessagesContainer');
      const btn = document.getElementById('chatScrollBottomBtn');
      if (!container || !btn) return;
      if (isChatNearBottom(container)) {
        btn.classList.remove('show');
      } else {
        btn.classList.add('show');
        positionChatScrollBtn();
      }
    }

    function positionChatScrollBtn() {
      const btn = document.getElementById('chatScrollBottomBtn');
      const overlay = document.getElementById('chatPublicOverlay');
      const inputWrapper = overlay ? overlay.querySelector('.chat-input-wrapper') : null;
      if (!btn || !overlay || !inputWrapper) return;
      const overlayRect = overlay.getBoundingClientRect();
      const inputRect = inputWrapper.getBoundingClientRect();
      let bottomOffset = Math.max(12, overlayRect.bottom - inputRect.top + 14);
      const replyBar = document.getElementById('chatReplyBar');
      if (replyBar && replyBar.classList.contains('show')) {
        bottomOffset += replyBar.getBoundingClientRect().height;
      }
      btn.style.bottom = bottomOffset + 'px';
    }

    // Nempelin scroll ke paling bawah, diulang beberapa kali di frame/waktu
    // berikutnya (bukan cuma sekali). Ini buat ngejar timing resize keyboard
    // HP yang suka telat (tinggi viewport baru berubah SETELAH kita sempat
    // scroll), yang bikin pesan baru kelihatan "muncul dari bawah keyboard"
    // alih-alih rapi kedorong ke atas kayak di WA/Telegram.
    function stickChatToBottom(container) {
      if (!container) return;
      // Batalkan dulu semua jadwal tulis scrollTop yang masih menunggu dari
      // panggilan SEBELUMNYA (rAF & setTimeout). Kalau tidak dibatalkan, tiap
      // kali fungsi ini dipanggil ulang dalam waktu berdekatan (kirim pesan +
      // resize keyboard hampir bersamaan) tulisannya numpuk/tabrakan dan itu
      // yang bikin navigasi ketik pesan di bawah kelihatan goyang/getar.
      __chatStickTimers.forEach(t => { if (t.raf) cancelAnimationFrame(t.id); else clearTimeout(t.id); });
      __chatStickTimers = [];
      container.scrollTop = container.scrollHeight;
      const rafId = requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
      __chatStickTimers.push({ id: rafId, raf: true });
      [80, 260].forEach(delay => {
        const id = setTimeout(() => { container.scrollTop = container.scrollHeight; }, delay);
        __chatStickTimers.push({ id, raf: false });
      });
    }

    function scrollChatToBottom(smooth) {
      const container = document.getElementById('chatMessagesContainer');
      if (!container) return;
      // Sengaja TIDAK blur/nutup keyboard di sini — kalau keyboard HP lagi aktif
      // pas tombol ini ditekan, keyboard harus tetap terbuka, cuma list-nya yang di-scroll.
      if (smooth && container.scrollTo) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      stickChatToBottom(container);
      const btn = document.getElementById('chatScrollBottomBtn');
      if (btn) btn.classList.remove('show');
      // Jaga supaya keyboard HP tetap terbuka kalau memang lagi aktif —
      // fokus balik ke kolom ketik biar tombol ini tidak menutup keyboard.
      const input = document.getElementById('chatInput');
      if (input && document.activeElement !== input) input.focus();
    }

    // Kalau keyboard HP muncul/hilang/berubah tinggi SAAT Chat Public lagi
    // dibuka, dan posisi kita memang lagi nempel di pesan paling bawah,
    // ikutin terus ke bawah — supaya pesan terakhir tidak ketutup / ke-selip
    // di balik keyboard pas dia baru selesai animasi muncul.
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        // PENTING: ini di-DEBOUNCE (nunggu sampai event berhenti nembak dulu),
        // BUKAN cuma di-throttle per-frame. Soalnya pas lagi ngetik biasa aja
        // (bukan cuma pas buka/tutup keyboard), baris saran kata di keyboard
        // HP (Gboard dkk) sering ikut naik-turun tiap ketikan, dan itu bikin
        // event resize ini nembak berkali-kali TERUS-MENERUS selama ngetik.
        // Kalau tiap tick langsung dipaksa scrollTop=scrollHeight (versi lama
        // cuma throttle per-frame, bukan nunggu tenang), hasilnya koreksi
        // scroll kepaksa jalan puluhan kali per detik selama ngetik — itu
        // yang kerasa sebagai navigasi ketik pesan goyang terus-terusan pas
        // posisi lagi nempel di pesan paling bawah. Sekarang ditunda dulu
        // sampai tidak ada event baru selama ~160ms, baru dikoreksi SEKALI.
        if (__vvResizeDebounce) { clearTimeout(__vvResizeDebounce); __vvResizeDebounce = null; }
        __vvResizeDebounce = setTimeout(function () {
          __vvResizeDebounce = null;
          const overlay = document.getElementById('chatPublicOverlay');
          if (!overlay || !overlay.classList.contains('show')) return;
          const container = document.getElementById('chatMessagesContainer');
          const scrollBtn = document.getElementById('chatScrollBottomBtn');
          if (!container) return;
          const pinnedToBottom = !(scrollBtn && scrollBtn.classList.contains('show'));
          if (pinnedToBottom) stickChatToBottom(container);
          positionChatScrollBtn();
        }, 160);
      });
    }

    function renderChatMessages(forceScrollBottom) {
      const container = document.getElementById('chatMessagesContainer');
      if (!container) return;
      const user = getCurrentUser();
      if (!user) {
        container.innerHTML = '<div class="empty-state"><p>Login dulu.</p></div>';
        return;
      }

      if (chatMessages.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-comment-dots"></i></div><p>Belum ada pesan. Mulai chat!</p></div>';
        return;
      }

      const wasNearBottom = isChatNearBottom(container);

      const sorted = chatMessages.slice().sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      // Rekonsiliasi per-pesan (bukan timpa ulang seluruh innerHTML tiap render):
      // pesan LAMA yang isinya sama sekali tidak berubah, elemen DOM-nya dipakai
      // lagi apa adanya dan TIDAK PERNAH disentuh/dipindah sama sekali kalau
      // urutannya juga tidak berubah (lihat loop rekonsiliasi cursor di bawah).
      // Sebelumnya di sini SELALU ada container.innerHTML='' + append ulang
      // SEMUA bubble tiap kali render dipanggil (tiap 10 detik polling, tiap
      // pesan realtime masuk, dst) -- itu bikin browser HP harus lepas-pasang
      // ulang seluruh daftar pesan yang lagi di-scroll tiap kali, makanya
      // kelihatan berat/patah-patah & pesan sempat "ilang" sekilas pas lagi
      // scroll ke atas. Sekarang bubble lama yang tidak berubah & urutannya
      // masih pas sama sekali tidak dipindah dari DOM.
      // Buang duluan elemen "nyasar" yang bukan bubble pesan (mis. kotak
      // placeholder "Belum ada pesan. Mulai chat!" / "Login dulu" dari
      // render sebelumnya). Elemen begini tidak punya data-msg-id, jadi
      // kalau tidak dibuang di sini dia akan tertinggal permanen di DOM
      // begitu pesan pertama masuk -- kelihatan kayak bubble pesan
      // "kepotong" karena placeholder-nya nongol lagi di bawah/atas bubble
      // yang beneran ada.
      Array.from(container.children).forEach(child => {
        if (!child.dataset || !child.dataset.msgId) child.remove();
      });

      const existingById = {};
      Array.from(container.children).forEach(child => {
        if (child.dataset && child.dataset.msgId) existingById[child.dataset.msgId] = child;
      });

      const wantedIds = new Set(sorted.map(m => String(m.id)));
      // Buang duluan elemen pesan yang sudah tidak ada lagi (dihapus permanen
      // oleh siapa pun) -- dilakukan terpisah supaya tidak ikut mengacaukan
      // rekonsiliasi urutan di bawah.
      Array.from(container.children).forEach(child => {
        const cid = child.dataset && child.dataset.msgId;
        if (cid && !wantedIds.has(cid)) child.remove();
      });

      const finalNodes = [];
      for (const msg of sorted) {
        const isSelf = msg.userId === user.id;
        // Untuk pesan milik sendiri, selalu tampilkan avatar/nama/frame/centang
        // TERBARU dari profil yang lagi login — bukan data lama yang "difoto"
        // waktu pesan itu dikirim. Jadi begitu ganti foto/nama, SEMUA pesan
        // lama milik sendiri ikut ke-update juga, bukan cuma pesan baru.
        const profileSrc = isSelf ? {
          avatar: user.avatar || null,
          avatarFrame: user.avatarFrame || user.avatar_frame || null,
          verified: !!user.verified,
          fullname: user.fullname || user.username,
          username: user.username
        } : msg;
        const av = buildAvatarVisual(profileSrc);
        const time = msg.timestamp ? formatTime(msg.timestamp) : '';
        const displayName = profileSrc.fullname || profileSrc.username || 'User';
        const parsed = parseReplyMessage(msg.message);
        const safeId = String(msg.id).replace(/'/g, "\\'");
        const replyQuoteHtml = parsed.reply
          ? `<div class="reply-quote" onclick="jumpToChatMessage('${String(parsed.reply.id).replace(/'/g, "\\'")}')" title="Lihat pesan asli"><span class="rq-name">${escapeHtml(parsed.reply.name)}</span><span class="rq-text">${escapeHtml(parsed.reply.snippet)}</span></div>`
          : '';
        const reactionsHtml = buildReactionsHtml(msg, user.id);
        const isPinned = !!(chatPinned && String(chatPinned.id) === String(msg.id));
        const pinIcoHtml = isPinned ? ' <i class="fas fa-thumbtack" style="font-size:10px; opacity:0.7;"></i>' : '';
        // Tanda tangan isi pesan — dipakai buat tahu apakah bubble ini perlu
        // dibangun ulang atau boleh dipakai lagi apa adanya.
        const sig = JSON.stringify([av.styleAttr, av.contentHtml, time, displayName, replyQuoteHtml, parsed.text, reactionsHtml, isSelf, buildFrameClass(profileSrc, 'sm'), isPinned]);

        const idStr = String(msg.id);
        const existing = existingById[idStr];
        if (existing && existing.dataset.sig === sig) {
          finalNodes.push(existing);
          continue;
        }

        const shouldPop = ((isSelf && msg.id === lastSentChatMsgId) || (!isSelf && incomingPopMsgIds.has(msg.id))) && !animatedChatMsgIds.has(msg.id);
        if (shouldPop) { animatedChatMsgIds.add(msg.id); incomingPopMsgIds.delete(msg.id); }
        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <div class="chat-message ${isSelf ? 'self' : ''}${shouldPop ? ' pop-in' : ''}" data-msg-id="${safeId}">
            <div class="avatar${buildFrameClass(profileSrc, 'sm')}" style="${av.styleAttr}">${av.contentHtml}</div>
            <span class="swipe-reply-ico"><i class="fas fa-reply"></i></span>
            <div class="bubble">
              <button class="reply-btn" onmousedown="event.preventDefault()" onclick="setReplyTargetById('${safeId}')" title="Balas pesan"><i class="fas fa-reply"></i></button>
              <div class="sender">${escapeHtml(displayName)}${buildVerifiedBadgeHtml(profileSrc)}${pinIcoHtml} <span class="time">${time}</span></div>
              ${replyQuoteHtml}
              <div class="text">${escapeHtml(parsed.text)}</div>
              ${reactionsHtml}
            </div>
          </div>
        `.trim();
        const node = wrap.firstElementChild;
        node.dataset.sig = sig;
        finalNodes.push(node);
      }

      // Buang elemen "versi lama" dari pesan yang isinya berubah (sig beda) --
      // versi barunya sudah ada di finalNodes dan akan dipasang oleh loop
      // rekonsiliasi di bawah, jadi yang lama ini tinggal sampah yang harus
      // disingkirkan supaya tidak dobel.
      const finalNodeSet = new Set(finalNodes);
      Array.from(container.children).forEach(child => {
        if (child.dataset && child.dataset.msgId && !finalNodeSet.has(child)) {
          child.remove();
        }
      });

      // Rekonsiliasi urutan dengan mutasi DOM SEMINIMAL mungkin: kalau bubble
      // yang seharusnya ada di posisi ini memang sudah persis di situ, tidak
      // ada operasi DOM apa pun (paling umum terjadi: pesan cuma nambah di
      // bawah, semua bubble lama benar-benar tidak disentuh). Cuma bubble yang
      // urutannya berubah (jarang) atau baru yang kena insertBefore.
      let cursor = container.firstChild;
      for (const node of finalNodes) {
        if (cursor === node) {
          cursor = cursor.nextSibling;
        } else {
          container.insertBefore(node, cursor);
        }
      }

      if (forceScrollBottom || wasNearBottom) {
        stickChatToBottom(container);
      }
      updateChatScrollButtonVisibility();
    }

    // Tap bubble kutipan balasan (kotak putih/terang di dalam bubble) ->
    // langsung lompat & sorot ke pesan aslinya, persis kayak di WA/Telegram.
    function jumpToChatMessage(id) {
      if (!id) return;
      const container = document.getElementById('chatMessagesContainer');
      if (!container) return;
      const safeId = String(id).replace(/'/g, "\\'");
      let target = null;
      try { target = container.querySelector('[data-msg-id="' + CSS.escape(String(id)) + '"]'); } catch (_) {
        target = Array.from(container.children).find(el => el.dataset && el.dataset.msgId === String(id)) || null;
      }
      if (!target) {
        showToast('info', 'Pesan sudah dihapus', 'Pesan asli tidak ditemukan (sudah dihapus atau di luar riwayat yang termuat).');
        return;
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.remove('jump-flash');
      // Trik reflow supaya animasi highlight bisa diputar ulang meski
      // sebelumnya sempat dipakai di pesan yang sama.
      void target.offsetWidth;
      target.classList.add('jump-flash');
      setTimeout(() => target.classList.remove('jump-flash'), 900);
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Bangun HTML bar reaksi emoji di bawah sebuah bubble pesan (dikelompokkan per emoji).
    function buildReactionsHtml(msg, currentUserId) {
      const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
      if (!reactions.length) return '';
      const groups = {};
      const order = [];
      reactions.forEach(r => {
        if (!groups[r.emoji]) { groups[r.emoji] = { count: 0, mine: false }; order.push(r.emoji); }
        groups[r.emoji].count++;
        if (String(r.userId) === String(currentUserId)) groups[r.emoji].mine = true;
      });
      const safeId = String(msg.id).replace(/'/g, "\\'");
      return '<div class="chat-reactions-bar">' + order.map(e => {
        const g = groups[e];
        return `<button class="chat-reaction-pill${g.mine ? ' mine' : ''}" onclick="event.stopPropagation(); toggleChatReactionLocal('${safeId}','${e}')">${e}<span>${g.count}</span></button>`;
      }).join('') + '</div>';
    }

    async function sendChatMessage() {
      const input = document.getElementById('chatInput');
      const sendBtn = document.getElementById('chatSendBtn');
      if (!input) return;

      const text = input.value.trim();
      if (!text) {
        showToast('info', 'Pesan kosong', 'Ketik pesan terlebih dahulu.');
        return;
      }

      const user = getCurrentUser();
      if (!user) {
        showToast('error', 'Gagal', 'Login dulu.');
        return;
      }

      // Kirim link/tautan cuma boleh utk akun centang biru (verified).
      // Akun yang belum verified tetap kena larangan seperti biasa.
      if (CHAT_LINK_REGEX.test(text) && !user.verified) {
        showToast('error', 'Dilarang!', 'Mengirim link/tautan di Chat Public tidak diperbolehkan.');
        return;
      }

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      }

      const activeReply = replyTarget;
      // PENTING (perbaikan bug reply): batas panjang pesan di server adalah
      // CHAT_MSG_MAX_LEN karakter (lihat send_chat_message di SQL). Sebelumnya
      // isi ketikan mentah selalu dipotong ke 450 karakter TERLEBIH DAHULU,
      // dengan asumsi marker [[REPLY:id:nama:cuplikan]] pasti muat di sisa
      // ruang -- asumsi ini SALAH kalau nama/cuplikan mengandung banyak
      // karakter unicode/emoji, karena encodeURIComponent() bisa membuat hasil
      // encode jauh lebih panjang dari teks aslinya. Kalau total marker+isi
      // sampai lewat batas server, potongannya jatuh di TENGAH marker,
      // penutup "]]" hilang, dan parseReplyMessage() gagal mengenali pesan
      // itu sebagai balasan sama sekali (quote tidak pernah muncul).
      // Perbaikannya: bangun dulu marker REPLY secara utuh (tidak pernah
      // dipotong), baru sisa jatah karakter diberikan ke isi ketikan.
      const CHAT_MSG_MAX_LEN = 2000; // samakan dengan left(p_message, 2000) di send_chat_message SQL
      const replyPrefix = activeReply
        ? `[[REPLY:${encodeURIComponent(activeReply.id)}:${encodeURIComponent(activeReply.name)}:${encodeURIComponent(activeReply.snippet)}]]`
        : '';
      const bodyBudget = Math.max(0, CHAT_MSG_MAX_LEN - replyPrefix.length);
      const cappedText = text.slice(0, bodyBudget);
      const finalText = replyPrefix + cappedText;

      const tempId = 'temp_' + Date.now();
      const newMsg = {
        id: tempId,
        userId: user.id,
        username: user.username,
        fullname: user.fullname || user.username,
        avatar: user.avatar || null,
        avatarFrame: user.avatarFrame || user.avatar_frame || null,
        verified: !!user.verified,
        message: finalText,
        timestamp: Date.now()
      };
      chatMessages.push(newMsg);
      lastSentChatMsgId = tempId;
      renderChatMessages(true);
      input.value = '';
      // Cuma fokus ulang kalau memang belum fokus — manggil focus() pas input
      // itu SUDAH aktif bisa bikin keyboard HP kedip sekejap (nutup-buka),
      // dan itu salah satu penyebab navigasi ketik pesan kelihatan goyang.
      if (document.activeElement !== input) input.focus();
      cancelReply();

      try {
        const result = await apiRequest('sendChatMessage', { message: finalText });
        chatMessages = chatMessages.filter(m => m.id !== tempId);
        if (result.data && result.data.id) {
          const newMsgFromServer = {
            id: result.data.id,
            userId: user.id,
            username: user.username,
            fullname: user.fullname || user.username,
            avatar: user.avatar || null,
            avatarFrame: user.avatarFrame || user.avatar_frame || null,
            verified: !!user.verified,
            message: finalText,
            timestamp: result.data.timestamp || Date.now()
          };
          chatMessages.push(newMsgFromServer);
          // Sudah dianimasikan versi sementaranya tadi, jadi versi final dari
          // server ini tidak perlu "mengembang" lagi (biar tidak dobel).
          animatedChatMsgIds.add(newMsgFromServer.id);
          lastSentChatMsgId = newMsgFromServer.id;
        } else {
          const fallbackMsg = {
            id: 'msg_' + Date.now(),
            userId: user.id,
            username: user.username,
            fullname: user.fullname || user.username,
            avatar: user.avatar || null,
            avatarFrame: user.avatarFrame || user.avatar_frame || null,
            verified: !!user.verified,
            message: finalText,
            timestamp: Date.now()
          };
          chatMessages.push(fallbackMsg);
          animatedChatMsgIds.add(fallbackMsg.id);
          lastSentChatMsgId = fallbackMsg.id;
        }
        renderChatMessages(true);
      } catch (err) {
        showToast('error', 'Gagal kirim', err.message);
        chatMessages = chatMessages.filter(m => m.id !== tempId);
        animatedChatMsgIds.delete(tempId);
        if (lastSentChatMsgId === tempId) lastSentChatMsgId = null;
        renderChatMessages();
        input.value = text;
        if (document.activeElement !== input) input.focus();
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
      }
    }

    function toggleEmojiPicker() {
      const picker = document.getElementById('emojiPicker');
      if (!picker) return;
      const willShow = !picker.classList.contains('show');
      if (willShow) {
        // Buka panel emoji: tutup dulu keyboard bawaan HP biar keduanya
        // nggak nampil bebarengan (itu yang bikin area chat kerasa sempit).
        const input = document.getElementById('chatInput');
        if (input) input.blur();
        picker.classList.add('show');
        // Tombol/gesture kembali HP: tekan sekali pas panel emoji terbuka
        // cukup nutup panel-nya aja (balik ke mode ngetik), BUKAN langsung
        // keluar dari Chat Public. Lihat closeEmojiPicker() & popstate di bawah.
        pushOverlayHistoryGuard();
      } else {
        closeEmojiPicker();
      }
    }

    // Nutup panel emoji — dipanggil saat user tap area kosong (list chat/header)
    // atau saat user tap kolom pesan buat lanjut pakai keyboard bawaan HP,
    // persis kayak kebiasaan umum di aplikasi chat. fromPopState=true dipakai
    // saat ini dipicu oleh tombol kembali HP, biar tidak nge-pop riwayat dua kali.
    function closeEmojiPicker(fromPopState) {
      const picker = document.getElementById('emojiPicker');
      const wasOpen = picker && picker.classList.contains('show');
      if (picker) { picker.classList.remove('show'); picker.classList.remove('floating'); }
      if (wasOpen && !fromPopState) popOverlayHistoryGuard();
    }

    // ============================================================
    // REAKSI EMOJI PER PESAN (ala WA) — tap emoji yang sama = batal,
    // tap emoji lain = ganti. Optimis di UI, lalu disinkron ke server.
    // ============================================================
    async function toggleChatReactionLocal(msgId, emoji) {
      const user = getCurrentUser();
      if (!user) return;
      const msg = chatMessages.find(m => String(m.id) === String(msgId));
      if (!msg) return;
      if (!Array.isArray(msg.reactions)) msg.reactions = [];
      const idx = msg.reactions.findIndex(r => String(r.userId) === String(user.id));
      const had = idx !== -1 ? msg.reactions[idx].emoji : null;
      if (had === emoji) {
        msg.reactions.splice(idx, 1);
      } else if (idx !== -1) {
        msg.reactions[idx] = { userId: user.id, emoji };
      } else {
        msg.reactions.push({ userId: user.id, emoji });
      }
      renderChatMessages();
      try {
        await apiRequest('toggleChatReaction', { id: msgId, emoji });
      } catch (err) {
        showToast('error', 'Gagal', 'Tidak bisa mengirim reaksi.');
      }
    }

    // ============================================================
    // MENU KONTEKS PESAN (tekan lama sebuah chat)
    // ============================================================
    // ============================================================
    // SEMATKAN PESAN (pin) — lihat catatan lengkap di deklarasi chatPinned.
    // ============================================================
    function isVerifiedUser() {
      const u = getCurrentUser();
      return !!(u && u.verified);
    }

    function savePinnedLocal() {
      try {
        if (chatPinned) localStorage.setItem('chatPinnedMsg', JSON.stringify(chatPinned));
        else localStorage.removeItem('chatPinnedMsg');
      } catch (_) {}
    }

    function renderChatPinnedBar() {
      const bar = document.getElementById('chatPinnedBar');
      if (!bar) return;
      // Lepas otomatis begitu kedaluwarsa (24 Jam / 7 Hari sesuai pilihan admin).
      if (chatPinned && chatPinned.expiresAt && Date.now() > chatPinned.expiresAt) {
        chatPinned = null;
        savePinnedLocal();
      }
      if (!chatPinned) {
        bar.classList.remove('show');
        return;
      }
      const nameEl = document.getElementById('chatPinnedName');
      const snippetEl = document.getElementById('chatPinnedSnippet');
      if (nameEl) nameEl.textContent = chatPinned.name || 'User';
      if (snippetEl) snippetEl.textContent = chatPinned.snippet || '';
      const unpinBtn = document.getElementById('chatUnpinBtn');
      // Tombol X pelepas sematan cuma kelihatan buat akun centang biru --
      // user biasa cuma boleh LIHAT pesan yang disematkan, tidak boleh melepas.
      if (unpinBtn) unpinBtn.style.display = isVerifiedUser() ? '' : 'none';
      bar.classList.add('show');
    }

    function scheduleChatPinExpiryCheck() {
      clearTimeout(chatPinExpiryTimer);
      if (!chatPinned || !chatPinned.expiresAt) return;
      const delay = Math.min(Math.max(1000, chatPinned.expiresAt - Date.now()), 2147483000);
      chatPinExpiryTimer = setTimeout(renderChatPinnedBar, delay);
    }

    function jumpToPinnedMessage() {
      if (chatPinned && chatPinned.id) jumpToChatMessage(chatPinned.id);
    }

    function ctxPin() {
      const id = ctxMenuTargetId;
      closeChatContextMenu();
      if (!id) return;
      if (!isVerifiedUser()) {
        showToast('error', 'Khusus Admin', 'Cuma akun bercentang biru yang boleh menyematkan pesan.');
        return;
      }
      if (chatPinned && String(chatPinned.id) === String(id)) {
        doUnpinMessage();
      } else {
        openChatPinDurationSheet(id);
      }
    }

    function openChatPinDurationSheet(id) {
      pinDurationTargetId = id;
      const sheet = document.getElementById('chatPinDurationSheet');
      if (sheet) sheet.classList.add('show');
    }

    function closeChatPinDurationSheet() {
      const sheet = document.getElementById('chatPinDurationSheet');
      if (sheet) sheet.classList.remove('show');
      pinDurationTargetId = null;
    }

    async function confirmPinDuration(hours) {
      const id = pinDurationTargetId;
      closeChatPinDurationSheet();
      if (!id) return;
      const msg = chatMessages.find(m => String(m.id) === String(id));
      if (!msg) return;
      const user = getCurrentUser();
      const parsed = parseReplyMessage(msg.message);
      const name = (msg.fullname || msg.username || 'User').slice(0, 40);
      const snippet = (parsed.text || '').slice(0, 80);
      const expiresAt = Date.now() + hours * 3600 * 1000;
      const previousPinned = chatPinned; // buat di-restore kalau server menolak
      // Tampilkan dulu (optimistic update) biar terasa responsif...
      chatPinned = { id: msg.id, name, snippet, pinnedAt: Date.now(), expiresAt, pinnedBy: user ? (user.fullname || user.username) : '' };
      savePinnedLocal();
      renderChatPinnedBar();
      scheduleChatPinExpiryCheck();
      renderChatMessages();
      // ...lalu simpan ke server -- sematan ini GLOBAL (kelihatan di HP semua
      // user lain juga), jadi server adalah sumber kebenaran yang sebenarnya.
      // Kalau gagal (misal bukan akun centang biru di sisi server, atau
      // koneksi putus), batalkan lagi tampilan optimistic di atas.
      try {
        await apiRequest('pinChatMessage', { id: msg.id, hours });
        showToast('success', 'Disematkan', 'Pesan disematkan selama ' + (hours >= 168 ? '7 hari' : '24 jam') + ' untuk semua orang.');
      } catch (err) {
        chatPinned = previousPinned;
        savePinnedLocal();
        renderChatPinnedBar();
        scheduleChatPinExpiryCheck();
        renderChatMessages();
        showToast('error', 'Gagal', 'Tidak bisa menyematkan pesan di server.');
      }
    }

    async function doUnpinMessage() {
      const previousPinned = chatPinned;
      chatPinned = null;
      savePinnedLocal();
      renderChatPinnedBar();
      clearTimeout(chatPinExpiryTimer);
      renderChatMessages();
      try {
        await apiRequest('unpinChatMessage', {});
        showToast('info', 'Dilepas', 'Sematan pesan dilepas untuk semua orang.');
      } catch (err) {
        chatPinned = previousPinned;
        savePinnedLocal();
        renderChatPinnedBar();
        scheduleChatPinExpiryCheck();
        renderChatMessages();
        showToast('error', 'Gagal', 'Tidak bisa melepas sematan di server.');
      }
    }

    function openChatContextMenu(msgEl) {
      const id = msgEl && msgEl.dataset ? msgEl.dataset.msgId : null;
      if (!id) return;
      ctxMenuTargetId = id;
      // Tampilkan cuplikan teks pesan yang ditahan di atas baris reaksi.
      const preview = document.getElementById('chatCtxMsgPreview');
      if (preview) {
        const msg = chatMessages.find(m => String(m.id) === String(id));
        const parsed = msg ? parseReplyMessage(msg.message) : null;
        const text = parsed && parsed.text ? parsed.text.trim() : '';
        if (text) {
          preview.textContent = text;
          preview.classList.add('show');
        } else {
          preview.textContent = '';
          preview.classList.remove('show');
        }
      }
      const reactWrap = document.getElementById('chatCtxReactions');
      if (reactWrap) {
        reactWrap.innerHTML = QUICK_REACTIONS.map(e =>
          `<button class="ctx-react-btn" onclick="quickReactAndClose('${e}')">${e}</button>`
        ).join('') + `<button class="ctx-react-btn ctx-react-more" onclick="openReactionEmojiPicker()" title="Emoji lainnya"><i class="fas fa-plus"></i></button>`;
      }
      // Tombol "Sematkan"/"Lepas Sematan" cuma tampil buat akun centang biru.
      const pinBtn = document.getElementById('ctxPinBtn');
      if (pinBtn) {
        if (isVerifiedUser()) {
          const isPinnedThis = chatPinned && String(chatPinned.id) === String(id);
          pinBtn.innerHTML = isPinnedThis
            ? '<i class="fas fa-thumbtack"></i> Lepas Sematan'
            : '<i class="fas fa-thumbtack"></i> Sematkan';
          pinBtn.style.display = '';
        } else {
          pinBtn.style.display = 'none';
        }
      }
      const menu = document.getElementById('chatContextMenu');
      if (menu) menu.classList.add('show');
    }

    function closeChatContextMenu() {
      const menu = document.getElementById('chatContextMenu');
      if (menu) menu.classList.remove('show');
      ctxMenuTargetId = null;
    }

    function ctxReply() {
      const id = ctxMenuTargetId;
      closeChatContextMenu();
      if (id) setReplyTargetById(id);
    }

    function ctxCopy() {
      const msg = chatMessages.find(m => String(m.id) === String(ctxMenuTargetId));
      closeChatContextMenu();
      if (!msg) return;
      const parsed = parseReplyMessage(msg.message);
      const text = parsed.text || '';
      const doToast = () => showToast('info', 'Disalin', 'Pesan disalin.');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(doToast).catch(() => showToast('error', 'Gagal', 'Tidak bisa menyalin pesan.'));
      } else {
        try {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          doToast();
        } catch (_) { showToast('error', 'Gagal', 'Tidak bisa menyalin pesan.'); }
      }
    }

    function ctxDelete() {
      const id = ctxMenuTargetId;
      closeChatContextMenu();
      if (!id) return;
      // Pesan yang lagi disematkan cuma boleh dihapus oleh akun centang biru --
      // user biasa (termasuk pemilik pesan itu sendiri) harus lepas dulu
      // sematannya dulu (yang juga khusus admin) sebelum bisa menghapusnya.
      if (chatPinned && String(chatPinned.id) === String(id) && !isVerifiedUser()) {
        showToast('error', 'Tidak Bisa', 'Pesan ini sedang disematkan. Cuma akun bercentang biru yang boleh menghapusnya.');
        return;
      }
      openChatDeleteSheet(id);
    }

    function quickReactAndClose(emoji) {
      const id = ctxMenuTargetId;
      closeChatContextMenu();
      if (id) toggleChatReactionLocal(id, emoji);
    }

    function openReactionEmojiPicker() {
      const id = ctxMenuTargetId;
      closeChatContextMenu();
      reactionTargetId = id;
      emojiPickerMode = 'reaction';
      const picker = document.getElementById('emojiPicker');
      const input = document.getElementById('chatInput');
      if (input) input.blur();
      if (picker) { picker.classList.add('show'); picker.classList.add('floating'); }
      // Sama kayak toggleEmojiPicker(): panel ini juga butuh jejak riwayat
      // sendiri biar tombol kembali HP nutup panel ini duluan, bukan langsung
      // keluar dari Chat Public.
      pushOverlayHistoryGuard();
    }

    // ============================================================
    // HAPUS PESAN — "Hapus untuk saya" (disembunyikan, lokal saja) atau
    // "Hapus permanen" (kalau pesan milik sendiri, dihapus dari server
    // untuk semua orang; kalau pesan orang lain, cuma disembunyikan
    // untuk kita — persis kayak "Delete for everyone" di WA).
    // ============================================================
    function openChatClearMenu() {
      deleteSheetTargetId = null;
      const title = document.getElementById('chatDeleteTitle');
      if (title) title.textContent = 'Hapus Riwayat Chat';
      // Tombol tong sampah di header CUMA boleh menyembunyikan riwayat utk
      // diri sendiri -- TIDAK PERNAH boleh menghapus pesan dari database
      // (baik milik sendiri apalagi milik user lain). Jadi opsi "Hapus
      // permanen" sengaja disembunyikan di sini.
      const permBtn = document.getElementById('chatDeletePermanentBtn');
      if (permBtn) permBtn.style.display = 'none';
      const sheet = document.getElementById('chatDeleteSheet');
      if (sheet) sheet.classList.add('show');
    }

    function openChatDeleteSheet(id) {
      deleteSheetTargetId = id;
      const title = document.getElementById('chatDeleteTitle');
      if (title) title.textContent = 'Hapus Pesan';
      // "Hapus permanen" cuma boleh kelihatan buat pesan MILIK SENDIRI.
      // Punya orang lain cuma boleh "Hapus untuk saya" (disembunyikan lokal),
      // tidak boleh benar-benar dihapus dari server untuk semua orang.
      const user = getCurrentUser();
      const msg = chatMessages.find(m => String(m.id) === String(id));
      const isSelf = !!(msg && user && msg.userId === user.id);
      const permBtn = document.getElementById('chatDeletePermanentBtn');
      if (permBtn) permBtn.style.display = isSelf ? '' : 'none';
      const sheet = document.getElementById('chatDeleteSheet');
      if (sheet) sheet.classList.add('show');
    }

    function closeChatDeleteSheet() {
      const sheet = document.getElementById('chatDeleteSheet');
      if (sheet) sheet.classList.remove('show');
      deleteSheetTargetId = null;
    }

    async function confirmChatDelete(mode) {
      const id = deleteSheetTargetId;
      closeChatDeleteSheet();
      const user = getCurrentUser();

      if (id) {
        // --- Hapus SATU pesan ---
        const msg = chatMessages.find(m => String(m.id) === String(id));
        const isSelf = !!(msg && user && msg.userId === user.id);
        let permanentDone = false;
        if (mode === 'everyone' && isSelf) {
          // "Hapus permanen": SATU-SATUNYA jalur yang menyentuh Supabase.
          // HANYA boleh utk pesan milik sendiri. Backend (delete_chat_message)
          // tetap wajib memvalidasi ulang kepemilikan lewat token -- baris
          // "isSelf" di frontend ini tidak dianggap sebagai satu-satunya proteksi.
          try {
            await apiRequest('deleteChatMessage', { id });
            permanentDone = true;
          } catch (err) {
            showToast('error', 'Gagal', 'Tidak bisa menghapus pesan.');
          }
        } else {
          // "Hapus untuk saya": MURNI localStorage di browser ini. Pesan
          // TETAP ada di Supabase, TIDAK ada request apapun ke server --
          // user lain (termasuk pengirim asli) tetap melihat pesan ini
          // seperti biasa, di browser/perangkat manapun mereka login.
          hiddenChatMsgIds.add(String(id));
          saveHiddenChatMsgIds();
        }
        chatMessages = chatMessages.filter(m => String(m.id) !== String(id));
        renderChatMessages();
        showToast('success', 'Terhapus', permanentDone ? 'Pesan dihapus permanen.' : 'Pesan dihapus untuk Anda.');
      } else {
        // --- Tombol tong sampah header: "Hapus Riwayat Chat" ---
        // SELALU berarti "sembunyikan riwayat utk saya saja", MURNI
        // localStorage. TIDAK PERNAH memanggil deleteMyChatMessages ataupun
        // request apapun ke Supabase -- database chat_messages tidak
        // tersentuh sama sekali, user lain tidak terpengaruh.
        clearChatHistoryLocal(true);
        showToast('success', 'Terhapus', 'Riwayat chat disembunyikan untuk Anda.');
      }
    }

    // ============================================================
    // TEMA TERANG / MALAM — tombolnya cuma ada di header Chat Public,
    // dan efeknya JUGA dibatasi cuma di dalam Chat Public saja (class
    // "dark" ditaruh di #chatPublicOverlay, bukan di body), supaya
    // Beranda & menu lain tidak ikut berubah warna. Preferensinya tetap
    // disimpan di perangkat biar kebuka lagi tetap sesuai pilihan terakhir.
    // ============================================================
    function updateThemeBtnIcon(theme) {
      const btn = document.getElementById('chatThemeBtn');
      if (!btn) return;
      btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function applyStoredTheme() {
      let theme = 'light';
      // Sengaja pakai sessionStorage (bukan localStorage): localStorage itu
      // dibagi ke SEMUA tab di browser yang sama, jadi kalau ada 2 tab dibuka
      // (misal buat tes 2 akun sekaligus di 1 HP), ganti tema di 1 tab ikut
      // ke-apply ke tab lain juga. sessionStorage terpisah per-tab, jadi tema
      // beneran cuma milik tab/orang yang menekan tombolnya sendiri.
      try { theme = sessionStorage.getItem('appTheme') || 'light'; } catch (_) {}
      const overlay = document.getElementById('chatPublicOverlay');
      if (overlay) overlay.classList.toggle('dark', theme === 'dark');
      updateThemeBtnIcon(theme);
    }

    function toggleAppTheme() {
      const overlay = document.getElementById('chatPublicOverlay');
      if (!overlay) return;
      const isDark = overlay.classList.toggle('dark');
      try { sessionStorage.setItem('appTheme', isDark ? 'dark' : 'light'); } catch (_) {}
      updateThemeBtnIcon(isDark ? 'dark' : 'light');
    }

    // ============================================================
    // SWIPE-TO-REPLY + TEKAN LAMA (long-press) — satu handler delegasi
    // di container chat, jadi ringan (nggak pasang listener per bubble).
    // ============================================================
    (function initChatGestures() {
      const container = document.getElementById('chatMessagesContainer');
      if (!container) return;
      const SWIPE_TRIGGER = 60, SWIPE_MAX = 84, LONG_PRESS_MS = 450, MOVE_CANCEL = 10;
      let activeEl = null, pointerId = null, startX = 0, startY = 0, curTranslate = 0;
      let dragging = false, longPressTimer = null, longPressFired = false;

      function reset() {
        clearTimeout(longPressTimer);
        if (activeEl) {
          if (pointerId !== null) {
            try { activeEl.releasePointerCapture(pointerId); } catch (_) {}
          }
          activeEl.classList.remove('bubble-drag');
          const bub = activeEl.querySelector('.bubble');
          if (bub) bub.style.transform = '';
          const ico = activeEl.querySelector('.swipe-reply-ico');
          if (ico) ico.style.opacity = '0';
        }
        activeEl = null; pointerId = null; dragging = false; longPressFired = false; curTranslate = 0;
      }

      container.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const msgEl = e.target.closest('.chat-message');
        if (!msgEl) return;
        activeEl = msgEl; pointerId = e.pointerId;
        startX = e.clientX; startY = e.clientY; curTranslate = 0; dragging = false; longPressFired = false;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(function () {
          if (!activeEl || dragging) return;
          longPressFired = true;
          if (navigator.vibrate) { try { navigator.vibrate(15); } catch (_) {} }
          const el = activeEl;
          reset();
          openChatContextMenu(el);
        }, LONG_PRESS_MS);
      }, { passive: true });

      container.addEventListener('pointermove', function (e) {
        if (!activeEl || e.pointerId !== pointerId || longPressFired) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!dragging) {
          if (Math.abs(dx) > MOVE_CANCEL && Math.abs(dx) > Math.abs(dy)) {
            dragging = true;
            clearTimeout(longPressTimer);
            activeEl.classList.add('bubble-drag');
            // Kunci (capture) pointer ini ke elemen pesan begitu kita yakin ini
            // swipe horizontal (bukan scroll vertikal). Ini bikin browser HP
            // resmi menyerahkan sentuhan ini ke elemen kita sampai jari
            // diangkat, jadi urutan pointerup di akhir jadi lebih pasti/rapi
            // (nggak ketuker jadi pointercancel gara-gara browser mengira ini
            // gesture lain) — ini penting supaya focus() ke kolom ketik yang
            // dipanggil pas jari diangkat lebih konsisten dianggap browser
            // sebagai bagian dari sentuhan user asli, sehingga keyboard bawaan
            // HP mau otomatis naik.
            try { activeEl.setPointerCapture(e.pointerId); } catch (_) {}
          } else if (Math.abs(dy) > MOVE_CANCEL) {
            clearTimeout(longPressTimer);
            activeEl = null;
            return;
          } else {
            return;
          }
        }
        const t = Math.max(Math.min(dx, 0), -SWIPE_MAX);
        curTranslate = t;
        const bub = activeEl.querySelector('.bubble');
        if (bub) bub.style.transform = 'translateX(' + t + 'px)';
        const ico = activeEl.querySelector('.swipe-reply-ico');
        if (ico) ico.style.opacity = String(Math.min(1, Math.abs(t) / SWIPE_TRIGGER));
      }, { passive: true });

      function endDrag(e) {
        if (pointerId !== null && e && e.pointerId !== pointerId) return;
        if (activeEl && dragging && !longPressFired) {
          const id = activeEl.dataset.msgId;
          const shouldReply = curTranslate <= -SWIPE_TRIGGER;
          // PENTING: fokuskan kolom ketik DULUAN di sini, SEBELUM reset()
          // mengubah DOM (hapus class bubble-drag, reset transform bubble,
          // dll). Sebelumnya focus() baru dipanggil di dalam
          // setReplyTargetById() yaitu SETELAH reset() sempat mengubah-ubah
          // DOM & memicu reflow/transisi CSS — jeda itulah yang bikin sebagian
          // besar HP "lupa" kalau ini masih bagian dari sentuhan/swipe user,
          // jadi keyboard bawaan kadang nggak otomatis naik (cuma sesekali
          // berhasil). Dengan fokus dipanggil sebagai baris pertama begini,
          // pemanggilannya nempel langsung ke gesture pointerup user.
          if (shouldReply && id) {
            const inputEl = document.getElementById('chatInput');
            if (inputEl) inputEl.focus();
          }
          reset();
          if (shouldReply && id) {
            if (navigator.vibrate) { try { navigator.vibrate(10); } catch (_) {} }
            setReplyTargetById(id);
          }
        } else {
          reset();
        }
      }

      container.addEventListener('pointerup', endDrag, { passive: true });
      container.addEventListener('pointercancel', endDrag, { passive: true });
      container.addEventListener('pointerleave', endDrag, { passive: true });
    })();

    async function sendChatHeartbeat() {
      try {
        await apiRequest('chatHeartbeat', {});
      } catch (_) {}
    }

    document.addEventListener('DOMContentLoaded', function() {
      applyStoredTheme();
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
          }
        });
        // Tap kolom pesan = balik ke keyboard bawaan HP, panel emoji ditutup.
        chatInput.addEventListener('focus', closeEmojiPicker);
      }

      // Tap area kosong (list chat / header Chat Public) = tutup panel emoji.
      const chatMsgsContainerEl = document.getElementById('chatMessagesContainer');
      if (chatMsgsContainerEl) chatMsgsContainerEl.addEventListener('click', closeEmojiPicker);
      const chatHeaderEl = document.querySelector('#chatPublicOverlay .chat-header');
      if (chatHeaderEl) chatHeaderEl.addEventListener('click', closeEmojiPicker);

      // ===== PERBAIKAN: event listener untuk counter otomatis saat mengetik =====
      const storInput = document.getElementById('storInput');
      if (storInput) {
        storInput.addEventListener('input', updateCounter);
        // inisialisasi awal
        updateCounter();
      }

      // ===== INISIALISASI EVENT LISTENER UNTUK TAB LEADERBOARD =====
      const tabs = document.querySelectorAll('#leaderboardTabs .riwayat-tab');
      tabs.forEach(tab => {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        newTab.addEventListener('click', function(e) {
          e.preventDefault();
          const period = this.dataset.period;
          if (period) {
            loadLeaderboard(period);
          }
        });
      });

      // Load awal: Hari Ini
      setTimeout(() => {
        loadLeaderboard('today');
      }, 300);
    });
