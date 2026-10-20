// R5 · Pusat Pertahanan (versi game)
//  - Tahap 1 (Threat Scanner) dan Tahap 2 (Cyber Defense): radar pertahanan dengan ancaman yang mendekat ke Core
//  - Final Boss: hancurkan perisai (analisis), Serangan Utama (R5-10), lalu pertarungan bergiliran
// Skor akademik hanya dari soal pilihan ganda; Core, XP, combo, dan peringkat hanya penghargaan dalam game.
// Semua tampilan hanya simulasi: tidak ada tombol, link, atau file yang benar-benar bisa dibuka.
window.RoomModules = window.RoomModules || {};

(() => {
  const ROOM = 'R5';

  // Pengaturan permainan (aman diubah)
  const CORE_R = 0.14;        // batas zona tembus (0-1 dari radius radar)
  const IDLE_SPEED = 0.012;   // gerak ancaman per detik saat radar aktif (0 = hanya bergerak setelah tiap soal)
  const BREACH_DMG = 15;      // kerusakan Core bila ancaman menembus
  const WRONG_DMG = 10;       // kerusakan Core bila jawaban salah

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const prefersReducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ================= MOCKUP ANCAMAN (statis, fiktif) ================= */
  const chips = arr => `<div class="tm-chips">${arr.map(c => `<span class="tm-chip">${esc(c)}</span>`).join('')}</div>`;

  const MOCKS = {
    inbox: m => `
      <div class="tm">
        <div class="tm-bar">📧 KOTAK MASUK</div>
        <div class="tm-body">
          <div class="tm-row"><b>Dari:</b> ${esc(m.from)}</div>
          <div class="tm-row"><b>Judul:</b> ${esc(m.subject)}</div>
          <div class="tm-msg">${esc(m.body)}</div>
          <div class="tm-link">🔗 ${esc(m.link)}</div>
          ${m.timer ? `<div class="tm-timer">⏳ ${esc(m.timer)}</div>` : ''}
        </div>
      </div>`,

    login: m => `
      <div class="tm">
        <div class="tm-bar">🌐 <span class="tm-url">${esc(m.url)}</span></div>
        <div class="tm-body">
          <div class="tm-title">Masuk ke Akun Belajar</div>
          <div class="tm-input" aria-hidden="true">Username</div>
          <div class="tm-input" aria-hidden="true">Password</div>
          <span class="fake-btn" aria-hidden="true">Masuk</span>
          <div class="tm-note">Alamat layanan resmi yang biasa kamu pakai: <code>${esc(m.official)}</code></div>
        </div>
      </div>`,

    file: m => `
      <div class="tm">
        <div class="tm-bar">📎 LAMPIRAN</div>
        <div class="tm-body tm-file">
          <span class="tm-fileico">⚙️</span>
          <span>
            <b>${esc(m.name)}</b><br>
            <small>${esc(m.size)} • ${esc(m.from)}</small><br>
            <small class="tm-warn">⚠️ ${esc(m.note)}</small>
          </span>
        </div>
      </div>`,

    perm: m => `
      <div class="tm">
        <div class="tm-bar">📱 PERMINTAAN IZIN</div>
        <div class="tm-body">
          <div class="tm-title">“${esc(m.app)}” meminta izin</div>
          <div class="tm-row"><b>Fungsi aplikasi:</b> ${esc(m.fungsi)}</div>
          <ul class="perm-list">${m.perms.map(p => `<li>☐ Akses ${esc(p)}</li>`).join('')}</ul>
          <span class="fake-btn" aria-hidden="true">Izinkan semua</span>
          <span class="fake-btn alt" aria-hidden="true">Tolak</span>
        </div>
      </div>`,

    popup: m => `
      <div class="tm">
        <div class="tm-bar">🌐 SITUS YANG SEDANG DIBUKA</div>
        <div class="tm-body">
          <div class="pop">
            <div class="pop-title">⚠️ ${esc(m.title)}</div>
            <div class="pop-text">${esc(m.text)}</div>
            <span class="fake-btn danger" aria-hidden="true">${esc(m.btn)}</span>
          </div>
        </div>
      </div>`,

    incident: m => `
      <div class="tm">
        <div class="tm-bar">🛡️ LAPORAN INSIDEN</div>
        <div class="tm-body" style="text-align:center">
          <div class="tm-fileico">${m.icon}</div>
          <div class="tm-title">${esc(m.title)}</div>
          ${chips(m.chips)}
        </div>
      </div>`,

    timeline: m => `
      <div class="tm">
        <div class="tm-bar">🛡️ KRONOLOGI KEJADIAN</div>
        <div class="tm-body">
          <div class="tm-timeline">
            ${m.steps.map((s, i) => `${i ? '<span class="tm-arrow">→</span>' : ''}<span class="tm-step"><span class="tm-fileico">${s.icon}</span><br>${esc(s.text)}</span>`).join('')}
          </div>
        </div>
      </div>`
  };

  /* ================= KASUS ================= */
  // key = indeks opsi benar (0 = A). tags = error tag per opsi (draf). icon = tampilan titik di radar.
  const STAGE1 = [
    { id: 'R5-01', icon: '📩',
      mock: { type: 'inbox', from: 'Undian Hadiah <promo@undian-hadiah.example>', subject: 'SELAMAT! Kamu terpilih',
        body: 'Selamat! Kamu memenangkan hadiah. Klik link ini dan isi data akun sebelum 10 menit.',
        link: 'pendek.example/klaim-hadiah', timer: 'Sisa waktu: 09:59' },
      stimulus: 'Pesan: “Selamat! Kamu memenangkan hadiah. Klik link ini dan isi data akun sebelum 10 menit.”',
      question: 'Tanda yang paling mencurigakan adalah ...',
      options: ['Ada ucapan selamat', 'Hadiah dan tekanan waktu disertai link/data akun', 'Pesan menggunakan bahasa Indonesia', 'Pesan dikirim pagi hari'],
      key: 1, tags: ['SALAH_INDIKATOR', null, 'SALAH_INDIKATOR', 'SALAH_INDIKATOR'],
      explanation: 'Hadiah, tekanan waktu, link, dan permintaan data akun merupakan tanda yang perlu dicurigai.',
      hint: 'Cari unsur hadiah, tekanan waktu, link, dan permintaan data.' },

    { id: 'R5-02', icon: '🌐',
      mock: { type: 'login', url: 'akun-belajar.verifikasi-login.example/masuk', official: 'akun-belajar.example' },
      stimulus: 'Sebuah halaman login meminta username dan password, tetapi alamat situsnya berbeda dari alamat layanan resmi.',
      question: 'Ancaman yang perlu dicurigai adalah ...',
      options: ['Phishing credential', 'Backup otomatis', 'Kompresi file', 'Pembaruan sistem'],
      key: 0, tags: [null, 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN'],
      explanation: 'Halaman login palsu dapat digunakan untuk mencuri kredensial.',
      hint: 'Fokus pada halaman login yang alamatnya tidak sesuai.' },

    { id: 'R5-03', icon: '📎',
      mock: { type: 'file', name: 'hadiah_gratis.exe', size: '2,4 MB', from: 'Dari pengirim tidak dikenal', note: 'File ini belum diperiksa keamanannya' },
      stimulus: 'Seorang siswa menerima file “hadiah_gratis.exe” dari sumber yang tidak dikenal.',
      question: 'Apa tindakan yang paling tepat?',
      options: ['Membuka file agar tahu isinya', 'Menganggap file aman karena namanya hadiah', 'Tidak membuka dan memeriksa sumber/keamanannya terlebih dahulu', 'Mengirimkannya ke teman'],
      key: 2, tags: ['BUKA_FILE_UJI', 'PERCAYA_NAMA_FILE', null, 'SEBAR_FILE'],
      explanation: 'File executable dari sumber tidak dikenal dapat berpotensi mengandung malware sehingga tidak sebaiknya langsung dibuka.',
      hint: 'Ekstensi dan sumber file sama-sama perlu diperhatikan.' },

    { id: 'R5-04', icon: '📱',
      mock: { type: 'perm', app: 'Warna Foto', fungsi: 'Mengubah warna foto', perms: ['kontak', 'mikrofon', 'lokasi', 'pesan'] },
      stimulus: 'Sebuah aplikasi sederhana untuk mengubah warna foto meminta akses ke kontak, mikrofon, lokasi, dan pesan.',
      question: 'Apa yang perlu dilakukan?',
      options: [
        'Izinkan semua karena aplikasi terlihat menarik',
        'Analisis apakah setiap izin relevan dengan fungsi aplikasi dan batasi izin yang tidak diperlukan',
        'Berikan password akun',
        'Bagikan izin kepada teman'
      ],
      key: 1, tags: ['IZIN_SEMUA', null, 'BAGI_KREDENSIAL', 'BAGI_IZIN'],
      explanation: 'Izin aplikasi sebaiknya sesuai kebutuhan fungsinya; izin yang tidak relevan perlu dipertimbangkan dan dibatasi.',
      hint: 'Bandingkan fungsi aplikasi dengan izin yang diminta.' },

    { id: 'R5-05', icon: '⚠️',
      mock: { type: 'popup', title: 'VIRUS TERDETEKSI!', text: 'Klik tombol sekarang untuk membersihkan perangkat.', btn: 'BERSIHKAN SEKARANG' },
      stimulus: 'Saat membuka situs, muncul pop-up: “VIRUS TERDETEKSI! Klik tombol sekarang untuk membersihkan perangkat.”',
      question: 'Apa yang perlu dicurigai?',
      options: ['Scareware/fake alert', 'Tugas sekolah', 'Penyimpanan cloud', 'Pesan biasa'],
      key: 0, tags: [null, 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN'],
      explanation: 'Peringatan virus yang muncul secara tiba-tiba dan mendesak pengguna mengklik dapat menjadi scareware/fake alert.',
      hint: 'Perhatikan peringatan yang menakut-nakuti dan memaksa tindakan cepat.' }
  ];

  const STAGE2 = [
    { id: 'R5-06', icon: '🔗',
      mock: { type: 'incident', icon: '🔗', title: 'Kamu tidak sengaja mengeklik tautan mencurigakan',
        chips: ['Halaman sudah terbuka', 'Belum meminta login', 'Belum ada data dimasukkan'] },
      stimulus: 'Kamu tidak sengaja mengeklik link mencurigakan. Halaman belum meminta login dan belum ada data yang dimasukkan.',
      question: 'Langkah awal yang paling aman adalah ...',
      options: [
        'Melanjutkan sampai selesai',
        'Menutup halaman dan tidak memasukkan data; kemudian melaporkan jika diperlukan',
        'Mengirim link kepada teman',
        'Memasukkan password untuk memeriksa'
      ],
      key: 1, tags: ['LANJUT_INTERAKSI', null, 'SEBAR_LINK', 'MASUKKAN_KREDENSIAL_UJI'],
      explanation: 'Jangan melanjutkan interaksi atau memasukkan kredensial ke halaman mencurigakan.',
      hint: 'Belum memasukkan data berarti jangan lanjutkan interaksi.' },

    { id: 'R5-07', icon: '🔓',
      mock: { type: 'incident', icon: '🔓', title: 'Password sudah dimasukkan ke halaman yang mencurigakan',
        chips: ['Kredensial sudah terkirim', 'Akun berpotensi diakses orang lain'] },
      stimulus: 'Siswa menyadari bahwa ia telah memasukkan password akun ke halaman phishing.',
      question: 'Apa tindakan yang paling tepat?',
      options: [
        'Diam saja agar tidak diketahui',
        'Segera mengambil langkah pengamanan akun seperti mengganti password melalui layanan resmi dan mengikuti prosedur pemulihan yang tersedia',
        'Memasukkan password lagi pada link yang sama',
        'Menyebarkan link kepada teman'
      ],
      key: 1, tags: ['DIAM_SAJA', null, 'ULANG_DI_PHISHING', 'SEBAR_LINK'],
      explanation: 'Jika kredensial telah dimasukkan ke phishing, akun perlu segera diamankan melalui jalur resmi.',
      hint: 'Gunakan layanan resmi, bukan kembali ke halaman phishing.' },

    { id: 'R5-08', icon: '💻',
      mock: { type: 'incident', icon: '💻', title: 'Perangkat berperilaku tidak biasa setelah file dibuka',
        chips: ['File dari sumber tidak dikenal', 'Perangkat melambat', 'Muncul jendela yang tidak dikenal'] },
      stimulus: 'Siswa tidak sengaja membuka file mencurigakan dari sumber tidak dikenal. Setelah itu muncul perilaku perangkat yang tidak biasa.',
      question: 'Respons awal yang paling tepat adalah ...',
      options: [
        'Terus membuka file lain untuk mengecek',
        'Hentikan aktivitas yang mencurigakan dan minta bantuan pihak yang sesuai untuk pemeriksaan',
        'Kirim file kepada teman',
        'Matikan semua keamanan perangkat'
      ],
      key: 1, tags: ['PERLUAS_RISIKO', null, 'SEBAR_FILE', 'MATIKAN_KEAMANAN'],
      explanation: 'Perangkat yang menunjukkan perilaku tidak biasa setelah membuka file mencurigakan perlu ditangani dengan hati-hati dan dapat memerlukan bantuan pihak yang sesuai.',
      hint: 'Jangan memperluas risiko; hentikan aktivitas mencurigakan dan cari bantuan.' },

    { id: 'R5-09', icon: '📨',
      mock: { type: 'timeline', steps: [
        { icon: '📩', text: 'Pesan berisi link' }, { icon: '🌐', text: 'Halaman login palsu' }, { icon: '🔑', text: 'Diminta memasukkan password' }
      ] },
      stimulus: 'Kamu menerima pesan dengan link, diarahkan ke halaman login palsu, lalu diminta memasukkan password.',
      question: 'Urutan respons yang paling tepat adalah ...',
      options: [
        'Login → simpan password → bagikan link',
        'Berhenti → jangan masukkan kredensial → keluar dari halaman → laporkan/verifikasi melalui jalur resmi',
        'Masukkan password → lihat hasil → baru berpikir',
        'Sebarkan pesan untuk meminta pendapat'
      ],
      key: 1, tags: ['LOGIN_SIMPAN_BAGIKAN', null, 'MASUKKAN_DULU_BERPIKIR_BELAKANGAN', 'SEBAR_UNTUK_PENDAPAT'],
      explanation: 'Respons aman adalah menghentikan interaksi, tidak memasukkan kredensial, keluar, lalu melakukan pelaporan/verifikasi melalui jalur resmi.',
      hint: 'Urutkan dari menghentikan risiko, melindungi kredensial, lalu melaporkan/verifikasi.' }
  ];

  /* ================= FINAL BOSS ================= */
  const BOSS_ITEM = {
    id: 'R5-10',
    stimulus: 'Final Boss: Kamu menerima pesan hadiah dengan link. Link membuka halaman login yang alamatnya mencurigakan. Di saat yang sama, ada file .exe dari pengirim yang sama.',
    question: 'Apa respons yang paling aman?',
    options: [
      'Login terlebih dahulu lalu buka file untuk memastikan hadiah',
      'Jangan login, jangan membuka file, keluar dari halaman, simpan informasi yang diperlukan untuk pelaporan, dan minta bantuan/verifikasi melalui jalur resmi',
      'Buka file tetapi jangan login',
      'Login menggunakan password lama lalu menggantinya nanti'
    ],
    key: 1, tags: ['LOGIN_DAN_BUKA_FILE', null, 'BUKA_FILE_TANPA_LOGIN', 'LOGIN_LALU_GANTI'],
    explanation: 'Kasus menggabungkan beberapa indikator ancaman. Respons aman adalah tidak berinteraksi lebih lanjut dengan link/file mencurigakan dan menggunakan jalur resmi untuk verifikasi atau bantuan.',
    hint: 'Ada lebih dari satu ancaman: link/login mencurigakan dan file executable tidak dikenal.'
  };

  // Tiga bagian serangan (perisai boss) yang dianalisis siswa
  const BOSS_PARTS = [
    { id: 'pesan', icon: '📩', label: 'Pesan hadiah', text: '“Selamat! Kamu menang hadiah. Klik link ini untuk klaim.”',
      detail: 'Hadiah dan ajakan klik link dari pengirim yang tidak dikenal adalah umpan phishing.' },
    { id: 'login', icon: '🌐', label: 'Halaman login', text: 'akun-belajar.verifikasi-login.example/masuk',
      detail: 'Alamatnya berbeda dari layanan resmi (akun-belajar.example). Halaman login palsu dipakai untuk mencuri password.' },
    { id: 'file', icon: '⚙️', label: 'Lampiran file', text: 'hadiah_gratis.exe (dari pengirim yang sama)',
      detail: 'File .exe dari sumber tidak dikenal berpotensi malware. Jangan dibuka untuk “mengecek”.' }
  ];

  // Urutan respons yang benar (5 langkah) + 3 langkah berbahaya sebagai pengecoh
  const CANON = [
    { id: 'STOP', text: 'Berhenti dan jangan berinteraksi lebih lanjut dengan pesan itu',
      why: 'Menghentikan interaksi mencegah risiko bertambah.' },
    { id: 'KREDENSIAL', text: 'Jangan login dan jangan membuka file .exe',
      why: 'Password tidak boleh dimasukkan ke halaman mencurigakan, dan file .exe asing berpotensi malware.' },
    { id: 'KELUAR', text: 'Keluar dari halaman login yang mencurigakan',
      why: 'Menutup halaman memutus kontak dengan situs palsu.' },
    { id: 'BUKTI', text: 'Simpan bukti untuk laporan, misalnya tangkapan layar pesan dan alamat link (tanpa membuka file)',
      why: 'Bukti membantu pihak yang berwenang menelusuri dan menindaklanjuti.' },
    { id: 'LAPOR', text: 'Laporkan dan minta verifikasi atau bantuan lewat jalur resmi (guru, pihak sekolah, layanan resmi)',
      why: 'Jalur resmi dapat memastikan keaslian pesan dan menangani ancaman dengan aman.' }
  ];
  const DISTRACT = [
    { id: 'D_FILE', text: 'Buka file .exe sebentar untuk memastikan hadiahnya',
      why: 'Membuka file mencurigakan sebagai percobaan dapat menjalankan malware.' },
    { id: 'D_LOGIN', text: 'Login dulu untuk memeriksa apakah hadiahnya asli',
      why: 'Memasukkan kredensial ke halaman mencurigakan memberikan password kepada penyerang.' },
    { id: 'D_SEBAR', text: 'Teruskan link ke grup kelas untuk meminta pendapat',
      why: 'Menyebarkan link mencurigakan memperluas risiko ke orang lain.' }
  ];

  // Petunjuk bertahap: prinsip urutan, bukan urutan lengkap
  const HINTS = [
    'Mulailah dengan menghentikan risiko sebelum melakukan hal lain.',
    'Lindungi kredensial dan perangkatmu, lalu jauhi halaman yang mencurigakan.',
    'Kumpulkan bukti dengan aman, baru laporkan atau verifikasi lewat jalur resmi.'
  ];

  const RANK_NAME = { S: 'Operator Elite', A: 'Operator Andal', B: 'Operator Siaga', C: 'Operator Pemula' };
  const rankOf = (correct, hpLeft) => {
    const sc = (correct / 10) * 70 + hpLeft * 0.3;
    return sc >= 90 ? 'S' : sc >= 80 ? 'A' : sc >= 65 ? 'B' : 'C';
  };

  const NOTE1 = `
    <div class="persona">
      <b>Catatan Operator: tanda-tanda ancaman</b>
      <ul class="mb-0 mt-1 ps-3">
        <li>Hadiah, tekanan waktu, dan permintaan data akun lewat link</li>
        <li>Halaman login dengan alamat yang berbeda dari layanan resmi</li>
        <li>File .exe atau lampiran dari sumber tidak dikenal</li>
        <li>Izin aplikasi yang tidak sesuai dengan fungsinya, dan peringatan yang menakut-nakuti</li>
      </ul>
    </div>`;
  const NOTE2 = `
    <div class="persona">
      <b>Catatan Operator: respons yang aman</b>
      <ul class="mb-0 mt-1 ps-3">
        <li>Hentikan interaksi dan jangan memasukkan kredensial</li>
        <li>Terlanjur memasukkan password? Amankan akun lewat layanan resmi</li>
        <li>Perangkat berperilaku aneh? Hentikan aktivitas dan minta bantuan</li>
        <li>Selalu laporkan atau verifikasi lewat jalur resmi</li>
      </ul>
    </div>`;

  /* ================= MODUL ROOM ================= */
  RoomModules.R5 = {
    start(ctx) {
      const el = ctx.container;
      const results = [];   // hasil semua soal pilihan ganda (R5-01..R5-10)
      const reduced = prefersReducedMotion();

      let hp = 100, shownHp = 100, xp = 0, combo = 0, maxCombo = 0, usedBackup = false;
      const CRIT_TEXT = ' ⚠️ SISTEM KRITIS! Cadangan darurat mengaktifkan Core di 30%.';
      const nCorrect = () => results.filter(r => r.ok).length;

      /* ---------- Status permainan ---------- */
      // Mengurangi Core; mengembalikan true bila cadangan darurat baru saja aktif
      function damage(n) {
        hp = Math.max(0, hp - n);
        combo = 0;
        if (hp === 0 && !usedBackup) { usedBackup = true; hp = 30; return true; }
        return false;
      }

      function award(res) {
        if (res.ok) {
          combo++; maxCombo = Math.max(maxCombo, combo);
          let gain = 100 + 25 * Math.min(combo - 1, 4);
          if (res.hints === 0) gain += 25;
          if (res.durasi <= 20) gain += 25;
          xp += gain;
          return { ok: true, text: `Ancaman dinetralkan! +${gain} XP${combo > 1 ? ` • COMBO ×${combo}` : ''}` };
        }
        const crit = damage(WRONG_DMG);
        return { ok: false, text: `Respons kurang tepat. Core −${WRONG_DMG}%.${crit ? CRIT_TEXT : ''}` };
      }

      const hudHtml = () => `
        <div class="r5-hud">
          <div class="hud-core">
            <span class="hud-label">🛡️ CORE</span>
            <div class="defense"><span class="hp-fill ${shownHp <= 30 ? 'low' : ''}" style="width:${shownHp}%"></span></div>
            <b class="hp-val">${shownHp}%</b>
          </div>
          <span class="hud-chip">⭐ <b class="xp-val">${xp}</b> XP</span>
          <span class="hud-chip">🔥 ×<b class="combo-val">${combo}</b></span>
        </div>`;

      function liveHud() {
        const f = el.querySelector('.hp-fill');
        if (f) { f.style.width = hp + '%'; f.classList.toggle('low', hp <= 30); }
        const set = (s, v) => { const n = el.querySelector(s); if (n) n.textContent = v; };
        set('.hp-val', hp + '%'); set('.xp-val', xp); set('.combo-val', combo);
        shownHp = hp;
      }
      const animateHud = () => requestAnimationFrame(() => requestAnimationFrame(liveHud));

      function pulse(node, cls, ms = 500) {
        if (!node || reduced) return;
        node.classList.add(cls);
        setTimeout(() => node.classList.remove(cls), ms);
      }

      const panel = (c, judul, sub, breached) => `
        <div class="threat-panel ${breached ? 'breached' : ''}">
          <div class="threat-head">
            <span class="radar" aria-hidden="true"><i class="blip-dot b1"></i><i class="blip-dot b2"></i></span>
            <span class="threat-title"><b>${judul}</b><small>${breached ? '⚠️ ANCAMAN MENEMBUS PERTAHANAN' : sub}</small></span>
            <span class="defense-mini">🛡️ ${hp}%</span>
          </div>
          <div class="threat-body">${MOCKS[c.mock.type](c.mock)}</div>
        </div>`;

      /* ---------- INTRO ---------- */
      function intro() {
        el.innerHTML = `
          <h5>🛡️ R5 · Pusat Pertahanan</h5>
          <div class="threat-head intro-head">
            <span class="radar big" aria-hidden="true"><i class="blip-dot b1"></i><i class="blip-dot b2"></i></span>
            <span class="threat-title"><b>THREAT RADAR AKTIF</b><small>Core sekolah sedang diserang</small></span>
          </div>
          <p class="stimulus mt-3">Misi Agen: kamu operator Pusat Pertahanan. Ancaman digital bergerak menuju <b>Core</b> sekolah. Hentikan semuanya sebelum Core jebol!</p>
          <ol class="stimulus ps-3">
            <li><b>Ketuk ancaman</b> di radar untuk menganalisis dan menanganinya.</li>
            <li>Setiap satu ancaman selesai, ancaman lain <b>bergerak mendekat</b>. Tangani yang <b>paling dekat dengan Core</b> lebih dulu!</li>
            <li>Ancaman yang menyentuh zona merah atau jawaban yang salah akan <b>mengurangi kekuatan Core</b>.</li>
            <li>Jawaban benar menambah <b>XP</b> dan <b>combo</b>. Di akhir menunggu <b>Final Boss</b>.</li>
          </ol>
          <p class="stimulus">Semua tampilan hanya simulasi. Di dunia nyata, <b>jangan pernah membuka file atau link mencurigakan untuk dicoba</b>. Selesaikan semuanya untuk mendapatkan <b>Kunci Pertahanan</b>.</p>
          <button type="button" class="btn btn-info w-100" id="btnGo">Mulai Misi</button>`;
        el.querySelector('#btnGo').onclick = stage1;
      }

      /* ---------- RADAR PERTAHANAN ---------- */
      const CFG1 = {
        list: STAGE1, base: 0,
        label: 'R5 · Tahap 1: Threat Scanner', judul: 'THREAT SCANNER', sub: 'Ancaman terdeteksi, analisis jenisnya',
        radii: [0.50, 0.62, 0.74, 0.86, 0.98], delta: 0.16,
        rule: 'Ketuk ancaman untuk menanganinya. Ancaman yang menyentuh zona merah di tengah merusak Core, jadi tangani yang paling dekat lebih dulu.'
      };
      const CFG2 = {
        list: STAGE2, base: 5,
        label: 'R5 · Tahap 2: Cyber Defense', judul: 'CYBER DEFENSE', sub: 'Insiden berlangsung, pilih respons yang aman',
        radii: [0.55, 0.70, 0.85, 0.98], delta: 0.18,
        rule: 'Insiden mulai terjadi di sekitar Core. Ketuk insiden terdekat dulu, lalu pilih respons yang paling aman.'
      };

      function runArena(cfg, done) {
        const n = cfg.list.length;
        const radii = shuffle(cfg.radii);
        const off = Math.random() * Math.PI * 2;
        const S = {
          ...cfg, msgs: [], flash: false, raf: null,
          threats: cfg.list.map((c, i) => ({ c, r: radii[i], th: off + (i * 2 * Math.PI) / n, state: 'live' }))
        };
        const remaining = () => S.threats.filter(t => t.state !== 'done');
        const doneCount = () => n - remaining().length;

        // Ancaman menembus Core (hanya mengubah status; tampilan diurus pemanggil)
        function applyBreach(t) {
          t.state = 'breached';
          t.r = CORE_R;
          const crit = damage(BREACH_DMG);
          Api.log({ aktivitas: 'threat_breach', room: ROOM, item_id: t.c.id });
          return `Ancaman ${t.c.icon} menembus Core! Core −${BREACH_DMG}%.${crit ? CRIT_TEXT : ''}`;
        }

        function render() {
          const rem = remaining();
          el.innerHTML = `
            ${hudHtml()}
            <div class="d-flex justify-content-between small text-secondary mb-1">
              <span>${esc(S.label)}</span><span>Sisa ancaman: ${rem.length}</span>
            </div>
            <div class="progress mb-3" style="height:8px"><div class="progress-bar" style="width:${((S.base + doneCount()) / 10) * 100}%"></div></div>
            <div class="arena ${S.flash ? 'hit' : ''}" id="arena">
              <div class="arena-sweep"></div>
              <div class="arena-ring" style="--s:33%"></div>
              <div class="arena-ring" style="--s:66%"></div>
              <div class="arena-ring" style="--s:98%"></div>
              <div class="arena-zone"></div>
              <div class="core" aria-label="Core sekolah">🛡️</div>
              ${S.threats.map((t, i) => t.state === 'done' ? '' :
                `<button type="button" class="blip ${t.state}" data-i="${i}" aria-label="Ancaman ${i + 1}"><span>${t.c.icon}</span></button>`).join('')}
            </div>
            <div id="arenaMsg" class="mt-3">${S.msgs.map(m => `<div class="feedback ${m.ok ? 'ok' : 'bad'} mb-2">${esc(m.text)}</div>`).join('')}</div>
            <p class="small text-secondary mb-0">${esc(S.rule)}</p>`;
          S.msgs = []; S.flash = false;
          animateHud();

          const arena = el.querySelector('#arena');
          const nodes = {};
          arena.querySelectorAll('.blip').forEach(b => { nodes[b.dataset.i] = b; });

          const place = () => S.threats.forEach((t, i) => {
            const nd = nodes[i];
            if (!nd) return;
            nd.style.left = (50 + t.r * 44 * Math.cos(t.th)) + '%';
            nd.style.top = (50 + t.r * 44 * Math.sin(t.th)) + '%';
            nd.classList.toggle('near', t.state === 'live' && t.r < 0.34);
          });
          place();

          arena.querySelectorAll('.blip').forEach(b => {
            b.onclick = () => {
              if (S.raf) cancelAnimationFrame(S.raf);
              S.raf = null;
              engage(+b.dataset.i);
            };
          });

          if (reduced || IDLE_SPEED <= 0) return;

          let last = performance.now();
          const tick = now => {
            if (!arena.isConnected) { S.raf = null; return; }
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            S.threats.forEach((t, i) => {
              if (t.state !== 'live') return;
              t.r -= IDLE_SPEED * dt;
              if (t.r <= CORE_R) {
                const text = applyBreach(t);
                if (nodes[i]) nodes[i].classList.add('breached');
                const box = el.querySelector('#arenaMsg');
                if (box) box.insertAdjacentHTML('beforeend', `<div class="feedback bad mb-2">${esc(text)}</div>`);
                pulse(arena, 'hit', 600);
                liveHud();
              }
            });
            place();
            S.raf = requestAnimationFrame(tick);
          };
          S.raf = requestAnimationFrame(tick);
        }

        function engage(i) {
          const t = S.threats[i];
          const label = remaining().length > 1 ? 'Kembali ke Radar' : 'Lihat Hasil Tahap';
          Assessment.run({
            container: el, items: [t.c], room: ROOM, label: S.label,
            hint: true, feedback: true,
            offset: S.base + doneCount(), grandTotal: 10,
            nextLabel: label, finishLabel: label,
            topHtml: panel(t.c, S.judul, S.sub, t.state === 'breached'),
            onDone: r => afterAnswer(i, r.results[0])
          });
        }

        function afterAnswer(i, res) {
          const t = S.threats[i];
          results.push(res);
          t.state = 'done';
          S.msgs.push(award(res));
          if (!res.ok) S.flash = true;

          // ancaman lain bergerak mendekat
          S.threats.forEach(x => {
            if (x.state !== 'live') return;
            x.r -= S.delta;
            if (x.r <= CORE_R) { S.msgs.push({ ok: false, text: applyBreach(x) }); S.flash = true; }
          });

          if (remaining().length === 0) return done();
          render();
        }

        render();
      }

      function stageSummary(title, count, startIdx, note, nextLabel, next) {
        const sub = results.slice(startIdx, startIdx + count);
        const ok = sub.filter(r => r.ok).length;
        el.innerHTML = `
          ${hudHtml()}
          <h5>✅ ${esc(title)} selesai</h5>
          <p class="stimulus">Ancaman ditangani dengan tepat: <b>${ok}/${count}</b>.</p>
          ${note}
          <button type="button" class="btn btn-info w-100 mt-3" id="btnNext">${esc(nextLabel)}</button>`;
        animateHud();
        el.querySelector('#btnNext').onclick = next;
      }

      function stage1() {
        runArena(CFG1, () => stageSummary('Tahap 1', CFG1.list.length, 0, NOTE1, 'Lanjut ke Cyber Defense', stage2));
      }
      function stage2() {
        runArena(CFG2, () => stageSummary('Tahap 2', CFG2.list.length, 5, NOTE2, 'Lanjut ke Final Boss', bossScan));
      }

      /* ---------- FINAL BOSS ---------- */
      const alertBanner = '<div class="boss-alert"><span>⚠️</span><span>SERANGAN KOMBINASI TERDETEKSI</span></div>';

      const bossStageHtml = (broken, bossHp, defeated) => `
        <div class="boss-stage ${defeated ? 'defeated' : ''}" id="bossBox">
          <div class="boss-avatar">
            <span class="boss-face">${defeated ? '💥' : '👾'}</span>
            ${BOSS_PARTS.map((p, i) => `<span class="armor a${i + 1} ${broken.has(p.id) ? 'broken' : ''}" data-p="${p.id}">${p.icon}</span>`).join('')}
          </div>
          <div class="boss-info">
            <b>KOMBINASI-X</b>
            <div class="defense boss"><span class="boss-fill" style="width:${bossHp}%"></span></div>
            <small class="boss-hp-text">${bossHp}% kekuatan</small>
          </div>
        </div>`;

      const bossCards = (opened, readonly) => `
        <div class="boss-cards">
          ${BOSS_PARTS.map(p => `
            <button type="button" class="part kind-meta ${opened.has(p.id) ? 'checked' : ''}" data-part="${p.id}" ${readonly ? 'disabled tabindex="-1"' : ''}>
              <span class="part-label">${esc(p.label)}</span>
              <span class="pt">${esc(p.text)}</span>
              <span class="chk">✓ diperiksa</span>
            </button>`).join('')}
        </div>`;

      // Fase 1: hancurkan perisai dengan menganalisis tiga kartu ancaman
      function bossScan() {
        const opened = new Set(), t0 = Date.now();
        Api.log({ aktivitas: 'item_view', room: ROOM, item_id: BOSS_ITEM.id });

        el.innerHTML = `
          ${hudHtml()}
          <h5>👾 Final Boss</h5>
          ${alertBanner}
          ${bossStageHtml(opened, 100, false)}
          <p class="stimulus">Tiga bagian serangan melindungi boss. Ketuk setiap kartu untuk menganalisisnya dan <b>menghancurkan perisainya</b>.</p>
          ${bossCards(opened, false)}
          <div class="detail-box mt-2" id="detail">Ketuk kartu ancaman untuk melihat analisisnya.</div>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnBoss" disabled>Yakin, Lanjut ke Serangan Utama</button>`;
        animateHud();

        const btn = el.querySelector('#btnBoss');
        el.querySelectorAll('.part').forEach(b => {
          b.onclick = () => {
            const p = BOSS_PARTS.find(x => x.id === b.dataset.part);
            opened.add(p.id);
            el.querySelectorAll('.part').forEach(x => x.classList.toggle('active', x === b));
            b.classList.add('checked');
            const plate = el.querySelector(`.armor[data-p="${p.id}"]`);
            if (plate) plate.classList.add('broken');
            el.querySelector('#detail').innerHTML = `<b>${esc(p.label)}</b><br>${esc(p.detail)}`;
            btn.disabled = opened.size < BOSS_PARTS.length;
          };
        });

        btn.onclick = () => {
          Api.log({
            aktivitas: 'element_check', room: ROOM, item_id: BOSS_ITEM.id,
            durasi: Math.round((Date.now() - t0) / 1000),
            detail: JSON.stringify({ diperiksa: [...opened] })
          });
          bossQuestion(opened);
        };
      }

      // Fase 2: Serangan Utama = soal R5-10
      function bossQuestion(opened) {
        Assessment.run({
          container: el, items: [BOSS_ITEM], room: ROOM,
          label: 'R5 · Final Boss: Serangan Utama',
          hint: true, feedback: true,
          offset: 9, grandTotal: 10, logView: false,
          finishLabel: 'Lanjut ke Pertarungan',
          topHtml: alertBanner + bossStageHtml(opened, 100, false),
          onDone: r => {
            const res = r.results[0];
            results.push(res);
            battle(award(res));
          }
        });
      }

      // Fase 3: pertarungan bergiliran, pilih langkah respons berikutnya satu per satu
      function battle(note) {
        const t0 = Date.now();
        const allBroken = new Set(BOSS_PARTS.map(p => p.id));
        const ALL = CANON.concat(DISTRACT);
        const byId = Object.fromEntries(ALL.map(s => [s.id, s]));
        const order = shuffle(ALL.map(s => s.id));
        const isDistract = id => !CANON.some(s => s.id === id);
        let k = 0, bossHp = 100, attempts = 0, hintN = 0, selected = null, over = false;
        const chain = [];

        el.innerHTML = `
          ${hudHtml()}
          <h5>👾 Final Boss: Pertarungan</h5>
          ${alertBanner}
          ${bossStageHtml(allBroken, bossHp, false)}
          ${note ? `<div class="feedback ${note.ok ? 'ok' : 'bad'} mb-3">${esc(note.text)}</div>` : ''}
          <p class="stimulus">Perisai boss sudah hancur. Sekarang lawan dengan <b>respons yang benar, satu per satu sesuai urutan</b>. Langkah berbahaya atau salah urutan akan melukai Core!</p>

          <div class="fw-bold mb-1">Rantai responsmu</div>
          <ol class="chain" id="chain"></ol>

          <div class="fw-bold mt-3 mb-1" id="turnLabel"></div>
          <div class="seq-pool d-grid gap-2" id="pool"></div>

          <button type="button" class="btn btn-sm btn-outline-info mt-3" id="btnHint">💡 Petunjuk</button>
          <div class="alert alert-info mt-2 mb-0" id="hintBox" hidden></div>

          <div id="battleMsg" class="mt-3"></div>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnExec" disabled>Eksekusi Langkah</button>

          <div id="victory" class="victory" hidden></div>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnKey" hidden>Ambil Kunci Pertahanan</button>`;
        animateHud();

        const $ = s => el.querySelector(s);

        function renderChain() {
          $('#chain').innerHTML = chain.length
            ? chain.map((s, i) => `
                <li class="seq-item ok">
                  <span class="seq-no">${i + 1}</span>
                  <span class="seq-text"><b>${esc(s.text)}</b><br><span class="small">${esc(s.why)}</span></span>
                </li>`).join('')
            : '<li class="seq-empty">Belum ada langkah yang berhasil.</li>';
        }

        function renderPool() {
          const doneIds = new Set(chain.map(s => s.id));
          $('#pool').innerHTML = order.filter(id => !doneIds.has(id)).map(id =>
            `<button type="button" class="btn btn-option step-card ${selected === id ? 'selected' : ''}" data-id="${id}">${esc(byId[id].text)}</button>`).join('');
          $('#turnLabel').textContent = over ? '' : `Giliranmu: pilih langkah ke-${k + 1} dari ${CANON.length}`;
          $('#btnExec').disabled = over || !selected;
        }

        $('#pool').addEventListener('click', e => {
          const b = e.target.closest('.step-card');
          if (!b || over) return;
          selected = selected === b.dataset.id ? null : b.dataset.id;
          renderPool();
        });

        $('#btnHint').onclick = () => {
          hintN = Math.min(hintN + 1, HINTS.length);
          const box = $('#hintBox');
          box.innerHTML = HINTS.slice(0, hintN).map((h, i) => `<div>${i + 1}. ${esc(h)}</div>`).join('');
          box.hidden = false;
          Api.log({ aktivitas: 'hint_used', room: ROOM, item_id: 'R5-FINAL', hint: hintN });
        };

        $('#btnExec').onclick = () => {
          if (over || !selected) return;
          attempts++;
          const pick = selected;
          const ok = pick === CANON[k].id;
          const dist = isDistract(pick);
          const msg = $('#battleMsg');

          Api.log({
            aktivitas: 'final_boss_sequence', room: ROOM, item_id: 'R5-FINAL',
            benar: ok, hint: hintN, attempt: attempts,
            durasi: Math.round((Date.now() - t0) / 1000),
            detail: JSON.stringify({ langkah_ke: k + 1, pilihan: pick, jenis: ok ? 'tepat' : (dist ? 'berbahaya' : 'salah_urutan') })
          });

          selected = null;

          if (ok) {
            chain.push(byId[pick]);
            k++;
            bossHp = 100 - k * 20;
            xp += 50;
            msg.innerHTML = `<div class="feedback ok"><b>Serangan berhasil!</b> Boss −20%. ${esc(byId[pick].why)}</div>`;
            $('.boss-fill').style.width = bossHp + '%';
            $('.boss-hp-text').textContent = bossHp + '% kekuatan';
            pulse($('#bossBox'), 'boss-hit', 500);
            renderChain(); renderPool(); liveHud();
            if (k === CANON.length) victory();
          } else {
            const crit = damage(dist ? 15 : 10);
            msg.innerHTML = dist
              ? `<div class="feedback bad"><b>Langkah berbahaya!</b> ${esc(byId[pick].why)} Core −15%.${crit ? esc(CRIT_TEXT) : ''}</div>`
              : `<div class="feedback bad"><b>Belum waktunya.</b> Langkah ini benar, tetapi urutan sangat penting. Core −10%.${crit ? esc(CRIT_TEXT) : ''}</div>`;
            pulse($('#bossBox'), 'counter', 500);
            pulse($('.r5-hud'), 'hud-hit', 450);
            renderPool(); liveHud();
          }
        };

        function victory() {
          over = true;
          const hpLeft = hp;
          const correct = nCorrect();
          const rank = rankOf(correct, hpLeft);
          xp += 200;
          hp = 100;   // sistem pulih

          const box = $('#bossBox');
          box.classList.add('defeated');
          box.querySelector('.boss-face').textContent = '💥';
          liveHud();

          $('#pool').innerHTML = '';
          $('#turnLabel').textContent = '';
          $('#btnExec').hidden = true;
          $('#btnHint').hidden = true;
          $('#hintBox').hidden = true;

          const v = $('#victory');
          v.hidden = false;
          v.innerHTML = `
            <div class="shield-ico">🛡️</div>
            <div class="shield-text">SISTEM PERTAHANAN AKTIF</div>
            <div class="rank ${rank}" aria-label="Peringkat ${rank}">${rank}</div>
            <div class="rank-name">${RANK_NAME[rank]}</div>
            <div class="stats">
              <span class="stat">✅ Benar ${correct}/10</span>
              <span class="stat">⭐ ${xp} XP</span>
              <span class="stat">🛡️ Core tersisa ${hpLeft}%</span>
              <span class="stat">🔥 Combo maks ×${maxCombo}</span>
            </div>`;

          Api.log({
            aktivitas: 'r5_summary', room: ROOM,
            detail: JSON.stringify({ rank, xp, core_sisa: hpLeft, combo_maks: maxCombo, benar: correct })
          });
          $('#btnKey').hidden = false;
        }

        $('#btnKey').onclick = () => ctx.complete(Math.round((nCorrect() / 10) * 100));

        renderChain();
        renderPool();
      }

      // Materi pengantar tampil dulu (bisa dilewati), lalu intro misi
      if (typeof Materi !== 'undefined') Materi.briefing({ container: el, room: ROOM, onDone: intro }); else intro();
    }
  };
})();