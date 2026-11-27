// =============================================
// SHARED UTILITIES - Supabase version
// =============================================

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
    tidak_aktif:'b-gray', berhenti:'b-red', menunggu:'b-yellow',
    lunas:'b-green', cicilan:'b-teal', pending:'b-yellow',
    mingguan:'b-blue', bulanan:'b-purple', dua_mingguan:'b-teal',
    masjid:'b-green', kesehatan:'b-teal', pendidikan:'b-blue', sosial:'b-purple' };
  const labels = { aktif:'Aktif', baru:'Baru', dihubungi:'Dihubungi', survei:'Survei',
    tidak_aktif:'Tidak Aktif', berhenti:'Berhenti', menunggu:'baru',
    lunas:'Lunas', cicilan:'Cicilan', pending:'Pending',
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
  exportExcelWithMetodeSummary(data, name, sheetName, {});
}

// Label map untuk header kolom
const _LABEL_MAP = {
  nama:'Nama', hp:'No. HP', alamat:'Alamat', kota:'Kota', program:'Program',
  nominal_rutin:'Nominal Rutin', nominal:'Nominal', nominal_per_bulan:'Nominal/Bulan',
  nominal_bayar:'Nominal Bayar', tgl_bayar:'Tgl Bayar', tgl_mulai:'Tgl Mulai',
  status:'Status', status_bulan_ini:'Status Bulan Ini', petugas:'Petugas', catatan:'Catatan',
  metode:'Metode', metode_bayar:'Metode Bayar', tgl:'Tanggal', tanggal:'Tanggal',
  sumber:'Sumber', nama_kotak:'Nama Kotak', nama_toko:'Nama Toko', frekuensi:'Frekuensi',
  tgl_ambil_bulan_ini:'Tgl Ambil', total_bulan_ini:'Total Bulan Ini',
  kecamatan:'Kecamatan', pemilik:'Pemilik', keterangan:'Keterangan', no:'No',
  nama_donatur:'Nama Donatur', tgl_donasi:'Tgl Donasi', tgl_ambil:'Tgl Ambil',
  jenis:'Jenis', kelas:'Kelas', halaqoh:'Halaqoh', amanah:'Amanah'
};

// Export ke .xlsx murni menggunakan SheetJS
function exportExcelWithMetodeSummary(data, name, sheetName='Data', metodeMap={}) {
  if (!data.length) { toast('Tidak ada data','warn'); return; }
  if (typeof XLSX === 'undefined') { toast('Library Excel belum siap, coba lagi','warn'); return; }

  const isNominal = k => k.includes('nominal') || k === 'total_bulan_ini';
  const fmtRp = n => 'Rp ' + Number(n).toLocaleString('id-ID');
  const keys = Object.keys(data[0]);
  const headers = keys.map(k => _LABEL_MAP[k] || k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
  const dateStr = new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});

  // Buat array of arrays untuk sheet
  const aoa = [];

  // Baris judul
  aoa.push(['LAPORAN ' + name.replace(/_/g,' ').toUpperCase()]);
  aoa.push(['Dicetak: ' + dateStr]);
  aoa.push([]); // kosong

  // Header kolom
  aoa.push(headers);

  // Data rows
  data.forEach(row => {
    aoa.push(keys.map(k => {
      const v = row[k] ?? '';
      if (isNominal(k)) return +v || 0;
      return v;
    }));
  });

  // Baris TOTAL
  const totalRow = keys.map((k, i) => {
    if (i === 0) return 'TOTAL';
    if (isNominal(k)) return data.reduce((s,r) => s + (+r[k]||0), 0);
    return '';
  });
  aoa.push(totalRow);

  // Ringkasan metode (hanya kalau ada isinya)
  const metodeEntries = Object.entries(metodeMap).filter(([,v]) => v > 0);
  if (metodeEntries.length > 0) {
    const metodeOrder = ['tunai','transfer','qris','cek','lainnya'];
    metodeEntries.sort((a,b) => {
      const ia = metodeOrder.indexOf(a[0]); const ib = metodeOrder.indexOf(b[0]);
      return (ia<0?99:ia)-(ib<0?99:ib);
    });
    const grandMetode = metodeEntries.reduce((s,[,v]) => s+v, 0);

    aoa.push([]); // kosong
    aoa.push(['RINGKASAN METODE PEMBAYARAN']);
    aoa.push(['Metode', 'Total', 'Proporsi']);
    metodeEntries.forEach(([m, v]) => {
      const pct = grandMetode ? Math.round(v/grandMetode*100) : 0;
      aoa.push([m.charAt(0).toUpperCase()+m.slice(1), v, pct + '%']);
    });
    aoa.push(['TOTAL SEMUA', grandMetode, '100%']);
  }

  // Buat worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set lebar kolom otomatis
  const colWidths = keys.map((k, ci) => {
    const max = Math.max(
      (headers[ci]||'').length,
      ...data.map(r => String(r[k]??'').length)
    );
    return { wch: Math.min(Math.max(max + 2, 10), 40) };
  });
  ws['!cols'] = colWidths;

  // Format sel nominal sebagai angka (agar bisa dijumlah di Excel)
  const startRow = 4; // 0-indexed: judul(0), cetak(1), kosong(2), header(3), data mulai(4)
  data.forEach((row, ri) => {
    keys.forEach((k, ci) => {
      if (isNominal(k)) {
        const cellRef = XLSX.utils.encode_cell({ r: startRow + ri, c: ci });
        if (ws[cellRef]) {
          ws[cellRef].t = 'n';
          ws[cellRef].z = '#,##0';
        }
      }
    });
  });

  // Buat workbook dan download
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, name + '_' + new Date().toISOString().split('T')[0] + '.xlsx');
}

// ---- BUILD TEMPLATE EXCEL ----
function buildTemplateExcel(title, labels, headers, contoh, type) {
  if (typeof XLSX !== 'undefined') {
    // Mulai langsung dari header kolom, tanpa baris judul/petunjuk
    const rows = [labels, ...contoh];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = labels.map((h, i) => {
      const maxLen = Math.max(h.length, ...contoh.map(r => String(r[i] ?? '').length));
      return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `Template_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
    const rows = [labels, ...contoh];
    const csv = rows.map(r => r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Template_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  }
  toast('Template didownload', 'ok');
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  setHeaderDate();
  // Load petugas ke cache untuk dropdown
  DB.sync('petugas');
});

// ---- SYNC INDICATOR ----
// Tampil dot kecil di header saat ada background sync berjalan
let _syncCount = 0;
function _showSyncDot() {
  _syncCount++;
  let dot = document.getElementById('_syncDot');
  if (!dot) {
    dot = document.createElement('span');
    dot.id = '_syncDot';
    dot.title = 'Memperbarui data...';
    dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:var(--primary);display:inline-block;margin-left:8px;animation:pulse 1s infinite';
    document.querySelector('.header-right')?.prepend(dot);
  }
}
function _hideSyncDot() {
  _syncCount = Math.max(0, _syncCount - 1);
  if (_syncCount === 0) document.getElementById('_syncDot')?.remove();
}

// Patch DB.sync untuk tampilkan indicator otomatis
const _origSync = DB.sync.bind(DB);
DB.sync = async function(table, opts) {
  const fresh = DB.isFresh(table);
  if (!fresh) _showSyncDot();
  const result = await _origSync(table, opts);
  if (!fresh) _hideSyncDot();
  return result;
};

// CSS pulse animation
const _style = document.createElement('style');
_style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}';
document.head.appendChild(_style);

// ---- PETUGAS HELPER ----
// Generate HTML select petugas dari cache
function petugasSelect(elId, selected = '') {
  const list = DB.get('petugas').filter(p => p.status === 'aktif');
  const opts = list.map(p =>
    `<option value="${p.nama}" ${p.nama === selected ? 'selected' : ''}>${p.nama}</option>`
  ).join('');
  return `<select id="${elId}" class="fctrl">
    <option value="">-- Pilih Petugas --</option>
    ${opts}
    <option value="__lain__">Lainnya (ketik manual)</option>
  </select>
  <input id="${elId}_manual" class="fctrl" style="display:none;margin-top:6px" placeholder="Nama petugas">`;
}

// Pasang listener toggle manual input
function initPetugasSelect(elId) {
  const sel = document.getElementById(elId);
  const manual = document.getElementById(elId + '_manual');
  if (!sel || !manual) return;
  sel.addEventListener('change', () => {
    if (sel.value === '__lain__') {
      manual.style.display = 'block';
      manual.focus();
    } else {
      manual.style.display = 'none';
    }
  });
  // Kalau nilai awal tidak ada di list, tampilkan manual
  if (sel.value === '' && manual.dataset.init) {
    sel.value = '__lain__';
    manual.style.display = 'block';
  }
}

// Ambil nilai petugas (dari select atau manual)
function getPetugas(elId) {
  const sel = document.getElementById(elId);
  if (!sel) return '';
  if (sel.value === '__lain__') {
    return document.getElementById(elId + '_manual')?.value.trim() || '';
  }
  return sel.value;
}
