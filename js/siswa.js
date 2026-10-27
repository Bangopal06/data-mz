let pgSiswa = 1;
const PS_SISWA = 20;

document.addEventListener('DOMContentLoaded', async () => {
  loadSiswaStats(); loadSiswa();

  document.getElementById('btnTambahSiswa').addEventListener('click', openModalSiswa);
  ['srSiswa','flKelasSiswa','flStSiswa'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(() => { pgSiswa=1; loadSiswa(); }));
    document.getElementById(id)?.addEventListener('change', () => { pgSiswa=1; loadSiswa(); });
  });

  await DB.sync('data_siswa');
  loadSiswaStats(); loadSiswa(); loadKelasFilter();
});

function loadKelasFilter() {
  const data = DB.get('data_siswa');
  const kelas = [...new Set(data.map(s=>s.kelas).filter(Boolean))].sort((a,b)=>{
    const na = parseInt(a), nb = parseInt(b);
    return na !== nb ? na - nb : a.localeCompare(b);
  });
  document.getElementById('flKelasSiswa').innerHTML =
    '<option value="">Semua Kelas</option>' + kelas.map(k=>`<option value="${k}">${k}</option>`).join('');
}

function loadSiswaStats() {
  const data = DB.get('data_siswa');
  const kelas = [...new Set(data.map(s=>s.kelas).filter(Boolean))];
  const perKelas = {};
  data.forEach(s => { if(s.kelas) perKelas[s.kelas] = (perKelas[s.kelas]||0)+1; });
  document.getElementById('siswaStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">🎒</div><div class="stat-body"><div class="lbl">Total Siswa</div><div class="val">${data.length}</div><div class="sub">${kelas.length} kelas</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Aktif</div><div class="val">${data.filter(s=>s.status==='aktif').length}</div></div></div>
    ${Object.entries(perKelas).sort((a,b)=>parseInt(a[0])-parseInt(b[0])).slice(0,4).map(([k,v])=>
      `<div class="stat"><div class="stat-ico ic-orange">📚</div><div class="stat-body"><div class="lbl">Kelas ${k}</div><div class="val">${v}</div><div class="sub">siswa</div></div></div>`
    ).join('')}
  `;
}

function loadSiswa() {
  let data = DB.get('data_siswa');
  const sr = document.getElementById('srSiswa').value.toLowerCase();
  const kel = document.getElementById('flKelasSiswa').value;
  const st = document.getElementById('flStSiswa').value;
  if (sr) data = data.filter(s=>s.nama.toLowerCase().includes(sr)||(s.nama_ayah||'').toLowerCase().includes(sr)||(s.nama_ibu||'').toLowerCase().includes(sr));
  if (kel) data = data.filter(s=>s.kelas===kel);
  if (st) data = data.filter(s=>s.status===st);
  data.sort((a,b)=>{
    const ka=parseInt(a.kelas||'99'), kb=parseInt(b.kelas||'99');
    if(ka!==kb) return ka-kb;
    return (a.kelas||'').localeCompare(b.kelas||'') || a.nama.localeCompare(b.nama);
  });

  const { items, total } = paginate(data, pgSiswa, PS_SISWA);
  const offset = (pgSiswa-1)*PS_SISWA;
  document.getElementById('tblSiswa').innerHTML = items.length ? items.map((s,i)=>`
    <tr>
      <td style="text-align:center;color:var(--gray-400)">${offset+i+1}</td>
      <td style="font-weight:600">${s.nama}</td>
      <td><span class="badge b-blue" style="font-size:11px">${s.kelas||'-'}</span></td>
      <td style="font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.alamat||'-'}</td>
      <td style="font-size:12px">${s.nama_ayah||'-'}</td>
      <td class="td-mono">${s.hp_ayah||'-'}</td>
      <td style="font-size:12px">${s.nama_ibu||'-'}</td>
      <td class="td-mono">${s.hp_ibu||'-'}</td>
      <td>${badge(s.status)}</td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalSiswa('${s.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusSiswa('${s.id}')">🗑️</button>
      </div></td>
    </tr>`).join('')
  : `<tr><td colspan="10"><div class="empty"><div class="ei">🎒</div><div class="et">Belum ada data siswa</div></div></td></tr>`;
  renderPagination('pagSiswa', total, pgSiswa, PS_SISWA, 'goPgSiswa');
}
window.goPgSiswa = p => { pgSiswa=p; loadSiswa(); };

window.openModalSiswa = function(id=null) {
  const s = id ? DB.get('data_siswa').find(x=>x.id===id) : null;
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovSiswa">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>${s?'Edit':'Tambah'} Data Siswa</h3><button class="modal-close" onclick="closeModal('ovSiswa')">✕</button></div>
      <div class="modal-body">
        <div class="sec-div">Data Siswa</div>
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Nama Siswa *</label><input id="ssNama" class="fctrl" value="${s?.nama||''}"></div>
          <div class="fg"><label class="flabel">Kelas</label><input id="ssKelas" class="fctrl" value="${s?.kelas||''}" placeholder="cth: 7A, 8B"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="ssSt" class="fctrl">
              <option value="aktif" ${s?.status==='aktif'||!s?'selected':''}>Aktif</option>
              <option value="tidak_aktif" ${s?.status==='tidak_aktif'?'selected':''}>Tidak Aktif</option>
            </select>
          </div>
          <div class="fg fcol2"><label class="flabel">Alamat</label><input id="ssAlamat" class="fctrl" value="${s?.alamat||''}"></div>
        </div>
        <div class="sec-div">Data Orang Tua / Wali</div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Nama Ayah</label><input id="ssAyah" class="fctrl" value="${s?.nama_ayah||''}"></div>
          <div class="fg"><label class="flabel">HP Ayah</label><input id="ssHPAyah" class="fctrl" value="${s?.hp_ayah||''}"></div>
          <div class="fg"><label class="flabel">Pekerjaan Ayah</label><input id="ssPekAyah" class="fctrl" value="${s?.pekerjaan_ayah||''}"></div>
          <div class="fg"><label class="flabel">Instansi Ayah</label><input id="ssInstAyah" class="fctrl" value="${s?.nama_instansi_ayah||''}"></div>
          <div class="fg"><label class="flabel">Nama Ibu</label><input id="ssIbu" class="fctrl" value="${s?.nama_ibu||''}"></div>
          <div class="fg"><label class="flabel">HP Ibu</label><input id="ssHPIbu" class="fctrl" value="${s?.hp_ibu||''}"></div>
          <div class="fg"><label class="flabel">Pekerjaan Ibu</label><input id="ssPekIbu" class="fctrl" value="${s?.pekerjaan_ibu||''}"></div>
          <div class="fg"><label class="flabel">Instansi Ibu</label><input id="ssInstIbu" class="fctrl" value="${s?.nama_instansi_ibu||''}"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovSiswa')">Batal</button>
        <button class="btn btn-primary" onclick="saveSiswa('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveSiswa = async function(id) {
  const nama = document.getElementById('ssNama').value.trim();
  if (!nama) { toast('Nama wajib diisi','warn'); return; }
  const btn = document.querySelector('#ovSiswa .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='Menyimpan...'; }
  const payload = {
    nama, kelas: document.getElementById('ssKelas').value.trim(),
    alamat: document.getElementById('ssAlamat').value.trim(),
    nama_ayah: document.getElementById('ssAyah').value.trim(),
    hp_ayah: document.getElementById('ssHPAyah').value.trim(),
    pekerjaan_ayah: document.getElementById('ssPekAyah').value.trim(),
    nama_instansi_ayah: document.getElementById('ssInstAyah').value.trim(),
    nama_ibu: document.getElementById('ssIbu').value.trim(),
    hp_ibu: document.getElementById('ssHPIbu').value.trim(),
    pekerjaan_ibu: document.getElementById('ssPekIbu').value.trim(),
    nama_instansi_ibu: document.getElementById('ssInstIbu').value.trim(),
    status: document.getElementById('ssSt').value
  };
  const r = id ? await DB.update('data_siswa',id,payload) : await DB.insert('data_siswa',payload);
  if (!r) { toast('Gagal menyimpan','err'); return; }
  await DB.sync('data_siswa',{force:true});
  toast(id?'Data diperbarui':'Siswa ditambahkan','ok');
  closeModal('ovSiswa'); loadSiswaStats(); loadSiswa(); loadKelasFilter();
};

window.hapusSiswa = async function(id) {
  if (!await confirmDel('Hapus data siswa ini?')) return;
  if (!await DB.delete('data_siswa',id)) { toast('Gagal menghapus','err'); return; }
  await DB.sync('data_siswa',{force:true});
  toast('Dihapus','ok'); loadSiswaStats(); loadSiswa(); loadKelasFilter();
};

// ===== IMPORT =====
window.importSiswa = function() {
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovImportSiswa">
    <div class="modal" style="max-width:640px">
      <div class="modal-head"><h3>⬆️ Import Data Siswa</h3><button class="modal-close" onclick="closeModal('ovImportSiswa')">✕</button></div>
      <div class="modal-body">
        <div id="importSiswaStep1">
          <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px">
            Mendukung semua format Excel. File boleh punya judul di baris atas dan kolom No di awal.<br>
            Sistem akan otomatis deteksi header dan kamu bisa mapping kolom yang sesuai.
          </div>
          <div class="fg" style="margin-bottom:12px">
            <label class="flabel">Kelas (opsional — akan ditimpa oleh kolom kelas di file)</label>
            <input id="importKelasDefault" class="fctrl" placeholder="cth: 7A — kosongkan jika ada di file">
          </div>
          <div class="fg"><label class="flabel">Pilih File Excel</label>
            <input type="file" id="fileSiswa" class="fctrl" accept=".xlsx,.xls,.csv">
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="previewSiswa()">Preview File →</button>
        </div>
        <div id="importSiswaStep2" style="display:none">
          <div id="previewSiswaTable" style="margin-bottom:16px"></div>
          <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600;margin-bottom:10px">Mapping Kolom → Field Siswa</div>
            <div id="mappingSiswa"></div>
          </div>
        </div>
        <div id="importSiswaResult" style="margin-top:12px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovImportSiswa')">Tutup</button>
        <button class="btn btn-primary" id="btnDoImportSiswa" style="display:none" onclick="doImportSiswa()">Import Sekarang</button>
      </div>
    </div>
  </div>`);
};

let _siswaRows = [], _siswaHeaders = [];

window.previewSiswa = async function() {
  const file = document.getElementById('fileSiswa').files[0];
  if (!file) { toast('Pilih file dulu','warn'); return; }

  let allRows = [];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf,{type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json(ws,{defval:'',header:1});
  } catch(e) { toast('Gagal membaca file','err'); return; }

  // Cari header — baris dengan paling banyak teks
  let headerIdx=0, maxText=0;
  for(let i=0;i<Math.min(allRows.length,10);i++){
    const tc = allRows[i].filter(c=>isNaN(String(c||'').trim())&&String(c||'').trim().length>1).length;
    if(tc>maxText){maxText=tc;headerIdx=i;}
  }
  _siswaHeaders = allRows[headerIdx].map(c=>String(c||'').trim()).filter(Boolean);
  _siswaRows = allRows.slice(headerIdx+1).filter(r=>r.some(c=>c!==''&&c!==null));

  // Preview
  document.getElementById('previewSiswaTable').innerHTML = `
    <div style="font-size:12px;font-weight:600;margin-bottom:6px">${_siswaRows.length} baris ditemukan, preview 5 pertama:</div>
    <div style="overflow-x:auto;max-height:140px;border:1px solid var(--gray-200);border-radius:6px">
      <table style="font-size:11px;border-collapse:collapse;width:100%">
        <thead><tr style="background:var(--gray-100)">${_siswaHeaders.map(h=>`<th style="padding:5px 8px;border:1px solid var(--gray-200);white-space:nowrap">${h}</th>`).join('')}</tr></thead>
        <tbody>${_siswaRows.slice(0,5).map(r=>`<tr>${_siswaHeaders.map((_,i)=>`<td style="padding:4px 8px;border:1px solid var(--gray-200);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${String(r[i]||'')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`;

  // Mapping fields
  const fields = [
    {key:'nama', label:'Nama Siswa *'},
    {key:'kelas', label:'Kelas'},
    {key:'alamat', label:'Alamat'},
    {key:'nama_ayah', label:'Nama Ayah'},
    {key:'hp_ayah', label:'HP Ayah'},
    {key:'pekerjaan_ayah', label:'Pekerjaan Ayah'},
    {key:'nama_instansi_ayah', label:'Instansi Ayah'},
    {key:'nama_ibu', label:'Nama Ibu'},
    {key:'hp_ibu', label:'HP Ibu'},
    {key:'pekerjaan_ibu', label:'Pekerjaan Ibu'},
    {key:'nama_instansi_ibu', label:'Instansi Ibu'},
  ];
  const colOpts = `<option value="">(kosongkan)</option>` + _siswaHeaders.map(h=>`<option value="${h}">${h}</option>`).join('');

  document.getElementById('mappingSiswa').innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">` +
    fields.map(f => {
      const auto = _siswaHeaders.find(h => {
        const hl = h.toLowerCase().replace(/\s/g,'_');
        const fl = f.key.toLowerCase();
        return hl===fl || hl.includes(fl.split('_')[0]) && hl.includes(fl.split('_').pop());
      }) || '';
      return `<div style="display:flex;align-items:center;gap:8px">
        <div style="width:130px;font-size:12px;font-weight:600;flex-shrink:0">${f.label}</div>
        <select id="smap_${f.key}" class="fctrl" style="flex:1">
          ${colOpts.replace(`value="${auto}"`,`value="${auto}" selected`)}
        </select>
      </div>`;
    }).join('') + `</div>`;

  document.getElementById('importSiswaStep1').style.display='none';
  document.getElementById('importSiswaStep2').style.display='block';
  document.getElementById('btnDoImportSiswa').style.display='inline-flex';
};

window.doImportSiswa = async function() {
  const kelasDefault = document.getElementById('importKelasDefault')?.value.trim()||'';
  const getNama = document.getElementById('smap_nama')?.value;
  if (!getNama) { toast('Kolom Nama wajib dipilih','warn'); return; }

  const btn = document.getElementById('btnDoImportSiswa');
  btn.disabled=true; btn.textContent='Mengimport...';

  const getVal = (row, colName) => {
    if (!colName) return '';
    const idx = _siswaHeaders.indexOf(colName);
    return idx>=0 ? String(row[idx]||'').trim() : '';
  };

  let sukses=0, skip=0;
  // Daftar nilai yang kemungkinan adalah header/judul, bukan data
  const headerWords = ['nama siswa','nama','kelas','alamat','no','nomer','number'];
  for(const row of _siswaRows) {
    const nama = getVal(row, getNama);
    if (!nama) { skip++; continue; }
    // Skip baris yang isinya seperti header
    if (headerWords.includes(nama.toLowerCase())) { skip++; continue; }
    if (nama.toLowerCase().startsWith('data siswa') || nama.toLowerCase().startsWith('kelas')) { skip++; continue; }
    const kelas = getVal(row, document.getElementById('smap_kelas')?.value) || kelasDefault;
    const payload = {
      nama, kelas,
      alamat: getVal(row, document.getElementById('smap_alamat')?.value),
      nama_ayah: getVal(row, document.getElementById('smap_nama_ayah')?.value),
      hp_ayah: getVal(row, document.getElementById('smap_hp_ayah')?.value),
      pekerjaan_ayah: getVal(row, document.getElementById('smap_pekerjaan_ayah')?.value),
      nama_instansi_ayah: getVal(row, document.getElementById('smap_nama_instansi_ayah')?.value),
      nama_ibu: getVal(row, document.getElementById('smap_nama_ibu')?.value),
      hp_ibu: getVal(row, document.getElementById('smap_hp_ibu')?.value),
      pekerjaan_ibu: getVal(row, document.getElementById('smap_pekerjaan_ibu')?.value),
      nama_instansi_ibu: getVal(row, document.getElementById('smap_nama_instansi_ibu')?.value),
      status: 'aktif', extra: {}
    };
    const r = await DB.insert('data_siswa', payload);
    if(r) sukses++; else skip++;
  }

  await DB.sync('data_siswa',{force:true});
  document.getElementById('importSiswaResult').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Berhasil</div><div class="val">${sukses}</div></div></div>
      <div class="stat"><div class="stat-ico ic-yellow">⏭️</div><div class="stat-body"><div class="lbl">Dilewati</div><div class="val">${skip}</div></div></div>
    </div>
    <div style="font-size:13px;color:var(--success);font-weight:600">✓ ${sukses} siswa berhasil diimport!</div>
  `;
  btn.disabled=false; btn.textContent='Import Sekarang';
  loadSiswaStats(); loadSiswa(); loadKelasFilter();
};

function exportSiswa() {
  const data = DB.get('data_siswa').map(s=>({
    nama:s.nama, kelas:s.kelas||'', alamat:s.alamat||'',
    nama_ayah:s.nama_ayah||'', hp_ayah:s.hp_ayah||'',
    pekerjaan_ayah:s.pekerjaan_ayah||'', instansi_ayah:s.nama_instansi_ayah||'',
    nama_ibu:s.nama_ibu||'', hp_ibu:s.hp_ibu||'',
    pekerjaan_ibu:s.pekerjaan_ibu||'', instansi_ibu:s.nama_instansi_ibu||'',
    status:s.status
  }));
  if(!data.length){toast('Tidak ada data','warn');return;}
  exportExcel(data,'DataSiswa','Data Siswa');
}
