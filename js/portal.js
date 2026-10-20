// Portal Digital: momen setelah R5. Lima kunci masuk ke portal satu per satu, portal terbuka,
// lalu Post-Test dibuka. Murni tampilan; status "portal terbuka" disimpan oleh game.js lewat onOpen.
//   Portal.show({ container, progress, onOpen, onPost, onBack })
//     progress : progres siswa (dipakai: progress.keys = kunci yang sudah dimiliki)
//     onOpen   : dipanggil saat portal terbuka, dengan { durasi } (detik sejak layar dibuka).
//                Dipanggil setiap kali terbuka (pertama maupun lihat ulang); game.js yang membedakan.
//     onPost   : bila ada, tampil tombol "Mulai Post-Test"
//     onBack   : kembali ke Markas
//   Portal.stop() menghentikan animasi yang sedang berjalan (dipanggil saat siswa pindah layar).
const Portal = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const STEP_MS = 950;   // jeda antar kunci

  let token = 0;
  const stop = () => { token++; };

  // posisi lubang kunci: lima titik melingkar, mulai dari atas
  const pos = i => {
    const a = (-90 + i * 72) * Math.PI / 180;
    return { x: 150 + 100 * Math.cos(a), y: 150 + 100 * Math.sin(a) };
  };

  function svgHtml(rooms) {
    const slots = rooms.map((r, i) => {
      const { x, y } = pos(i);
      return `
        <line class="pt-line" data-i="${i}" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="150" y2="150"/>
        <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
          <g class="pt-slot" data-i="${i}">
            <circle class="pt-slot-bg" r="25"/>
            <text class="pt-slot-key" y="2" text-anchor="middle" font-size="19">🔑</text>
            <text class="pt-slot-id" y="17" text-anchor="middle" font-size="9">${esc(r.id)}</text>
          </g>
        </g>`;
    }).join('');
    return `
      <svg class="pt-svg" viewBox="0 0 300 310" role="img" aria-label="Portal Digital dengan lima lubang kunci">
        <defs>
          <radialGradient id="ptCoreGrad">
            <stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#7dd3fc"/><stop offset="1" stop-color="#2563eb"/>
          </radialGradient>
        </defs>
        <circle class="pt-halo" cx="150" cy="150" r="146"/>
        <g class="pt-spin"><circle class="pt-ring" cx="150" cy="150" r="132"/></g>
        ${slots}
        <circle class="pt-core" cx="150" cy="150" r="58" fill="url(#ptCoreGrad)"/>
      </svg>`;
  }

  function show({ container, progress, onOpen, onPost, onBack }) {
    const my = ++token;
    const alive = () => my === token && container.isConnected;
    const fast = reduced();
    const t0 = Date.now();
    const rooms = ROOMS;
    const n = rooms.length;
    const have = new Set((progress && progress.keys) || []);
    const missing = rooms.filter(r => !have.has(r.id));
    const complete = missing.length === 0;
    let inserted = 0, opened = false;

    container.innerHTML = `
      <div class="pt">
        <h5 class="pt-title">🌀 Portal Digital</h5>
        <div class="pt-stage" id="ptStage">
          ${svgHtml(rooms)}
          <div class="pt-status" id="ptStatus" aria-live="polite">Portal mendeteksi kunci milikmu...</div>
        </div>
        <div class="pt-keys" id="ptKeys">
          ${rooms.map((r, i) => `<span class="pt-key" data-i="${i}"><span aria-hidden="true">${r.icon}</span> ${esc(r.kunci)}</span>`).join('')}
        </div>
        <div class="pt-open" id="ptOpen" hidden>
          <div class="pt-open-title">PORTAL TERBUKA</div>
          <p class="stimulus">Kelima kunci sudah terpasang. Kamu sudah melewati semua ruangan: memilih platform, menjaga privasi, mengamankan akun, memeriksa informasi, dan menghadapi ancaman digital. Satu tantangan terakhir menunggu di balik portal: <b>Post-Test</b>.</p>
          ${onPost ? '<p class="small text-secondary">Post-Test hanya bisa dikerjakan satu kali dan tanpa petunjuk, jadi kerjakan dengan tenang dan jujur.</p>' : ''}
          <div class="d-grid gap-2">
            ${onPost ? '<button type="button" class="btn btn-info" id="ptPost">Mulai Post-Test</button>' : ''}
            <button type="button" class="btn ${onPost ? 'btn-outline-info' : 'btn-info'}" id="ptBack">${onPost ? 'Nanti, kembali ke Markas' : 'Kembali ke Markas'}</button>
          </div>
        </div>
        <div class="pt-open" id="ptLack" hidden>
          <div class="pt-open-title">PORTAL BELUM BISA DIBUKA</div>
          <p class="stimulus">Masih ada kunci yang belum kamu dapatkan: <b>${esc(missing.map(r => r.kunci).join(', '))}</b>. Selesaikan ruangannya dulu, lalu kembali ke sini.</p>
          <button type="button" class="btn btn-info w-100" id="ptBack2">Kembali ke Markas</button>
        </div>
        <button type="button" class="btn btn-link btn-sm w-100 mt-2" id="ptSkip">Lewati animasi</button>
      </div>`;

    const $ = s => container.querySelector(s);
    const stage = $('#ptStage'), status = $('#ptStatus'), core = $('.pt-core');

    function insert(i) {
      if (i < inserted) return;
      inserted = i + 1;
      container.querySelectorAll(`[data-i="${i}"]`).forEach(el => el.classList.add('on'));
      const k = rooms.slice(0, inserted).filter(r => have.has(r.id)).length;
      core.style.transform = `scale(${(0.3 + 0.7 * k / n).toFixed(2)})`;
      core.style.opacity = (0.35 + 0.65 * k / n).toFixed(2);
      status.textContent = `🔑 ${rooms[i].kunci} terpasang (${k}/${n})`;
    }

    // kunci yang tidak dimiliki dilewati (tetap kosong)
    const insertOwned = () => rooms.forEach((r, i) => { if (have.has(r.id)) insert(i); });

    function finish() {
      if (opened) return;
      opened = true;
      $('#ptSkip').hidden = true;
      insertOwned();
      if (!complete) {
        status.textContent = `Kunci terpasang ${n - missing.length}/${n}`;
        $('#ptLack').hidden = false;
        return;
      }
      stage.classList.add('open');
      core.style.transform = '';
      core.style.opacity = '';
      status.textContent = '✨ Portal Digital terbuka!';
      $('#ptOpen').hidden = false;
      if (onOpen) onOpen({ durasi: Math.round((Date.now() - t0) / 1000) });
      if (!fast && $('#ptOpen').scrollIntoView) $('#ptOpen').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async function run() {
      await wait(fast ? 0 : 700);
      for (let i = 0; i < n; i++) {
        if (!alive() || opened) return;
        if (have.has(rooms[i].id)) { insert(i); await wait(fast ? 0 : STEP_MS); }
      }
      if (!alive() || opened) return;
      await wait(fast ? 0 : 500);
      if (alive()) finish();
    }

    $('#ptSkip').onclick = () => { if (alive()) finish(); };
    ['#ptBack', '#ptBack2'].forEach(s => { const b = $(s); if (b && onBack) b.onclick = onBack; });
    const ps = $('#ptPost'); if (ps && onPost) ps.onclick = onPost;
    run();
  }

  return { show, stop };
})();
