const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', async () => {
  initFilter();
  renderLaporan();
  switchTab('semua');
  await Promise.all([DB.sync('donatur_rutin'), DB.sync('pembayaran_rutin')]);
  initFilter();
  renderLaporan();
  switchTab('semua');
});

function initFilter() {
  const now = new Date();
  const tahunNow = now.getFullYear();
  document.getElementById('flTahun').innerHTML =
    [tahunNow, tahunNow-1, tahunNow-2].map(t => `<option value="${t}">${t}</option>`).join('');
  document.getElementById('flBulan').value = String(now.getMonth()+1).padStart(2,'0');
  const programs = [...new Set(DB.get('donatur_rutin').map(d => d.program).filter(Boolean))];
  document.getElementById('flProgram').innerHTML =
    '<option value="">Semua Program</option>' + programs.map(p => `<option>${p}</option>`).join('');
}

window.renderLaporan = function() {
  const bulan   = document.getElementById('flBulan').value;
  const tahun   = document.getElementById('flTahun').value;
  const prog    = document.getElementById('flProgram').value;
  const periode = `${tahun}-${bulan}`;

  // Semua donatur aktif dan baru (untuk keperluan laporan bayar)
  const semuaDonatur = DB.get('donatur_rutin').filter(d =>
    (d.status === 'aktif' || d.status === 'baru') && (!prog || d.program === prog)
  );
  const aktif      = semuaDonatur.filter(d => d.status === 'aktif');
  const donaturBaru = DB.get('donatur_rutin').filter(d => d.status === 'baru');

  const bayarPeriode = DB.get('pembayaran_rutin').filter(p =>
    p.tgl_bayar && p.tgl_bayar.startsWith(periode)
  );

  const sudahIds = new Set(bayarPeriode.map(p => p.donatur_id));
  // Sudah bayar = aktif + baru yang ada bayarannya bulan ini
  const sudah    = semuaDonatur.filter(d => sudahIds.has(d.id));
  // Belum bayar = hanya donatur aktif yang belum bayar (baru punya section sendiri)
  const belum    = aktif.filter(d => !sudahIds.has(d.id));

  const totalSudah    = bayarPeriode
    .filter(p => semuaDonatur.find(a => a.id === p.donatur_id))
    .reduce((s,p) => s+(+p.nominal||0), 0);
  const targetBulanan = aktif.reduce((s,d) => s+(+d.nominal||0), 0);
  const totalBelum    = belum.reduce((s,d) => s+(+d.nominal||0), 0);
  const pct           = targetBulanan ? Math.round((totalSudah/targetBulanan)*100) : 0;

  // ── STAT CARDS ──
  document.getElementById('statsDonatur').innerHTML = `
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body">
      <div class="lbl">Sudah Bayar</div><div class="val">${sudah.length}</div>
      <div class="sub rupiah">${rupiah(totalSudah)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-red">⏳</div><div class="stat-body">
      <div class="lbl">Belum Bayar</div><div class="val">${belum.length}</div>
      <div class="sub rupiah">${rupiah(totalBelum)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">👤</div><div class="stat-body">
      <div class="lbl">Donatur Baru</div><div class="val">${donaturBaru.length}</div>
      <div class="sub">menunggu bayar ke-2</div></div></div>
    <div class="stat"><div class="stat-ico ic-teal">🎯</div><div class="stat-body">
      <div class="lbl">Terkumpul / Target</div>
      <div class="val rupiah" style="font-size:14px">${rupiah(totalSudah)}</div>
      <div class="sub">${pct}% dari ${rupiah(targetBulanan)}</div></div></div>`;

  // ── TABEL SUDAH BAYAR (aktif + baru yang sudah bayar bulan ini) ──
  document.getElementById('tblSudahBayar').innerHTML = sudah.length ? sudah.map(d => {
    const bayar = bayarPeriode.filter(p => p.donatur_id === d.id);
    const labelBaru = d.status === 'baru' ? ' <span class="badge b-purple" style="font-size:10px;vertical-align:middle">Baru</span>' : '';
    return bayar.map((p,i) => `<tr>
      ${i===0 ? `<td class="td-name" rowspan="${bayar.length}">${d.nama}${labelBaru}</td>
        <td class="td-mono" rowspan="${bayar.length}">${d.hp||'-'}</td>
        <td style="font-size:12px" rowspan="${bayar.length}">${d.program||'-'}</td>
        <td class="rupiah" style="font-size:12px" rowspan="${bayar.length}">${rupiah(d.nominal)}</td>` : ''}
      <td style="font-size:12px">${tgl(p.tgl_bayar)}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(p.nominal)}</td>
      <td style="font-size:12px">${p.petugas||d.petugas||'-'}</td>
    </tr>`).join('');
  }).join('')
  : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">Belum ada yang membayar bulan ini</td></tr>`;

  document.getElementById('footSudah').innerHTML = sudah.length
    ? `<tr><td colspan="5" style="padding:10px 14px">TOTAL TERKUMPUL</td>
       <td class="rupiah" style="padding:10px 14px;color:var(--success)">${rupiah(totalSudah)}</td><td></td></tr>` : '';

  // ── TABEL BELUM BAYAR (donatur aktif saja) ──
  document.getElementById('tblBelumBayar').innerHTML = belum.length ? belum.map(d => `
    <tr>
      <td class="td-name">${d.nama}</td>
      <td class="td-mono">${d.hp||'-'}</td>
      <td style="font-size:12px">${d.alamat||'-'}</td>
      <td style="font-size:12px">${d.program||'-'}</td>
      <td class="rupiah" style="font-weight:600;color:var(--danger)">${rupiah(d.nominal)}</td>
      <td style="font-size:12px">${d.petugas||'-'}</td>
      <td class="no-print"><a href="donatur-rutin.html" class="btn btn-ghost btn-sm">📞 Hubungi</a></td>
    </tr>`).join('')
  : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--success)">🎉 Semua donatur aktif sudah membayar!</td></tr>`;

  document.getElementById('footBelum').innerHTML = belum.length
    ? `<tr><td colspan="4" style="padding:10px 14px">TOTAL TUNGGAKAN</td>
       <td class="rupiah" style="padding:10px 14px;color:var(--danger)">${rupiah(totalBelum)}</td><td colspan="2"></td></tr>` : '';

  // ── TABEL DONATUR BARU (status 'baru' — global, bukan per periode) ──
  document.getElementById('tblDonaturBaru').innerHTML = donaturBaru.length ? donaturBaru.map(d => {
    const jmlBayar = DB.get('pembayaran_rutin').filter(p => p.donatur_id === d.id).length;
    return `<tr>
      <td style="font-weight:600">${d.nama}</td>
      <td class="td-mono">${d.hp||'-'}</td>
      <td class="rupiah" style="font-weight:600;color:var(--success)">${rupiah(d.nominal)}</td>
      <td style="font-size:12px">${d.metode||'-'}</td>
      <td style="font-size:12px">${tgl(d.tgl_mulai)}</td>
      <td style="text-align:center">
        <span class="badge ${jmlBayar>=1?'b-green':'b-gray'}">${jmlBayar}x bayar</span>
        ${jmlBayar===0?'<span style="font-size:11px;color:var(--danger)"> ⚠ belum bayar</span>':''}
      </td>
      <td style="font-size:12px">${d.petugas||'-'}</td>
      <td style="font-size:12px">${d.program||'-'}</td>
    </tr>`;
  }).join('')
  : `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--gray-400)">Tidak ada donatur baru yang menunggu aktif</td></tr>`;

  renderRekap(tahun, prog);

  // Update counter tab
  document.getElementById('cntTabSemua').textContent  = sudah.length + belum.length;
  document.getElementById('cntTabSudah').textContent  = sudah.length;
  document.getElementById('cntTabBelum').textContent  = belum.length;
  document.getElementById('cntTabBaru').textContent   = donaturBaru.length;
  // juga update badge di stat card yang sudah ada
  document.getElementById('cntSudah').textContent = sudah.length;
  document.getElementById('cntBelum').textContent = belum.length;
  document.getElementById('cntDonaturBaru').textContent = donaturBaru.length;
};

function renderRekap(tahun, prog) {
  const aktif  = DB.get('donatur_rutin').filter(d => d.status === 'aktif' && (!prog || d.program === prog));
  const target = aktif.reduce((s,d) => s+(+d.nominal||0), 0);
  const bayarAll = DB.get('pembayaran_rutin');

  document.getElementById('tblRekap').innerHTML = BULAN_NAMA.map((nama, idx) => {
    const mb  = String(idx+1).padStart(2,'0');
    const prd = `${tahun}-${mb}`;
    const bayarBulan = bayarAll.filter(p => p.tgl_bayar?.startsWith(prd));
    const sudahIds   = new Set(bayarBulan.map(p => p.donatur_id));
    const sudahCount = aktif.filter(d => sudahIds.has(d.id)).length;
    const belumCount = aktif.length - sudahCount;
    const total = bayarBulan
      .filter(p => aktif.find(a => a.id === p.donatur_id))
      .reduce((s,p) => s+(+p.nominal||0), 0);
    const pct   = target ? Math.round((total/target)*100) : 0;
    const isNow = new Date().getMonth()===idx && String(new Date().getFullYear())===tahun;

    return `<tr style="${isNow?'background:#f0fdf4;font-weight:600':''}">
      <td>${nama} ${tahun}${isNow?' 🔵':''}</td>
      <td style="color:var(--success);font-weight:600">${sudahCount} donatur</td>
      <td style="color:${belumCount?'var(--danger)':'var(--gray-400)'}">${belumCount} donatur</td>
      <td class="rupiah" style="font-weight:700">${total ? rupiah(total) : '<span style="color:var(--gray-300)">—</span>'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${rupiah(target)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:var(--gray-100);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100,pct)}%;background:${pct>=100?'var(--success)':pct>=50?'#f97316':'var(--danger)'};border-radius:3px"></div>
          </div>
          <span style="font-size:12px;font-weight:600;min-width:36px">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

window.exportCSVDonatur = function() {
  const bulan   = document.getElementById('flBulan').value;
  const tahun   = document.getElementById('flTahun').value;
  const periode = `${tahun}-${bulan}`;
  const aktif   = DB.get('donatur_rutin').filter(d => d.status === 'aktif');
  const bayar   = DB.get('pembayaran_rutin').filter(p => p.tgl_bayar?.startsWith(periode));
  const sudahIds = new Set(bayar.map(p => p.donatur_id));

  const rows = aktif.map(d => ({
    nama: d.nama, hp: d.hp||'', alamat: d.alamat||'', kota: d.kota||'',
    program: d.program||'', nominal_rutin: d.nominal,
    status_bulan_ini: sudahIds.has(d.id) ? 'Sudah Bayar' : 'Belum Bayar',
    tgl_bayar: bayar.find(p=>p.donatur_id===d.id)?.tgl_bayar||'',
    nominal_bayar: bayar.filter(p=>p.donatur_id===d.id).reduce((s,p)=>s+(+p.nominal||0),0)||'',
    petugas: d.petugas||''
  }));
  exportExcel(rows, `LaporanDonatur_${BULAN_NAMA[+bulan-1]}_${tahun}`, 'Donatur Aktif');
};

window.switchTab = function(tab) {
  const panes = { semua: ['paneSudah','paneBelum'], sudah: ['paneSudah'], belum: ['paneBelum'], baru: ['paneBaru'], rekap: ['paneRekap'] };
  const allPanes = ['paneSudah','paneBelum','paneBaru','paneRekap'];
  const tabs = ['tabSemua','tabSudah','tabBelum','tabBaru','tabRekap'];

  // Reset semua
  allPanes.forEach(p => { const el = document.getElementById(p); if(el) el.style.display = 'none'; });
  tabs.forEach(t => { const el = document.getElementById(t); if(el) el.classList.remove('active'); });

  // Tampilkan pane yang dipilih
  (panes[tab] || allPanes).forEach(p => { const el = document.getElementById(p); if(el) el.style.display = ''; });
  const activeTab = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if(activeTab) activeTab.classList.add('active');
};
