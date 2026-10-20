// Setiap room (rooms/room1.js dst.) mendaftarkan diri:
//   RoomModules.R1 = { start(ctx) { ... ctx.complete(skor) } }
// ctx = { container, complete(score), exit() }
window.RoomModules = window.RoomModules || {};

(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const STEPS = [
    { id: 'PRE', nama: 'Pre-Test', icon: '📝', desc: 'Cek kemampuan awalmu sebelum misi dimulai.', once: true },
    { id: 'BRIEF', nama: 'Briefing Agen', icon: '📂', desc: 'Kenali misi, cara bermain, dan kode etik Agen.', redo: 'Lihat lagi' },
    ...ROOMS.map(r => ({ id: r.id, nama: `${r.id} · ${r.nama}`, icon: r.icon, desc: r.tagline, kunci: r.kunci })),
    { id: 'PORTAL', nama: 'Portal Digital', icon: '🌐', desc: 'Masukkan kelima kunci untuk membuka portal menuju Post-Test.', redo: 'Lihat lagi' },
    { id: 'POST', nama: 'Post-Test', icon: '🏁', desc: 'Buktikan perkembanganmu setelah semua misi.', once: true, redo: 'Lihat Hasil' }
  ];

  const P = () => Store.getProgress();
  const isDone = id => {
    const p = P();
    if (id === 'PRE') return p.pre !== null;
    if (id === 'POST') return p.post !== null;
    // Briefing dianggap selesai bila sudah diterima, atau siswa sudah pernah menyelesaikan room
    if (id === 'BRIEF') return p.brief === true || p.keys.length > 0;
    // Portal terbuka bila sudah dibuka di perangkat ini, atau Post-Test sudah selesai (mis. progres dari server)
    if (id === 'PORTAL') return p.portal === true || p.post !== null;
    return !!p.rooms[id];
  };
  // Tahap terbuka bila tahap sebelumnya selesai. DEV_UNLOCK_ALL hanya untuk uji coba.
  const isOpen = idx => CONFIG.DEV_UNLOCK_ALL === true || idx === 0 || isDone(STEPS[idx - 1].id);

  function show(name) {
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== 'screen-' + name; });
    $('#topbar').hidden = (name === 'landing' || name === 'login');
    window.scrollTo(0, 0);
  }

  /* ---------- Hub ---------- */
  function renderHub() {
    Portal.stop();    // hentikan animasi portal bila siswa keluar di tengah jalan
    Materi.close();   // bila siswa keluar dari materi lewat tombol lain, durasi baca tetap tercatat
    const s = Store.getSession(), p = P();
    $('#whoami').textContent = `${s.nama} • ${s.kelas}`;

    // Perpustakaan Materi: terbuka setelah Pre-Test, tertutup selama Post-Test berlangsung
    const ms = Materi.status();
    $('#btnMateri').disabled = ms !== 'ok';
    $('#materiHint').textContent =
      ms === 'belum_pre' ? 'Terbuka setelah kamu menyelesaikan Pre-Test.' :
      ms === 'post_berjalan' ? 'Ditutup sampai Post-Test selesai.' :
      'Baca kapan saja untuk membantumu menyelesaikan misi.';

    const doneCount = STEPS.filter(x => isDone(x.id)).length;
    $('#hubProgress').style.width = (doneCount / STEPS.length) * 100 + '%';
    $('#hubProgressText').textContent = `${doneCount}/${STEPS.length} misi selesai`;
    $('#keys').innerHTML = ROOMS.map(r =>
      `<span class="key ${p.keys.includes(r.id) ? 'on' : ''}" title="${r.kunci}">🔑</span>`).join('');

    $('#steps').innerHTML = STEPS.map((st, i) => {
      const done = isDone(st.id), open = isOpen(i);
      const locked = done && st.once && st.id !== 'POST';   // Post-Test selesai: tes terkunci, tombol berubah jadi Lihat Hasil
      const score = st.id === 'PRE' ? p.pre : st.id === 'POST' ? p.post : (p.rooms[st.id] || {}).score;
      const btnText = locked ? 'Selesai' : done ? (st.redo || 'Ulangi') : 'Mulai';
      const info = !done ? ''
        : st.id === 'BRIEF' ? '<div class="small mt-1 text-success">Misi diterima</div>'
        : st.id === 'PORTAL' ? '<div class="small mt-1 text-success">Portal terbuka</div>'
        : `<div class="small mt-1 text-success">Skor terbaik: ${score}</div>`;
      return `
        <div class="col-12 col-md-6">
          <div class="panel step ${done ? 'done' : ''} ${open ? '' : 'locked'}">
            <div class="d-flex gap-3 align-items-center">
              <div class="fs-1">${open ? st.icon : '🔒'}</div>
              <div class="flex-grow-1">
                <h6 class="mb-1">${st.nama}</h6>
                <div class="small text-secondary">${st.desc}</div>
                ${info}
              </div>
              <button class="btn btn-sm ${done ? 'btn-outline-info' : 'btn-info'}" data-step="${st.id}" ${open && !locked ? '' : 'disabled'}>${btnText}</button>
            </div>
          </div>
        </div>`;
    }).join('');
    show('hub');
  }

  let resultNext = null;   // aksi tombol "Lanjut" pada layar hasil (default: kembali ke Markas)

  function showResult(title, score, kunci, next, nextLabel) {
    $('#btnResultNext').textContent = nextLabel || 'Lanjut';
    $('#resultTitle').textContent = title;
    $('#resultScore').textContent = score;
    $('#resultKey').textContent = kunci ? `🔑 ${kunci} diperoleh!` : '';
    resultNext = next || null;
    show('result');
  }

  /* ---------- Menjalankan langkah ---------- */
  // Layar hasil akhir: perbandingan Pre/Post, N-Gain, skor ruangan, lencana
  function showHasil() {
    show('play');
    const area = $('#play-area');
    area.innerHTML = '';
    Hasil.show({ container: area, progress: P(), session: Store.getSession(), onBack: renderHub, onMateri: openMateri });
  }

  // Portal Digital: lima kunci masuk satu per satu, portal terbuka, lalu Post-Test terbuka
  function showPortal() {
    show('play');
    const area = $('#play-area');
    area.innerHTML = '';
    Portal.show({
      container: area, progress: P(),
      onOpen: ({ durasi }) => {
        const p = P(), first = p.portal !== true;
        if (first) { p.portal = true; Store.setProgress(p); }
        Api.log({ aktivitas: 'portal_open', durasi, detail: first ? 'pertama' : 'ulang' });
      },
      onPost: isDone('POST') ? null : () => startStep('POST'),
      onBack: renderHub
    });
  }

  function openMateri() {
    if (Materi.status() !== 'ok') return;
    show('play');
    Materi.library({ container: $('#play-area') });
  }

  function startStep(id) {
    if (id === 'POST' && isDone('POST')) { showHasil(); return; }   // Post-Test hanya sekali; sesudahnya tampilkan hasil
    show('play');
    const area = $('#play-area');
    area.innerHTML = '';

    if (id === 'PORTAL') { showPortal(); return; }

    if (id === 'BRIEF') {
      Guide.briefing({ container: area, session: Store.getSession(), onDone: finishBrief });
      return;
    }

    if (id === 'PRE' || id === 'POST') {
      const items = id === 'PRE' ? PRETEST : (window.POSTTEST || []);
      if (!items.length) {
        area.innerHTML = '<p class="mb-0">Soal untuk tahap ini belum dimasukkan.</p>';
        return;
      }
      const pre = id === 'PRE';
      if (!pre) {   // tandai Post-Test sudah dimulai agar materi ditutup sampai selesai
        const pp = P();
        if (!pp.postStarted) { pp.postStarted = true; Store.setProgress(pp); }
      }
      Api.log({ aktivitas: 'room_start', room: id });
      Assessment.run({
        container: area, items, room: id,
        label: pre ? 'Pre-Test' : 'Post-Test',
        // Pre-Test dan Post-Test dibuat setara (tanpa hint/pembahasan) agar N-Gain adil
        hint: pre ? CONFIG.PRETEST_HINT === true : CONFIG.POSTTEST_HINT === true,
        feedback: pre ? CONFIG.PRETEST_FEEDBACK === true : CONFIG.POSTTEST_FEEDBACK === true,
        onDone: r => finishTest(id, r.score)
      });
      return;
    }

    const mod = RoomModules[id];
    if (!mod) {
      const r = ROOMS.find(x => x.id === id);
      area.innerHTML = `<h5>${r.icon} ${r.nama}</h5><p class="text-secondary mb-0">Room ini sedang dibangun.</p>`;
      return;
    }
    Api.log({ aktivitas: 'room_start', room: id });
    mod.start({ container: area, complete: score => completeRoom(id, score), exit: renderHub });
  }

  function finishBrief() {
    const p = P();
    p.brief = true;
    Store.setProgress(p);
    renderHub();
  }

  function finishTest(id, score) {
    const p = P();
    if (id === 'PRE') p.pre = score; else p.post = score;
    Store.setProgress(p);
    Api.log({ aktivitas: 'room_complete', room: id, skor_room: score });
    if (id === 'POST') {
      Api.log({
        aktivitas: 'session_complete',
        detail: JSON.stringify({ pre: p.pre, rooms: p.rooms, post: p.post })
      });
    }
    // Setelah Pre-Test, langsung lanjut ke Briefing (bila belum); setelah Post-Test, ke layar hasil akhir
    const next = id === 'POST' ? showHasil
      : (id === 'PRE' && !isDone('BRIEF')) ? () => startStep('BRIEF') : null;
    showResult(id === 'PRE' ? 'Pre-Test selesai' : 'Post-Test selesai', score, null, next, id === 'POST' ? 'Lihat Hasil Akhir' : null);
  }

  function completeRoom(id, score) {
    const p = P(), prev = p.rooms[id];
    p.rooms[id] = { score: prev ? Math.max(prev.score, score) : score };   // skor terbaik
    const first = !p.keys.includes(id);
    if (first) p.keys.push(id);
    Store.setProgress(p);

    const kunci = ROOMS.find(r => r.id === id).kunci;
    Api.log({ aktivitas: 'room_complete', room: id, skor_room: score });
    if (first) Api.log({ aktivitas: 'reward_unlocked', room: id, detail: kunci });
    // Setelah R5 (bila portal belum dibuka), langsung menuju Portal Digital
    const toPortal = id === 'R5' && !isDone('PORTAL');
    showResult(`${id} selesai`, score, first ? kunci : null, toPortal ? showPortal : null, toPortal ? 'Menuju Portal Digital' : null);
  }

  /* ---------- Login berdasarkan nama ---------- */
  let loginCtx = null;   // { kelas, password } dari langkah 1

  const makeSessionId = idSiswa =>
    `S-${idSiswa}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

  // Menggabungkan progres dari server (sheet Rekap) ke progres lokal:
  // yang sudah selesai di perangkat lain tidak perlu diulang. Mengembalikan true bila ada yang dipulihkan.
  function mergeServerProgress(p, sp) {
    if (!sp) return false;
    let changed = false;
    if (p.pre === null && sp.pre != null) { p.pre = sp.pre; changed = true; }
    if (p.post === null && sp.post != null) { p.post = sp.post; changed = true; }
    Object.keys(sp.rooms || {}).forEach(id => {
      const s = sp.rooms[id].score, cur = p.rooms[id];
      if (!cur || s > cur.score) { p.rooms[id] = { score: s }; changed = true; }
      if (!p.keys.includes(id)) { p.keys.push(id); changed = true; }
    });
    if (p.keys.length > 0 && p.brief !== true) { p.brief = true; changed = true; }   // sudah masuk room = sudah briefing
    return changed;
  }

  $('#kelas').innerHTML = CONFIG.KELAS.map(k => `<option>${k}</option>`).join('');

  function resetLoginForm() {
    loginCtx = null;
    $('#loginForm1').hidden = false;
    $('#loginForm2').hidden = true;
    $('#loginMsg').textContent = '';
  }

  // Langkah 1: cek password, ambil daftar nama kelas
  $('#loginForm1').addEventListener('submit', async e => {
    e.preventDefault();
    const password = $('#password').value;
    const kelas = $('#kelas').value;
    const msg = $('#loginMsg'), btn = $('#btnNext');

    if (!password.trim()) { msg.textContent = 'Masukkan password terlebih dahulu.'; return; }

    btn.disabled = true;
    msg.textContent = 'Memeriksa password...';
    try {
      const r = await Api.daftarSiswa(kelas, password);
      if (!r.ok) { msg.textContent = r.message || 'Gagal memuat daftar siswa.'; return; }
      if (!r.siswa.length) { msg.textContent = 'Daftar siswa kelas ini masih kosong. Hubungi gurumu.'; return; }

      loginCtx = { kelas, password };
      $('#kelasInfo').textContent = `Kelas ${kelas} • pilih namamu`;
      $('#nama').innerHTML = '<option value="">— Pilih namamu —</option>' +
        r.siswa.map(s => `<option value="${esc(s.id)}">${esc(s.nama)}</option>`).join('');
      $('#loginForm1').hidden = true;
      $('#loginForm2').hidden = false;
      msg.textContent = '';
    } catch (err) {
      console.error(err);
      msg.textContent = 'Gagal terhubung. Periksa koneksi lalu coba lagi.';
    } finally {
      btn.disabled = false;
    }
  });

  // Langkah 2: konfirmasi nama lalu masuk
  $('#loginForm2').addEventListener('submit', async e => {
    e.preventDefault();
    const idSiswa = $('#nama').value;
    const msg = $('#loginMsg'), btn = $('#btnLogin');

    if (!idSiswa) { msg.textContent = 'Pilih namamu dulu.'; return; }
    if (!loginCtx) { resetLoginForm(); return; }

    btn.disabled = true;
    msg.textContent = 'Masuk...';
    try {
      const { kelas, password } = loginCtx;
      const r = await Api.login(kelas, idSiswa, password);
      if (!r.ok) { msg.textContent = r.message || 'Gagal masuk.'; return; }

      // Siswa yang sama di perangkat yang sama -> lanjutkan progres lokal. Siswa lain -> progres baru.
      const owner = `${kelas}|${r.id_siswa}`;
      let p = Store.getProgress();
      const isNew = p.owner !== owner;
      if (isNew) p = Store.newProgress(owner, makeSessionId(r.id_siswa));

      // Pulihkan progres yang tersimpan di server (mis. dari perangkat atau browser lain)
      const dipulihkan = mergeServerProgress(p, r.progress);

      Store.setProgress(p);
      Store.setSession({ session_id: p.session_id, kelas, id_siswa: r.id_siswa, nomor_absen: r.nomor_absen, nama: r.nama });
      if (isNew) Api.log({ aktivitas: 'session_start', detail: dipulihkan ? 'progres_dipulihkan' : '' });

      $('#password').value = '';
      resetLoginForm();
      renderHub();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Gagal terhubung. Periksa koneksi lalu coba lagi.';
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- Event tombol ---------- */
  $('#btnStart').onclick = () => { resetLoginForm(); show('login'); };
  $('#btnGantiKelas').onclick = resetLoginForm;
  $('#btnBack').onclick = renderHub;
  $('#btnMateri').onclick = openMateri;
  $('#btnResultNext').onclick = () => {
    const next = resultNext;
    resultNext = null;
    (next || renderHub)();
  };
  $('#btnLogout').onclick = () => {
    if (!confirm('Keluar dari sesi ini? Progresmu tetap tersimpan.')) return;
    Api.flush();
    Store.clearSession();
    show('landing');
  };
  $('#steps').addEventListener('click', e => {
    const b = e.target.closest('button[data-step]');
    if (b && !b.disabled) startStep(b.dataset.step);
  });

  /* ---------- Init ---------- */
  Api.flush();
  if (Store.getSession()) renderHub(); else show('landing');
})();