// Materi pengantar: kartu geser (briefing sebelum room + perpustakaan di hub).
// Data kartu ada di MATERI (js/materi-data.js). Setiap kartu memuat satu ide.
// Log: materi_view (per kartu: item_id = R3-M2, durasi detik, detail = mode;
//      ringkasan: item_id = R3-M, detail = mode:selesai | mode:lewati:2/4 | mode:keluar:2/4),
//      materi_video (saat video diputar; item_id = R3-V).
// Video (opsional per room): video.posisi = 'awal' (kartu pembuka, default) | 'akhir' (di kartu terakhir).
//      Kartu video pembuka dicatat sebagai materi_view dengan item_id = R3-V.
const Materi = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // **tebal** diubah menjadi <b>, sisanya di-escape
  const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  const validVideo = v => !!(v && typeof v.id === 'string' && /^[\w-]{11}$/.test(v.id));
  const dataOf = room => (typeof MATERI !== 'undefined' && MATERI[room]) || null;
  const cardsOf = room => (dataOf(room) && dataOf(room).kartu) || [];
  // Daftar kartu untuk tampilan: kartu video pembuka (bila posisi 'awal') + kartu teks.
  const videoAwal = room => { const v = dataOf(room) && dataOf(room).video; return !!(validVideo(v) && v.posisi !== 'akhir'); };
  const deckOf = room => {
    const t = cardsOf(room).map((c, k) => ({ c, id: `${room}-M${k + 1}` }));
    return videoAwal(room) ? [{ video: true, id: `${room}-V` }].concat(t) : t;
  };
  const roomMeta = room => (typeof ROOMS !== 'undefined' && ROOMS.find(r => r.id === room)) || { id: room, nama: room, icon: '📚' };

  // 'ok' | 'belum_pre' | 'post_berjalan'
  function status() {
    if (typeof CONFIG !== 'undefined' && CONFIG.DEV_UNLOCK_ALL === true) return 'ok';
    const p = Store.getProgress();
    if (p.pre === null) return 'belum_pre';
    if (p.post === null && p.postStarted) return 'post_berjalan';
    return 'ok';
  }

  let active = null;   // deck yang sedang tampil (untuk close())

  /* ---------- Isi kartu ---------- */
  function cardHtml(c) {
    const out = [`<div class="mt-icon" aria-hidden="true">${c.icon || '📘'}</div>`, `<h5 class="mt-title">${esc(c.judul)}</h5>`];

    if (c.isi) out.push(`<p class="mt-text">${fmt(c.isi)}</p>`);

    if (c.level) {
      out.push(`<div class="mt-levels">${c.level.map(l => `
        <div class="mt-level ${esc(l.tone || '')}">
          <span class="mt-level-ico" aria-hidden="true">${l.ikon}</span>
          <span><b>${esc(l.label)}</b><br>${fmt(l.teks)}</span>
        </div>`).join('')}</div>`);
    }

    if (c.banding) {
      const col = (b, cls) => `<div class="mt-col ${cls}"><div class="mt-col-title">${esc(b.judul)}</div><ul>${b.poin.map(p => `<li>${fmt(p)}</li>`).join('')}</ul></div>`;
      out.push(`<div class="mt-compare">${col(c.banding.kiri, 'bad')}${col(c.banding.kanan, 'ok')}</div>`);
    }

    if (c.poin) {
      const tag = c.urut ? 'ol' : 'ul';
      out.push(`<${tag} class="mt-list ${c.urut ? 'num' : ''}">${c.poin.map(p => `<li>${fmt(p)}</li>`).join('')}</${tag}>`);
    }

    if (c.catatan) out.push(`<p class="mt-note">${fmt(c.catatan)}</p>`);
    if (c.contoh) out.push(`<div class="mt-example"><span class="mt-ex-tag">Contoh</span> ${fmt(c.contoh)}</div>`);
    return out.join('');
  }

  /* ---------- Video YouTube (opsional, dimuat hanya saat diketuk) ---------- */
  function videoHtml(v, opener) {
    if (!validVideo(v)) return '';
    return `
      <div class="mt-video">
        <div class="mt-video-head">🎬 ${opener ? 'Video singkat' : 'Video pendukung'} <span>(opsional${v.durasi ? ' • ' + esc(v.durasi) : ''})</span></div>
        <button type="button" class="mt-video-thumb" id="mtVideoBtn" aria-label="Putar video: ${esc(v.judul || '')}">
          <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy">
          <span class="mt-play" aria-hidden="true">▶</span>
        </button>
        <div class="mt-video-cap">${esc(v.judul || '')}${v.kanal ? ' · ' + esc(v.kanal) : ''}</div>
        <div class="mt-video-cap">Memutar video memakai kuota internet.</div>
      </div>`;
  }

  // Kartu pembuka berisi video; teks di kartu berikutnya tetap bisa dibaca tanpa menonton.
  function videoCard(v) {
    return `<div class="mt-icon" aria-hidden="true">🎬</div>
      <h5 class="mt-title">Tonton dulu (opsional)</h5>
      <p class="mt-text">Video singkat sebagai gambaran awal. Kalau tidak sempat atau kuota terbatas, lewati saja: semua isinya ada di kartu berikutnya.</p>
      ${videoHtml(v, true)}
      <button type="button" class="btn btn-outline-secondary btn-sm w-100 mt-2" id="mtVideoSkip">Lewati video, langsung baca →</button>`;
  }

  /* ---------- Deck kartu ---------- */
  // mode: 'briefing' (ada tombol Lewati) | 'library'
  function deck({ container, room, mode, onDone }) {
    const list = deckOf(room), n = list.length, meta = roomMeta(room), video = dataOf(room).video;
    const briefing = mode === 'briefing';
    let i = 0, dir = 'next', t0 = Date.now(), finished = false, root = null, touch = null;
    const seen = new Set([0]);
    const tStart = Date.now();

    const sec = () => Math.min(300, Math.round((Date.now() - t0) / 1000));
    const logCard = () => Api.log({ aktivitas: 'materi_view', room, item_id: list[i].id, durasi: sec(), detail: mode });
    const logSummary = how => Api.log({
      aktivitas: 'materi_view', room, item_id: `${room}-M`,
      durasi: Math.min(1800, Math.round((Date.now() - tStart) / 1000)),
      detail: `${mode}:${how}`
    });

    function cleanup() {
      document.removeEventListener('keydown', onKey);
      if (active === handle) active = null;
    }

    function finish(how) {   // 'selesai' | 'lewati'
      if (finished) return;
      finished = true;
      logCard();
      logSummary(how === 'selesai' ? 'selesai' : `lewati:${seen.size}/${n}`);
      cleanup();
      onDone(how);
    }

    const handle = {
      // dipanggil saat siswa meninggalkan materi lewat tombol lain (mis. Kembali ke markas)
      abort() {
        if (finished) return;
        finished = true;
        logCard();
        logSummary(`keluar:${seen.size}/${n}`);
        cleanup();
      }
    };
    active = handle;

    function go(k) {
      if (k < 0 || k >= n || k === i) return;
      logCard();
      dir = k > i ? 'next' : 'prev';
      i = k; t0 = Date.now(); seen.add(i);
      render();
    }

    function onKey(e) {
      if (finished || !root || !document.contains(root) || root.offsetParent === null) return;
      if (e.key === 'ArrowRight') go(i + 1);
      else if (e.key === 'ArrowLeft') go(i - 1);
    }
    document.addEventListener('keydown', onKey);

    function render() {
      const last = i === n - 1;
      const lastLabel = briefing ? 'Lanjut ke Misi →' : 'Selesai Membaca';
      container.innerHTML = `
        <div class="mt-deck">
          <div class="mt-top">
            <span class="mt-label">${briefing ? '📚 Briefing Agen' : '📚 Materi'} · ${esc(meta.id)} ${esc(meta.nama)}</span>
            <span class="mt-count">Kartu ${i + 1}/${n}</span>
          </div>
          <div class="mt-dots">
            ${list.map((_, k) => `<button type="button" class="mt-dot ${k === i ? 'on' : seen.has(k) ? 'seen' : ''}" data-k="${k}" aria-label="Kartu ${k + 1}" ${k === i ? 'aria-current="true"' : ''}></button>`).join('')}
          </div>
          <div class="mt-card ${dir === 'next' ? 'in-next' : 'in-prev'}" aria-live="polite">${list[i].video ? videoCard(video) : cardHtml(list[i].c)}</div>
          ${!list[i].video && last && !videoAwal(room) ? videoHtml(video) : ''}
          <div class="mt-nav">
            <button type="button" class="btn btn-outline-info" id="mtPrev" ${i === 0 ? 'disabled' : ''}>← Sebelumnya</button>
            <button type="button" class="btn btn-info" id="mtNext">${last ? lastLabel : 'Lanjut →'}</button>
          </div>
          ${briefing ? '<button type="button" class="btn btn-link btn-sm w-100 mt-2" id="mtSkip">Lewati materi</button>' : ''}
        </div>`;

      root = container.querySelector('.mt-deck');
      const vs = root.querySelector('#mtVideoSkip');
      if (vs) vs.onclick = () => go(i + 1);
      root.querySelector('#mtPrev').onclick = () => go(i - 1);
      root.querySelector('#mtNext').onclick = () => (last ? finish('selesai') : go(i + 1));
      const skip = root.querySelector('#mtSkip');
      if (skip) skip.onclick = () => finish('lewati');
      root.querySelectorAll('.mt-dot').forEach(b => { b.onclick = () => go(+b.dataset.k); });

      const vb = root.querySelector('#mtVideoBtn');
      if (vb) {
        vb.onclick = () => {
          vb.outerHTML = `<div class="mt-video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1"
            title="${esc(video.judul || 'Video materi')}" loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
          Api.log({ aktivitas: 'materi_video', room, item_id: `${room}-V`, detail: video.id });
        };
      }

      // geser kiri/kanan di layar sentuh
      root.addEventListener('touchstart', e => {
        const t = e.changedTouches[0];
        touch = { x: t.clientX, y: t.clientY };
      }, { passive: true });
      root.addEventListener('touchend', e => {
        if (!touch) return;
        const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
        touch = null;
        if (Math.abs(dx) < 60 || Math.abs(dy) > 50) return;
        go(dx < 0 ? i + 1 : i - 1);
      }, { passive: true });
    }

    render();
  }

  /* ---------- API publik ---------- */

  // Dipanggil di awal tiap room: tampilkan kartu, lalu onDone (intro room).
  // Dilewati bila room belum punya materi, atau Post-Test sedang berjalan.
  function briefing({ container, room, onDone }) {
    if (!cardsOf(room).length || status() === 'post_berjalan') return onDone('tanpa');
    close();
    deck({ container, room, mode: 'briefing', onDone });
  }

  // Perpustakaan di hub: pilih room, lalu baca kartunya.
  function library({ container }) {
    close();
    const rooms = (typeof ROOMS !== 'undefined' ? ROOMS : []).filter(r => cardsOf(r.id).length);

    function menu() {
      container.innerHTML = `
        <h5>📚 Perpustakaan Materi</h5>
        <p class="stimulus">Pilih topik yang ingin kamu baca. Cocok kalau ada bagian yang belum sempat dijelaskan di kelas.</p>
        <div class="d-grid gap-2">
          ${rooms.map(r => `
            <button type="button" class="btn btn-option mt-room" data-r="${r.id}">
              <span class="mt-room-ico" aria-hidden="true">${r.icon}</span>
              <span><b>${esc(r.id)} · ${esc(r.nama)}</b><br><small>${cardsOf(r.id).length} kartu${validVideo(dataOf(r.id).video) ? ' + video' : ''}</small></span>
            </button>`).join('')}
        </div>`;
      container.querySelectorAll('.mt-room').forEach(b => {
        b.onclick = () => deck({ container, room: b.dataset.r, mode: 'library', onDone: menu });
      });
    }
    menu();
  }

  // Menghentikan deck yang sedang aktif tanpa memanggil onDone (mencatat kartu terakhir ke log)
  function close() { if (active) active.abort(); }

  return { briefing, library, close, status };
})();