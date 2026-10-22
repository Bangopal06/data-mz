document.addEventListener('DOMContentLoaded', async () => {
  initFilter();
  renderPetugas();
  await Promise.all([
    DB.sync('petugas'),
    DB.sync('pembayaran_rutin'),
    DB.sync('donatur_rutin'),
    DB.sync('pengambilan_kotak'),
    DB.sync('kcs_pengambilan'),
    DB.sync('donatur_waqaf'),
    DB.sync('waqaf_program'),
    DB.sync('prospek_kotak'),
    DB.sync('kcs_prospek'),
    DB.sync('prospek_rutin')
  ]);
  initFilter();
  renderPetugas();
});

function initFilter() {
  const now = new Date();
  const tahunNow = now.getFullYear();
  const selTahun = document.getElementById('flTahun');
  selTahun.innerHTML = [tahunNow, tahunNow-1, tahunNow-2].map(t =>
    `<option value="${t}" ${t===tahunNow?'selected':''}>${t}</option>`).join('');

  // Set bulan sekarang sebagai default
  const selBulan = document.getElementById('flBulan');
  const bulanNow = String(now.getMonth()+1).padStart(2,'0');
  selBulan.value = bulanNow;

  const ptList = DB.get('petugas');
  document.getElementById('flPetugas').innerHTML =
    '<option value="">Semua Petugas</option>' +
    ptList.map(p => `<option value="${p.nama}">${p.nama}</option>`).join('');
}

window.renderPetugas = function() {
  const tahun  = document.getElementById('flTahun').value;
  const bulan  = document.getElementById('flBulan').value;
  const filterPt = document.getElementById('flPetugas').value;

  const periode = bulan ? `${tahun}-${bulan}` : tahun;

  // Kumpulkan semua transaksi dengan petugas
  const semua = [];

  // 1. Pembayaran donatur rutin
  const dr = DB.get('donatur_rutin');
  DB.get('pembayaran_rutin').forEach(p => {
    if (!p.petugas) return;
    const tgl = p.tgl_bayar || '';
    if (!tgl.startsWith(periode)) return;
    const donatur = dr.find(d => d.id === p.donatur_id);
    semua.push({
      petugas: p.petugas, jenis: 'Donatur Rutin',
      nama: donatur?.nama || p.nama_donatur || '-',
      nominal: +p.nominal||0, tgl, ket: donatur?.program||'-'
    });
  });

  // 2. Pengambilan kotak infaq
  DB.get('pengambilan_kotak').forEach(a => {
    if (!a.petugas) return;
    const tgl = a.tgl_ambil || '';
    if (!tgl.startsWith(periode)) return;
    semua.push({
      petugas: a.petugas, jenis: 'Kotak Infaq',
      nama: a.nama_toko || '-',
      nominal: +a.nominal||0, tgl, ket: a.nama_kotak||'-'
    });
  });

  // 3. Pengambilan SCS
  DB.get('kcs_pengambilan').forEach(a => {
    if (!a.petugas) return;
    const tgl = a.tgl_ambil || '';
    if (!tgl.startsWith(periode)) return;
    semua.push({
      petugas: a.petugas, jenis: 'SCS',
      nama: a.nama_toko || '-',
      nominal: +a.nominal||0, tgl, ket: a.nama_kotak||'-'
    });
  });

  // 4. Donasi isidental (waqaf)
  const wp = DB.get('waqaf_program');
  DB.get('donatur_waqaf').forEach(d => {
    if (!d.petugas) return;
    const tgl = d.tgl_donasi || '';
    if (!tgl.startsWith(periode)) return;
    const prog = wp.find(w => w.id === d.program_id);
    semua.push({
      petugas: d.petugas, jenis: 'Isidental',
      nama: d.nama || '-',
      nominal: +d.nominal||0, tgl, ket: prog?.nama||'-'
    });
  });

  // Filter per petugas
  const filtered = filterPt ? semua.filter(x => x.petugas === filterPt) : semua;
  filtered.sort((a,b) => new Date(b.tgl) - new Date(a.tgl));

  // Hitung rekap per petugas
  const map = {};
  filtered.forEach(x => {
    if (!map[x.petugas]) map[x.petugas] = { nama:x.petugas, rutin:0, kotak:0, scs:0, isidental:0, total:0, jml:0 };
    if (x.jenis==='Donatur Rutin') map[x.petugas].rutin += x.nominal;
    else if (x.jenis==='Kotak Infaq') map[x.petugas].kotak += x.nominal;
    else if (x.jenis==='SCS') map[x.petugas].scs += x.nominal;
    else if (x.jenis==='Isidental') map[x.petugas].isidental += x.nominal;
    map[x.petugas].total += x.nominal;
    map[x.petugas].jml++;
  });

  const rekap = Object.values(map).sort((a,b) => b.total - a.total);
  const grandTotal = rekap.reduce((s,r) => s + r.total, 0);
  const grandJml = rekap.reduce((s,r) => s + r.jml, 0);

  // STATS
  document.getElementById('statsPetugas').innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">👷</div><div class="stat-body"><div class="lbl">Petugas Aktif</div><div class="val">${rekap.length}</div><div class="sub">periode ini</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">📋</div><div class="stat-body"><div class="lbl">Total Transaksi</div><div class="val">${grandJml}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Total Pendapatan</div><div class="val rupiah" style="font-size:13px">${rupiah(grandTotal)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-purple">📊</div><div class="stat-body"><div class="lbl">Rata-rata/Petugas</div><div class="val rupiah" style="font-size:13px">${rekap.length ? rupiah(Math.round(grandTotal/rekap.length)) : 'Rp 0'}</div></div></div>
  `;

  // REKAP TABLE
  document.getElementById('tblRekapPetugas').innerHTML = rekap.length ? rekap.map((r,i) => {
    const pct = grandTotal ? Math.round(r.total/grandTotal*100) : 0;
    return `<tr>
      <td style="text-align:center;font-weight:700;color:${i===0?'#f59e0b':i===1?'var(--gray-500)':i===2?'#cd7c4a':'var(--gray-400)'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td>
      <td style="font-weight:600">${r.nama}</td>
      <td class="rupiah" style="color:var(--success)">${r.rutin?rupiah(r.rutin):'—'}</td>
      <td class="rupiah" style="color:#f97316">${r.kotak?rupiah(r.kotak):'—'}</td>
      <td class="rupiah" style="color:var(--primary)">${r.scs?rupiah(r.scs):'—'}</td>
      <td class="rupiah" style="color:#8b5cf6">${r.isidental?rupiah(r.isidental):'—'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--gray-900)">${rupiah(r.total)}</td>
      <td style="text-align:center">${r.jml}x</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data petugas di periode ini</td></tr>`;

  document.getElementById('footRekapPetugas').innerHTML = rekap.length ? `
    <tr>
      <td colspan="2" style="padding:10px 14px">TOTAL (${rekap.length} petugas)</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.rutin,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.kotak,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.scs,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.isidental,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandTotal)}</td>
      <td style="padding:10px 14px;text-align:center">${grandJml}x</td>
    </tr>` : '';

  // DETAIL TABLE
  const jenisColor = { 'Donatur Rutin':'b-green', 'Kotak Infaq':'b-orange', 'SCS':'b-blue', 'Isidental':'b-purple' };
  document.getElementById('tblDetailPetugas').innerHTML = filtered.length ? filtered.map(x => `
    <tr>
      <td style="font-weight:600">${x.petugas}</td>
      <td><span class="badge ${jenisColor[x.jenis]||'b-gray'}" style="font-size:10px">${x.jenis}</span></td>
      <td style="font-size:12px">${x.nama}</td>
      <td class="rupiah" style="font-weight:600">${rupiah(x.nominal)}</td>
      <td style="font-size:12px">${tgl(x.tgl)}</td>
      <td style="font-size:12px;color:var(--gray-500)">${x.ket}</td>
    </tr>`).join('')
  : `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada aktivitas di periode ini</td></tr>`;

  const totalDetail = filtered.filter(x=>x.nominal).reduce((s,x)=>s+x.nominal,0);
  document.getElementById('footDetailPetugas').innerHTML = filtered.length ? `
    <tr>
      <td colspan="3" style="padding:10px 14px">TOTAL (${filtered.length} transaksi)</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(totalDetail)}</td>
      <td colspan="2"></td>
    </tr>` : '';

  // PROSPEK PER PETUGAS
  const allProspekKotak = DB.get('prospek_kotak');
  const allProspekSCS = DB.get('kcs_prospek');
  const allProspekRutin = DB.get('prospek_rutin');

  // Gabung semua prospek
  const allProspek = [
    ...allProspekKotak.map(p=>({...p, jenis:'Kotak Infaq'})),
    ...allProspekSCS.map(p=>({...p, jenis:'SCS'})),
    ...allProspekRutin.map(p=>({...p, jenis:'Donatur Rutin'}))
  ].filter(p => p.petugas && (!filterPt || p.petugas === filterPt));

  // Rekap prospek per petugas
  const prospekMap = {};
  allProspek.forEach(p => {
    if (!prospekMap[p.petugas]) prospekMap[p.petugas] = { nama:p.petugas, baru:0, dihubungi:0, survei:0, total:0 };
    prospekMap[p.petugas][p.status] = (prospekMap[p.petugas][p.status]||0) + 1;
    prospekMap[p.petugas].total++;
  });
  const rekapProspek = Object.values(prospekMap).sort((a,b) => b.total - a.total);

  document.getElementById('tblProspekPetugas').innerHTML = rekapProspek.length ? rekapProspek.map((r,i) => `
    <tr>
      <td style="text-align:center;font-weight:700;color:var(--gray-400)">${i+1}</td>
      <td style="font-weight:600">${r.nama}</td>
      <td style="text-align:center">${r.baru||'—'}</td>
      <td style="text-align:center">${r.dihubungi||'—'}</td>
      <td style="text-align:center">${r.survei||'—'}</td>
      <td style="text-align:center;font-weight:700">${r.total}</td>
    </tr>`).join('')
  : `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data prospek</td></tr>`;

  // Detail prospek
  document.getElementById('tblDetailProspek').innerHTML = allProspek.length ? allProspek.map(p => `
    <tr>
      <td style="font-weight:600">${p.petugas}</td>
      <td><span class="badge ${ p.jenis==='Kotak Infaq'?'b-orange':p.jenis==='SCS'?'b-blue':'b-green'}" style="font-size:10px">${p.jenis}</span></td>
      <td style="font-size:12px">${p.nama_toko||p.nama||'-'}</td>
      <td style="font-size:12px">${p.kota||'-'}</td>
      <td>${badge(p.status)}</td>
      <td style="font-size:12px;color:var(--gray-500);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.catatan||'-'}</td>
    </tr>`).join('')
  : `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data prospek</td></tr>`;
};

window.exportLaporanPetugas = function() {
  const tahun = document.getElementById('flTahun').value;
  const bulan = document.getElementById('flBulan').value;
  const periode = bulan ? `${tahun}-${bulan}` : tahun;
  const dr = DB.get('donatur_rutin');
  const wp = DB.get('waqaf_program');
  const rows = [];

  DB.get('pembayaran_rutin').filter(p=>p.petugas&&(p.tgl_bayar||'').startsWith(periode)).forEach(p => {
    rows.push({ petugas:p.petugas, jenis:'Donatur Rutin', nama:dr.find(d=>d.id===p.donatur_id)?.nama||p.nama_donatur||'-', nominal:p.nominal, tgl:p.tgl_bayar||'' });
  });
  DB.get('pengambilan_kotak').filter(a=>a.petugas&&(a.tgl_ambil||'').startsWith(periode)).forEach(a => {
    rows.push({ petugas:a.petugas, jenis:'Kotak Infaq', nama:a.nama_toko||'-', nominal:a.nominal, tgl:a.tgl_ambil||'' });
  });
  DB.get('kcs_pengambilan').filter(a=>a.petugas&&(a.tgl_ambil||'').startsWith(periode)).forEach(a => {
    rows.push({ petugas:a.petugas, jenis:'SCS', nama:a.nama_toko||'-', nominal:a.nominal, tgl:a.tgl_ambil||'' });
  });
  DB.get('donatur_waqaf').filter(d=>d.petugas&&(d.tgl_donasi||'').startsWith(periode)).forEach(d => {
    rows.push({ petugas:d.petugas, jenis:'Isidental', nama:d.nama||'-', nominal:d.nominal, tgl:d.tgl_donasi||'' });
  });

  rows.sort((a,b)=>new Date(b.tgl)-new Date(a.tgl));
  if (!rows.length) { toast('Tidak ada data','warn'); return; }
  exportExcel(rows, `LaporanPetugas_${periode}`, 'Petugas');
};
