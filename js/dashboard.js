document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
});

function renderDashboard() {
  const dr = DB.get('donatur_rutin');
  const pr = DB.get('prospek_rutin');
  const ki = DB.get('kotak_infaq');
  const kcs = DB.get('kcs_data');
  const dw = DB.get('donatur_waqaf');
  const wp = DB.get('waqaf_program');
  const bayar = DB.get('pembayaran_rutin');
  const ambilKI = DB.get('pengambilan_kotak');
  const ambilKCS = DB.get('kcs_pengambilan');

  // Hitung semua pendapatan
  const totalDonasi = dr.filter(d=>d.status==='aktif').reduce((s,d)=>s+(+d.nominal||0),0);
  const totalKI = ki.filter(k=>k.status==='aktif').reduce((s,k)=>s+(+k.nominal_terakhir||0),0);
  const totalKCS = kcs.filter(k=>k.status==='aktif').reduce((s,k)=>s+(+k.nominal_terakhir||0),0);
  const totalWaqaf = dw.reduce((s,d)=>s+(+d.nominal||0),0);
  const totalSemua = totalDonasi + totalKI + totalKCS + totalWaqaf;

  // Bulan ini
  const bulanIni = new Date().toISOString().slice(0,7);
  const bayarBulanIni = bayar.filter(p=>p.tgl_bayar?.startsWith(bulanIni)).reduce((s,p)=>s+(+p.nominal||0),0);
  const ambilKIBulanIni = ambilKI.filter(a=>a.tgl_ambil?.startsWith(bulanIni)).reduce((s,a)=>s+(+a.nominal||0),0);
  const ambilKCSBulanIni = ambilKCS.filter(a=>a.tgl_ambil?.startsWith(bulanIni)).reduce((s,a)=>s+(+a.nominal||0),0);
  const totalBulanIni = bayarBulanIni + ambilKIBulanIni + ambilKCSBulanIni;

  const bulanLabel = new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'});

  document.getElementById('dashContent').innerHTML = `

    <!-- TOTAL PENDAPATAN - highlight utama -->
    <div style="background:linear-gradient(135deg,#1a56db,#6c2bd9);border-radius:14px;padding:24px 28px;margin-bottom:24px;color:white;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
      <div>
        <div style="font-size:13px;opacity:.8;margin-bottom:6px">💰 Total Pendapatan Keseluruhan</div>
        <div style="font-size:32px;font-weight:900;letter-spacing:-1px">${rupiah(totalSemua)}</div>
        <div style="font-size:12px;opacity:.7;margin-top:6px">Donatur Rutin + Kotak Infaq + KCS + Waqaf</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;opacity:.7;margin-bottom:4px">Bulan Ini (${bulanLabel})</div>
        <div style="font-size:22px;font-weight:800">${rupiah(totalBulanIni)}</div>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:flex-end">
          <span style="background:rgba(255,255,255,.15);border-radius:20px;padding:3px 10px;font-size:11px">Donasi: ${rupiah(bayarBulanIni)}</span>
          <span style="background:rgba(255,255,255,.15);border-radius:20px;padding:3px 10px;font-size:11px">Kotak: ${rupiah(ambilKIBulanIni)}</span>
          <span style="background:rgba(255,255,255,.15);border-radius:20px;padding:3px 10px;font-size:11px">KCS: ${rupiah(ambilKCSBulanIni)}</span>
        </div>
      </div>
    </div>

    <!-- STAT CARDS -->
    <div class="stats" style="margin-bottom:24px">
      <div class="stat" style="cursor:pointer" onclick="location='donatur-rutin.html'">
        <div class="stat-ico ic-green">💚</div>
        <div class="stat-body">
          <div class="lbl">Donatur Rutin Aktif</div>
          <div class="val">${dr.filter(d=>d.status==='aktif').length}</div>
          <div class="sub rupiah">${rupiah(totalDonasi)}/bulan · ${pr.length} calon</div>
        </div>
      </div>
      <div class="stat" style="cursor:pointer" onclick="location='kotak-infaq.html'">
        <div class="stat-ico ic-orange">🗃️</div>
        <div class="stat-body">
          <div class="lbl">Kotak Infaq Aktif</div>
          <div class="val">${ki.filter(k=>k.status==='aktif').length}</div>
          <div class="sub rupiah">${rupiah(totalKI)} terakhir</div>
        </div>
      </div>
      <div class="stat" style="cursor:pointer" onclick="location='kcs.html'">
        <div class="stat-ico ic-blue">📦</div>
        <div class="stat-body">
          <div class="lbl">KCS Aktif</div>
          <div class="val">${kcs.filter(k=>k.status==='aktif').length}</div>
          <div class="sub rupiah">${rupiah(totalKCS)} terakhir</div>
        </div>
      </div>
      <div class="stat" style="cursor:pointer" onclick="location='waqaf.html'">
        <div class="stat-ico ic-purple">🕌</div>
        <div class="stat-body">
          <div class="lbl">Program Waqaf</div>
          <div class="val">${wp.length}</div>
          <div class="sub rupiah">${rupiah(totalWaqaf)} terkumpul · ${dw.length} donatur</div>
        </div>
      </div>
    </div>

    <!-- BARIS BAWAH: 3 kolom ringkas -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">

      <!-- Donatur Rutin Terbaru -->
      <div class="card">
        <div class="card-head">
          <div class="card-title">💚 Donatur Rutin Terbaru</div>
          <a href="donatur-rutin.html" class="btn btn-ghost btn-sm" style="font-size:11px">Lihat →</a>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Nominal</th><th>Status</th></tr></thead>
            <tbody>
              ${dr.slice(0,5).map(d=>`<tr>
                <td style="font-size:12px;font-weight:600">${d.nama}</td>
                <td class="rupiah" style="font-size:11px;color:var(--success)">${rupiah(d.nominal)}</td>
                <td>${badge(d.status)}</td>
              </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--gray-400);font-size:12px">Belum ada data</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Kotak Infaq & KCS -->
      <div class="card">
        <div class="card-head">
          <div class="card-title">🗃️ Kotak Infaq & KCS</div>
          <a href="kotak-infaq.html" class="btn btn-ghost btn-sm" style="font-size:11px">Lihat →</a>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>Toko</th><th>Tipe</th><th>Terakhir</th></tr></thead>
            <tbody>
              ${[...ki.filter(k=>k.status==='aktif').slice(0,3).map(k=>({...k,tipe:'KI'})),
                 ...kcs.filter(k=>k.status==='aktif').slice(0,2).map(k=>({...k,tipe:'KCS'}))]
                .map(k=>`<tr>
                  <td style="font-size:12px;font-weight:600;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${k.nama_toko}</td>
                  <td><span class="badge ${k.tipe==='KCS'?'b-blue':'b-orange'}" style="font-size:10px">${k.tipe}</span></td>
                  <td class="rupiah" style="font-size:11px;color:#f97316">${rupiah(k.nominal_terakhir)}</td>
                </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--gray-400);font-size:12px">Belum ada data</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Program Waqaf -->
      <div class="card">
        <div class="card-head">
          <div class="card-title">🕌 Program Waqaf</div>
          <a href="waqaf.html" class="btn btn-ghost btn-sm" style="font-size:11px">Lihat →</a>
        </div>
        ${wp.length ? wp.slice(0,3).map(w=>{
          const pct = Math.min(100,Math.round((w.terkumpul/w.target)*100));
          return `<div style="padding:10px 16px;border-bottom:1px solid var(--gray-100)">
            <div style="font-size:12px;font-weight:600;margin-bottom:4px">${w.nama}</div>
            <div style="height:5px;background:var(--gray-100);border-radius:3px;overflow:hidden;margin-bottom:4px">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:3px"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-400)">
              <span class="rupiah">${rupiah(w.terkumpul)}</span><span>${pct}% dari ${rupiah(w.target)}</span>
            </div>
          </div>`;
        }).join('') : '<div style="text-align:center;padding:24px;color:var(--gray-400);font-size:12px">Belum ada program waqaf</div>'}
      </div>

    </div>
  `;
}
