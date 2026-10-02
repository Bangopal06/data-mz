// =============================================
// KCS - Kotak Collection System
// =============================================

let pgKcsData = 1, pgKcsProspek = 1;
const PS = 12;
const BULAN_NAMA = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', () => {
  initTabs('kcsTabs', (target) => {
    if (target === 'paneKcsData') loadKcsData();
    else if (target === 'paneKcsProspek') loadKcsProspek();
    else if (target === 'paneKcsAmbil') { initKcsAmbilFilter(); loadKcsAmbil(); }
  });

  loadKcsStats();
  loadKcsData();
  loadKcsProspek();
  initKcsAmbilFilter();

  document.getElementById('btnTambahKCS')?.addEventListener('click', () => {
    const t = document.querySelector('#kcsTabs .tab.active')?.dataset.target;
    if (t === 'paneKcsProspek') openModalKcsProspek();
    else if (t === 'paneKcsAmbil') openModalKcsAmbil();
    else openModalKcs();
  });

  ['srKcsData','srKcsKota','flKcsStatus','flKcsFrekuensi'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { pgKcsData=1; loadKcsData(); });
    document.getElementById(id)?.addEventListener('change', () => { pgKcsData=1; loadKcsData(); });
  });
  ['srKcsProspek','flKcsProspekStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { pgKcsProspek=1; loadKcsProspek(); });
    document.getElementById(id)?.addEventListener('change', () => { pgKcsProspek=1; loadKcsProspek(); });
  });
});

// ---- STATS ----
function loadKcsStats() {
  const data = DB.get('kcs_data');
  const prospek = DB.get('kcs_prospek');
  const ambil = DB.get('kcs_pengambilan');
  const totalInfaq = data.filter(k=>k.status==='aktif').reduce((s,k)=>s+(+k.nominal_terakhir||0),0);
  const totalAll = ambil.reduce((s,a)=>s+(+a.nominal||0),0);

  document.getElementById('kcsStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">📦</div><div class="stat-body"><div class="lbl">KCS Aktif</div><div class="val">${data.filter(k=>k.status==='aktif').length}</div><div class="sub">${data.length} total</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">👤</div><div class="stat-body"><div class="lbl">Prospek KCS</div><div class="val">${prospek.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💰</div><div class="stat-body"><div class="lbl">Infaq Terakhir</div><div class="val rupiah" style="font-size:15px">${rupiah(totalInfaq)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-teal">📊</div><div class="stat-body"><div class="lbl">Total Terkumpul</div><div class="val rupiah" style="font-size:15px">${rupiah(totalAll)}</div></div></div>
  `;
}

// ---- DATA KCS ----
function loadKcsData() {
  let data = DB.get('kcs_data');
  const sr = document.getElementById('srKcsData')?.value.toLowerCase()||'';
  const kota = document.getElementById('srKcsKota')?.value.toLowerCase()||'';
  const st = document.getElementById('flKcsStatus')?.value||'';
  const fr = document.getElementById('flKcsFrekuensi')?.value||'';
  if (sr) data = data.filter(k=>k.nama_kotak?.toLowerCase().includes(sr)||k.nama_toko?.toLowerCase().includes(sr));
  if (kota) data = data.filter(k=>k.kota?.toLowerCase().includes(kota));
  if (st) data = data.filter(k=>k.status===st);
  if (fr) data = data.filter(k=>k.frekuensi===fr);

  const cnt = document.getElementById('cntKcsData');
  if (cnt) cnt.textContent = data.length;

  const {items, total} = paginate(data, pgKcsData, PS);
  const grid = document.getElementById('kcsGrid');
  if (!grid) return;

  grid.innerHTML = items.length ? items.map(k => `
    <div class="kotak-card">
      <div class="kc-head">
        <div>
          <div class="kc-name">📦 ${k.nama_kotak}</div>
          <div class="kc-loc">🏪 ${k.nama_toko}</div>
          <div class="kc-loc">📍 ${[k.alamat, k.kecamatan, k.kota].filter(Boolean).join(', ')}</div>
          <div class="kc-loc" style="margin-top:4px">👤 ${k.pemilik||'-'} · 📞 ${k.hp||'-'}</div>
        </div>
        <div>${badge(k.status)}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
        ${badge(k.frekuensi||'bulanan')}
        <span class="badge b-gray">Petugas: ${k.petugas||'-'}</span>
      </div>
      <div class="kc-foot">
        <div>
          <div style="font-size:11px;color:var(--gray-400)">Terakhir: ${tgl(k.tgl_ambil)||'Belum pernah'}</div>
          <div class="kc-nominal">${rupiah(k.nominal_terakhir||0)}</div>
        </div>
        <div class="kc-actions">
          <button class="btn btn-success btn-sm" onclick="openModalKcsAmbil('${k.id}')">📦 Ambil</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalKcs('${k.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusKcs('${k.id}')">🗑️</button>
        </div>
      </div>
    </div>`).join('')
  : `<div class="empty" style="grid-column:1/-1"><div class="ei">📦</div><div class="et">Belum ada data KCS</div><div class="ed">Klik + Tambah untuk menambah</div></div>`;

  renderPagination('pagKcsData', total, pgKcsData, PS, 'goPgKcsData');
}
window.goPgKcsData = p => { pgKcsData=p; loadKcsData(); };

// ---- MODAL TAMBAH/EDIT KCS ----
window.openModalKcs = function(id=null) {
  const k = id ? DB.get('kcs_data').find(x=>x.id===id) : null;
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovKcs">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>${k?'Edit':'Tambah'} KCS</h3><button class="modal-close" onclick="closeModal('ovKcs')">✕</button></div>
      <div class="modal-body">
        <div class="sec-div">Data Toko & Lokasi</div>
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Nama Toko/Tempat *</label>
            <input id="kcNamaToko" class="fctrl" value="${k?.nama_toko||''}" placeholder="Nama toko atau tempat">
          </div>
          <div class="fg"><label class="flabel">Nama Pemilik</label><input id="kcPemilik" class="fctrl" value="${k?.pemilik||''}"></div>
          <div class="fg"><label class="flabel">No. HP</label><input id="kcHP" class="fctrl" value="${k?.hp||''}"></div>
          <div class="fg fcol2"><label class="flabel">Alamat Lengkap</label><input id="kcAlamat" class="fctrl" value="${k?.alamat||''}"></div>
          <div class="fg"><label class="flabel">Kecamatan</label><input id="kcKecamatan" class="fctrl" value="${k?.kecamatan||''}"></div>
          <div class="fg"><label class="flabel">Kota/Kabupaten</label><input id="kcKota" class="fctrl" value="${k?.kota||''}"></div>
        </div>
        <div class="sec-div">Data Operasional</div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Frekuensi Pengambilan</label>
            <select id="kcFrekuensi" class="fctrl">${['mingguan','dua_mingguan','bulanan'].map(f=>`<option value="${f}" ${k?.frekuensi===f?'selected':''}>${f}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Petugas</label><input id="kcPetugas" class="fctrl" value="${k?.petugas||''}"></div>
          <div class="fg"><label class="flabel">Nominal Terakhir (Rp)</label><input type="number" id="kcNominal" class="fctrl" value="${k?.nominal_terakhir||''}"></div>
          <div class="fg"><label class="flabel">Tgl Pengambilan Terakhir</label><input type="date" id="kcTglAmbil" class="fctrl" value="${tglInput(k?.tgl_ambil)||''}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="kcStatus" class="fctrl">${['aktif','tidak_aktif'].map(s=>`<option value="${s}" ${k?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="kcCatatan" class="fctrl">${k?.catatan||''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovKcs')">Batal</button>
        <button class="btn btn-primary" onclick="saveKcs('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.autoNamaKcs = function() {
  const toko = document.getElementById('kcNamaToko')?.value.trim()||'';
  const el = document.getElementById('kcNamaKotak');
  if (el && (!el.value || el.value.startsWith('KCS '))) el.value = toko ? `KCS ${toko}` : 'KCS';
};

window.saveKcs = async function(id) {
  const namaToko = document.getElementById('kcNamaToko').value.trim();
  if (!namaToko) { toast('Nama toko wajib diisi','warn'); return; }
  const namaKotak = `KCS ${namaToko}`;
  const ok = await confirmSave(`Simpan KCS <strong>${namaKotak}</strong>?`);
  if (!ok) return;
  const data = DB.get('kcs_data');
  const payload = { id:id||uid(), nama_kotak:namaKotak, nama_toko:namaToko,
    pemilik:document.getElementById('kcPemilik').value.trim(),
    hp:document.getElementById('kcHP').value.trim(),
    alamat:document.getElementById('kcAlamat').value.trim(),
    kecamatan:document.getElementById('kcKecamatan').value.trim(),
    kota:document.getElementById('kcKota').value.trim(),
    frekuensi:document.getElementById('kcFrekuensi').value,
    petugas:document.getElementById('kcPetugas').value.trim(),
    nominal_terakhir:+document.getElementById('kcNominal').value||0,
    tgl_ambil:document.getElementById('kcTglAmbil').value||null,
    status:document.getElementById('kcStatus').value,
    catatan:document.getElementById('kcCatatan').value.trim(),
    created_at:id?(data.find(x=>x.id===id)?.created_at||new Date().toISOString()):new Date().toISOString()
  };
  if (id) { const i=data.findIndex(x=>x.id===id); data[i]=payload; } else data.unshift(payload);
  DB.set('kcs_data',data);
  toast(id?'Data diperbarui':'KCS berhasil ditambahkan','ok');
  closeModal('ovKcs'); loadKcsStats(); loadKcsData();
};

window.hapusKcs = async function(id) {
  if (!await confirmDel()) return;
  DB.set('kcs_data',DB.get('kcs_data').filter(x=>x.id!==id));
  toast('Dihapus','ok'); loadKcsStats(); loadKcsData();
};

// ---- CATAT PENGAMBILAN KCS ----
window.openModalKcsAmbil = function(kcsId=null) {
  const data = DB.get('kcs_data').filter(k=>k.status==='aktif');
  const opsi = data.map(k=>`<option value="${k.id}" ${k.id===kcsId?'selected':''}>${k.nama_kotak} - ${k.nama_toko}</option>`).join('');
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovKcsAmbil">
    <div class="modal" style="max-width:460px">
      <div class="modal-head"><h3>📦 Catat Pengambilan KCS</h3><button class="modal-close" onclick="closeModal('ovKcsAmbil')">✕</button></div>
      <div class="modal-body">
        <div class="fg mb3"><label class="flabel">KCS *</label>
          <select id="kaKcs" class="fctrl"><option value="">-- Pilih KCS --</option>${opsi}</select>
        </div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Tanggal Ambil *</label><input type="date" id="kaTgl" class="fctrl" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="fg"><label class="flabel">Nominal (Rp) *</label><input type="number" id="kaNominal" class="fctrl" placeholder="250000"></div>
          <div class="fg"><label class="flabel">Petugas</label><input id="kaPetugas" class="fctrl"></div>
          <div class="fg"><label class="flabel">Catatan</label><input id="kaCatatan" class="fctrl" placeholder="Opsional"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovKcsAmbil')">Batal</button>
        <button class="btn btn-success" onclick="saveKcsAmbil()">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveKcsAmbil = async function() {
  const kcsId = document.getElementById('kaKcs').value;
  const tglAmbil = document.getElementById('kaTgl').value;
  const nominal = +document.getElementById('kaNominal').value;
  if (!kcsId||!tglAmbil||!nominal) { toast('Semua field wajib diisi','warn'); return; }
  const kcs = DB.get('kcs_data').find(k=>k.id===kcsId);
  const ok = await confirmSave(`Catat pengambilan <strong>${rupiah(nominal)}</strong> dari <strong>${kcs?.nama_kotak}</strong>?`);
  if (!ok) return;
  // Update data kcs
  const allKcs = DB.get('kcs_data');
  const ki = allKcs.find(k=>k.id===kcsId);
  if (ki) { ki.nominal_terakhir=nominal; ki.tgl_ambil=tglAmbil; }
  DB.set('kcs_data',allKcs);
  // Simpan riwayat
  const ambil = DB.get('kcs_pengambilan');
  ambil.unshift({ id:uid(), kcs_id:kcsId, nama_kotak:kcs?.nama_kotak, nama_toko:kcs?.nama_toko,
    tgl_ambil:tglAmbil, nominal, petugas:document.getElementById('kaPetugas').value.trim(),
    catatan:document.getElementById('kaCatatan').value.trim() });
  DB.set('kcs_pengambilan',ambil);
  toast('Pengambilan dicatat','ok');
  closeModal('ovKcsAmbil'); loadKcsStats(); loadKcsData(); loadKcsAmbil();
};

// ---- RIWAYAT PENGAMBILAN BY BULAN ----
function initKcsAmbilFilter() {
  const selTahun = document.getElementById('flKcsAmbilTahun');
  if (!selTahun||selTahun.options.length>0) return;
  const now = new Date();
  const tahunSet = new Set([String(now.getFullYear()),String(now.getFullYear()-1)]);
  DB.get('kcs_pengambilan').forEach(a=>{ if(a.tgl_ambil) tahunSet.add(a.tgl_ambil.slice(0,4)); });
  selTahun.innerHTML = [...tahunSet].sort((a,b)=>b-a).map(t=>`<option value="${t}" ${t==now.getFullYear()?'selected':''}>${t}</option>`).join('');
  const selBulan = document.getElementById('flKcsAmbilBulan');
  if (selBulan) selBulan.value = String(now.getMonth()+1).padStart(2,'0');
}

window.loadKcsAmbil = function() {
  const bulan = document.getElementById('flKcsAmbilBulan')?.value;
  const tahun = document.getElementById('flKcsAmbilTahun')?.value;
  const filter = document.getElementById('flKcsAmbilFilter')?.value||'semua';
  const sr = document.getElementById('srKcsAmbil')?.value.toLowerCase()||'';
  if (!bulan||!tahun) return;

  const periode = `${tahun}-${bulan}`;
  let kcsAktif = DB.get('kcs_data').filter(k=>k.status==='aktif');
  if (sr) kcsAktif = kcsAktif.filter(k=>k.nama_kotak?.toLowerCase().includes(sr)||k.nama_toko?.toLowerCase().includes(sr));

  const ambilBulan = DB.get('kcs_pengambilan').filter(a=>a.tgl_ambil?.startsWith(periode));
  const sudahIds = new Set(ambilBulan.map(a=>a.kcs_id));
  const sudah = kcsAktif.filter(k=>sudahIds.has(k.id));
  const belum = kcsAktif.filter(k=>!sudahIds.has(k.id));
  const totalSudah = ambilBulan.reduce((s,a)=>s+(+a.nominal||0),0);

  document.getElementById('cntKcsAmbil').textContent = ambilBulan.length;
  document.getElementById('cntKcsSudah').textContent = sudah.length;
  document.getElementById('cntKcsBelum').textContent = belum.length;

  // Summary
  const summary = document.getElementById('kcsAmbilSummary');
  if (summary) summary.innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">📅</div><div class="stat-body"><div class="lbl">Periode</div><div class="val" style="font-size:14px">${BULAN_NAMA[+bulan]} ${tahun}</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Sudah Diambil</div><div class="val">${sudah.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-red">⏳</div><div class="stat-body"><div class="lbl">Belum Diambil</div><div class="val">${belum.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Total Terkumpul</div><div class="val rupiah" style="font-size:14px">${rupiah(totalSudah)}</div></div></div>
  `;

  const secS = document.getElementById('sectionKcsSudah');
  const secB = document.getElementById('sectionKcsBelum');
  if (secS) secS.style.display = filter==='belum'?'none':'block';
  if (secB) secB.style.display = filter==='sudah'?'none':'block';

  // Tabel sudah
  const tblS = document.getElementById('tblKcsSudah');
  const ambilSorted = [...ambilBulan].sort((a,b)=>new Date(b.tgl_ambil)-new Date(a.tgl_ambil));
  if (tblS) tblS.innerHTML = ambilSorted.length ? ambilSorted.map(a=>{
    const k = kcsAktif.find(x=>x.id===a.kcs_id)||{};
    return `<tr style="border-left:3px solid var(--success)">
      <td class="td-name">${a.nama_kotak||'-'}</td>
      <td style="font-size:12px">${a.nama_toko||'-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td style="font-size:12px">${tgl(a.tgl_ambil)}</td>
      <td class="rupiah" style="font-weight:700;color:#f97316">${rupiah(a.nominal)}</td>
      <td style="font-size:12px">${a.petugas||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${a.catatan||'-'}</td>
      <td><button class="btn btn-ghost btn-sm btn-icon" onclick="hapusKcsAmbil('${a.id}')">🗑️</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--gray-400)">Belum ada pengambilan bulan ini</td></tr>`;

  // Tabel belum
  const tblB = document.getElementById('tblKcsBelum');
  if (tblB) tblB.innerHTML = belum.length ? belum.map(k=>{
    const hari = k.tgl_ambil ? Math.floor((new Date()-new Date(k.tgl_ambil))/86400000) : null;
    const terlambat = hari&&((k.frekuensi==='mingguan'&&hari>7)||(k.frekuensi==='dua_mingguan'&&hari>14)||(k.frekuensi==='bulanan'&&hari>30));
    return `<tr style="border-left:3px solid var(--danger)${terlambat?';background:#fef9f9':''}">
      <td class="td-name">${k.nama_kotak}${terlambat?' <span class="badge b-red" style="font-size:10px">Terlambat!</span>':''}</td>
      <td style="font-size:12px">${k.nama_toko}</td>
      <td style="font-size:12px;max-width:130px;overflow:hidden;text-overflow:ellipsis">${k.alamat||'-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td>${badge(k.frekuensi||'bulanan')}</td>
      <td style="font-size:12px">${k.tgl_ambil?tgl(k.tgl_ambil):'<span style="color:var(--gray-300)">Belum pernah</span>'}</td>
      <td style="font-size:12px">${k.petugas||'-'}</td>
      <td><button class="btn btn-success btn-sm" onclick="openModalKcsAmbil('${k.id}')">📦 Ambil</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--success)">🎉 Semua KCS sudah diambil!</td></tr>`;
};

window.hapusKcsAmbil = async function(id) {
  if (!await confirmDel('Hapus riwayat pengambilan ini?')) return;
  DB.set('kcs_pengambilan',DB.get('kcs_pengambilan').filter(x=>x.id!==id));
  toast('Dihapus','ok'); loadKcsStats(); loadKcsAmbil();
};

// ---- PROSPEK KCS ----
function loadKcsProspek() {
  let data = DB.get('kcs_prospek');
  const sr = document.getElementById('srKcsProspek')?.value.toLowerCase()||'';
  const st = document.getElementById('flKcsProspekStatus')?.value||'';
  if (sr) data = data.filter(d=>d.nama_toko?.toLowerCase().includes(sr));
  if (st) data = data.filter(d=>d.status===st);
  const cnt = document.getElementById('cntKcsProspek');
  if (cnt) cnt.textContent = data.length;
  const {items,total} = paginate(data,pgKcsProspek,PS);
  const tbody = document.getElementById('tblKcsProspek');
  if (!tbody) return;
  tbody.innerHTML = items.length ? items.map(d=>`<tr>
    <td class="td-name">${d.nama_toko}</td>
    <td style="font-size:12px">${d.pemilik||'-'}</td>
    <td class="td-mono">${d.hp||'-'}</td>
    <td style="font-size:12px">${d.alamat||'-'}</td>
    <td style="font-size:12px">${d.kota||'-'}</td>
    <td>${badge(d.status)}</td>
    <td style="font-size:12px">${d.petugas||'-'}</td>
    <td><div class="td-actions">
      <button class="btn btn-success btn-sm" onclick="jadikanKcsAktif('${d.id}')">✓ Pasang</button>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalKcsProspek('${d.id}')">✏️</button>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusKcsProspek('${d.id}')">🗑️</button>
    </div></td></tr>`).join('')
  : `<tr><td colspan="8"><div class="empty"><div class="ei">👤</div><div class="et">Belum ada prospek KCS</div></div></td></tr>`;
  renderPagination('pagKcsProspek',total,pgKcsProspek,PS,'goPgKcsProspek');
}
window.goPgKcsProspek = p=>{pgKcsProspek=p;loadKcsProspek();};

window.openModalKcsProspek = function(id=null) {
  const d = id ? DB.get('kcs_prospek').find(x=>x.id===id) : null;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovKcsPros">
    <div class="modal">
      <div class="modal-head"><h3>${d?'Edit':'Tambah'} Prospek KCS</h3><button class="modal-close" onclick="closeModal('ovKcsPros')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg"><label class="flabel">Nama Toko *</label><input id="kpNamaToko" class="fctrl" value="${d?.nama_toko||''}"></div>
          <div class="fg"><label class="flabel">Pemilik</label><input id="kpPemilik" class="fctrl" value="${d?.pemilik||''}"></div>
          <div class="fg"><label class="flabel">No. HP</label><input id="kpHP" class="fctrl" value="${d?.hp||''}"></div>
          <div class="fg"><label class="flabel">Kota</label><input id="kpKota" class="fctrl" value="${d?.kota||''}"></div>
          <div class="fg"><label class="flabel">Kecamatan</label><input id="kpKecamatan" class="fctrl" value="${d?.kecamatan||''}"></div>
          <div class="fg fcol2"><label class="flabel">Alamat</label><input id="kpAlamat" class="fctrl" value="${d?.alamat||''}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="kpStatus" class="fctrl">${['baru','dihubungi','survei'].map(s=>`<option value="${s}" ${d?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Petugas</label><input id="kpPetugas" class="fctrl" value="${d?.petugas||''}"></div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="kpCatatan" class="fctrl">${d?.catatan||''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovKcsPros')">Batal</button>
        <button class="btn btn-primary" onclick="saveKcsProspek('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveKcsProspek = async function(id) {
  const nama = document.getElementById('kpNamaToko').value.trim();
  if (!nama) { toast('Nama toko wajib diisi','warn'); return; }
  const ok = await confirmSave(`Simpan prospek KCS <strong>${nama}</strong>?`);
  if (!ok) return;
  const data = DB.get('kcs_prospek');
  const payload = { id:id||uid(), nama_toko:nama, pemilik:document.getElementById('kpPemilik').value.trim(),
    hp:document.getElementById('kpHP').value.trim(), kota:document.getElementById('kpKota').value.trim(),
    kecamatan:document.getElementById('kpKecamatan').value.trim(), alamat:document.getElementById('kpAlamat').value.trim(),
    status:document.getElementById('kpStatus').value, petugas:document.getElementById('kpPetugas').value.trim(),
    catatan:document.getElementById('kpCatatan').value.trim(),
    created_at:id?(data.find(x=>x.id===id)?.created_at||new Date().toISOString()):new Date().toISOString()
  };
  if (id) { const i=data.findIndex(x=>x.id===id); data[i]=payload; } else data.unshift(payload);
  DB.set('kcs_prospek',data);
  toast('Data prospek tersimpan','ok'); closeModal('ovKcsPros'); loadKcsStats(); loadKcsProspek();
};

window.hapusKcsProspek = async function(id) {
  if (!await confirmDel()) return;
  DB.set('kcs_prospek',DB.get('kcs_prospek').filter(x=>x.id!==id));
  toast('Dihapus','ok'); loadKcsStats(); loadKcsProspek();
};

window.jadikanKcsAktif = async function(id) {
  const p = DB.get('kcs_prospek').find(x=>x.id===id);
  if (!p) return;
  const ok = await confirmAction('📦','Pasang KCS?',`<strong>${p.nama_toko}</strong> akan dipasang sebagai KCS aktif.`,'Ya, Pasang','btn-success');
  if (!ok) return;
  DB.set('kcs_prospek',DB.get('kcs_prospek').filter(x=>x.id!==id));
  const data = DB.get('kcs_data');
  data.unshift({ id:uid(), nama_kotak:`KCS ${p.nama_toko}`, nama_toko:p.nama_toko,
    pemilik:p.pemilik||'', hp:p.hp||'', alamat:p.alamat||'', kecamatan:p.kecamatan||'',
    kota:p.kota||'', frekuensi:'bulanan', petugas:p.petugas||'',
    nominal_terakhir:0, tgl_ambil:null, status:'aktif', catatan:p.catatan||'', created_at:new Date().toISOString() });
  DB.set('kcs_data',data);
  toast(`${p.nama_toko} berhasil dipasang KCS!`,'ok');
  loadKcsStats(); loadKcsData(); loadKcsProspek();
};

// ---- EXPORT & IMPORT ----
function exportKCS() {
  const data = DB.get('kcs_data').map(k=>({
    nama_kotak:k.nama_kotak, nama_toko:k.nama_toko, pemilik:k.pemilik||'',
    hp:k.hp||'', alamat:k.alamat||'', kecamatan:k.kecamatan||'', kota:k.kota||'',
    frekuensi:k.frekuensi||'', petugas:k.petugas||'',
    nominal_terakhir:k.nominal_terakhir||0, tgl_ambil:k.tgl_ambil||'', status:k.status||''
  }));
  exportExcel(data,'DataKCS','KCS');
}

window.triggerImportKCS = function() {
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovImportKCS">
    <div class="modal" style="max-width:480px">
      <div class="modal-head"><h3>⬆️ Import Data KCS</h3><button class="modal-close" onclick="closeModal('ovImportKCS')">✕</button></div>
      <div class="modal-body">
        <div class="fg mb3"><label class="flabel">Masukkan sebagai *</label>
          <select id="importKCSType" class="fctrl">
            <option value="kcs_data">Data KCS (Aktif)</option>
            <option value="kcs_prospek">Prospek KCS</option>
          </select>
        </div>
        <div class="fg mb3"><label class="flabel">Jika nama kotak sudah ada</label>
          <select id="importKCSDup" class="fctrl">
            <option value="skip">Lewati</option><option value="update">Perbarui</option>
          </select>
        </div>
        <div onclick="document.getElementById('impKCSFile').click()"
          style="border:2px dashed var(--gray-300);border-radius:10px;padding:28px;text-align:center;cursor:pointer;background:var(--gray-50)"
          ondragover="event.preventDefault();this.style.borderColor='var(--primary)'"
          ondragleave="this.style.borderColor='var(--gray-300)'"
          ondrop="event.preventDefault();this.style.borderColor='var(--gray-300)';handleKCSDrop(event)">
          <div style="font-size:32px;margin-bottom:6px">📂</div>
          <div style="font-weight:700">Klik atau drag & drop</div>
          <div style="font-size:12px;color:var(--gray-400)">.xlsx .xls .csv</div>
        </div>
        <input type="file" id="impKCSFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleKCSFile(this.files[0])">
        <div id="impKCSProg" style="display:none;margin-top:12px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovImportKCS')">Batal</button>
        <button class="btn btn-outline btn-sm" onclick="downloadKCSTemplate()">⬇️ Template</button>
      </div>
    </div>
  </div>`);
};

window.handleKCSDrop = e => { const f=e.dataTransfer.files[0]; if(f) handleKCSFile(f); };

window.handleKCSFile = function(file) {
  if (!file) return;
  const prog = document.getElementById('impKCSProg');
  if (prog) { prog.style.display='block'; prog.innerHTML=`<div style="color:var(--primary);font-size:13px">⏳ Membaca ${file.name}...</div>`; }
  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  const parse = csv => {
    const lines = csv.split(/\r?\n/).filter(l=>l.trim());
    if (lines.length<2) return;
    const headers = lines[0].split(/,|\t/).map(h=>h.replace(/^"|"$/g,'').trim().toLowerCase().replace(/\s+/g,'_'));
    const rows = lines.slice(1).map(line=>{
      const vals=[]; let inQ=false, cur='';
      for(const ch of line){ if(ch==='"') inQ=!inQ; else if((ch===','||ch==='\t')&&!inQ){vals.push(cur.trim());cur='';} else cur+=ch; }
      vals.push(cur.trim());
      const obj={}; headers.forEach((h,i)=>obj[h]=(vals[i]||'').replace(/^"|"$/g,'').trim()); return obj;
    }).filter(r=>r.nama_kotak||r.nama_toko);
    const type = document.getElementById('importKCSType').value;
    const dup = document.getElementById('importKCSDup').value;
    const existing = DB.get(type); const newData=[...existing];
    let ok=0,skip=0,upd=0;
    rows.forEach(row=>{
      const isData = type==='kcs_data';
      const record = isData ? { id:uid(), nama_kotak:row.nama_kotak||`KCS ${row.nama_toko}`, nama_toko:row.nama_toko||'',
        pemilik:row.pemilik||'', hp:row.hp||'', alamat:row.alamat||'', kecamatan:row.kecamatan||'', kota:row.kota||'',
        frekuensi:row.frekuensi||'bulanan', petugas:row.petugas||'', nominal_terakhir:0, tgl_ambil:null, status:'aktif', catatan:row.catatan||'', created_at:new Date().toISOString()
      } : { id:uid(), nama_toko:row.nama_toko||row.nama_kotak||'', pemilik:row.pemilik||'', hp:row.hp||'',
        alamat:row.alamat||'', kecamatan:row.kecamatan||'', kota:row.kota||'', status:'baru', petugas:row.petugas||'', catatan:row.catatan||'', created_at:new Date().toISOString() };
      const key = isData ? record.nama_kotak : record.nama_toko;
      const dupKey = isData ? 'nama_kotak' : 'nama_toko';
      const idx = newData.findIndex(e=>e[dupKey]===key);
      if (idx>=0) { if(dup==='update'){newData[idx]={...newData[idx],...record,id:newData[idx].id};upd++;} else skip++; }
      else { newData.push(record); ok++; }
    });
    DB.set(type,newData);
    if(prog) prog.innerHTML=`<div style="background:var(--success-light);border-radius:8px;padding:12px;color:var(--success)">
      ✅ <strong>${ok}</strong> ditambahkan · <strong>${upd}</strong> diperbarui · <strong>${skip}</strong> dilewati</div>`;
    loadKcsStats(); loadKcsData(); loadKcsProspek();
    toast(`Import selesai: ${ok} data masuk`,'ok');
  };
  if (ext==='csv') { reader.onload=e=>parse(e.target.result); reader.readAsText(file,'UTF-8'); }
  else { reader.onload=e=>{ try{ const wb=XLSX.read(e.target.result,{type:'array'}); parse(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])); }catch(err){if(prog)prog.innerHTML=`<div style="color:var(--danger)">❌ ${err.message}</div>`;} }; reader.readAsArrayBuffer(file); }
};

window.downloadKCSTemplate = function() {
  const type = document.getElementById('importKCSType')?.value||'kcs_data';
  const isData = type==='kcs_data';
  const headers = isData
    ? ['nama_kotak','nama_toko','pemilik','hp','alamat','kecamatan','kota','frekuensi','petugas']
    : ['nama_toko','pemilik','hp','alamat','kecamatan','kota','petugas','catatan'];
  const labels = isData
    ? ['Nama KCS','Nama Toko','Nama Pemilik','No. HP','Alamat','Kecamatan','Kota','Frekuensi','Petugas']
    : ['Nama Toko','Nama Pemilik','No. HP','Alamat','Kecamatan','Kota','Petugas','Catatan'];
  const contoh = isData
    ? [['KCS Warung Bu Sri','Warung Bu Sri','Bu Sri','081111222333','Jl. Raya No.5','Kebayoran','Jakarta Selatan','bulanan','Ahmad'],
       ['KCS Toko Maju','Toko Maju','Pak Jono','082222333444','Jl. Pasar No.3','Ciputat','Tangerang','mingguan','Budi']]
    : [['Toko Berkah','Pak Hasan','083333444555','Jl. Mawar No.2','Beji','Depok','Citra','Tertarik pasang KCS'],
       ['Warung Barokah','Bu Yati','084444555666','Jl. Kenanga No.8','Pancoran','Jakarta Selatan','Ahmad','']];
  buildTemplateExcel(isData?'Template Import KCS':'Template Import Prospek KCS', labels, headers, contoh, type);
};

// Init localStorage KCS jika belum ada
['kcs_data','kcs_prospek','kcs_pengambilan'].forEach(k=>{
  if (localStorage.getItem('crm_'+k)===null) DB.set(k,[]);
});
