const BULAN_NAMA = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

document.addEventListener('DOMContentLoaded', () => {
  initFilter();
  renderDonatur();
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

  // Program
  const programs = [...new Set(DB.get('donatur_rutin').map(d => d.program).filter(Boolean))];
  const sel = document.getElementById('flProgram');
  sel.innerHTML = '<option value="">Semua Program</option>' + programs.map(p => `<option>${p}</option>`).join('');
}

window.renderDonatur = function() {
  const bulan = document.getElementById('flBulan').value;
  const tahun = document.getElementById('flTahun').value;
  const program = document.getElementById('flProgram').value;
  const periode = `${tahun}-${bulan}`;

  const donaturAktif = DB.get('donatur_rutin').filter(d =>
    d.status === 'aktif' && (!program || d.program === program)
  );

  const bayarBulanIni = DB.get('pembayaran_rutin').filter(p =>
    p.tgl_bayar && p.tgl_bayar.startsWith(periode)
  );

  // Donatur yg sudah bayar bulan ini
  const sudahIds = new Set(bayarBulanIni.map(p => p.donatur_id));
  const sudah = donaturAktif.filter(d => sudahIds.has(d.id));
  const belum = donaturAktif.filter(d => !sudahIds.has(d.id));

  const totalSudah = bayarBulanIni.reduce((s,p) => s+((+p.nominal)||0), 0);
  const targetBulanan = donaturAktif.reduce((s,d) => s+((+d.nominal)||0), 0);
  const pct = targetBulanan ? Math.round((totalSudah/targetBulanan)*100) : 0;
  const totalBelum = donaturAktif.filter(d => !sudahIds.has(d.id)).reduce((s,d) => s+((+d.nominal)||0), 0);

  // Stats
  document.getElementById('statsDonatur').innerHTML = `
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body">
      <div class="lbl">Sudah Bayar</div><div class="val">${sudah.length}</div>
      <div class="sub rupiah">${rupiah(totalSudah)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-red">⏳</div><div class="stat-body">
      <div class="lbl">Belum Bayar</div><div class="val">${belum.length}</div>
      <div class="sub rupiah">${rupiah(totalBelum)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-teal">🎯</div><div class="stat-body">
      <div class="lbl">Target Bulan Ini</div><div class="val rupiah" style="font-size:16px">${rupiah(targetBulanan)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">📊</div><div class="stat-body">
      <div class="lbl">Terkumpul</div><div class="val rupiah" style="font-size:16px">${rupiah(totalSudah)}</div>
      <div class="sub">${pct}% dari target</div></div></div>
  `;

  // Counter badge
  document.getElementById('cntSudah').textContent = sudah.length;
  document.getElementById('cntBelum').textContent = belum.length;

  // Tabel sudah bayar
  document.getElementById('tblSudahBayar').innerHTML = sudah.length ? sudah.map(d => {
    const bayar = bayarBulanIni.filter(p => p.donatur_id === d.id);
    return bayar.map((p,i) => `<tr style="${i===0?'':'background:#f9fafb'}">
      ${i===0 ? `<td class="td-name" rowspan="${bayar.length}">${d.nama}</td>
        <td class="td-mono" rowspan="${bayar.length}">${d.hp}</td>
        <td style="font-size:12px" rowspan="${bayar.length}">${d.program||'-'}</td>
        <td class="rupiah" style="font-size:12px" rowspan="${bayar.length}">${rupiah(d.nominal)}</td>` : ''}
      <td style="font-size:12px">${tgl(p.tgl_bayar)}</td>
      <td class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(p.nominal)}</td>
      <td style="font-size:12px">${p.petugas||d.petugas||'-'}</td>
    </tr>`).join('');
  }).join('') : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--gray-400)">Belum ada yang membayar bulan ini</td></tr>`;

  document.getElementById('footSudah').innerHTML = sudah.length ? `
    <tr><td colspan="5" style="padding:10px 14px">TOTAL TERKUMPUL</td>
      <td class="rupiah" style="padding:10px 14px;color:var(--success)">${rupiah(totalSudah)}</td><td></td></tr>` : '';

  // Tabel belum bayar
  document.getElementById('tblBelumBayar').innerHTML = belum.length ? belum.map(d => `
    <tr>
      <td class="td-name">${d.nama}</td>
      <td class="td-mono">${d.hp}</td>
      <td style="font-size:12px">${d.alamat||'-'}</td>
      <td style="font-size:12px">${d.program||'-'}</td>
      <td class="rupiah" style="font-weight:600;color:var(--danger)">${rupiah(d.nominal)}</td>
      <td style="font-size:12px">${d.petugas||'-'}</td>
      <td class="no-print">
        <a href="donatur-rutin.html" class="btn btn-ghost btn-sm">📞 Hubungi</a>
      </td>
    </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--success)">🎉 Semua donatur sudah membayar!</td></tr>`;

  document.getElementById('footBelum').innerHTML = belum.length ? `
    <tr><td colspan="4" style="padding:10px 14px">TOTAL TUNGGAKAN</td>
      <td class="rupiah" style="padding:10px 14px;color:var(--danger)">${rupiah(totalBelum)}</td><td colspan="2"></td></tr>` : '';

  // Rekap bulanan
  renderRekap(tahun, program);
};

function renderRekap(tahun, program) {
  const donaturAktif = DB.get('donatur_rutin').filter(d =>
    d.status === 'aktif' && (!program || d.program === program)
  );
  const targetPerBulan = donaturAktif.reduce((s,d) => s+(+d.nominal||0), 0);
  const bayarAll = DB.get('pembayaran_rutin');

  document.getElementById('tblRekap').innerHTML = BULAN_NAMA.map((nama, idx) => {
    const mb = String(idx+1).padStart(2,'0');
    const periode = `${tahun}-${mb}`;
    const bayarBulan = bayarAll.filter(p => p.tgl_bayar?.startsWith(periode));
    const sudahIds = new Set(bayarBulan.map(p => p.donatur_id));
    const sudahCount = donaturAktif.filter(d => sudahIds.has(d.id)).length;
    const belumCount = donaturAktif.length - sudahCount;
    const total = bayarBulan.reduce((s,p) => s+(+p.nominal||0), 0);
    const pct = targetPerBulan ? Math.round((total/targetPerBulan)*100) : 0;
    const isNow = new Date().getMonth() === idx && String(new Date().getFullYear()) === tahun;

    return `<tr style="${isNow?'background:#f0fdf4;font-weight:600':''}">
      <td>${nama} ${tahun}${isNow?' 🔵':''}</td>
      <td style="color:var(--success);font-weight:600">${sudahCount} donatur</td>
      <td style="color:${belumCount?'var(--danger)':'var(--gray-400)'}">${belumCount} donatur</td>
      <td class="rupiah" style="font-weight:700">${total ? rupiah(total) : '<span style="color:var(--gray-300)">—</span>'}</td>
      <td class="rupiah" style="color:var(--gray-500)">${rupiah(targetPerBulan)}</td>
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
  const bulan = document.getElementById('flBulan').value;
  const tahun = document.getElementById('flTahun').value;
  const periode = `${tahun}-${bulan}`;
  const donaturAktif = DB.get('donatur_rutin').filter(d => d.status === 'aktif');
  const bayarBulanIni = DB.get('pembayaran_rutin').filter(p => p.tgl_bayar?.startsWith(periode));
  const sudahIds = new Set(bayarBulanIni.map(p => p.donatur_id));

  const rows = donaturAktif.map(d => ({
    nama: d.nama, hp: d.hp, alamat: d.alamat||'', kota: d.kota||'',
    program: d.program||'', nominal_rutin: d.nominal,
    status_bulan_ini: sudahIds.has(d.id) ? 'Sudah Bayar' : 'Belum Bayar',
    tgl_bayar: bayarBulanIni.find(p=>p.donatur_id===d.id)?.tgl_bayar||'',
    nominal_bayar: bayarBulanIni.filter(p=>p.donatur_id===d.id).reduce((s,p)=>s+(+p.nominal||0),0)||'',
    petugas: d.petugas||''
  }));
  exportExcel(rows, `LaporanDonatur_${BULAN_NAMA[+bulan-1]}_${tahun}`, 'Donatur Rutin');
};
