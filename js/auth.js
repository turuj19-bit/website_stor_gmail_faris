// auth.js — Login, register, reset password, logout


    // ============================================================
    // AUTH
    // ============================================================
    function switchAuthTab(tab) {
      const loginForm = safeGet('loginForm');
      const registerForm = safeGet('registerForm');
      const tabLogin = safeGet('tabLogin');
      const tabRegister = safeGet('tabRegister');
      const errorEl = safeGet('authError');
      if (errorEl) { errorEl.classList.remove('show');
        errorEl.textContent = ''; }
      if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
      } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (tabRegister) tabRegister.classList.add('active');
        if (tabLogin) tabLogin.classList.remove('active');
      }
    }

    function showAuthError(msg) {
      const el = safeGet('authError');
      if (el) { el.textContent = msg;
        el.classList.add('show'); }
    }

    function openResetPassword() { openModal('modalResetPassword'); }

    async function handleLogin(e) {
      e.preventDefault();
      const username = safeGet('loginUsername')?.value.trim() || '';
      const password = safeGet('loginPassword')?.value.trim() || '';
      const btn = safeGet('loginBtn');
      if (btn) { btn.disabled = true;
        btn.classList.add('loading'); }
      showLoading('Login...');
      try {
        const banCheck = await apiRequest('checkBan', { username }, false);
        if (banCheck?.data?.banned) {
          const info = banCheck.data;
          const durasi = info.banType === 'permanent' ? 'PERMANEN' : ('sampai ' + formatTime(info.banExpiresAt));
          const alasan = info.banReason ? (' Alasan: ' + info.banReason + '.') : '';
          throw new Error('🚫 Akun ini di-banned (' + durasi + ').' + alasan + ' Hubungi Admin CS untuk info lebih lanjut.');
        }
        const result = await apiRequest('login', { username, password }, false);
        setToken(result.data.token);
        appState.user = result.data.user;
        await refreshAppState();
        if (btn) { btn.disabled = false;
          btn.classList.remove('loading'); }
        const nama = appState.user.fullname || appState.user.username;
        const welcomeToast = safeGet('welcomeToast');
        const title = safeGet('welcomeTitle');
        const desc = safeGet('welcomeDesc');
        if (title) title.textContent = 'Selamat Datang, ' + nama + '! 🎉';
        if (desc) desc.innerHTML =
          'Selamat datang di <strong>STOR GMAIL FARIS</strong>,<br />ayo stor sebanyak-banyaknya biar cuan ngalir terus!';
        if (welcomeToast) welcomeToast.classList.add('show');
        enterApp();
      } catch (err) {
        if (btn) { btn.disabled = false;
          btn.classList.remove('loading'); }
        showAuthError(err.message);
      } finally {
        hideLoading();
      }
    }

    async function handleRegister(e) {
      e.preventDefault();
      const username = safeGet('regUsername')?.value.trim() || '';
      const emailPhone = safeGet('regEmailPhone')?.value.trim() || '';
      const password = safeGet('regPassword')?.value.trim() || '';
      const confirm = safeGet('regConfirmPassword')?.value.trim() || '';
      const btn = safeGet('registerBtn');
      if (btn) { btn.disabled = true;
        btn.classList.add('loading'); }
      showLoading('Mendaftar...');
      try {
        if (password !== confirm) throw new Error('Password dan konfirmasi tidak sama.');
        if (username.length < 3 || password.length < 3 || emailPhone.length < 3) throw new Error('Data tidak lengkap.');
        const allowCheck = await apiRequest('checkRegisterAllowed', {}, false);
        if (allowCheck?.data?.allowed === false) {
          throw new Error('Pendaftaran dari perangkat ini diblokir oleh Admin. Hubungi Admin CS jika ini kesalahan.');
        }
        await apiRequest('register', { username, emailPhone, password, confirm }, false);
        if (btn) { btn.disabled = false;
          btn.classList.remove('loading'); }
        showToast('success', 'Berhasil', 'Akun berhasil dibuat. Silakan login.');
        switchAuthTab('login');
      } catch (err) {
        if (btn) { btn.disabled = false;
          btn.classList.remove('loading'); }
        showAuthError(err.message);
      } finally {
        hideLoading();
      }
    }

    // ============================================================
    // RESET PASSWORD
    // ============================================================
    const resetState = {
      reset: { user: null },
      forgot: { user: null }
    };

    function goToResetStep1(prefix) {
      const step1 = safeGet(prefix + 'Step1');
      const step2 = safeGet(prefix + 'Step2');
      if (step1) step1.classList.remove('hidden-step');
      if (step2) step2.classList.add('hidden-step');
      resetState[prefix].user = null;
    }

    async function findUserByEmail(prefix) {
      const emailInput = safeGet(prefix + 'Email');
      const email = emailInput?.value.trim() || '';
      if (!email) {
        showToast('error', 'Gagal', 'Masukkan email terlebih dahulu.');
        return;
      }
      showLoading('Mencari akun...');
      try {
        const result = await apiRequest('resetPassword', { emailPhone: email }, false);
        if (result.data && result.data.user) {
          resetState[prefix].user = result.data.user;
          const step1 = safeGet(prefix + 'Step1');
          const step2 = safeGet(prefix + 'Step2');
          if (step1) step1.classList.add('hidden-step');
          if (step2) step2.classList.remove('hidden-step');
          const avatar = safeGet(prefix + 'UserAvatar');
          const name = safeGet(prefix + 'UserName');
          const userEmail = safeGet(prefix + 'UserEmail');
          const user = result.data.user;
          if (avatar) avatar.textContent = (user.fullname || user.username).charAt(0).toUpperCase();
          if (name) name.textContent = user.fullname || user.username;
          if (userEmail) userEmail.textContent = user.emailPhone || '-';
          showToast('success', 'Ditemukan', 'Akun ditemukan!');
        } else {
          showToast('error', 'Tidak Ditemukan', 'Email tidak terdaftar.');
        }
      } catch (err) {
        showToast('error', 'Gagal', err.message);
      } finally {
        hideLoading();
      }
    }

    async function handleResetPasswordConfirm(prefix) {
      const newPass = safeGet(prefix + 'NewPassword')?.value.trim() || '';
      const confirmPass = safeGet(prefix + 'ConfirmPassword')?.value.trim() || '';
      if (!newPass || !confirmPass) {
        showToast('error', 'Gagal', 'Isi semua field.');
        return;
      }
      if (newPass.length < 3) {
        showToast('error', 'Gagal', 'Password minimal 3 karakter.');
        return;
      }
      if (newPass !== confirmPass) {
        showToast('error', 'Gagal', 'Password tidak sama.');
        return;
      }
      const user = resetState[prefix]?.user;
      if (!user) {
        showToast('error', 'Gagal', 'Akun tidak ditemukan. Ulangi proses.');
        return;
      }
      showLoading('Merubah password...');
      try {
        await apiRequest('resetPasswordConfirm', {
          userId: user.id,
          newPassword: newPass
        }, false);
        showToast('success', 'Berhasil', 'Password berhasil direset!');
        const modalId = prefix === 'reset' ? 'modalResetPassword' : 'modalForgotPassword';
        closeModal(modalId);
        resetState[prefix].user = null;
        const step1 = safeGet(prefix + 'Step1');
        const step2 = safeGet(prefix + 'Step2');
        if (step1) step1.classList.remove('hidden-step');
        if (step2) step2.classList.add('hidden-step');
        const emailInput = safeGet(prefix + 'Email');
        const newPassInput = safeGet(prefix + 'NewPassword');
        const confirmPassInput = safeGet(prefix + 'ConfirmPassword');
        if (emailInput) emailInput.value = '';
        if (newPassInput) newPassInput.value = '';
        if (confirmPassInput) confirmPassInput.value = '';
      } catch (err) {
        showToast('error', 'Gagal', err.message);
      } finally {
        hideLoading();
      }
    }

    // ============================================================
    // LOGOUT
    // ============================================================
    async function confirmLogout() {
      closeModal('modalLogout');
      showLoading('Logout...');
      await apiRequest('logout').catch(_ => {});
      clearToken();
      appState.user = null;
      document.getElementById('appPage')?.classList.remove('show');
      document.getElementById('authPage')?.classList.remove('hide');
      document.documentElement.classList.remove('locked');
      document.body.classList.remove('locked');
      showToast('info', 'Logout', 'Anda telah keluar.');
      switchAuthTab('login');
      setMusicVisibility(false);
      hideLoading();
    }

    async function forceLogoutBanned(info) {
      clearToken();
      appState.user = null;
      document.getElementById('appPage')?.classList.remove('show');
      document.getElementById('authPage')?.classList.remove('hide');
      document.documentElement.classList.remove('locked');
      document.body.classList.remove('locked');
      const durasi = info && info.banType === 'permanent' ? 'PERMANEN' : ('sampai ' + formatTime(info?.banExpiresAt));
      showToast('error', 'Akun Di-banned', 'Akun kamu di-banned (' + durasi + '). Hubungi Admin CS.');
      switchAuthTab('login');
      setMusicVisibility(false);
    }

    async function enforceBanCheck() {
      const user = getCurrentUser();
      if (!user || !user.username || !getToken()) return;
      try {
        const res = await apiRequest('checkBan', { username: user.username }, false);
        if (res?.data?.banned) await forceLogoutBanned(res.data);
      } catch (_) { /* diamkan jika gagal cek, jangan ganggu sesi */ }
    }
