// R4 · Ruang Redaksi — Tahap 1: Bongkar Berita (R4-01..05), Tahap 2: Investigasi (R4-06..10),
// lalu Final "Terbitkan atau Tahan & Verifikasi"
window.RoomModules = window.RoomModules || {};

(() => {
  const ROOM = 'R4';
  const IMG_DIR = 'assets/r4/';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };

  /* ================= PEMBANGUN MOCKUP ================= */
  const FRAMES = {
    news:     { cls: 'news',    bar: '📰 PORTAL BERITA CONTOH' },
    post:     { cls: 'post',    bar: '📱 POSTINGAN MEDIA SOSIAL' },
    chat:     { cls: 'chat',    bar: '💬 PESAN BERANTAI' },
    compare:  { cls: 'compare', bar: '🔎 DUA SUMBER INFORMASI' }
  };

  // Bila gambar belum ada, tampil kotak pengganti (alur game tetap bisa diuji)
  const imgTag = (file, alt) =>
    `<img src="${IMG_DIR + file}" alt="${esc(alt)}" draggable="false" onerror="this.outerHTML='&lt;span class=&quot;img-missing&quot;&gt;(gambar belum tersedia)&lt;/span&gt;'">`;

  function partsHtml(parts, opened, { readonly = false } = {}) {
    return parts.map(p => `
      <button type="button" class="part kind-${p.kind} ${opened.has(p.id) ? 'checked' : ''}" data-part="${p.id}"
              ${readonly ? 'disabled tabindex="-1"' : ''} aria-label="Periksa: ${esc(p.label)}">
        <span class="part-label">${esc(p.label)}</span>
        ${p.img ? imgTag(p.img, p.label) : ''}
        ${p.text ? `<span class="pt">${esc(p.text)}</span>` : ''}
        <span class="chk">✓ diperiksa</span>
      </button>`).join('');
  }

  const mockHtml = (c, opened, opts) => {
    const f = FRAMES[c.frame];
    return `<div class="mock ${f.cls}"><div class="mock-bar">${f.bar}</div><div class="mock-body">${partsHtml(c.parts, opened, opts)}</div></div>`;
  };

  // Mengaktifkan ketukan pada bagian mockup: membuka detail dan menandai "diperiksa"
  function wireParts(root, parts, opened, onOpen) {
    const detail = root.querySelector('#detail');
    const byId = Object.fromEntries(parts.map(p => [p.id, p]));
    root.querySelectorAll('.part').forEach(btn => {
      btn.onclick = () => {
        const p = byId[btn.dataset.part];
        opened.add(p.id);
        root.querySelectorAll('.part').forEach(b => b.classList.toggle('active', b === btn));
        btn.classList.add('checked');
        detail.innerHTML = `<b>${esc(p.label)}</b><br>${esc(p.detail)}`;
        onOpen(p);
      };
    });
  }

  // Hasil pemeriksaan (ditampilkan di pembahasan). signal = bagian yang memuat petunjuk penting.
  function reviewHtml(c, opened) {
    const sig = c.parts.filter(p => p.signal);
    if (!sig.length) return '';
    const rows = sig.map(p => opened.has(p.id)
      ? `<li>✅ <b>${esc(p.label)}</b>: ${esc(p.detail)}</li>`
      : `<li>⚠️ <b>Belum kamu periksa: ${esc(p.label)}</b>: ${esc(p.detail)}</li>`);
    return `<div class="small mt-3"><div class="fw-bold mb-1">Hasil pemeriksaanmu</div><ul class="list-unstyled mb-0">${rows.join('')}</ul></div>`;
  }

  /* ================= KASUS TAHAP 1 & 2 ================= */
  // key = indeks opsi benar (0 = A). tags = error tag per opsi (draf).
  // parts[].signal = bagian yang memuat temuan penting. Semua nama, akun, dan tautan fiktif.
  const CASES = [
    /* ----- Tahap 1: Bongkar Berita ----- */
    { id: 'R4-01', frame: 'news',
      stimulus: 'Judul berita: “KAMU TIDAK AKAN PERCAYA! Rahasia Besar Ini Akhirnya Terungkap!!!”',
      question: 'Apa yang perlu dilakukan terhadap judul seperti ini?',
      options: ['Langsung percaya', 'Menganggapnya pasti benar karena menarik', 'Menjadikannya sinyal untuk memeriksa sumber dan bukti', 'Langsung menyebarkan'],
      key: 2, tags: ['PERCAYA_TANPA_CEK', 'MENARIK_DIANGGAP_BENAR', null, 'SEBAR_TANPA_CEK'],
      explanation: 'Judul sensasional bukan bukti bahwa informasi salah, tetapi merupakan sinyal untuk melakukan verifikasi lebih lanjut.',
      hint: 'Judul menarik bukan bukti kebenaran.',
      parts: [
        { id: 'judul', kind: 'judul', label: 'Judul', text: 'KAMU TIDAK AKAN PERCAYA! Rahasia Besar Ini Akhirnya Terungkap!!!',
          detail: 'Huruf kapital dan tanda seru berlebihan, tetapi tidak menyebut apa rahasianya. Ini sinyal untuk memeriksa, bukan bukti bahwa beritanya salah.', signal: true },
        { id: 'sumber', kind: 'meta', label: 'Penulis/sumber', text: 'Oleh: Redaksi Heboh Viral',
          detail: 'Tidak ada nama penulis, alamat redaksi, atau tautan yang bisa dicek.', signal: true },
        { id: 'isi', kind: 'isi', label: 'Isi', text: 'Simak selengkapnya di bawah ini. Jangan lupa bagikan sebelum dihapus!',
          detail: 'Isinya hanya mengajak membagikan, tanpa informasi atau bukti apa pun.', signal: true }
      ] },

    { id: 'R4-02', frame: 'post',
      stimulus: 'Sebuah postingan menyatakan “Sekolah akan libur minggu depan”, tetapi tidak mencantumkan sumber atau pihak yang mengeluarkan informasi.',
      question: 'Apa kelemahan utama postingan tersebut?',
      options: ['Tidak ada emoji', 'Tidak ada sumber yang dapat diverifikasi', 'Tulisannya terlalu pendek', 'Menggunakan gambar'],
      key: 1, tags: ['SALAH_KRITERIA_TAMPILAN', null, 'SALAH_KRITERIA_TAMPILAN', 'SALAH_KRITERIA_TAMPILAN'],
      explanation: 'Tanpa sumber yang dapat diverifikasi, klaim sulit diperiksa kebenarannya.',
      hint: 'Tanyakan: dari mana informasi tersebut berasal?',
      parts: [
        { id: 'akun', kind: 'akun', label: 'Akun', text: 'InfoSekolah_Update',
          detail: 'Akun tidak menunjukkan identitas resmi sekolah dan tidak terverifikasi.', signal: true },
        { id: 'isi', kind: 'isi', label: 'Isi postingan', text: 'Sekolah akan libur minggu depan!',
          detail: 'Tidak menyebut siapa yang memutuskan, tanggal pastinya, atau dokumen pendukung.', signal: true },
        { id: 'sumber', kind: 'meta', label: 'Sumber/lampiran', text: 'Sumber: (tidak dicantumkan)',
          detail: 'Tidak ada tautan atau pengumuman resmi yang dilampirkan, sehingga klaim sulit diperiksa.', signal: true },
        { id: 'metrik', kind: 'meta', label: 'Suka dan bagikan', text: '❤ 2,3 rb • 🔁 800',
          detail: 'Angka ini hanya menunjukkan popularitas, bukan bukti kebenaran.', signal: false }
      ] },

    { id: 'R4-03', frame: 'news',
      stimulus: 'Sebuah artikel tahun 2022 dibagikan kembali pada 2026 dengan caption “Kabar terbaru hari ini”.',
      question: 'Apa yang harus diperiksa?',
      options: ['Hanya jumlah like', 'Tanggal publikasi dan apakah isi masih relevan dengan konteks saat ini', 'Warna halaman', 'Jumlah komentar'],
      key: 1, tags: ['POPULARITAS_JADI_BUKTI', null, 'SALAH_KRITERIA_TAMPILAN', 'POPULARITAS_JADI_BUKTI'],
      explanation: 'Tanggal dan konteks penting untuk menentukan apakah informasi lama masih relevan.',
      hint: 'Bandingkan tanggal artikel dengan klaim bahwa berita tersebut adalah kabar terbaru.',
      parts: [
        { id: 'judul', kind: 'judul', label: 'Judul', text: 'Jadwal Ujian Sekolah Dipercepat Dua Minggu',
          detail: 'Judulnya wajar, tetapi isinya harus dicocokkan dengan tanggal dan konteks saat ini.', signal: false },
        { id: 'tanggal', kind: 'meta', label: 'Tanggal terbit', text: 'Dipublikasikan: 12 Maret 2022',
          detail: 'Artikel berusia sekitar empat tahun, padahal dibagikan sebagai berita baru. Tanggal dan konteksnya perlu dibandingkan dengan keadaan sekarang.', signal: true },
        { id: 'caption', kind: 'meta', label: 'Keterangan saat dibagikan (2026)', text: '“Kabar terbaru hari ini!”',
          detail: 'Keterangan ini tidak sesuai dengan tanggal terbit aslinya, sehingga bisa menyesatkan.', signal: true },
        { id: 'sumber', kind: 'meta', label: 'Sumber', text: 'Sumber: Portal Berita Contoh',
          detail: 'Sumbernya jelas, tetapi isinya belum tentu masih berlaku. Cek tanggal dan konteksnya.', signal: false }
      ] },

    { id: 'R4-04', frame: 'post',
      stimulus: 'Sebuah postingan menggunakan foto kerumunan lama untuk mendukung klaim bahwa “kejadian ini baru saja terjadi di kota kita”.',
      question: 'Apa yang perlu dilakukan?',
      options: ['Langsung percaya karena ada foto', 'Memeriksa asal, tanggal, dan konteks foto', 'Mengabaikan semua foto di internet', 'Membagikan agar orang lain menilai'],
      key: 1, tags: ['FOTO_JADI_BUKTI', null, 'TOLAK_SEMUA', 'SEBAR_UNTUK_UJI'],
      explanation: 'Foto dapat digunakan ulang dalam konteks berbeda sehingga asal dan tanggal perlu diperiksa.',
      hint: 'Foto yang benar belum tentu digunakan dalam konteks yang benar.',
      parts: [
        { id: 'akun', kind: 'akun', label: 'Akun', text: 'Kabar_Kota_Kita',
          detail: 'Akun tidak dikenal dan tidak menyebut dari mana fotonya berasal.', signal: true },
        { id: 'isi', kind: 'isi', label: 'Isi postingan', text: 'Kejadian ini baru saja terjadi di kota kita!',
          detail: 'Mengklaim waktu dan tempat, tetapi satu-satunya “bukti” hanyalah sebuah foto.', signal: true },
        { id: 'foto', kind: 'foto', label: 'Foto', img: 'r4-04-foto-kerumunan.jpg',
          detail: 'Dalam simulasi ini, penelusuran menunjukkan foto tersebut sudah beredar sejak 2019 dan bukan diambil di kota ini. Foto yang asli belum tentu dipakai dalam konteks yang benar.', signal: true }
      ] },

    { id: 'R4-05', frame: 'post',
      stimulus: 'Sebuah postingan berkata, “Menurut saya, produk ini pasti aman karena banyak orang membelinya.”',
      question: 'Pernyataan tersebut lebih tepat dianggap sebagai ...',
      options: ['Bukti ilmiah', 'Klaim/opini yang belum membuktikan keamanan', 'Sumber resmi', 'Hasil verifikasi'],
      key: 1, tags: ['KLAIM_DIANGGAP_BUKTI', null, 'KLAIM_DIANGGAP_BUKTI', 'KLAIM_DIANGGAP_BUKTI'],
      explanation: 'Banyak orang membeli produk tidak otomatis membuktikan bahwa produk tersebut aman.',
      hint: 'Bedakan pernyataan/pendapat dengan bukti yang dapat diverifikasi.',
      parts: [
        { id: 'akun', kind: 'akun', label: 'Akun', text: 'ReviewJujur_ID',
          detail: 'Akun pengulas biasa; belum tentu ahli keamanan produk.', signal: false },
        { id: 'isi', kind: 'isi', label: 'Isi postingan', text: '“Menurut saya, produk ini pasti aman karena banyak orang membelinya.”',
          detail: 'Kata “menurut saya” menandakan pendapat. Banyaknya pembeli tidak membuktikan produk aman.', signal: true },
        { id: 'bukti', kind: 'meta', label: 'Bukti', text: 'Bukti: (tidak ada)',
          detail: 'Tidak ada hasil uji, izin resmi, atau sumber berwenang yang dilampirkan.', signal: true }
      ] },

    /* ----- Tahap 2: Investigasi ----- */
    { id: 'R4-06', frame: 'chat',
      stimulus: 'Pesan berantai menyebutkan bahwa jadwal libur sekolah berubah.',
      question: 'Sumber yang paling tepat untuk melakukan cross-check adalah ...',
      options: ['Akun anonim', 'Komentar teman', 'Kanal/sumber resmi sekolah atau pihak berwenang', 'Jumlah like postingan'],
      key: 2, tags: ['SUMBER_ANONIM', 'SUMBER_TIDAK_BERWENANG', null, 'POPULARITAS_JADI_BUKTI'],
      explanation: 'Informasi terkait jadwal sekolah sebaiknya diverifikasi melalui sumber resmi yang berwenang.',
      hint: 'Cari sumber yang memiliki kewenangan atas jadwal sekolah.',
      parts: [
        { id: 'pesan', kind: 'isi', label: 'Isi pesan', text: '[Diteruskan berkali-kali] Info penting! Jadwal libur sekolah berubah. Sebarkan ke semua grup!',
          detail: 'Pesan berantai tanpa penulis asli, tanpa tanggal, dan tanpa dokumen. Isinya perlu dicek ke pihak yang berwenang atas jadwal sekolah.', signal: true },
        { id: 'pengirim', kind: 'meta', label: 'Pengirim', text: 'Diteruskan dari: grup lain (asal tidak diketahui)',
          detail: 'Pengirim hanya meneruskan; sumber awalnya tidak diketahui.', signal: true },
        { id: 'lampiran', kind: 'meta', label: 'Lampiran', text: 'Lampiran: (tidak ada)',
          detail: 'Tidak ada surat edaran atau pengumuman resmi.', signal: true }
      ] },

    { id: 'R4-07', frame: 'post',
      stimulus: 'Sebuah giveaway mengklaim hadiah besar, menggunakan link pendek yang tidak dikenal, meminta login, dan memberi batas waktu sangat singkat.',
      question: 'Apa keputusan yang paling tepat?',
      options: [
        'Login secepatnya agar tidak kehilangan hadiah',
        'Mengenali beberapa red flag dan melakukan verifikasi sebelum berinteraksi atau memasukkan data',
        'Sebarkan ke teman agar mereka mencoba',
        'Masukkan password yang sama dengan akun lain'
      ],
      key: 1, tags: ['TERGIUR_HADIAH', null, 'SEBAR_TANPA_CEK', 'BAGI_KREDENSIAL'],
      explanation: 'Hadiah besar, tekanan waktu, link tidak dikenal, dan permintaan login merupakan kombinasi tanda yang perlu diverifikasi.',
      hint: 'Cari lebih dari satu tanda mencurigakan, bukan hanya satu.',
      parts: [
        { id: 'isi', kind: 'isi', label: 'Isi postingan', text: '🎁 GIVEAWAY HADIAH BESAR! Klaim sekarang juga!',
          detail: 'Hadiah besar dipakai sebagai umpan agar orang bertindak cepat.', signal: true },
        { id: 'tautan', kind: 'meta', label: 'Tautan', text: 'pendek.example/hadiah-besar',
          detail: 'Tautan pendek menyembunyikan alamat tujuan, sehingga tidak bisa dinilai dari tampilannya.', signal: true },
        { id: 'login', kind: 'meta', label: 'Permintaan', text: 'Login dengan akun media sosialmu untuk mengklaim hadiah',
          detail: 'Meminta login lewat tautan yang tidak dikenal adalah ciri halaman login palsu (phishing).', signal: true },
        { id: 'waktu', kind: 'meta', label: 'Batas waktu', text: '⏳ Sisa waktu: 09:59 menit!',
          detail: 'Batas waktu sangat singkat dipakai untuk menekan korban agar tidak sempat memeriksa.', signal: true }
      ] },

    { id: 'R4-08', frame: 'chat',
      stimulus: 'Seseorang berkata, “Katanya teman saya, besok ada aturan baru di sekolah.” Tidak ada dokumen atau pengumuman resmi.',
      question: 'Apa tindakan yang paling tepat?',
      options: [
        'Anggap benar karena teman dipercaya',
        'Cross-check dengan sumber resmi sebelum menyebarkannya',
        'Sebarkan dengan tulisan “mungkin benar”',
        'Hapus semua informasi tentang sekolah'
      ],
      key: 1, tags: ['PERCAYA_TEMAN', null, 'SEBAR_TANPA_CEK', 'HAPUS_BUKAN_VERIFIKASI'],
      explanation: 'Informasi dari sumber tidak langsung perlu diperiksa dengan sumber yang dapat diverifikasi.',
      hint: 'Informasi dari “katanya” belum menjadi bukti.',
      parts: [
        { id: 'pesan', kind: 'isi', label: 'Isi pesan', text: '“Katanya teman saya, besok ada aturan baru di sekolah.”',
          detail: 'Informasi tidak langsung: “katanya” belum menjadi bukti.', signal: true },
        { id: 'lampiran', kind: 'meta', label: 'Dokumen', text: 'Lampiran/dokumen: (tidak ada)',
          detail: 'Tidak ada pengumuman atau dokumen resmi yang bisa diperiksa.', signal: true }
      ] },

    { id: 'R4-09', frame: 'compare',
      stimulus: 'Sumber A adalah akun anonim tanpa bukti. Sumber B adalah pengumuman resmi pihak sekolah yang menyertakan tanggal dan dokumen terkait.',
      question: 'Untuk memverifikasi informasi sekolah, pertimbangan yang paling relevan adalah ...',
      options: ['Jumlah followers', 'Bukti dan kewenangan sumber terhadap informasi tersebut', 'Desain akun', 'Banyaknya emoji'],
      key: 1, tags: ['POPULARITAS_JADI_BUKTI', null, 'SALAH_KRITERIA_TAMPILAN', 'SALAH_KRITERIA_TAMPILAN'],
      explanation: 'Kualitas sumber perlu dinilai dari bukti dan otoritas/kewenangannya terhadap informasi.',
      hint: 'Bandingkan bukti dan siapa yang berwenang memberikan informasi.',
      parts: [
        { id: 'A', kind: 'akun', label: 'Sumber A', text: 'Akun anonim tanpa bukti',
          detail: 'Tidak ada identitas, dokumen, atau kewenangan atas informasi sekolah.', signal: true },
        { id: 'B', kind: 'dokumen', label: 'Sumber B', img: 'r4-09-pengumuman-resmi.png', text: 'Pengumuman resmi pihak sekolah',
          detail: 'Pengumuman resmi dengan tanggal, nomor surat, dan dokumen terkait. Bukti dan kewenangannya jelas untuk informasi sekolah.', signal: true }
      ] },

    { id: 'R4-10', frame: 'post',
      stimulus: 'Sebuah postingan memiliki 100.000 likes dan dibagikan ribuan kali, tetapi tidak memiliki sumber dan bukti yang dapat diverifikasi.',
      question: 'Kesimpulan yang paling tepat adalah ...',
      options: [
        'Pasti benar karena viral',
        'Popularitas tidak cukup untuk membuktikan kebenaran; informasi tetap perlu diverifikasi',
        'Pasti salah karena viral',
        'Tidak perlu memeriksa sumber'
      ],
      key: 1, tags: ['POPULARITAS_JADI_BUKTI', null, 'VIRAL_DIANGGAP_SALAH', 'ABAIKAN_SUMBER'],
      explanation: 'Jumlah likes/share menunjukkan popularitas, bukan bukti kebenaran informasi.',
      hint: 'Bedakan ukuran popularitas dengan bukti kebenaran.',
      parts: [
        { id: 'isi', kind: 'isi', label: 'Isi postingan', text: 'Mulai bulan depan semua tugas sekolah dihapus!',
          detail: 'Klaim besar tanpa menyebut siapa yang memutuskan atau dokumen apa pun.', signal: true },
        { id: 'metrik', kind: 'meta', label: 'Suka dan bagikan', text: '❤ 100.000 • 🔁 5.200',
          detail: 'Likes dan share menunjukkan popularitas, bukan kebenaran.', signal: false },
        { id: 'sumber', kind: 'meta', label: 'Sumber', text: 'Sumber: (tidak dicantumkan)',
          detail: 'Tidak ada sumber atau bukti yang bisa diverifikasi.', signal: true }
      ] }
  ];

  /* ================= FINAL: TERBITKAN ATAU TAHAN & VERIFIKASI ================= */
  const ASPEK = [
    { id: 'SUMBER',     label: 'Sumber' },
    { id: 'RELEVANSI',  label: 'Relevansi (tanggal dan konteks)' },
    { id: 'BUKTI',      label: 'Bukti' },
    { id: 'PEMBANDING', label: 'Perbandingan sumber' },
    { id: 'JUDUL',      label: 'Judul' }
  ];

  // aspek = aspek checklist yang otomatis "diperiksa" saat bagian ini dibuka
  const FINAL_PARTS = [
    { id: 'judul', kind: 'judul', label: 'Judul', aspek: 'JUDUL',
      text: 'HEBOH! Semua Sekolah Diliburkan Dua Minggu Mulai Besok, Ini Alasan Mengejutkannya!',
      detail: 'Judul sensasional dan mengajak panik. Ini sinyal untuk memeriksa, bukan bukti bahwa beritanya salah.' },
    { id: 'sumber', kind: 'meta', label: 'Sumber', aspek: 'SUMBER',
      text: 'Sumber: akun InfoKilat_Sekolah (tidak terverifikasi)',
      detail: 'Akun anonim tanpa identitas resmi dan tanpa kewenangan atas jadwal sekolah.' },
    { id: 'tanggal', kind: 'meta', label: 'Tanggal', aspek: 'RELEVANSI',
      text: 'Dipublikasikan 14 Maret 2022 • dibagikan ulang hari ini',
      detail: 'Berita berusia sekitar empat tahun tetapi dibagikan seolah-olah baru. Tanggalnya tidak sesuai dengan klaim “mulai besok”.' },
    { id: 'isi', kind: 'isi', label: 'Isi', aspek: 'BUKTI',
      text: 'Katanya dari orang dalam dinas, semua sekolah akan libur dua minggu karena cuaca ekstrem. Belum ada dokumen resmi, tapi sebarkan dulu demi keselamatan!',
      detail: 'Klaim hanya berdasarkan “katanya”, tanpa dokumen, nomor surat, atau pihak yang bisa dihubungi. Mengajak menyebarkan sebelum diverifikasi.' },
    { id: 'foto', kind: 'foto', label: 'Foto', aspek: ['RELEVANSI', 'BUKTI'], img: 'r4-final-foto-berita.jpg',
      detail: 'Dalam simulasi ini, penelusuran foto menunjukkan gambar tersebut berasal dari kejadian tahun 2019 di tempat lain, sehingga tidak membuktikan kejadian hari ini.' }
  ];

  const FINAL_CMP = [
    { id: 'cmp1', kind: 'meta', label: 'Situs resmi dinas pendidikan', aspek: 'PEMBANDING',
      text: 'Cek: pengumuman dinas', detail: 'Tidak ada pengumuman libur dua minggu.' },
    { id: 'cmp2', kind: 'meta', label: 'Kanal resmi sekolah', aspek: 'PEMBANDING',
      text: 'Cek: pengumuman sekolah', detail: 'Tidak ada pengumuman libur; kegiatan belajar diumumkan berjalan seperti biasa.' },
    { id: 'cmp3', kind: 'meta', label: 'Portal berita terpercaya', aspek: 'PEMBANDING',
      text: 'Cek: pemberitaan lain', detail: 'Tidak ada yang memberitakan libur serentak dua minggu.' }
  ];

  // Dasar keputusan. valid = alasan yang tepat untuk menahan berita ini.
  const REASONS = [
    { id: 'SUMBER',      valid: true,  text: 'Sumbernya tidak jelas dan tidak terverifikasi' },
    { id: 'RELEVANSI',   valid: true,  text: 'Tanggalnya lama sehingga tidak relevan dengan klaim saat ini' },
    { id: 'BUKTI',       valid: true,  text: 'Tidak ada bukti atau dokumen yang mendukung klaim' },
    { id: 'PEMBANDING',  valid: true,  text: 'Sumber-sumber resmi tidak memuat informasi yang sama' },
    { id: 'JUDUL',       valid: true,  text: 'Judulnya sensasional dan mengajak menyebarkan tanpa diperiksa' },
    { id: 'POPULARITAS', valid: false, text: 'Beritanya sudah banyak dibagikan orang' },
    { id: 'FOTO',        valid: false, text: 'Fotonya terlihat meyakinkan' }
  ];

  const TEMUAN = {
    SUMBER:     'Sumber: akun tidak terverifikasi dan tanpa kewenangan.',
    RELEVANSI:  'Relevansi: berita lama (2022) dan fotonya dari kejadian lain, tidak sesuai klaim “mulai besok”.',
    BUKTI:      'Bukti: hanya “katanya”, tanpa dokumen resmi.',
    PEMBANDING: 'Perbandingan sumber: dinas, sekolah, dan portal berita tidak memuat informasi yang sama.',
    JUDUL:      'Judul: sensasional dan mengajak menyebarkan sebelum diperiksa (sinyal untuk memeriksa).'
  };

  /* ================= MODUL ROOM ================= */
  RoomModules.R4 = {
    start(ctx) {
      const el = ctx.container;
      let res1 = [], res2 = [];

      /* ---------- INTRO ---------- */
      function intro() {
        el.innerHTML = `
          <h5>📰 R4 · Ruang Redaksi</h5>
          <p class="stimulus">Misi Agen: kamu bertugas sebagai <b>editor</b> di ruang redaksi digital. Tidak ada berita yang boleh terbit sebelum diperiksa.</p>
          <ol class="stimulus ps-3">
            <li>Tahap 1, Bongkar Berita: periksa 5 kasus judul, sumber, tanggal, foto, dan klaim.</li>
            <li>Tahap 2, Investigasi: cari sumber resmi, cross-check, dan kenali red flag pada 5 kasus.</li>
            <li>Final: putuskan satu berita, <b>Terbitkan</b> atau <b>Tahan &amp; Verifikasi</b>, lengkap dengan dasar keputusannya.</li>
          </ol>
          <p class="stimulus">Selesaikan semuanya untuk mendapatkan <b>Kunci Informasi</b>.</p>
          <button type="button" class="btn btn-info w-100" id="btnGo">Mulai Misi</button>`;
        el.querySelector('#btnGo').onclick = stage1;
      }

      /* ---------- Periksa mockup lalu jawab soal ---------- */
      function investigate(c, base, k, stageLabel, done) {
        const opened = new Set(), t0 = Date.now();
        Api.log({ aktivitas: 'item_view', room: ROOM, item_id: c.id });

        el.innerHTML = `
          <div class="d-flex justify-content-between small text-secondary mb-1">
            <span>${esc(stageLabel)}</span><span>Kasus ${k + 1}/5</span>
          </div>
          <div class="progress mb-3" style="height:8px"><div class="progress-bar" style="width:${((base + k) / 10) * 100}%"></div></div>
          <p class="stimulus">${esc(c.stimulus)}</p>
          <p class="small fw-bold mb-2">🔎 Ketuk bagian di bawah untuk memeriksanya.</p>
          ${mockHtml(c, opened)}
          <div class="detail-box" id="detail">Belum ada bagian yang diperiksa.</div>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnInv" disabled>Yakin, Lanjut ke Pertanyaan</button>`;

        const btn = el.querySelector('#btnInv');
        wireParts(el, c.parts, opened, () => { btn.disabled = opened.size === 0; });

        btn.onclick = () => {
          const ids = [...opened];
          Api.log({
            aktivitas: 'element_check', room: ROOM, item_id: c.id,
            durasi: Math.round((Date.now() - t0) / 1000),
            detail: JSON.stringify({
              diperiksa: ids,
              terlewat: c.parts.filter(p => p.signal && !opened.has(p.id)).map(p => p.id)
            })
          });
          done(opened);
        };
      }

      function question(c, base, k, stageLabel, opened, done) {
        Assessment.run({
          container: el, items: [c], room: ROOM,
          label: stageLabel,
          hint: true, feedback: true,
          offset: base + k, grandTotal: 10, logView: false,
          topHtml: mockHtml(c, opened, { readonly: true }),
          feedbackHtml: reviewHtml(c, opened),
          onDone: r => done(r.results[0])
        });
      }

      function runStage(list, base, stageLabel, done) {
        const results = [];
        let k = 0;
        const loop = () => {
          if (k >= list.length) return done(results);
          const c = list[k], idx = k;
          investigate(c, base, idx, stageLabel, opened =>
            question(c, base, idx, stageLabel, opened, r => { results.push(r); k++; loop(); }));
        };
        loop();
      }

      /* ---------- TAHAP 1 ---------- */
      function stage1() {
        runStage(CASES.slice(0, 5), 0, 'R4 · Tahap 1: Bongkar Berita', r => { res1 = r; stage1Summary(); });
      }

      function stage1Summary() {
        const ok = res1.filter(x => x.ok).length;
        el.innerHTML = `
          <h5>✅ Tahap 1 selesai</h5>
          <p class="stimulus">Pembongkaran yang tepat: <b>${ok}/5</b>.</p>
          <div class="persona">
            <b>Catatan Editor</b>
            <ul class="mb-0 mt-1 ps-3">
              <li>Judul sensasional adalah sinyal untuk memeriksa, bukan bukti benar atau salah</li>
              <li>Periksa sumber, tanggal, dan konteks informasi</li>
              <li>Foto yang benar belum tentu dipakai dalam konteks yang benar</li>
              <li>Bedakan klaim atau pendapat dari bukti yang bisa diverifikasi</li>
            </ul>
          </div>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnS2">Lanjut ke Investigasi</button>`;
        el.querySelector('#btnS2').onclick = stage2;
      }

      /* ---------- TAHAP 2 ---------- */
      function stage2() {
        runStage(CASES.slice(5), 5, 'R4 · Tahap 2: Investigasi', r => { res2 = r; finalChallenge(); });
      }

      /* ---------- FINAL ---------- */
      function finalChallenge() {
        const t0 = Date.now();
        const opened = new Set();
        const allParts = FINAL_PARTS.concat(FINAL_CMP);
        const aspekOf = p => [].concat(p.aspek);
        let attempts = 0, hints = 0, decision = null, passed = false, decisionShown = false;
        const reasons = shuffle(REASONS);

        el.innerHTML = `
          <h5>📰 Final Challenge: Terbitkan atau Tahan &amp; Verifikasi</h5>
          <p class="stimulus">Kamu editor. Berita di bawah sudah masuk antrean terbit. Periksa bagian-bagiannya dan sumber pembanding, lengkapi checklist, lalu putuskan.</p>

          <div class="mock news">
            <div class="mock-bar">📰 PORTAL BERITA CONTOH • DRAF SIAP TERBIT</div>
            <div class="mock-body">${partsHtml(FINAL_PARTS, opened)}</div>
          </div>

          <div class="small fw-bold mb-1">Panel sumber pembanding</div>
          <div class="mock compare3">
            <div class="mock-bar">🔎 PERIKSA KE SUMBER LAIN</div>
            <div class="mock-body">${partsHtml(FINAL_CMP, opened)}</div>
          </div>

          <div class="detail-box" id="detail">Ketuk bagian berita atau sumber pembanding untuk memeriksanya.</div>

          <div class="fw-bold mt-3 mb-1">Checklist editor <span class="small text-secondary" id="chkCount"></span></div>
          <ul class="rule-list" id="chk">
            ${ASPEK.map(a => `<li data-a="${a.id}"><span class="ri">○</span><span>${esc(a.label)}: <em>belum diperiksa</em></span></li>`).join('')}
          </ul>

          <button type="button" class="btn btn-sm btn-outline-info mt-2" id="btnHint">💡 Petunjuk</button>
          <div class="alert alert-info mt-2 mb-0" id="hintBox" hidden></div>

          <div id="decision" class="mt-3" hidden>
            <div class="fw-bold mb-2">Keputusan editor</div>
            <div class="d-grid gap-2 d-sm-flex">
              <button type="button" class="btn btn-option decision-btn" data-d="terbit">✅ Terbitkan</button>
              <button type="button" class="btn btn-option decision-btn" data-d="tahan">⏸️ Tahan &amp; Verifikasi</button>
            </div>
            <div id="reasonBox" class="mt-3" hidden>
              <div class="fw-bold mb-1">Dasar keputusan <span class="small text-secondary">(pilih semua yang sesuai)</span></div>
              ${reasons.map(r => `
                <label class="reason"><input type="checkbox" value="${r.id}"><span>${esc(r.text)}</span></label>`).join('')}
              <button type="button" class="btn btn-info w-100 mt-2" id="btnSend" disabled>Kirim Keputusan Editor</button>
            </div>
          </div>

          <div id="finalMsg" class="mt-3"></div>
          <button type="button" class="btn btn-info w-100 mt-3" id="btnKey" hidden>Ambil Kunci Informasi</button>`;

        const $ = s => el.querySelector(s);
        const msg = $('#finalMsg'), btnSend = $('#btnSend');

        const checkedAspects = () => new Set(allParts.filter(p => opened.has(p.id)).flatMap(aspekOf));

        function updateChecklist() {
          const ck = checkedAspects();
          ASPEK.forEach(a => {
            const li = $(`#chk [data-a="${a.id}"]`), on = ck.has(a.id);
            li.className = on ? 'ok' : '';
            li.querySelector('.ri').textContent = on ? '✓' : '○';
            li.querySelector('em').textContent = on ? 'sudah diperiksa' : 'belum diperiksa';
          });
          $('#chkCount').textContent = `(${ck.size}/${ASPEK.length} aspek)`;
          if (ck.size === ASPEK.length && !decisionShown) {
            decisionShown = true;
            $('#decision').hidden = false;
          }
        }

        function refreshSend() {
          const any = el.querySelectorAll('.reason input:checked').length > 0;
          btnSend.disabled = passed || !decision || !any;
        }

        wireParts(el, allParts, opened, updateChecklist);
        updateChecklist();

        // Petunjuk: hanya menyebut aspek yang belum diperiksa
        $('#btnHint').onclick = () => {
          hints++;
          const ck = checkedAspects();
          const belum = ASPEK.filter(a => !ck.has(a.id)).map(a => a.label);
          const box = $('#hintBox');
          box.textContent = belum.length
            ? `Aspek yang belum kamu periksa: ${belum.join(', ')}. Buka bagian berita atau sumber pembanding yang berkaitan.`
            : 'Semua aspek sudah diperiksa. Tinjau kembali temuanmu, lalu pilih keputusan yang paling beralasan.';
          box.hidden = false;
          Api.log({ aktivitas: 'hint_used', room: ROOM, item_id: 'R4-FINAL', hint: hints });
        };

        el.querySelectorAll('.decision-btn').forEach(b => {
          b.onclick = () => {
            if (passed) return;
            decision = b.dataset.d;
            el.querySelectorAll('.decision-btn').forEach(x => x.classList.toggle('selected', x === b));
            $('#reasonBox').hidden = false;
            refreshSend();
          };
        });
        el.querySelectorAll('.reason input').forEach(i => i.addEventListener('change', refreshSend));

        btnSend.onclick = () => {
          if (passed || !decision) return;
          attempts++;
          const chosen = [...el.querySelectorAll('.reason input:checked')].map(i => i.value);
          const good = chosen.filter(id => REASONS.find(r => r.id === id).valid);
          const bad = chosen.filter(id => !REASONS.find(r => r.id === id).valid);
          const okDecision = decision === 'tahan';
          const okReasons = bad.length === 0 && good.length >= 3;
          const pass = okDecision && okReasons;

          Api.log({
            aktivitas: 'final_decision', room: ROOM, item_id: 'R4-FINAL',
            benar: pass, hint: hints, attempt: attempts,
            durasi: Math.round((Date.now() - t0) / 1000),
            detail: JSON.stringify({ keputusan: decision, alasan: chosen, diperiksa: [...checkedAspects()] })
          });

          if (!okDecision) {
            msg.innerHTML = `<div class="feedback bad"><b>Belum tepat.</b> Berita ini belum layak terbit. Tinjau lagi sumbernya, tanggalnya, buktinya, dan perbandingannya dengan sumber resmi. Editor yang baik tidak menerbitkan sebelum diverifikasi.</div>`;
            return;
          }
          if (bad.length) {
            msg.innerHTML = `<div class="feedback bad"><b>Keputusanmu tepat, tetapi dasarnya keliru.</b> Popularitas dan tampilan yang meyakinkan bukan bukti kebenaran. Tinjau lagi dasar keputusanmu.</div>`;
            return;
          }
          if (good.length < 3) {
            msg.innerHTML = `<div class="feedback bad"><b>Keputusanmu tepat, tetapi dasarnya belum lengkap.</b> Pilih sedikitnya 3 alasan yang mendukung keputusan menahan berita.</div>`;
            return;
          }

          passed = true;
          el.querySelectorAll('.decision-btn, .reason input').forEach(x => { x.disabled = true; });
          btnSend.hidden = true;
          msg.innerHTML = `
            <div class="feedback ok">
              <b>Keputusan editor tepat: Tahan &amp; Verifikasi.</b>
              <ul class="mb-0 mt-2 ps-3">${ASPEK.map(a => `<li>${esc(TEMUAN[a.id])}</li>`).join('')}</ul>
            </div>`;
          $('#btnKey').hidden = false;
        };

        $('#btnKey').onclick = () => {
          const correct = res1.concat(res2).filter(x => x.ok).length;
          ctx.complete(Math.round((correct / 10) * 100));
        };
      }

      // Materi pengantar tampil dulu (bisa dilewati), lalu intro misi
      if (typeof Materi !== 'undefined') Materi.briefing({ container: el, room: ROOM, onDone: intro }); else intro();
    }
  };
})();