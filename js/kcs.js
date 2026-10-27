let pgSantri=1, pgBayarSCS=1, pgUstadz=1, pgBayarS3=1;
const PS=15;

document.addEventListener('DOMContentLoaded', async () => {
  loadSCSStats(); loadUstadz(); loadSantri(); loadBayarSCS(); loadBayarS3();
  initTabs('scsTabs', t => {
    if (t==='paneUstadz') loadUstadz();
    else if (t==='paneSantri') loadSantri();
    else if (t==='paneBayar') loadBayarSCS();
    else if (t==='paneBayarS3') loadBayarS3();
  });

  document.getElementById('btnTambahSCS').addEventListener('click', () => {
    const tab = document.querySelector('#scsTabs .tab.active').dataset.target;
    if (tab==='paneUstadz') openModalUstadz();
    else if (tab==='paneSantri') openModalSantri();
    else if (tab==='paneBayarS3') openModalBayarS3();
    else openModalBayarSCS();
  });

  ['srUstadz','flStUstadz'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(() => { pgUstadz=1; loadUstadz(); }));
    document.getElementById(id)?.addEventListener('change', () => { pgUstadz=1; loadUstadz(); });
  });
  ['srSantri','flKelas','flHalaqoh','flStSantri'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(() => { pgSantri=1; loadSantri(); }));
    document.getElementById(id)?.addEventListener('change', () => { pgSantri=1; loadSantri(); });
  });
  ['srBayarSCS','flKelasBayar','flBulanBayar'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(() => { pgBayarSCS=1; loadBayarSCS(); }));
    document.getElementById(id)?.addEventListener('change', () => { pgBayarSCS=1; loadBayarSCS(); });
  });
  ['srBayarS3','flBulanBayarS3'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(() => { pgBayarS3=1; loadBayarS3(); }));
    document.getElementById(id)?.addEventListener('change', () => { pgBayarS3=1; loadBayarS3(); });
  });

  await Promise.all([DB.sync('s3_ustadz'), DB.sync('s3_pembayaran'), DB.sync('scs_santri'), DB.sync('scs_pembayaran'), DB.sync('petugas')]);
  loadSCSStats(); loadUstadz(); loadSantri(); loadBayarSCS(); loadBayarS3(); loadFilterOptions();
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
  const ustadz = DB.get('s3_ustadz');
  const santri = DB.get('scs_santri');
  const bayar = DB.get('scs_pembayaran');
  const bayarS3 = DB.get('s3_pembayaran');
  const bulanIni = new Date().toISOString().slice(0,7);
  const totalBulanIni = bayar.filter(b=>b.tgl_bayar?.startsWith(bulanIni)).reduce((s,b)=>s+(+b.nominal||0),0)
    + bayarS3.filter(b=>b.tgl_bayar?.startsWith(bulanIni)).reduce((s,b)=>s+(+b.nominal||0),0);
  const totalSemua = bayar.reduce((s,b)=>s+(+b.nominal||0),0) + bayarS3.reduce((s,b)=>s+(+b.nominal||0),0);
  const kelas = [...new Set(santri.map(s=>s.kelas).filter(Boolean))];

  document.getElementById('scsStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-purple">👨‍🏫</div><div class="stat-body"><div class="lbl">Ustadz/Ustadzah</div><div class="val">${ustadz.filter(u=>u.status==='aktif').length}</div><div class="sub">${ustadz.length} terdaftar</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">🎓</div><div class="stat-body"><div class="lbl">Total Santri</div><div class="val">${santri.filter(s=>s.status==='aktif').length}</div><div class="sub">${santri.length} terdaftar · ${kelas.length} kelas</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💰</div><div class="stat-body"><div class="lbl">Sedekah Bulan Ini</div><div class="val rupiah" style="font-size:14px">${rupiah(totalBulanIni)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">📊</div><div class="stat-body"><div class="lbl">Total Sedekah</div><div class="val rupiah" style="font-size:14px">${rupiah(totalSemua)}</div></div></div>
  `;
}

// ===== DATA USTADZ/USTADZAH =====
function loadUstadz() {
  let data = DB.get('s3_ustadz');
  const sr = document.getElementById('srUstadz')?.value.toLowerCase()||'';
  const st = document.getElementById('flStUstadz')?.value||'';
  if (sr) data = data.filter(u=>u.nama.toLowerCase().includes(sr)||(u.panggilan||'').toLowerCase().includes(sr));
  if (st) data = data.filter(u=>u.status===st);
  document.getElementById('cntUstadz').textContent = data.length;
  const { items, total } = paginate(data, pgUstadz, PS);
  const offset = (pgUstadz-1)*PS;
  document.getElementById('tblUstadz').innerHTML = items.length ? items.map((u,i) => `
    <tr>
      <td style="text-align:center;color:var(--gray-400)">${offset+i+1}</td>
      <td style="font-weight:600">${u.nama}</td>
      <td style="font-size:12px">${u.panggilan||'-'}</td>
      <td style="font-size:12px">${u.amanah||'-'}</td>
      <td class="td-mono">${u.hp||'-'}</td>
      <td>${badge(u.status)}</td>
      <td><div class="td-actions">
        <button class="btn btn-success btn-sm" onclick="openModalBayarS3('${u.id}')">💰 Catat</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalUstadz('${u.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusUstadz('${u.id}')">🗑️</button>
      </div></td>
    </tr>`).join('')
  : `<tr><td colspan="7"><div class="empty"><div class="ei">👨‍🏫</div><div class="et">Belum ada data ustadz/ustadzah</div></div></td></tr>`;
  renderPagination('pagUstadz', total, pgUstadz, PS, 'goPgUstadz');
}
window.goPgUstadz = p => { pgUstadz=p; loadUstadz(); };

window.openModalUstadz = function(id=null) {
  const u = id ? DB.get('s3_ustadz').find(x=>x.id===id) : null;
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovUstadz">
    <div class="modal">
      <div class="modal-head"><h3>${u?'Edit':'Tambah'} Ustadz/Ustadzah</h3><button class="modal-close" onclick="closeModal('ovUstadz')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Nama Lengkap *</label><input id="uNama" class="fctrl" value="${u?.nama||''}"></div>
          <div class="fg"><label class="flabel">Panggilan</label><input id="uPanggilan" class="fctrl" value="${u?.panggilan||''}"></div>
          <div class="fg"><label class="flabel">Amanah / Jabatan</label><input id="uAmanah" class="fctrl" value="${u?.amanah||''}" placeholder="cth: Direktur, Sekretaris"></div>
          <div class="fg"><label class="flabel">No. HP</label><input id="uHP" class="fctrl" value="${u?.hp||''}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="uStatus" class="fctrl">
              <option value="aktif" ${u?.status==='aktif'||!u?'selected':''}>Aktif</option>
              <option value="tidak_aktif" ${u?.status==='tidak_aktif'?'selected':''}>Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovUstadz')">Batal</button>
        <button class="btn btn-primary" onclick="saveUstadz('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveUstadz = async function(id) {
  const nama = document.getElementById('uNama').value.trim();
  if (!nama) { toast('Nama wajib diisi','warn'); return; }
  const btn = document.querySelector('#ovUstadz .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Menyimpan...'; }
  const payload = {
    nama,
    panggilan: document.getElementById('uPanggilan').value.trim(),
    amanah: document.getElementById('uAmanah').value.trim(),
    hp: document.getElementById('uHP').value.trim(),
    status: document.getElementById('uStatus').value
  };
  const r = id ? await DB.update('s3_ustadz',id,payload) : await DB.insert('s3_ustadz',payload);
  if (!r) { toast('Gagal menyimpan','err'); return; }
  await DB.sync('s3_ustadz', {force:true});
  toast(id?'Data diperbarui':'Ustadz/Ustadzah ditambahkan','ok');
  closeModal('ovUstadz'); loadSCSStats(); loadUstadz();
};

window.hapusUstadz = async function(id) {
  if (!await confirmDel()) return;
  if (!await DB.delete('s3_ustadz',id)) { toast('Gagal menghapus','err'); return; }
  await DB.sync('s3_ustadz', {force:true});
  toast('Dihapus','ok'); loadSCSStats(); loadUstadz();
};

// Modal catat sedekah ustadz/ustadzah
window.openModalBayarS3 = function(ustadzId=null) {
  const list = DB.get('s3_ustadz').filter(u=>u.status==='aktif');
  const sel = ustadzId ? list.find(u=>u.id===ustadzId) : null;
  const opts = list.map(u=>`<option value="${u.id}" ${u.id===ustadzId?'selected':''}>${u.nama}${u.panggilan?' ('+u.panggilan+')':''}</option>`).join('');
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovBayarS3">
    <div class="modal">
      <div class="modal-head"><h3>💰 Catat Sedekah S3</h3><button class="modal-close" onclick="closeModal('ovBayarS3')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Ustadz/Ustadzah *</label>
            <select id="bS3Ustadz" class="fctrl">
              <option value="">-- Pilih --</option>${opts}
            </select>
          </div>
          <div class="fg"><label class="flabel">Nominal (Rp) *</label><input type="number" id="bS3Nominal" class="fctrl" placeholder="0"></div>
          <div class="fg"><label class="flabel">Tanggal *</label><input type="date" id="bS3Tgl" class="fctrl" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="fg"><label class="flabel">Petugas</label>${petugasSelect('bS3Petugas','')}</div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><input id="bS3Catatan" class="fctrl" placeholder="Opsional"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovBayarS3')">Batal</button>
        <button class="btn btn-primary" onclick="saveBayarS3()">Simpan</button>
      </div>
    </div>
  </div>`);
  initPetugasSelect('bS3Petugas');
};

window.saveBayarS3 = async function() {
  const ustadzId = document.getElementById('bS3Ustadz').value;
  const nominal = +document.getElementById('bS3Nominal').value;
  const tglBayar = document.getElementById('bS3Tgl').value;
  if (!ustadzId || !nominal || !tglBayar) { toast('Semua field wajib diisi','warn'); return; }
  const ustadz = DB.get('s3_ustadz').find(u=>u.id===ustadzId);
  const btn = document.querySelector('#ovBayarS3 .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Menyimpan...'; }
  const payload = {
    ustadz_id: ustadzId,
    nama_ustadz: ustadz?.nama||'',
    amanah: ustadz?.amanah||'',
    nominal, tgl_bayar: tglBayar,
    petugas: getPetugas('bS3Petugas'),
    catatan: document.getElementById('bS3Catatan').value.trim()
  };
  const r = await DB.insert('s3_pembayaran', payload);
  if (!r) { toast('Gagal menyimpan','err'); return; }
  await DB.sync('s3_pembayaran', {force:true});
  toast('Sedekah S3 berhasil dicatat','ok');
  closeModal('ovBayarS3'); loadSCSStats();
};

// Import Ustadz
window.importUstadz = function() {
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovImportUstadz">
    <div class="modal" style="max-width:500px">
      <div class="modal-head"><h3>⬆️ Import Data Ustadz S3</h3><button class="modal-close" onclick="closeModal('ovImportUstadz')">✕</button></div>
      <div class="modal-body">
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px">
          Format kolom: <code>nama, panggilan, amanah, hp</code><br>
          File bisa punya judul di baris atas — sistem otomatis deteksi header.<br><br>
          <button class="btn btn-outline btn-sm" onclick="downloadTemplateUstadz()">⬇️ Download Template</button>
        </div>
        <div class="fg"><label class="flabel">Pilih File Excel</label>
          <input type="file" id="fileUstadz" class="fctrl" accept=".xlsx,.xls,.csv">
        </div>
        <div id="importUstadzResult" style="margin-top:12px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovImportUstadz')">Tutup</button>
        <button class="btn btn-primary" onclick="prosesImportUstadz()">Import</button>
      </div>
    </div>
  </div>`);
};

window.downloadTemplateUstadz = function() {
  const headers = ['nama','panggilan','amanah','hp'];
  const contoh = [
    ['K.H. Ahmad Yunus, M.Pd.I','Abah Yai','Direktur','081234567890'],
    ['Muji Haryono, SE.','Ust Muji','Sekertaris','082345678901'],
    ['Dra. Ec. Ratnah Fairuz','Umi','General Manager','083456789012']
  ];
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.aoa_to_sheet([headers,...contoh]);
    ws['!cols'] = [{wch:30},{wch:15},{wch:20},{wch:15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ustadz S3');
    XLSX.writeFile(wb, 'Template_Ustadz_S3.xlsx');
  } else {
    const csv = [headers,...contoh].map(r=>r.map(c=>`"${c}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='Template_Ustadz_S3.csv'; a.click();
  }
  toast('Template didownload','ok');
};

window.prosesImportUstadz = async function() {
  const file = document.getElementById('fileUstadz').files[0];
  if (!file) { toast('Pilih file dulu','warn'); return; }
  const btn = document.querySelector('#ovImportUstadz .btn-primary');
  btn.disabled=true; btn.textContent='Memproses...';
  let allRows=[];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf,{type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json(ws,{defval:'',header:1});
  } catch(e) { toast('Gagal membaca file','err'); btn.disabled=false; btn.textContent='Import'; return; }

  // Cari header baris yang ada "nama"
  let headerIdx=0, maxText=0;
  for (let i=0;i<Math.min(allRows.length,10);i++) {
    const tc = allRows[i].filter(c=>isNaN(String(c||'').trim())&&String(c||'').trim().length>1).length;
    if (tc>maxText){maxText=tc;headerIdx=i;}
  }
  const headers = allRows[headerIdx].map(c=>String(c||'').toLowerCase().trim());
  const rows = allRows.slice(headerIdx+1).filter(r=>r.some(c=>c!==''&&c!==null));

  const iNama = headers.findIndex(h=>h.includes('nama'));
  const iPang = headers.findIndex(h=>h.includes('panggil'));
  const iAman = headers.findIndex(h=>h.includes('amanah')||h.includes('jabat'));
  const iHP = headers.findIndex(h=>h.includes('hp')||h.includes('telp')||h.includes('phone'));

  let sukses=0, skip=0;
  for (const row of rows) {
    const nama = iNama>=0 ? String(row[iNama]||'').trim() : '';
    if (!nama) { skip++; continue; }
    const r = await DB.insert('s3_ustadz', {
      nama,
      panggilan: iPang>=0?String(row[iPang]||'').trim():'',
      amanah: iAman>=0?String(row[iAman]||'').trim():'',
      hp: iHP>=0?String(row[iHP]||'').trim():'',
      status:'aktif'
    });
    if (r) sukses++; else skip++;
  }
  await DB.sync('s3_ustadz',{force:true});
  document.getElementById('importUstadzResult').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Berhasil</div><div class="val">${sukses}</div></div></div>
      <div class="stat"><div class="stat-ico ic-yellow">⏭️</div><div class="stat-body"><div class="lbl">Dilewati</div><div class="val">${skip}</div></div></div>
    </div>
    <div style="margin-top:8px;font-size:12px;color:var(--success);font-weight:600">${sukses} ustadz/ustadzah berhasil diimport!</div>`;
  btn.disabled=false; btn.textContent='Import';
  loadSCSStats(); loadUstadz();
};

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

// ===== RIWAYAT SEDEKAH S3 (USTADZ/USTADZAH) =====
function loadBayarS3() {
  let data = DB.get('s3_pembayaran');
  const sr = document.getElementById('srBayarS3')?.value.toLowerCase()||'';
  const bln = document.getElementById('flBulanBayarS3')?.value||'';
  if (sr) data = data.filter(b=>(b.nama_ustadz||'').toLowerCase().includes(sr));
  if (bln) data = data.filter(b=>b.tgl_bayar?.slice(5,7)===bln);
  data.sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  document.getElementById('cntBayarS3').textContent = data.length;
  const { items, total } = paginate(data, pgBayarS3, PS);
  document.getElementById('tblBayarS3').innerHTML = items.length ? items.map(b=>`
    <tr>
      <td style="font-weight:600">${b.nama_ustadz||'-'}</td>
      <td style="font-size:12px">${b.amanah||'-'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(b.nominal)}</td>
      <td style="font-size:12px">${tgl(b.tgl_bayar)}</td>
      <td style="font-size:12px">${b.petugas||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${b.catatan||'-'}</td>
      <td><button class="btn btn-ghost btn-sm btn-icon" onclick="hapusBayarS3('${b.id}')">🗑️</button></td>
    </tr>`).join('')
  : `<tr><td colspan="7"><div class="empty"><div class="ei">💰</div><div class="et">Belum ada riwayat sedekah S3</div></div></td></tr>`;
  renderPagination('pagBayarS3', total, pgBayarS3, PS, 'goPgBayarS3');
}
window.goPgBayarS3 = p => { pgBayarS3=p; loadBayarS3(); };

window.hapusBayarS3 = async function(id) {
  if (!await confirmDel()) return;
  if (!await DB.delete('s3_pembayaran',id)) { toast('Gagal menghapus','err'); return; }
  await DB.sync('s3_pembayaran', {force:true});
  toast('Dihapus','ok'); loadSCSStats(); loadBayarS3();
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

  let allRows = [];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json(ws, {defval:'', header:1});
  } catch(e) { toast('Gagal membaca file: '+e.message,'err'); btn.disabled=false; btn.textContent='Import'; return; }

  // Cari baris header dengan berbagai kemungkinan: nama, Nama, NAMA, nama lengkap dll
  let headerIdx = -1;
  for (let i = 0; i < Math.min(allRows.length, 15); i++) {
    const row = allRows[i];
    const found = row.some(c => {
      const v = String(c||'').toLowerCase().trim();
      return v === 'nama' || v === 'nama lengkap' || v === 'nama_lengkap' || v === 'nama siswa' || v === 'nama santri';
    });
    if (found) { headerIdx = i; break; }
  }

  if (headerIdx === -1) {
    // Tampilkan preview untuk debug
    const preview = allRows.slice(0,8).map((r,i) =>
      `<tr><td style="padding:3px 6px;color:var(--gray-400)">${i+1}</td>${r.slice(0,6).map(c=>`<td style="padding:3px 8px;border:1px solid var(--gray-200)">${String(c||'').substring(0,20)}</td>`).join('')}</tr>`
    ).join('');
    document.getElementById('importSCSResult').innerHTML = `
      <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px;font-size:12px">
        <strong>⚠️ Kolom "Nama" tidak ditemukan.</strong> Ini isi file kamu (6 kolom pertama):<br><br>
        <table style="font-size:11px;border-collapse:collapse;width:100%">${preview}</table><br>
        Ketik nama kolom yang berisi nama santri:
        <input id="namaKolom" class="fctrl" style="margin-top:6px" placeholder="cth: Nama, NAMA, Nama Santri">
        <button class="btn btn-primary btn-sm" style="margin-top:6px" onclick="prosesImportSCSWithKolom()">Coba Import</button>
      </div>`;
    btn.disabled=false; btn.textContent='Import'; return;
  }

  await doImportSCS(allRows, headerIdx);
  btn.disabled=false; btn.textContent='Import';
};

window.prosesImportSCSWithKolom = async function() {
  const namaKolom = document.getElementById('namaKolom')?.value.trim();
  if (!namaKolom) { toast('Isi nama kolom dulu','warn'); return; }
  const file = document.getElementById('fileSCS').files[0];
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, {type:'array'});
  const ws = wb.Sheets[wb.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json(ws, {defval:'', header:1});

  let headerIdx = -1;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i].some(c => String(c||'').toLowerCase().trim() === namaKolom.toLowerCase().trim())) {
      headerIdx = i; break;
    }
  }
  if (headerIdx === -1) { toast(`Kolom "${namaKolom}" tidak ditemukan`,'err'); return; }
  await doImportSCS(allRows, headerIdx);
};

async function doImportSCS(allRows, headerIdx) {
  const headers = allRows[headerIdx].map(c => String(c||'').toLowerCase().trim().replace(/\s+/g,'_'));
  const rows = allRows.slice(headerIdx+1).filter(r => r.some(c => c !== '' && c !== null));

  // Cari index kolom nama (bisa berbeda posisi)
  const namaIdx = headers.findIndex(h => h === 'nama' || h.includes('nama'));
  const pangIdx = headers.findIndex(h => h.includes('panggilan') || h.includes('nickname'));
  const kelasIdx = headers.findIndex(h => h === 'kelas' || h.includes('kelas'));
  const halaqohIdx = headers.findIndex(h => h.includes('halaqoh') || h.includes('halaqah') || h.includes('halaqah'));

  let sukses=0, skip=0;
  for (const row of rows) {
    const nama = namaIdx >= 0 ? String(row[namaIdx]||'').trim() : '';
    if (!nama) { skip++; continue; }
    const payload = {
      nama,
      panggilan: pangIdx >= 0 ? String(row[pangIdx]||'').trim() : '',
      kelas: kelasIdx >= 0 ? String(row[kelasIdx]||'').trim() : '',
      halaqoh: halaqohIdx >= 0 ? String(row[halaqohIdx]||'').trim() : '',
      status: 'aktif'
    };
    const r = await DB.insert('scs_santri', payload);
    if (r) sukses++; else skip++;
  }
  await DB.sync('scs_santri', {force:true});

  document.getElementById('importSCSResult').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Berhasil</div><div class="val">${sukses}</div></div></div>
      <div class="stat"><div class="stat-ico ic-yellow">⏭️</div><div class="stat-body"><div class="lbl">Dilewati</div><div class="val">${skip}</div></div></div>
    </div>
    <div style="font-size:12px;color:var(--success);font-weight:600">${sukses} santri berhasil diimport!</div>
  `;
  loadSCSStats(); loadSantri(); loadFilterOptions();
}

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
