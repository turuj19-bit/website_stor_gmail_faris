// leaderboard.js — Leaderboard/peringkat

    // ============================================================
    // LEADERBOARD - PERBAIKAN TOTAL (TANPA BUG, TOMBOL SELALU RESPONSIF)
    // ============================================================
    const leaderboardState = {
      currentPeriod: 'today',
      isLoading: false,
      abortController: null,
      cache: {},
      CACHE_TTL: 10000,
      pendingRequest: null
    };

    async function loadLeaderboard(period) {
      if (leaderboardState.isLoading) {
        if (leaderboardState.abortController) {
          leaderboardState.abortController.abort();
          leaderboardState.abortController = null;
        }
        await new Promise(resolve => setTimeout(resolve, 150));
        if (leaderboardState.isLoading) {
          leaderboardState.isLoading = false;
        }
      }

      leaderboardState.isLoading = true;
      leaderboardState.currentPeriod = period;

      const container = safeGet('leaderboardContent');
      if (!container) {
        leaderboardState.isLoading = false;
        return;
      }

      updateActiveTab(period);

      const cached = leaderboardState.cache[period];
      if (cached && (Date.now() - cached.timestamp < leaderboardState.CACHE_TTL)) {
        renderLeaderboardHTML(container, cached.data);
        leaderboardState.isLoading = false;
        return;
      }

      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-spinner fa-spin"></i></div>
          <p>Memuat data leaderboard...</p>
        </div>
      `;

      leaderboardState.abortController = new AbortController();

      try {
        const result = await apiRequest('getLeaderboard', { period }, true, 15000);
        const data = result.data || [];
        leaderboardState.cache[period] = { data, timestamp: Date.now() };
        renderLeaderboardHTML(container, data);
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Leaderboard request dibatalkan.');
          return;
        }
        console.warn('Leaderboard error:', err);
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
            <p>Gagal memuat data: ${err.message}</p>
            <button onclick="loadLeaderboard('${period}')" 
              style="margin-top:12px;padding:8px 20px;background:var(--blue-primary);color:#fff;border-radius:99px;font-weight:700;border:none;cursor:pointer;">
              Coba Lagi
            </button>
          </div>
        `;
      } finally {
        leaderboardState.isLoading = false;
        leaderboardState.abortController = null;
      }
    }

    function updateActiveTab(period) {
      document.querySelectorAll('#leaderboardTabs .riwayat-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.period === period);
      });
    }

    function renderLeaderboardHTML(container, data) {
      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon"><i class="fas fa-trophy"></i></div>
            <p>Belum ada data untuk periode ini.</p>
          </div>
        `;
        return;
      }

      let html = '';

      const top3 = data.slice(0, 3);
      if (top3.length > 0) {
        let podiumOrder = [];
        if (top3.length === 1) {
          podiumOrder = [top3[0]];
        } else if (top3.length === 2) {
          podiumOrder = [top3[1], top3[0]];
        } else {
          podiumOrder = [top3[1], top3[0], top3[2]];
        }

        html += `<div class="podium-container">`;
        podiumOrder.forEach((item, idx) => {
          let rank = 0;
          if (top3.length === 1) {
            rank = 1;
          } else if (top3.length === 2) {
            rank = idx === 0 ? 2 : 1;
          } else {
            rank = idx === 0 ? 2 : (idx === 1 ? 1 : 3);
          }
          let podiumClass = '';
          let rankDisplay = '';
          if (rank === 1) { podiumClass = 'podium-1'; rankDisplay = '👑'; }
          else if (rank === 2) { podiumClass = 'podium-2'; rankDisplay = '🥈'; }
          else if (rank === 3) { podiumClass = 'podium-3'; rankDisplay = '🥉'; }

          const av = buildAvatarVisual(item);
          const displayName = item.fullname || item.username || 'User';
          const totalEmails = item.totalEmails || 0;
          const totalAmount = item.totalAmount || 0;

          html += `
            <div class="podium-item ${podiumClass}">
              <div class="podium-content">
                <div class="podium-rank">${rankDisplay}</div>
                <div class="podium-avatar${buildFrameClass(item)}" style="${av.styleAttr}">${av.contentHtml}</div>
                <div class="podium-name">${escapeHtml(displayName)}${buildVerifiedBadgeHtml(item)}</div>
                <div class="podium-email">${totalEmails} Gmail diterima</div>
                <div class="podium-amount">Rp${formatRupiah(totalAmount)}</div>
              </div>
              <div class="podium-box ${podiumClass}">
                <div class="podium-number">${rank}</div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }

      const rest = data.slice(3);
      if (rest.length > 0) {
        html += `<div class="leaderboard-list">`;
        rest.forEach((item, index) => {
          const rank = index + 4;
          const av = buildAvatarVisual(item);
          const displayName = item.fullname || item.username || 'User';
          const totalEmails = item.totalEmails || 0;
          const totalAmount = item.totalAmount || 0;

          html += `
            <div class="leaderboard-item">
              <div class="rank">#${rank}</div>
              <div class="avatar${buildFrameClass(item, 'sm')}" style="${av.styleAttr}">${av.contentHtml}</div>
              <div class="info">
                <div class="name">${escapeHtml(displayName)}${buildVerifiedBadgeHtml(item)}</div>
                <div class="emails">${totalEmails} Gmail diterima</div>
              </div>
              <div class="amount">Rp${formatRupiah(totalAmount)}</div>
            </div>
          `;
        });
        html += `</div>`;
      }

      container.innerHTML = html;
    }
