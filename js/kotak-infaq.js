let pgKotak=1, pgProsKotak=1, pgAmbil=1;
const PS=12;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    DB.sync('kotak_infaq'),
    DB.sync('prospek_kotak'),
    DB.sync('pengambilan_kotak')
  ]);
  initTabs('kiTabs', (target) => {
    if (target === 'paneKotak') loadKotak();
    else if (target === 'paneProspekKotak') loadProsKotak();
    else if (target === 'panePengambilan') { initAmbilFilter(); loadAmbilByBulan(); }
  });
  loadKiStats();
  loadKotak();
  loadProsKotak();
  loadAmbil();

  document.getElementById('btnTambahKI').addEventListener('click', () => {
    const tab = document.querySelector('#kiTabs .tab.active').dataset.target;
    if (tab === 'paneKotak') openModalKotak();
    else if (tab === 'paneProspekKotak') openModalProsKotak();
    else openModalAmbil();
  });

  ['srKotak','srKotaKota','flKotakStatus','flFrekuensi'].forEach(id => document.getElementById(id)?.addEventListener('input', () => { pgKotak=1; loadKotak(); }));
  ['srKotak','srKotaKota','flKotakStatus','flFrekuensi'].forEach(id => document.getElementById(id)?.addEventListener('change', () => { pgKotak=1; loadKotak(); }));
  ['srProsKotak','flProsKotakStatus'].forEach(id => document.getElementById(id)?.addEventListener('input', () => { pgProsKotak=1; loadProsKotak(); }));
  ['srProsKotak','flProsKotakStatus'].forEach(id => document.getElementById(id)?.addEventListener('change', () => { pgProsKotak=1; loadProsKotak(); }));
  document.getElementById('srAmbil').addEventListener('input', () => { pgAmbil=1; loadAmbil(); });
  document.getElementById('flAmbilBulan').addEventListener('change', () => { pgAmbil=1; loadAmbil(); });
});

function loadKiStats() {
  const ki = DB.get('kotak_infaq');
  const pk = DB.get('prospek_kotak');
  const pa = DB.get('pengambilan_kotak');
  const totalInfaq = ki.filter(k=>k.status==='aktif').reduce((s,k)=>s+(+k.nominal_terakhir||0),0);
  const totalAll = pa.reduce((s,a)=>s+(+a.nominal||0),0);
  document.getElementById('kiStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-orange">🗃️</div><div class="stat-body"><div class="lbl">Kotak Aktif</div><div class="val">${ki.filter(k=>k.status==='aktif').length}</div><div class="sub">${ki.length} total kotak</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">👤</div><div class="stat-body"><div class="lbl">Prospek Kotak</div><div class="val">${pk.length}</div><div class="sub">Calon lokasi</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💰</div><div class="stat-body"><div class="lbl">Infaq Terakhir</div><div class="val rupiah" style="font-size:15px">${rupiah(totalInfaq)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-teal">📊</div><div class="stat-body"><div class="lbl">Total Terkumpul</div><div class="val rupiah" style="font-size:15px">${rupiah(totalAll)}</div></div></div>
  `;
}

// ============ DATA KOTAK ============
function loadKotak() {
  let data = DB.get('kotak_infaq');
  const sr = document.getElementById('srKotak').value.toLowerCase();
  const kota = document.getElementById('srKotaKota').value.toLowerCase();
  const st = document.getElementById('flKotakStatus').value;
  const fr = document.getElementById('flFrekuensi').value;
  if (sr) data = data.filter(k => k.nama_kotak.toLowerCase().includes(sr) || k.nama_toko.toLowerCase().includes(sr));
  if (kota) data = data.filter(k => k.kota?.toLowerCase().includes(kota));
  if (st) data = data.filter(k => k.status === st);
  if (fr) data = data.filter(k => k.frekuensi === fr);

  document.getElementById('cntKotak').textContent = data.length;
  const { items, total } = paginate(data, pgKotak, PS);

  document.getElementById('kotakGrid').innerHTML = items.length ? items.map(k => `
    <div class="kotak-card">
      <div class="kc-head">
        <div>
          <div class="kc-name">📦 ${k.nama_kotak}</div>
          <div class="kc-loc">🏪 ${k.nama_toko}</div>
          <div class="kc-loc">📍 ${k.alamat ? k.alamat + ', ' : ''}${k.kecamatan ? k.kecamatan + ', ' : ''}${k.kota}</div>
          <div class="kc-loc" style="margin-top:4px">👤 ${k.pemilik} · 📞 ${k.hp}</div>
        </div>
        <div>${badge(k.status)}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        ${badge(k.frekuensi||'bulanan')}
        <span class="badge b-gray">Petugas: ${k.petugas||'-'}</span>
      </div>
      <div class="kc-foot">
        <div>
          <div style="font-size:11px;color:var(--gray-400)">Terakhir diambil: ${tgl(k.tgl_ambil)}</div>
          <div class="kc-nominal">${rupiah(k.nominal_terakhir)}</div>
        </div>
        <div class="kc-actions">
          <button class="btn btn-success btn-sm" onclick="openModalAmbil('${k.id}')" title="Catat Pengambilan">📦 Ambil</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalKotak('${k.id}')" title="Edit">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusKotak('${k.id}')" title="Hapus">🗑️</button>
        </div>
      </div>
    </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><div class="ei">🗃️</div><div class="et">Belum ada kotak infaq</div></div>`;

  document.getElementById('pagKotak').innerHTML = '';
  renderPagination('pagKotak', total, pgKotak, PS, 'goPgKotak');
}
window.goPgKotak = p => { pgKotak=p; loadKotak(); };

// ============ MODAL KOTAK ============
window.openModalKotak = function(id=null) {
  const k = id ? DB.get('kotak_infaq').find(x=>x.id===id) : null;
  const html = `<div class="overlay" id="ovKotak">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>${k?'Edit':'Tambah'} Kotak Infaq</h3><button class="modal-close" onclick="closeModal('ovKotak')">✕</button></div>
      <div class="modal-body">
        <div class="sec-div">Data Kotak & Lokasi</div>
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Nama Toko/Tempat *</label>
            <input id="kNamaToko" class="fctrl" value="${k?.nama_toko||''}" placeholder="Nama toko atau tempat">
          </div>
          <div class="fg"><label class="flabel">Nama Pemilik</label><input id="kPemilik" class="fctrl" value="${k?.pemilik||''}"></div>
          <div class="fg"><label class="flabel">No. HP Pemilik</label><input id="kHP" class="fctrl" value="${k?.hp||''}"></div>
          <div class="fg fcol2"><label class="flabel">Alamat Lengkap</label><input id="kAlamat" class="fctrl" value="${k?.alamat||''}"></div>
          <div class="fg"><label class="flabel">Kecamatan</label><input id="kKecamatan" class="fctrl" value="${k?.kecamatan||''}"></div>
          <div class="fg"><label class="flabel">Kota/Kabupaten</label><input id="kKota" class="fctrl" value="${k?.kota||''}"></div>
        </div>
        <div class="sec-div">Data Operasional</div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Frekuensi Pengambilan</label>
            <select id="kFrekuensi" class="fctrl">${['mingguan','dua_mingguan','bulanan'].map(f=>`<option value="${f}" ${k?.frekuensi===f?'selected':''}>${f}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Petugas</label><input id="kPetugas" class="fctrl" value="${k?.petugas||''}"></div>
          <div class="fg"><label class="flabel">Nominal Terakhir (Rp)</label><input type="number" id="kNominal" class="fctrl" value="${k?.nominal_terakhir||''}"></div>
          <div class="fg"><label class="flabel">Tgl Pengambilan Terakhir</label><input type="date" id="kTglAmbil" class="fctrl" value="${tglInput(k?.tgl_ambil)||''}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="kStatus" class="fctrl">${['aktif','tidak_aktif'].map(s=>`<option value="${s}" ${k?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="kCatatan" class="fctrl">${k?.catatan||''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovKotak')">Batal</button>
        <button class="btn btn-primary" onclick="saveKotak('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.updateNamaKotak = function() {
  const tipe = document.getElementById('kTipeKotak')?.value || 'Kotak Infaq';
  const toko = document.getElementById('kNamaToko')?.value.trim() || '';
  const namaEl = document.getElementById('kNamaKotak');
  if (namaEl) namaEl.value = toko ? `${tipe} ${toko}` : tipe;
};

window.saveKotak = async function(id) {
  const namaToko = document.getElementById('kNamaToko').value.trim();
  if (!namaToko) { toast('Nama toko wajib diisi', 'warn'); return; }
  const namaKotak = `Kotak Infaq ${namaToko}`;
  const ok = await confirmSave(`Simpan kotak <strong>${namaKotak}</strong>?`);
  if (!ok) return;
  const data = DB.get('kotak_infaq');
  const payload = {
    nama_kotak: namaKotak, nama_toko: namaToko,
    pemilik: document.getElementById('kPemilik').value.trim(),
    hp: document.getElementById('kHP').value.trim(),
    alamat: document.getElementById('kAlamat').value.trim(),
    kecamatan: document.getElementById('kKecamatan').value.trim(),
    kota: document.getElementById('kKota').value.trim(),
    frekuensi: document.getElementById('kFrekuensi').value,
    petugas: document.getElementById('kPetugas').value.trim(),
    nominal_terakhir: +document.getElementById('kNominal').value||0,
    tgl_ambil: document.getElementById('kTglAmbil').value||null,
    status: document.getElementById('kStatus').value,
    catatan: document.getElementById('kCatatan').value.trim(),
  };
  const r = id ? await DB.update('kotak_infaq',id,payload) : await DB.insert('kotak_infaq',payload);
  if(!r){toast('Gagal menyimpan','err');return;}
  await DB.sync('kotak_infaq');
  toast(id?'Data diperbarui':'Kotak berhasil ditambahkan','ok');
  closeModal('ovKotak'); loadKiStats(); loadKotak();
};

window.hapusKotak = async function(id) {
  if (!await confirmDel('Hapus data kotak infaq ini?')) return;
  await DB.delete('kotak_infaq',id);
  await DB.sync('kotak_infaq');
  toast('Dihapus','ok'); loadKiStats(); loadKotak();
};

// ============ CATAT PENGAMBILAN ============
window.openModalAmbil = function(kotakId=null) {
  const kotak = DB.get('kotak_infaq');
  const opsi = kotak.filter(k=>k.status==='aktif').map(k=>`<option value="${k.id}" ${k.id===kotakId?'selected':''}>${k.nama_kotak} - ${k.nama_toko}</option>`).join('');
  const html = `<div class="overlay" id="ovAmbil">
    <div class="modal" style="max-width:460px">
      <div class="modal-head"><h3>📦 Catat Pengambilan Infaq</h3><button class="modal-close" onclick="closeModal('ovAmbil')">✕</button></div>
      <div class="modal-body">
        <div class="fg mb3"><label class="flabel">Kotak Infaq *</label><select id="aKotak" class="fctrl"><option value="">-- Pilih Kotak --</option>${opsi}</select></div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Tanggal Ambil *</label><input type="date" id="aTgl" class="fctrl" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="fg"><label class="flabel">Nominal (Rp) *</label><input type="number" id="aNominal" class="fctrl" placeholder="250000"></div>
          <div class="fg"><label class="flabel">Petugas</label><input id="aPetugas" class="fctrl" placeholder="Nama petugas"></div>
          <div class="fg"><label class="flabel">Catatan</label><input id="aCatatan" class="fctrl" placeholder="Opsional"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovAmbil')">Batal</button>
        <button class="btn btn-success" onclick="saveAmbil()">Simpan</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveAmbil = async function() {
  const kotakId = document.getElementById('aKotak').value;
  const tglAmbil = document.getElementById('aTgl').value;
  const nominal = +document.getElementById('aNominal').value;
  if (!kotakId || !tglAmbil || !nominal) { toast('Semua field wajib diisi','warn'); return; }
  const kotak = DB.get('kotak_infaq').find(k=>k.id===kotakId);
  const ok = await confirmSave(`Catat pengambilan <strong>${rupiah(nominal)}</strong> dari <strong>${kotak?.nama_kotak}</strong>?`);
  if (!ok) return;
  await DB.update('kotak_infaq', kotakId, { nominal_terakhir: nominal, tgl_ambil: tglAmbil });
  const r = await DB.insert('pengambilan_kotak', { kotak_id:kotakId, nama_kotak:kotak?.nama_kotak, nama_toko:kotak?.nama_toko, tgl_ambil:tglAmbil, nominal, petugas:document.getElementById('aPetugas').value.trim(), catatan:document.getElementById('aCatatan').value.trim() });
  if(!r){toast('Gagal','err');return;}
  await Promise.all([DB.sync('kotak_infaq'),DB.sync('pengambilan_kotak')]);
  toast('Pengambilan berhasil dicatat','ok');
  closeModal('ovAmbil'); loadKiStats(); loadKotak(); loadAmbilByBulan();
};

// ============ RIWAYAT PENGAMBILAN ============
function loadAmbil() {
  // Inisialisasi filter tahun lalu langsung load by bulan
  initAmbilFilter();
  loadAmbilByBulan();
}

function initAmbilFilter() {
  const selTahun = document.getElementById('flAmbilTahun');
  if (!selTahun || selTahun.options.length > 0) return;
  const now = new Date();
  const tahunNow = now.getFullYear();
  const tahunSet = new Set([String(tahunNow), String(tahunNow-1)]);
  DB.get('pengambilan_kotak').forEach(a => { if (a.tgl_ambil) tahunSet.add(a.tgl_ambil.slice(0,4)); });
  selTahun.innerHTML = [...tahunSet].sort((a,b)=>b-a).map(t =>
    `<option value="${t}" ${t==tahunNow?'selected':''}>${t}</option>`).join('');
  const selBulan = document.getElementById('flAmbilBulan');
  if (selBulan) selBulan.value = String(now.getMonth()+1).padStart(2,'0');
}

window.loadAmbilByBulan = function() {
  const bulan = document.getElementById('flAmbilBulan')?.value;
  const tahun = document.getElementById('flAmbilTahun')?.value;
  const filter = document.getElementById('flAmbilFilter')?.value || 'semua';
  const sr = document.getElementById('srAmbil')?.value.toLowerCase() || '';
  if (!bulan || !tahun) return;

  const periode = `${tahun}-${bulan}`;
  const BULAN_NAMA = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  let kotakAktif = DB.get('kotak_infaq').filter(k => k.status === 'aktif');
  if (sr) kotakAktif = kotakAktif.filter(k =>
    k.nama_kotak?.toLowerCase().includes(sr) || k.nama_toko?.toLowerCase().includes(sr));

  const ambilBulan = DB.get('pengambilan_kotak').filter(a => a.tgl_ambil?.startsWith(periode));
  const sudahIds = new Set(ambilBulan.map(a => a.kotak_id));
  const sudah = kotakAktif.filter(k => sudahIds.has(k.id));
  const belum = kotakAktif.filter(k => !sudahIds.has(k.id));
  const totalSudah = ambilBulan.reduce((s,a) => s+(+a.nominal||0), 0);

  // Update counter tab
  document.getElementById('cntAmbil').textContent = ambilBulan.length;

  // Summary cards
  const summary = document.getElementById('ambilSummary');
  if (summary) summary.innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">📅</div><div class="stat-body"><div class="lbl">Periode</div><div class="val" style="font-size:14px">${BULAN_NAMA[+bulan]} ${tahun}</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Sudah Diambil</div><div class="val">${sudah.length}</div><div class="sub">${ambilBulan.length} kali ambil</div></div></div>
    <div class="stat"><div class="stat-ico ic-red">⏳</div><div class="stat-body"><div class="lbl">Belum Diambil</div><div class="val">${belum.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Total Terkumpul</div><div class="val rupiah" style="font-size:14px">${rupiah(totalSudah)}</div></div></div>
  `;

  const cntS = document.getElementById('cntSudahAmbil');
  const cntB = document.getElementById('cntBelumAmbil');
  if (cntS) cntS.textContent = sudah.length;
  if (cntB) cntB.textContent = belum.length;

  const secS = document.getElementById('sectionSudahAmbil');
  const secB = document.getElementById('sectionBelumAmbil');
  if (secS) secS.style.display = filter === 'belum' ? 'none' : 'block';
  if (secB) secB.style.display = filter === 'sudah' ? 'none' : 'block';

  // Tabel SUDAH diambil
  const ambilSorted = [...ambilBulan].sort((a,b) => new Date(b.tgl_ambil)-new Date(a.tgl_ambil));
  const tblS = document.getElementById('tblSudahAmbil');
  if (tblS) tblS.innerHTML = ambilSorted.length ? ambilSorted.map(a => {
    const k = kotakAktif.find(x => x.id === a.kotak_id) || {};
    return `<tr style="border-left:3px solid var(--success)">
      <td class="td-name">${a.nama_kotak || k.nama_kotak || '-'}</td>
      <td style="font-size:12px">${a.nama_toko || k.nama_toko || '-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td style="font-size:12px;white-space:nowrap">${tgl(a.tgl_ambil)}</td>
      <td class="rupiah" style="font-weight:700;color:#f97316">${rupiah(a.nominal)}</td>
      <td style="font-size:12px">${a.petugas||k.petugas||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${a.catatan||'-'}</td>
      <td><button class="btn btn-ghost btn-sm btn-icon" onclick="hapusAmbilById('${a.id}')">🗑️</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--gray-400)">Belum ada pengambilan di periode ini</td></tr>`;

  // Tabel BELUM diambil
  const tblB = document.getElementById('tblBelumAmbil');
  if (tblB) tblB.innerHTML = belum.length ? belum.map(k => {
    const hariSejak = k.tgl_ambil ? Math.floor((new Date()-new Date(k.tgl_ambil))/86400000) : null;
    const terlambat = hariSejak !== null && (
      (k.frekuensi==='mingguan' && hariSejak>7) ||
      (k.frekuensi==='dua_mingguan' && hariSejak>14) ||
      (k.frekuensi==='bulanan' && hariSejak>30));
    return `<tr style="border-left:3px solid var(--danger);${terlambat?'background:#fef9f9':''}">
      <td class="td-name">${k.nama_kotak}${terlambat?' <span class="badge b-red" style="font-size:10px">Terlambat!</span>':''}</td>
      <td style="font-size:12px">${k.nama_toko}</td>
      <td style="font-size:12px;max-width:130px;overflow:hidden;text-overflow:ellipsis">${k.alamat||'-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td>${badge(k.frekuensi||'bulanan')}</td>
      <td style="font-size:12px">${k.tgl_ambil?tgl(k.tgl_ambil):'<span style="color:var(--gray-300)">Belum pernah</span>'}</td>
      <td style="font-size:12px">${k.petugas||'-'}</td>
      <td><button class="btn btn-success btn-sm" onclick="closeModal('');openModalAmbil('${k.id}')">📦 Ambil</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--success)">🎉 Semua kotak sudah diambil!</td></tr>`;
};

window.goPgAmbil = p => { pgAmbil=p; loadAmbil(); };
window.hapusAmbil = async function(id) {
  if (!await confirmDel('Hapus riwayat pengambilan ini?')) return;
  DB.set('pengambilan_kotak', DB.get('pengambilan_kotak').filter(x=>x.id!==id));
  toast('Dihapus','ok'); loadKiStats(); loadAmbilByBulan();
};
window.hapusAmbilById = window.hapusAmbil;

// ============ PROSPEK KOTAK ============
function loadProsKotak() {
  let data = DB.get('prospek_kotak');
  const sr = document.getElementById('srProsKotak').value.toLowerCase();
  const st = document.getElementById('flProsKotakStatus').value;
  if (sr) data = data.filter(d=>d.nama_toko?.toLowerCase().includes(sr)||d.pemilik?.toLowerCase().includes(sr));
  if (st) data = data.filter(d=>d.status===st);
  document.getElementById('cntProsKotak').textContent = data.length;
  const { items, total } = paginate(data, pgProsKotak, PS);
  document.getElementById('tblProsKotak').innerHTML = items.length ? items.map(d=>`
    <tr>
      <td class="td-name">${d.nama_toko}</td>
      <td>${d.pemilik||'-'}</td>
      <td class="td-mono">${d.hp||'-'}</td>
      <td style="font-size:12px">${d.alamat||'-'}</td>
      <td style="font-size:12px">${d.kota||'-'}</td>
      <td>${badge(d.status)}</td>
      <td style="font-size:12px">${d.petugas||'-'}</td>
      <td><div class="td-actions">
        <button class="btn btn-success btn-sm" onclick="jadikanKotakAktif('${d.id}')">✓ Pasang Kotak</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalProsKotak('${d.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusProsKotak('${d.id}')">🗑️</button>
      </div></td>
    </tr>`).join('') : `<tr><td colspan="8"><div class="empty"><div class="ei">👤</div><div class="et">Belum ada prospek</div></div></td></tr>`;
  renderPagination('pagProsKotak', total, pgProsKotak, PS, 'goPgProsKotak');
}
window.goPgProsKotak = p => { pgProsKotak=p; loadProsKotak(); };

window.openModalProsKotak = function(id=null) {
  const d = id ? DB.get('prospek_kotak').find(x=>x.id===id) : null;
  const html = `<div class="overlay" id="ovProsKotak">
    <div class="modal">
      <div class="modal-head"><h3>${d?'Edit':'Tambah'} Prospek Kotak Infaq</h3><button class="modal-close" onclick="closeModal('ovProsKotak')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg"><label class="flabel">Nama Toko *</label><input id="pkNamaToko" class="fctrl" value="${d?.nama_toko||''}"></div>
          <div class="fg"><label class="flabel">Pemilik</label><input id="pkPemilik" class="fctrl" value="${d?.pemilik||''}"></div>
          <div class="fg"><label class="flabel">No. HP</label><input id="pkHP" class="fctrl" value="${d?.hp||''}"></div>
          <div class="fg"><label class="flabel">Kota</label><input id="pkKota" class="fctrl" value="${d?.kota||''}"></div>
          <div class="fg"><label class="flabel">Kecamatan</label><input id="pkKecamatan" class="fctrl" value="${d?.kecamatan||''}"></div>
          <div class="fg fcol2"><label class="flabel">Alamat</label><input id="pkAlamat" class="fctrl" value="${d?.alamat||''}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="pkStatus" class="fctrl">${['baru','dihubungi','survei'].map(s=>`<option value="${s}" ${d?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Petugas</label><input id="pkPetugas" class="fctrl" value="${d?.petugas||''}"></div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="pkCatatan" class="fctrl">${d?.catatan||''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovProsKotak')">Batal</button>
        <button class="btn btn-primary" onclick="saveProsKotak('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveProsKotak = async function(id) {
  const nama = document.getElementById('pkNamaToko').value.trim();
  if (!nama) { toast('Nama toko wajib diisi','warn'); return; }
  const payload = { nama_toko:nama, pemilik:document.getElementById('pkPemilik').value.trim(), hp:document.getElementById('pkHP').value.trim(), kota:document.getElementById('pkKota').value.trim(), kecamatan:document.getElementById('pkKecamatan').value.trim(), alamat:document.getElementById('pkAlamat').value.trim(), status:document.getElementById('pkStatus').value, petugas:document.getElementById('pkPetugas').value.trim(), catatan:document.getElementById('pkCatatan').value.trim() };
  const r = id ? await DB.update('prospek_kotak',id,payload) : await DB.insert('prospek_kotak',payload);
  if(!r){toast('Gagal menyimpan','err');return;}
  await DB.sync('prospek_kotak');
  toast('Data prospek tersimpan','ok'); closeModal('ovProsKotak'); loadKiStats(); loadProsKotak();
};

window.hapusProsKotak = async function(id) {
  if (!await confirmDel()) return;
  await DB.delete('prospek_kotak',id);
  await DB.sync('prospek_kotak');
  toast('Dihapus','ok'); loadKiStats(); loadProsKotak();
};

window.jadikanKotakAktif = async function(id) {
  const p = DB.get('prospek_kotak').find(x=>x.id===id);
  if (!p) return;
  const ok = await confirmAction('📦','Pasang Kotak Infaq?',`<strong>${p.nama_toko}</strong> akan ditambahkan sebagai lokasi kotak infaq aktif.`,'Ya, Pasang','btn-success');
  if (!ok) return;
  const r = await DB.insert('kotak_infaq',{ nama_kotak:`Kotak Infaq ${p.nama_toko}`, nama_toko:p.nama_toko, pemilik:p.pemilik||'', hp:p.hp||'', alamat:p.alamat||'', kecamatan:p.kecamatan||'', kota:p.kota||'', frekuensi:'bulanan', petugas:p.petugas||'', nominal_terakhir:0, tgl_ambil:null, status:'aktif', catatan:p.catatan||'' });
  if(!r){toast('Gagal','err');return;}
  await DB.delete('prospek_kotak',id);
  await Promise.all([DB.sync('kotak_infaq'),DB.sync('prospek_kotak')]);
  toast(`${p.nama_toko} berhasil dipasang kotak infaq!`,'ok');
  loadKiStats(); loadKotak(); loadProsKotak();
};

function exportKI() {
  const data = DB.get('kotak_infaq').map(k => ({
    nama_kotak: k.nama_kotak,
    nama_toko: k.nama_toko,
    pemilik: k.pemilik || '',
    hp: k.hp || '',
    alamat: k.alamat || '',
    kecamatan: k.kecamatan || '',
    kota: k.kota || '',
    frekuensi: k.frekuensi || '',
    petugas: k.petugas || '',
    nominal_terakhir: k.nominal_terakhir || 0,
    tgl_ambil: k.tgl_ambil || '',
    status: k.status || ''
  }));
  exportExcel(data, 'KotakInfaq', 'Kotak Infaq');
}

// ============ IMPORT EXCEL/CSV KOTAK INFAQ ============
window.triggerImportKotak = function() {
  const html = `<div class="overlay" id="ovImportKotak">
    <div class="modal" style="max-width:500px">
      <div class="modal-head"><h3>⬆️ Import Data Kotak Infaq</h3><button class="modal-close" onclick="closeModal('ovImportKotak')">✕</button></div>
      <div class="modal-body">
        <div class="fg mb3">
          <label class="flabel">Masukkan sebagai *</label>
          <select id="importKotakType" class="fctrl">
            <option value="kotak_infaq">Data Kotak Infaq (Aktif)</option>
            <option value="prospek_kotak">Prospek Kotak Infaq</option>
          </select>
        </div>
        <div class="fg mb3">
          <label class="flabel">Jika nama kotak sudah ada</label>
          <select id="importKotakDup" class="fctrl">
            <option value="skip">Lewati (skip)</option>
            <option value="update">Perbarui data lama</option>
          </select>
        </div>
        <div style="background:var(--primary-light);border-radius:8px;padding:12px;font-size:12px;color:var(--primary);margin-bottom:16px">
          <strong>Kotak Infaq — Format kolom:</strong><br>
          nama_kotak, nama_toko, pemilik, hp, alamat, kecamatan, kota, frekuensi, petugas, catatan<br><br>
          <strong>Prospek Kotak — Format kolom:</strong><br>
          nama_toko, pemilik, hp, alamat, kecamatan, kota, petugas, catatan<br>
          <em>Baris pertama = header kolom</em>
        </div>
        <div onclick="document.getElementById('importKotakFile').click()"
          style="border:2px dashed var(--gray-300);border-radius:10px;padding:32px;text-align:center;cursor:pointer;background:var(--gray-50)"
          ondragover="event.preventDefault();this.style.borderColor='var(--primary)'"
          ondragleave="this.style.borderColor='var(--gray-300)'"
          ondrop="event.preventDefault();this.style.borderColor='var(--gray-300)';handleKotakDrop(event)">
          <div style="font-size:36px;margin-bottom:8px">📂</div>
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">Klik atau drag & drop file</div>
          <div style="font-size:12px;color:var(--gray-400)">Mendukung .xlsx, .xls, .csv</div>
        </div>
        <input type="file" id="importKotakFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="processKotakFile(this.files[0])">
        <div id="importKotakProgress" style="display:none;margin-top:12px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovImportKotak')">Batal</button>
        <button class="btn btn-outline btn-sm" onclick="downloadKotakTemplate()">⬇️ Download Template</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.handleKotakDrop = function(e) {
  const file = e.dataTransfer.files[0];
  if (file) processKotakFile(file);
};

window.processKotakFile = function(file) {
  const prog = document.getElementById('importKotakProgress');
  if (prog) { prog.style.display='block'; prog.innerHTML=`<div style="color:var(--primary);font-size:13px">⏳ Membaca <strong>${file.name}</strong>...</div>`; }
  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  const parse = async (csvText) => {
    try {
      const lines = csvText.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { showKotakError('File kosong'); return; }
      const headers = lines[0].split(/[,\t]/).map(h => h.replace(/^"|"$/g,'').trim().toLowerCase().replace(/\s+/g,'_').replace(/no_?hp|nomor_?hp/,'hp').replace(/nama_kotak.*/,'nama_kotak').replace(/nama_toko|nama_tempat/,'nama_toko'));
      const rows = lines.slice(1).map(line => {
        const vals=[]; let inQ=false,cur='';
        for(const ch of line){if(ch==='"')inQ=!inQ;else if((ch===','||ch==='\t')&&!inQ){vals.push(cur.trim());cur='';}else cur+=ch;}
        vals.push(cur.trim());
        const obj={}; headers.forEach((h,i)=>obj[h]=(vals[i]||'').replace(/^"|"$/g,'').trim()); return obj;
      }).filter(r=>r.nama_kotak||r.nama_toko);
      if (!rows.length) { showKotakError('Tidak ada data valid'); return; }
      const type = document.getElementById('importKotakType').value;
      const dupMode = document.getElementById('importKotakDup').value;
      const existing = await DB.sync(type);
      let sukses=0,skip=0,update=0,gagal=0;
      for (const row of rows) {
        if (type==='kotak_infaq') {
          const namaKotak = row.nama_kotak||`Kotak Infaq ${row.nama_toko}`;
          const payload = {nama_kotak:namaKotak,nama_toko:row.nama_toko||row.nama_kotak,pemilik:row.pemilik||'',hp:row.hp||'',alamat:row.alamat||'',kecamatan:row.kecamatan||'',kota:row.kota||'',frekuensi:row.frekuensi||'bulanan',petugas:row.petugas||'',nominal_terakhir:0,tgl_ambil:null,status:'aktif',catatan:row.catatan||''};
          const ex=existing.find(e=>e.nama_kotak===namaKotak);
          if(ex){if(dupMode==='update'){const r=await DB.update(type,ex.id,payload);r?update++:gagal++;}else skip++;}
          else{const r=await DB.insert(type,payload);r?sukses++:gagal++;}
        } else {
          if(!row.nama_toko) continue;
          const payload={nama_toko:row.nama_toko,pemilik:row.pemilik||'',hp:row.hp||'',alamat:row.alamat||'',kecamatan:row.kecamatan||'',kota:row.kota||'',status:'baru',petugas:row.petugas||'',catatan:row.catatan||''};
          const ex=existing.find(e=>e.nama_toko===row.nama_toko);
          if(ex){if(dupMode==='update'){const r=await DB.update(type,ex.id,payload);r?update++:gagal++;}else skip++;}
          else{const r=await DB.insert(type,payload);r?sukses++:gagal++;}
        }
      }
      await DB.sync(type);
      if(prog) prog.innerHTML=`<div style="background:var(--success-light);border-radius:8px;padding:14px"><div style="font-weight:700;color:var(--success);margin-bottom:6px">✅ Import Berhasil!</div><div style="font-size:13px;display:flex;gap:12px;flex-wrap:wrap"><span>✓ <strong>${sukses}</strong> ditambahkan</span><span>🔄 <strong>${update}</strong> diperbarui</span><span>⏭️ <strong>${skip}</strong> dilewati</span>${gagal?`<span style="color:var(--danger)">❌ <strong>${gagal}</strong> gagal</span>`:''}</div></div>`;
      loadKiStats();loadKotak();loadProsKotak();
      toast(`Import selesai! ${sukses} data masuk`,'ok');
    } catch(err) { showKotakError('Error: '+err.message); console.error(err); }
  };
  if(ext==='csv'){reader.onload=e=>parse(e.target.result);reader.readAsText(file,'UTF-8');}
  else{reader.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array'});parse(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]));}catch(err){showKotakError('Gagal baca Excel: '+err.message);}};reader.readAsArrayBuffer(file);}
};

function showKotakError(msg) {
  const prog = document.getElementById('importKotakProgress');
  if (prog) prog.innerHTML = `<div style="background:var(--danger-light);border-radius:8px;padding:12px;color:var(--danger);font-size:13px">❌ ${msg}</div>`;
}

window.downloadKotakTemplate = function() {
  const type = document.getElementById('importKotakType')?.value || 'kotak_infaq';
  const isKotak = type === 'kotak_infaq';

  const headers = isKotak
    ? ['nama_kotak','nama_toko','pemilik','hp','alamat','kecamatan','kota','frekuensi','petugas','catatan']
    : ['nama_toko','pemilik','hp','alamat','kecamatan','kota','petugas','catatan'];

  const labels = isKotak
    ? ['Nama Kotak','Nama Toko/Tempat','Nama Pemilik','No. HP','Alamat','Kecamatan','Kota','Frekuensi','Petugas','Catatan']
    : ['Nama Toko/Tempat','Nama Pemilik','No. HP','Alamat','Kecamatan','Kota','Petugas','Catatan'];

  const contoh = isKotak
    ? [['Kotak Infaq Warung Bu Sri','Warung Bu Sri','Bu Sri','081111222333','Jl. Raya No.5','Kebayoran','Jakarta Selatan','bulanan','Ahmad',''],
       ['KCS Toko Maju','Toko Maju','Pak Jono','082222333444','Jl. Pasar No.3','Ciputat','Tangerang','mingguan','Budi','']]
    : [['Toko Berkah','Pak Hasan','083333444555','Jl. Mawar No.2','Beji','Depok','Citra','Tertarik pasang kotak'],
       ['Warung Nasi Barokah','Bu Yati','084444555666','Jl. Kenanga No.8','Pancoran','Jakarta Selatan','Ahmad','']];

  const title = isKotak ? 'Template Import Kotak Infaq' : 'Template Import Prospek Kotak';
  buildTemplateExcel(title, labels, headers, contoh, type);
};
