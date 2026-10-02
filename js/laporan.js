// =============================================
// LAPORAN
// =============================================

let chartBulanan, chartKomposisi;

const BULAN_LABEL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

document.addEventListener('DOMContentLoaded', () => {
  initTahunFilter();
  renderAll();
});

function initTahunFilter() {
  const sel = document.getElementById('flTahun');
  const now = new Date().getFullYear();
  // Ambil semua tahun dari data
  const tahunSet = new Set();
  DB.get('pembayaran_rutin').forEach(p => { if (p.tgl_bayar) tahunSet.add(p.tgl_bayar.slice(0,4)); });
  DB.get('pengambilan_kotak').forEach(a => { if (a.tgl_ambil) tahunSet.add(a.tgl_ambil.slice(0,4)); });
  tahunSet.add(String(now));
  const sorted = [...tahunSet].sort((a,b) => b-a);
  sel.innerHTML = sorted.map(t => `<option value="${t}" ${t==now?'selected':''}>${t}</option>`).join('');
}

function getFilters() {
  return {
    tahun: document.getElementById('flTahun').value,
    bulan: document.getElementById('flBulan').value,
    sumber: document.getElementById('flSumber').value,
  };
}

function matchPeriod(dateStr, tahun, bulan) {
  if (!dateStr) return false;
  if (tahun && !dateStr.startsWith(tahun)) return false;
  if (bulan && dateStr.slice(5,7) !== bulan) return false;
  return true;
}

window.renderAll = function() {
  const f = getFilters();
  renderStats(f);
  renderGrafikBulanan(f);
  renderGrafikKomposisi(f);
  renderLapDonatur(f);
  renderLapKotak(f);
  renderRekap(f);
};

// ============ STATS ============
function renderStats(f) {
  const bayar = DB.get('pembayaran_rutin').filter(p => matchPeriod(p.tgl_bayar, f.tahun, f.bulan));
  const ambil = DB.get('pengambilan_kotak').filter(a => matchPeriod(a.tgl_ambil, f.tahun, f.bulan));

  const totalDonatur = bayar.reduce((s,p) => s + (+p.nominal||0), 0);
  const totalKotak = ambil.reduce((s,a) => s + (+a.nominal||0), 0);
  const totalAll = totalDonatur + totalKotak;

  const periode = f.bulan ? `${BULAN_LABEL[+f.bulan-1]} ${f.tahun}` : `Tahun ${f.tahun}`;

  document.getElementById('lapStats').innerHTML = `
    <div class="summary-box"><div class="sb-icon">📊</div><div><div class="sb-label">Total Pendapatan · ${periode}</div><div class="sb-val rupiah">${rupiah(totalAll)}</div><div class="sb-sub">${bayar.length + ambil.length} transaksi</div></div></div>
    <div class="summary-box"><div class="sb-icon">💚</div><div><div class="sb-label">Donatur Rutin</div><div class="sb-val rupiah">${rupiah(totalDonatur)}</div><div class="sb-sub">${bayar.length} pembayaran</div></div></div>
    <div class="summary-box"><div class="sb-icon">🗃️</div><div><div class="sb-label">Kotak Infaq</div><div class="sb-val rupiah">${rupiah(totalKotak)}</div><div class="sb-sub">${ambil.length} pengambilan · ${DB.get('kotak_infaq').filter(k=>k.status==='aktif').length} kotak aktif</div></div></div>
    <div class="summary-box"><div class="sb-icon">📅</div><div><div class="sb-label">Rata-rata / Bulan</div><div class="sb-val rupiah">${rupiah(Math.round(totalAll / (f.bulan ? 1 : 12)))}</div><div class="sb-sub">${f.tahun}</div></div></div>
  `;
}

// ============ GRAFIK BULANAN ============
function renderGrafikBulanan(f) {
  const bayarAll = DB.get('pembayaran_rutin').filter(p => p.tgl_bayar?.startsWith(f.tahun));
  const ambilAll = DB.get('pengambilan_kotak').filter(a => a.tgl_ambil?.startsWith(f.tahun));

  const donaturBulan = Array(12).fill(0);
  const kotakBulan = Array(12).fill(0);

  bayarAll.forEach(p => { const m = +p.tgl_bayar.slice(5,7) - 1; donaturBulan[m] += +p.nominal||0; });
  ambilAll.forEach(a => { const m = +a.tgl_ambil.slice(5,7) - 1; kotakBulan[m] += +a.nominal||0; });

  const ctx = document.getElementById('chartBulanan');
  if (!ctx) return;
  if (chartBulanan) chartBulanan.destroy();

  chartBulanan = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: BULAN_LABEL,
      datasets: [
        { label: 'Donatur Rutin', data: donaturBulan, backgroundColor: '#22c55e', borderRadius: 4 },
        { label: 'Kotak Infaq', data: kotakBulan, backgroundColor: '#f97316', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12, padding: 8 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${rupiah(ctx.parsed.y)}` } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => (v/1000000).toFixed(1)+'jt', font: { size: 10 } }, grid: { color: '#f3f4f6' } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

// ============ GRAFIK KOMPOSISI ============
function renderGrafikKomposisi(f) {
  const bayar = DB.get('pembayaran_rutin').filter(p => matchPeriod(p.tgl_bayar, f.tahun, f.bulan));
  const ambil = DB.get('pengambilan_kotak').filter(a => matchPeriod(a.tgl_ambil, f.tahun, f.bulan));
  const totalDonatur = bayar.reduce((s,p) => s + (+p.nominal||0), 0);
  const totalKotak = ambil.reduce((s,a) => s + (+a.nominal||0), 0);

  const ctx = document.getElementById('chartKomposisi');
  if (!ctx) return;
  if (chartKomposisi) chartKomposisi.destroy();

  chartKomposisi = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Donatur Rutin', 'Kotak Infaq'],
      datasets: [{ data: [totalDonatur, totalKotak], backgroundColor: ['#22c55e','#f97316'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12, padding: 8 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${rupiah(ctx.parsed)}` } }
      },
      cutout: '65%'
    }
  });
}

// ============ LAPORAN DONATUR RUTIN ============
function renderLapDonatur(f) {
  if (f.sumber === 'kotak') { document.getElementById('secDonatur').style.display = 'none'; return; }
  document.getElementById('secDonatur').style.display = 'block';

  const donaturMap = {};
  DB.get('donatur_rutin').forEach(d => donaturMap[d.id] = d);

  let bayar = DB.get('pembayaran_rutin').filter(p => matchPeriod(p.tgl_bayar, f.tahun, f.bulan));
  bayar.sort((a,b) => new Date(b.tgl_bayar) - new Date(a.tgl_bayar));

  const total = bayar.reduce((s,p) => s + (+p.nominal||0), 0);
  document.getElementById('lapDonaturTotal').textContent = `${bayar.length} transaksi · Total: ${rupiah(total)}`;

  document.getElementById('bodyLapDonatur').innerHTML = bayar.length ? bayar.map(p => {
    const d = donaturMap[p.donatur_id] || {};
    return `<tr>
      <td class="td-name">${p.nama_donatur || '-'}</td>
      <td style="font-size:12px">${d.program || '-'}</td>
      <td class="rupiah" style="font-size:12px">${rupiah(d.nominal)}</td>
      <td style="font-size:12px">${tgl(p.tgl_bayar)}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(p.nominal)}</td>
      <td style="font-size:12px">${p.petugas || d.petugas || '-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${p.catatan || '-'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data pada periode ini</td></tr>`;

  document.getElementById('footLapDonatur').innerHTML = bayar.length ? `
    <tr style="background:var(--gray-50);font-weight:700">
      <td colspan="4" style="padding:10px 14px">TOTAL</td>
      <td class="rupiah" style="padding:10px 14px;color:var(--success)">${rupiah(total)}</td>
      <td colspan="2"></td>
    </tr>` : '';
}

// ============ LAPORAN KOTAK INFAQ ============
function renderLapKotak(f) {
  if (f.sumber === 'donatur') { document.getElementById('secKotak').style.display = 'none'; return; }
  document.getElementById('secKotak').style.display = 'block';

  const ambil = DB.get('pengambilan_kotak').filter(a => matchPeriod(a.tgl_ambil, f.tahun, f.bulan));
  ambil.sort((a,b) => new Date(b.tgl_ambil) - new Date(a.tgl_ambil));

  // Rekap per kotak
  const kotakRekap = {};
  ambil.forEach(a => {
    const key = a.kotak_id || a.nama_kotak;
    if (!kotakRekap[key]) kotakRekap[key] = { nama_kotak: a.nama_kotak, nama_toko: a.nama_toko, total: 0, count: 0 };
    kotakRekap[key].total += +a.nominal||0;
    kotakRekap[key].count++;
  });

  // Gabung dengan data kotak untuk info frekuensi & kota
  const kotakData = DB.get('kotak_infaq');
  const kotakMap = {};
  kotakData.forEach(k => kotakMap[k.id] = k);

  const rekapList = Object.entries(kotakRekap)
    .map(([key, val]) => {
      const k = kotakMap[key] || {};
      return { ...val, kota: k.kota || '-', frekuensi: k.frekuensi || '-' };
    })
    .sort((a,b) => b.total - a.total);

  const totalKotak = rekapList.reduce((s,k) => s + k.total, 0);
  document.getElementById('lapKotakTotal').textContent = `${rekapList.length} kotak · Total: ${rupiah(totalKotak)}`;

  document.getElementById('bodyLapKotak').innerHTML = rekapList.length ? rekapList.map(k => `
    <tr>
      <td class="td-name">${k.nama_kotak}</td>
      <td style="font-size:12px">${k.nama_toko}</td>
      <td style="font-size:12px">${k.kota}</td>
      <td>${badge(k.frekuensi)}</td>
      <td style="text-align:center;font-weight:600">${k.count}x</td>
      <td class="rupiah" style="font-weight:700;color:var(--orange)">${rupiah(k.total)}</td>
      <td class="rupiah" style="color:var(--gray-500)">${rupiah(Math.round(k.total/k.count))}</td>
    </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data pada periode ini</td></tr>`;

  document.getElementById('footLapKotak').innerHTML = rekapList.length ? `
    <tr style="background:var(--gray-50);font-weight:700">
      <td colspan="4" style="padding:10px 14px">TOTAL</td>
      <td style="padding:10px 14px;text-align:center">${ambil.length}x</td>
      <td class="rupiah" style="padding:10px 14px;color:var(--orange)">${rupiah(totalKotak)}</td>
      <td></td>
    </tr>` : '';

  // Rincian pengambilan
  document.getElementById('bodyLapAmbil').innerHTML = ambil.length ? ambil.map(a => `
    <tr>
      <td class="td-name">${a.nama_kotak}</td>
      <td style="font-size:12px">${a.nama_toko || '-'}</td>
      <td style="font-size:12px">${tgl(a.tgl_ambil)}</td>
      <td class="rupiah" style="font-weight:700;color:var(--orange)">${rupiah(a.nominal)}</td>
      <td style="font-size:12px">${a.petugas || '-'}</td>
      <td style="font-size:12px;color:var(--gray-500)">${a.catatan || '-'}</td>
    </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data pada periode ini</td></tr>`;

  const totalAmbil = ambil.reduce((s,a) => s + (+a.nominal||0), 0);
  document.getElementById('footLapAmbil').innerHTML = ambil.length ? `
    <tr style="background:var(--gray-50);font-weight:700">
      <td colspan="3" style="padding:10px 14px">TOTAL (${ambil.length} pengambilan)</td>
      <td class="rupiah" style="padding:10px 14px;color:var(--orange)">${rupiah(totalAmbil)}</td>
      <td colspan="2"></td>
    </tr>` : '';
}

// ============ REKAPITULASI BULANAN ============
function renderRekap(f) {
  const bayarAll = DB.get('pembayaran_rutin').filter(p => p.tgl_bayar?.startsWith(f.tahun));
  const ambilAll = DB.get('pengambilan_kotak').filter(a => a.tgl_ambil?.startsWith(f.tahun));

  const rows = [];
  let kumulatif = 0;
  let grandDonatur = 0, grandKotak = 0;

  for (let m = 1; m <= 12; m++) {
    const mb = String(m).padStart(2,'0');
    const donatur = bayarAll.filter(p => p.tgl_bayar?.slice(5,7) === mb).reduce((s,p) => s + (+p.nominal||0), 0);
    const kotak = ambilAll.filter(a => a.tgl_ambil?.slice(5,7) === mb).reduce((s,a) => s + (+a.nominal||0), 0);
    const total = donatur + kotak;
    kumulatif += total;
    grandDonatur += donatur;
    grandKotak += kotak;

    const isCurrentMonth = String(new Date().getFullYear()) === f.tahun && new Date().getMonth()+1 === m;
    rows.push({ bulan: BULAN_LABEL[m-1], donatur, kotak, total, kumulatif, isCurrent: isCurrentMonth });
  }

  document.getElementById('bodyRekap').innerHTML = rows.map(r => `
    <tr style="${r.isCurrent ? 'background:#f0fdf4;font-weight:600' : ''}">
      <td style="font-weight:${r.isCurrent?'700':'500'}">${r.bulan} ${f.tahun}${r.isCurrent?' 🔵':''}</td>
      <td class="rupiah" style="color:var(--success)">${r.donatur ? rupiah(r.donatur) : '<span style="color:var(--gray-300)">—</span>'}</td>
      <td class="rupiah" style="color:var(--orange)">${r.kotak ? rupiah(r.kotak) : '<span style="color:var(--gray-300)">—</span>'}</td>
      <td class="rupiah" style="font-weight:700">${r.total ? rupiah(r.total) : '<span style="color:var(--gray-300)">—</span>'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${rupiah(r.kumulatif)}</td>
    </tr>`).join('');

  document.getElementById('footRekap').innerHTML = `
    <tr style="background:var(--gray-800);color:white;font-weight:700">
      <td style="padding:10px 14px">TOTAL ${f.tahun}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandDonatur)}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandKotak)}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandDonatur+grandKotak)}</td>
      <td style="padding:10px 14px"></td>
    </tr>`;
}

// ============ EXPORT CSV ============
window.exportLaporan = function() {
  const f = getFilters();
  const rows = [];

  // Donatur
  DB.get('pembayaran_rutin').filter(p => matchPeriod(p.tgl_bayar, f.tahun, f.bulan)).forEach(p => {
    const d = DB.get('donatur_rutin').find(x => x.id === p.donatur_id) || {};
    rows.push({ sumber: 'Donatur Rutin', nama: p.nama_donatur, program: d.program||'', tgl: p.tgl_bayar, nominal: p.nominal, petugas: p.petugas||d.petugas||'', catatan: p.catatan||'' });
  });

  // Kotak
  DB.get('pengambilan_kotak').filter(a => matchPeriod(a.tgl_ambil, f.tahun, f.bulan)).forEach(a => {
    rows.push({ sumber: 'Kotak Infaq', nama: a.nama_kotak, program: a.nama_toko||'', tgl: a.tgl_ambil, nominal: a.nominal, petugas: a.petugas||'', catatan: a.catatan||'' });
  });

  rows.sort((a,b) => new Date(b.tgl) - new Date(a.tgl));
  exportCSV(rows, `Laporan_${f.tahun}${f.bulan?'_'+f.bulan:''}`);
};
