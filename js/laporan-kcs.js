const BULAN_NAMA = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', () => {
  initFilter();
  renderLapKCS();
});

function initFilter() {
  const now = new Date();
  const tahun = now.getFullYear();
  document.getElementById('lkTahun').innerHTML =
    [tahun, tahun-1, tahun-2].map(t=>`<option value="${t}" ${t===tahun?'selected':''}>${t}</option>`).join('');
  document.getElementById('lkBulan').value = String(now.getMonth()+1).padStart(2,'0');

  const kcsData = DB.get('kcs_data');
  const kota = [...new Set(kcsData.map(k=>k.kota).filter(Boolean))].sort();
  const petugas = [...new Set(kcsData.map(k=>k.petugas).filter(Boolean))].sort();
  document.getElementById('lkKota').innerHTML = '<option value="">Semua Kota</option>' + kota.map(k=>`<option>${k}</option>`).join('');
  document.getElementById('lkPetugas').innerHTML = '<option value="">Semua Petugas</option>' + petugas.map(p=>`<option>${p}</option>`).join('');
}

window.renderLapKCS = function() {
  const bulan = document.getElementById('lkBulan').value;
  const tahun = document.getElementById('lkTahun').value;
  const kota = document.getElementById('lkKota').value;
  const petugas = document.getElementById('lkPetugas').value;
  const periode = `${tahun}-${bulan}`;

  let kcsAktif = DB.get('kcs_data').filter(k=>k.status==='aktif');
  if (kota) kcsAktif = kcsAktif.filter(k=>k.kota===kota);
  if (petugas) kcsAktif = kcsAktif.filter(k=>k.petugas===petugas);

  let ambilBulan = DB.get('kcs_pengambilan').filter(a=>a.tgl_ambil?.startsWith(periode));
  const sudahIds = new Set(ambilBulan.map(a=>a.kcs_id));
  const sudah = kcsAktif.filter(k=>sudahIds.has(k.id));
  const belum = kcsAktif.filter(k=>!sudahIds.has(k.id));
  const totalSudah = ambilBulan.reduce((s,a)=>s+(+a.nominal||0),0);

  // Stats
  document.getElementById('lkStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">📅</div><div class="stat-body"><div class="lbl">Periode</div><div class="val" style="font-size:14px">${BULAN_NAMA[+bulan]} ${tahun}</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Sudah Diambil</div><div class="val">${sudah.length}</div><div class="sub">${ambilBulan.length}x ambil</div></div></div>
    <div class="stat"><div class="stat-ico ic-red">⏳</div><div class="stat-body"><div class="lbl">Belum Diambil</div><div class="val">${belum.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Total Terkumpul</div><div class="val rupiah" style="font-size:15px">${rupiah(totalSudah)}</div></div></div>
  `;

  document.getElementById('lkCntSudah').textContent = sudah.length;
  document.getElementById('lkCntBelum').textContent = belum.length;

  // Tabel sudah diambil
  const ambilSorted = [...ambilBulan].sort((a,b)=>new Date(b.tgl_ambil)-new Date(a.tgl_ambil));
  document.getElementById('lkTblSudah').innerHTML = ambilSorted.length ? ambilSorted.map(a=>{
    const k = kcsAktif.find(x=>x.id===a.kcs_id)||{};
    return `<tr>
      <td class="td-name">${a.nama_kotak||'-'}</td>
      <td style="font-size:12px">${a.nama_toko||'-'}</td>
      <td style="font-size:12px;max-width:140px;overflow:hidden;text-overflow:ellipsis">${k.alamat||'-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td style="font-size:12px;white-space:nowrap">${tgl(a.tgl_ambil)}</td>
      <td class="rupiah" style="font-weight:700;color:#f97316">${rupiah(a.nominal)}</td>
      <td style="font-size:12px">${a.petugas||k.petugas||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${a.catatan||'-'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--gray-400)">Belum ada pengambilan bulan ini</td></tr>`;

  document.getElementById('lkFootSudah').innerHTML = ambilSorted.length ? `
    <tr><td colspan="5" style="padding:10px 14px">TOTAL (${ambilSorted.length} pengambilan)</td>
    <td class="rupiah" style="padding:10px 14px;color:#f97316">${rupiah(totalSudah)}</td>
    <td colspan="2"></td></tr>` : '';

  // Tabel belum diambil
  document.getElementById('lkTblBelum').innerHTML = belum.length ? belum.map(k=>{
    const hari = k.tgl_ambil ? Math.floor((new Date()-new Date(k.tgl_ambil))/86400000) : null;
    const terlambat = hari&&((k.frekuensi==='mingguan'&&hari>7)||(k.frekuensi==='dua_mingguan'&&hari>14)||(k.frekuensi==='bulanan'&&hari>30));
    return `<tr style="${terlambat?'background:#fef9f9':''}">
      <td class="td-name">${k.nama_kotak}${terlambat?' <span class="badge b-red" style="font-size:10px">Terlambat!</span>':''}</td>
      <td style="font-size:12px">${k.nama_toko}</td>
      <td style="font-size:12px;max-width:140px;overflow:hidden;text-overflow:ellipsis">${k.alamat||'-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td>${badge(k.frekuensi||'bulanan')}</td>
      <td style="font-size:12px">${k.tgl_ambil?tgl(k.tgl_ambil):'<span style="color:var(--gray-300)">Belum pernah</span>'}</td>
      <td class="rupiah" style="font-size:12px">${rupiah(k.nominal_terakhir||0)}</td>
      <td style="font-size:12px">${k.petugas||'-'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--success)">🎉 Semua KCS sudah diambil!</td></tr>`;

  const totalBelum = belum.reduce((s,k)=>s+(+k.nominal_terakhir||0),0);
  document.getElementById('lkFootBelum').innerHTML = belum.length ? `
    <tr><td colspan="6" style="padding:10px 14px">ESTIMASI BELUM DIAMBIL (${belum.length} KCS)</td>
    <td class="rupiah" style="padding:10px 14px;color:var(--danger)">${rupiah(totalBelum)}</td>
    <td></td></tr>` : '';

  // Rekap per KCS
  const rekapList = kcsAktif.map(k=>{
    const ambilK = ambilBulan.filter(a=>a.kcs_id===k.id);
    return {...k, jmlAmbil:ambilK.length, totalBulan:ambilK.reduce((s,a)=>s+(+a.nominal||0),0), sudah:ambilK.length>0};
  }).sort((a,b)=>b.totalBulan-a.totalBulan);

  const grandTotal = rekapList.reduce((s,k)=>s+k.totalBulan,0);
  document.getElementById('lkTblRekap').innerHTML = rekapList.map(k=>`<tr>
    <td class="td-name">${k.nama_kotak}</td>
    <td style="font-size:12px">${k.nama_toko}</td>
    <td style="font-size:12px">${k.kota||'-'}</td>
    <td style="text-align:center;font-weight:600">${k.jmlAmbil>0?k.jmlAmbil+'x':'—'}</td>
    <td class="rupiah" style="font-weight:700;color:${k.totalBulan?'#f97316':'var(--gray-400)'}">
      ${k.totalBulan?rupiah(k.totalBulan):'—'}</td>
    <td>${k.sudah?'<span class="badge b-green">✓ Sudah</span>':'<span class="badge b-red">Belum</span>'}</td>
  </tr>`).join('');

  document.getElementById('lkFootRekap').innerHTML = `
    <tr><td colspan="3" style="padding:10px 14px">TOTAL (${kcsAktif.length} KCS)</td>
    <td style="padding:10px 14px;text-align:center">${ambilBulan.length}x</td>
    <td class="rupiah" style="padding:10px 14px;color:#f97316">${rupiah(grandTotal)}</td>
    <td style="padding:10px 14px">${sudah.length}/${kcsAktif.length} diambil</td></tr>`;

  // Rekap bulanan
  const ambilAll = DB.get('kcs_pengambilan').filter(a=>a.tgl_ambil?.startsWith(tahun));
  let grandBulan = 0;
  const bRows = Array.from({length:12},(_,idx)=>{
    const mb = String(idx+1).padStart(2,'0');
    const ambilMb = ambilAll.filter(a=>a.tgl_ambil?.slice(5,7)===mb);
    const total = ambilMb.reduce((s,a)=>s+(+a.nominal||0),0);
    const diambil = new Set(ambilMb.map(a=>a.kcs_id)).size;
    const belumMb = kcsAktif.length - diambil;
    grandBulan += total;
    const isNow = new Date().getMonth()===idx && String(new Date().getFullYear())===tahun;
    return `<tr style="${isNow?'background:#fff7ed;font-weight:600':''}">
      <td>${BULAN_NAMA[idx+1]} ${tahun}${isNow?' 🔵':''}</td>
      <td style="text-align:center">${ambilMb.length}x</td>
      <td style="text-align:center;color:var(--success);font-weight:600">${diambil}</td>
      <td style="text-align:center;color:${belumMb?'var(--danger)':'var(--gray-400)'}">${belumMb}</td>
      <td class="rupiah" style="font-weight:700;color:${total?'#f97316':'var(--gray-400)'}">
        ${total?rupiah(total):'—'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${diambil?rupiah(Math.round(total/diambil)):'—'}</td>
    </tr>`;
  });
  document.getElementById('lkTblBulanan').innerHTML = bRows.join('');
  document.getElementById('lkFootBulanan').innerHTML = `
    <tr style="background:var(--gray-800);color:white">
      <td style="padding:10px 14px">TOTAL ${tahun}</td>
      <td style="padding:10px 14px;text-align:center">${ambilAll.length}x</td>
      <td colspan="2" style="padding:10px 14px;text-align:center">${kcsAktif.length} KCS aktif</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandBulan)}</td>
      <td style="padding:10px 14px"></td>
    </tr>`;
};

window.exportLapKCS = function() {
  const bulan = document.getElementById('lkBulan').value;
  const tahun = document.getElementById('lkTahun').value;
  const periode = `${tahun}-${bulan}`;
  const kcsAktif = DB.get('kcs_data').filter(k=>k.status==='aktif');
  const ambilBulan = DB.get('kcs_pengambilan').filter(a=>a.tgl_ambil?.startsWith(periode));
  const sudahIds = new Set(ambilBulan.map(a=>a.kcs_id));

  const rows = kcsAktif.map(k=>({
    nama_kotak:k.nama_kotak, nama_toko:k.nama_toko, alamat:k.alamat||'',
    kota:k.kota||'', petugas:k.petugas||'', frekuensi:k.frekuensi||'',
    status_bulan_ini: sudahIds.has(k.id)?'Sudah Diambil':'Belum Diambil',
    tgl_ambil_bulan_ini: ambilBulan.find(a=>a.kcs_id===k.id)?.tgl_ambil||'',
    total_bulan_ini: ambilBulan.filter(a=>a.kcs_id===k.id).reduce((s,a)=>s+(+a.nominal||0),0)||''
  }));

  exportExcel(rows, `LaporanKCS_${BULAN_NAMA[+bulan]}_${tahun}`, 'Laporan KCS');
};

// Init localStorage
if (localStorage.getItem('crm_kcs_data')===null) localStorage.setItem('crm_kcs_data','[]');
if (localStorage.getItem('crm_kcs_pengambilan')===null) localStorage.setItem('crm_kcs_pengambilan','[]');
