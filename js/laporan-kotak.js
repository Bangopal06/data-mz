const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', () => {
  initFilter();
  renderKotak();
});

function initFilter() {
  const now = new Date();

  // Tahun
  const selTahun = document.getElementById('flTahun');
  const tahunNow = now.getFullYear();
  selTahun.innerHTML = [tahunNow, tahunNow-1, tahunNow-2].map(t =>
    `<option value="${t}">${t}</option>`).join('');

  // Bulan default = bulan ini
  document.getElementById('flBulan').value = String(now.getMonth()+1).padStart(2,'0');

  // Kota
  const kota = [...new Set(DB.get('kotak_infaq').map(k => k.kota).filter(Boolean))].sort();
  const selKota = document.getElementById('flKota');
  selKota.innerHTML = '<option value="">Semua Kota</option>' + kota.map(k => `<option>${k}</option>`).join('');

  // Petugas
  const petugas = [...new Set(DB.get('kotak_infaq').map(k => k.petugas).filter(Boolean))].sort();
  const selPetugas = document.getElementById('flPetugas');
  selPetugas.innerHTML = '<option value="">Semua Petugas</option>' + petugas.map(p => `<option>${p}</option>`).join('');
}

window.renderKotak = function() {
  const bulan  = document.getElementById('flBulan').value;
  const tahun  = document.getElementById('flTahun').value;
  const kota   = document.getElementById('flKota').value;
  const petugas = document.getElementById('flPetugas').value;
  const periode = `${tahun}-${bulan}`;

  // Semua kotak aktif
  let kotakAktif = DB.get('kotak_infaq').filter(k => k.status === 'aktif');
  if (kota) kotakAktif = kotakAktif.filter(k => k.kota === kota);
  if (petugas) kotakAktif = kotakAktif.filter(k => k.petugas === petugas);

  // Pengambilan bulan ini
  let ambilBulanIni = DB.get('pengambilan_kotak').filter(a => a.tgl_ambil?.startsWith(periode));
  if (kota) ambilBulanIni = ambilBulanIni.filter(a => {
    const k = kotakAktif.find(x => x.id === a.kotak_id);
    return k?.kota === kota;
  });
  if (petugas) ambilBulanIni = ambilBulanIni.filter(a => a.petugas === petugas);

  // Set kotak yg sudah diambil
  const sudahKotakIds = new Set(ambilBulanIni.map(a => a.kotak_id));
  const sudah = kotakAktif.filter(k => sudahKotakIds.has(k.id));
  const belum = kotakAktif.filter(k => !sudahKotakIds.has(k.id));

  const totalSudah = ambilBulanIni.reduce((s,a) => s+(+a.nominal||0), 0);
  const totalRataRata = sudah.length ? Math.round(totalSudah / sudah.length) : 0;

  // STATS
  document.getElementById('statsKotak').innerHTML = `
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body">
      <div class="lbl">Sudah Diambil</div><div class="val">${sudah.length} kotak</div>
      <div class="sub">${ambilBulanIni.length} kali pengambilan</div></div></div>
    <div class="stat"><div class="stat-ico ic-red">⏳</div><div class="stat-body">
      <div class="lbl">Belum Diambil</div><div class="val">${belum.length} kotak</div>
      <div class="sub">Perlu dijadwalkan</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body">
      <div class="lbl">Total Terkumpul</div><div class="val rupiah" style="font-size:16px">${rupiah(totalSudah)}</div>
      <div class="sub">${BULAN_NAMA[+bulan-1]} ${tahun}</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">📊</div><div class="stat-body">
      <div class="lbl">Rata-rata/Kotak</div><div class="val rupiah" style="font-size:16px">${rupiah(totalRataRata)}</div></div></div>
  `;

  document.getElementById('cntSudahAmbil').textContent = sudah.length;
  document.getElementById('cntBelumAmbil').textContent = belum.length;

  // TABEL SUDAH DIAMBIL
  const ambilSorted = [...ambilBulanIni].sort((a,b) => new Date(b.tgl_ambil)-new Date(a.tgl_ambil));
  document.getElementById('tblSudahAmbil').innerHTML = ambilSorted.length ? ambilSorted.map(a => {
    const k = kotakAktif.find(x => x.id === a.kotak_id) || {};
    return `<tr class="kotak-sudah">
      <td class="td-name">${a.nama_kotak||k.nama_kotak||'-'}</td>
      <td style="font-size:12px">${a.nama_toko||k.nama_toko||'-'}</td>
      <td style="font-size:12px;max-width:150px">${k.alamat||'-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td style="font-size:12px">${tgl(a.tgl_ambil)}</td>
      <td class="rupiah" style="font-weight:700;color:#f97316">${rupiah(a.nominal)}</td>
      <td style="font-size:12px">${a.petugas||k.petugas||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${a.catatan||'-'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray-400)">Belum ada kotak yang diambil bulan ini</td></tr>`;

  document.getElementById('footSudahAmbil').innerHTML = ambilSorted.length ? `
    <tr><td colspan="5" style="padding:10px 14px">TOTAL (${ambilSorted.length} pengambilan)</td>
      <td class="rupiah" style="padding:10px 14px;color:#f97316">${rupiah(totalSudah)}</td>
      <td colspan="2"></td></tr>` : '';

  // TABEL BELUM DIAMBIL
  document.getElementById('tblBelumAmbil').innerHTML = belum.length ? belum.map(k => {
    const hariSejak = k.tgl_ambil ? Math.floor((new Date()-new Date(k.tgl_ambil))/(1000*60*60*24)) : null;
    const terlambat = hariSejak !== null && (
      (k.frekuensi === 'mingguan' && hariSejak > 7) ||
      (k.frekuensi === 'dua_mingguan' && hariSejak > 14) ||
      (k.frekuensi === 'bulanan' && hariSejak > 30)
    );
    return `<tr class="kotak-belum" style="${terlambat?'background:#fef2f2':''}">
      <td class="td-name">${k.nama_kotak}${terlambat?' <span class="badge b-red" style="font-size:10px">Terlambat</span>':''}</td>
      <td style="font-size:12px">${k.nama_toko}</td>
      <td style="font-size:12px;max-width:150px">${k.alamat||'-'}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td>${badge(k.frekuensi||'bulanan')}</td>
      <td style="font-size:12px">${k.tgl_ambil ? tgl(k.tgl_ambil) : '<span style="color:var(--gray-400)">Belum pernah</span>'}</td>
      <td class="rupiah" style="font-size:12px">${rupiah(k.nominal_terakhir)}</td>
      <td style="font-size:12px">${k.petugas||'-'}</td>
      <td class="no-print"><a href="kotak-infaq.html" class="btn btn-ghost btn-sm">📦 Ambil</a></td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--success)">🎉 Semua kotak sudah diambil bulan ini!</td></tr>`;

  // REKAP PER TOKO BULAN INI
  const rekapToko = kotakAktif.map(k => {
    const ambilKotak = ambilBulanIni.filter(a => a.kotak_id === k.id);
    return { ...k, jmlAmbil: ambilKotak.length, totalBulanIni: ambilKotak.reduce((s,a)=>s+(+a.nominal||0),0), sudah: ambilKotak.length > 0 };
  }).sort((a,b) => b.totalBulanIni - a.totalBulanIni);

  const grandTotal = rekapToko.reduce((s,k) => s+k.totalBulanIni, 0);

  document.getElementById('tblRekapToko').innerHTML = rekapToko.map(k => `
    <tr>
      <td class="td-name">${k.nama_kotak}</td>
      <td style="font-size:12px">${k.nama_toko}</td>
      <td style="font-size:12px">${k.kota||'-'}</td>
      <td style="text-align:center;font-weight:600">${k.jmlAmbil > 0 ? k.jmlAmbil+'x' : '<span style="color:var(--gray-400)">—</span>'}</td>
      <td class="rupiah" style="font-weight:700;color:${k.totalBulanIni?'#f97316':'var(--gray-400)'}">
        ${k.totalBulanIni ? rupiah(k.totalBulanIni) : '—'}
      </td>
      <td>${k.sudah ? '<span class="badge b-green">✓ Sudah</span>' : '<span class="badge b-red">Belum</span>'}</td>
    </tr>`).join('');

  document.getElementById('footRekapToko').innerHTML = `
    <tr><td colspan="3" style="padding:10px 14px">TOTAL (${kotakAktif.length} kotak)</td>
      <td style="padding:10px 14px;text-align:center">${ambilBulanIni.length}x</td>
      <td class="rupiah" style="padding:10px 14px;color:#f97316">${rupiah(grandTotal)}</td>
      <td style="padding:10px 14px">${sudah.length}/${kotakAktif.length} diambil</td></tr>`;

  // REKAP BULANAN
  renderRekapBulanan(tahun, kota, petugas);
};

function renderRekapBulanan(tahun, filterKota, filterPetugas) {
  let kotakAktif = DB.get('kotak_infaq').filter(k => k.status === 'aktif');
  if (filterKota) kotakAktif = kotakAktif.filter(k => k.kota === filterKota);
  if (filterPetugas) kotakAktif = kotakAktif.filter(k => k.petugas === filterPetugas);
  const kotakIds = new Set(kotakAktif.map(k => k.id));

  let ambilAll = DB.get('pengambilan_kotak').filter(a =>
    a.tgl_ambil?.startsWith(tahun) && kotakIds.has(a.kotak_id)
  );

  let grandTotal = 0;
  const rows = BULAN_NAMA.map((nama, idx) => {
    const mb = String(idx+1).padStart(2,'0');
    const ambilBulan = ambilAll.filter(a => a.tgl_ambil?.slice(5,7) === mb);
    const total = ambilBulan.reduce((s,a) => s+(+a.nominal||0), 0);
    const kotakDiambil = new Set(ambilBulan.map(a => a.kotak_id)).size;
    const kotakBelum = kotakAktif.length - kotakDiambil;
    grandTotal += total;
    const rataRata = kotakDiambil ? Math.round(total/kotakDiambil) : 0;
    const isNow = new Date().getMonth() === idx && String(new Date().getFullYear()) === tahun;

    return `<tr style="${isNow?'background:#fff7ed;font-weight:600':''}">
      <td>${nama} ${tahun}${isNow?' 🔵':''}</td>
      <td style="text-align:center">${ambilBulan.length}x</td>
      <td style="text-align:center;color:var(--success);font-weight:600">${kotakDiambil}</td>
      <td style="text-align:center;color:${kotakBelum?'var(--danger)':'var(--gray-400)'}">${kotakBelum}</td>
      <td class="rupiah" style="font-weight:700;color:${total?'#f97316':'var(--gray-400)'}">
        ${total ? rupiah(total) : '—'}
      </td>
      <td class="rupiah" style="color:var(--gray-500)">${rataRata ? rupiah(rataRata) : '—'}</td>
    </tr>`;
  });

  document.getElementById('tblRekapBulanan').innerHTML = rows.join('');
  document.getElementById('footRekapBulanan').innerHTML = `
    <tr style="background:var(--gray-800);color:white">
      <td style="padding:10px 14px">TOTAL ${tahun}</td>
      <td style="padding:10px 14px;text-align:center">${ambilAll.length}x</td>
      <td colspan="2" style="padding:10px 14px;text-align:center">${kotakAktif.length} kotak aktif</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandTotal)}</td>
      <td class="rupiah" style="padding:10px 14px">${kotakAktif.length ? rupiah(Math.round(grandTotal/(kotakAktif.length*12))) : '—'}/bln</td>
    </tr>`;
}

window.exportCSVKotak = function() {
  const bulan = document.getElementById('flBulan').value;
  const tahun = document.getElementById('flTahun').value;
  const periode = `${tahun}-${bulan}`;
  const kotakAktif = DB.get('kotak_infaq').filter(k => k.status === 'aktif');
  const ambilBulanIni = DB.get('pengambilan_kotak').filter(a => a.tgl_ambil?.startsWith(periode));
  const sudahIds = new Set(ambilBulanIni.map(a => a.kotak_id));

  const rows = kotakAktif.map(k => ({
    nama_kotak: k.nama_kotak, nama_toko: k.nama_toko,
    alamat: k.alamat||'', kota: k.kota||'', frekuensi: k.frekuensi||'',
    petugas: k.petugas||'',
    status_bulan_ini: sudahIds.has(k.id) ? 'Sudah Diambil' : 'Belum Diambil',
    tgl_ambil_bulan_ini: ambilBulanIni.find(a=>a.kotak_id===k.id)?.tgl_ambil||'',
    total_bulan_ini: ambilBulanIni.filter(a=>a.kotak_id===k.id).reduce((s,a)=>s+(+a.nominal||0),0)||''
  }));
  exportExcel(rows, `LaporanKotak_${BULAN_NAMA[+bulan-1]}_${tahun}`, 'Kotak Infaq');
};
