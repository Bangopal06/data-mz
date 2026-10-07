// =============================================
// DB LAYER - Supabase wrapper
// Menggantikan localStorage dengan Supabase
// =============================================

const DB = {
  // GET semua data dari tabel
  get: async function(table) {
    const { data, error } = await sb.from(table).select('*').order('created_at', { ascending: false });
    if (error) { console.error('DB.get error:', table, error.message); return []; }
    return data || [];
  },

  // GET dengan filter
  getWhere: async function(table, filters = {}) {
    let q = sb.from(table).select('*').order('created_at', { ascending: false });
    for (const [col, val] of Object.entries(filters)) {
      q = q.eq(col, val);
    }
    const { data, error } = await q;
    if (error) { console.error('DB.getWhere error:', error.message); return []; }
    return data || [];
  },

  // INSERT
  insert: async function(table, payload) {
    // Hapus id jika UUID kosong, biarkan Supabase generate
    const clean = { ...payload };
    if (!clean.id || clean.id === '') delete clean.id;
    delete clean.created_at;
    delete clean.updated_at;
    const { data, error } = await sb.from(table).insert(clean).select().single();
    if (error) { console.error('DB.insert error:', table, error.message); return null; }
    return data;
  },

  // UPDATE
  update: async function(table, id, payload) {
    const clean = { ...payload };
    delete clean.id;
    delete clean.created_at;
    clean.updated_at = new Date().toISOString();
    const { data, error } = await sb.from(table).update(clean).eq('id', id).select().single();
    if (error) { console.error('DB.update error:', table, error.message); return null; }
    return data;
  },

  // DELETE
  delete: async function(table, id) {
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) { console.error('DB.delete error:', table, error.message); return false; }
    return true;
  },

  // UPSERT (insert or update)
  upsert: async function(table, payload) {
    const { data, error } = await sb.from(table).upsert(payload).select().single();
    if (error) { console.error('DB.upsert error:', table, error.message); return null; }
    return data;
  }
};

// Helper uid (masih dipakai di beberapa tempat)
function uid() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
