// =============================================
// SHARED UTILITIES - Supabase version
// =============================================

// ---- DATA STORAGE — Supabase + localStorage cache ----
const DB = {
  // Baca dari cache lokal (sync)
  get: (table) => {
    try {
      return JSON.parse(localStorage.getItem('sb_' + table) || '[]');
    } catch { return []; }
  },
  // Tulis ke cache lokal + Supabase (async background)
  set: (table, arr) => {
    localStorage.setItem('sb_' + table, JSON.stringify(arr));
    // Tidak perlu sync manual — tiap operasi langsung ke Supabase
  },
  // Fetch dari Supabase dan update cache
  sync: async (table) => {
    if (!window.supa) return DB.get(table);
    try {
      const { data } = await supa.from(table).select('*').order('created_at', { ascending: false });
      const d = data || [];
      localStorage.setItem('sb_' + table, JSON.stringify(d));
      return d;
    } catch { return DB.get(table); }
  },
  // Insert ke Supabase
  insert: async (table, payload) => {
    if (!window.supa) { return null; }
    const p = { ...payload };
    if (!p.id) delete p.id;
    delete p._type;
    const { data, error } = await supa.from(table).insert(p).select().single();
    if (error) { console.error('insert', table, error.message); return null; }
    return data;
  },
  // Update ke Supabase
  update: async (table, id, payload) => {
    if (!window.supa) return null;
    const p = { ...payload };
    delete p.id; delete p.created_at; delete p._type;
    const { data, error } = await supa.from(table).update(p).eq('id', id).select().single();
    if (error) { console.error('update', table, error.message); return null; }
    return data;
  },
  // Delete dari Supabase
  delete: async (table, id) => {
    if (!window.supa) return false;
    const { error } = await supa.from(table).delete().eq('id', id);
    if (error) { console.error('delete', table, error.message); return false; }
    return true;
  }
};

// ---- KONFIRMASI POPUP ----
function showConfirm({ icon = '❓', title = 'Konfirmasi', message = '', confirmText = 'Ya', confirmClass = 'btn-primary', cancelText = 'Batal' }) {
  return new Promise(resolve => {
    const id = 'confirm_' + Date.now();
    document.body.insertAdjacentHTML('beforeend', `
      <div class="overlay" id="${id}" style="z-index:2000">
        <div class="modal" style="max-width:360px">
          <div class="modal-body" style="text-align:center;padding:32px 24px">
            <div style="font-size:42px;margin-bottom:14px">${icon}</div>
            <div style="font-size:16px;font-weight:800;margin-bottom:8px;color:var(--gray-900)">${title}</div>
            <div style="font-size:13px;color:var(--gray-500);margin-bottom:24px;line-height:1.6">${message}</div>
            <div style="display:flex;gap:10px;justify-content:center">
              <button class="btn btn-outline" id="${id}_no" style="min-width:90px">${cancelText}</button>
              <button class="btn ${confirmClass}" id="${id}_yes" style="min-width:90px">${confirmText}</button>
            </div>
          </div>
        </div>
      </div>`);
    document.getElementById(`${id}_no`).onclick = () => { document.getElementById(id)?.remove(); resolve(false); };
    document.getElementById(`${id}_yes`).onclick = () => { document.getElementById(id)?.remove(); resolve(true); };
    document.getElementById(id).onclick = (e) => { if (e.target.id === id) { document.getElementById(id)?.remove(); resolve(false); } };
  });
}

async function confirmDel(msg = 'Data ini akan dihapus permanen.') {
  return showConfirm({ icon:'🗑️', title:'Hapus Data?', message: msg, confirmText:'Ya, Hapus', confirmClass:'btn-danger' });
}
async function confirmSave(msg = '') {
  return showConfirm({ icon:'💾', title:'Simpan Data?', message: msg || 'Pastikan data sudah benar.', confirmText:'Ya, Simpan', confirmClass:'btn-primary' });
}
async function confirmAction(icon, title, msg, confirmText = 'Ya', cls = 'btn-primary') {
  return showConfirm({ icon, title, message: msg, confirmText, confirmClass: cls });
}

// ---- HELPERS ----
function rupiah(n) {
  if (!n && n !== 0) return '-';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function tgl(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

function tglInput(d) {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
}

function toast(msg, type = '') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { ok:'✓', err:'✕', warn:'⚠' };
  el.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 3000);
}

window.closeModal = function(id) { document.getElementById(id)?.remove(); };

function badge(status) {
  const m = { aktif:'b-green', baru:'b-blue', dihubungi:'b-yellow', survei:'b-orange',
    tidak_aktif:'b-gray', berhenti:'b-red', lunas:'b-green', cicilan:'b-teal', pending:'b-yellow',
    mingguan:'b-blue', bulanan:'b-purple', dua_mingguan:'b-teal',
    masjid:'b-green', kesehatan:'b-teal', pendidikan:'b-blue', sosial:'b-purple' };
  const labels = { aktif:'Aktif', baru:'Baru', dihubungi:'Dihubungi', survei:'Survei',
    tidak_aktif:'Tidak Aktif', berhenti:'Berhenti', lunas:'Lunas', cicilan:'Cicilan', pending:'Pending',
    mingguan:'Mingguan', bulanan:'Bulanan', dua_mingguan:'2 Mingguan',
    masjid:'Masjid', kesehatan:'Kesehatan', pendidikan:'Pendidikan', sosial:'Sosial' };
  return `<span class="badge ${m[status]||'b-gray'}">${labels[status]||status}</span>`;
}

// ---- SIDEBAR & UI ----
function initSidebar() {
  const btn = document.getElementById('menuBtn');
  const sb_el = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  btn?.addEventListener('click', () => { sb_el.classList.toggle('open'); ov.classList.toggle('show'); });
  ov?.addEventListener('click', () => { sb_el.classList.remove('open'); ov.classList.remove('show'); });
}

function setHeaderDate() {
  const el = document.getElementById('headerDate');
  if (el) el.textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

// ---- TABS ----
function initTabs(containerId, onTabChange) {
  const panes = {};
  document.querySelectorAll(`#${containerId} .tab`).forEach(btn => {
    const t = btn.dataset.target;
    if (t) { const el = document.getElementById(t); if (el) { el.style.display='none'; panes[t]=el; } }
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${containerId} .tab`).forEach(b=>b.classList.remove('active'));
      Object.values(panes).forEach(p=>p.style.display='none');
      btn.classList.add('active');
      if (panes[btn.dataset.target]) panes[btn.dataset.target].style.display='block';
      if (onTabChange) onTabChange(btn.dataset.target);
    });
  });
  const activeBtn = document.querySelector(`#${containerId} .tab.active`);
  if (activeBtn && panes[activeBtn.dataset.target]) panes[activeBtn.dataset.target].style.display='block';
}

// ---- PAGINATION ----
function paginate(data, page, size) {
  const total = data.length;
  const items = data.slice((page-1)*size, page*size);
  return { items, total };
}

function renderPagination(elId, total, page, size, onPage) {
  const pages = Math.ceil(total/size);
  const el = document.getElementById(elId);
  if (!el) return;
  const start = total===0?0:(page-1)*size+1, end=Math.min(page*size,total);
  let html=`<div class="pagination"><div class="page-info">Menampilkan ${start}–${end} dari ${total}</div><div class="page-btns">
    <button class="pbtn" onclick="${onPage}(${page-1})" ${page<=1?'disabled':''}>‹</button>`;
  for (let i=1;i<=pages;i++) {
    if (i===1||i===pages||(i>=page-1&&i<=page+1)) html+=`<button class="pbtn ${i===page?'active':''}" onclick="${onPage}(${i})">${i}</button>`;
    else if (i===page-2||i===page+2) html+=`<button class="pbtn" disabled>…</button>`;
  }
  html+=`<button class="pbtn" onclick="${onPage}(${page+1})" ${page>=pages?'disabled':''}>›</button></div></div>`;
  el.innerHTML=html;
}

// ---- EXPORT EXCEL ----
function exportExcel(data, name, sheetName='Data') {
  if (!data.length) { toast('Tidak ada data','warn'); return; }
  const labelMap = { nama:'Nama', hp:'No. HP', alamat:'Alamat', kota:'Kota', program:'Program',
    nominal_rutin:'Nominal Rutin', nominal:'Nominal', nominal_per_bulan:'Nominal/Bulan',
    nominal_bayar:'Nominal Bayar', tgl_bayar:'Tgl Bayar', tgl_mulai:'Tgl Mulai',
    status:'Status', status_bulan_ini:'Status Bulan Ini', petugas:'Petugas', catatan:'Catatan',
    metode:'Metode', tgl:'Tanggal', sumber:'Sumber', nama_kotak:'Nama Kotak',
    nama_toko:'Nama Toko', frekuensi:'Frekuensi', tgl_ambil_bulan_ini:'Tgl Ambil',
    total_bulan_ini:'Total Bulan Ini', kecamatan:'Kecamatan', pemilik:'Pemilik' };
  const keys = Object.keys(data[0]);
  const headers = keys.map(k=>labelMap[k]||k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
  const isNominal = k => k.includes('nominal')||k==='total_bulan_ini';
  const totals = keys.map(k=>isNominal(k)?data.reduce((s,r)=>s+(+r[k]||0),0):null);
  const fmtRp = n => 'Rp '+Number(n).toLocaleString('id-ID');
  const headerCells = headers.map((h,i)=>
    `<td style="background:#1a7340;color:white;font-weight:bold;text-align:center;padding:7px 12px;border:1px solid #fff;white-space:nowrap;font-size:11pt">${h}</td>`).join('');
  const dataRows = data.map((row,ri)=>{
    const bg=ri%2===0?'#ffffff':'#f2f9f5';
    return '<tr>'+keys.map((k,ci)=>{
      const v=row[k]??'';
      if(isNominal(k)) return `<td style="padding:5px 10px;border:1px solid #d0e8d8;background:${bg};font-size:10pt;text-align:right">${(+v)||v?fmtRp(+v):'-'}</td>`;
      return `<td style="padding:5px 10px;border:1px solid #d0e8d8;background:${bg};font-size:10pt">${v}</td>`;
    }).join('')+'</tr>';
  }).join('');
  const totalCells = keys.map((k,i)=>{
    if(i===0) return `<td style="background:#2c3e50;color:white;font-weight:bold;padding:6px 8px;font-size:10pt">TOTAL</td>`;
    const t=totals[i];
    return `<td style="background:#2c3e50;color:white;font-weight:bold;padding:6px 8px;font-size:10pt;text-align:right">${t!==null?fmtRp(t):''}</td>`;
  }).join('');
  const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetName}</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
  <body><table>
    <tr><td colspan="${headers.length}" style="font-size:14pt;font-weight:bold;text-align:center;padding:12px;background:#f0fdf4;border:2px solid #1a7340;color:#1a7340">LAPORAN ${name.replace(/_/g,' ').toUpperCase()}</td></tr>
    <tr><td colspan="${headers.length}" style="font-size:9pt;text-align:center;padding:4px;color:#666">Dicetak: ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</td></tr>
    <tr>${headerCells}</tr>${dataRows}<tr>${totalCells}</tr>
  </table></body></html>`;
  const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=name+'_'+new Date().toISOString().split('T')[0]+'.xls'; a.click(); URL.revokeObjectURL(a.href);
}

// ---- BUILD TEMPLATE EXCEL ----
function buildTemplateExcel(title, labels, headers, contoh, type) {
  const SEP='\t';
  const rows=[[title,...Array(labels.length-1).fill('')],
    ['PETUNJUK: Hapus baris contoh sebelum import. Kolom wajib: nama/nama_toko',...Array(labels.length-1).fill('')],
    Array(labels.length).fill(''), labels, ...contoh];
  const tsv=rows.map(r=>r.map(c=>String(c??'')).join(SEP)).join('\r\n');
  const blob=new Blob(['\uFEFF'+tsv],{type:'text/tab-separated-values;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`Template_${type}_${new Date().toISOString().split('T')[0]}.xls`;
  a.click(); URL.revokeObjectURL(a.href);
  toast('Template didownload','ok');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  setHeaderDate();
});
