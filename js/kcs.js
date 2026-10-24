let pgSantri=1, pgBayarSCS=1;
const PS=15;

document.addEventListener('DOMContentLoaded', async () => {
  loadSCSStats(); loadSantri(); loadBayarSCS();
  initTabs('scsTabs', t => {
    if (t==='paneSantri') loadSantri();
    else loadBayarSCS();
  });

  document.getElementById('btnTambahSCS').addEventListener('click', () => {
    const tab = document.querySelector('#scsTabs .tab.active').dataset.target;
    if (tab==='paneSantri') openModalSantri();
    else openModalBayarSCS();
  });

  ['srSantri','flKelas','flHalaqoh','flStSantri'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(() => { pgSantri=1; loadSantri(); }));
    document.getElementById(id)?.addEventListener('change', () => { pgSantri=1; loadSantri(); });
  });
  ['srBayarSCS','flKelasBayar','flBulanBayar'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(() => { pgBayarSCS=1; loadBayarSCS(); }));
    document.getElementById(id)?.addEventListener('change', () => { pgBayarSCS=1; loadBayarSCS(); });
  });

  await Promise.all([DB.sync('scs_santri'), DB.sync('scs_pembayaran'), DB.sync('petugas')]);
  loadSCSStats(); loadSantri(); loadBayarSCS(); loadFilterOptions();
});

function loadFilterOptions() {
  const santri = DB.get('scs_santri');
  const kelas = [...new Set(santri.map(s=>s.kelas).filter(Boolean))].sort();
  const halaqoh = [...new Set(santri.map(s=>s.halaqoh).filter(Boolean))].sort();

  ['flKelas','flKelasBayar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Semua Kelas</option>' + kelas.map(k=>`<option value="${k}">${k}</option>`).join('');
  });
  document.getElementById('flHalaqoh').innerHTML = '<option value="">Semua Halaqoh</option>' + halaqoh.map(h=>`<option value="${h}">${h}</option>`).join('');
}

function loadSCSStats() {
  const santri = DB.get('scs_santri');
  const bayar = DB.get('scs_pembayaran');
  const bulanIni = new Date().toISOString().slice(0,7);
  const totalBulanIni = bayar.filter(b=>b.tgl_bayar?.startsWith(bulanIni)).reduce((s,b)=>s+(+b.nominal||0),0);
  const totalSemua = bayar.reduce((s,b)=>s+(+b.nominal||0),0);
  const kelas = [...new Set(santri.map(s=>s.kelas).filter(Boolean))];

  document.getElementById('scsStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">🎓</div><div class="stat-body"><div class="lbl">Total Santri</div><div class="val">${santri.filter(s=>s.status==='aktif').length}</div><div class="sub">${santri.length} terdaftar · ${kelas.length} kelas</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💰</div><div class="stat-body"><div class="lbl">Sedekah Bulan Ini</div><div class="val rupiah" style="font-size:14px">${rupiah(totalBulanIni)}</div><div class="sub">${bayar.filter(b=>b.tgl_bayar?.startsWith(bulanIni)).length} transaksi</div></div></div>
    <div class="stat"><div class="stat-ico ic-purple">📊</div><div class="stat-body"><div class="lbl">Total Sedekah</div><div class="val rupiah" style="font-size:14px">${rupiah(totalSemua)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">📋</div><div class="stat-body"><div class="lbl">Riwayat</div><div class="val">${bayar.length}</div><div class="sub">total transaksi</div></div></div>
  `;
}

// ===== DATA SANTRI =====
function loadSantri() {
  let data = DB.get('scs_santri');
  const sr = document.getElementById('srSantri').value.toLowerCase();
  const kel = document.getElementById('flKelas').value;
  const hal = document.getElementById('flHalaqoh').value;
  const st = document.getElementById('flStSantri').value;
  if (sr) data = data.filter(s=>s.nama.toLowerCase().includes(sr)||(s.panggilan||'').toLowerCase().includes(sr));
  if (kel) data = data.filter(s=>s.kelas===kel);
  if (hal) data = data.filter(s=>s.halaqoh===hal);
  if (st) data = data.filter(s=>s.status===st);
  document.getElementById('cntSantri').textContent = data.length;
  const { items, total } = paginate(data, pgSantri, PS);
  const offset = (pgSantri-1)*PS;
  document.getElementById('tblSantri').innerHTML = items.length ? items.map((s,i) => `
    <tr>
      <td style="text-align:center;color:var(--gray-400)">${offset+i+1}</td>
      <td style="font-weight:600">${s.nama}</td>
      <td style="font-size:12px">${s.panggilan||'-'}</td>
      <td><span class="badge b-blue" style="font-size:11px">${s.kelas||'-'}</span></td>
      <td style="font-size:12px">${s.halaqoh||'-'}</td>
      <td>${badge(s.status)}</td>
      <td><div class="td-actions">
        <button class="btn btn-success btn-sm" onclick="openModalBayarSCS('${s.id}')">💰 Catat</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalSantri('${s.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusSantri('${s.id}')">🗑️</button>
      </div></td>
    </tr>`).join('')
  : `<tr><td colspan="7"><div class="empty"><div class="ei">🎓</div><div class="et">Belum ada data santri</div></div></td></tr>`;
  renderPagination('pagSantri', total, pgSantri, PS, 'goPgSantri');
}
window.goPgSantri = p => { pgSantri=p; loadSantri(); };

window.openModalSantri = function(id=null) {
  const s = id ? DB.get('scs_santri').find(x=>x.id===id) : null;
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovSantri">
    <div class="modal">
      <div class="modal-head"><h3>${s?'Edit':'Tambah'} Santri SCS</h3><button class="modal-close" onclick="closeModal('ovSantri')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Nama Lengkap *</label><input id="sNama" class="fctrl" value="${s?.nama||''}"></div>
          <div class="fg"><label class="flabel">Panggilan</label><input id="sPanggilan" class="fctrl" value="${s?.panggilan||''}"></div>
          <div class="fg"><label class="flabel">Kelas</label><input id="sKelas" class="fctrl" value="${s?.kelas||''}" placeholder="cth: 7A"></div>
          <div class="fg"><label class="flabel">Halaqoh</label><input id="sHalaqoh" class="fctrl" value="${s?.halaqoh||''}" placeholder="cth: Al-Fatih"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="sStatus" class="fctrl">
              <option value="aktif" ${s?.status==='aktif'||!s?'selected':''}>Aktif</option>
              <option value="tidak_aktif" ${s?.status==='tidak_aktif'?'selected':''}>Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovSantri')">Batal</button>
        <button class="btn btn-primary" onclick="saveSantri('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveSantri = async function(id) {
  const nama = document.getElementById('sNama').value.trim();
  if (!nama) { toast('Nama wajib diisi','warn'); return; }
  const btn = document.querySelector('#ovSantri .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Menyimpan...'; }
  const payload = {
    nama,
    panggilan: document.getElementById('sPanggilan').value.trim(),
    kelas: document.getElementById('sKelas').value.trim(),
    halaqoh: document.getElementById('sHalaqoh').value.trim(),
    status: document.getElementById('sStatus').value
  };
  const r = id ? await DB.update('scs_santri',id,payload) : await DB.insert('scs_santri',payload);
  if (!r) { toast('Gagal menyimpan','err'); return; }
  await DB.sync('scs_santri', {force:true});
  toast(id?'Data diperbarui':'Santri ditambahkan','ok');
  closeModal('ovSantri'); loadSCSStats(); loadSantri(); loadFilterOptions();
};

window.hapusSantri = async function(id) {
  if (!await confirmDel('Hapus santri ini? Riwayat sedekahnya juga akan terhapus.')) return;
  if (!await DB.delete('scs_santri',id)) { toast('Gagal menghapus','err'); return; }
  await DB.sync('scs_santri', {force:true});
  toast('Dihapus','ok'); loadSCSStats(); loadSantri();
};

// ===== RIWAYAT SEDEKAH =====
function loadBayarSCS() {
  let data = DB.get('scs_pembayaran');
  const santri = DB.get('scs_santri');
  const sr = document.getElementById('srBayarSCS').value.toLowerCase();
  const kel = document.getElementById('flKelasBayar').value;
  const bln = document.getElementById('flBulanBayar').value;
  if (sr) data = data.filter(b=>(b.nama_santri||'').toLowerCase().includes(sr));
  if (kel) data = data.filter(b=>b.kelas===kel);
  if (bln) data = data.filter(b=>b.tgl_bayar?.slice(5,7)===bln);
  data.sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  document.getElementById('cntBayar').textContent = data.length;
  const { items, total } = paginate(data, pgBayarSCS, PS);
  document.getElementById('tblBayarSCS').innerHTML = items.length ? items.map(b => `
    <tr>
      <td style="font-weight:600">${b.nama_santri||'-'}</td>
      <td><span class="badge b-blue" style="font-size:11px">${b.kelas||'-'}</span></td>
      <td style="font-size:12px">${b.halaqoh||'-'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(b.nominal)}</td>
      <td style="font-size:12px">${tgl(b.tgl_bayar)}</td>
      <td style="font-size:12px">${b.petugas||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${b.catatan||'-'}</td>
      <td><button class="btn btn-ghost btn-sm btn-icon" onclick="hapusBayarSCS('${b.id}')">🗑️</button></td>
    </tr>`).join('')
  : `<tr><td colspan="8"><div class="empty"><div class="ei">💰</div><div class="et">Belum ada riwayat sedekah</div></div></td></tr>`;
  renderPagination('pagBayarSCS', total, pgBayarSCS, PS, 'goPgBayarSCS');
}
window.goPgBayarSCS = p => { pgBayarSCS=p; loadBayarSCS(); };

window.openModalBayarSCS = function(santriId=null) {
  const santriList = DB.get('scs_santri').filter(s=>s.status==='aktif');
  const sel = santriId ? santriList.find(s=>s.id===santriId) : null;
  const opts = santriList.map(s=>`<option value="${s.id}" ${s.id===santriId?'selected':''}>${s.nama} (${s.kelas||'-'})</option>`).join('');
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovBayarSCS">
    <div class="modal">
      <div class="modal-head"><h3>💰 Catat Sedekah</h3><button class="modal-close" onclick="closeModal('ovBayarSCS')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Santri *</label>
            <select id="bSantri" class="fctrl" onchange="autoFillSantri(this)">
              <option value="">-- Pilih Santri --</option>${opts}
            </select>
          </div>
          <div class="fg"><label class="flabel">Nominal (Rp) *</label><input type="number" id="bNominalSCS" class="fctrl" placeholder="0"></div>
          <div class="fg"><label class="flabel">Tanggal *</label><input type="date" id="bTglSCS" class="fctrl" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="fg"><label class="flabel">Petugas</label>${petugasSelect('bPetugasSCS', '')}</div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><input id="bCatatanSCS" class="fctrl" placeholder="Opsional"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovBayarSCS')">Batal</button>
        <button class="btn btn-primary" onclick="saveBayarSCS()">Simpan</button>
      </div>
    </div>
  </div>`);
  initPetugasSelect('bPetugasSCS');
};

window.autoFillSantri = function(sel) {};

window.saveBayarSCS = async function() {
  const santriId = document.getElementById('bSantri').value;
  const nominal = +document.getElementById('bNominalSCS').value;
  const tglBayar = document.getElementById('bTglSCS').value;
  if (!santriId || !nominal || !tglBayar) { toast('Santri, nominal, dan tanggal wajib diisi','warn'); return; }
  const santri = DB.get('scs_santri').find(s=>s.id===santriId);
  const btn = document.querySelector('#ovBayarSCS .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Menyimpan...'; }
  const payload = {
    santri_id: santriId,
    nama_santri: santri?.nama||'',
    kelas: santri?.kelas||'',
    halaqoh: santri?.halaqoh||'',
    nominal, tgl_bayar: tglBayar,
    petugas: getPetugas('bPetugasSCS'),
    catatan: document.getElementById('bCatatanSCS').value.trim()
  };
  const r = await DB.insert('scs_pembayaran', payload);
  if (!r) { toast('Gagal menyimpan','err'); return; }
  await DB.sync('scs_pembayaran', {force:true});
  toast('Sedekah berhasil dicatat','ok');
  closeModal('ovBayarSCS'); loadSCSStats(); loadBayarSCS();
};

window.hapusBayarSCS = async function(id) {
  if (!await confirmDel()) return;
  if (!await DB.delete('scs_pembayaran',id)) { toast('Gagal menghapus','err'); return; }
  await DB.sync('scs_pembayaran', {force:true});
  toast('Dihapus','ok'); loadSCSStats(); loadBayarSCS();
};

// ===== IMPORT EXCEL =====
window.importSantri = function() {
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovImportSCS">
    <div class="modal" style="max-width:500px">
      <div class="modal-head"><h3>⬆️ Import Data Santri SCS</h3><button class="modal-close" onclick="closeModal('ovImportSCS')">✕</button></div>
      <div class="modal-body">
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:14px;margin-bottom:16px;font-size:12px;color:var(--gray-600)">
          <strong>Format kolom:</strong> <code>nama, panggilan, kelas, halaqoh</code><br><br>
          <button class="btn btn-outline btn-sm" onclick="downloadTemplateSCS()">⬇️ Download Template</button>
        </div>
        <div class="fg">
          <label class="flabel">Pilih File Excel / CSV</label>
          <input type="file" id="fileSCS" class="fctrl" accept=".xlsx,.xls,.csv">
        </div>
        <div id="importSCSResult" style="margin-top:12px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovImportSCS')">Tutup</button>
        <button class="btn btn-primary" onclick="prosesImportSCS()">Import</button>
      </div>
    </div>
  </div>`);
};

window.downloadTemplateSCS = function() {
  const headers = ['nama','panggilan','kelas','halaqoh'];
  const contoh = [
    ['Ahmad Fauzi Ramadhan','Fauzi','7A','Al-Fatih'],
    ['Siti Aisyah Putri','Aisyah','8B','Al-Ikhlas'],
    ['Muhammad Rizki','Rizki','9A','Al-Furqon']
  ];
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.aoa_to_sheet([headers,...contoh]);
    ws['!cols'] = [{wch:30},{wch:15},{wch:8},{wch:15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Santri SCS');
    XLSX.writeFile(wb, 'Template_Santri_SCS.xlsx');
  } else {
    const csv = [headers,...contoh].map(r=>r.map(c=>`"${c}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='Template_Santri_SCS.csv'; a.click();
  }
  toast('Template didownload','ok');
};

window.prosesImportSCS = async function() {
  const file = document.getElementById('fileSCS').files[0];
  if (!file) { toast('Pilih file dulu','warn'); return; }
  const btn = document.querySelector('#ovImportSCS .btn-primary');
  btn.disabled=true; btn.textContent='Memproses...';

  let rows = [];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    // Ambil semua data termasuk baris header-nya
    const raw = XLSX.utils.sheet_to_json(ws, {defval:'', header:1});
    if (raw.length < 2) { toast('File kosong','warn'); btn.disabled=false; btn.textContent='Import'; return; }

    // Cari baris header — baris yang ada kata "nama" (case insensitive)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(raw.length, 5); i++) {
      const row = raw[i].map(c => String(c||'').toLowerCase().trim());
      if (row.some(c => c === 'nama')) { headerIdx = i; break; }
    }
    if (headerIdx === -1) { toast('Kolom "nama" tidak ditemukan di file','err'); btn.disabled=false; btn.textContent='Import'; return; }

    const headers = raw[headerIdx].map(c => String(c||'').toLowerCase().trim().replace(/\s+/g,'_'));
    rows = raw.slice(headerIdx+1)
      .filter(r => r.some(c => c !== '' && c !== null && c !== undefined))
      .map(r => {
        const obj = {};
        headers.forEach((h,i) => { if(h) obj[h] = String(r[i]||'').trim(); });
        return obj;
      });
  } catch(e) { toast('Gagal membaca file: '+e.message,'err'); btn.disabled=false; btn.textContent='Import'; return; }

  let sukses=0, skip=0;
  const skipList = [];
  for (const row of rows) {
    // Coba berbagai key untuk nama
    const nama = (row.nama || row['nama_lengkap'] || row['nama lengkap'] || '').trim();
    if (!nama) { skip++; skipList.push('Baris kosong'); continue; }
    const payload = {
      nama,
      panggilan: row.panggilan || row.nickname || '',
      kelas: row.kelas || '',
      halaqoh: row.halaqoh || row.halaqah || '',
      status: 'aktif'
    };
    const r = await DB.insert('scs_santri', payload);
    if (r) sukses++; else { skip++; skipList.push(nama); }
  }
  await DB.sync('scs_santri', {force:true});

  document.getElementById('importSCSResult').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Berhasil</div><div class="val">${sukses}</div></div></div>
      <div class="stat"><div class="stat-ico ic-yellow">⏭️</div><div class="stat-body"><div class="lbl">Dilewati</div><div class="val">${skip}</div></div></div>
    </div>
    ${skipList.length && sukses===0 ? `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px;font-size:12px;margin-bottom:8px">
      <strong>Header terdeteksi tidak cocok.</strong> Pastikan file punya kolom bernama persis: <code>nama, panggilan, kelas, halaqoh</code>
    </div>` : ''}
    <div style="font-size:12px;color:var(--success);font-weight:600">${sukses} santri berhasil diimport!</div>
  `;
  btn.disabled=false; btn.textContent='Import';
  loadSCSStats(); loadSantri(); loadFilterOptions();
};

function exportSCS() {
  const tab = document.querySelector('#scsTabs .tab.active').dataset.target;
  if (tab==='paneSantri') {
    const data = DB.get('scs_santri').map(s=>({nama:s.nama, panggilan:s.panggilan||'', kelas:s.kelas||'', halaqoh:s.halaqoh||'', status:s.status}));
    exportExcel(data, 'DataSantriSCS', 'Santri SCS');
  } else {
    const data = DB.get('scs_pembayaran').map(b=>({nama_santri:b.nama_santri, kelas:b.kelas||'', halaqoh:b.halaqoh||'', nominal:b.nominal, tgl_bayar:b.tgl_bayar, petugas:b.petugas||'', catatan:b.catatan||''}));
    exportExcel(data, 'RiwayatSedekahSCS', 'Sedekah SCS');
  }
}
