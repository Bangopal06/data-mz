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

function exportExcelWithMetodeSummary(data, name, sheetName='Data', metodeMap={}) {
  if (!data.length) { toast('Tidak ada data','warn'); return; }

  // xlsx-js-style mengexpose global XLSX dengan support .s (style)
  const XS = (typeof XLSX !== 'undefined') ? XLSX : null;
  if (!XS) { toast('Library Excel belum siap','warn'); return; }

  const isNominal = k => k.includes('nominal') || k === 'total_bulan_ini';
  const isTanggal = k => k.startsWith('tgl') || k === 'tanggal';
  const fmtTgl = v => {
    if (!v || v === '-') return '-';
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
  };

  const keys    = Object.keys(data[0]);
  const headers = keys.map(k => _LABEL_MAP[k] || k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
  const dateStr = new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const title   = 'LAPORAN ' + name.replace(/_/g,' ').toUpperCase();
  const fmtRp   = n => 'Rp ' + Number(+n||0).toLocaleString('id-ID');

  // ── Style definitions ──
  const hasStyle = true; // xlsx-js-style selalu support .s style
  const mkStyle = (s) => s;

  const stTitle = mkStyle({
    font:  { name:'Calibri', sz:14, bold:true, color:{rgb:'FFFFFF'} },
    fill:  { fgColor:{rgb:'1A7340'} },
    alignment: { horizontal:'center', vertical:'center', wrapText:false },
    border: { bottom:{style:'medium', color:{rgb:'0F4F28'}} }
  });
  const stSub = mkStyle({
    font:  { name:'Calibri', sz:10, italic:true, color:{rgb:'555555'} },
    fill:  { fgColor:{rgb:'E8F5E9'} },
    alignment: { horizontal:'center' }
  });
  const stHeader = mkStyle({
    font:  { name:'Calibri', sz:11, bold:true, color:{rgb:'FFFFFF'} },
    fill:  { fgColor:{rgb:'1A7340'} },
    alignment: { horizontal:'center', vertical:'center', wrapText:true },
    border: { top:{style:'thin',color:{rgb:'0F4F28'}}, bottom:{style:'thin',color:{rgb:'0F4F28'}}, left:{style:'thin',color:{rgb:'0F4F28'}}, right:{style:'thin',color:{rgb:'0F4F28'}} }
  });
  const stDataEven = mkStyle({
    font:  { name:'Calibri', sz:10 },
    fill:  { fgColor:{rgb:'FFFFFF'} },
    border: { bottom:{style:'hair',color:{rgb:'D0E8D8'}}, right:{style:'hair',color:{rgb:'D0E8D8'}} },
    alignment: { vertical:'center', wrapText:false }
  });
  const stDataOdd = mkStyle({
    font:  { name:'Calibri', sz:10 },
    fill:  { fgColor:{rgb:'F2F9F5'} },
    border: { bottom:{style:'hair',color:{rgb:'D0E8D8'}}, right:{style:'hair',color:{rgb:'D0E8D8'}} },
    alignment: { vertical:'center', wrapText:false }
  });
  const stNumEven = mkStyle({ ...stDataEven, alignment:{...stDataEven.alignment, horizontal:'right'} });
  const stNumOdd  = mkStyle({ ...stDataOdd,  alignment:{...stDataOdd.alignment,  horizontal:'right'} });
  const stTotal = mkStyle({
    font:  { name:'Calibri', sz:10, bold:true, color:{rgb:'FFFFFF'} },
    fill:  { fgColor:{rgb:'2C3E50'} },
    border: { top:{style:'medium',color:{rgb:'FFFFFF'}} },
    alignment: { vertical:'center' }
  });
  const stTotalNum = mkStyle({ ...stTotal, alignment:{...stTotal.alignment, horizontal:'right'} });
  const stMHead = mkStyle({
    font:  { name:'Calibri', sz:11, bold:true, color:{rgb:'FFFFFF'} },
    fill:  { fgColor:{rgb:'1A4F7A'} },
    alignment: { horizontal:'center', vertical:'center' }
  });
  const stMTh = mkStyle({ ...stHeader, fill:{fgColor:{rgb:'1A4F7A'}} });
  const stMEven = mkStyle({ ...stDataEven, fill:{fgColor:{rgb:'F0F7FF'}} });
  const stMOdd  = mkStyle({ ...stDataOdd,  fill:{fgColor:{rgb:'E8F4FD'}} });
  const stMTotal = mkStyle({ ...stTotal, fill:{fgColor:{rgb:'2C3E50'}} });
  const stMTotalNum = mkStyle({ ...stTotalNum, fill:{fgColor:{rgb:'2C3E50'}} });

  const mkCell = (v, s) => ({ v, s, t: typeof v === 'number' ? 'n' : 's' });
  const mkNum  = (v, s, fmt='#,##0') => ({ v:+v||0, s, t:'n', z:fmt });

  // ── Lebar kolom ──
  const colWidths = keys.map((k, ci) => {
    const hlen = headers[ci].length;
    const dlens = data.map(r => {
      if (isNominal(k)) return fmtRp(r[k]).length;
      if (isTanggal(k)) return 10;
      return String(r[k]??'').length;
    });
    return { wch: Math.min(Math.max(hlen, ...dlens) + 3, 50) };
  });

  // ── Build sheet data ──
  const ws = {};
  const enc = XS.utils.encode_cell;
  let row = 0;

  // Baris judul
  ws[enc({r:row, c:0})] = mkCell(title, stTitle);
  for (let c=1; c<keys.length; c++) ws[enc({r:row,c})] = mkCell('', stTitle);
  row++;

  // Baris tanggal cetak
  ws[enc({r:row, c:0})] = mkCell('Dicetak: ' + dateStr, stSub);
  for (let c=1; c<keys.length; c++) ws[enc({r:row,c})] = mkCell('', stSub);
  row++;

  // Baris kosong
  for (let c=0; c<keys.length; c++) ws[enc({r:row,c})] = mkCell('', {});
  row++;

  // Header kolom
  headers.forEach((h, c) => { ws[enc({r:row,c})] = mkCell(h, stHeader); });
  row++;

  const dataStartRow = row;

  // Data rows
  data.forEach((rowData, ri) => {
    const isEven = ri % 2 === 0;
    keys.forEach((k, c) => {
      const v = rowData[k] ?? '';
      if (isNominal(k)) {
        ws[enc({r:row,c})] = mkNum(v, isEven ? stNumEven : stNumOdd);
      } else if (isTanggal(k)) {
        ws[enc({r:row,c})] = mkCell(fmtTgl(v), isEven ? stDataEven : stDataOdd);
      } else {
        ws[enc({r:row,c})] = mkCell(String(v), isEven ? stDataEven : stDataOdd);
      }
    });
    row++;
  });

  // Baris TOTAL
  keys.forEach((k, c) => {
    if (c === 0) {
      ws[enc({r:row,c})] = mkCell('TOTAL (' + data.length + ' data)', stTotal);
    } else if (isNominal(k)) {
      ws[enc({r:row,c})] = mkNum(data.reduce((s,r)=>s+(+r[k]||0),0), stTotalNum);
    } else {
      ws[enc({r:row,c})] = mkCell('', stTotal);
    }
  });
  row++;

  // Ringkasan metode
  const me = Object.entries(metodeMap).filter(([,v])=>v>0);
  if (me.length > 0) {
    const ord = ['tunai','transfer','qris','cek','lainnya'];
    me.sort((a,b)=>(ord.indexOf(a[0])<0?99:ord.indexOf(a[0]))-(ord.indexOf(b[0])<0?99:ord.indexOf(b[0])));
    const grand = me.reduce((s,[,v])=>s+v,0);

    // Kosong
    for (let c=0;c<keys.length;c++) ws[enc({r:row,c})]=mkCell('',{});
    row++;

    // Judul ringkasan
    ws[enc({r:row,c:0})] = mkCell('RINGKASAN METODE PEMBAYARAN', stMHead);
    for (let c=1;c<keys.length;c++) ws[enc({r:row,c})]=mkCell('',stMHead);
    row++;

    // Header metode
    ['Metode','Total','Proporsi'].forEach((h,c)=>{ ws[enc({r:row,c})]=mkCell(h,stMTh); });
    for (let c=3;c<keys.length;c++) ws[enc({r:row,c})]=mkCell('',stMTh);
    row++;

    // Data metode
    me.forEach(([m,v],ri)=>{
      const pct = grand ? Math.round(v/grand*100) : 0;
      const se = ri%2===0 ? stMEven : stMOdd;
      const sn = mkStyle({...se, alignment:{horizontal:'right'}});
      const sc = mkStyle({...se, alignment:{horizontal:'center'}});
      ws[enc({r:row,c:0})]=mkCell(m.charAt(0).toUpperCase()+m.slice(1),se);
      ws[enc({r:row,c:1})]=mkNum(v,sn);
      ws[enc({r:row,c:2})]=mkCell(pct+'%',sc);
      for (let c=3;c<keys.length;c++) ws[enc({r:row,c})]=mkCell('',se);
      row++;
    });

    // Total metode
    ws[enc({r:row,c:0})]=mkCell('TOTAL SEMUA',stMTotal);
    ws[enc({r:row,c:1})]=mkNum(grand,stMTotalNum);
    ws[enc({r:row,c:2})]=mkCell('100%',mkStyle({...stMTotal,alignment:{horizontal:'center'}}));
    for (let c=3;c<keys.length;c++) ws[enc({r:row,c})]=mkCell('',stMTotal);
    row++;
  }

  // Sheet range, columns, merges, freeze
  ws['!ref'] = XS.utils.encode_range({s:{r:0,c:0}, e:{r:row-1,c:keys.length-1}});
  ws['!cols'] = colWidths;
  ws['!merges'] = [
    {s:{r:0,c:0}, e:{r:0,c:keys.length-1}},
    {s:{r:1,c:0}, e:{r:1,c:keys.length-1}},
  ];
  ws['!rows'] = [{hpt:24},{hpt:16},{hpt:6},{hpt:20}];
  ws['!freeze'] = {xSplit:0, ySplit:4};

  const wb = XS.utils.book_new();
  XS.utils.book_append_sheet(wb, ws, sheetName.substring(0,31));
  XS.writeFile(wb, name + '_' + new Date().toISOString().split('T')[0] + '.xlsx');
  toast('File Excel berhasil didownload', 'ok');
}

function exportExcelWithMetodeSummary(data, name, sheetName='Data', metodeMap={}) {
  if (!data.length) { toast('Tidak ada data','warn'); return; }

  const isNominal = k => k.includes('nominal') || k === 'total_bulan_ini';
  const isTanggal = k => k.startsWith('tgl') || k === 'tanggal';
  const fmtTgl = v => {
    if (!v || v === '-') return '-';
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
  };
  const fmtRp = n => 'Rp&nbsp;' + Number(+n||0).toLocaleString('id-ID');
  const esc   = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const keys    = Object.keys(data[0]);
  const headers = keys.map(k => _LABEL_MAP[k] || k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
  const colCount = keys.length;
  const dateStr = new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
  const title   = 'LAPORAN ' + name.replace(/_/g,' ').toUpperCase();

  // Hitung lebar kolom (pt) berdasarkan konten terpanjang
  const colWidths = keys.map((k, ci) => {
    const headerLen = headers[ci].length;
    const dataLens  = data.map(r => {
      if (isNominal(k)) return ('Rp ' + Number(+r[k]||0).toLocaleString('id-ID')).length;
      if (isTanggal(k)) return 10;
      return String(r[k]??'').length;
    });
    const maxLen = Math.max(headerLen, ...dataLens);
    return Math.min(Math.max(maxLen * 7 + 16, 60), 320);
  });

  const colGroup = colWidths.map(w => `<col style="width:${w}pt">`).join('');

  // Styles
  const S = {
    title:  'background:#1a7340;color:#fff;font-size:14pt;font-weight:bold;text-align:center;padding:10px;border:2px solid #0f4f28;mso-number-format:"@"',
    sub:    'background:#e8f5e9;color:#555;font-size:9pt;text-align:center;padding:4px;border-bottom:1px solid #c8e6c9;mso-number-format:"@"',
    empty:  'background:#fff;border:none;padding:2px',
    th:     'background:#1a7340;color:#fff;font-weight:bold;font-size:10pt;text-align:center;padding:7px 8px;border:1px solid #0f4f28;white-space:nowrap;mso-number-format:"@"',
    even:   'background:#fff;font-size:10pt;padding:5px 7px;border:1px solid #d0e8d8;vertical-align:top;mso-number-format:"@"',
    odd:    'background:#f2f9f5;font-size:10pt;padding:5px 7px;border:1px solid #d0e8d8;vertical-align:top;mso-number-format:"@"',
    num:    'text-align:right;',
    total:  'background:#2c3e50;color:#fff;font-weight:bold;font-size:10pt;padding:7px 8px;border:1px solid #1a252f;mso-number-format:"@"',
    totalN: 'background:#2c3e50;color:#fff;font-weight:bold;font-size:10pt;padding:7px 8px;border:1px solid #1a252f;text-align:right;mso-number-format:"@"',
    mHead:  'background:#1a4f7a;color:#fff;font-weight:bold;font-size:11pt;text-align:center;padding:8px;border:1px solid #0d3a5c;mso-number-format:"@"',
    mTh:    'background:#1a7340;color:#fff;font-weight:bold;font-size:10pt;padding:6px 8px;border:1px solid #0f4f28;mso-number-format:"@"',
    mEven:  'background:#f0f7ff;font-size:10pt;padding:5px 8px;border:1px solid #d0d8e8;mso-number-format:"@"',
    mOdd:   'background:#e8f4fd;font-size:10pt;padding:5px 8px;border:1px solid #d0d8e8;mso-number-format:"@"',
    mTot:   'background:#2c3e50;color:#fff;font-weight:bold;font-size:10pt;padding:6px 8px;border:1px solid #1a252f;mso-number-format:"@"',
    mTotN:  'background:#2c3e50;color:#fff;font-weight:bold;font-size:10pt;padding:6px 8px;border:1px solid #1a252f;text-align:right;mso-number-format:"@"',
  };

  // Header row
  const thRow = '<tr>' + headers.map(h => `<td style="${S.th}">${esc(h)}</td>`).join('') + '</tr>';

  // Data rows
  const dataRows = data.map((row, ri) => {
    const base = ri % 2 === 0 ? S.even : S.odd;
    return '<tr>' + keys.map(k => {
      const v = row[k] ?? '';
      if (isNominal(k)) return `<td style="${base}${S.num}">${fmtRp(v)}</td>`;
      if (isTanggal(k)) return `<td style="${base}text-align:center">${esc(fmtTgl(v))}</td>`;
      return `<td style="${base}">${esc(String(v))}</td>`;
    }).join('') + '</tr>';
  }).join('');

  // Total row
  const totalRow = '<tr>' + keys.map((k, i) => {
    if (i === 0) return `<td style="${S.total}">TOTAL (${data.length} data)</td>`;
    if (isNominal(k)) return `<td style="${S.totalN}">${fmtRp(data.reduce((s,r)=>s+(+r[k]||0),0))}</td>`;
    return `<td style="${S.total}"></td>`;
  }).join('') + '</tr>';

  // Ringkasan metode
  let metodeHTML = '';
  const me = Object.entries(metodeMap).filter(([,v])=>v>0);
  if (me.length > 0) {
    const ord = ['tunai','transfer','qris','cek','lainnya'];
    me.sort((a,b)=>(ord.indexOf(a[0])<0?99:ord.indexOf(a[0]))-(ord.indexOf(b[0])<0?99:ord.indexOf(b[0])));
    const grand = me.reduce((s,[,v])=>s+v,0);
    const ico = {tunai:'Tunai',transfer:'Transfer',qris:'QRIS',cek:'Cek',lainnya:'Lainnya'};
    const mRows = me.map(([m,v],ri)=>{
      const pct = grand ? Math.round(v/grand*100) : 0;
      const bg  = ri%2===0 ? S.mEven : S.mOdd;
      return `<tr>
        <td style="${bg}">${ico[m]||m.charAt(0).toUpperCase()+m.slice(1)}</td>
        <td style="${bg}text-align:right">${fmtRp(v)}</td>
        <td style="${bg}text-align:center">${pct}%</td>
        ${keys.slice(3).map(()=>`<td style="${bg}"></td>`).join('')}
      </tr>`;
    }).join('');
    metodeHTML = `
      <tr><td colspan="${colCount}" style="${S.empty}"></td></tr>
      <tr><td colspan="${colCount}" style="${S.mHead}">Ringkasan Metode Pembayaran</td></tr>
      <tr>
        <td style="${S.mTh}">Metode</td>
        <td style="${S.mTh}text-align:right">Total</td>
        <td style="${S.mTh}text-align:center">Proporsi</td>
        ${keys.slice(3).map(()=>`<td style="${S.mTh}"></td>`).join('')}
      </tr>
      ${mRows}
      <tr>
        <td style="${S.mTot}">TOTAL SEMUA</td>
        <td style="${S.mTotN}">${fmtRp(grand)}</td>
        <td style="${S.mTot}text-align:center">100%</td>
        ${keys.slice(3).map(()=>`<td style="${S.mTot}"></td>`).join('')}
      </tr>`;
  }

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>${esc(sheetName.substring(0,31))}</x:Name>
<x:WorksheetOptions>
  <x:FreezePanes/><x:FrozenNoSplit/>
  <x:SplitHorizontal>4</x:SplitHorizontal>
  <x:TopRowBottomPane>4</x:TopRowBottomPane>
  <x:ActivePane>2</x:ActivePane>
</x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body,td,th { font-family: Calibri, Arial, sans-serif; }
  table { border-collapse: collapse; }
</style>
</head>
<body>
<table>
  <colgroup>${colGroup}</colgroup>
  <tr><td colspan="${colCount}" style="${S.title}">${esc(title)}</td></tr>
  <tr><td colspan="${colCount}" style="${S.sub}">Dicetak: ${esc(dateStr)}</td></tr>
  <tr><td colspan="${colCount}" style="${S.empty}"></td></tr>
  ${thRow}
  ${dataRows}
  ${totalRow}
  ${metodeHTML}
</table>
</body></html>`;

  const blob = new Blob(['\uFEFF' + html], {type:'application/vnd.ms-excel;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name + '_' + new Date().toISOString().split('T')[0] + '.xls';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('File Excel berhasil didownload', 'ok');
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
