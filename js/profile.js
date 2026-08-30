// profile.js — Avatar & bingkai preset, edit profil, upload avatar

    // ============================================================
    // AVATAR & BINGKAI PROFIL (PRESET)
    // ============================================================
    const AVATAR_PRESETS = [
      { id:'m1', gender:'m', emoji:'🦸‍♂️', label:'Superhero', bg:'linear-gradient(135deg,#4F46E5,#22D3EE)' },
      { id:'m2', gender:'m', emoji:'🥷', label:'Ninja', bg:'linear-gradient(135deg,#1F2937,#4B5563)' },
      { id:'m3', gender:'m', emoji:'🧑‍🚀', label:'Astronot', bg:'linear-gradient(135deg,#0EA5E9,#1E3A8A)' },
      { id:'m4', gender:'m', emoji:'🧛‍♂️', label:'Vampir', bg:'linear-gradient(135deg,#7C2D12,#111827)' },
      { id:'m5', gender:'m', emoji:'🤴', label:'Pangeran', bg:'linear-gradient(135deg,#B45309,#FDE68A)' },
      { id:'f1', gender:'f', emoji:'🦸‍♀️', label:'Superhero', bg:'linear-gradient(135deg,#DB2777,#F472B6)' },
      { id:'f2', gender:'f', emoji:'👩‍🚀', label:'Astronot', bg:'linear-gradient(135deg,#7C3AED,#C4B5FD)' },
      { id:'f3', gender:'f', emoji:'🧛‍♀️', label:'Vampir', bg:'linear-gradient(135deg,#831843,#1F2937)' },
      { id:'f4', gender:'f', emoji:'👸', label:'Putri', bg:'linear-gradient(135deg,#EC4899,#FBCFE8)' },
      { id:'f5', gender:'f', emoji:'🧚‍♀️', label:'Peri', bg:'linear-gradient(135deg,#059669,#6EE7B7)' }
    ];
    const FRAME_PRESETS = [
      { id:'gold', label:'Gold' },
      { id:'silver', label:'Silver' },
      { id:'neon', label:'Neon Biru' },
      { id:'fire', label:'Api' },
      { id:'rainbow', label:'Rainbow' },
      { id:'diamond', label:'Diamond' },
      { id:'royal', label:'Royal' },
      { id:'emerald', label:'Emerald' },
      { id:'galaxy', label:'Galaxy' },
      { id:'rosegold', label:'Rose Gold' }
    ];
    const FRAME_SPIN_IDS = ['fire', 'rainbow', 'galaxy'];
    // Hanya mendeteksi karakter centang/ceklis (✓ ✔ ☑ ✅ 🗹 🗸), variation-selector setelahnya diabaikan.
    // Sengaja TIDAK memblokir \uFE0F sendirian agar emoji lain (yang juga memakai variation selector) tetap boleh dipakai.
    const CHECKMARK_EMOJI_REGEX = /[\u2713\u2714\u2611\u2705\u{1F5F8}\u{1F5F9}]/u;

    function findAvatarPreset(id) { return AVATAR_PRESETS.find(function(p){ return p.id === id; }); }
    function findFramePreset(id) { return FRAME_PRESETS.find(function(p){ return p.id === id; }); }

    function buildAvatarVisual(u) {
      const nameFallback = ((u && (u.fullname || u.username)) || 'U').charAt(0).toUpperCase() || 'U';
      if (u && u.avatar && typeof u.avatar === 'string' && u.avatar.indexOf('preset:') === 0) {
        const preset = findAvatarPreset(u.avatar.slice(7));
        if (preset) return { contentHtml: '<span class="avatar-fill" style="background:' + preset.bg + ';">' + preset.emoji + '</span>', styleAttr: '' };
      }
      if (u && u.avatar) return { contentHtml: '<span class="avatar-fill"><img src="' + u.avatar + '" alt="avatar" /></span>', styleAttr: '' };
      return { contentHtml: '<span class="avatar-fill">' + nameFallback + '</span>', styleAttr: '' };
    }

    function buildFrameClass(u, sizeMod) {
      const fid = u && (u.avatarFrame || u.avatar_frame);
      if (!fid) return '';
      const spin = FRAME_SPIN_IDS.indexOf(fid) !== -1 ? ' frame-spin' : '';
      return ' av-frame frame-' + fid + (sizeMod ? ' frame-' + sizeMod : '') + spin;
    }

    // Lencana centang biru bentuk SVG bergerigi (8 sisi, halus) + centang di tengah — gaya premium.
    const VERIFIED_BADGE_SVG =
      '<span class="verified-badge" title="Akun Terverifikasi">' +
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Akun Terverifikasi" role="img">' +
      '<polygon points="50.0,0.0 54.8,1.6 58.9,5.4 62.3,9.5 65.7,12.1 69.9,12.7 75.3,12.2 80.9,12.4 85.4,14.6 87.6,19.1 87.8,24.7 87.3,30.1 87.9,34.3 90.5,37.7 94.6,41.1 98.4,45.2 100.0,50.0 98.4,54.8 94.6,58.9 90.5,62.3 87.9,65.7 87.3,69.9 87.8,75.3 87.6,80.9 85.4,85.4 80.9,87.6 75.3,87.8 69.9,87.3 65.7,87.9 62.3,90.5 58.9,94.6 54.8,98.4 50.0,100.0 45.2,98.4 41.1,94.6 37.7,90.5 34.3,87.9 30.1,87.3 24.7,87.8 19.1,87.6 14.6,85.4 12.4,80.9 12.2,75.3 12.7,69.9 12.1,65.7 9.5,62.3 5.4,58.9 1.6,54.8 0.0,50.0 1.6,45.2 5.4,41.1 9.5,37.7 12.1,34.3 12.7,30.1 12.2,24.7 12.4,19.1 14.6,14.6 19.1,12.4 24.7,12.2 30.1,12.7 34.3,12.1 37.7,9.5 41.1,5.4 45.2,1.6" fill="#1D9BF0"/>' +
      '<path d="M30,52 L44,66 L73,33" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></span>';

    function buildVerifiedBadgeHtml(u) {
      return (u && u.verified) ? ' ' + VERIFIED_BADGE_SVG : '';
    }

    function renderAvatarPickerGrid() {
      const grid = safeGet('avatarPickerGrid');
      if (!grid) return;
      const user = getCurrentUser() || {};
      const activeId = (user.avatar && typeof user.avatar === 'string' && user.avatar.indexOf('preset:') === 0) ? user.avatar.slice(7) : null;
      grid.innerHTML = AVATAR_PRESETS.map(function(p) {
        return '<div class="avatar-picker-item ' + (activeId === p.id ? 'active' : '') + '" onclick="selectAvatarPreset(\'' + p.id + '\')">' +
          '<div class="api-circle" style="background:' + p.bg + '">' + p.emoji +
          '<span class="api-selected-badge"><i class="fas fa-check"></i></span></div>' +
          '<div class="api-label">' + p.label + '</div></div>';
      }).join('');
    }

    function renderFramePickerGrid() {
      const grid = safeGet('framePickerGrid');
      if (!grid) return;
      const user = getCurrentUser() || {};
      const activeId = user.avatarFrame || user.avatar_frame || null;
      let html = '<div class="frame-picker-item ' + (!activeId ? 'active' : '') + '" onclick="selectFramePreset(null)">' +
        '<div class="fpi-wrap"><div class="fpi-circle none" style="display:flex;align-items:center;justify-content:center;"><i class="fas fa-ban" style="font-size:12px;color:var(--text-secondary);"></i></div>' +
        '<span class="fpi-selected-badge"><i class="fas fa-check"></i></span></div>' +
        '<div class="fpi-label">Tanpa Bingkai</div></div>';
      html += FRAME_PRESETS.map(function(f) {
        const spin = FRAME_SPIN_IDS.indexOf(f.id) !== -1 ? ' frame-spin' : '';
        return '<div class="frame-picker-item ' + (activeId === f.id ? 'active' : '') + '" onclick="selectFramePreset(\'' + f.id + '\')">' +
          '<div class="fpi-wrap"><div class="av-frame frame-' + f.id + spin + '"><div class="fpi-circle"></div></div>' +
          '<span class="fpi-selected-badge"><i class="fas fa-check"></i></span></div>' +
          '<div class="fpi-label">' + f.label + '</div></div>';
      }).join('');
      grid.innerHTML = html;
    }

    async function selectAvatarPreset(id) {
      const user = getCurrentUser();
      if (!user) { showToast('error', 'Gagal', 'Login dulu.'); return; }
      showLoading('Memperbarui avatar...');
      try {
        const payload = { fullname: user.fullname, avatar: 'preset:' + id, avatarFrame: user.avatarFrame || user.avatar_frame || null };
        const result = await apiRequest('updateProfile', payload);
        appState.user = result.data.user;
        showToast('success', 'Berhasil', 'Avatar profil diperbarui.');
        updateUIApp();
        renderAvatarPickerGrid();
      } catch (err) {
        showToast('error', 'Gagal', err.message || 'Terjadi kesalahan, coba lagi.');
      } finally {
        hideLoading();
      }
    }

    async function selectFramePreset(id) {
      const user = getCurrentUser();
      if (!user) { showToast('error', 'Gagal', 'Login dulu.'); return; }
      showLoading('Memperbarui bingkai...');
      try {
        const payload = { fullname: user.fullname, avatar: user.avatar || null, avatarFrame: id || null };
        const result = await apiRequest('updateProfile', payload);
        appState.user = result.data.user;
        showToast('success', 'Berhasil', id ? 'Bingkai profil diperbarui.' : 'Bingkai profil dihapus.');
        updateUIApp();
        renderFramePickerGrid();
      } catch (err) {
        showToast('error', 'Gagal', err.message || 'Terjadi kesalahan, coba lagi.');
      } finally {
        hideLoading();
      }
    }

    // ============================================================
    // EDIT PROFIL
    // ============================================================
    async function handleEditProfile(e) {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) { showToast('error', 'Gagal', 'Anda harus login.');
        return; }
      const newName = safeGet('editName')?.value.trim() || '';
      if (!newName) { showToast('error', 'Gagal', 'Nama tidak boleh kosong.');
        return; }
      if (CHECKMARK_EMOJI_REGEX.test(newName)) {
        showToast('error', 'Gagal', 'Nama tidak boleh mengandung emoji centang/ceklis. Emoji lain diperbolehkan.');
        return;
      }
      showLoading('Memperbarui profil...');
      try {
        const payload = { fullname: newName };
        if (user.avatar) payload.avatar = user.avatar;
        if (user.avatarFrame || user.avatar_frame) payload.avatarFrame = user.avatarFrame || user.avatar_frame;
        const result = await apiRequest('updateProfile', payload);
        appState.user = result.data.user;
        showToast('success', 'Berhasil', 'Profil diperbarui.');
        closeModal('modalEditProfile');
        updateUIApp();
      } catch (err) {
        console.error('Edit profile error:', err);
        showToast('error', 'Gagal', err.message || 'Terjadi kesalahan, coba lagi.');
      } finally {
        hideLoading();
      }
    }

    // ============================================================
    // AVATAR
    // ============================================================
    async function handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const user = getCurrentUser();
      if (!user) { showToast('error', 'Gagal', 'Login dulu.');
        return; }
      const reader = new FileReader();
      reader.onload = async function(e) {
        showLoading('Mengunggah foto...');
        try {
          const payload = { fullname: user.fullname, avatar: e.target.result, avatarFrame: user.avatarFrame || user.avatar_frame || null };
          const result = await apiRequest('updateProfile', payload);
          appState.user = result.data.user;
          showToast('success', 'Berhasil', 'Foto profil diperbarui.');
          updateUIApp();
          renderAvatarPickerGrid();
        } catch (err) {
          showToast('error', 'Gagal', err.message);
        } finally {
          hideLoading();
        }
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
