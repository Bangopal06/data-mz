// =============================================
// IMPORT DATA
// =============================================

let rawData = [];      // data mentah dari file
let mappedData = [];   // data setelah mapping

// Field definitions per target
const FIELD_DEFS = {
  donatur_rutin: [
    { key: 'nama',     label: 'Nama Lengkap',     required: true },
    { key: 'hp',       label: 'No. HP/WhatsApp',  required: true },
    { key: 'alamat',   label: 'Alamat',            required: false },
    { key: 'kota',     label: 'Kota',              required: false },
    { key: 'program',  label: 'Program Donasi',    required: false },
    { key: 'nominal',  label: 'Nominal/Bulan (Rp)',required: false },
    { key: 'metode',   label: 'Metode Bayar',      required: false },
    { key: 'tgl_mulai',label: 'Tgl Mulai',         required: false },
    { key: 'petugas',  label: 'Petugas',           required: false },
    { key: 'catatan',  label: 'Catatan',           required: false },
  ],
  prospek_rutin: [
    { key: 'nama',           label: 'Nama Lengkap',      required: true },
    { key: 'hp',             label: 'No. HP/WhatsApp',   required: true },
    { key: 'alamat',         label: 'Alamat',             required: false },
    { key: 'kota',           label: 'Kota',               required: false },
    { key: 'nominal_potensi',label: 'Potensi Donasi (Rp)',required: false },
    { key: 'petugas',        label: 'Petugas',            required: false },
    { key: 'catatan',        label: 'Catatan',            required: false },
  ],
  kotak_infaq: [
    { key: 'nama_kotak', label: 'Nama Kotak',   required: true },
    { key: 'nama_toko',  label: 'Nama Toko',    required: true },
    { key: 'pemilik',    label: 'Nama Pemilik', required: false },
    { key: 'hp',         label: 'No. HP',       required: false },
    { key: 'alamat',     label: 'Alamat',       required: false },
    { key: 'kecamatan',  label: 'Kecamatan',    required: false },
    { key: 'kota',       label: 'Kota',         required: false },
    { key: 'frekuensi',  label: 'Frekuensi',    required: false },
    { key: 'petugas',    label: 'Petugas',      required: false },
    { key: 'catatan',    label: 'Catatan',      required: false },
  ],
  prospek_kotak: [
    { key: 'nama_toko', label: 'Nama Toko',    required: true },
    { key: 'pemilik',   label: 'Nama Pemilik', required: false },
    { key: 'hp',        label: 'No. HP',       required: false },
    { key: 'alamat',    label: 'Alamat',       required: false },
    { key: 'kecamatan', label: 'Kecamatan',    required: false },
    { key: 'kota',      label: 'Kota',         required: false },
    { key: 'petugas',   label: 'Petugas',      required: false },
    { key: 'catatan',   label: 'Catatan',      required: false },
  ],
  donatur_waqaf: [
    { key: 'nama',    label: 'Nama Lengkap',    required: true },
    { key: 'hp',      label: 'No. HP',          required: false },
    { key: 'alamat',  label: 'Alamat',          required: false },
    { key: 'kota',    label: 'Kota',            required: false },
    { key: 'nominal', label: 'Nominal Donasi',  required: false },
    { key: 'tgl_donasi', label: 'Tgl Donasi',  required: false },
    { key: 'metode',  label: 'Metode Bayar',    required: false },
    { key: 'petugas', label: 'Petugas',         required: false },
    { key: 'catatan', label: 'Catatan',         required: false },
  ],
  prospek_waqaf: [
    { key: 'nama',           label: 'Nama Lengkap',      required: true },
    { key: 'hp',             label: 'No. HP',            required: false },
    { key: 'kota',           label: 'Kota',              required: false },
    { key: 'nominal_potensi',label: 'Potensi Donasi',    required: false },
    { key: 'petugas',        label: 'Petugas',           required: false },
    { key: 'catatan',        label: 'Catatan',           required: false },
  ],
};

// Template kolom
const TEMPLATES = {
  donatur_rutin:  ['Nama Lengkap','No. HP','Alamat','Kota','Program Donasi','Nominal/Bulan','Metode Bayar','Tgl Mulai','Petugas','Catatan'],
  kotak_infaq:    ['Nama Kotak','Nama Toko','Nama Pemilik','No. HP','Alamat','Kecamatan','Kota','Frekuensi','Petugas','Catatan'],
  calon_donatur:  ['Nama Lengkap','No. HP','Alamat','Kota','Potensi Donasi','Petugas','Catatan'],
};

// ---- DRAG DROP ----
document.addEventListener('DOMContentLoaded', () => {
  const dz = document.getElementById('dropZone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
});

window.onTargetChange = function() {
  // Reset jika ganti target
  rawData = []; mappedData = [];
  showStep(1);
  document.getElementById('fileInfo').style.display = 'none';
  document.getElementById('fileInput').value = '';
};

// ---- BACA FILE ----
window.handleFile = function(file) {
  if (!file) return;
  const target = document.getElementById('importTarget').value;
  if (!target) { toast('Pilih tujuan import terlebih dahulu', 'warn'); return; }

  const ext = file.name.split('.').pop().toLowerCase();
  const info = document.getElementById('fileInfo');
  info.style.display = 'block';
  info.textContent = `📄 ${file.name} (${(file.size/1024).toFixed(1)} KB) — Membaca...`;

  const reader = new FileReader();

  if (ext === 'csv') {
    reader.onload = e => {
      const text = e.target.result;
      parseCSV(text);
      info.textContent = `✓ ${file.name} — ${rawData.length} baris ditemukan`;
      showStep(2);
      buildMapping();
    };
    reader.readAsText(file, 'UTF-8');
  } else {
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (json.length < 2) { toast('File kosong atau tidak ada data', 'warn'); return; }
        // Baris pertama = header, sisanya = data
        const headers = json[0].map(h => String(h).trim());
        rawData = json.slice(1).filter(row => row.some(c => c !== '')).map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = String(row[i] ?? '').trim());
          return obj;
        });
        info.textContent = `✓ ${file.name} — ${rawData.length} baris ditemukan`;
        showStep(2);
        buildMapping();
      } catch(err) {
        toast('Gagal membaca file: ' + err.message, 'err');
      }
    };
    reader.readAsArrayBuffer(file);
  }
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return;
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim());
  rawData = lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
    const obj = {};
    headers.forEach((h, i) => obj[h] = (vals[i] || '').replace(/^"|"$/g,'').trim());
    return obj;
  });
}

// ---- MAPPING UI ----
function buildMapping() {
  const target = document.getElementById('importTarget').value;
  const fields = FIELD_DEFS[target] || [];
  const excelCols = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  // Auto-match: cocokkan kolom Excel dengan field sistem
  const autoMatch = {};
  fields.forEach(f => {
    const match = excelCols.find(c => {
      const cn = c.toLowerCase().replace(/[\s\/\-_\.]/g,'');
      const fn = f.label.toLowerCase().replace(/[\s\/\-_\.]/g,'');
      const fk = f.key.toLowerCase().replace(/[\s\/\-_\.]/g,'');
      return cn === fn || cn === fk || cn.includes(fk) || fk.includes(cn);
    });
    if (match) autoMatch[f.key] = match;
  });

  const html = fields.map(f => `
    <div class="map-row">
      <div class="map-col-excel">
        ${f.label} ${f.required ? '<span style="color:var(--danger)">*</span>' : ''}
      </div>
      <div class="map-arrow">←</div>
      <div class="map-col-system">
        <select class="fctrl" id="map_${f.key}" style="font-size:12px">
          <option value="">-- Tidak dipakai --</option>
          ${excelCols.map(c => `<option value="${c}" ${autoMatch[f.key]===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div style="font-size:11px;color:var(--gray-400);min-width:80px">
        ${autoMatch[f.key] ? '<span style="color:var(--success)">✓ Auto</span>' : ''}
      </div>
    </div>`).join('');

  document.getElementById('mappingContainer').innerHTML = html;
}

// ---- PREVIEW ----
window.previewData = function() {
  const target = document.getElementById('importTarget').value;
  const fields = FIELD_DEFS[target] || [];

  // Cek required fields
  const missing = fields.filter(f => f.required && !document.getElementById(`map_${f.key}`)?.value);
  if (missing.length) {
    toast(`Kolom wajib belum dipetakan: ${missing.map(f=>f.label).join(', ')}`, 'warn');
    return;
  }

  // Build mapped data
  mappedData = rawData.map(row => {
    const obj = {};
    fields.forEach(f => {
      const col = document.getElementById(`map_${f.key}`)?.value;
      obj[f.key] = col ? row[col] : '';
    });
    return obj;
  }).filter(row => {
    const reqField = fields.find(f => f.required);
    return reqField ? !!row[reqField.key] : true;
  });

  if (!mappedData.length) { toast('Tidak ada data valid setelah mapping', 'warn'); return; }

  // Render preview
  const previewFields = fields.filter(f => document.getElementById(`map_${f.key}`)?.value);
  document.getElementById('previewHead').innerHTML = `<tr>${previewFields.map(f=>`<th>${f.label}</th>`).join('')}</tr>`;
  document.getElementById('previewBody').innerHTML = mappedData.slice(0, 20).map((row,i) => `
    <tr>
      ${previewFields.map(f => `<td style="font-size:12px">${row[f.key]||'-'}</td>`).join('')}
    </tr>`).join('');

  document.getElementById('previewInfo').textContent =
    `Menampilkan ${Math.min(20, mappedData.length)} dari ${mappedData.length} baris yang akan diimport` +
    (mappedData.length > 20 ? ' (scroll untuk lihat lebih)' : '');

  showStep(3);
};

// ---- IMPORT ----
window.doImport = function() {
  const target = document.getElementById('importTarget').value;
  const dupMode = document.getElementById('dupMode').value;
  const existing = DB.get(target);
  const dupKey = getDupKey(target);

  let sukses = 0, skip = 0, update = 0, error = 0;
  const results = [];
  const newData = [...existing];

  mappedData.forEach(row => {
    try {
      const record = buildRecord(target, row);
      if (!record) { error++; results.push({ ok: false, msg: `Baris dilewati: data tidak lengkap` }); return; }

      // Cek duplikat
      const existIdx = dupKey ? newData.findIndex(e => e[dupKey] === record[dupKey]) : -1;

      if (existIdx >= 0) {
        if (dupMode === 'update') {
          newData[existIdx] = { ...newData[existIdx], ...record, id: newData[existIdx].id };
          update++;
          results.push({ ok: true, msg: `Diperbarui: ${record[getNameKey(target)]}` });
        } else {
          skip++;
          results.push({ ok: false, msg: `Dilewati (sudah ada): ${record[getNameKey(target)]}` });
        }
      } else {
        newData.push(record);
        sukses++;
        results.push({ ok: true, msg: `Ditambahkan: ${record[getNameKey(target)]}` });
      }
    } catch(e) {
      error++;
      results.push({ ok: false, msg: `Error: ${e.message}` });
    }
  });

  DB.set(target, newData);

  // Tampilkan hasil
  const summary = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:20px">
      <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Ditambahkan</div><div class="val">${sukses}</div></div></div>
      <div class="stat"><div class="stat-ico ic-blue">🔄</div><div class="stat-body"><div class="lbl">Diperbarui</div><div class="val">${update}</div></div></div>
      <div class="stat"><div class="stat-ico ic-yellow">⏭️</div><div class="stat-body"><div class="lbl">Dilewati</div><div class="val">${skip}</div></div></div>
      <div class="stat"><div class="stat-ico ic-red">❌</div><div class="stat-body"><div class="lbl">Error</div><div class="val">${error}</div></div></div>
    </div>
    <div style="max-height:300px;overflow-y:auto;border:1px solid var(--gray-200);border-radius:8px;padding:12px">
      ${results.map(r => `<div class="result-item ${r.ok?'ri-ok':'ri-err'}">
        <span>${r.ok?'✓':'✕'}</span><span>${r.msg}</span>
      </div>`).join('')}
    </div>`;

  document.getElementById('importResult').innerHTML = summary;
  showStep(4);
  toast(`Import selesai: ${sukses} ditambahkan, ${update} diperbarui, ${skip} dilewati`, 'ok');
};

function buildRecord(target, row) {
  const base = { id: uid(), created_at: new Date().toISOString() };

  if (target === 'donatur_rutin') {
    if (!row.nama) return null;
    return { ...base, nama: row.nama, hp: row.hp||'', alamat: row.alamat||'',
      kota: row.kota||'', program: row.program||'',
      nominal: parseNominal(row.nominal), metode: row.metode||'transfer',
      tgl_mulai: parseDate(row.tgl_mulai) || new Date().toISOString().split('T')[0],
      status: 'aktif', petugas: row.petugas||'', catatan: row.catatan||'' };
  }
  if (target === 'prospek_rutin') {
    if (!row.nama) return null;
    return { ...base, nama: row.nama, hp: row.hp||'', alamat: row.alamat||'',
      kota: row.kota||'', nominal_potensi: parseNominal(row.nominal_potensi),
      status: 'baru', petugas: row.petugas||'', catatan: row.catatan||'' };
  }
  if (target === 'kotak_infaq') {
    if (!row.nama_kotak || !row.nama_toko) return null;
    return { ...base, nama_kotak: row.nama_kotak, nama_toko: row.nama_toko,
      pemilik: row.pemilik||'', hp: row.hp||'', alamat: row.alamat||'',
      kecamatan: row.kecamatan||'', kota: row.kota||'',
      frekuensi: row.frekuensi||'bulanan', petugas: row.petugas||'',
      nominal_terakhir: 0, tgl_ambil: null, status: 'aktif', catatan: row.catatan||'' };
  }
  if (target === 'prospek_kotak') {
    if (!row.nama_toko) return null;
    return { ...base, nama_toko: row.nama_toko, pemilik: row.pemilik||'',
      hp: row.hp||'', alamat: row.alamat||'', kecamatan: row.kecamatan||'',
      kota: row.kota||'', status: 'baru', petugas: row.petugas||'', catatan: row.catatan||'' };
  }
  if (target === 'donatur_waqaf') {
    if (!row.nama) return null;
    return { ...base, nama: row.nama, hp: row.hp||'', alamat: row.alamat||'',
      kota: row.kota||'', nominal: parseNominal(row.nominal),
      tgl_donasi: parseDate(row.tgl_donasi) || new Date().toISOString().split('T')[0],
      metode: row.metode||'transfer', status: 'lunas',
      petugas: row.petugas||'', catatan: row.catatan||'' };
  }
  if (target === 'prospek_waqaf') {
    if (!row.nama) return null;
    return { ...base, nama: row.nama, hp: row.hp||'', kota: row.kota||'',
      nominal_potensi: parseNominal(row.nominal_potensi),
      status: 'baru', petugas: row.petugas||'', catatan: row.catatan||'' };
  }
  return null;
}

function getDupKey(target) {
  const map = { donatur_rutin:'hp', prospek_rutin:'hp', kotak_infaq:'nama_kotak',
    prospek_kotak:'nama_toko', donatur_waqaf:'hp', prospek_waqaf:'hp' };
  return map[target] || null;
}

function getNameKey(target) {
  const map = { donatur_rutin:'nama', prospek_rutin:'nama', kotak_infaq:'nama_kotak',
    prospek_kotak:'nama_toko', donatur_waqaf:'nama', prospek_waqaf:'nama' };
  return map[target] || 'nama';
}

function parseNominal(val) {
  if (!val) return 0;
  return parseInt(String(val).replace(/[^0-9]/g,'')) || 0;
}

function parseDate(val) {
  if (!val) return null;
  // Coba parse berbagai format
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [d,m,y] = s.split('/'); return `${y}-${m}-${d}`;
  }
  // Excel serial number
  const n = Number(s);
  if (!isNaN(n) && n > 30000) {
    const d = new Date((n - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  return null;
}

// ---- TEMPLATE DOWNLOAD ----
window.downloadTemplate = function(type) {
  const headers = TEMPLATES[type] || TEMPLATES.donatur_rutin;
  const example = {
    donatur_rutin: [['Budi Santoso','081234567890','Jl. Merdeka No.1','Jakarta','Beasiswa Anak Yatim','500000','transfer','2026-01-01','Ahmad','']],
    kotak_infaq: [['Kotak Warung Bu Sri','Warung Bu Sri','Bu Sri','081111222333','Jl. Raya No.5','Kebayoran','Jakarta Selatan','bulanan','Ahmad','']],
    calon_donatur: [['Siti Rahayu','082345678901','Jl. Sudirman No.3','Bandung','300000','Citra','Minat donatur rutin']],
  };
  const rows = [headers, ...(example[type] || [['','','','','','','','','',''].slice(0, headers.length)])];

  // Buat workbook dengan SheetJS jika tersedia
  if (typeof XLSX !== 'undefined') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `Template_${type}.xlsx`);
  } else {
    // Fallback CSV
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'}));
    a.download = `Template_${type}.csv`;
    a.click();
  }
  toast('Template berhasil didownload', 'ok');
};

// ---- UTILS ----
function showStep(n) {
  [1,2,3,4].forEach(i => {
    const el = document.getElementById(`step${i}`);
    if (el) el.style.display = i === n ? 'block' : 'none';
  });
}

window.resetImport = function() {
  rawData = []; mappedData = [];
  document.getElementById('fileInput').value = '';
  document.getElementById('fileInfo').style.display = 'none';
  showStep(1);
};
