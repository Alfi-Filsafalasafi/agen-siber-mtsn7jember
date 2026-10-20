const Api = (() => {
  const DEMO_KEY = 'as_demo_log';
  const DEMO_SISWA = [
    { id: 'DEMO-001', nama: 'Ahmad Fauzi' },
    { id: 'DEMO-002', nama: 'Bunga Lestari' },
    { id: 'DEMO-003', nama: 'Citra Maharani' },
    { id: 'DEMO-004', nama: 'Dimas Pratama' },
    { id: 'DEMO-005', nama: 'Eka Putri Ramadhani' }
  ];
  let flushing = false;

  const ts = () => {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  // ID unik per event; server memakainya untuk membuang kiriman ganda
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function demo(payload) {
    const passOk = String(payload.password || '').trim().toLowerCase() === CONFIG.DEMO_PASSWORD;

    if (payload.action === 'daftar') {
      if (!passOk) return Promise.resolve({ ok: false, message: 'Password salah.' });
      return Promise.resolve({ ok: true, siswa: DEMO_SISWA });
    }
    if (payload.action === 'login') {
      if (!passOk) return Promise.resolve({ ok: false, message: 'Password salah.' });
      const idx = DEMO_SISWA.findIndex(s => s.id === payload.id_siswa);
      if (idx < 0) return Promise.resolve({ ok: false, message: 'Nama tidak ditemukan di kelas ini.' });
      return Promise.resolve({ ok: true, nama: DEMO_SISWA[idx].nama, id_siswa: DEMO_SISWA[idx].id, nomor_absen: idx + 1, progress: null });
    }
    if (payload.action === 'log') {
      const old = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
      localStorage.setItem(DEMO_KEY, JSON.stringify(old.concat(payload.events)));
      return Promise.resolve({ ok: true, saved: payload.events.length });
    }
    return Promise.resolve({ ok: false });
  }

  async function post(payload) {
    if (CONFIG.DEMO || !CONFIG.API_URL) return demo(payload);
    // text/plain menghindari preflight CORS pada Apps Script
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  const daftarSiswa = (kelas, password) => post({ action: 'daftar', kelas, password });
  const login = (kelas, id_siswa, password) => post({ action: 'login', kelas, id_siswa, password });

  async function flush() {
    if (flushing) return;
    const q = Store.getQueue();
    if (!q.length) return;
    flushing = true;
    try {
      const r = await post({ action: 'log', events: q });
      if (r && r.ok) Store.dropQueue(q.length);
    } catch (e) {
      /* gagal kirim: event tetap di antrean, dicoba lagi nanti */
    } finally {
      flushing = false;
    }
  }

  function log(ev) {
    const s = Store.getSession() || {};
    Store.pushQueue({
      timestamp: ts(),
      session_id: s.session_id || '',
      kelas: s.kelas || '',
      nomor_absen: s.nomor_absen || '',
      nama: s.nama || '',
      room: '', item_id: '', jawaban: '', benar: '',
      hint: 0, attempt: 1, durasi: 0,
      skor_room: '', error_tag: '', detail: '',
      event_id: uid(),
      ...ev
    });
    flush();
  }

  window.addEventListener('online', flush);
  setInterval(flush, 15000);

  return { daftarSiswa, login, log, flush };
})();