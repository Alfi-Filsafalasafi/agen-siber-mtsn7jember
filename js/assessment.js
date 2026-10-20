const Assessment = (() => {
  const LET = ['A', 'B', 'C', 'D', 'E'];
  const BUBBLE_SPEED = 70;   // kecepatan gelembung (px per detik); naikkan untuk lebih menantang

  const shuffle = a => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const prefersReducedMotion = () =>
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Gelembung melayang ---------- */
  // Menggerakkan tombol-tombol gelembung di dalam arena (memantul di dinding dan antar gelembung).
  // Gelembung terpilih (frozen) dan gelembung yang sedang disorot kursor (hold) berhenti.
  function createBubbleField(arena, btns) {
    const noop = { select() {}, hold() {}, stop() {} };
    if (prefersReducedMotion()) { arena.classList.add('static'); return noop; }

    const W0 = arena.clientWidth, H0 = arena.clientHeight;
    if (!W0 || !H0) { arena.classList.add('static'); return noop; }

    const D = W0 < 420 ? 96 : 112;   // diameter gelembung
    arena.style.setProperty('--d', D + 'px');

    const items = [];
    btns.forEach(el => {
      let x, y, tries = 0;
      do {
        x = Math.random() * Math.max(1, W0 - D);
        y = Math.random() * Math.max(1, H0 - D);
        tries++;
      } while (tries < 60 && items.some(o => Math.hypot(o.x - x, o.y - y) < D + 8));

      let ang;   // hindari arah nyaris lurus horizontal/vertikal
      do { ang = Math.random() * Math.PI * 2; }
      while (Math.abs(Math.cos(ang)) < 0.3 || Math.abs(Math.sin(ang)) < 0.3);

      const sp = BUBBLE_SPEED * (0.85 + Math.random() * 0.3);
      items.push({ el, x, y, sp, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, hold: false, frozen: false });
    });

    const place = () => items.forEach(o => {
      o.el.style.transform = `translate(${o.x.toFixed(1)}px, ${o.y.toFixed(1)}px)`;
    });
    place();

    const norm = o => {
      const s = Math.hypot(o.vx, o.vy) || 1;
      o.vx = (o.vx / s) * o.sp;
      o.vy = (o.vy / s) * o.sp;
    };

    let raf = null, last = performance.now();

    function tick(now) {
      if (!arena.isConnected) { raf = null; return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const W = arena.clientWidth, H = arena.clientHeight;

      // gerak + pantul di dinding
      items.forEach(o => {
        if (!o.hold && !o.frozen) { o.x += o.vx * dt; o.y += o.vy * dt; }
        if (o.x < 0) { o.x = 0; o.vx = Math.abs(o.vx); }
        else if (o.x > W - D) { o.x = Math.max(0, W - D); o.vx = -Math.abs(o.vx); }
        if (o.y < 0) { o.y = 0; o.vy = Math.abs(o.vy); }
        else if (o.y > H - D) { o.y = Math.max(0, H - D); o.vy = -Math.abs(o.vy); }
      });

      // tabrakan antar gelembung
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist >= D) continue;
          const nx = dx / dist, ny = dy / dist, overlap = D - dist;
          const aFix = a.hold || a.frozen, bFix = b.hold || b.frozen;
          if (aFix && bFix) continue;

          if (!aFix && !bFix) {
            a.x -= (nx * overlap) / 2; a.y -= (ny * overlap) / 2;
            b.x += (nx * overlap) / 2; b.y += (ny * overlap) / 2;
            const van = a.vx * nx + a.vy * ny, vbn = b.vx * nx + b.vy * ny;
            if (van - vbn > 0) {   // hanya bila saling mendekat
              a.vx += (vbn - van) * nx; a.vy += (vbn - van) * ny;
              b.vx += (van - vbn) * nx; b.vy += (van - vbn) * ny;
            }
            norm(a); norm(b);
          } else {
            const m = aFix ? b : a;
            const fx = aFix ? nx : -nx, fy = aFix ? ny : -ny;   // arah menjauhi gelembung yang diam
            m.x += fx * overlap; m.y += fy * overlap;
            const vn = m.vx * fx + m.vy * fy;
            if (vn < 0) { m.vx -= 2 * vn * fx; m.vy -= 2 * vn * fy; }
            norm(m);
          }
        }
      }

      place();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return {
      select(btn) { items.forEach(o => { o.frozen = (o.el === btn); }); },
      hold(btn, on) { const o = items.find(x => x.el === btn); if (o) o.hold = on; },
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
    };
  }

  /* ---------- Mesin soal ---------- */
  // Menjalankan daftar butir MCQ. Urutan opsi diacak setiap tampil;
  // yang dicatat di Log adalah huruf opsi ASLI (sesuai bank soal).
  // Alur: pilih opsi (boleh diganti) -> tekan tombol konfirmasi -> jawaban terkunci.
  //
  // Opsi tambahan:
  //  offset/grandTotal : bila daftar soal hanya sebagian dari satu room (mis. soal 6-10 dari 10)
  //  mode              : 'list' (tombol berderet, default) atau 'bubble' (gelembung melayang)
  //  topHtml           : HTML di atas soal (string, atau fungsi (item) => string)
  //  feedbackHtml      : HTML tambahan di pembahasan (string, atau fungsi (item, benar) => string)
  //  logView           : false bila event item_view sudah dicatat di luar
  //  nextLabel         : teks tombol setelah pembahasan (bukan soal terakhir)
  //  finishLabel       : teks tombol setelah pembahasan pada soal terakhir
  // onDone menerima { score, correct, total, results:[{id, ok, jawaban, durasi, hints}] }
  function run({
    container, items, room, label, hint = true, feedback = true,
    offset = 0, grandTotal = null, mode = 'list',
    topHtml = '', feedbackHtml = '', logView = true,
    nextLabel = 'Lanjut Soal Berikutnya', finishLabel = 'Selesai', onDone
  }) {
    let i = 0, correctCount = 0, field = null;
    const results = [];
    const total = items.length;
    const gt = grandTotal || total;
    const bubble = mode === 'bubble';

    const topOf = it => (typeof topHtml === 'function' ? topHtml(it) : topHtml) || '';
    const fbExtra = (it, ok) => (typeof feedbackHtml === 'function' ? feedbackHtml(it, ok) : feedbackHtml) || '';

    function render() {
      if (field) { field.stop(); field = null; }

      const it = items[i];
      const order = shuffle(it.options.map((_, k) => k));
      const isLast = offset + i + 1 === gt;
      let hints = 0, selected = null, changes = 0, locked = false;
      const t0 = Date.now();
      if (logView) Api.log({ aktivitas: 'item_view', room, item_id: it.id });

      const confirmLabel = feedback
        ? 'Yakin, Periksa Jawaban'
        : (isLast ? 'Yakin, Selesai' : 'Yakin, Lanjut Soal Berikutnya');

      const optsHtml = bubble
        ? `<p class="small text-secondary mb-0">Tangkap gelembung jawaban yang menurutmu paling tepat, lalu tekan tombol konfirmasi.</p>
           <div class="bubble-arena my-3" id="opts">
             ${order.map(k => `<button type="button" class="bubble" data-k="${k}" aria-pressed="false"><span>${esc(it.options[k])}</span></button>`).join('')}
           </div>`
        : `<div class="d-grid gap-2 my-3" id="opts">
             ${order.map((k, pos) => `<button type="button" class="btn btn-option" data-k="${k}" aria-pressed="false"><b>${LET[pos]}.</b> ${esc(it.options[k])}</button>`).join('')}
           </div>`;

      container.innerHTML = `
        <div class="d-flex justify-content-between small text-secondary mb-1">
          <span>${esc(label || room)}</span><span>Soal ${offset + i + 1}/${gt}</span>
        </div>
        <div class="progress mb-3" style="height:8px"><div class="progress-bar" style="width:${((offset + i) / gt) * 100}%"></div></div>
        ${topOf(it)}
        ${it.stimulus ? `<p class="stimulus">${esc(it.stimulus)}</p>` : ''}
        <h5>${esc(it.question)}</h5>
        ${optsHtml}
        ${hint ? '<button type="button" class="btn btn-sm btn-outline-info" id="btnHint">💡 Petunjuk</button>' : ''}
        <div class="alert alert-info mt-2 mb-0" id="hintBox" hidden></div>
        <button type="button" class="btn btn-info w-100 mt-3" id="btnConfirm" disabled>${confirmLabel}</button>
        <div id="fb" class="mt-3" hidden></div>`;

      const btns = container.querySelectorAll('#opts button');
      const confirmBtn = container.querySelector('#btnConfirm');

      if (bubble) field = createBubbleField(container.querySelector('#opts'), [...btns]);

      if (hint) {
        container.querySelector('#btnHint').onclick = () => {
          hints++;
          const box = container.querySelector('#hintBox');
          box.textContent = it.hint;
          box.hidden = false;
          Api.log({ aktivitas: 'hint_used', room, item_id: it.id, hint: hints });
        };
      }

      // Memilih opsi (belum dikunci), boleh diganti
      function choose(btn) {
        if (locked) return;
        const k = +btn.dataset.k;
        if (selected === k) return;
        if (selected !== null) changes++;
        selected = k;
        btns.forEach(b => {
          const on = b === btn;
          b.classList.toggle('selected', on);
          b.setAttribute('aria-pressed', on);
        });
        confirmBtn.disabled = false;
        if (field) field.select(btn);
      }

      btns.forEach(btn => {
        if (bubble) {
          // pointerdown: gelembung bergerak, jadi dipilih saat disentuh (bukan saat dilepas)
          btn.addEventListener('pointerdown', () => choose(btn));
          btn.addEventListener('click', e => { if (e.detail === 0) choose(btn); });   // aktivasi keyboard
          btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && field) field.hold(btn, true); });
          btn.addEventListener('pointerleave', () => { if (field) field.hold(btn, false); });
        } else {
          btn.onclick = () => choose(btn);
        }
      });

      // Tombol konfirmasi = jawaban dikunci dan dicatat
      confirmBtn.onclick = () => {
        if (locked || selected === null) return;
        locked = true;
        if (field) field.stop();

        const k = selected;
        const ok = k === it.key;
        const dur = Math.round((Date.now() - t0) / 1000);
        if (ok) correctCount++;
        results.push({ id: it.id, ok, jawaban: LET[k], durasi: dur, hints });

        Api.log({
          aktivitas: 'item_answer', room, item_id: it.id,
          jawaban: LET[k], benar: ok, hint: hints, attempt: 1, durasi: dur,
          error_tag: ok ? '' : ((it.tags && it.tags[k]) || ''),
          detail: changes ? `ganti:${changes}` : ''
        });

        btns.forEach(b => { b.disabled = true; b.classList.remove('selected'); });
        confirmBtn.hidden = true;
        const hintBtn = container.querySelector('#btnHint');
        if (hintBtn) hintBtn.hidden = true;

        // Tanpa pembahasan (mis. Pre-Test): langsung ke soal berikutnya,
        // kunci jawaban tidak ditampilkan
        if (!feedback) { next(); return; }

        btns.forEach(b => {
          const bk = +b.dataset.k;
          if (bk === it.key) b.classList.add('correct');
          else if (bk === k) b.classList.add('wrong');
        });

        const fb = container.querySelector('#fb');
        fb.hidden = false;
        fb.innerHTML = `
          <div class="feedback ${ok ? 'ok' : 'bad'}">
            <b>${ok ? 'Benar!' : 'Belum tepat.'}</b> ${esc(it.explanation)}
          </div>
          ${fbExtra(it, ok)}
          <button type="button" class="btn btn-info w-100 mt-3" id="btnNext">${esc(isLast ? finishLabel : nextLabel)}</button>`;
        fb.querySelector('#btnNext').onclick = next;
      };
    }

    function next() {
      if (field) { field.stop(); field = null; }
      i++;
      if (i < total) return render();
      onDone({ score: Math.round((correctCount / total) * 100), correct: correctCount, total, results });
    }

    render();
  }

  return { run };
})();