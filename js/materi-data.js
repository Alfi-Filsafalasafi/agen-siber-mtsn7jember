/* ================= MATERI PENGANTAR =================
   Satu kartu = satu ide (sekitar 40-60 kata). Field kartu (semua opsional kecuali judul):
     icon, judul, isi, level[{tone: ok|warn|bad, ikon, label, teks}], banding{kiri, kanan: {judul, poin[]}},
     poin[] (urut: true = bernomor), catatan, contoh
   Tulis **kata** untuk huruf tebal. Kolom kiri pada banding berwarna merah, kolom kanan hijau.
   video (opsional per room): { id: 'ID 11 karakter dari link YouTube', judul: '...', kanal: '...', durasi: '2 menit', posisi: 'awal' | 'akhir' }
   Contoh link https://www.youtube.com/watch?v=ABCDEFGHIJK  ->  id: 'ABCDEFGHIJK'
   Isi video: null bila tidak dipakai. posisi 'awal' (default) = kartu pembuka sebelum teks; 'akhir' = di kartu terakhir. Video baru dimuat saat diketuk. */
const MATERI = {
  R1: {
    video: null,
    kartu: [
      { icon: '🧭', judul: 'Setiap platform punya fungsi utama',
        isi: 'Sebelum memilih aplikasi, tanyakan dulu: **aku butuh apa?** Mengirim pesan, menyimpan file, menonton video, atau mengerjakan tugas kelas?' },
      { icon: '💬', judul: 'Komunikasi dan kelas',
        poin: ['**WhatsApp**: berkirim pesan dengan teman atau grup.', '**Google Classroom**: guru membuat kelas dan memberi tugas, siswa mengumpulkan tugas.'],
        contoh: 'Mengingatkan teman soal jadwal piket → WhatsApp.' },
      { icon: '📁', judul: 'File dan video',
        poin: ['**Google Drive**: menyimpan dan membagikan file.', '**YouTube**: menonton dan mempublikasikan video.'],
        contoh: 'File poster kelompok yang dikerjakan bersama → Google Drive.' },
      { icon: '📸', judul: 'Media sosial',
        isi: '**Instagram** dipakai untuk membagikan foto dan video kepada pengikut. Ingat: yang kamu unggah bisa dilihat banyak orang, jadi pikirkan dulu sebelum mengunggah.' },
      { icon: '🧩', judul: 'Satu tugas, beberapa platform',
        isi: 'Satu pekerjaan sering memakai lebih dari satu platform, masing-masing untuk fungsinya.',
        poin: ['File laporan disimpan di **Google Drive**', 'Anggota kelompok berkoordinasi lewat **WhatsApp**', 'Tugas dikumpulkan lewat **Google Classroom**'],
        catatan: 'Pilih platform dari **kebutuhan utamanya**, bukan dari aplikasi yang paling sering kamu buka.' }
    ]
  },

  R2: {
    video: { id: 'UW8G_qhR9XA', posisi: 'awal', judul: 'Jaga privasi, jaga diri: jangan biarkan data pribadi jadi konsumsi publik', kanal: 'BI Jakarta (JOMO S2 Eps. 1)' },
    kartu: [
      { icon: '🪪', judul: 'Apa itu data pribadi?',
        isi: 'Data pribadi adalah informasi yang bisa mengenali atau menghubungi kamu: **nama lengkap, nomor HP, alamat, nomor identitas, dan lokasi**.' },
      { icon: '🚦', judul: 'Tidak semua data sama',
        level: [
          { tone: 'ok', ikon: '🟢', label: 'Risiko rendah', teks: 'hobi, foto karya sendiri (tanpa info sensitif)' },
          { tone: 'warn', ikon: '🟡', label: 'Perlu dilindungi', teks: 'nomor HP, alamat rumah, tanggal lahir' },
          { tone: 'bad', ikon: '🔴', label: 'Rahasia', teks: 'password dan kode verifikasi' }
        ] },
      { icon: '❓', judul: 'Empat pertanyaan sebelum berbagi data',
        urut: true,
        poin: ['**Tujuan**: untuk apa data ini dipakai?', '**Penerima**: siapa yang meminta, resmi atau tidak?', '**Kebutuhan**: apakah data ini memang diperlukan?', '**Risiko**: apa akibatnya jika disalahgunakan?'],
        contoh: 'Panitia lomba yang jelas meminta nama untuk daftar peserta itu wajar. Tapi kalau juga meminta password, itu tidak wajar.' },
      { icon: '🚩', judul: 'Kapan permintaan data tidak wajar?',
        banding: {
          kiri: { judul: '🚩 Tanda tidak wajar', poin: ['Meminta password atau kode verifikasi', 'Meminta banyak data sekaligus tanpa alasan jelas', 'Yang meminta tidak jelas atau tidak resmi', 'Mendesak: "isi sekarang atau hangus!"'] },
          kanan: { judul: '✅ Biasanya wajar', poin: ['Yang meminta jelas dan resmi, misalnya panitia sekolah', 'Tujuannya jelas dan masuk akal', 'Data yang diminta sesuai kebutuhan'] }
        } },
      { icon: '🛑', judul: 'Data orang lain dan lokasi',
        poin: ['Chat atau foto yang memuat orang lain: **minta izin** dan tutup identitasnya.', 'Lokasi real-time yang dibagikan ke publik memberi tahu siapa pun di mana kamu berada sekarang.'] }
    ]
  },

  R3: {
    video: { id: 'k2AX7-0cs4o', posisi: 'awal', judul: 'Password yang aman gimana sih?!', kanal: 'Cyber Academy Indonesia (Kartun Siber Eps. 18)' },
    kartu: [
      { icon: '🔓', judul: 'Sandi yang mudah ditebak',
        isi: 'Penyerang mencoba pola-pola sederhana lebih dulu.',
        banding: {
          kiri: { judul: '⚠️ Mudah ditebak', poin: ['Urutan sederhana: 87654321, abcdefg', 'Kata umum: rahasia, admin, qwerty'] },
          kanan: { judul: '✅ Lebih sulit ditebak', poin: ['Campuran huruf, angka, dan simbol', 'Tidak membentuk kata atau urutan umum'] }
        } },
      { icon: '👤', judul: 'Jangan pakai info pribadi',
        isi: 'Nama, tahun lahir, nama hewan peliharaan, atau kota mudah diketahui orang lain.',
        contoh: 'Sinta2011 mudah ditebak oleh teman sekelas.' },
      { icon: '💪', judul: 'Ciri sandi kuat',
        poin: ['Cukup panjang (sebaiknya 10 karakter atau lebih)', 'Memadukan huruf besar, huruf kecil, angka, dan simbol', 'Tidak berisi info pribadi atau pola sederhana', '**Berbeda untuk setiap akun**'] },
      { icon: '🧪', judul: 'Cara menyusun sandi kuat',
        isi: 'Gabungkan beberapa **kata acak yang tidak berhubungan denganmu**, lalu selipkan huruf besar, angka, dan simbol. Cara ini panjang, sulit ditebak, tapi masih bisa diingat.',
        contoh: 'Kopi-Hujan#47-Layar',
        catatan: 'Itu hanya contoh. Jangan pakai contoh ini untuk akun aslimu.' },
      { icon: '🛡️', judul: 'Kebiasaan aman',
        poin: ['Jangan bagikan password, bahkan ke teman.', '**Logout** setelah memakai komputer umum.', 'Waspada link login yang alamatnya berbeda dari layanan resmi.', 'Satu password dipakai di banyak akun: sekali bocor, semuanya berisiko.'] }
    ]
  },

  R4: {
    video: { id: 'Df3XiTYOyT8', posisi: 'awal', judul: 'Mau tahu apa itu hoax?', kanal: 'Najwa Shihab' },
    kartu: [
      { icon: '📢', judul: 'Judul heboh = sinyal untuk memeriksa',
        isi: 'Huruf kapital, tanda seru berlebihan, dan kata "WAJIB BACA!" bukan bukti berita itu salah, tetapi **alasan untuk memeriksa lebih dulu**.' },
      { icon: '🔍', judul: 'Periksa sumber dan bukti',
        poin: ['Siapa penulis atau penerbitnya? Jelas atau anonim?', 'Ada dokumen, data, atau tautan yang bisa dicek?', 'Bedakan **fakta** dengan **pendapat** ("menurut saya...").'] },
      { icon: '📅', judul: 'Cek tanggal dan konteks',
        isi: 'Berita atau foto lama bisa dibagikan ulang seolah-olah baru. Foto yang asli belum tentu dipakai dalam konteks yang benar.',
        contoh: 'Foto banjir tahun 2018 dipakai untuk berita banjir hari ini.' },
      { icon: '✅', judul: 'Cross-check, jangan tertipu popularitas',
        poin: ['Bandingkan dengan **sumber resmi** yang berwenang (sekolah, dinas, instansi).', 'Banyak like dan share hanya menunjukkan **populer**, bukan **benar**.', 'Belum jelas? **Tahan dulu, jangan disebar.**'] },
      { icon: '📰', judul: 'Checklist editor: terbitkan atau tahan?',
        isi: 'Sebelum sebuah informasi layak diterbitkan atau disebarkan, periksa lima hal ini:',
        poin: ['**Sumber**: jelas dan berwenang?', '**Relevansi**: tanggal dan konteksnya sesuai?', '**Bukti**: ada dokumen atau data yang bisa dicek?', '**Perbandingan**: sumber resmi lain memuat hal yang sama?', '**Judul**: sensasional dan mengajak menyebarkan?'],
        catatan: 'Kalau ada yang belum terjawab, **tahan dan verifikasi dulu**.' }
    ]
  },

  R5: {
    video: { id: 'sp8g-rK_I8Y', posisi: 'awal', judul: 'Phishing di dunia digital', kanal: 'Syamsiah Firdaus (Informatika Kelas 8)' },
    kartu: [
      { icon: '🎣', judul: 'Phishing',
        isi: 'Penipuan yang memancing kamu memasukkan password atau data lewat pesan atau halaman palsu. Ciri-cirinya:',
        poin: ['Hadiah menggiurkan atau ancaman akun ditutup', 'Tekanan waktu ("klaim 10 menit lagi!")', 'Link dengan alamat yang aneh atau berbeda dari layanan resmi'] },
      { icon: '🦠', judul: 'Malware dan izin aplikasi',
        poin: ['File dari sumber tidak dikenal, terutama berakhiran **.exe**, bisa mengandung malware.', 'Cek izin aplikasi: **apakah sesuai fungsinya?** Aplikasi kalkulator tidak perlu mengakses kontak.'] },
      { icon: '😱', judul: 'Scareware',
        isi: 'Pop-up yang menakut-nakuti ("Perangkatmu terkena virus!") dan memaksa kamu klik cepat. **Jangan klik. Tutup halamannya.**' },
      { icon: '🚨', judul: 'Respons aman',
        urut: true,
        poin: ['**Berhenti**, jangan berinteraksi lebih lanjut', '**Jangan** masukkan password atau buka file', '**Keluar** dari halaman', '**Simpan bukti** (tangkapan layar pesan dan alamat link)', '**Laporkan** lewat jalur resmi (guru atau pihak sekolah)'] },
      { icon: '🩹', judul: 'Kalau sudah terlanjur',
        poin: ['Sudah memasukkan password? **Segera amankan akun** lewat layanan resmi, misalnya mengganti password.', 'Perangkat jadi aneh setelah membuka file? **Hentikan aktivitas** dan minta bantuan guru atau orang yang paham.', 'Ceritakan kejadiannya. Melapor membantu mencegah orang lain jadi korban.'] }
    ]
  }
};