const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', async () => {
  // Render dari cache dulu
  initFilter();
  renderWaqaf();
  // Sync background
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

  const wp = DB.get('waqaf_program');
  document.getElementById('flProg').innerHTML =
    '<option value="">Semua Program</option>' +
    wp.map(w => `<option value="${w.id}">${w.nama}</option>`).join('');
}

window.renderWaqaf = function() {
  const tahun  = document.getElementById('flTahun').value;
  const progId = document.getElementById('flProg').value;
  const kat    = document.getElementById('flKat').value;
  const stProg = document.getElementById('flStProg').value;

  let wp = DB.get('waqaf_program');
  if (progId) wp = wp.filter(w => w.id === progId);
  if (kat)    wp = wp.filter(w => w.kategori === kat);
  if (stProg) wp = wp.filter(w => w.status === stProg);
  const wpIds = new Set(wp.map(w => w.id));

  let donasi = DB.get('donatur_waqaf').filter(d => {
    const inYear = d.tgl_donasi?.startsWith(tahun);
    const inProg = wpIds.has(d.program_id);
    return inYear && inProg;
  });

  const totalTerkumpul = donasi.filter(d=>d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);
  const totalTarget    = wp.reduce((s,w)=>s+(+w.target||0),0);
  const pct = totalTarget ? Math.round(totalTerkumpul/totalTarget*100) : 0;
  const donaturUnik = new Set(donasi.map(d=>d.nama)).size;

  // STATS
  document.getElementById('statsWaqaf').innerHTML = `
    <div class="stat"><div class="stat-ico ic-purple">🕌</div><div class="stat-body"><div class="lbl">Program Aktif</div><div class="val">${wp.filter(w=>w.status==='aktif').length}</div><div class="sub">${wp.length} total</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💚</div><div class="stat-body"><div class="lbl">Donasi ${tahun}</div><div class="val">${donasi.length}</div><div class="sub">${donaturUnik} donatur unik</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Terkumpul ${tahun}</div><div class="val rupiah" style="font-size:14px">${rupiah(totalTerkumpul)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-teal">🎯</div><div class="stat-body"><div class="lbl">Total Target</div><div class="val rupiah" style="font-size:14px">${rupiah(totalTarget)}</div><div class="sub">${pct}% tercapai</div></div></div>
  `;

  renderRekapProgram(wp, donasi);
  renderDonasi(wp, donasi);
  renderRekapBulanan(donasi, tahun);
  renderTopDonatur(wp, donasi);
};

function renderRekapProgram(wp, donasi) {
  let grandTarget=0, grandTerkumpul=0, grandDonatur=0;
  const rows = [...wp].sort((a,b)=>(+b.terkumpul||0)-(+a.terkumpul||0)).map(w => {
    const donW = donasi.filter(d=>d.program_id===w.id);
    const terkumpul = donW.filter(d=>d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);
    const pct = w.target ? Math.min(100, Math.round(terkumpul/(+w.target)*100)) : 0;
    const color = pct>=100?'var(--success)':pct>=60?'var(--primary)':'#f97316';
    const ikon = {masjid:'🕌',pendidikan:'📚',kesehatan:'🏥',sosial:'🤝'}[w.kategori]||'🌟';
    grandTarget += +w.target||0;
    grandTerkumpul += terkumpul;
    grandDonatur += donW.length;
    return `<tr class="prog-row-${w.status}">
      <td class="td-name">${ikon} ${w.nama}</td>
      <td>${badge(w.kategori)}</td>
      <td style="font-size:12px">${w.metode_waqaf||'-'}</td>
      <td class="rupiah" style="font-size:12px">${rupiah(w.target)}</td>
      <td class="rupiah" style="font-weight:700;color:${color}">${rupiah(terkumpul)}</td>
      <td style="min-width:100px">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="pbar-wrap" style="flex:1"><div class="pbar-fill" style="width:${pct}%;background:${color}"></div></div>
          <span style="font-size:11px;font-weight:700;color:${color}">${pct}%</span>
        </div>
      </td>
      <td style="text-align:center">${donW.length}</td>
      <td>${badge(w.status)}</td>
    </tr>`;
  });

  document.getElementById('tblRekapProgram').innerHTML = rows.length
    ? rows.join('')
    : `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada program</td></tr>`;

  const grandPct = grandTarget ? Math.round(grandTerkumpul/grandTarget*100) : 0;
  document.getElementById('footRekapProgram').innerHTML = rows.length ? `
    <tr>
      <td colspan="3" style="padding:10px 14px">TOTAL (${wp.length} program)</td>
      <td class="rupiah" style="padding:10px 14px">${rupiah(grandTarget)}</td>
      <td class="rupiah" style="padding:10px 14px;color:#f97316">${rupiah(grandTerkumpul)}</td>
      <td style="padding:10px 14px;font-weight:700">${grandPct}%</td>
      <td style="padding:10px 14px;text-align:center">${grandDonatur}</td>
      <td></td>
    </tr>` : '';
}

function renderDonasi(wp, donasi) {
  const sorted = [...donasi].sort((a,b)=>new Date(b.tgl_donasi)-new Date(a.tgl_donasi));
  document.getElementById('cntDonasi').textContent = sorted.length;
  const total = sorted.filter(d=>d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);

  document.getElementById('tblDonasi').innerHTML = sorted.length ? sorted.map(d => {
    const prog = wp.find(w=>w.id===d.program_id);
    return `<tr>
      <td class="td-name">${d.nama}</td>
      <td class="td-mono">${d.hp||'-'}</td>
      <td style="font-size:12px">${prog?.nama||'-'}</td>
      <td style="font-size:12px">${prog?.metode_waqaf||'-'}</td>
      <td class="rupiah" style="font-weight:700;color:var(--purple)">${rupiah(d.nominal)}</td>
      <td style="font-size:12px">${tgl(d.tgl_donasi)}</td>
      <td style="font-size:12px">${d.metode||'-'}</td>
      <td>${badge(d.status)}</td>
      <td style="font-size:12px">${d.petugas||'-'}</td>
    </tr>`;
  }).join('')
  : `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-400)">Tidak ada donasi di periode ini</td></tr>`;

  document.getElementById('footDonasi').innerHTML = sorted.length ? `
    <tr>
      <td colspan="4" style="padding:10px 14px">TOTAL (${sorted.length} donasi)</td>
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
  const wp = DB.get('waqaf_program');
  const data = DB.get('donatur_waqaf').filter(d=>d.tgl_donasi?.startsWith(tahun)).map(d => ({
    nama_donatur: d.nama, hp: d.hp||'', kota: d.kota||'',
    program: wp.find(w=>w.id===d.program_id)?.nama||'',
    metode_waqaf: wp.find(w=>w.id===d.program_id)?.metode_waqaf||'',
    nominal: d.nominal, tgl_donasi: d.tgl_donasi||'',
    metode_bayar: d.metode||'', status: d.status||'', petugas: d.petugas||''
  }));
  exportExcel(data, `LaporanWaqaf_${tahun}`, 'Waqaf');
};
