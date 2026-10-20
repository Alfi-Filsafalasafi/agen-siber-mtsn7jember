const Store = (() => {
  const K = { session: 'as_session', progress: 'as_progress', queue: 'as_queue' };

  const read = (k, d) => {
    try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; }
    catch (e) { return d; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const newProgress = (owner, session_id) => ({
    owner, session_id, pre: null, post: null, rooms: {}, keys: []
  });

  return {
    newProgress,
    getSession: () => read(K.session, null),
    setSession: s => write(K.session, s),
    clearSession: () => localStorage.removeItem(K.session),

    getProgress: () => read(K.progress, newProgress('', '')),
    setProgress: p => write(K.progress, p),

    getQueue: () => read(K.queue, []),
    pushQueue(ev) { const q = read(K.queue, []); q.push(ev); write(K.queue, q); },
    dropQueue(n) { write(K.queue, read(K.queue, []).slice(n)); }
  };
})();