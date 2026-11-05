document.addEventListener('DOMContentLoaded', async () => {
  initFilter();
  renderPetugas();
  await Promise.all([
    DB.sync('petugas'),
    DB.sync('pembayaran_rutin'),
    DB.sync('donatur_rutin'),
    DB.sync('pengambilan_kotak'),
    DB.sync('kotak_infaq'),
    DB.sync('scs_pembayaran'),
    DB.sync('s3_pembayaran'),
    DB.sync('donatur_waqaf'),
    DB.sync('waqaf_program')
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

  // 3. Sedekah SCS
  DB.get('scs_pembayaran').forEach(b => {
    if (!b.petugas) return;
    const tgl = b.tgl_bayar || '';
    if (!tgl.startsWith(periode)) return;
    semua.push({
      petugas: b.petugas, jenis: 'SCS',
      nama: b.nama_santri || '-',
      nominal: +b.nominal||0, tgl, ket: `${b.kelas||'-'} / ${b.halaqoh||'-'}`
    });
  });

  // S3 Ustadz/Ustadzah
  DB.get('s3_pembayaran').forEach(b => {
    if (!b.petugas) return;
    const tgl = b.tgl_bayar || '';
    if (!tgl.startsWith(periode)) return;
    semua.push({
      petugas: b.petugas, jenis: 'S3',
      nama: b.nama_ustadz || '-',
      nominal: +b.nominal||0, tgl, ket: b.amanah||'-'
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
    if (!map[x.petugas]) map[x.petugas] = { nama:x.petugas, rutin:0, kotak:0, scs:0, s3:0, isidental:0, total:0, jml:0 };
    if (x.jenis==='Donatur Rutin') map[x.petugas].rutin += x.nominal;
    else if (x.jenis==='Kotak Infaq') map[x.petugas].kotak += x.nominal;
    else if (x.jenis==='SCS') map[x.petugas].scs += x.nominal;
    else if (x.jenis==='S3') map[x.petugas].s3 += x.nominal;
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
      <td class="rupiah" style="color:#0ea5e9">${r.s3?rupiah(r.s3):'—'}</td>
      <td class="rupiah" style="color:#8b5cf6">${r.isidental?rupiah(r.isidental):'—'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--gray-900)">${rupiah(r.total)}</td>
      <td style="text-align:center">${r.jml}x</td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data petugas di periode ini</td></tr>`;

  document.getElementById('footRekapPetugas').innerHTML = rekap.length ? `
    <tr>
      <td colspan="2" style="padding:10px 14px">TOTAL (${rekap.length} petugas)</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.rutin,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.kotak,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.scs,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.s3,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(rekap.reduce((s,r)=>s+r.isidental,0))}</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandTotal)}</td>
      <td style="padding:10px 14px;text-align:center">${grandJml}x</td>
    </tr>` : '';

  // DETAIL TABLE
  const jenisColor = { 'Donatur Rutin':'b-green', 'Kotak Infaq':'b-orange', 'SCS':'b-blue', 'S3':'b-teal', 'Isidental':'b-purple' };
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

  // PENGEMBANGAN — donatur baru (status 'baru' di donatur_rutin) + kotak baru (status 'baru' di kotak_infaq)
  const donaturBaru = DB.get('donatur_rutin')
    .filter(d => d.status === 'baru' && (!filterPt || d.petugas === filterPt));
  const kotakBaru = DB.get('kotak_infaq')
    .filter(k => k.status === 'baru' && (!filterPt || k.petugas === filterPt));

  const allPengembangan = [
    ...donaturBaru.map(d => ({ jenis:'Donatur Rutin', nama:d.nama, kota:d.kota||'-', tgl_mulai:d.tgl_mulai||'', nominal:d.nominal||0, petugas:d.petugas||'-', sudahBayar: DB.get('pembayaran_rutin').filter(p=>p.donatur_id===d.id).length })),
    ...kotakBaru.map(k => ({ jenis:'Kotak Infaq', nama:k.nama_toko||k.nama_kotak||'-', kota:k.kota||'-', tgl_mulai:k.created_at?.slice(0,10)||'', nominal:0, petugas:k.petugas||'-', sudahBayar: DB.get('pengambilan_kotak').filter(a=>a.kotak_id===k.id).length }))
  ];

  // Rekap per petugas
  const pengMap = {};
  allPengembangan.forEach(p => {
    if (!pengMap[p.petugas]) pengMap[p.petugas] = { nama:p.petugas, donatur:0, kotak:0, total:0 };
    if (p.jenis==='Donatur Rutin') pengMap[p.petugas].donatur++;
    else pengMap[p.petugas].kotak++;
    pengMap[p.petugas].total++;
  });
  const rekapProspek = Object.values(pengMap).sort((a,b) => b.total - a.total);

  document.getElementById('tblProspekPetugas').innerHTML = rekapProspek.length ? rekapProspek.map((r,i) => `
    <tr>
      <td style="text-align:center;font-weight:700;color:var(--gray-400)">${i+1}</td>
      <td style="font-weight:600">${r.nama}</td>
      <td style="text-align:center;color:var(--success);font-weight:600">${r.donatur||'—'}</td>
      <td style="text-align:center;color:#f97316;font-weight:600">${r.kotak||'—'}</td>
      <td style="text-align:center;font-weight:700">${r.total}</td>
    </tr>`).join('')
  : `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data pengembangan</td></tr>`;

  // Detail pengembangan
  document.getElementById('tblDetailProspek').innerHTML = allPengembangan.length ? allPengembangan.map(p => `
    <tr>
      <td style="font-weight:600">${p.petugas}</td>
      <td><span class="badge ${p.jenis==='Kotak Infaq'?'b-orange':'b-green'}" style="font-size:10px">${p.jenis}</span></td>
      <td style="font-size:12px">${p.nama}</td>
      <td style="font-size:12px">${p.kota}</td>
      <td style="font-size:12px">${p.tgl_mulai ? tgl(p.tgl_mulai) : '-'}</td>
      <td style="text-align:center">
        <span class="badge ${p.sudahBayar>=1?'b-green':'b-gray'}">${p.sudahBayar}x</span>
        ${p.sudahBayar===0?'<span style="font-size:11px;color:var(--danger)"> ⚠ belum</span>':''}
      </td>
    </tr>`).join('')
  : `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada data pengembangan</td></tr>`;

  // REKAP METODE PEMBAYARAN - ambil dari semua sumber
  const periode2 = document.getElementById('flTahun').value +
    (document.getElementById('flBulan').value ? '-'+document.getElementById('flBulan').value : '');
  const metodeTotal = {};

  // Pembayaran donatur rutin (punya field metode)
  DB.get('pembayaran_rutin').filter(b=>(b.tgl_bayar||'').startsWith(periode2)).forEach(b => {
    const m = b.metode || 'transfer';
    if (!metodeTotal[m]) metodeTotal[m] = {jml:0, total:0};
    metodeTotal[m].jml++; metodeTotal[m].total += +(b.nominal||0);
  });
  // SCS santri (default tunai)
  DB.get('scs_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode2)).forEach(b => {
    const m = 'tunai';
    if (!metodeTotal[m]) metodeTotal[m] = {jml:0, total:0};
    metodeTotal[m].jml++; metodeTotal[m].total += +(b.nominal||0);
  });
  // S3 ustadz (default tunai)
  DB.get('s3_pembayaran').filter(b=>(b.tgl_bayar||'').startsWith(periode2)).forEach(b => {
    const m = 'tunai';
    if (!metodeTotal[m]) metodeTotal[m] = {jml:0, total:0};
    metodeTotal[m].jml++; metodeTotal[m].total += +(b.nominal||0);
  });
  // Kotak infaq (tunai)
  DB.get('pengambilan_kotak').filter(a=>(a.tgl_ambil||'').startsWith(periode2)).forEach(a => {
    const m = 'tunai';
    if (!metodeTotal[m]) metodeTotal[m] = {jml:0, total:0};
    metodeTotal[m].jml++; metodeTotal[m].total += +(a.nominal||0);
  });
  // Isidental/waqaf (punya field metode)
  DB.get('donatur_waqaf').filter(d=>(d.tgl_donasi||'').startsWith(periode2)).forEach(d => {
    const m = d.metode || 'transfer';
    if (!metodeTotal[m]) metodeTotal[m] = {jml:0, total:0};
    metodeTotal[m].jml++; metodeTotal[m].total += +(d.nominal||0);
  });

  const grandMetode = Object.values(metodeTotal).reduce((s,m)=>s+m.total, 0);
  const metodeEl = document.getElementById('tblMetodePembayaran');
  if (metodeEl) {
    metodeEl.innerHTML = Object.entries(metodeTotal).sort((a,b)=>b[1].total-a[1].total).map(([m,v]) => {
      const pct = grandMetode ? Math.round(v.total/grandMetode*100) : 0;
      const color = m==='tunai'?'#f97316':m==='transfer'?'var(--primary)':m==='qris'?'#8b5cf6':'var(--gray-400)';
      const icon = m==='tunai'?'💵':m==='transfer'?'🏦':m==='qris'?'📱':'💳';
      return `<tr>
        <td style="font-weight:600">${icon} ${m.charAt(0).toUpperCase()+m.slice(1)}</td>
        <td style="text-align:center">${v.jml}x</td>
        <td class="rupiah" style="font-weight:700;color:${color}">${rupiah(v.total)}</td>
        <td style="min-width:140px">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="flex:1;height:8px;background:var(--gray-200);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${color};border-radius:99px"></div>
            </div>
            <span style="font-size:11px;font-weight:700;color:${color}">${pct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada data</td></tr>`;

    const footEl = document.getElementById('footMetodePembayaran');
    if (footEl) footEl.innerHTML = `
      <tr style="background:var(--gray-800);color:white">
        <td style="padding:10px 14px">TOTAL SEMUA</td>
        <td style="padding:10px 14px;text-align:center">${Object.values(metodeTotal).reduce((s,m)=>s+m.jml,0)}x</td>
        <td class="rupiah" style="padding:10px 14px">${rupiah(grandMetode)}</td>
        <td style="padding:10px 14px">100%</td>
      </tr>`;
  }
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
  DB.get('scs_pembayaran').filter(b=>b.petugas&&(b.tgl_bayar||'').startsWith(periode)).forEach(b => {
    rows.push({ petugas:b.petugas, jenis:'SCS', nama:b.nama_santri||'-', nominal:b.nominal, tgl:b.tgl_bayar||'' });
  });
  DB.get('s3_pembayaran').filter(b=>b.petugas&&(b.tgl_bayar||'').startsWith(periode)).forEach(b => {
    rows.push({ petugas:b.petugas, jenis:'S3', nama:b.nama_ustadz||'-', nominal:b.nominal, tgl:b.tgl_bayar||'' });
  });
  DB.get('donatur_waqaf').filter(d=>d.petugas&&(d.tgl_donasi||'').startsWith(periode)).forEach(d => {
    rows.push({ petugas:d.petugas, jenis:'Isidental', nama:d.nama||'-', nominal:d.nominal, tgl:d.tgl_donasi||'' });
  });

  rows.sort((a,b)=>new Date(b.tgl)-new Date(a.tgl));
  if (!rows.length) { toast('Tidak ada data','warn'); return; }
  exportExcel(rows, `LaporanPetugas_${periode}`, 'Petugas');
};

window.switchTabPetugas = function(tab) {
  const map = {
    semua: ['ptPaneMetode','ptPaneRekap','ptPaneDetail','ptPaneProspek','ptPaneDetailProspek'],
    metode: ['ptPaneMetode'], rekap: ['ptPaneRekap'], detail: ['ptPaneDetail'],
    prospek: ['ptPaneProspek','ptPaneDetailProspek']
  };
  const all = ['ptPaneMetode','ptPaneRekap','ptPaneDetail','ptPaneProspek','ptPaneDetailProspek'];
  const tabs = ['ptTabSemua','ptTabMetode','ptTabRekap','ptTabDetail','ptTabProspek'];
  all.forEach(p=>{const e=document.getElementById(p);if(e)e.style.display='none';});
  tabs.forEach(t=>{const e=document.getElementById(t);if(e)e.classList.remove('active');});
  (map[tab]||all).forEach(p=>{const e=document.getElementById(p);if(e)e.style.display='';});
  const tid='ptTab'+tab.charAt(0).toUpperCase()+tab.slice(1);
  const te=document.getElementById(tid);if(te)te.classList.add('active');
};

document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>switchTabPetugas('semua'),50); });
