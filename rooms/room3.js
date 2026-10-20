// R3 · Brankas Sandi — Tahap 1: Password Scanner (R3-01..05), Tahap 2: Misi Pembobolan (R3-06..10),
// lalu Final Password Challenge (membuka brankas)
window.RoomModules = window.RoomModules || {};

(() => {
  const ROOM = 'R3';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ================= ATURAN FINAL CHALLENGE (draf, bisa diubah) ================= */
  const PERSONA = { nama: 'Nara', lahir: '2011', kota: 'Jember', hobi: 'futsal' };   // profil akun FIKTIF
  const MIN_LEN = 10;
  const POLA_UMUM = ['password', 'sandi', 'qwerty', 'abcd', 'admin', 'rahasia', '1234'];
  const PROFIL_TERMS = [PERSONA.nama, PERSONA.lahir, PERSONA.kota, PERSONA.hobi].map(s => s.toLowerCase());

  const RULES = [
    { id: 'PANJANG', text: `Minimal ${MIN_LEN} karakter`,
      test: p => p.length >= MIN_LEN },
    { id: 'BESAR', text: 'Ada huruf besar (A–Z)',
      test: p => /[A-Z]/.test(p) },
    { id: 'KECIL', text: 'Ada huruf kecil (a–z)',
      test: p => /[a-z]/.test(p) },
    { id: 'ANGKA', text: 'Ada angka (0–9)',
      test: p => /[0-9]/.test(p) },
    { id: 'SIMBOL', text: 'Ada simbol, misalnya ! @ # $ %',
      test: p => /[^A-Za-z0-9\s]/.test(p) },
    { id: 'PROFIL', text: 'Tidak memuat nama, tahun lahir, kota, atau hobi Agen Nara',
      test: p => !PROFIL_TERMS.some(t => p.toLowerCase().includes(t)) },
    { id: 'POLA', text: 'Tidak memakai kata umum atau pola sederhana (mis. password, 1234, qwerty, aaa)',
      test: p => !POLA_UMUM.some(t => p.toLowerCase().includes(t)) && !/(.)\1\1/.test(p) }
  ];

  /* ================= PENGUKUR KEKUATAN (SIMULASI) ================= */
  const LEVEL_LABEL = ['', 'Sangat lemah', 'Lemah', 'Sedang', 'Kuat'];
  const meterHtml = level => `
    <span class="meter lv${level}" role="img" aria-label="Kekuatan: ${LEVEL_LABEL[level]}"><span></span><span></span><span></span><span></span></span><span class="meter-label">${LEVEL_LABEL[level]}</span>`;

  /* ================= TAHAP 1: PASSWORD SCANNER ================= */
  const yn = b => (b ? 'ya' : 'tidak');
  function chipsHtml(p) {
    const c = [
      `Panjang: ${p.length} karakter`,
      `Huruf besar: ${yn(/[A-Z]/.test(p))}`,
      `Huruf kecil: ${yn(/[a-z]/.test(p))}`,
      `Angka: ${yn(/[0-9]/.test(p))}`,
      `Simbol: ${yn(/[^A-Za-z0-9\s]/.test(p))}`
    ];
    return `<div class="pw-chips">${c.map(x => `<span class="pw-chip">${esc(x)}</span>`).join('')}</div>`;
  }

  // Scanner hanya menampilkan karakteristik yang tampak, tanpa vonis kuat/lemah
  function scannerHtml(scan) {
    let body;
    if (scan.type === 'one') {
      body = `<div class="pw-display">${esc(scan.pw)}</div>${chipsHtml(scan.pw)}`;
    } else if (scan.type === 'many') {
      body = scan.list.map(pw => `<div class="pw-row"><code class="pw-code">${esc(pw)}</code>${chipsHtml(pw)}</div>`).join('');
    } else {
      body = '<div class="pw-info">Karakteristik yang diperiksa: panjang • pola sederhana • informasi pribadi • kombinasi karakter</div>';
    }
    return `
      <div class="scanner">
        <div class="scanner-head"><span class="scanner-dot"></span><span>PASSWORD SCANNER</span><span class="scanner-state">SANDI TERDETEKSI</span></div>
        <div class="scanner-body pw-body">
          ${body}
          <div class="scan-beam" aria-hidden="true"></div>
        </div>
      </div>`;
  }

  // key = indeks opsi benar (0 = A). tags = error tag per opsi (draf).
  // meter = hasil pengukur kekuatan yang ditampilkan SETELAH siswa menjawab.
  const SCAN = [
    { id: 'R3-01', scan: { type: 'one', pw: '12345678' },
      meter: [{ pw: '12345678', level: 1 }],
      stimulus: 'Password Scanner menemukan sandi: 12345678.',
      question: 'Bagaimana hasil pemeriksaannya?',
      options: [
        'Sangat kuat karena terdiri dari delapan karakter',
        'Sangat lemah karena pola angka mudah ditebak',
        'Aman karena tidak menggunakan huruf',
        'Paling aman untuk semua akun'
      ],
      key: 1, tags: ['PANJANG_SAJA_CUKUP', null, 'ANGKA_SAJA_AMAN', 'POLA_AMAN_SEMUA'],
      explanation: 'Urutan angka sederhana merupakan pola yang mudah ditebak.',
      hint: 'Jangan hanya menghitung panjang; perhatikan pola yang mudah ditebak.' },

    { id: 'R3-02', scan: { type: 'one', pw: 'password123' },
      meter: [{ pw: 'password123', level: 2 }],
      stimulus: 'Password Scanner menemukan sandi: password123.',
      question: 'Mengapa sandi tersebut berisiko?',
      options: [
        'Menggunakan kata umum dan angka sederhana',
        'Terlalu banyak simbol',
        'Tidak memiliki angka',
        'Tidak dapat diketik'
      ],
      key: 0, tags: [null, 'SALAH_ALASAN_RISIKO', 'SALAH_ALASAN_RISIKO', 'SALAH_ALASAN_RISIKO'],
      explanation: 'Kata “password” dan angka sederhana merupakan kombinasi yang mudah ditebak.',
      hint: 'Perhatikan apakah sandi menggunakan kata umum atau pola sederhana.' },

    { id: 'R3-03', scan: { type: 'one', pw: 'Dimas2012' },
      meter: [{ pw: 'Dimas2012', level: 2 }],
      stimulus: 'Nama siswa adalah Dimas, lahir tahun 2012. Ia menggunakan sandi “Dimas2012”.',
      question: 'Apa risiko utamanya?',
      options: [
        'Sandi terlalu acak',
        'Sandi menggunakan informasi pribadi yang mudah diketahui',
        'Sandi tidak memiliki nama',
        'Sandi tidak memiliki angka'
      ],
      key: 1, tags: ['ACAK_DIANGGAP_RISIKO', null, 'SALAH_ALASAN_RISIKO', 'SALAH_ALASAN_RISIKO'],
      explanation: 'Nama dan tahun lahir dapat diketahui atau ditebak sehingga membuat sandi lebih mudah diprediksi.',
      hint: 'Cari informasi pribadi yang dapat diketahui orang lain.' },

    { id: 'R3-04', scan: { type: 'info' }, meter: null,
      stimulus: 'Dari beberapa pilihan, siswa harus memilih karakteristik sandi yang lebih kuat.',
      question: 'Pilihan yang paling tepat adalah ...',
      options: [
        'Menggunakan nama dan tanggal lahir',
        'Menggunakan kombinasi karakter dan tidak memakai informasi pribadi yang mudah ditebak',
        'Menggunakan 12345678',
        'Menggunakan kata “password”'
      ],
      key: 1, tags: ['PAKAI_INFO_PRIBADI', null, 'POLA_ANGKA_SEDERHANA', 'KATA_UMUM'],
      explanation: 'Sandi yang lebih kuat menghindari informasi pribadi dan pola sederhana serta menggunakan kombinasi karakter yang sulit ditebak.',
      hint: 'Hindari nama, tanggal lahir, dan pola umum.' },

    // Huruf A–D pada stimulus dihilangkan karena urutan opsi diacak saat ditampilkan.
    { id: 'R3-05', scan: { type: 'many', list: ['Andi2012', '12345678', 'K7!mQ2#zP9', 'password123'] },
      meter: [
        { pw: 'Andi2012', level: 2 }, { pw: '12345678', level: 1 },
        { pw: 'K7!mQ2#zP9', level: 4 }, { pw: 'password123', level: 2 }
      ],
      stimulus: 'Bandingkan empat sandi berikut.',
      question: 'Sandi manakah yang paling kuat berdasarkan karakteristik yang terlihat?',
      options: ['Andi2012', '12345678', 'K7!mQ2#zP9', 'password123'],
      key: 2, tags: ['INFO_PRIBADI', 'POLA_ANGKA_SEDERHANA', null, 'KATA_UMUM'],
      explanation: 'Pilihan K7!mQ2#zP9 menggunakan kombinasi karakter dan tidak terlihat seperti informasi pribadi atau pola sederhana.',
      hint: 'Cari pilihan yang paling sulit ditebak berdasarkan pola yang tampak.' }
  ];

  const meterFeedback = it => !it.meter ? '' : `
    <div class="mt-3">
      <div class="small fw-bold mb-1">Pengukur kekuatan (simulasi)</div>
      ${it.meter.map(m => `<div class="meter-row"><code>${esc(m.pw)}</code>${meterHtml(m.level)}</div>`).join('')}
    </div>`;

  /* ================= TAHAP 2: MISI PEMBOBOLAN ================= */
  const CASES = [
    { id: 'R3-06',
      stimulus: 'Sandi akun siswa adalah “Rina2012”. Ia ingin membuatnya lebih aman.',
      question: 'Tindakan yang paling tepat adalah ...',
      options: [
        'Mengganti menjadi “Rina2013”',
        'Menambahkan tanggal lahir lengkap',
        'Membuat sandi baru yang tidak memakai informasi pribadi dan menggunakan kombinasi karakter yang lebih sulit ditebak',
        'Membagikannya kepada teman untuk diperiksa'
      ],
      key: 2, tags: ['UBAH_SEDIKIT_INFO_PRIBADI', 'TAMBAH_INFO_PRIBADI', null, 'SHARE_PASSWORD'],
      explanation: 'Mengubah angka pada informasi pribadi tidak cukup. Sandi baru sebaiknya tidak bergantung pada informasi pribadi yang mudah ditebak.',
      hint: 'Jangan hanya mengubah sedikit informasi pribadi.' },

    { id: 'R3-07',
      stimulus: 'Teman berkata, “Kirim password akunmu lewat chat, aku cuma mau membantu.”',
      question: 'Respons paling aman adalah ...',
      options: [
        'Kirim karena teman dapat dipercaya',
        'Jangan membagikan password; gunakan cara lain untuk meminta bantuan',
        'Kirim setelah mengganti nama akun',
        'Kirim ke grup agar ada saksi'
      ],
      key: 1, tags: ['PERCAYA_TEMAN', null, 'SHARE_PASSWORD', 'SHARE_PUBLIK'],
      explanation: 'Password tetap merupakan kredensial rahasia meskipun permintaan datang dari teman.',
      hint: 'Kredensial tidak menjadi aman hanya karena orang yang meminta adalah teman.' },

    { id: 'R3-08',
      stimulus: 'Siswa login ke akun belajar menggunakan komputer umum di perpustakaan.',
      question: 'Setelah selesai, tindakan yang paling aman adalah ...',
      options: [
        'Membiarkan akun tetap login',
        'Logout dan memastikan data/kredensial tidak tersimpan untuk pengguna berikutnya',
        'Menulis password di komputer',
        'Menutup monitor tanpa logout'
      ],
      key: 1, tags: ['LUPA_LOGOUT', null, 'TULIS_PASSWORD_PERANGKAT', 'LUPA_LOGOUT'],
      explanation: 'Logout dan memastikan kredensial tidak tersimpan membantu mencegah orang berikutnya mengakses akun.',
      hint: 'Pikirkan apa yang dapat dilakukan pengguna berikutnya jika akun masih terbuka.' },

    { id: 'R3-09',
      stimulus: 'Siswa menggunakan satu password yang sama untuk email, akun belajar, dan media sosial. Password tersebut kemudian diketahui orang lain.',
      question: 'Apa risiko utama dari kebiasaan tersebut?',
      options: [
        'Hanya satu akun yang terpengaruh',
        'Banyak akun dapat ikut berisiko karena menggunakan kredensial yang sama',
        'Semua akun otomatis menjadi lebih aman',
        'Tidak ada risiko jika username berbeda'
      ],
      key: 1, tags: ['ABAIKAN_REUSE', null, 'SALAH_REUSE_AMAN', 'ABAIKAN_REUSE'],
      explanation: 'Penggunaan password yang sama pada banyak akun membuat kompromi satu password dapat berdampak pada beberapa akun.',
      hint: 'Hubungkan satu password yang sama dengan beberapa akun.' },

    { id: 'R3-10',
      stimulus: 'Sebuah link login dikirim melalui pesan. Alamat situs terlihat berbeda dari layanan yang biasa digunakan dan meminta username serta password.',
      question: 'Apa tindakan paling aman?',
      options: [
        'Memasukkan password untuk menguji',
        'Mengabaikan link dan membuka layanan melalui alamat/aplikasi resmi yang diketahui',
        'Mengirim link kepada teman untuk dicoba',
        'Memasukkan password lalu segera menggantinya'
      ],
      key: 1, tags: ['COBA_DI_PHISHING', null, 'SEBAR_LINK', 'COBA_LALU_GANTI'],
      explanation: 'Link mencurigakan sebaiknya tidak digunakan untuk login. Akses layanan melalui jalur resmi yang diketahui.',
      hint: 'Jangan memasukkan kredensial pada halaman yang alamatnya mencurigakan.' }
  ];

  // Ilustrasi tiap kasus (semua fiktif)
  const CASE_VISUAL = {
    'R3-06': () => `<div class="case-pw">Rina2012</div><div class="case-note">Sandi akun belajar saat ini (fiktif)</div>`,
    'R3-07': () => `<div class="case-bubble"><div class="case-who">Teman</div>“Kirim password akunmu lewat chat, aku cuma mau membantu.”</div>`,
    'R3-08': () => `<div class="case-device"><span class="case-device-ico">🖥️</span><span><b>Komputer umum</b><br><small>Perpustakaan sekolah</small></span></div><div class="case-note">Status: akun belajar masih login</div>`,
    'R3-09': () => `<div class="case-chain"><span class="node">📧<br>Email</span><span class="link">🔗</span><span class="node">🎓<br>Akun belajar</span><span class="link">🔗</span><span class="node">💬<br>Media sosial</span></div><div class="case-note">Satu password yang sama untuk ketiganya, lalu password itu diketahui orang lain.</div>`,
    'R3-10': () => `<div class="case-url ok"><span>Alamat yang biasa dipakai</span><code>akun-belajar.example</code></div><div class="case-url bad"><span>Alamat pada pesan</span><code>akun-belajar.verifikasi-login.example/masuk</code></div><div class="case-note">Halaman tersebut meminta username dan password.</div>`
};

  const casePanel = it => `
    <div class="case-panel">
      <div class="case-head"><span>🚨 ALARM BRANKAS</span><span class="case-tag">${it.id}</span></div>
      <div class="case-body">${CASE_VISUAL[it.id]()}</div>
    </div>`;

  /* ================= BRANKAS (SVG buatan sendiri) ================= */
  const safeSvg = () => `
    <svg class="safe" viewBox="0 0 220 190" role="img" aria-label="Brankas digital">
      <rect class="safe-body" x="10" y="10" width="200" height="165" rx="14"/>
      <rect class="safe-inner" x="30" y="30" width="160" height="125" rx="8"/>
      <text class="safe-key" x="110" y="108" text-anchor="middle" font-size="48">🔑</text>
      <g class="safe-door">
        <rect class="safe-doorface" x="30" y="30" width="160" height="125" rx="8"/>
        <g class="safe-dial-g">
          <circle class="safe-dial" cx="110" cy="92" r="30"/>
          <circle class="safe-ticks" cx="110" cy="92" r="24"/>
          <rect class="safe-handle" x="107" y="68" width="6" height="24" rx="3"/>
        </g>
      </g>
      <rect class="safe-foot" x="30" y="175" width="26" height="8" rx="2"/>
      <rect class="safe-foot" x="164" y="175" width="26" height="8" rx="2"/>
    </svg>`;

  const reducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ================= MODUL ROOM ================= */
  RoomModules.R3 = {
    start(ctx) {
      const el = ctx.container;
      let res1 = [], res2 = [];

      /* ---------- INTRO ---------- */
      function intro() {
        el.innerHTML = `
          <h5>🔐 R3 · Brankas Sandi</h5>
          <div class="safe-wrap">${safeSvg()}</div>
          <p class="stimulus">Misi Agen: brankas digital terkunci karena sistem mendeteksi beberapa sandi lemah dan kebiasaan akun yang berbahaya.</p>
          <ol class="stimulus ps-3">
            <li>Tahap 1, Password Scanner: analisis 5 contoh sandi.</li>
            <li>Tahap 2, Misi Pembobolan: tangani 5 alarm keamanan akun.</li>
            <li>Final: susun sandi yang memenuhi aturan keamanan untuk membuka brankas.</li>
          </ol>
          <p class="stimulus">Semua sandi di sini hanya contoh dan simulasi. Selesaikan semuanya untuk mendapatkan <b>Kunci Akun</b>.</p>
          <button type="button" class="btn btn-info w-100" id="btnGo">Mulai Misi</button>`;
        el.querySelector('#btnGo').onclick = stage1;
      }

      /* ---------- TAHAP 1 ---------- */
      function stage1() {
        Assessment.run({
          container: el, items: SCAN, room: ROOM,
          label: 'R3 · Tahap 1: Password Scanner',
          hint: true, feedback: true,
          offset: 0, grandTotal: 10,
          topHtml: it => scannerHtml(it.scan),
          feedbackHtml: it => meterFeedback(it),
          onDone: r => { res1 = r.results; stage1Summary(); }
        });
      }

      function stage1Summary() {
        const ok = res1.filter(x => x.ok).length;
        el.innerHTML = `
          <h5>✅ Tahap 1 selesai</h5>
          <p class="stimulus">Analisis sandi yang tepat: <b>${ok}/5</b>.</p>
          <div class="persona">
            <b>Catatan Agen: ciri sandi yang kuat</b>
            <ul class="mb-0 mt-1 ps-3">
              <li>Tidak berupa pola sederhana atau kata umum</li>
              <li>Tidak memuat nama, tanggal lahir, atau informasi pribadi</li>
              <li>Memadukan huruf besar, huruf kecil, angka, dan simbol</li>
              <li>Cukup panjang dan berbeda untuk setiap akun</li>
            </ul>
          </div>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnS2">Lanjut ke Misi Pembobolan</button>`;
        el.querySelector('#btnS2').onclick = stage2;
      }

      /* ---------- TAHAP 2 ---------- */
      function stage2() {
        Assessment.run({
          container: el, items: CASES, room: ROOM,
          label: 'R3 · Tahap 2: Misi Pembobolan',
          hint: true, feedback: true,
          offset: 5, grandTotal: 10,
          topHtml: casePanel,
          onDone: r => { res2 = r.results; finalChallenge(); }
        });
      }

      /* ---------- FINAL PASSWORD CHALLENGE ---------- */
      function finalChallenge() {
        const t0 = Date.now();
        let attempts = 0, hints = 0, unlocked = false;

        el.innerHTML = `
          <h5>🔐 Final Challenge: Buka Brankas</h5>
          <div class="safe-wrap" id="safeWrap">${safeSvg()}</div>
          <p class="stimulus">Semua alarm sudah ditangani. Tinggal membuka brankas dengan sandi yang memenuhi semua aturan.</p>
          <div class="persona">
            <b>Profil akun fiktif: Agen ${esc(PERSONA.nama)}</b><br>
            Lahir: ${esc(PERSONA.lahir)} • Kota: ${esc(PERSONA.kota)} • Hobi: ${esc(PERSONA.hobi)}
          </div>
          <div class="alert alert-warning small mt-3 mb-3">Ini hanya simulasi. <b>Jangan memakai passwordmu yang asli.</b> Buat sandi baru khusus untuk akun fiktif ini.</div>

          <label class="form-label" for="pw">Susun sandi untuk Agen ${esc(PERSONA.nama)}</label>
          <input id="pw" class="form-control pw-input" type="text" maxlength="40"
                 autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
                 placeholder="Ketik sandi simulasi">
          <div class="mt-2" id="meterBox"></div>

          <ul class="rule-list mt-2" id="rules">
            ${RULES.map(r => `<li><span class="ri">○</span><span>${esc(r.text)}</span></li>`).join('')}
          </ul>

          <button type="button" class="btn btn-sm btn-outline-info mt-3" id="btnHint">💡 Petunjuk</button>
          <div class="alert alert-info mt-2 mb-0" id="hintBox" hidden></div>
          <div id="finalMsg" class="mt-3"></div>

          <button type="button" class="btn btn-info w-100 mt-3" id="btnTry" disabled>Coba Buka Brankas</button>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnKey" hidden>Ambil Kunci Akun</button>`;

        const input = el.querySelector('#pw');
        const rulesEl = el.querySelector('#rules');
        const meterBox = el.querySelector('#meterBox');
        const btnTry = el.querySelector('#btnTry');
        const msg = el.querySelector('#finalMsg');

        // Memeriksa semua aturan; hasilnya hanya berupa daftar lolos/gagal (sandi tidak disimpan)
        function evaluate() {
          const p = input.value;
          const res = RULES.map(r => ({ id: r.id, ok: p.length > 0 && r.test(p) }));
          const passes = res.filter(x => x.ok).length;

          [...rulesEl.children].forEach((li, i) => {
            li.className = !p ? '' : (res[i].ok ? 'ok' : 'bad');
            li.querySelector('.ri').textContent = !p ? '○' : (res[i].ok ? '✓' : '✗');
          });

          if (!p) {
            meterBox.innerHTML = '<span class="small text-secondary">Pengukur kekuatan muncul setelah kamu mengetik.</span>';
          } else {
            const level = passes === RULES.length ? 4 : passes >= 5 ? 3 : passes >= 3 ? 2 : 1;
            meterBox.innerHTML = meterHtml(level);
          }
          btnTry.disabled = unlocked || p.length === 0;
          return res;
        }

        input.addEventListener('input', () => { msg.innerHTML = ''; evaluate(); });
        evaluate();

        el.querySelector('#btnHint').onclick = () => {
          hints++;
          const box = el.querySelector('#hintBox');
          box.textContent = 'Gabungkan beberapa kata acak yang tidak berhubungan denganmu, lalu selipkan huruf besar, angka, dan simbol. Hindari semua hal yang ada pada profil Agen Nara.';
          box.hidden = false;
          Api.log({ aktivitas: 'hint_used', room: ROOM, item_id: 'R3-FINAL', hint: hints });
        };

        btnTry.onclick = () => {
          if (unlocked) return;
          attempts++;
          const res = evaluate();
          const pass = res.every(x => x.ok);

          Api.log({
            aktivitas: 'final_password_attempt', room: ROOM, item_id: 'R3-FINAL',
            benar: pass, hint: hints, attempt: attempts,
            durasi: Math.round((Date.now() - t0) / 1000),
            detail: JSON.stringify({
              lolos: res.filter(x => x.ok).map(x => x.id),
              gagal: res.filter(x => !x.ok).map(x => x.id)
            })
          });

          if (!pass) {
            const gagal = res.filter(x => !x.ok).length;
            msg.innerHTML = `<div class="feedback bad"><b>Brankas masih terkunci.</b> Masih ada ${gagal} aturan yang belum terpenuhi. Perhatikan tanda ✗ pada daftar.</div>`;
            return;
          }

          unlocked = true;
          input.disabled = true;
          btnTry.hidden = true;
          el.querySelector('.safe').classList.add('open');
          msg.innerHTML = '<div class="feedback ok"><b>Brankas terbuka!</b> Sandimu memenuhi semua aturan keamanan. Kunci Akun ada di dalam.</div>';
          setTimeout(() => { el.querySelector('#btnKey').hidden = false; }, reducedMotion() ? 0 : 1800);
        };

        el.querySelector('#btnKey').onclick = () => {
          const correct = res1.concat(res2).filter(x => x.ok).length;
          ctx.complete(Math.round((correct / 10) * 100));
        };
      }

      // Materi pengantar tampil dulu (bisa dilewati), lalu intro misi
      if (typeof Materi !== 'undefined') Materi.briefing({ container: el, room: ROOM, onDone: intro }); else intro();
    }
  };
})();