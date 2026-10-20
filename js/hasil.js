// Layar hasil akhir (setelah Post-Test): gelar Agen, perbandingan Pre/Post, N-Gain,
// skor tiap ruangan, dan lencana. Semua dihitung di perangkat dari progres tersimpan.
//   Hasil.show({ container, progress, session, onBack, onMateri })
//   Hasil.hitung(progress)  -> objek ringkasan (dipakai juga untuk uji)
// KKTP dibaca dari CONFIG.KKTP bila ada (angka), jika tidak dipakai 75 (sama dengan sheet Pengaturan).
// Log: summary_view (detail = JSON pre, post, ngain, lencana).
const Hasil = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const prefersReducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const kktp = () => (typeof CONFIG !== 'undefined' && Number.isFinite(CONFIG.KKTP)) ? CONFIG.KKTP : 75;
  const f2 = v => v.toFixed(2).replace('.', ',');   // 0,62 (koma desimal)

  const BADGE_RUANG = {
    R1: { icon: '🧭', nama: 'Navigator Platform' },
    R2: { icon: '🪪', nama: 'Penjaga Privasi' },
    R3: { icon: '🔐', nama: 'Ahli Sandi' },
    R4: { icon: '📰', nama: 'Editor Cermat' },
    R5: { icon: '🛡️', nama: 'Pelindung Siber' }
  };

  // N-Gain = (post - pre) / (100 - pre). Tidak terdefinisi bila pre = 100.
  function kategori(v) {
    if (v >= 0.7) return { label: 'Tinggi', tone: 'ok' };
    if (v >= 0.3) return { label: 'Sedang', tone: 'warn' };
    return { label: 'Rendah', tone: 'low' };
  }

  function gelar(post) {
    const k = kktp();
    if (post === null) return { tier: 'pemula', icon: '🕵️', nama: 'Agen Pemula' };
    if (post >= 90) return { tier: 'elite', icon: '🏆', nama: 'Agen Elite' };
    if (post >= k) return { tier: 'andal', icon: '🎖️', nama: 'Agen Andal' };
    if (post >= 60) return { tier: 'siaga', icon: '🛡️', nama: 'Agen Siaga' };
    return { tier: 'pemula', icon: '🕵️', nama: 'Agen Pemula' };
  }

  function hitung(p) {
    const k = kktp();
    const pre = p.pre === undefined ? null : p.pre;
    const post = p.post === undefined ? null : p.post;
    const rooms = ROOMS.map(r => ({
      id: r.id, nama: r.nama, icon: r.icon,
      skor: p.rooms && p.rooms[r.id] ? p.rooms[r.id].score : null
    }));

    let ng = null, ngInfo = 'belum';
    if (pre !== null && post !== null) {
      if (pre >= 100) ngInfo = 'pre100';
      else { ng = (post - pre) / (100 - pre); ngInfo = 'ok'; }
    }

    const skorRoom = rooms.map(r => r.skor);
    const semuaRoom = skorRoom.every(s => s !== null);
    const badges = [
      ...rooms.map(r => ({
        id: 'ROOM_' + r.id, icon: BADGE_RUANG[r.id] ? BADGE_RUANG[r.id].icon : r.icon,
        nama: BADGE_RUANG[r.id] ? BADGE_RUANG[r.id].nama : r.nama,
        syarat: `Skor ${r.id} minimal ${k}`,
        earned: r.skor !== null && r.skor >= k
      })),
      { id: 'LIMA_KUNCI', icon: '🔑', nama: 'Pemegang 5 Kunci', syarat: 'Selesaikan R1 sampai R5', earned: semuaRoom },
      { id: 'KONSISTEN', icon: '🏅', nama: 'Agen Konsisten', syarat: `Semua ruangan minimal ${k}`, earned: semuaRoom && skorRoom.every(s => s >= k) },
      { id: 'LULUS_POST', icon: '🎯', nama: 'Tepat Sasaran', syarat: `Post-Test minimal ${k}`, earned: post !== null && post >= k },
      { id: 'NAIK_LEVEL', icon: '📈', nama: 'Naik Level', syarat: 'Skor Post-Test lebih tinggi dari Pre-Test', earned: pre !== null && post !== null && post > pre },
      { id: 'SEMPURNA', icon: '💯', nama: 'Skor Sempurna', syarat: 'Raih 100 di ruangan atau Post-Test', earned: skorRoom.concat([post]).some(s => s === 100) }
    ];

    return { pre, post, rooms, ngain: ng, ngInfo, badges, gelar: gelar(post), kktp: k };
  }

  /* ---------- Bagian tampilan ---------- */
  const bar = (cls, nilai, tandaKktp) => `
    <div class="hs-track" role="img" aria-label="${nilai === null ? 'Belum ada skor' : 'Skor ' + nilai + ' dari 100'}">
      <div class="hs-fill ${cls}" data-w="${nilai === null ? 0 : nilai}" style="width:0"></div>
      ${tandaKktp ? `<span class="hs-kktp" style="left:${tandaKktp}%" title="KKTP ${tandaKktp}"></span>` : ''}
    </div>`;

  function prePostHtml(h) {
    if (h.pre === null || h.post === null) {
      return '<p class="stimulus mb-0">Data Pre-Test atau Post-Test belum lengkap.</p>';
    }
    const d = h.post - h.pre;
    const chip = d > 0 ? `<span class="hs-chip up">▲ +${d} poin</span>`
      : d < 0 ? `<span class="hs-chip down">▼ ${d} poin</span>`
      : '<span class="hs-chip same">● Skor sama</span>';
    return `
      <div class="hs-row"><span class="hs-label">Pre-Test</span>${bar('pre', h.pre, h.kktp)}<b class="hs-val">${h.pre}</b></div>
      <div class="hs-row"><span class="hs-label">Post-Test</span>${bar('post', h.post, h.kktp)}<b class="hs-val">${h.post}</b></div>
      <div class="hs-delta">${chip}<span class="small text-secondary">Garis putus-putus = KKTP (${h.kktp})</span></div>`;
  }

  function ngainHtml(h) {
    if (h.ngInfo === 'belum') return '<p class="stimulus mb-0">N-Gain dihitung setelah Pre-Test dan Post-Test selesai.</p>';
    if (h.ngInfo === 'pre100') {
      return `<p class="stimulus mb-0">Skor Pre-Test-mu sudah <b>100</b>, jadi N-Gain tidak dapat dihitung (tidak ada ruang untuk naik). Kamu sudah menguasai materi ini sejak awal. Hebat!</p>`;
    }
    const v = h.ngain, kat = v < 0 ? { label: 'Rendah', tone: 'low' } : kategori(v);
    const pos = Math.max(0, Math.min(1, v)) * 100;
    const pesan = v >= 0.7 ? 'Peningkatan yang tinggi! Kamu menguasai banyak hal baru dari misi ini.'
      : v >= 0.3 ? 'Peningkatan yang sedang. Pemahamanmu bertambah dengan baik, terus pertahankan.'
      : v >= 0 ? 'Peningkatannya masih rendah. Buka Perpustakaan Materi dan baca lagi bagian yang masih terasa sulit.'
      : 'Skor Post-Test-mu lebih rendah dari Pre-Test. Tidak apa-apa, itu tanda ada bagian yang perlu kamu pelajari lagi. Baca ulang materinya, ya.';
    return `
      <div class="hs-ng-top">
        <div class="hs-ng-num ${kat.tone}">${f2(v)}</div>
        <div><span class="hs-pill ${kat.tone}">${kat.label}</span><div class="small text-secondary mt-1">N-Gain = (Post − Pre) ÷ (100 − Pre)</div></div>
      </div>
      <div class="hs-gauge" role="img" aria-label="N-Gain ${f2(v)}, kategori ${kat.label}">
        <div class="hs-zone low"></div><div class="hs-zone warn"></div><div class="hs-zone ok"></div>
        <span class="hs-marker" data-left="${pos}" style="left:0"></span>
      </div>
      <div class="hs-gauge-scale"><span>0</span><span>0,3</span><span>0,7</span><span>1</span></div>
      <p class="mb-0 mt-2 hs-msg">${esc(pesan)}</p>`;
  }

  function roomsHtml(h) {
    return h.rooms.map(r => {
      const ok = r.skor !== null && r.skor >= h.kktp;
      return `
        <div class="hs-row">
          <span class="hs-label hs-room"><span aria-hidden="true">${r.icon}</span> ${esc(r.id)}<small>${esc(r.nama)}</small></span>
          ${bar(ok ? 'room ok' : 'room', r.skor, h.kktp)}
          <b class="hs-val">${r.skor === null ? '–' : r.skor}${ok ? ' <span class="hs-tick" aria-label="Mencapai KKTP">✓</span>' : ''}</b>
        </div>`;
    }).join('');
  }

  function badgesHtml(h) {
    return `<div class="hs-badges">${h.badges.map((b, i) => `
      <div class="hs-badge ${b.earned ? 'on' : 'off'}" style="--i:${i}">
        <div class="hs-badge-ico" aria-hidden="true">${b.earned ? b.icon : '🔒'}</div>
        <div class="hs-badge-name">${esc(b.nama)}</div>
        <div class="hs-badge-req">${b.earned ? 'Diraih' : esc(b.syarat)}</div>
      </div>`).join('')}</div>`;
  }

  /* ---------- Tampil ---------- */
  function show({ container, progress, session, onBack, onMateri }) {
    const h = hitung(progress);
    const got = h.badges.filter(b => b.earned).length;
    const g = h.gelar;
    const nama = session && session.nama ? esc(session.nama) : 'Agen';
    const kelas = session && session.kelas ? ' • ' + esc(session.kelas) : '';

    const ringkas = [
      h.post !== null ? `Post-Test ${h.post}` : null,
      h.ngain !== null ? `N-Gain ${f2(h.ngain)}` : null,
      `${got}/${h.badges.length} lencana`
    ].filter(Boolean).join(' · ');

    container.innerHTML = `
      <div class="hs">
        <div class="hs-hero ${g.tier}">
          <div class="hs-hero-sub">Misi selesai! Gelar Agen</div>
          <div class="hs-hero-ico" aria-hidden="true">${g.icon}</div>
          <div class="hs-hero-title">${esc(g.nama)}</div>
          <div class="hs-hero-name">${nama}${kelas}</div>
          <div class="hs-hero-note">${esc(ringkas)}</div>
        </div>

        <section class="hs-card"><h6>📊 Pre-Test dan Post-Test</h6>${prePostHtml(h)}</section>
        <section class="hs-card"><h6>🚀 N-Gain (peningkatan belajar)</h6>${ngainHtml(h)}</section>
        <section class="hs-card"><h6>🗝️ Skor tiap ruangan</h6>${roomsHtml(h)}</section>
        <section class="hs-card"><h6>🎖️ Lencana Agen <span class="hs-count">${got}/${h.badges.length}</span></h6>${badgesHtml(h)}</section>

        <div class="d-grid gap-2 mt-3">
          ${onMateri ? '<button type="button" class="btn btn-outline-info" id="hsMateri">📚 Buka Perpustakaan Materi</button>' : ''}
          <button type="button" class="btn btn-info" id="hsBack">Kembali ke Markas</button>
        </div>
      </div>`;

    // isi batang dan penanda dengan animasi (tanpa animasi bila diminta sistem)
    const fill = () => {
      container.querySelectorAll('.hs-fill').forEach(n => { n.style.width = n.dataset.w + '%'; });
      container.querySelectorAll('.hs-marker').forEach(n => { n.style.left = n.dataset.left + '%'; });
    };
    if (prefersReducedMotion()) fill();
    else requestAnimationFrame(() => requestAnimationFrame(fill));

    const bk = container.querySelector('#hsBack');
    if (bk && onBack) bk.onclick = onBack;
    const mt = container.querySelector('#hsMateri');
    if (mt && onMateri) mt.onclick = onMateri;

    Api.log({
      aktivitas: 'summary_view',
      detail: JSON.stringify({
        pre: h.pre, post: h.post,
        ngain: h.ngain === null ? null : Math.round(h.ngain * 100) / 100,
        lencana: h.badges.filter(b => b.earned).map(b => b.id)
      })
    });
  }

  return { show, hitung };
})();