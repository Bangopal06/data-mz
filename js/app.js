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

// Export ke .xlsx dengan styling penuh menggunakan ExcelJS
async function exportExcelWithMetodeSummary(data, name, sheetName='Data', metodeMap={}) {
  if (!data.length) { toast('Tidak ada data','warn'); return; }
  if (typeof ExcelJS === 'undefined') {
    // fallback ke SheetJS kalau ExcelJS belum load
    _exportSheetJSFallback(data, name, sheetName, metodeMap);
    return;
  }

  const isNominal = k => k.includes('nominal') || k === 'total_bulan_ini';
  const keys      = Object.keys(data[0]);
  const headers   = keys.map(k => _LABEL_MAP[k] || k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
  const dateStr   = new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const title     = 'LAPORAN ' + name.replace(/_/g,' ').toUpperCase();
  const colCount  = keys.length;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mitra Zakat Al-Iman';
  const ws = wb.addWorksheet(sheetName.substring(0,31));

  // ── Hitung lebar kolom ──
  ws.columns = keys.map((k, ci) => {
    const headerLen = headers[ci].length;
    const dataLens  = data.map(r => String(r[k] ?? '').length);
    const max = Math.max(headerLen, ...dataLens);
    return { width: Math.min(Math.max(max + 2, 10), 45) };
  });

  // ── Style helper ──
  const styleTitle = {
    font:      { name:'Calibri', size:14, bold:true, color:{argb:'FF1A5C2E'} },
    alignment: { horizontal:'center', vertical:'middle' },
    fill:      { type:'pattern', pattern:'solid', fgColor:{argb:'FFE8F5E9'} },
    border:    { bottom:{style:'medium', color:{argb:'FF1A7340'}} }
  };
  const styleSub = {
    font:      { name:'Calibri', size:10, italic:true, color:{argb:'FF666666'} },
    alignment: { horizontal:'center' }
  };
  const styleHeader = {
    font:      { name:'Calibri', size:11, bold:true, color:{argb:'FFFFFFFF'} },
    alignment: { horizontal:'center', vertical:'middle', wrapText:true },
    fill:      { type:'pattern', pattern:'solid', fgColor:{argb:'FF1A7340'} },
    border:    {
      top:    {style:'thin', color:{argb:'FFFFFFFF'}},
      bottom: {style:'thin', color:{argb:'FFFFFFFF'}},
      left:   {style:'thin', color:{argb:'FFFFFFFF'}},
      right:  {style:'thin', color:{argb:'FFFFFFFF'}}
    }
  };
  const styleDataEven = {
    font:      { name:'Calibri', size:10 },
    fill:      { type:'pattern', pattern:'solid', fgColor:{argb:'FFFFFFFF'} },
    border:    { bottom:{style:'hair', color:{argb:'FFD0E8D8'}}, right:{style:'hair', color:{argb:'FFD0E8D8'}} },
    alignment: { vertical:'middle' }
  };
  const styleDataOdd = {
    font:      { name:'Calibri', size:10 },
    fill:      { type:'pattern', pattern:'solid', fgColor:{argb:'FFF2F9F5'} },
    border:    { bottom:{style:'hair', color:{argb:'FFD0E8D8'}}, right:{style:'hair', color:{argb:'FFD0E8D8'}} },
    alignment: { vertical:'middle' }
  };
  const styleTotal = {
    font:      { name:'Calibri', size:10, bold:true, color:{argb:'FFFFFFFF'} },
    fill:      { type:'pattern', pattern:'solid', fgColor:{argb:'FF2C3E50'} },
    alignment: { vertical:'middle' },
    border:    { top:{style:'medium', color:{argb:'FFFFFFFF'}} }
  };
  const styleNominal = (base) => ({ ...base,
    alignment: { ...base.alignment, horizontal:'right' },
    numFmt: '#,##0'
  });

  const applyStyle = (cell, style) => Object.assign(cell, style);

  // ── Baris 1: Judul ──
  const rTitle = ws.addRow([title]);
  rTitle.height = 28;
  ws.mergeCells(rTitle.number, 1, rTitle.number, colCount);
  rTitle.getCell(1).style = styleTitle;

  // ── Baris 2: Tanggal cetak ──
  const rPrint = ws.addRow(['Dicetak: ' + dateStr]);
  rPrint.height = 16;
  ws.mergeCells(rPrint.number, 1, rPrint.number, colCount);
  rPrint.getCell(1).style = styleSub;

  // ── Baris 3: Kosong ──
  ws.addRow([]);

  // ── Baris 4: Header kolom ──
  const rHeader = ws.addRow(headers);
  rHeader.height = 20;
  rHeader.eachCell(cell => { cell.style = styleHeader; });

  // Freeze baris header ke bawah
  ws.views = [{ state:'frozen', xSplit:0, ySplit:4, activeCell:'A5' }];

  // ── Data rows ──
  data.forEach((row, ri) => {
    const vals = keys.map(k => {
      const v = row[k] ?? '';
      return isNominal(k) ? (+v || 0) : String(v);
    });
    const r = ws.addRow(vals);
    r.height = 16;
    const baseStyle = ri % 2 === 0 ? styleDataEven : styleDataOdd;
    keys.forEach((k, ci) => {
      const cell = r.getCell(ci + 1);
      if (isNominal(k)) {
        cell.style = styleNominal(baseStyle);
        cell.numFmt = '#,##0';
      } else {
        cell.style = { ...baseStyle };
      }
    });
  });

  // ── Baris TOTAL ──
  const totalVals = keys.map((k, i) => {
    if (i === 0) return 'TOTAL (' + data.length + ' data)';
    return isNominal(k) ? data.reduce((s,r) => s + (+r[k]||0), 0) : '';
  });
  const rTotal = ws.addRow(totalVals);
  rTotal.height = 18;
  keys.forEach((k, ci) => {
    const cell = rTotal.getCell(ci + 1);
    if (isNominal(k)) {
      cell.style = { ...styleTotal, alignment:{horizontal:'right',vertical:'middle'}, numFmt:'#,##0' };
      cell.numFmt = '#,##0';
    } else {
      cell.style = styleTotal;
    }
  });

  // ── Ringkasan Metode Pembayaran ──
  const metodeEntries = Object.entries(metodeMap).filter(([,v]) => v > 0);
  if (metodeEntries.length > 0) {
    const metodeOrder = ['tunai','transfer','qris','cek','lainnya'];
    metodeEntries.sort((a,b) => {
      const ia = metodeOrder.indexOf(a[0]), ib = metodeOrder.indexOf(b[0]);
      return (ia<0?99:ia)-(ib<0?99:ib);
    });
    const grandMetode = metodeEntries.reduce((s,[,v]) => s+v, 0);

    ws.addRow([]);

    // Judul ringkasan
    const rMTitle = ws.addRow(['RINGKASAN METODE PEMBAYARAN']);
    ws.mergeCells(rMTitle.number, 1, rMTitle.number, colCount);
    rMTitle.getCell(1).style = {
      font:  { name:'Calibri', size:11, bold:true, color:{argb:'FFFFFFFF'} },
      fill:  { type:'pattern', pattern:'solid', fgColor:{argb:'FF1A4F7A'} },
      alignment: { horizontal:'center', vertical:'middle' }
    };
    rMTitle.height = 18;

    // Header ringkasan
    const rMHead = ws.addRow(['Metode', 'Total', 'Proporsi']);
    ['Metode','Total','Proporsi'].forEach((_,ci) => {
      rMHead.getCell(ci+1).style = styleHeader;
    });
    rMHead.height = 18;

    // Data metode
    metodeEntries.forEach(([m, v], ri) => {
      const pct = grandMetode ? Math.round(v/grandMetode*100) : 0;
      const r = ws.addRow([m.charAt(0).toUpperCase()+m.slice(1), v, pct + '%']);
      r.height = 16;
      const bg = ri%2===0 ? 'FFF0F7FF' : 'FFE8F4FD';
      [0,1,2].forEach(ci => {
        const cell = r.getCell(ci+1);
        cell.style = {
          font: {name:'Calibri', size:10, bold: ci===1},
          fill: {type:'pattern', pattern:'solid', fgColor:{argb:bg}},
          alignment: {horizontal: ci===1?'right':ci===2?'center':'left', vertical:'middle'},
          border: {bottom:{style:'hair', color:{argb:'FFD0D8E8'}}}
        };
        if (ci === 1) { cell.numFmt = '#,##0'; }
      });
    });

    // Total metode
    const rMTotal = ws.addRow(['TOTAL SEMUA', grandMetode, '100%']);
    rMTotal.height = 18;
    [0,1,2].forEach(ci => {
      const cell = rMTotal.getCell(ci+1);
      cell.style = {
        font: {name:'Calibri', size:10, bold:true, color:{argb:'FFFFFFFF'}},
        fill: {type:'pattern', pattern:'solid', fgColor:{argb:'FF2C3E50'}},
        alignment: {horizontal: ci===1?'right':ci===2?'center':'left', vertical:'middle'}
      };
      if (ci === 1) { cell.numFmt = '#,##0'; }
    });
  }

  // ── Download ──
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name + '_' + new Date().toISOString().split('T')[0] + '.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('File Excel berhasil didownload', 'ok');
}

// Fallback SheetJS kalau ExcelJS tidak tersedia
function _exportSheetJSFallback(data, name, sheetName, metodeMap) {
  if (typeof XLSX === 'undefined') { toast('Library Excel tidak tersedia','err'); return; }
  const isNominal = k => k.includes('nominal') || k === 'total_bulan_ini';
  const keys    = Object.keys(data[0]);
  const headers = keys.map(k => _LABEL_MAP[k] || k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
  const aoa = [
    ['LAPORAN ' + name.replace(/_/g,' ').toUpperCase()],
    ['Dicetak: ' + new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})],
    [],
    headers,
    ...data.map(row => keys.map(k => isNominal(k) ? (+row[k]||0) : String(row[k]??''))),
    keys.map((k,i) => i===0 ? 'TOTAL' : isNominal(k) ? data.reduce((s,r)=>s+(+r[k]||0),0) : '')
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = keys.map((k,ci) => ({
    wch: Math.min(Math.max(Math.max(headers[ci].length, ...data.map(r=>String(r[k]??'').length)) + 2, 10), 45)
  }));
  ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:keys.length-1}},{s:{r:1,c:0},e:{r:1,c:keys.length-1}}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0,31));
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
