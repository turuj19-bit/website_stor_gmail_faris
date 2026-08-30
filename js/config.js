// config.js — Konfigurasi Supabase, ACTION_MAP, dan token Bot Telegram

    // ============================================================
    // KONFIGURASI SUPABASE
    // ============================================================
    const SUPABASE_URL = 'https://szvrryxrgxvljpoodxgq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dnJyeXhyZ3h2bGpwb29keGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NzQ3MjgsImV4cCI6MjEwMzM1MDcyOH0.3ZZfO6DLtZxWg9qbPpqkVvMEKyFyOP38CunPFhPomTw';
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const ACTION_MAP = {
      bootstrap:            { fn: 'bootstrap_data',           needsToken: true,  params: () => ({}) },
      login:                { fn: 'login_user',                needsToken: false, params: (d) => ({ p_username: d.username, p_password: d.password }) },
      checkBan:             { fn: 'check_username_ban',        needsToken: false, params: (d) => ({ p_username: d.username }) },
      checkRegisterAllowed: { fn: 'check_registration_allowed', needsToken: false, params: () => ({}) },
      register:             { fn: 'register_user',             needsToken: false, params: (d) => ({ p_username: d.username, p_email_phone: d.emailPhone, p_password: d.password }) },
      resetPassword:        { fn: 'find_user_by_email',        needsToken: false, params: (d) => ({ p_email_phone: d.emailPhone }) },
      resetPasswordConfirm: { fn: 'reset_password_direct',     needsToken: false, params: (d) => ({ p_user_id: d.userId, p_new_password: d.newPassword }) },
      updateProfile:        { fn: 'update_profile',            needsToken: true,  params: (d) => ({ p_fullname: d.fullname || null, p_avatar: d.avatar || null, p_avatar_frame: d.avatarFrame || null }) },
      createWithdrawal:     { fn: 'create_withdrawal',         needsToken: true,  params: (d) => ({ p_nominal: d.nominal, p_metode: d.metode, p_akun: d.akun }) },
      logout:               { fn: 'logout_user',               needsToken: true,  params: () => ({}) },
      clearInbox:           { fn: 'clear_inbox',                needsToken: true,  params: () => ({}) },
      createStor:           { fn: 'create_stor',                needsToken: true,  params: (d) => ({ p_kontak_type: d.kontakType, p_kontak: d.kontak, p_nama: d.nama, p_password: d.password, p_emails: d.emails, p_tanggal: d.tanggal }) },
      getLeaderboard:       { fn: 'get_leaderboard',            needsToken: false, params: (d) => ({ p_period: d.period }) },
      getPublicWithdrawals: { fn: 'get_public_withdrawals',     needsToken: false, params: (d) => ({ p_limit: d.limit || 50 }) },
      getChatMessages:      { fn: 'get_chat_messages',          needsToken: false, params: (d) => ({ p_since: d.since || 0 }) },
      sendChatMessage:      { fn: 'send_chat_message',          needsToken: true,  params: (d) => ({ p_message: d.message }) },
      chatHeartbeat:        { fn: 'chat_heartbeat',             needsToken: true,  params: () => ({}) },
      toggleChatReaction:   { fn: 'toggle_chat_reaction',       needsToken: true,  params: (d) => ({ p_message_id: d.id, p_emoji: d.emoji }) },
      getChatReactions:     { fn: 'get_chat_reactions',         needsToken: false, params: (d) => ({ p_ids: d.ids || [] }) },
      deleteChatMessage:    { fn: 'delete_chat_message',        needsToken: true,  params: (d) => ({ p_message_id: d.id }) },
      deleteMyChatMessages: { fn: 'delete_my_chat_messages',    needsToken: true,  params: () => ({}) },
      deleteHistoryByPeriod:{ fn: 'delete_history_by_period',   needsToken: true,  params: (d) => ({ p_days: d.days }) },
      // Sematkan pesan (pin) -- khusus akun centang biru, lihat isVerifiedUser()/
      // ctxPin(). Ditambahkan ke API_CONFIG (29 Agu 2026) supaya sematan
      // tersimpan di server dan kelihatan di HP SEMUA user, bukan cuma di HP
      // admin yang menyematkan -- lihat pin_chat_message()/unpin_chat_message()
      // di supabase_final_gabungan.sql.
      pinChatMessage:       { fn: 'pin_chat_message',           needsToken: true,  params: (d) => ({ p_message_id: d.id, p_hours: d.hours }) },
      unpinChatMessage:     { fn: 'unpin_chat_message',         needsToken: true,  params: () => ({}) }
    };

    // ============================================================
    // BOT TELEGRAM
    // ============================================================
    const TELEGRAM_BOT_TOKEN_STOR = '8942598358:AAEx2mQnXz3mZtQOsYBr0vZ56VOCR_NJQiY';
    const TELEGRAM_CHAT_ID_STOR = '7607446655';
    const TELEGRAM_BOT_TOKEN_WITHDRAW = '8805204974:AAGLP6P8ag_8NKdNqUIEuRLLXmhqNHvHl_A';
    const TELEGRAM_CHAT_ID_WITHDRAW = '7607446655';
