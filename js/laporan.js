const BLN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', async () => {
  initFilter();
  renderKeseluruhan();
  switchTabAll('semua');
  await Promise.all([
    DB.sync('pembayaran_rutin'), DB.sync('donatur_rutin'),
    DB.sync('pengambilan_kotak'), DB.sync('kotak_infaq'),
    DB.sync('scs_pembayaran'), DB.sync('s3_pembayaran'),
    DB.sync('donatur_waqaf'), DB.sync('waqaf_program')
  ]);
  initFilter();
  renderKeseluruhan();
});

function initFilter() {
  const now = new Date();
  const y = now.getFullYear();
  document.getElementById('flTahun').innerHTML =
    [y, y-1, y-2].map(t => `<option value="${t}">${t}</option>`).join('');
  if (!document.getElementById('flBulan').value)
    document.getElementById('flBulan').value = String(now.getMonth()+1).padStart(2,'0');
}

window.renderKeseluruhan = function() {
  const bulan  = document.getElementById('flBulan').value;
  const tahun  = document.getElementById('flTahun').value;
  const periode = bulan ? `${tahun}-${bulan}` : tahun;

  // ── Ambil semua data per sumber ──
  const bayarRutin = DB.get('pembayaran_rutin').filter(p => (p.tgl_bayar||'').startsWith(periode));
  const ambilKotak = DB.get('pengambilan_kotak').filter(a => (a.tgl_ambil||'').startsWith(periode));
  const bayarSCS   = DB.get('scs_pembayaran').filter(b => (b.tgl_bayar||'').startsWith(periode));
  const bayarS3    = DB.get('s3_pembayaran').filter(b => (b.tgl_bayar||'').startsWith(periode));
  const donasiWaqaf = DB.get('donatur_waqaf').filter(d => (d.tgl_donasi||'').startsWith(periode));
  const wp         = DB.get('waqaf_program');
  const dr         = DB.get('donatur_rutin');

  const totRutin    = bayarRutin.reduce((s,p)=>s+(+p.nominal||0),0);
  const totKotak    = ambilKotak.reduce((s,a)=>s+(+a.nominal||0),0);
  const totSCS      = bayarSCS.reduce((s,b)=>s+(+b.nominal||0),0);
  const totS3       = bayarS3.reduce((s,b)=>s+(+b.nominal||0),0);
  const totIsidental= donasiWaqaf.filter(d=>d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);
  const grandTot    = totRutin + totKotak + totSCS + totS3 + totIsidental;
  const grandTrx    = bayarRutin.length + ambilKotak.length + bayarSCS.length + bayarS3.length + donasiWaqaf.length;

  const label = bulan ? `${BLN[+bulan-1]} ${tahun}` : `Tahun ${tahun}`;

  // Grand total card
  document.getElementById('grandTotal').textContent = rupiah(grandTot);
  document.getElementById('grandSub').textContent   = label;
  document.getElementById('grandTrx').textContent   = grandTrx + ' transaksi';

  // Kartu per sumber
  const pct = v => grandTot ? Math.round(v/grandTot*100) : 0;
  document.getElementById('sumberGrid').innerHTML = [
    { ico:'💚', bg:'#dcfce7', lbl:'Donatur Rutin',  val:totRutin,     trx:bayarRutin.length },
    { ico:'🗃️', bg:'#fff7ed', lbl:'Kotak Infaq',    val:totKotak,     trx:ambilKotak.length },
    { ico:'📦', bg:'#eff6ff', lbl:'S3 & SCS',       val:totSCS+totS3, trx:bayarSCS.length+bayarS3.length },
    { ico:'🕌', bg:'#f5f3ff', lbl:'Isidental',      val:totIsidental, trx:donasiWaqaf.length }
  ].map(s => `
    <div class="sumber-card">
      <div class="sc-ico" style="background:${s.bg}">${s.ico}</div>
      <div>
        <div class="sc-lbl">${s.lbl}</div>
        <div class="sc-val rupiah">${rupiah(s.val)}</div>
        <div class="sc-pct">${s.trx} transaksi · ${pct(s.val)}%</div>
      </div>
    </div>`).join('');

  // ── TABEL DONATUR RUTIN ──
  const dRutin = [...bayarRutin].sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  document.getElementById('tblDonatur').innerHTML = dRutin.length ? dRutin.map(p => {
    const d = dr.find(x=>x.id===p.donatur_id)||{};
    return `<tr>
      <td style="font-weight:600">${p.nama_donatur||d.nama||'-'}</td>
      <td style="font-size:12px">${d.program||'-'}</td>
      <td class="rupiah" style="font-size:12px">${rupiah(d.nominal||0)}</td>
      <td style="font-size:12px">${tgl(p.tgl_bayar)}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(p.nominal)}</td>
      <td style="font-size:12px">${p.metode||'-'}</td>
      <td style="font-size:12px">${p.petugas||'-'}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;
  document.getElementById('footDonatur').innerHTML = dRutin.length
    ? `<tr><td colspan="4" style="padding:10px 14px">TOTAL (${dRutin.length} transaksi)</td><td class="rupiah" style="padding:10px 14px;color:var(--success)">${rupiah(totRutin)}</td><td colspan="2"></td></tr>` : '';

  // ── TABEL KOTAK INFAQ ──
  const dKotak = [...ambilKotak].sort((a,b)=>new Date(b.tgl_ambil)-new Date(a.tgl_ambil));
  document.getElementById('tblKotak').innerHTML = dKotak.length ? dKotak.map(a => `<tr>
    <td style="font-weight:600">${a.nama_kotak||'-'}</td>
    <td style="font-size:12px">${a.nama_toko||'-'}</td>
    <td style="font-size:12px">${DB.get('kotak_infaq').find(k=>k.id===a.kotak_id)?.kota||'-'}</td>
    <td style="font-size:12px">${tgl(a.tgl_ambil)}</td>
    <td class="rupiah" style="font-weight:700;color:#f97316">${rupiah(a.nominal)}</td>
    <td style="font-size:12px">${a.petugas||'-'}</td>
  </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;
  document.getElementById('footKotak').innerHTML = dKotak.length
    ? `<tr><td colspan="4" style="padding:10px 14px">TOTAL (${dKotak.length} pengambilan)</td><td class="rupiah" style="padding:10px 14px;color:#f97316">${rupiah(totKotak)}</td><td></td></tr>` : '';

  // ── TABEL S3 & SCS ──
  const dSCS = [
    ...bayarSCS.map(b=>({ nama:b.nama_santri||'-', jenis:'SCS', ket:`${b.kelas||'-'} / ${b.halaqoh||'-'}`, tgl:b.tgl_bayar, nominal:+b.nominal||0, petugas:b.petugas||'-' })),
    ...bayarS3.map(b=>({ nama:b.nama_ustadz||'-', jenis:'S3', ket:b.amanah||'-', tgl:b.tgl_bayar, nominal:+b.nominal||0, petugas:b.petugas||'-' }))
  ].sort((a,b)=>new Date(b.tgl)-new Date(a.tgl));
  document.getElementById('tblScs').innerHTML = dSCS.length ? dSCS.map(x => `<tr>
    <td style="font-weight:600">${x.nama}</td>
    <td><span class="badge ${x.jenis==='SCS'?'b-blue':'b-purple'}" style="font-size:10px">${x.jenis}</span></td>
    <td style="font-size:12px">${x.ket}</td>
    <td style="font-size:12px">${tgl(x.tgl)}</td>
    <td class="rupiah" style="font-weight:700;color:var(--primary)">${rupiah(x.nominal)}</td>
    <td style="font-size:12px">${x.petugas}</td>
  </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;
  document.getElementById('footScs').innerHTML = dSCS.length
    ? `<tr><td colspan="4" style="padding:10px 14px">TOTAL (${dSCS.length} transaksi)</td><td class="rupiah" style="padding:10px 14px;color:var(--primary)">${rupiah(totSCS+totS3)}</td><td></td></tr>` : '';

  // ── TABEL ISIDENTAL ──
  const dWaqaf = [...donasiWaqaf].sort((a,b)=>new Date(b.tgl_donasi)-new Date(a.tgl_donasi));
  document.getElementById('tblIsidental').innerHTML = dWaqaf.length ? dWaqaf.map(d => `<tr>
    <td style="font-weight:600">${d.nama||'-'}</td>
    <td style="font-size:12px">${wp.find(w=>w.id===d.program_id)?.nama||'-'}</td>
    <td style="font-size:12px">${tgl(d.tgl_donasi)}</td>
    <td class="rupiah" style="font-weight:700;color:#8b5cf6">${rupiah(d.nominal)}</td>
    <td style="font-size:12px">${d.metode||'-'}</td>
    <td style="font-size:12px">${d.petugas||'-'}</td>
  </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;
  document.getElementById('footIsidental').innerHTML = dWaqaf.length
    ? `<tr><td colspan="3" style="padding:10px 14px">TOTAL (${dWaqaf.length} donasi)</td><td class="rupiah" style="padding:10px 14px;color:#8b5cf6">${rupiah(totIsidental)}</td><td colspan="2"></td></tr>` : '';

  // ── REKAP BULANAN ──
  renderRekap(tahun);
};

function renderRekap(tahun) {
  const bayarAll   = DB.get('pembayaran_rutin');
  const ambilAll   = DB.get('pengambilan_kotak');
  const scsAll     = DB.get('scs_pembayaran');
  const s3All      = DB.get('s3_pembayaran');
  const waqafAll   = DB.get('donatur_waqaf');

  let kumulatif = 0;
  let grandRutin=0, grandKotak=0, grandSCS=0, grandWaqaf=0;

  document.getElementById('tblRekap').innerHTML = BLN.map((nama, idx) => {
    const mb  = String(idx+1).padStart(2,'0');
    const prd = `${tahun}-${mb}`;
    const r = bayarAll.filter(p=>p.tgl_bayar?.startsWith(prd)).reduce((s,p)=>s+(+p.nominal||0),0);
    const k = ambilAll.filter(a=>a.tgl_ambil?.startsWith(prd)).reduce((s,a)=>s+(+a.nominal||0),0);
    const sc = scsAll.filter(b=>b.tgl_bayar?.startsWith(prd)).reduce((s,b)=>s+(+b.nominal||0),0)
             + s3All.filter(b=>b.tgl_bayar?.startsWith(prd)).reduce((s,b)=>s+(+b.nominal||0),0);
    const w = waqafAll.filter(d=>d.tgl_donasi?.startsWith(prd)&&d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);
    const total = r+k+sc+w;
    kumulatif += total;
    grandRutin+=r; grandKotak+=k; grandSCS+=sc; grandWaqaf+=w;
    const isNow = new Date().getMonth()===idx && String(new Date().getFullYear())===tahun;
    return `<tr style="${isNow?'background:#f0fdf4;font-weight:600':''}">
      <td>${nama} ${tahun}${isNow?' 🔵':''}</td>
      <td class="rupiah" style="color:var(--success)">${r?rupiah(r):'—'}</td>
      <td class="rupiah" style="color:#f97316">${k?rupiah(k):'—'}</td>
      <td class="rupiah" style="color:var(--primary)">${sc?rupiah(sc):'—'}</td>
      <td class="rupiah" style="color:#8b5cf6">${w?rupiah(w):'—'}</td>
      <td class="rupiah" style="font-weight:700">${total?rupiah(total):'—'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${kumulatif?rupiah(kumulatif):'—'}</td>
    </tr>`;
  }).join('');

  const grandAll = grandRutin+grandKotak+grandSCS+grandWaqaf;
  document.getElementById('footRekap').innerHTML = `
    <tr style="background:var(--gray-800);color:white">
      <td style="padding:10px 14px">TOTAL ${tahun}</td>
      <td class="rupiah" style="padding:8px 14px">${rupiah(grandRutin)}</td>
      <td class="rupiah" style="padding:8px 14px">${rupiah(grandKotak)}</td>
      <td class="rupiah" style="padding:8px 14px">${rupiah(grandSCS)}</td>
      <td class="rupiah" style="padding:8px 14px">${rupiah(grandWaqaf)}</td>
      <td class="rupiah" style="padding:8px 14px">${rupiah(grandAll)}</td>
      <td style="padding:8px 14px">—</td>
    </tr>`;
}

window.switchTabAll = function(tab) {
  const map = {
    semua: ['allPaneRekap','allPaneDonatur','allPaneKotak','allPaneScs','allPaneIsidental'],
    rekap: ['allPaneRekap'], donatur: ['allPaneDonatur'],
    kotak: ['allPaneKotak'], scs: ['allPaneScs'], isidental: ['allPaneIsidental']
  };
  const all  = ['allPaneRekap','allPaneDonatur','allPaneKotak','allPaneScs','allPaneIsidental'];
  const tabs = ['allTabSemua','allTabRekap','allTabDonatur','allTabKotak','allTabScs','allTabIsidental'];
  all.forEach(p=>{const e=document.getElementById(p);if(e)e.style.display='none';});
  tabs.forEach(t=>{const e=document.getElementById(t);if(e)e.classList.remove('active');});
  (map[tab]||all).forEach(p=>{const e=document.getElementById(p);if(e)e.style.display='';});
  const tid='allTab'+tab.charAt(0).toUpperCase()+tab.slice(1);
  const te=document.getElementById(tid);if(te)te.classList.add('active');
};

window.exportLapKeseluruhan = function() {
  const bulan  = document.getElementById('flBulan').value;
  const tahun  = document.getElementById('flTahun').value;
  const periode = bulan ? `${tahun}-${bulan}` : tahun;
  const label  = bulan ? `${BLN[+bulan-1]}_${tahun}` : tahun;
  const dr     = DB.get('donatur_rutin');
  const wp     = DB.get('waqaf_program');

  const rows = [
    ...DB.get('pembayaran_rutin').filter(p=>(p.tgl_bayar||'').startsWith(periode)).map(p=>({
      sumber:'Donatur Rutin', nama:p.nama_donatur||'-', keterangan:dr.find(x=>x.id===p.donatur_id)?.program||'-',
      tanggal:p.tgl_bayar||'', nominal:p.nominal, metode:p.metode||'-', petugas:p.petugas||'-'
    })),
    ...DB.get('pengambilan_kotak').filter(a=>(a.tgl_ambil||'').startsWith(periode)).map(a=>({
      sumber:'Kotak Infaq', nama:a.nama_toko||'-', keterangan:a.nama_kotak||'-',
      tanggal:a.tgl_ambil||'', nominal:a.nominal, metode:'tunai', petugas:a.petugas||'-'
    })),
    ...DB.get('scs_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode)).map(b=>({
      sumber:'SCS', nama:b.nama_santri||'-', keterangan:`${b.kelas||'-'}/${b.halaqoh||'-'}`,
      tanggal:b.tgl_bayar||'', nominal:b.nominal, metode:'tunai', petugas:b.petugas||'-'
    })),
    ...DB.get('s3_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode)).map(b=>({
      sumber:'S3', nama:b.nama_ustadz||'-', keterangan:b.amanah||'-',
      tanggal:b.tgl_bayar||'', nominal:b.nominal, metode:'tunai', petugas:b.petugas||'-'
    })),
    ...DB.get('donatur_waqaf').filter(d=>(d.tgl_donasi||'').startsWith(periode)).map(d=>({
      sumber:'Isidental', nama:d.nama||'-', keterangan:wp.find(w=>w.id===d.program_id)?.nama||'-',
      tanggal:d.tgl_donasi||'', nominal:d.nominal, metode:d.metode||'-', petugas:d.petugas||'-'
    }))
  ].sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal));

  if (!rows.length) { toast('Tidak ada data','warn'); return; }
  exportExcel(rows, `LaporanKeseluruhan_${label}`, 'Semua Sumber');
};
