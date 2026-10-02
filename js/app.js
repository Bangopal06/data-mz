// =============================================
// SHARED UTILITIES
// =============================================

// ---- DATA STORAGE (localStorage) ----
const DB = {
  get: (key) => JSON.parse(localStorage.getItem('crm_' + key) || '[]'),
  set: (key, val) => localStorage.setItem('crm_' + key, JSON.stringify(val)),
  getOne: (key) => JSON.parse(localStorage.getItem('crm_' + key) || 'null'),
  setOne: (key, val) => localStorage.setItem('crm_' + key, JSON.stringify(val)),
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

async function confirmDel(msg = 'Data ini akan dihapus permanen dan tidak bisa dikembalikan.') {
  return showConfirm({ icon:'🗑️', title:'Hapus Data?', message: msg, confirmText:'Ya, Hapus', confirmClass:'btn-danger' });
}

async function confirmSave(msg = '') {
  return showConfirm({ icon:'💾', title:'Simpan Data?', message: msg || 'Pastikan data yang diisi sudah benar.', confirmText:'Ya, Simpan', confirmClass:'btn-primary' });
}

async function confirmAction(icon, title, msg, confirmText = 'Ya', cls = 'btn-primary') {
  return showConfirm({ icon, title, message: msg, confirmText, confirmClass: cls });
}

// Seed data awal jika kosong
function seedData() {
  // Inisialisasi key jika belum ada (tanpa data demo)
  const keys = ['donatur_rutin','prospek_rutin','kotak_infaq','prospek_kotak',
    'waqaf_program','donatur_waqaf','prospek_waqaf','pengambilan_kotak','pembayaran_rutin'];
  keys.forEach(k => {
    if (localStorage.getItem('crm_' + k) === null) {
      DB.set(k, []);
    }
  });
}

// ---- HELPERS ----
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function rupiah(n) {
  if (!n && n !== 0) return '-';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function tgl(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function tglInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
}

function toast(msg, type = '') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { ok: '✓', err: '✕', warn: '⚠' };
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

async function confirmDel(msg = 'Yakin hapus data ini?') {
  return new Promise(r => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div class="modal" style="max-width:360px"><div class="modal-body" style="text-align:center;padding:28px">
      <div style="font-size:36px;margin-bottom:12px">🗑️</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:8px">Hapus Data?</div>
      <div style="font-size:13px;color:var(--gray-500);margin-bottom:22px">${msg}</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn btn-outline" id="cNo">Batal</button>
        <button class="btn btn-danger" id="cYes">Hapus</button>
      </div></div></div>`;
    document.body.appendChild(o);
    o.querySelector('#cNo').onclick = () => { o.remove(); r(false); };
    o.querySelector('#cYes').onclick = () => { o.remove(); r(true); };
  });
}

window.closeModal = function(id) { document.getElementById(id)?.remove(); };

function badge(status) {
  const m = {
    aktif: 'b-green', baru: 'b-blue', dihubungi: 'b-yellow',
    survei: 'b-orange', tidak_aktif: 'b-gray', berhenti: 'b-red',
    lunas: 'b-green', cicilan: 'b-teal', pending: 'b-yellow',
    mingguan: 'b-blue', bulanan: 'b-purple', dua_mingguan: 'b-teal',
    masjid: 'b-green', kesehatan: 'b-teal', pendidikan: 'b-blue', sosial: 'b-purple',
  };
  const labels = {
    aktif: 'Aktif', baru: 'Baru', dihubungi: 'Dihubungi',
    survei: 'Survei', tidak_aktif: 'Tidak Aktif', berhenti: 'Berhenti',
    lunas: 'Lunas', cicilan: 'Cicilan', pending: 'Pending',
    mingguan: 'Mingguan', bulanan: 'Bulanan', dua_mingguan: '2 Mingguan',
    masjid: 'Masjid', kesehatan: 'Kesehatan', pendidikan: 'Pendidikan', sosial: 'Sosial',
  };
  return `<span class="badge ${m[status] || 'b-gray'}">${labels[status] || status}</span>`;
}

function progressBar(terkumpul, target) {
  const pct = Math.min(100, Math.round((terkumpul / target) * 100));
  return `<div class="pc-progress">
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-500);margin-bottom:4px">
      <span>${rupiah(terkumpul)}</span><span>${pct}%</span>
    </div>
    <div class="pc-progress-bar"><div class="pc-progress-fill" style="width:${pct}%"></div></div>
    <div style="text-align:right;font-size:11px;color:var(--gray-400);margin-top:2px">Target: ${rupiah(target)}</div>
  </div>`;
}

// Sidebar toggle
function initSidebar() {
  const btn = document.getElementById('menuBtn');
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  btn?.addEventListener('click', () => { sb.classList.toggle('open'); ov.classList.toggle('show'); });
  ov?.addEventListener('click', () => { sb.classList.remove('open'); ov.classList.remove('show'); });
}

// Header date
function setHeaderDate() {
  const el = document.getElementById('headerDate');
  if (el) el.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Tab switcher
function initTabs(containerId, onTabChange) {
  const panes = {};
  document.querySelectorAll(`#${containerId} .tab`).forEach(btn => {
    // Sembunyikan semua pane dulu via JS
    const t = btn.dataset.target;
    if (t) {
      const el = document.getElementById(t);
      if (el) { el.style.display = 'none'; panes[t] = el; }
    }
    btn.addEventListener('click', () => {
      // Nonaktifkan semua tab & sembunyikan semua pane
      document.querySelectorAll(`#${containerId} .tab`).forEach(b => b.classList.remove('active'));
      Object.values(panes).forEach(p => p.style.display = 'none');
      // Aktifkan tab & pane yang diklik
      btn.classList.add('active');
      if (panes[btn.dataset.target]) panes[btn.dataset.target].style.display = 'block';
      if (onTabChange) onTabChange(btn.dataset.target);
    });
  });
  // Tampilkan pane dari tab yang active saat load
  const activeBtn = document.querySelector(`#${containerId} .tab.active`);
  if (activeBtn && panes[activeBtn.dataset.target]) {
    panes[activeBtn.dataset.target].style.display = 'block';
  }
}

// Export CSV
function exportCSV(data, name) {
  if (!data.length) { toast('Tidak ada data', 'warn'); return; }
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${(r[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }));
  a.download = name + '_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// Export Excel - format tabel laporan keuangan rapi
function exportExcel(data, name, sheetName = 'Data') {
  if (!data.length) { toast('Tidak ada data', 'warn'); return; }

  const labelMap = {
    nama: 'Nama', hp: 'No. HP', alamat: 'Alamat', kota: 'Kota',
    program: 'Program', nominal_rutin: 'Nominal Rutin', nominal: 'Nominal',
    nominal_per_bulan: 'Nominal/Bulan', nominal_bayar: 'Nominal Bayar',
    tgl_bayar: 'Tgl Bayar', tgl_mulai: 'Tgl Mulai', status: 'Status',
    status_bulan_ini: 'Status Bulan Ini', petugas: 'Petugas', catatan: 'Catatan',
    metode: 'Metode', tgl: 'Tanggal', sumber: 'Sumber',
    nama_kotak: 'Nama Kotak', nama_toko: 'Nama Toko', frekuensi: 'Frekuensi',
    tgl_ambil_bulan_ini: 'Tgl Ambil', total_bulan_ini: 'Total Bulan Ini',
    kecamatan: 'Kecamatan', pemilik: 'Pemilik',
  };

  const keys = Object.keys(data[0]);
  const headers = keys.map(k => labelMap[k] || k.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()));
  const isNominal = k => k.includes('nominal') || k === 'total_bulan_ini';

  // Hitung grand total kolom nominal
  const totals = keys.map(k => isNominal(k) ? data.reduce((s,r) => s+(+r[k]||0), 0) : null);
  const grandTotal = totals.filter(t => t !== null).reduce((s,t) => s+t, 0);

  // Format angka Rupiah
  const fmtRp = n => 'Rp ' + Number(n).toLocaleString('id-ID');

  // Tanggal cetak
  const now = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });

  // Judul laporan dari nama file
  const judulLaporan = name.replace(/_/g,' ').replace(/\d{4}-\d{2}-\d{2}.*/, '').trim();

  // Build style per cell
  const S = {
    title:    'font-size:14pt;font-weight:bold;text-align:center;vertical-align:middle;',
    subtitle: 'font-size:10pt;font-weight:bold;text-align:center;vertical-align:middle;border-bottom:2px solid #000;',
    header:   'background:#c0392b;color:white;font-weight:bold;text-align:center;vertical-align:middle;border:1px solid #922b21;font-size:10pt;padding:6px;white-space:nowrap;',
    even:     'background:#ffffff;border:1px solid #bdc3c7;padding:4px 8px;font-size:9pt;vertical-align:middle;',
    odd:      'background:#fef9e7;border:1px solid #bdc3c7;padding:4px 8px;font-size:9pt;vertical-align:middle;',
    num_even: 'background:#ffffff;border:1px solid #bdc3c7;padding:4px 8px;font-size:9pt;text-align:right;vertical-align:middle;',
    num_odd:  'background:#fef9e7;border:1px solid #bdc3c7;padding:4px 8px;font-size:9pt;text-align:right;vertical-align:middle;',
    total:    'background:#2c3e50;color:white;font-weight:bold;text-align:right;border:1px solid #1a252f;padding:6px 8px;font-size:10pt;',
    total_lbl:'background:#2c3e50;color:white;font-weight:bold;text-align:center;border:1px solid #1a252f;padding:6px 8px;font-size:10pt;',
    footer:   'font-size:8pt;color:#7f8c8d;text-align:right;padding-top:8px;',
  };

  const colCount = headers.length;

  // Header baris
  const headerCells = headers.map((h,i) =>
    `<td style="${S.header}">${h}</td>`).join('');

  // Data baris
  const dataRows = data.map((row, ri) => {
    const isOdd = ri % 2 !== 0;
    const cells = keys.map((k,ci) => {
      const v = row[k] ?? '';
      if (isNominal(k)) {
        const n = +v || 0;
        return `<td style="${isOdd ? S.num_odd : S.num_even}">${n ? fmtRp(n) : '-'}</td>`;
      }
      return `<td style="${isOdd ? S.odd : S.even}">${v}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  // Total row
  const totalCells = keys.map((k,i) => {
    if (i === 0) return `<td colspan="1" style="${S.total_lbl}">TOTAL</td>`;
    const t = totals[i];
    return `<td style="${S.total}">${t !== null ? fmtRp(t) : ''}</td>`;
  }).join('');

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]><xml>
    <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>${sheetName}</x:Name>
      <x:WorksheetOptions>
        <x:FitToPage/><x:Print><x:FitHeight>1</x:FitHeight></x:Print>
      </x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
  </xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
<table>
  <!-- JUDUL -->
  <tr><td colspan="${colCount}" style="${S.title} padding:10px;">
    LAPORAN ${judulLaporan.toUpperCase()}
  </td></tr>
  <tr><td colspan="${colCount}" style="${S.subtitle} padding:4px;">
    Dicetak pada: ${now} &nbsp;|&nbsp; Total Data: ${data.length} baris
  </td></tr>
  <tr><td colspan="${colCount}" style="padding:4px;"></td></tr>
  <!-- HEADER TABEL -->
  <tr>${headerCells}</tr>
  <!-- DATA -->
  ${dataRows}
  <!-- TOTAL -->
  <tr>${totalCells}</tr>
  <!-- FOOTER -->
  <tr><td colspan="${colCount}" style="${S.footer}">
    &copy; ${new Date().getFullYear()} Lembaga Sosial &mdash; Laporan digenerate otomatis
  </td></tr>
</table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name + '_' + new Date().toISOString().split('T')[0] + '.xls';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

// Pagination helper
function paginate(data, page, size) {
  const total = data.length;
  const pages = Math.ceil(total / size);
  const items = data.slice((page - 1) * size, page * size);
  return { items, total, pages };
}

function renderPagination(elId, total, page, size, onPage) {
  const pages = Math.ceil(total / size);
  const el = document.getElementById(elId);
  if (!el) return;
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  let html = `<div class="pagination">
    <div class="page-info">Menampilkan ${start}–${end} dari ${total}</div>
    <div class="page-btns">
      <button class="pbtn" onclick="${onPage}(${page - 1})" ${page <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="pbtn ${i === page ? 'active' : ''}" onclick="${onPage}(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<button class="pbtn" disabled>…</button>`;
    }
  }
  html += `<button class="pbtn" onclick="${onPage}(${page + 1})" ${page >= pages ? 'disabled' : ''}>›</button></div></div>`;
  el.innerHTML = html;
}

// Init semua page
document.addEventListener('DOMContentLoaded', () => {
  seedData();
  initSidebar();
  setHeaderDate();
});

// ---- BUILD TEMPLATE EXCEL (shared) ----
function buildTemplateExcel(title, labels, headers, contoh, type) {
  // Pakai TAB separator — Excel otomatis baca tiap kolom terpisah
  const SEP = '\t';

  const rows = [];
  rows.push([title, ...Array(labels.length - 1).fill('')]);
  rows.push(['PETUNJUK: Hapus baris contoh (baris 5-6) sebelum import. Kolom wajib: nama & hp', ...Array(labels.length - 1).fill('')]);
  rows.push(Array(labels.length).fill(''));
  rows.push(labels);
  contoh.forEach(row => rows.push(row));

  const tsv = rows.map(row => row.map(c => String(c ?? '')).join(SEP)).join('\r\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + tsv], { type: 'text/tab-separated-values;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Template_${type}_${new Date().toISOString().split('T')[0]}.xls`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Template didownload — isi data lalu import', 'ok');
}
