// R2 · Ruang Privasi — Tahap 1: Data Scanner (R2-01..05), Tahap 2: Investigasi visual (R2-06..10)
window.RoomModules = window.RoomModules || {};

(() => {
  const ROOM = 'R2';
  const IMG_DIR = 'assets/r2/';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ================= TAHAP 1: DATA SCANNER ================= */
  // key = indeks opsi benar (0 = A). tags = error tag per opsi (draf).
  const SCAN = [
    { id: 'R2-01', konsep: 'Tujuan dan penerima data',
      data: 'Nama lengkap', context: 'Daftar peserta kegiatan sekolah yang hanya dibagikan kepada panitia.',
      stimulus: '', question: 'Bagaimana keputusan yang paling tepat?',
      options: [
        'Selalu rahasia dan tidak boleh dibagikan kepada siapa pun walau dipaksa memberikan',
        'Dapat dibagikan kepada pihak yang memang membutuhkan untuk tujuan kegiatan',
        'Harus dipublikasikan ke media sosial',
        'Harus disertai informasi lain seperti alamat, tanggal lahir, jenis kelamin, dan alamat'
      ],
      key: 1, tags: ['TOLAK_MUTLAK', null, 'BAGI_PUBLIK', 'BAGI_KREDENSIAL'],
      explanation: 'Nama lengkap dapat digunakan dalam konteks kegiatan jika penerima dan tujuannya jelas, tetapi tidak berarti harus dipublikasikan secara luas.',
      hint: 'Perhatikan tujuan dan siapa penerima data.' },

    { id: 'R2-02', konsep: 'Data pribadi perlu dilindungi',
      data: 'Nomor WhatsApp pribadi', context: '',
      stimulus: '', question: 'Bagaimana perlakuan yang paling aman?',
      options: [
        'Membagikannya kepada siapa saja',
        'Melindunginya dan hanya memberikannya ketika ada kebutuhan yang sesuai',
        'Menuliskannya di bio profile media sosial (instagram, tiktok, facebook, dll)',
        'Membagikannya bersama password'
      ],
      key: 1, tags: ['BAGI_PUBLIK', null, 'BAGI_PUBLIK', 'BAGI_KREDENSIAL'],
      explanation: 'Nomor pribadi sebaiknya dilindungi dan dibagikan secara terbatas sesuai kebutuhan.',
      hint: 'Nomor pribadi dapat digunakan untuk menghubungi seseorang; pikirkan siapa yang benar-benar membutuhkan.' },

    { id: 'R2-03', konsep: 'Membedakan data berisiko rendah dan sensitif',
      data: 'Foto makanan buatan sendiri', context: 'Untuk unggahan hobi.',
      stimulus: '', question: 'Klasifikasi yang paling tepat adalah ...',
      options: [
        'Umumnya aman jika tidak memuat informasi sensitif',
        'Password rahasia',
        'Jangan dibagikan karena dapat menimbulkan kecemburuan sosial',
        'Data yang selalu dilarang dibagikan'
      ],
      key: 0, tags: [null, 'SALAH_KLASIFIKASI_RAHASIA', 'SALAH_KLASIFIKASI_RAHASIA', 'SEMUA_DILARANG'],
      explanation: 'Foto makanan pada konteks tersebut umumnya bukan data rahasia, selama tidak mengungkap informasi sensitif lain.',
      hint: 'Perhatikan isi foto dan apakah ada data sensitif yang ikut terlihat.' },

    { id: 'R2-04', konsep: 'Kredensial tidak boleh dibagikan',
      data: 'Password game', context: '',
      stimulus: '', question: 'Apa keputusan yang tepat?',
      options: [
        'Aman dibagikan kepada teman dekat',
        'Hanya dibagikan jika teman berjanji merahasiakannya',
        'Tidak dibagikan karena merupakan kredensial rahasia',
        'Diposting agar mudah diingat'
      ],
      key: 2, tags: ['PERCAYA_TEMAN', 'SHARE_BERSYARAT', null, 'SHARE_PUBLIK'],
      explanation: 'Password adalah kredensial rahasia yang tidak boleh dibagikan kepada orang lain.',
      hint: 'Tanyakan apakah data tersebut dapat digunakan untuk masuk ke akun.' },

    { id: 'R2-05', konsep: 'Data lokasi tempat tinggal',
      data: 'Alamat rumah lengkap', context: '',
      stimulus: '', question: 'Apa keputusan yang paling tepat?',
      options: [
        'Publikasikan karena semua orang perlu tahu',
        'Lindungi dan hindari membagikannya secara terbuka tanpa kebutuhan yang jelas',
        'Gabungkan dengan nama lengkap, nomor hp, patokan rumah dan link gmaps lalu bagikan',
        'Menuliskannya di bio profile media sosial (instagram, tiktok, facebook, dll)'
      ],
      key: 1, tags: ['BAGI_PUBLIK', null, 'BAGI_KREDENSIAL', 'BAGI_PUBLIK'],
      explanation: 'Alamat rumah lengkap dapat meningkatkan risiko privasi sehingga perlu dibatasi penyebarannya.',
      hint: 'Perhatikan apakah data tersebut menunjukkan lokasi tempat tinggal secara spesifik.' }
  ];

  const scannerHtml = it => `
    <div class="scanner">
      <div class="scanner-head"><span class="scanner-dot"></span><span>DATA SCANNER</span><span class="scanner-state">DATA TERDETEKSI</span></div>
      <div class="scanner-body">
        <div class="scan-chip">${esc(it.data)}</div>
        <div class="scan-beam" aria-hidden="true"></div>
      </div>
      ${it.context ? `<div class="scanner-ctx"><b>Konteks:</b> ${esc(it.context)}</div>` : ''}
    </div>`;

  /* ================= TAHAP 2: INVESTIGASI VISUAL ================= */
  // visual.size  = ukuran gambar acuan (piksel); semua rect memakai koordinat ini [x, y, lebar, tinggi]
  // visual.view  = bagian gambar yang ditampilkan [x, y, lebar, tinggi]
  // visual.mode  = 'mark' (tandai area berisiko) atau 'cover' (tutup area)
  // area.risky   = true bila area itu memang berisiko/perlu ditutup (tidak memengaruhi skor)
  const CASES = [
    { id: 'R2-06', konsep: 'Menilai pihak peminta, tujuan, dan kebutuhan data',
      stimulus: 'Di grup kelas, seseorang meminta nomor HP dan alamat rumah semua siswa dengan alasan “untuk pendataan”. Tidak jelas siapa orang tersebut dan untuk siapa data digunakan.',
      question: 'Apa tindakan paling tepat?',
      options: [
        'Kirim semuanya karena ada kata pendataan',
        'Tanyakan tujuan, pihak yang meminta, dan apakah permintaan tersebut resmi sebelum memberikan data',
        'Kirim data seluruh siswa ke media sosial',
        'Kirim password agar identitas lebih lengkap'
      ],
      key: 1, tags: ['PERCAYA_ALASAN_UMUM', null, 'BAGI_PUBLIK', 'BAGI_KREDENSIAL'],
      explanation: 'Sebelum berbagi data pribadi, periksa tujuan, penerima, kebutuhan, dan legitimasi permintaan.',
      hint: 'Jangan hanya melihat alasan; periksa siapa yang meminta dan untuk apa.',
      visual: {
        file: 'r2-06-chat-pendataan.png', size: [467, 768], view: [0, 0, 467, 768], maxWidth: 340, mode: 'mark',
        alt: 'Tangkapan layar obrolan grup kelas: sebuah nomor tidak dikenal meminta nama lengkap, nomor HP, dan alamat rumah untuk pendataan.',
        instruksi: 'Ketuk bagian pada obrolan yang menurutmu mencurigakan atau berisiko.',
        areas: [
          { id: 'pengirim', label: 'Nomor pengirim yang tidak dikenal', rect: [70, 328, 180, 26], risky: true,
            why: 'pengirim hanya berupa nomor tanpa identitas yang jelas.' },
          { id: 'permintaan', label: 'Permintaan nama lengkap, nomor HP, dan alamat rumah', rect: [68, 352, 330, 72], risky: true,
            why: 'meminta banyak data pribadi sekaligus tanpa kebutuhan yang jelas.' },
          { id: 'alasan', label: 'Alasan “untuk pendataan”', rect: [68, 424, 330, 52], risky: true,
            why: 'alasannya terlalu umum: tidak jelas siapa yang mendata dan untuk apa.' },
          { id: 'obrolan', label: 'Obrolan tugas Biologi', rect: [12, 140, 390, 175], risky: false,
            okNote: 'percakapan biasa antarteman, bukan masalah privasi.' },
          { id: 'balasan', label: 'Balasan siswa yang bertanya', rect: [12, 483, 390, 160], risky: false,
            okNote: 'bertanya tujuan permintaan justru langkah yang tepat.' }
        ]
      } },

    { id: 'R2-07', konsep: 'Menutup data identitas yang tidak diperlukan',
      stimulus: 'Siswa ingin mengunggah foto kartu pelajar ke media sosial. Kartu tersebut menampilkan nama, nomor identitas siswa, dan data lain.',
      question: 'Tindakan yang paling aman adalah ...',
      options: [
        'Unggah seluruh kartu tanpa perubahan',
        'Tutup/crop bagian yang memuat informasi pribadi yang tidak diperlukan',
        'Tambahkan alamat rumah agar lebih lengkap',
        'Kirim foto kartu ke semua grup'
      ],
      key: 1, tags: ['UNGGAH_UTUH', null, 'TAMBAH_DATA_PRIBADI', 'BAGI_PUBLIK'],
      explanation: 'Informasi identitas yang tidak diperlukan untuk tujuan unggahan sebaiknya ditutup/crop.',
      hint: 'Pikirkan informasi mana yang sebenarnya diperlukan untuk ditampilkan.',
      visual: {
        file: 'r2-07-kartu-pelajar.png', size: [1408, 768], view: [0, 0, 1408, 768], maxWidth: 640, mode: 'cover',
        alt: 'Foto kartu pelajar fiktif berisi foto, nama, kelas, nomor induk, NISN, tempat dan tanggal lahir, alamat, kode QR, dan barcode.',
        instruksi: 'Ketuk bagian kartu yang sebaiknya DITUTUP sebelum diunggah.',
        areas: [
          { id: 'header', label: 'Nama dan alamat sekolah', rect: [310, 92, 785, 125], risky: false,
            okNote: 'informasi sekolah tidak perlu ditutup.' },
          { id: 'foto', label: 'Foto siswa', rect: [308, 266, 255, 320], risky: false,
            okNote: 'bergantung pada tujuan unggahan; bukan prioritas utama pada kasus ini.' },
          { id: 'nama', label: 'Nama', rect: [588, 264, 490, 26], risky: false,
            okNote: 'bergantung pada tujuan unggahan; bukan prioritas utama pada kasus ini.' },
          { id: 'kelas', label: 'Kelas', rect: [588, 290, 490, 25], risky: false,
            okNote: 'tidak termasuk data yang berisiko tinggi.' },
          { id: 'nis', label: 'Nomor induk siswa', rect: [588, 316, 490, 26], risky: true,
            why: 'nomor identitas dapat disalahgunakan untuk mengaku sebagai siswa.' },
          { id: 'nisn', label: 'NISN', rect: [588, 342, 490, 26], risky: true,
            why: 'nomor identitas nasional siswa bersifat sensitif.' },
          { id: 'ttl', label: 'Tempat dan tanggal lahir', rect: [588, 368, 520, 27], risky: true,
            why: 'sering dipakai untuk verifikasi akun sehingga rawan disalahgunakan.' },
          { id: 'alamat', label: 'Alamat rumah', rect: [588, 395, 560, 55], risky: true,
            why: 'menunjukkan tempat tinggal secara spesifik.' },
          { id: 'berlaku', label: 'Masa berlaku', rect: [588, 448, 490, 26], risky: false,
            okNote: 'bukan data pribadi yang berisiko.' },
          { id: 'qr', label: 'Kode QR', rect: [608, 503, 182, 180], risky: true,
            why: 'kode dapat memuat atau menaut ke data identitas.' },
          { id: 'ttd', label: 'Tanda tangan dan cap', rect: [815, 485, 345, 105], risky: false,
            okNote: 'bukan data pribadi siswa.' },
          { id: 'barcode', label: 'Barcode dan nomor NIS', rect: [803, 592, 358, 92], risky: true,
            why: 'memuat nomor identitas siswa.' }
        ]
      } },

    { id: 'R2-08', konsep: 'Kewajaran permintaan data',
      stimulus: 'Sebuah giveaway meminta nama lengkap, alamat rumah, nomor HP, nomor identitas, dan password akun agar hadiah dapat dikirim.',
      question: 'Apa kesimpulan yang paling tepat?',
      options: [
        'Semua data wajar diminta karena giveaway',
        'Permintaan password merupakan tanda kuat bahwa permintaan tidak wajar dan data perlu ditolak/ditinjau',
        'Berikan data karena hadiah pasti menarik',
        'Berikan password saja agar proses cepat'
      ],
      key: 1, tags: ['PERCAYA_PERMINTAAN_WAJAR', null, 'TERGIUR_HADIAH', 'BAGI_KREDENSIAL'],
      explanation: 'Password tidak diperlukan untuk pengiriman hadiah dan merupakan kredensial rahasia. Permintaan seperti ini perlu dicurigai dan diverifikasi.',
      hint: 'Tanyakan: apakah password benar-benar dibutuhkan untuk tujuan tersebut?',
      visual: {
        file: 'r2-08-giveaway.png', size: [450, 370], view: [0, 0, 450, 356], maxWidth: 480, mode: 'mark',
        alt: 'Iklan giveaway HP gratis dari akun tidak terverifikasi dengan formulir pendaftaran yang meminta nama, alamat rumah, nomor HP, nomor identitas, dan password akun.',
        instruksi: 'Ketuk bagian yang tidak wajar atau berisiko.',
        areas: [
          { id: 'akun', label: 'Akun penyelenggara tidak terverifikasi', rect: [22, 22, 238, 40], risky: true,
            why: 'label “Unverified” menandakan akun belum terbukti resmi.' },
          { id: 'hadiah', label: 'Gambar hadiah', rect: [50, 105, 150, 200], risky: false,
            okNote: 'hanya daya tarik visual, bukan permintaan data.' },
          { id: 'nama', label: 'Kolom nama lengkap', rect: [241, 206, 174, 21], risky: false,
            okNote: 'nama wajar diminta untuk pendaftaran bila penyelenggaranya terpercaya.' },
          { id: 'alamat', label: 'Kolom alamat rumah', rect: [241, 227, 174, 21], risky: true,
            why: 'alamat baru diperlukan untuk mengirim hadiah, bukan saat mendaftar.' },
          { id: 'hp', label: 'Kolom nomor HP', rect: [241, 248, 174, 21], risky: false,
            okNote: 'bisa wajar untuk dihubungi, tetapi tetap perlu hati-hati pada akun yang belum jelas.' },
          { id: 'nik', label: 'Kolom nomor identitas', rect: [241, 269, 174, 21], risky: true,
            why: 'nomor identitas sangat sensitif dan tidak diperlukan untuk giveaway.' },
          { id: 'pass', label: 'Kolom password akun', rect: [241, 290, 174, 21], risky: true,
            why: 'password tidak pernah diperlukan untuk mengirim hadiah.' }
        ]
      } },

    { id: 'R2-09', konsep: 'Izin dan perlindungan data orang lain',
      stimulus: 'Seorang siswa ingin mengunggah screenshot chat pribadi dengan temannya karena percakapan itu lucu. Nama dan foto profil temannya masih terlihat.',
      question: 'Apa tindakan yang paling tepat?',
      options: [
        'Langsung unggah karena chat tersebut ada di ponsel sendiri',
        'Minta izin dan pertimbangkan menutup identitas jika memang perlu dibagikan',
        'Kirim ke semua grup tanpa izin',
        'Tambahkan nomor HP teman'
      ],
      key: 1, tags: ['ABAIKAN_IZIN', null, 'BAGI_TANPA_IZIN', 'TAMBAH_DATA_PRIBADI'],
      explanation: 'Screenshot percakapan dapat memuat informasi orang lain. Izin dan perlindungan identitas perlu dipertimbangkan.',
      hint: 'Perhatikan bahwa percakapan melibatkan orang lain.',
      visual: {
        file: 'r2-09-screenshot-chat.png', size: [592, 540], view: [0, 0, 592, 540], maxWidth: 400, mode: 'mark',
        alt: 'Screenshot chat pribadi dengan teman sekelas bernama Andi, lengkap dengan foto profil dan beberapa balon percakapan.',
        instruksi: 'Ketuk bagian yang bisa mengungkap identitas atau privasi orang lain.',
        areas: [
          { id: 'foto', label: 'Foto profil teman', rect: [143, 73, 50, 50], risky: true,
            why: 'memperlihatkan identitas teman tanpa izinnya.' },
          { id: 'nama', label: 'Nama teman', rect: [196, 78, 185, 26], risky: true,
            why: 'nama dan keterangan “Teman Sekelas” mengidentifikasi orang tersebut.' },
          { id: 'isi', label: 'Isi percakapan pribadi', rect: [128, 135, 340, 350], risky: true,
            why: 'percakapan melibatkan orang lain; perlu izin sebelum dibagikan.' },
          { id: 'statusbar', label: 'Bilah status ponsel', rect: [112, 50, 330, 20], risky: false,
            okNote: 'tidak memuat data pribadi yang penting.' }
        ]
      } },

    { id: 'R2-10', konsep: 'Risiko berbagi lokasi secara real-time',
      stimulus: 'Saat sedang liburan, seorang siswa ingin membagikan live location secara publik agar semua pengikut tahu ia sedang berada di mana.',
      question: 'Risiko utama yang perlu dipertimbangkan adalah ...',
      options: [
        'Tidak ada risiko karena lokasi hanya menunjukkan tempat',
        'Orang yang tidak dikenal dapat mengetahui lokasi secara real-time sehingga privasi dan keamanan dapat terganggu',
        'Baterai ponsel menjadi lebih kuat',
        'Foto liburan otomatis menjadi lebih jelas'
      ],
      key: 1, tags: ['ABAIKAN_RISIKO_LOKASI', null, 'JAWABAN_TAK_RELEVAN', 'JAWABAN_TAK_RELEVAN'],
      explanation: 'Lokasi real-time dapat mengungkap keberadaan seseorang kepada banyak orang sehingga perlu dipertimbangkan dengan hati-hati.',
      hint: 'Pikirkan siapa saja yang dapat melihat lokasi dan kapan lokasi tersebut dibagikan.',
      visual: {
        // file berisi 3 panel; yang ditampilkan hanya panel ketiga (x = 941 sampai 1408)
        file: 'r2-10-live-location.png', size: [1408, 768], view: [941, 0, 467, 768], maxWidth: 340, mode: 'mark',
        alt: 'Layar berbagi lokasi langsung di atas peta sketsa, dengan penerima Publik atau Semua Pengikut dan durasi 3 jam.',
        instruksi: 'Ketuk bagian yang membuat lokasimu bisa diketahui orang lain.',
        areas: [
          { id: 'pin', label: 'Pin posisi di peta', rect: [1125, 228, 115, 125], risky: true,
            why: 'menunjukkan posisi tepat saat ini.' },
          { id: 'teks_lokasi', label: 'Keterangan lokasi saat ini', rect: [1205, 322, 185, 60], risky: true,
            why: 'menyebut tempat ia berada sekarang.' },
          { id: 'nama_tempat', label: 'Nama tempat yang dibagikan', rect: [1025, 483, 200, 55], risky: true,
            why: 'orang lain dapat tahu persis di mana ia berada.' },
          { id: 'penerima', label: 'Penerima: Publik / Semua Pengikut', rect: [958, 558, 437, 40], risky: true,
            why: 'siapa pun dapat melihat lokasinya, termasuk orang yang tidak dikenal.' },
          { id: 'durasi', label: 'Durasi berbagi lokasi', rect: [1012, 608, 383, 44], risky: true,
            why: 'selama durasi berjalan, pergerakannya dapat diikuti secara real-time.' },
          { id: 'judul', label: 'Judul panel', rect: [962, 425, 430, 38], risky: false,
            okNote: 'hanya judul tampilan.' }
        ]
      } }
  ];

  /* ---------- Pembangun tampilan gambar + area ketuk ---------- */
  function visualHtml(v, marked, { readonly = false, maxWidth = null } = {}) {
    const [W, H] = v.size;
    const [vx, vy, vw, vh] = v.view;
    const imgStyle = `left:${(-vx / vw) * 100}%;top:${(-vy / vh) * 100}%;width:${(W / vw) * 100}%;height:${(H / vh) * 100}%;`;
    const tag = v.mode === 'cover' ? 'DITUTUP' : '⚑';

    const areas = v.areas.map(a => {
      const [x, y, w, h] = a.rect;
      const style = `left:${((x - vx) / vw) * 100}%;top:${((y - vy) / vh) * 100}%;width:${(w / vw) * 100}%;height:${(h / vh) * 100}%;`;
      const on = marked.has(a.id);
      return `<button type="button" class="hotspot ${v.mode === 'cover' ? 'cover' : ''} ${on ? 'on' : ''}"
                style="${style}" data-area="${a.id}" aria-label="${esc(a.label)}" aria-pressed="${on}"
                ${readonly ? 'disabled tabindex="-1"' : ''}><span class="hs-tag">${tag}</span></button>`;
    }).join('');

    return `
      <div class="inv-frame" style="max-width:${maxWidth || v.maxWidth}px">
        <div class="inv-view" style="aspect-ratio:${vw}/${vh}">
          <img class="inv-img" src="${IMG_DIR + v.file}" alt="${esc(v.alt)}" style="${imgStyle}" draggable="false">
          ${areas}
        </div>
      </div>`;
  }

  // Hasil pemeriksaan area (ditampilkan di pembahasan)
  function reviewHtml(c, mk) {
    const v = c.visual, byId = Object.fromEntries(v.areas.map(a => [a.id, a]));
    const rows = [];
    mk.tepat.forEach(id => rows.push(`<li>✅ <b>${esc(byId[id].label)}</b>: ${esc(byId[id].why)}</li>`));
    mk.terlewat.forEach(id => rows.push(`<li>⚠️ <b>Terlewat: ${esc(byId[id].label)}</b>: ${esc(byId[id].why)}</li>`));
    mk.keliru.forEach(id => rows.push(
      `<li>➖ <b>${v.mode === 'cover' ? 'Tidak perlu ditutup' : 'Bukan risiko utama'}: ${esc(byId[id].label)}</b>: ${esc(byId[id].okNote || 'tidak menjadi masalah pada kasus ini.')}</li>`));
    if (!rows.length) return '';
    return `<div class="small mt-3"><div class="fw-bold mb-1">Hasil pemeriksaanmu</div><ul class="list-unstyled mb-0">${rows.join('')}</ul></div>`;
  }

  /* ================= MODUL ROOM ================= */
  RoomModules.R2 = {
    start(ctx) {
      const el = ctx.container;
      let res1 = [], res2 = [];

      /* ---------- INTRO ---------- */
      function intro() {
        el.innerHTML = `
          <h5>🕵️ R2 · Ruang Privasi</h5>
          <p class="stimulus">Misi Agen: kamu menemukan terminal Data Scanner di ruang investigasi. Tugasmu memilah informasi mana yang perlu dilindungi.</p>
          <ol class="stimulus ps-3">
            <li>Tahap 1: pindai 5 data dan tentukan perlakuan yang paling aman.</li>
            <li>Tahap 2: periksa 5 kasus bergambar, tandai bagian yang berisiko, lalu ambil keputusan.</li>
          </ol>
          <p class="stimulus">Ingat: keputusan berbagi data bergantung pada <b>tujuan, penerima, kebutuhan, dan risiko</b>. Selesaikan keduanya untuk mendapatkan <b>Kunci Privasi</b>.</p>
          <button type="button" class="btn btn-info w-100" id="btnGo">Mulai Misi</button>`;
        el.querySelector('#btnGo').onclick = stage1;
      }

      /* ---------- TAHAP 1 ---------- */
      function stage1() {
        Assessment.run({
          container: el, items: SCAN, room: ROOM,
          label: 'R2 · Tahap 1: Data Scanner',
          hint: true, feedback: true,
          offset: 0, grandTotal: 10,
          topHtml: scannerHtml,
          onDone: r => { res1 = r.results; stage1Summary(); }
        });
      }

      function stage1Summary() {
        const ok = res1.filter(x => x.ok).length;
        el.innerHTML = `
          <h5>✅ Tahap 1 selesai</h5>
          <p class="stimulus">Keputusan tepat pada Data Scanner: <b>${ok}/5</b>. Sekarang saatnya memeriksa kasus nyata di ruang investigasi.</p>
          <button type="button" class="btn btn-info w-100" id="btnS2">Lanjut ke Investigasi</button>`;
        el.querySelector('#btnS2').onclick = stage2;
      }

      /* ---------- TAHAP 2 ---------- */
      function stage2() {
        res2 = [];
        let idx = 0;
        const loop = () => {
          if (idx >= CASES.length) return finalSummary();
          const k = idx, c = CASES[k];
          investigate(c, k, mk => question(c, k, mk, r => { res2.push(r); idx++; loop(); }));
        };
        loop();
      }

      // Langkah A: tandai (atau tutup) area pada gambar
      function investigate(c, k, done) {
        const v = c.visual, marked = new Set(), t0 = Date.now();
        const cover = v.mode === 'cover';
        Api.log({ aktivitas: 'item_view', room: ROOM, item_id: c.id });

        el.innerHTML = `
          <div class="d-flex justify-content-between small text-secondary mb-1">
            <span>R2 · Tahap 2: Investigasi</span><span>Kasus ${k + 1}/5</span>
          </div>
          <div class="progress mb-3" style="height:8px"><div class="progress-bar" style="width:${((5 + k) / 10) * 100}%"></div></div>
          <p class="stimulus">${esc(c.stimulus)}</p>
          <p class="small fw-bold mb-2">🔎 ${esc(v.instruksi)}</p>
          ${visualHtml(v, marked)}
          <div class="small text-secondary mt-2" id="markInfo"></div>
          <details class="inv-list mt-2">
            <summary>Kesulitan mengetuk gambar? Pilih dari daftar</summary>
            <div class="d-flex flex-wrap gap-2 mt-2">
              ${v.areas.map(a => `<button type="button" class="btn btn-sm btn-outline-info" data-chip="${a.id}" aria-pressed="false">${esc(a.label)}</button>`).join('')}
            </div>
          </details>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnInv" disabled>Yakin, Lanjut ke Pertanyaan</button>`;

        const confirmBtn = el.querySelector('#btnInv');

        function sync() {
          el.querySelectorAll('[data-area]').forEach(b => {
            const on = marked.has(b.dataset.area);
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', on);
          });
          el.querySelectorAll('[data-chip]').forEach(b => {
            const on = marked.has(b.dataset.chip);
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on);
          });
          el.querySelector('#markInfo').textContent = marked.size
            ? `${marked.size} bagian ${cover ? 'ditutup' : 'ditandai'}`
            : (cover ? 'Belum ada bagian yang ditutup.' : 'Belum ada bagian yang ditandai.');
          confirmBtn.disabled = marked.size === 0;
        }

        const toggle = id => { marked.has(id) ? marked.delete(id) : marked.add(id); sync(); };
        el.querySelectorAll('[data-area]').forEach(b => { b.onclick = () => toggle(b.dataset.area); });
        el.querySelectorAll('[data-chip]').forEach(b => { b.onclick = () => toggle(b.dataset.chip); });
        sync();

        confirmBtn.onclick = () => {
          const risky = v.areas.filter(a => a.risky).map(a => a.id);
          const ids = [...marked];
          const mk = {
            marked: ids,
            tepat: ids.filter(id => risky.includes(id)),
            keliru: ids.filter(id => !risky.includes(id)),
            terlewat: risky.filter(id => !marked.has(id))
          };
          Api.log({
            aktivitas: 'area_mark', room: ROOM, item_id: c.id,
            durasi: Math.round((Date.now() - t0) / 1000),
            detail: JSON.stringify({ ditandai: ids, tepat: mk.tepat, keliru: mk.keliru, terlewat: mk.terlewat })
          });
          done(mk);
        };
      }

      // Langkah B: soal pilihan ganda, gambar tetap tampil (hanya baca)
      function question(c, k, mk, done) {
        Assessment.run({
          container: el, items: [c], room: ROOM,
          label: 'R2 · Tahap 2: Investigasi',
          hint: true, feedback: true,
          offset: 5 + k, grandTotal: 10, logView: false,
          topHtml: visualHtml(c.visual, new Set(mk.marked), { readonly: true, maxWidth: Math.min(c.visual.maxWidth, 320) }),
          feedbackHtml: reviewHtml(c, mk),
          onDone: r => done(r.results[0])
        });
      }

      /* ---------- RINGKASAN AKHIR ---------- */
      function finalSummary() {
        const all = res1.concat(res2);
        const correct = all.filter(x => x.ok).length;
        const score = Math.round((correct / 10) * 100);
        const meta = Object.fromEntries(SCAN.concat(CASES).map(it => [it.id, it]));
        const wrong = all.filter(x => !x.ok).map(x => meta[x.id]);

        el.innerHTML = `
          <h5>🗝️ Misi Ruang Privasi selesai</h5>
          <p class="stimulus">Keputusan tepat: <b>${correct}/10</b>.</p>
          ${wrong.length ? `
            <div class="fw-bold mb-1">Ringkasan kesalahan privasi</div>
            <ul class="list-unstyled">
              ${wrong.map(w => `<li class="mb-2">⚠️ <b>${esc(w.konsep)}</b> (${w.id})<br><span class="small text-secondary">${esc(w.explanation)}</span></li>`).join('')}
            </ul>`
          : `<p class="stimulus">Tidak ada kesalahan privasi. Pertahankan kebiasaan memeriksa tujuan, penerima, kebutuhan, dan risiko.</p>`}
          <button type="button" class="btn btn-info w-100" id="btnKey">Ambil Kunci Privasi</button>`;
        el.querySelector('#btnKey').onclick = () => ctx.complete(score);
      }

      // Materi pengantar tampil dulu (bisa dilewati), lalu intro misi
      if (typeof Materi !== 'undefined') Materi.briefing({ container: el, room: ROOM, onDone: intro }); else intro();
    }
  };
})();