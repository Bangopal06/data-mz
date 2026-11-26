const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', async () => {
  initFilter();
  renderWaqaf();
  await Promise.all([
    DB.sync('waqaf_program'),
    DB.sync('donatur_waqaf'),
    DB.sync('prospek_waqaf')
  ]);
  initFilter();
  renderWaqaf();
});

function initFilter() {
  const now = new Date();
  const tahunNow = now.getFullYear();
  const selTahun = document.getElementById('flTahun');
  selTahun.innerHTML = [tahunNow, tahunNow-1, tahunNow-2].map(t =>
    `<option value="${t}" ${t===tahunNow?'selected':''}>${t}</option>`).join('');

  if (!document.getElementById('flBulan').value)
    document.getElementById('flBulan').value = String(now.getMonth()+1).padStart(2,'0');

  const wp = DB.get('waqaf_program');
  document.getElementById('flProg').innerHTML =
    '<option value="">Semua Program</option>' +
    wp.map(w => `<option value="${w.id}">${w.nama}</option>`).join('');
}

window.renderWaqaf = function() {
  const tahun  = document.getElementById('flTahun').value;
  const bulan  = document.getElementById('flBulan').value;
  const progId = document.getElementById('flProg').value;
  const kat    = document.getElementById('flKat').value;
  const stProg = document.getElementById('flStProg').value;
  const periode = bulan ? `${tahun}-${bulan}` : tahun;

  let wp = DB.get('waqaf_program');
  if (progId) wp = wp.filter(w => w.id === progId);
  if (kat)    wp = wp.filter(w => w.kategori === kat);
  if (stProg) wp = wp.filter(w => w.status === stProg);
  const wpIds = new Set(wp.map(w => w.id));

  let donasi = DB.get('donatur_waqaf').filter(d => {
    const inPeriode = (d.tgl_donasi||'').startsWith(periode);
    const inProg = wpIds.has(d.program_id);
    return inPeriode && inProg;
  });

  const totalTerkumpul = donasi.filter(d=>d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);
  const donaturUnik = new Set(donasi.map(d=>d.nama)).size;
  const label = bulan ? `${BULAN_NAMA[+bulan-1]} ${tahun}` : `Tahun ${tahun}`;

  // STATS
  document.getElementById('statsWaqaf').innerHTML = `
    <div class="stat"><div class="stat-ico ic-purple">🕌</div><div class="stat-body"><div class="lbl">Program Aktif</div><div class="val">${wp.filter(w=>w.status==='aktif').length}</div><div class="sub">${wp.length} total</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💚</div><div class="stat-body"><div class="lbl">Donasi ${label}</div><div class="val">${donasi.length}</div><div class="sub">${donaturUnik} donatur unik</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Terkumpul ${label}</div><div class="val rupiah" style="font-size:14px">${rupiah(totalTerkumpul)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">📊</div><div class="stat-body"><div class="lbl">Rata-rata/Donasi</div><div class="val rupiah" style="font-size:14px">${donasi.length?rupiah(Math.round(totalTerkumpul/donasi.length)):'Rp 0'}</div></div></div>
  `;

  renderDonasi(wp, donasi);
  renderRekapBulanan(donasi, tahun);
  renderTopDonatur(wp, donasi);
};

function renderDonasi(wp, donasi) {
  const sorted = [...donasi].sort((a,b)=>new Date(b.tgl_donasi)-new Date(a.tgl_donasi));
  document.getElementById('cntDonasi').textContent = sorted.length;
  const wqCnt = document.getElementById('wqCntDonasi'); if(wqCnt) wqCnt.textContent = sorted.length;
  const total = sorted.filter(d=>d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);

  document.getElementById('tblDonasi').innerHTML = sorted.length ? sorted.map(d => {
    const prog = wp.find(w=>w.id===d.program_id);
    return `<tr>
      <td class="td-name">${d.nama}</td>
      <td class="td-mono">${d.hp||'-'}</td>
      <td style="font-size:12px">${prog?.nama||'-'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--purple)">${rupiah(d.nominal)}</td>
      <td style="font-size:12px">${tgl(d.tgl_donasi)}</td>
      <td style="font-size:12px">${d.metode||'-'}</td>
      <td>${badge(d.status)}</td>
      <td style="font-size:12px">${d.petugas||'-'}</td>
    </tr>`;
  }).join('')
  : `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada donasi di periode ini</td></tr>`;

  document.getElementById('footDonasi').innerHTML = sorted.length ? `
    <tr>
      <td colspan="3" style="padding:10px 14px">TOTAL (${sorted.length} donasi)</td>
      <td class="rupiah" style="padding:10px 14px;color:var(--purple)">${rupiah(total)}</td>
      <td colspan="4"></td>
    </tr>` : '';
}

function renderRekapBulanan(donasi, tahun) {
  let grandTotal = 0, grandJml = 0;
  const rows = BULAN_NAMA.map((nama, idx) => {
    const mb = String(idx+1).padStart(2,'0');
    const donBulan = donasi.filter(d => d.tgl_donasi?.slice(5,7) === mb);
    const total = donBulan.filter(d=>d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);
    const unik = new Set(donBulan.map(d=>d.nama)).size;
    const rata = donBulan.length ? Math.round(total/donBulan.length) : 0;
    grandTotal += total;
    grandJml += donBulan.length;
    const isNow = new Date().getMonth()===idx && String(new Date().getFullYear())===tahun;
    return `<tr style="${isNow?'background:#faf5ff;font-weight:600':''}">
      <td>${nama} ${tahun}${isNow?' 🔵':''}</td>
      <td style="text-align:center">${donBulan.length||'—'}</td>
      <td style="text-align:center">${unik||'—'}</td>
      <td class="rupiah" style="font-weight:700;color:${total?'var(--purple)':'var(--gray-400)'}">${total?rupiah(total):'—'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${rata?rupiah(rata):'—'}</td>
    </tr>`;
  });

  document.getElementById('tblRekapBulanan').innerHTML = rows.join('');
  document.getElementById('footRekapBulanan').innerHTML = `
    <tr style="background:var(--gray-800);color:white">
      <td style="padding:10px 14px">TOTAL ${tahun}</td>
      <td style="padding:10px 14px;text-align:center">${grandJml}</td>
      <td style="padding:10px 14px;text-align:center">—</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandTotal)}</td>
      <td class="rupiah" style="padding:10px 14px">${grandJml?rupiah(Math.round(grandTotal/grandJml)):'—'}</td>
    </tr>`;
}

function renderTopDonatur(wp, donasi) {
  const map = {};
  donasi.filter(d=>d.status==='lunas').forEach(d => {
    if (!map[d.nama]) map[d.nama] = { nama:d.nama, kota:d.kota||'-', total:0, jml:0, lastDate:'', progSet:new Set() };
    map[d.nama].total += +d.nominal||0;
    map[d.nama].jml++;
    if (!map[d.nama].lastDate || d.tgl_donasi > map[d.nama].lastDate) map[d.nama].lastDate = d.tgl_donasi;
    if (d.program_id) {
      const p = wp.find(w=>w.id===d.program_id);
      if (p) map[d.nama].progSet.add(p.nama);
    }
  });

  const top = Object.values(map).sort((a,b)=>b.total-a.total).slice(0,10);
  document.getElementById('tblTopDonatur').innerHTML = top.length ? top.map((d,i) => `
    <tr>
      <td style="text-align:center;font-weight:700;color:${i===0?'#f59e0b':i===1?'var(--gray-500)':i===2?'#cd7c4a':'var(--gray-400)'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td>
      <td class="td-name">${d.nama}</td>
      <td style="font-size:12px">${d.kota}</td>
      <td style="font-size:12px">${[...d.progSet].join(', ')||'-'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--purple)">${rupiah(d.total)}</td>
      <td style="text-align:center">${d.jml}x</td>
      <td style="font-size:12px">${tgl(d.lastDate)}</td>
    </tr>`).join('')
  : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">Belum ada donasi</td></tr>`;
}

window.exportLaporanWaqaf = function() {
  const tahun = document.getElementById('flTahun').value;
  const bulan = document.getElementById('flBulan').value;
  const periode = bulan ? `${tahun}-${bulan}` : tahun;
  const label  = bulan ? `${BULAN_NAMA[+bulan-1]}_${tahun}` : tahun;
  const wp = DB.get('waqaf_program');
  const data = DB.get('donatur_waqaf').filter(d=>(d.tgl_donasi||'').startsWith(periode)).map(d => ({
    nama_donatur: d.nama, hp: d.hp||'', kota: d.kota||'',
    program: wp.find(w=>w.id===d.program_id)?.nama||'',
    nominal: d.nominal, tgl_donasi: d.tgl_donasi||'',
    metode_bayar: d.metode||'', status: d.status||'', petugas: d.petugas||''
  }));
  if (!data.length) { toast('Tidak ada data','warn'); return; }
  const metodeMap = {};
  data.forEach(r => {
    const m = (r.metode_bayar||'tunai').toLowerCase();
    if (!metodeMap[m]) metodeMap[m] = 0;
    metodeMap[m] += +r.nominal||0;
  });
  exportExcelWithMetodeSummary(data, `LaporanIsidental_${label}`, 'Isidental', metodeMap);
};

window.switchTabWaqaf = function(tab) {
  const map = { semua:['wqPaneDonasi','wqPaneRekap','wqPaneTop'], donasi:['wqPaneDonasi'], rekap:['wqPaneRekap'], top:['wqPaneTop'] };
  const all = ['wqPaneDonasi','wqPaneRekap','wqPaneTop'];
  const tabs = ['wqTabSemua','wqTabDonasi','wqTabRekap','wqTabTop'];
  all.forEach(p=>{const e=document.getElementById(p);if(e)e.style.display='none';});
  tabs.forEach(t=>{const e=document.getElementById(t);if(e)e.classList.remove('active');});
  (map[tab]||all).forEach(p=>{const e=document.getElementById(p);if(e)e.style.display='';});
  const tid='wqTab'+tab.charAt(0).toUpperCase()+tab.slice(1);
  const te=document.getElementById(tid);if(te)te.classList.add('active');
};

document.addEventListener('DOMContentLoaded',()=>{ setTimeout(()=>switchTabWaqaf('semua'),50); });
