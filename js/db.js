// =============================================
// DB LAYER - In-memory cache + sessionStorage + Supabase sync
// =============================================

const _cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// Load semua cache dari sessionStorage saat pertama kali
(function _restoreCache() {
  try {
    const saved = sessionStorage.getItem('__db_cache');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Handle format lama (array langsung) vs format baru {data, ts}
      Object.entries(parsed).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          _cache[k] = { data: v, ts: 0 }; // force refetch
        } else if (v && Array.isArray(v.data)) {
          _cache[k] = v;
        }
      });
    }
  } catch(e) { sessionStorage.removeItem('__db_cache'); }
})();

function _persistCache() {
  try { sessionStorage.setItem('__db_cache', JSON.stringify(_cache)); } catch(e) {}
}

const DB = {
  // Ambil dari cache (sync, tanpa await)
  get: function(table) {
    return _cache[table]?.data || [];
  },

  // Set cache langsung (sync)
  set: function(table, data) {
    _cache[table] = { data, ts: Date.now() };
    _persistCache();
  },

  // Cek apakah cache masih fresh
  isFresh: function(table) {
    const entry = _cache[table];
    return entry && Array.isArray(entry.data) && (Date.now() - entry.ts < CACHE_TTL);
  },

  // Fetch dari Supabase, simpan ke cache, return data
  sync: async function(table, { force = false } = {}) {
    if (!force && DB.isFresh(table)) return DB.get(table);
    const { data, error } = await supa.from(table).select('*').order('created_at', { ascending: false });
    if (error) { console.warn('DB.sync error:', table, error.message); return DB.get(table); }
    DB.set(table, data || []);
    return DB.get(table);
  },

  // Sync di background tanpa await — render dulu dari cache
  syncBackground: function(table, onDone) {
    if (DB.isFresh(table)) { onDone?.(); return; }
    supa.from(table).select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) {
        DB.set(table, data);
        onDone?.();
      }
    });
  },

  // INSERT ke Supabase — optimistic update
  insert: async function(table, payload) {
    const clean = { ...payload };
    if (!clean.id || clean.id === '') delete clean.id;
    delete clean.created_at;
    delete clean.updated_at;
    const { data, error } = await supa.from(table).insert(clean).select().single();
    if (error) { console.error('DB.insert error:', table, error.message); return null; }
    const list = DB.get(table);
    list.unshift(data);
    DB.set(table, list);
    return data;
  },

  // UPDATE ke Supabase — optimistic update
  update: async function(table, id, payload) {
    const clean = { ...payload };
    delete clean.id;
    delete clean.created_at;
    clean.updated_at = new Date().toISOString();
    // Optimistic: update cache dulu
    const list = DB.get(table);
    const idx = list.findIndex(x => x.id === id);
    const prev = idx !== -1 ? { ...list[idx] } : null;
    if (idx !== -1) { list[idx] = { ...list[idx], ...clean, id }; DB.set(table, list); }
    const { data, error } = await supa.from(table).update(clean).eq('id', id).select().single();
    if (error) {
      // Rollback
      if (prev && idx !== -1) { list[idx] = prev; DB.set(table, list); }
      console.error('DB.update error:', table, error.message); return null;
    }
    if (idx !== -1) { list[idx] = data; DB.set(table, list); }
    return data;
  },

  // DELETE dari Supabase — optimistic delete
  delete: async function(table, id) {
    const list = DB.get(table);
    const prev = list.find(x => x.id === id);
    DB.set(table, list.filter(x => x.id !== id)); // optimistic
    const { error } = await supa.from(table).delete().eq('id', id);
    if (error) {
      // Rollback
      if (prev) { list.push(prev); DB.set(table, list); }
      console.error('DB.delete error:', table, error.message); return false;
    }
    return true;
  },

  // UPSERT
  upsert: async function(table, payload) {
    const { data, error } = await supa.from(table).upsert(payload).select().single();
    if (error) { console.error('DB.upsert error:', table, error.message); return null; }
    return data;
  },

  // Invalidate cache (paksa refetch berikutnya)
  invalidate: function(table) {
    if (_cache[table]) { _cache[table].ts = 0; _persistCache(); }
  }
};

function uid() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }

// Debounce helper
function debounce(fn, ms = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
