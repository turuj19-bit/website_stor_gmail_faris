// emoji.js — Emoji picker & efek tilt grid emoji

    // ============================================================
    // EMOJI PICKER — set emoji lengkap ala keyboard HP pada umumnya,
    // dikelompokkan per kategori (tab) biar gampang dicari.
    // ============================================================
    const EMOJI_CATEGORIES = [
      { icon: '😀', list: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','😵‍💫','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯','😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'] },
      { icon: '👋', list: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦿','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','🫦','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','👯','🧖','🧗','🤺','🏇','⛷️','🏂','🏌️','🏄','🚣','🏊','⛹️','🏋️','🚴','🚵','🤸','🤼','🤽','🤾','🤹','🧘','🛀','🛌','👭','👫','👬','💏','💑','👪'] },
      { icon: '🐶', list: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐','🌟','✨','⚡','☄️','💥','🔥','🌪️','🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','💧','💦','☔','☂️','🌊','🌫️'] },
      { icon: '🍏', list: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️','🥣','🥡','🥢','🧂'] },
      { icon: '⚽', list: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','🎪','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩','🏆','🥇','🥈','🥉','🏅','🎖️'] },
      { icon: '🚗', list: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','🪝','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','♨️','🎑'] },
      { icon: '⌚', list: ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','🧾','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','🩹','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🪒','🧴','🧷','🧽','🧼','🪥','🛒','🚪','🪑','🛋️','🛏️','🪆','🖼️','🪞','🪟','🛍️','🎁','🎈','🎀','🪅','🪩','🎊','🎉','🎎','🏮','🎏','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','📊','📈','📉','🗒️','🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'] },
      { icon: '❤️', list: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','⬛','⬜','🟥','🟧','🟨','🟩','🟦','🟪','🟫'] },
      { icon: '🏳️', list: ['🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🇮🇩','🇺🇸','🇬🇧','🇯🇵','🇰🇷','🇨🇳','🇸🇦','🇲🇾','🇸🇬','🇹🇭','🇻🇳','🇵🇭','🇮🇳','🇩🇪','🇫🇷','🇮🇹','🇪🇸','🇵🇹','🇳🇱','🇷🇺','🇧🇷','🇨🇦','🇦🇺','🇦🇪','🇹🇷','🇪🇬','🇳🇬','🇿🇦','🇲🇽','🇦🇷','🇨🇭','🇸🇪'] }
    ];
    let activeEmojiCategory = 0;

    // Kata kunci pencarian buat sebagian emoji yang paling sering dicari
    // (senyum, hati, jempol, dll). Emoji yang belum ada kata kuncinya tetap
    // bisa dibuka lewat tab kategori seperti biasa.
    const EMOJI_KEYWORDS = {
      '😀':'senyum wajah smile happy','😃':'senyum happy','😄':'senyum ketawa happy','😁':'senyum grin',
      '😆':'ketawa tertawa laugh','😅':'ketawa keringat sweat nervous','🤣':'ngakak lol tertawa',
      '😂':'ngakak nangis lucu ketawa laugh cry','🙂':'senyum tipis smile','🙃':'terbalik upsidedown',
      '😉':'kedip wink','😊':'senyum malu blush','😇':'malaikat innocent angel','🥰':'sayang cinta love hearteyes',
      '😍':'cinta love mata hati hearteyes','🤩':'kagum wow star struck','😘':'cium kiss','😋':'enak yummy lidah',
      '😛':'lidah tongue','😜':'lidah kedip','🤪':'gila crazy','🤑':'duit uang money','🤗':'peluk hug',
      '🤔':'mikir mikirin think hmm','🤐':'diam tutup mulut zip','😐':'datar netral',
      '😑':'malas bosan bete','😏':'genit smirk','😒':'kesal males unamused','🙄':'muter mata rolleyes',
      '😌':'lega tenang relieved','😔':'sedih murung pensive','😪':'ngantuk sleepy','🤤':'ngiler drool',
      '😴':'tidur ngantuk sleep zzz','😷':'sakit masker mask sick','🤒':'demam sakit thermometer',
      '🤢':'mual jijik disgust','🤮':'muntah vomit','🥵':'panas gerah hot','🥶':'dingin kedinginan cold',
      '😵':'pusing dizzy','🤯':'meledak mind blown','🥳':'pesta party ultah birthday','😎':'keren cool kacamata',
      '🤓':'nerd kutu buku','🥺':'melas puppy eyes memelas','😢':'nangis sedih cry sad','😭':'nangis banget cry',
      '😱':'kaget takut scream shock','😡':'marah kesal angry','😠':'marah angry','🤬':'marah kasar swear',
      '😈':'nakal jahil devil','💀':'mati tengkorak skull mati banget','👻':'hantu ghost boo','🤖':'robot bot',
      '👍':'jempol suka setuju like bagus oke','👎':'jempol turun tidak suka dislike','👏':'tepuk tangan clap',
      '🙌':'angkat tangan yeay','🙏':'doa terimakasih please pray sembah','👌':'oke ok sip','✌️':'damai peace victory',
      '🤞':'semoga good luck jari silang','💪':'kuat semangat otot strong','👋':'dadah wave halo hai',
      '🤝':'salaman handshake deal','👊':'tinju fist bump','✊':'kepal fist','🖕':'jari tengah',
      '❤️':'cinta love hati merah','🧡':'cinta oranye','💛':'cinta kuning','💚':'cinta hijau','💙':'cinta biru',
      '💜':'cinta ungu','🖤':'hati hitam black heart','🤍':'hati putih white heart','💔':'patah hati sedih broken',
      '💕':'cinta sayang love','💖':'cinta kilau sparkle heart','💗':'cinta deg degan','💘':'cinta panah cupid',
      '💝':'hadiah cinta gift heart','🔥':'api keren fire mantap panas','✨':'kilau sparkle bagus',
      '🎉':'pesta selamat party confetti','🎊':'pesta confetti','🎂':'kue ultah birthday cake','🎁':'hadiah gift',
      '⭐':'bintang star','🌟':'bintang kilau star','💯':'seratus keren mantap perfect','💢':'kesal marah anger',
      '💦':'keringat air sweat','💤':'tidur zzz sleep','⚡':'petir kilat listrik lightning','☀️':'matahari cerah sun',
      '🌈':'pelangi rainbow','⏰':'jam alarm waktu time','📌':'pin penting','✅':'centang benar oke check',
      '❌':'silang salah tidak wrong x','❓':'tanya bingung question','❗':'seru penting exclamation',
      '🐶':'anjing dog','🐱':'kucing cat','🐼':'panda','🦁':'singa lion','🐷':'babi pig','🐸':'kodok katak frog',
      '🍕':'pizza','🍔':'burger','🍟':'kentang goreng fries','🍜':'mie noodle','🍚':'nasi rice','☕':'kopi coffee',
      '🍺':'bir beer','🍰':'kue cake','🍩':'donat donut','🍫':'coklat chocolate'
    };

    function loadEmojis() {
      const tabs = document.getElementById('emojiTabs');
      const grid = document.getElementById('emojiGrid');
      if (!tabs || !grid) return;
      if (!tabs.dataset.built) {
        tabs.innerHTML = EMOJI_CATEGORIES.map((cat, i) =>
          `<button class="emoji-tab-btn${i === activeEmojiCategory ? ' active' : ''}" onclick="switchEmojiCategory(${i})">${cat.icon}</button>`
        ).join('');
        tabs.dataset.built = '1';
      }
      renderEmojiGrid();
      initEmojiGridTilt();
    }

    function switchEmojiCategory(index) {
      activeEmojiCategory = index;
      const tabs = document.getElementById('emojiTabs');
      if (tabs) {
        Array.from(tabs.children).forEach((btn, i) => btn.classList.toggle('active', i === index));
      }
      renderEmojiGrid();
    }

    function renderEmojiGrid() {
      const grid = document.getElementById('emojiGrid');
      const cat = EMOJI_CATEGORIES[activeEmojiCategory];
      if (!grid || !cat) return;
      grid.innerHTML = cat.list.map(e => `<button class="emoji-btn" onclick="insertEmoji('${e}')">${e}</button>`).join('');
      grid.scrollTop = 0;
      tiltEmojiGrid();
    }

    // Cari emoji lintas semua kategori berdasarkan kata kunci di EMOJI_KEYWORDS.
    function searchEmoji(query) {
      const wrap = document.getElementById('emojiSearchWrap');
      const grid = document.getElementById('emojiGrid');
      const tabs = document.getElementById('emojiTabs');
      const q = (query || '').trim().toLowerCase();
      if (wrap) wrap.classList.toggle('has-text', q.length > 0);
      if (!q) {
        if (tabs) tabs.style.display = '';
        renderEmojiGrid();
        return;
      }
      if (tabs) tabs.style.display = 'none';
      const seen = new Set();
      const results = [];
      Object.keys(EMOJI_KEYWORDS).forEach(emoji => {
        const kw = EMOJI_KEYWORDS[emoji];
        if (kw && kw.includes(q) && !seen.has(emoji)) { seen.add(emoji); results.push(emoji); }
      });
      if (!grid) return;
      grid.innerHTML = results.length
        ? results.map(e => `<button class="emoji-btn" onclick="insertEmoji('${e}')">${e}</button>`).join('')
        : `<div class="emoji-empty">Emoji "${query.replace(/[<>&]/g, '')}" tidak ditemukan</div>`;
      grid.scrollTop = 0;
      tiltEmojiGrid();
    }

    function clearEmojiSearch() {
      const input = document.getElementById('emojiSearchInput');
      if (input) input.value = '';
      searchEmoji('');
    }

    // ============================================================
    // Efek "melengkung" 3D dikit pas scroll grid emoji (ala Telegram) —
    // tiap tombol emoji dimiringkan (rotateX) & diskalakan sesuai jaraknya
    // dari titik tengah grid, dihaluskan pakai requestAnimationFrame biar
    // ringan dan tidak nge-lag.
    // ============================================================
    let __emojiTiltRAF = null;
    let __emojiGridTiltBound = false;
    function tiltEmojiGrid() {
      if (__emojiTiltRAF) return;
      __emojiTiltRAF = requestAnimationFrame(() => {
        __emojiTiltRAF = null;
        const grid = document.getElementById('emojiGrid');
        if (!grid) return;
        const gridRect = grid.getBoundingClientRect();
        const centerY = gridRect.top + gridRect.height / 2;
        const halfH = gridRect.height / 2 || 1;
        const btns = grid.querySelectorAll('.emoji-btn');
        btns.forEach(btn => {
          const r = btn.getBoundingClientRect();
          const btnCenter = r.top + r.height / 2;
          let d = (btnCenter - centerY) / halfH;
          if (d > 1) d = 1; else if (d < -1) d = -1;
          const rotate = d * -10;
          const scale = 1 - Math.abs(d) * 0.08;
          btn.style.transform = `rotateX(${rotate}deg) scale(${scale})`;
        });
      });
    }
    function initEmojiGridTilt() {
      if (__emojiGridTiltBound) return;
      const grid = document.getElementById('emojiGrid');
      if (!grid) return;
      grid.addEventListener('scroll', tiltEmojiGrid, { passive: true });
      __emojiGridTiltBound = true;
    }

    function insertEmoji(emoji) {
      // Kalau picker lagi dibuka dari menu tekan-lama (mode reaksi), emoji yang
      // dipilih dikirim sebagai reaksi ke pesan target, bukan diketik ke kolom pesan.
      if (emojiPickerMode === 'reaction' && reactionTargetId) {
        const id = reactionTargetId;
        reactionTargetId = null;
        emojiPickerMode = 'input';
        closeEmojiPicker();
        toggleChatReactionLocal(id, emoji);
        return;
      }
      const input = document.getElementById('chatInput');
      if (!input) return;
      input.value += emoji;
      // SENGAJA tidak manggil input.focus() di sini. Ada listener 'focus' di
      // kolom ketik yang nutup panel emoji ini (dipakai buat kasus user beneran
      // tap kolom ketik biar lanjut pakai keyboard HP) — kalau focus() dipanggil
      // di sini juga, tiap kali pilih 1 emoji panelnya bakal auto ketutup,
      // padahal niatnya biar bisa pilih beberapa emoji berturut-turut.
      // Picker sengaja tidak langsung ditutup, biar bisa pilih beberapa
      // emoji berturut-turut kayak di keyboard HP pada umumnya.
    }

    function clearChatHistoryLocal(silent) {
      chatClearedBefore = Date.now();
      localStorage.setItem('chatClearedBefore', String(chatClearedBefore));
      chatMessages = [];
      hiddenChatMsgIds.clear();
      saveHiddenChatMsgIds();
      renderChatMessages();
      if (!silent) showToast('success', 'Terhapus', 'Pesan dihapus untuk Anda.');
    }
