const BULAN_NAMA_SCS = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', async () => {
  initFilterSCS();
  renderLapKCS();
  await Promise.all([DB.sync('scs_santri'), DB.sync('scs_pembayaran'), DB.sync('s3_ustadz'), DB.sync('s3_pembayaran')]);
  initFilterSCS();
  renderLapKCS();
});

function initFilterSCS() {
  const now = new Date();
  const tahun = now.getFullYear();
  document.getElementById('lkTahun').innerHTML =
    [tahun, tahun-1, tahun-2].map(t=>`<option value="${t}" ${t===tahun?'selected':''}>${t}</option>`).join('');
  document.getElementById('lkBulan').value = String(now.getMonth()+1).padStart(2,'0');

  const santri = DB.get('scs_santri');
  const kelas = [...new Set(santri.map(s=>s.kelas).filter(Boolean))].sort();
  const halaqoh = [...new Set(santri.map(s=>s.halaqoh).filter(Boolean))].sort();
  document.getElementById('lkKelas').innerHTML = '<option value="">Semua Kelas</option>' + kelas.map(k=>`<option value="${k}">${k}</option>`).join('');
  document.getElementById('lkHalaqoh').innerHTML = '<option value="">Semua Halaqoh</option>' + halaqoh.map(h=>`<option value="${h}">${h}</option>`).join('');
}

window.renderLapKCS = function() {
  const bulan  = document.getElementById('lkBulan').value;
  const tahun  = document.getElementById('lkTahun').value;
  const flKelas = document.getElementById('lkKelas').value;
  const flHal   = document.getElementById('lkHalaqoh').value;
  const periode = bulan ? `${tahun}-${bulan}` : tahun;

  let santri = DB.get('scs_santri').filter(s=>s.status==='aktif');
  if (flKelas) santri = santri.filter(s=>s.kelas===flKelas);
  if (flHal) santri = santri.filter(s=>s.halaqoh===flHal);
  const santriIds = new Set(santri.map(s=>s.id));

  let bayar = DB.get('scs_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode));
  bayar = bayar.filter(b=>santriIds.has(b.santri_id));
  bayar.sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));

  // S3 Ustadz
  const bayarS3 = DB.get('s3_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode));
  const totalS3 = bayarS3.reduce((s,b)=>s+(+b.nominal||0),0);
  const ustadzSetor = new Set(bayarS3.map(b=>b.ustadz_id)).size;
  const totalUstadz = DB.get('s3_ustadz').filter(u=>u.status==='aktif').length;

  const totalSedekah = bayar.reduce((s,b)=>s+(+b.nominal||0),0);
  const totalSemua = totalSedekah + totalS3;
  const santriSetor = new Set(bayar.map(b=>b.santri_id)).size;

  // STATS
  document.getElementById('lkStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">🎓</div><div class="stat-body"><div class="lbl">Santri Setor</div><div class="val">${santriSetor}/${santri.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-purple">👨‍🏫</div><div class="stat-body"><div class="lbl">Ustadz Setor</div><div class="val">${ustadzSetor}/${totalUstadz}</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💰</div><div class="stat-body"><div class="lbl">Sedekah Santri</div><div class="val rupiah" style="font-size:14px">${rupiah(totalSedekah)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Sedekah S3 + Total</div><div class="val rupiah" style="font-size:14px">${rupiah(totalSemua)}</div><div class="sub">S3: ${rupiah(totalS3)}</div></div></div>
  `;

  // REKAP PER KELAS
  const kelasList = [...new Set(santri.map(s=>s.kelas).filter(Boolean))].sort();
  let grandSantri=0, grandSetor=0, grandTotal=0;
  document.getElementById('lkTblKelas').innerHTML = kelasList.length ? kelasList.map(k=>{
    const sk = santri.filter(s=>s.kelas===k);
    const bk = bayar.filter(b=>b.kelas===k);
    const setor = new Set(bk.map(b=>b.santri_id)).size;
    const total = bk.reduce((s,b)=>s+(+b.nominal||0),0);
    const rata = setor ? Math.round(total/setor) : 0;
    grandSantri+=sk.length; grandSetor+=setor; grandTotal+=total;
    return `<tr>
      <td><span class="badge b-blue" style="font-size:12px">${k}</span></td>
      <td style="text-align:center;font-weight:600">${sk.length}</td>
      <td style="text-align:center;color:var(--success);font-weight:600">${setor}</td>
      <td style="text-align:center;color:${sk.length-setor>0?'var(--danger)':'var(--gray-400)'}">${sk.length-setor}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${total?rupiah(total):'—'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${rata?rupiah(rata):'—'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;
  document.getElementById('lkFootKelas').innerHTML = kelasList.length ? `
    <tr><td>TOTAL</td><td style="text-align:center">${grandSantri}</td><td style="text-align:center">${grandSetor}</td>
    <td style="text-align:center">${grandSantri-grandSetor}</td>
    <td class="rupiah">${rupiah(grandTotal)}</td>
    <td class="rupiah">${grandSetor?rupiah(Math.round(grandTotal/grandSetor)):'—'}</td></tr>` : '';

  // REKAP PER HALAQOH
  const halList = [...new Set(santri.map(s=>s.halaqoh).filter(Boolean))].sort();
  let grandHSantri=0, grandHTot=0;
  document.getElementById('lkTblHalaqoh').innerHTML = halList.length ? halList.map(h=>{
    const sh = santri.filter(s=>s.halaqoh===h);
    const bh = bayar.filter(b=>b.halaqoh===h);
    const setor = new Set(bh.map(b=>b.santri_id)).size;
    const total = bh.reduce((s,b)=>s+(+b.nominal||0),0);
    grandHSantri+=sh.length; grandHTot+=total;
    return `<tr>
      <td style="font-weight:600">${h}</td>
      <td style="text-align:center">${sh.length}</td>
      <td style="text-align:center;color:var(--success)">${setor}/${sh.length}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${total?rupiah(total):'—'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;
  document.getElementById('lkFootHalaqoh').innerHTML = halList.length ? `
    <tr><td>TOTAL</td><td style="text-align:center">${grandHSantri}</td><td></td>
    <td class="rupiah">${rupiah(grandHTot)}</td></tr>` : '';

  // RIWAYAT SEDEKAH
  document.getElementById('lkCntBayar').textContent = bayar.length;
  document.getElementById('lkTblBayar').innerHTML = bayar.length ? bayar.map(b=>`<tr>
    <td style="font-weight:600">${b.nama_santri||'-'}</td>
    <td><span class="badge b-blue" style="font-size:11px">${b.kelas||'-'}</span></td>
    <td style="font-size:12px">${b.halaqoh||'-'}</td>
    <td class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(b.nominal)}</td>
    <td style="font-size:12px">${tgl(b.tgl_bayar)}</td>
    <td style="font-size:12px">${b.petugas||'-'}</td>
    <td style="font-size:12px;color:var(--gray-500)">${b.catatan||'-'}</td>
  </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada riwayat sedekah</td></tr>`;
  const totBayar = bayar.reduce((s,b)=>s+(+b.nominal||0),0);
  document.getElementById('lkFootBayar').innerHTML = bayar.length ? `
    <tr><td colspan="3">TOTAL (${bayar.length} transaksi)</td>
    <td class="rupiah">${rupiah(totBayar)}</td><td colspan="3"></td></tr>` : '';

  // REKAP BULANAN
  const allBayar = DB.get('scs_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(tahun));
  let grandBulan=0, grandBJml=0;
  const bRows = Array.from({length:12},(_,idx)=>{
    const mb = String(idx+1).padStart(2,'0');
    const bm = allBayar.filter(b=>b.tgl_bayar?.slice(5,7)===mb);
    const total = bm.reduce((s,b)=>s+(+b.nominal||0),0);
    const unik = new Set(bm.map(b=>b.santri_id)).size;
    grandBulan+=total; grandBJml+=bm.length;
    const isNow = new Date().getMonth()===idx && String(new Date().getFullYear())===tahun;
    return `<tr style="${isNow?'background:#f0fdf4;font-weight:600':''}">
      <td>${BULAN_NAMA_SCS[idx+1]} ${tahun}${isNow?' 🔵':''}</td>
      <td style="text-align:center">${bm.length||'—'}</td>
      <td style="text-align:center">${unik||'—'}</td>
      <td class="rupiah" style="font-weight:700;color:${total?'var(--success)':'var(--gray-400)'}">${total?rupiah(total):'—'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${unik?rupiah(Math.round(total/unik)):'—'}</td>
    </tr>`;
  });
  document.getElementById('lkTblBulanan').innerHTML = bRows.join('');
  document.getElementById('lkFootBulanan').innerHTML = `
    <tr style="background:var(--gray-800);color:white">
      <td style="padding:10px 14px">TOTAL ${tahun}</td>
      <td style="padding:10px 14px;text-align:center">${grandBJml}</td>
      <td style="padding:10px 14px"></td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandBulan)}</td>
      <td style="padding:10px 14px"></td>
    </tr>`;

  // REKAP S3 USTADZ/USTADZAH
  const ustadz = DB.get('s3_ustadz').filter(u=>u.status==='aktif');
  const rekapS3 = ustadz.map(u=>{
    const bu = bayarS3.filter(b=>b.ustadz_id===u.id);
    const total = bu.reduce((s,b)=>s+(+b.nominal||0),0);
    return {...u, jml:bu.length, total};
  }).sort((a,b)=>b.total-a.total);

  const tblS3 = document.getElementById('lkTblS3');
  const footS3 = document.getElementById('lkFootS3');
  if (tblS3) {
    tblS3.innerHTML = rekapS3.length ? rekapS3.map(u=>`<tr>
      <td style="font-weight:600">${u.nama}</td>
      <td style="font-size:12px">${u.panggilan||'-'}</td>
      <td style="font-size:12px">${u.amanah||'-'}</td>
      <td style="text-align:center">${u.jml||'—'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${u.total?rupiah(u.total):'—'}</td>
      <td>${u.jml>0?'<span class="badge b-green">✓ Setor</span>':'<span class="badge b-red">Belum</span>'}</td>
    </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;
    if (footS3) footS3.innerHTML = rekapS3.length ? `
      <tr><td colspan="3">TOTAL (${rekapS3.filter(u=>u.jml>0).length} ustadz setor)</td>
      <td style="text-align:center">${rekapS3.reduce((s,u)=>s+u.jml,0)}</td>
      <td class="rupiah">${rupiah(rekapS3.reduce((s,u)=>s+u.total,0))}</td>
      <td></td></tr>` : '';
  }
};

window.exportLapSCS = function() {
  const bulan = document.getElementById('lkBulan').value;
  const tahun = document.getElementById('lkTahun').value;
  const periode = bulan ? `${tahun}-${bulan}` : tahun;
  const label = bulan ? BULAN_NAMA_SCS[+bulan]+'_'+tahun : tahun;

  // Santri
  const dataSantri = DB.get('scs_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode)).map(b=>({
    jenis:'Santri', nama:b.nama_santri, kelas:b.kelas||'', halaqoh:b.halaqoh||'',
    nominal:b.nominal, tgl_bayar:b.tgl_bayar, petugas:b.petugas||'', catatan:b.catatan||''
  }));
  // S3 Ustadz
  const dataS3 = DB.get('s3_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode)).map(b=>({
    jenis:'Ustadz/Ustadzah', nama:b.nama_ustadz, kelas:'-', halaqoh:b.amanah||'-',
    nominal:b.nominal, tgl_bayar:b.tgl_bayar, petugas:b.petugas||'', catatan:b.catatan||''
  }));
  const data = [...dataSantri, ...dataS3].sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  if (!data.length) { toast('Tidak ada data','warn'); return; }
  exportExcel(data, `LaporanSCS_${label}`, 'SCS & S3');
};

// backward compat alias
window.exportLapKCS = window.exportLapSCS;
