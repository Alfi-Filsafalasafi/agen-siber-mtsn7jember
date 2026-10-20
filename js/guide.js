// Briefing Agen: pengantar misi, cara bermain, latihan singkat, dan kode etik.
// Dipandu karakter pemandu (nama dan avatar bisa diubah di GUIDE).
window.Guide = (() => {
  const GUIDE = { nama: 'Komandan Sigap', avatar: '🎖️' };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Latihan tidak dinilai dan tidak dicatat di Log
  const PRACTICE = {
    question: 'Kamu sudah memilih satu jawaban. Apa yang harus ditekan supaya jawabanmu dikunci?',
    options: [
      'Menunggu sampai layar menutup sendiri',
      'Tombol “Yakin”, lalu jawabanmu terkunci',
      'Menutup halaman lalu membukanya lagi'
    ],
    key: 1,
    explanation: 'Jawabanmu baru terkunci setelah menekan tombol “Yakin”. Sebelum itu kamu boleh mengganti pilihan. Setelah terkunci, muncul pembahasan yang menjelaskan alasannya.'
  };

  const RULES = [
    { ico: '💡', text: 'Petunjuk membantu kamu berpikir dan tidak mengurangi skor ruangan.' },
    { ico: '✅', text: 'Jawabanmu dikunci setelah menekan tombol “Yakin”. Sebelum itu boleh mengganti pilihan.' },
    { ico: '📖', text: 'Setiap jawaban disertai pembahasan. Pelajari alasannya, bukan hanya benar atau salahnya.' },
    { ico: '🔑', text: 'Selesaikan satu ruangan untuk mendapatkan satu kunci.' },
    { ico: '💾', text: 'Progresmu tersimpan. Kamu bisa melanjutkan kapan saja, bahkan dari perangkat lain.' },
    { ico: '📱', text: 'Game ini bisa dimainkan di HP maupun komputer.' }
  ];

  const ETIK = [
    { ico: '🎭', text: 'Semua kejadian di dalam game adalah simulasi.' },
    { ico: '🔒', text: 'Jangan memakai password, nomor HP, atau data aslimu di dalam game.' },
    { ico: '🚫', text: 'Di dunia nyata, jangan membuka link atau file mencurigakan untuk dicoba.' },
    { ico: '🙋', text: 'Jika menemukan hal mencurigakan, laporkan kepada guru atau orang dewasa yang kamu percaya.' }
  ];

  // Efek ketik; mengembalikan fungsi untuk langsung menampilkan seluruh teks
  function typeInto(node, text, speed) {
    node.setAttribute('aria-label', text);
    if (reduced() || speed <= 0) { node.textContent = text; return () => {}; }
    let i = 0;
    node.textContent = '';
    const timer = setInterval(() => {
      i++;
      node.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => { clearInterval(timer); node.textContent = text; };
  }

  function briefing({ container: el, session, onDone }) {
    const s = session || {};
    const t0 = Date.now();
    let step = 0, practice = null, practiceSel = null, pledge = false, finishTyping = null;

    Api.log({ aktivitas: 'briefing_start', room: 'BRIEF' });

    const SLIDES = [
      /* 1. Transmisi */
      {
        say: () => `Selamat datang, Agen ${s.nama || ''}. Saya ${GUIDE.nama}. Kamu terpilih dari kelas ${s.kelas || ''} untuk bergabung dengan pasukan Agen Siber.`,
        body: () => `
          <div class="id-card">
            <div class="id-photo" aria-hidden="true">🕵️</div>
            <div class="id-info">
              <div class="id-label">AGEN SIBER</div>
              <div class="id-name">${esc(s.nama || 'Agen')}</div>
              <div class="id-row">Kelas: <b>${esc(s.kelas || '-')}</b></div>
              <div class="id-row">Kode agen: <b>AS-${esc(s.id_siswa || s.nomor_absen || '000')}</b></div>
              <div class="id-status">✓ Pre-Test selesai • Status: Calon Agen</div>
            </div>
          </div>`
      },

      /* 2. Misi */
      {
        say: () => 'Dunia digital penuh kemudahan, tetapi juga penuh jebakan: salah memilih platform, data yang bocor, akun yang dibobol, kabar bohong, dan serangan siber. Tugasmu menjaga dirimu dan teman-temanmu tetap aman.',
        body: () => `
          <div class="road">
            ${ROOMS.map(r => `
              <div class="road-card">
                <span class="rc-ico" aria-hidden="true">${r.icon}</span>
                <b>${esc(r.id)} · ${esc(r.nama)}</b>
                <small>🔑 ${esc(r.kunci)}</small>
              </div>`).join('')}
            <div class="road-goal">Selesaikan <b>5 ruangan</b>, kumpulkan <b>5 kunci</b>, lalu buka <b>Portal Digital</b>.</div>
          </div>`
      },

      /* 3. Cara bermain */
      {
        say: () => 'Sebelum berangkat, kenali dulu perlengkapanmu. Perhatikan aturan mainnya baik-baik.',
        body: () => `<ul class="rules">${RULES.map(r => `<li><span class="ri" aria-hidden="true">${r.ico}</span><span>${esc(r.text)}</span></li>`).join('')}</ul>`
      },

      /* 4. Latihan */
      {
        say: () => 'Mari berlatih sebentar. Latihan ini tidak dinilai dan tidak dicatat.',
        body: () => `
          <div class="practice">
            <div class="small fw-bold text-secondary mb-2">LATIHAN SINGKAT • TIDAK DINILAI</div>
            <h5>${esc(PRACTICE.question)}</h5>
            <div class="d-grid gap-2 my-3" id="pOpts">
              ${PRACTICE.options.map((t, i) => `<button type="button" class="btn btn-option" data-i="${i}" aria-pressed="false">${esc(t)}</button>`).join('')}
            </div>
            <button type="button" class="btn btn-info w-100" id="pConfirm" disabled>Yakin, Periksa Jawaban</button>
            <div id="pFb" class="mt-3"></div>
          </div>`,
        gate: () => practice !== null,
        wire() {
          const opts = el.querySelectorAll('#pOpts button');
          const confirm = el.querySelector('#pConfirm');
          const fb = el.querySelector('#pFb');
          const showFb = ok => {
            fb.innerHTML = `<div class="feedback ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Benar!' : 'Belum tepat.'}</b> ${esc(PRACTICE.explanation)}</div>`;
          };
          const lock = () => opts.forEach((b, i) => {
            b.disabled = true;
            b.classList.remove('selected');
            if (i === PRACTICE.key) b.classList.add('correct');
            else if (i === practiceSel) b.classList.add('wrong');
          });

          if (practice !== null) { lock(); confirm.hidden = true; showFb(practice); return; }

          opts.forEach(b => {
            b.onclick = () => {
              practiceSel = +b.dataset.i;
              opts.forEach(x => {
                const on = x === b;
                x.classList.toggle('selected', on);
                x.setAttribute('aria-pressed', on);
              });
              confirm.disabled = false;
            };
          });
          confirm.onclick = () => {
            practice = practiceSel === PRACTICE.key;
            lock();
            confirm.hidden = true;
            showFb(practice);
            updateNav();
          };
        }
      },

      /* 5. Kode etik */
      {
        say: () => 'Satu hal terakhir: kode etik Agen Siber. Setiap agen wajib menaatinya.',
        body: () => `
          <ul class="rules">${ETIK.map(r => `<li><span class="ri" aria-hidden="true">${r.ico}</span><span>${esc(r.text)}</span></li>`).join('')}</ul>
          <label class="pledge-check">
            <input type="checkbox" id="pledge" ${pledge ? 'checked' : ''}>
            <span>Saya siap menjalankan kode etik Agen Siber.</span>
          </label>`,
        gate: () => pledge,
        wire() {
          el.querySelector('#pledge').onchange = e => { pledge = e.target.checked; updateNav(); };
        }
      }
    ];

    function updateNav() {
      const sl = SLIDES[step];
      el.querySelector('#bPrev').disabled = step === 0;
      el.querySelector('#bNext').disabled = sl.gate ? !sl.gate() : false;
    }

    function render() {
      if (finishTyping) { finishTyping(); finishTyping = null; }
      const sl = SLIDES[step];
      const last = step === SLIDES.length - 1;

      el.innerHTML = `
        <div class="brief-top">
          <span class="brief-stamp">DOKUMEN RAHASIA</span>
          <span class="brief-dots" aria-label="Layar ${step + 1} dari ${SLIDES.length}">
            ${SLIDES.map((_, i) => `<i class="${i === step ? 'on' : (i < step ? 'done' : '')}"></i>`).join('')}
          </span>
        </div>
        <div class="guide">
          <div class="guide-avatar" aria-hidden="true">${GUIDE.avatar}</div>
          <div class="guide-bubble">
            <div class="guide-name">${esc(GUIDE.nama)}</div>
            <p class="guide-text" id="gText"></p>
          </div>
        </div>
        <div class="brief-body">${sl.body()}</div>
        <div class="brief-nav">
          <button type="button" class="btn btn-outline-secondary" id="bPrev">← Kembali</button>
          <button type="button" class="btn btn-info" id="bNext">${last ? 'Terima Misi 🚀' : 'Lanjut →'}</button>
        </div>`;

      finishTyping = typeInto(el.querySelector('#gText'), sl.say(), 16);
      if (sl.wire) sl.wire();

      el.querySelector('#bPrev').onclick = () => { step--; render(); };
      el.querySelector('#bNext').onclick = () => {
        if (last) return finish();
        step++;
        render();
      };
      updateNav();
    }

    function finish() {
      if (finishTyping) { finishTyping(); finishTyping = null; }
      Api.log({
        aktivitas: 'briefing_complete', room: 'BRIEF',
        durasi: Math.round((Date.now() - t0) / 1000),
        detail: JSON.stringify({ latihan_benar: practice === true, kode_etik: true })
      });
      onDone();
    }

    render();
  }

  return { briefing };
})();