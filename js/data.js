const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwNeu9FRND2KKpPaKAzDn3crFTY054uIj0xCyUBf3mAPiRsY16LiJ6pjKFO3TM1Pfj2/exec',
  DEMO: false,           // true = tanpa backend, log disimpan di localStorage
  DEMO_PASSWORD: 'mts7',    // hanya dipakai saat DEMO = true; mode asli memakai sheet Pengaturan
  KELAS: 'ABCDEFGHI'.split('').map(h => 'IX-' + h),   // IX-A sampai IX-I
  PRETEST_HINT: false,       // Pre-Test = baseline, hint dimatikan
  PRETEST_FEEDBACK: false,   // Pre-Test = baseline, penjelasan dimatikan
  POSTTEST_HINT: false,      // Post-Test dibuat setara dengan Pre-Test (untuk N-Gain)
  POSTTEST_FEEDBACK: false,
  DEV_UNLOCK_ALL: false      // true = semua tahap terbuka (HANYA untuk uji coba; kembalikan ke false)
};

const ROOMS = [
  { id: 'R1', nama: 'Lobi Platform',     icon: '🏢', kunci: 'Kunci Platform',    tagline: 'Kenali alat digital yang tepat untuk setiap kebutuhan.' },
  { id: 'R2', nama: 'Ruang Privasi',     icon: '🕵️', kunci: 'Kunci Privasi',     tagline: 'Tidak semua informasi boleh dibagikan sembarangan.' },
  { id: 'R3', nama: 'Brankas Sandi',     icon: '🔐', kunci: 'Kunci Akun',        tagline: 'Jangan biarkan akunmu dibobol!' },
  { id: 'R4', nama: 'Ruang Redaksi',     icon: '📰', kunci: 'Kunci Informasi',   tagline: 'Benarkah berita ini?' },
  { id: 'R5', nama: 'Pusat Pertahanan',  icon: '🛡️', kunci: 'Kunci Pertahanan',  tagline: 'Kenali ancaman dan pilih respons yang aman.' }
];

// key = indeks opsi benar (0 = A). tags = error tag per opsi (null untuk jawaban benar).
const PRETEST = [
  { id: 'PT-01', level: 'C1',
    stimulus: 'Seorang siswa ingin mengirim pesan singkat kepada teman untuk mengingatkan jadwal tugas.',
    question: 'Platform yang paling sesuai untuk kebutuhan tersebut adalah ...',
    options: ['WhatsApp', 'Google Drive', 'YouTube', 'Google Classroom'],
    key: 0, tags: [null, 'PLT_PENYIMPANAN', 'PLT_VIDEO', 'PLT_KELAS'],
    explanation: 'WhatsApp digunakan terutama untuk komunikasi/pesan. Platform lain memiliki fungsi utama yang berbeda.',
    hint: 'Cari platform yang fungsi utamanya adalah komunikasi.' },

  { id: 'PT-02', level: 'C2',
    stimulus: 'Kelompok siswa sedang mengerjakan tugas bersama. Mereka perlu menyimpan satu file laporan yang dapat diakses dan diperbarui oleh anggota kelompok.',
    question: 'Platform yang paling sesuai adalah ...',
    options: ['Google Drive', 'Instagram', 'YouTube', 'WhatsApp Status'],
    key: 0, tags: [null, 'PLT_SOSMED', 'PLT_VIDEO', 'PLT_PESAN'],
    explanation: 'Google Drive sesuai untuk menyimpan dan berbagi file secara bersama.',
    hint: 'Perhatikan kebutuhan utama: menyimpan dan berbagi file.' },

  { id: 'PT-03', level: 'C2',
    stimulus: 'Dalam sebuah formulir kegiatan sekolah, siswa diminta mengisi beberapa data.',
    question: 'Data manakah yang paling perlu dilindungi dan tidak dibagikan sembarangan?',
    options: ['Nama lengkap', 'Foto makanan buatan sendiri', 'Password akun', 'Hobi'],
    key: 2, tags: ['DATA_NAMA_RAHASIA', 'DATA_FOTO_RAHASIA', null, 'DATA_HOBI_RAHASIA'],
    explanation: 'Password adalah informasi rahasia yang dapat digunakan untuk mengakses akun.',
    hint: 'Pilih data yang jika diketahui orang lain dapat membuka akun.' },

  { id: 'PT-04', level: 'C3',
    stimulus: 'Ketua kelas meminta nomor WhatsApp seluruh anggota untuk membuat grup kelas resmi.',
    question: 'Apa tindakan yang paling tepat?',
    options: [
      'Membagikan semua nomor di media sosial agar mudah ditemukan',
      'Memberikan nomor kepada ketua kelas melalui cara yang sesuai untuk tujuan tersebut',
      'Mengirim nomor beserta password akun',
      'Menolak semua permintaan nomor dalam keadaan apa pun'
    ],
    key: 1, tags: ['BAGI_PUBLIK', null, 'BAGI_KREDENSIAL', 'TOLAK_MUTLAK'],
    explanation: 'Kelayakan berbagi data bergantung pada tujuan, penerima, kebutuhan, dan risiko. Nomor dapat diberikan melalui cara yang sesuai untuk keperluan grup kelas, tanpa membagikan data rahasia lain.',
    hint: 'Pertimbangkan tujuan, siapa penerimanya, dan data apa yang benar-benar dibutuhkan.' },

  { id: 'PT-05', level: 'C2',
    stimulus: 'Perhatikan dua sandi berikut: (1) 12345678 dan (2) K3!pL9@zQ2.',
    question: 'Pernyataan yang paling tepat adalah ...',
    options: [
      'Sandi (1) lebih kuat karena mudah diingat',
      'Sandi (2) lebih kuat karena menggunakan kombinasi karakter yang lebih sulit ditebak',
      'Keduanya sama kuat',
      'Sandi (1) lebih kuat karena hanya menggunakan angka'
    ],
    key: 1, tags: ['SANDI_MUDAH_DIINGAT', null, 'SANDI_SAMA_KUAT', 'SANDI_ANGKA_SAJA'],
    explanation: 'Sandi kedua menggunakan kombinasi karakter dan tidak berupa pola angka sederhana.',
    hint: 'Cari sandi yang lebih sulit ditebak dan tidak menggunakan pola sederhana.' },

  { id: 'PT-06', level: 'C3',
    stimulus: 'Seorang teman meminta password akun belajar karena ingin membantu mengerjakan tugas.',
    question: 'Tindakan yang paling aman adalah ...',
    options: [
      'Memberikan password karena teman sendiri',
      'Memberikan password hanya sekali',
      'Tidak membagikan password dan menggunakan cara berbagi pekerjaan yang tidak memerlukan kredensial',
      'Mengirim password melalui grup kelas'
    ],
    key: 2, tags: ['PERCAYA_TEMAN', 'SHARE_SEKALI', null, 'SHARE_PUBLIK'],
    explanation: 'Password merupakan kredensial rahasia dan tidak seharusnya dibagikan. Bantuan dapat dilakukan tanpa memberikan akses akun.',
    hint: 'Pikirkan apa yang terjadi jika orang lain mengetahui kredensial akun.' },

  { id: 'PT-07', level: 'C2',
    stimulus: 'Sebuah postingan memiliki judul: "HEBOH! SEMUA SISWA PASTI DAPAT UANG GRATIS HARI INI!!!" tetapi tidak mencantumkan sumber.',
    question: 'Apa tanda yang paling perlu membuat siswa memeriksa informasi tersebut?',
    options: [
      'Judul sensasional dan tidak ada sumber yang jelas',
      'Postingan menggunakan huruf kapital',
      'Postingan memiliki gambar',
      'Postingan dibagikan oleh teman'
    ],
    key: 0, tags: [null, 'REDFLAG_KAPITAL_SAJA', 'REDFLAG_GAMBAR', 'PERCAYA_TEMAN'],
    explanation: 'Judul sensasional dan ketiadaan sumber yang dapat diverifikasi merupakan sinyal untuk melakukan pemeriksaan lebih lanjut.',
    hint: 'Perhatikan judul dan keberadaan sumber yang dapat diverifikasi.' },

  { id: 'PT-08', level: 'C3',
    stimulus: 'Siswa menerima informasi bahwa besok sekolah libur dari sebuah akun media sosial yang tidak dikenal.',
    question: 'Langkah verifikasi yang paling tepat adalah ...',
    options: [
      'Langsung menyebarkannya ke grup kelas',
      'Mengecek sumber resmi sekolah atau pihak yang berwenang',
      'Percaya karena banyak yang menyukai postingan',
      'Menghapus semua pesan tentang informasi tersebut'
    ],
    key: 1, tags: ['SEBAR_TANPA_CEK', null, 'POPULARITAS_JADI_BUKTI', 'HAPUS_BUKAN_VERIFIKASI'],
    explanation: 'Sumber resmi sekolah atau pihak berwenang dapat digunakan untuk memeriksa kebenaran informasi.',
    hint: 'Cari sumber yang paling berwenang terhadap informasi libur sekolah.' },

  { id: 'PT-09', level: 'C2',
    stimulus: 'Sebuah pesan berbunyi: "Akunmu akan ditutup! Klik link ini dan login sekarang untuk mengaktifkan kembali akun."',
    question: 'Ancaman yang paling mungkin ditunjukkan oleh pesan tersebut adalah ...',
    options: ['Phishing', 'Backup data', 'Pembelajaran daring', 'Penyimpanan cloud'],
    key: 0, tags: [null, 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN'],
    explanation: 'Pesan yang mencoba membuat pengguna memasukkan kredensial melalui tautan mencurigakan merupakan ciri phishing.',
    hint: 'Perhatikan apakah pesan mencoba mengambil kredensial melalui tautan.' },

  { id: 'PT-10', level: 'C3',
    stimulus: 'Kamu tidak sengaja mengeklik tautan yang mencurigakan, tetapi belum memasukkan username atau password.',
    question: 'Apa tindakan yang paling aman?',
    options: [
      'Memasukkan password agar tahu halaman tersebut aman',
      'Menutup halaman dan tidak memasukkan kredensial; jika perlu melaporkan kejadian',
      'Mengirim tautan kepada teman untuk dicoba',
      'Menyimpan halaman tersebut untuk dibuka lagi'
    ],
    key: 1, tags: ['KREDENSIAL_KE_PHISHING', null, 'SEBAR_LINK', 'SIMPAN_LINK'],
    explanation: 'Jika belum memasukkan kredensial, jangan melanjutkan interaksi. Tutup halaman dan laporkan bila diperlukan.',
    hint: 'Jangan memberikan kredensial kepada halaman yang mencurigakan.' }
];

// Post-Test: kompetensi setara dengan Pre-Test, tetapi kasus dan formulasi berbeda.
// Dipakai lewat window.POSTTEST (dibaca oleh game.js).
window.POSTTEST = [
  { id: 'PS-01', level: 'C1-C2',
    stimulus: 'Siswa ingin mengirim pesan pengingat singkat kepada anggota kelompok tentang jadwal pertemuan.',
    question: 'Platform yang sesuai untuk kebutuhan komunikasi tersebut adalah ...',
    options: ['WhatsApp', 'Google Drive', 'YouTube', 'Instagram'],
    key: 0, tags: [null, 'PLT_PENYIMPANAN', 'PLT_VIDEO', 'PLT_SOSMED'],
    explanation: 'WhatsApp sesuai untuk komunikasi pesan.',
    hint: 'Cari platform yang fungsi utamanya komunikasi.' },

  { id: 'PS-02', level: 'C3',
    stimulus: 'Tim kelas akan mengerjakan laporan bersama. Mereka membutuhkan tempat untuk menyimpan satu dokumen yang dapat diakses dan dibagikan oleh anggota tim.',
    question: 'Pilihan yang paling sesuai adalah ...',
    options: ['Google Drive', 'YouTube', 'Instagram', 'WhatsApp Status'],
    key: 0, tags: [null, 'PLT_VIDEO', 'PLT_SOSMED', 'PLT_PESAN'],
    explanation: 'Google Drive sesuai untuk menyimpan dan berbagi file.',
    hint: 'Kebutuhan utamanya adalah file bersama.' },

  // Di dokumen Bank Soal, field PS-03 tertukar; sudah dirapikan di sini.
  { id: 'PS-03', level: 'C2',
    stimulus: 'Manakah yang sebaiknya diperlakukan sebagai data rahasia ketika menggunakan layanan digital?',
    question: 'Pilih satu jawaban yang paling tepat.',
    options: ['Hobi', 'Foto makanan', 'Password akun', 'Nama panggilan'],
    key: 2, tags: ['DATA_HOBI_RAHASIA', 'DATA_FOTO_RAHASIA', null, 'DATA_NAMA_RAHASIA'],
    explanation: 'Password merupakan kredensial rahasia.',
    hint: 'Pilih data yang dapat digunakan untuk mengakses akun.' },

  { id: 'PS-04', level: 'C3-C4',
    stimulus: 'Sebuah formulir kegiatan meminta nama dan nomor HP untuk keperluan koordinasi panitia. Formulir berasal dari panitia yang dapat dikenali, tetapi tidak meminta password.',
    question: 'Apa yang sebaiknya dipertimbangkan sebelum mengisi?',
    options: [
      'Isi semua data tanpa membaca tujuan',
      'Periksa tujuan penggunaan, siapa penerima, dan apakah data yang diminta memang diperlukan',
      'Tambahkan password agar data lengkap',
      'Sebarkan formulir ke publik tanpa pemeriksaan'
    ],
    key: 1, tags: ['ISI_TANPA_CEK', null, 'BAGI_KREDENSIAL', 'BAGI_PUBLIK'],
    explanation: 'Keputusan berbagi data perlu mempertimbangkan tujuan, penerima, kebutuhan, dan risiko.',
    hint: 'Gunakan prinsip tujuan, penerima, kebutuhan, dan risiko.' },

  { id: 'PS-05', level: 'C2-C3',
    stimulus: 'Bandingkan dua sandi: “Budi2012” dan “T8#qL2!mZ7”.',
    question: 'Berdasarkan pola yang terlihat, mana yang lebih kuat?',
    options: ['Budi2012', 'T8#qL2!mZ7', 'Keduanya sama', 'Tidak dapat dibandingkan'],
    key: 1, tags: ['SANDI_PAKAI_NAMA_TAHUN', null, 'SANDI_SAMA_KUAT', 'SANDI_TAK_BISA_DINILAI'],
    explanation: 'Sandi kedua menggunakan kombinasi karakter dan tidak tampak menggunakan informasi pribadi.',
    hint: 'Perhatikan penggunaan nama/tahun dan kombinasi karakter.' },

  { id: 'PS-06', level: 'C3-C4',
    stimulus: 'Seorang siswa mengetahui bahwa password akun belajarnya pernah diketik pada komputer umum dan ia lupa melakukan logout.',
    question: 'Tindakan yang paling tepat adalah ...',
    options: [
      'Membiarkannya karena komputer umum aman',
      'Segera mengamankan akun melalui layanan resmi, termasuk mengganti password bila diperlukan, dan memastikan sesi yang tidak dikenal ditutup',
      'Mengirim password ke teman',
      'Menggunakan password yang sama untuk semua akun'
    ],
    key: 1, tags: ['ABAIKAN_RISIKO', null, 'SHARE_PASSWORD', 'SANDI_SAMA_SEMUA'],
    explanation: 'Akun yang berpotensi masih terbuka pada perangkat umum perlu segera diamankan melalui layanan resmi.',
    hint: 'Pikirkan risiko akses orang berikutnya ke akun.' },

  { id: 'PS-07', level: 'C2',
    stimulus: 'Sebuah postingan mengklaim “Sekolah akan berubah jadwal besok!” tetapi hanya berasal dari akun anonim dan menggunakan judul sangat sensasional.',
    question: 'Apa yang sebaiknya dilakukan?',
    options: [
      'Langsung percaya',
      'Menjadikannya sinyal untuk mencari sumber resmi dan memeriksa informasi',
      'Percaya karena judulnya meyakinkan',
      'Membagikan ke semua grup'
    ],
    key: 1, tags: ['PERCAYA_TANPA_CEK', null, 'PERCAYA_JUDUL_MEYAKINKAN', 'SEBAR_TANPA_CEK'],
    explanation: 'Akun anonim dan judul sensasional merupakan alasan untuk melakukan verifikasi, bukan bukti kebenaran.',
    hint: 'Perhatikan sumber dan gaya judul.' },

  { id: 'PS-08', level: 'C3-C4',
    stimulus: 'Kamu membaca berita tentang perubahan kegiatan sekolah di sebuah akun media sosial. Tidak ada dokumen pendukung.',
    question: 'Langkah cross-check yang paling tepat adalah ...',
    options: [
      'Membandingkan dengan pengumuman resmi sekolah atau sumber berwenang',
      'Melihat jumlah likes saja',
      'Membagikannya untuk melihat reaksi',
      'Memilih komentar yang paling banyak'
    ],
    key: 0, tags: [null, 'POPULARITAS_JADI_BUKTI', 'SEBAR_UNTUK_UJI', 'KOMENTAR_JADI_BUKTI'],
    explanation: 'Sumber resmi atau berwenang lebih tepat digunakan untuk memverifikasi informasi kegiatan sekolah.',
    hint: 'Cari sumber yang memiliki kewenangan atas kegiatan sekolah.' },

  { id: 'PS-09', level: 'C2',
    stimulus: 'Sebuah situs menampilkan peringatan besar “Perangkat Anda terkena 5 virus! Klik sekarang untuk memperbaiki!” tanpa pemeriksaan yang jelas.',
    question: 'Ancaman yang perlu dicurigai adalah ...',
    options: ['Scareware/fake alert', 'Penyimpanan cloud', 'Aplikasi kalender', 'Pembaruan tugas'],
    key: 0, tags: [null, 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN', 'SALAH_JENIS_ANCAMAN'],
    explanation: 'Peringatan menakut-nakuti yang mendesak pengguna mengklik dapat merupakan scareware/fake alert.',
    hint: 'Perhatikan pesan menakut-nakuti dan ajakan klik segera.' },

  { id: 'PS-10', level: 'C3-C4',
    stimulus: 'Seorang siswa memasukkan password ke halaman login yang kemudian diketahui mencurigakan.',
    question: 'Apa respons paling aman?',
    options: [
      'Kembali ke halaman tersebut dan mencoba password lain',
      'Segera mengamankan akun melalui layanan resmi, misalnya mengganti password dan mengikuti prosedur pemulihan yang tersedia',
      'Mengirim password kepada teman untuk diperiksa',
      'Mengabaikannya karena password sudah dimasukkan'
    ],
    key: 1, tags: ['COBA_LAGI_DI_PHISHING', null, 'SHARE_PASSWORD', 'ABAIKAN_RISIKO'],
    explanation: 'Setelah kredensial terlanjur dimasukkan ke halaman phishing, akun perlu segera diamankan melalui jalur resmi.',
    hint: 'Fokus pada pemulihan akun, bukan kembali ke halaman mencurigakan.' }
];