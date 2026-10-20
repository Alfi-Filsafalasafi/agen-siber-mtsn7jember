// R1 · Lobi Platform — Tahap 1: Matching (R1-01..05), Tahap 2: Situasional (R1-06..10)
window.RoomModules = window.RoomModules || {};

(() => {
  const ROOM = 'R1';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };

  // Kartu fungsi (teks diambil dari kolom Feedback di Bank Soal).
  // tag = error tag bila siswa memilih fungsi ini untuk platform yang salah.
  const FUNGSI = {
    komunikasi: { label: 'Komunikasi/pesan',                       tag: 'FNG_KOMUNIKASI' },
    video:      { label: 'Menonton/mempublikasikan video',         tag: 'FNG_VIDEO' },
    file:       { label: 'Menyimpan dan berbagi file',             tag: 'FNG_FILE' },
    sosial:     { label: 'Berbagi konten sosial/foto/video',       tag: 'FNG_SOSIAL' },
    kelas:      { label: 'Mengelola pembelajaran dan tugas kelas', tag: 'FNG_KELAS' }
  };

  // Tahap 1 — Matching (hint adalah draf, silakan sesuaikan)
  const MATCH = [
    { id: 'R1-01', platform: 'WhatsApp',         icon: '💬', fungsi: 'komunikasi', hint: 'Platform ini dipakai untuk berkirim pesan dengan teman atau grup.' },
    { id: 'R1-02', platform: 'YouTube',          icon: '▶️', fungsi: 'video',      hint: 'Platform ini identik dengan menonton dan mengunggah video.' },
    { id: 'R1-03', platform: 'Google Drive',     icon: '📁', fungsi: 'file',       hint: 'Bayangkan lemari file di internet yang bisa dibagikan ke orang lain.' },
    { id: 'R1-04', platform: 'Instagram',        icon: '📸', fungsi: 'sosial',     hint: 'Platform ini dipakai untuk membagikan foto dan video kepada pengikut.' },
    { id: 'R1-05', platform: 'Google Classroom', icon: '🎓', fungsi: 'kelas',      hint: 'Platform ini dipakai guru untuk membuat kelas dan memberi tugas.' }
  ];

  // Tahap 2 — Situasional (key = indeks opsi benar, 0 = A)
  const SCENARIO = [
    { id: 'R1-06',
      stimulus: 'Guru meminta semua siswa mengumpulkan file tugas agar dapat diperiksa dan tersusun sebagai tugas kelas.',
      question: 'Platform yang paling sesuai adalah ...',
      options: ['Google Classroom', 'Instagram', 'YouTube', 'WhatsApp Status'],
      key: 0, tags: [null, 'PLT_SOSMED', 'PLT_VIDEO', 'PLT_PESAN'],
      explanation: 'Google Classroom dirancang untuk aktivitas kelas dan pengumpulan tugas.',
      hint: 'Cari platform yang memiliki fungsi utama pembelajaran dan tugas.' },

    { id: 'R1-07',
      stimulus: 'Empat siswa mengerjakan presentasi bersama dan perlu menyimpan file agar anggota kelompok dapat mengaksesnya.',
      question: 'Platform yang paling sesuai adalah ...',
      options: ['Google Drive', 'Instagram', 'YouTube', 'WhatsApp Status'],
      key: 0, tags: [null, 'PLT_SOSMED', 'PLT_VIDEO', 'PLT_PESAN'],
      explanation: 'Google Drive sesuai untuk menyimpan dan berbagi file kelompok.',
      hint: 'Fokus pada kebutuhan menyimpan dan berbagi file.' },

    { id: 'R1-08',
      stimulus: 'Wali kelas perlu menyampaikan pesan singkat kepada anggota grup kelas dan menerima balasan dari mereka.',
      question: 'Platform yang paling sesuai dari pilihan berikut adalah ...',
      options: ['WhatsApp', 'Google Drive', 'YouTube', 'Google Classroom'],
      key: 0, tags: [null, 'PLT_PENYIMPANAN', 'PLT_VIDEO', 'PLT_KELAS'],
      explanation: 'WhatsApp sesuai untuk komunikasi pesan secara langsung/grup.',
      hint: 'Kebutuhan utamanya adalah komunikasi.' },

    { id: 'R1-09',
      stimulus: 'Kelompok siswa telah membuat video tutorial dan ingin mempublikasikannya sebagai video agar dapat ditonton orang lain.',
      question: 'Platform yang paling sesuai adalah ...',
      options: ['YouTube', 'Google Drive', 'Google Classroom', 'WhatsApp'],
      key: 0, tags: [null, 'PLT_PENYIMPANAN', 'PLT_KELAS', 'PLT_PESAN'],
      explanation: 'YouTube sesuai untuk publikasi dan penyebaran konten video.',
      hint: 'Cari platform yang berfokus pada video.' },

    // Di dokumen Bank Soal, field R1-10 tertukar; sudah dirapikan di sini.
    { id: 'R1-10',
      stimulus: 'Kelompok siswa perlu: (1) menyimpan file laporan bersama, (2) mengerjakan tugas dalam konteks kelas, dan (3) mengirim pesan koordinasi.',
      question: 'Platform yang paling sesuai untuk kebutuhan pertama adalah ...',
      options: ['Instagram', 'Google Drive', 'YouTube', 'WhatsApp'],
      key: 1, tags: ['PLT_SOSMED', null, 'PLT_VIDEO', 'PLT_PESAN'],
      explanation: 'Kebutuhan pertama adalah penyimpanan dan berbagi file, sehingga Google Drive paling sesuai.',
      hint: 'Pisahkan kebutuhan penyimpanan file dari komunikasi dan publikasi.' }
  ];

  RoomModules.R1 = {
    start(ctx) {
      const el = ctx.container;
      let firstTryCorrect = 0;   // pasangan yang benar pada percobaan pertama

      /* ---------- INTRO ---------- */
      function intro() {
        el.innerHTML = `
          <h5>🏢 R1 · Lobi Platform</h5>
          <p class="stimulus">Misi Agen: pintu lobi digital terkunci. Ada lima terminal platform yang harus kamu aktifkan.</p>
          <ol class="stimulus ps-3">
            <li>Tahap 1: pasangkan 5 platform dengan fungsi yang sesuai.</li>
            <li>Tahap 2: tangkap gelembung platform yang tepat untuk 5 kasus.</li>
          </ol>
          <p class="stimulus">Selesaikan keduanya untuk mendapatkan <b>Kunci Platform</b>.</p>
          <button type="button" class="btn btn-info w-100" id="btnGo">Mulai Misi</button>`;
        el.querySelector('#btnGo').onclick = stage1;
      }

      /* ---------- TAHAP 1: MATCHING ---------- */
      function stage1() {
        const items = MATCH.map(m => ({ ...m, solved: false, attempts: 0, hints: 0, t0: null }));
        const fOrder = shuffle(Object.keys(FUNGSI));
        let selP = null, selF = null;   // indeks platform / kunci fungsi yang sedang dipilih
        let fb = null;                  // { ok, text }

        const solvedCount = () => items.filter(x => x.solved).length;
        const fSolved = key => items.some(x => x.solved && x.fungsi === key);

        function render() {
          const n = solvedCount();
          el.innerHTML = `
            <div class="d-flex justify-content-between small text-secondary mb-1">
              <span>R1 · Tahap 1: Cocokkan</span><span>Terpasang ${n}/5</span>
            </div>
            <div class="progress mb-3" style="height:8px"><div class="progress-bar" style="width:${n * 10}%"></div></div>
            <p class="stimulus">Pilih satu platform, pilih satu fungsi, lalu tekan tombol konfirmasi.</p>
            <div class="row g-3">
              <div class="col-6">
                <div class="match-col-title">Platform</div>
                <div class="d-grid gap-2">
                  ${items.map((it, i) => `
                    <button type="button" class="btn btn-option match-card ${it.solved ? 'correct' : ''} ${selP === i ? 'selected' : ''}" data-i="${i}" ${it.solved ? 'disabled' : ''}>
                      <span class="mc-icon">${it.icon}</span>
                      <span><b>${esc(it.platform)}</b>${it.solved ? `<br><small>${esc(FUNGSI[it.fungsi].label)}</small>` : ''}</span>
                    </button>`).join('')}
                </div>
              </div>
              <div class="col-6">
                <div class="match-col-title">Fungsi</div>
                <div class="d-grid gap-2">
                  ${fOrder.map(key => `
                    <button type="button" class="btn btn-option match-card ${fSolved(key) ? 'correct' : ''} ${selF === key ? 'selected' : ''}" data-f="${key}" ${fSolved(key) ? 'disabled' : ''}>
                      <span>${esc(FUNGSI[key].label)}</span>
                    </button>`).join('')}
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-info mt-3" id="btnHint">💡 Petunjuk</button>
            <div class="alert alert-info mt-2 mb-0" id="hintBox" hidden></div>
            <button type="button" class="btn btn-info w-100 mt-3" id="btnConfirm" ${selP !== null && selF !== null ? '' : 'disabled'}>Yakin, Cocokkan</button>
            ${fb ? `<div class="feedback ${fb.ok ? 'ok' : 'bad'} mt-3"><b>${fb.ok ? 'Benar!' : 'Belum tepat.'}</b> ${esc(fb.text)}</div>` : ''}`;
          wire();
        }

        function refresh() {
          el.querySelectorAll('[data-i]').forEach(b => b.classList.toggle('selected', +b.dataset.i === selP));
          el.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('selected', b.dataset.f === selF));
          el.querySelector('#btnConfirm').disabled = !(selP !== null && selF !== null);
        }

        function wire() {
          el.querySelectorAll('[data-i]').forEach(b => {
            b.onclick = () => {
              const i = +b.dataset.i;
              if (selP !== i) el.querySelector('#hintBox').hidden = true;
              selP = i;
              if (items[i].t0 === null) {
                items[i].t0 = Date.now();
                Api.log({ aktivitas: 'item_view', room: ROOM, item_id: items[i].id });
              }
              refresh();
            };
          });
          el.querySelectorAll('[data-f]').forEach(b => {
            b.onclick = () => { selF = b.dataset.f; refresh(); };
          });

          el.querySelector('#btnHint').onclick = () => {
            const box = el.querySelector('#hintBox');
            if (selP === null) {
              box.textContent = 'Pilih salah satu platform dulu, lalu tekan Petunjuk.';
            } else {
              const it = items[selP];
              it.hints++;
              box.textContent = it.hint;
              Api.log({ aktivitas: 'hint_used', room: ROOM, item_id: it.id, hint: it.hints });
            }
            box.hidden = false;
          };

          el.querySelector('#btnConfirm').onclick = () => {
            if (selP === null || selF === null) return;
            const it = items[selP];
            const ok = it.fungsi === selF;
            it.attempts++;
            if (it.attempts > 1) Api.log({ aktivitas: 'retry', room: ROOM, item_id: it.id, attempt: it.attempts });
            Api.log({
              aktivitas: 'item_answer', room: ROOM, item_id: it.id,
              jawaban: selF, benar: ok, hint: it.hints, attempt: it.attempts,
              durasi: Math.round((Date.now() - it.t0) / 1000),
              error_tag: ok ? '' : FUNGSI[selF].tag
            });

            if (ok) {
              it.solved = true;
              if (it.attempts === 1) firstTryCorrect++;
              fb = { ok: true, text: `${it.platform}: ${FUNGSI[it.fungsi].label}.` };
              selP = null; selF = null;
            } else {
              fb = { ok: false, text: `Pasangan itu belum sesuai dengan fungsi utama ${it.platform}. Coba lagi.` };
              selF = null;   // platform tetap dipilih supaya bisa langsung mencoba lagi
            }

            render();
            if (solvedCount() === items.length) setTimeout(stage1Summary, 900);
          };
        }

        render();
      }

      /* ---------- RINGKASAN TAHAP 1 ---------- */
      function stage1Summary() {
        el.innerHTML = `
          <h5>✅ Tahap 1 selesai</h5>
          <p class="stimulus">Benar pada percobaan pertama: <b>${firstTryCorrect}/5</b>. Semua terminal sudah menyala:</p>
          <ul class="list-unstyled">
            ${MATCH.map(m => `<li class="mb-1">${m.icon} <b>${esc(m.platform)}</b> → ${esc(FUNGSI[m.fungsi].label)}</li>`).join('')}
          </ul>
          <button type="button" class="btn btn-info w-100" id="btnS2">Lanjut ke Tahap 2</button>`;
        el.querySelector('#btnS2').onclick = stage2;
      }

      /* ---------- TAHAP 2: SITUASIONAL (gelembung melayang) ---------- */
      function stage2() {
        Assessment.run({
          container: el, items: SCENARIO, room: ROOM,
          label: 'R1 · Tahap 2: Situasi',
          hint: true, feedback: true,
          mode: 'bubble',
          offset: 5, grandTotal: 10,
          onDone: r => ctx.complete(Math.round(((firstTryCorrect + r.correct) / 10) * 100))
        });
      }

      // Materi pengantar tampil dulu (bisa dilewati), lalu intro misi
      if (typeof Materi !== 'undefined') Materi.briefing({ container: el, room: ROOM, onDone: intro }); else intro();
    }
  };
})();