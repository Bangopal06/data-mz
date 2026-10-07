// =============================================
// DONATUR RUTIN — Supabase version
// =============================================

let pgSemua=1, pgAktif=1, pgProspek=1, pgBayar=1;
const PS = 15;

document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  initTabs('drTabs', (target) => {
    if (target==='paneSemua') loadSemua();
    else if (target==='paneAktif') loadAktif();
    else if (target==='paneProspek') loadProspek();
    else if (target==='panePembayaran') loadBayar();
  });
  loadStats(); loadSemua(); loadAktif(); loadProspek(); loadBayar(); loadProgramFilter();

  document.getElementById('btnTambah')?.addEventListener('click', () => {
    const t = document.querySelector('#drTabs .tab.active')?.dataset.target;
    if (t==='paneProspek') openModalProspek();
    else if (t==='panePembayaran') openModalBayar();
    else openModalDonatur();
  });
  document.getElementById('srSemua')?.addEventListener('input', ()=>{pgSemua=1;loadSemua();});
  document.getElementById('flSemuaStatus')?.addEventListener('change', ()=>{pgSemua=1;loadSemua();});
  document.getElementById('flSemuaProgram')?.addEventListener('change', ()=>{pgSemua=1;loadSemua();});
  document.getElementById('srAktif')?.addEventListener('input', ()=>{pgAktif=1;loadAktif();});
  document.getElementById('flProgram')?.addEventListener('change', ()=>{pgAktif=1;loadAktif();});
  document.getElementById('srProspek')?.addEventListener('input', ()=>{pgProspek=1;loadProspek();});
  document.getElementById('flProspekStatus')?.addEventListener('change', ()=>{pgProspek=1;loadProspek();});
  document.getElementById('srBayar')?.addEventListener('input', ()=>{pgBayar=1;loadBayar();});
  document.getElementById('flBulan')?.addEventListener('change', ()=>{pgBayar=1;loadBayar();});
});

async function loadAllData() {
  await Promise.all([
    DB.sync('donatur_rutin'),
    DB.sync('prospek_rutin'),
    DB.sync('pembayaran_rutin')
  ]);
}

function loadStats() {
  const dr=DB.get('donatur_rutin'), pr=DB.get('prospek_rutin');
  const total=dr.filter(d=>d.status==='aktif').reduce((s,d)=>s+(+d.nominal||0),0);
  const el=document.getElementById('drStats'); if(!el) return;
  el.innerHTML=`
    <div class="stat"><div class="stat-ico ic-green">💚</div><div class="stat-body"><div class="lbl">Donatur Aktif</div><div class="val">${dr.filter(d=>d.status==='aktif').length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">👤</div><div class="stat-body"><div class="lbl">Total Prospek</div><div class="val">${pr.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-red">⚠️</div><div class="stat-body"><div class="lbl">Tidak Aktif</div><div class="val">${dr.filter(d=>d.status!=='aktif').length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-teal">💰</div><div class="stat-body"><div class="lbl">Total Donasi/Bulan</div><div class="val rupiah" style="font-size:15px">${rupiah(total)}</div></div></div>`;
}

function loadProgramFilter() {
  const progs=[...new Set(DB.get('donatur_rutin').map(d=>d.program).filter(Boolean))];
  ['flProgram','flSemuaProgram'].forEach(id=>{
    const s=document.getElementById(id);
    if(s) s.innerHTML='<option value="">Semua Program</option>'+progs.map(p=>`<option>${p}</option>`).join('');
  });
}

function loadSemua() {
  const donatur=DB.get('donatur_rutin').map(d=>({...d,_type:'donatur'}));
  const prospek=DB.get('prospek_rutin').map(p=>({...p,_type:'calon',status:'calon',nominal:p.nominal_potensi||0}));
  let data=[...donatur,...prospek].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const sr=document.getElementById('srSemua')?.value.toLowerCase()||'';
  const st=document.getElementById('flSemuaStatus')?.value||'';
  const prog=document.getElementById('flSemuaProgram')?.value||'';
  if(sr) data=data.filter(d=>d.nama?.toLowerCase().includes(sr));
  if(st) data=data.filter(d=>d.status===st);
  if(prog) data=data.filter(d=>d.program===prog);
  const cnt=document.getElementById('cntSemua'); if(cnt) cnt.textContent=data.length;
  const {items,total}=paginate(data,pgSemua,PS);
  const tbody=document.getElementById('tblSemua'); if(!tbody) return;
  tbody.innerHTML=items.length?items.map(d=>`<tr>
    <td class="td-name">${d.nama}</td><td class="td-mono">${d.hp||'-'}</td>
    <td style="font-size:12px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.alamat||'-'}</td>
    <td style="font-size:12px">${d.kota||'-'}</td>
    <td style="font-size:12px">${d.program||'-'}</td>
    <td class="rupiah" style="font-weight:600;color:${d._type==='donatur'?'var(--success)':'var(--gray-400)'}">
      ${d._type==='donatur'?rupiah(d.nominal):'-'}</td>
    <td><span class="badge ${d._type==='donatur'?'b-green':'b-blue'}">${d._type==='donatur'?'Donatur':'Calon'}</span></td>
    <td>${badge(d.status)}</td>
    <td style="font-size:12px">${d.petugas||'-'}</td>
    <td><div class="td-actions">
      ${d._type==='donatur'?`
        <button class="btn btn-ghost btn-sm btn-icon" onclick="detailDonatur('${d.id}')">👁</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalBayar('${d.id}')">💰</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalDonatur('${d.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusDonatur('${d.id}')">🗑️</button>`:`
        <button class="btn btn-success btn-sm" onclick="jadikanDonatur('${d.id}')">✓ Aktifkan</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalProspek('${d.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusProspek('${d.id}')">🗑️</button>`}
    </div></td></tr>`).join('')
  :`<tr><td colspan="10"><div class="empty"><div class="ei">📋</div><div class="et">Belum ada data</div></div></td></tr>`;
  renderPagination('pagSemua',total,pgSemua,PS,'goPgSemua');
}
window.goPgSemua=p=>{pgSemua=p;loadSemua();};

function loadAktif() {
  let data=DB.get('donatur_rutin').filter(d=>d.status==='aktif');
  const sr=document.getElementById('srAktif')?.value.toLowerCase()||'';
  const prog=document.getElementById('flProgram')?.value||'';
  if(sr) data=data.filter(d=>d.nama?.toLowerCase().includes(sr));
  if(prog) data=data.filter(d=>d.program===prog);
  const cnt=document.getElementById('cntAktif'); if(cnt) cnt.textContent=DB.get('donatur_rutin').filter(d=>d.status==='aktif').length;
  const {items,total}=paginate(data,pgAktif,PS);
  const tbody=document.getElementById('tblAktif'); if(!tbody) return;
  tbody.innerHTML=items.length?items.map(d=>`<tr>
    <td class="td-name">${d.nama}</td><td class="td-mono">${d.hp||'-'}</td>
    <td style="font-size:12px">${d.program||'-'}</td>
    <td class="rupiah" style="font-weight:600;color:var(--success)">${rupiah(d.nominal)}</td>
    <td style="font-size:12px">${d.metode||'-'}</td>
    <td style="font-size:12px">${tgl(d.tgl_mulai)}</td>
    <td>${badge(d.status)}</td>
    <td><div class="td-actions">
      <button class="btn btn-ghost btn-sm btn-icon" onclick="detailDonatur('${d.id}')">👁</button>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalBayar('${d.id}')">💰</button>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalDonatur('${d.id}')">✏️</button>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusDonatur('${d.id}')">🗑️</button>
    </div></td></tr>`).join('')
  :`<tr><td colspan="8"><div class="empty"><div class="ei">💚</div><div class="et">Belum ada donatur aktif</div></div></td></tr>`;
  renderPagination('pagAktif',total,pgAktif,PS,'goPgAktif');
}
window.goPgAktif=p=>{pgAktif=p;loadAktif();};

function loadProspek() {
  let data=DB.get('prospek_rutin');
  const sr=document.getElementById('srProspek')?.value.toLowerCase()||'';
  const st=document.getElementById('flProspekStatus')?.value||'';
  if(sr) data=data.filter(d=>d.nama?.toLowerCase().includes(sr));
  if(st) data=data.filter(d=>d.status===st);
  const cnt=document.getElementById('cntProspek'); if(cnt) cnt.textContent=data.length;
  const {items,total}=paginate(data,pgProspek,PS);
  const tbody=document.getElementById('tblProspek'); if(!tbody) return;
  tbody.innerHTML=items.length?items.map(d=>`<tr>
    <td class="td-name">${d.nama}</td><td class="td-mono">${d.hp||'-'}</td>
    <td style="font-size:12px">${d.alamat||'-'}</td>
    <td style="font-size:12px">${d.kota||'-'}</td>
    <td>${badge(d.status)}</td>
    <td style="font-size:12px">${d.petugas||'-'}</td>
    <td style="font-size:12px;color:var(--gray-500);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.catatan||'-'}</td>
    <td><div class="td-actions">
      <button class="btn btn-success btn-sm" onclick="jadikanDonatur('${d.id}')">✓ Aktifkan</button>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalProspek('${d.id}')">✏️</button>
      <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusProspek('${d.id}')">🗑️</button>
    </div></td></tr>`).join('')
  :`<tr><td colspan="8"><div class="empty"><div class="ei">👤</div><div class="et">Belum ada calon donatur</div></div></td></tr>`;
  renderPagination('pagProspek',total,pgProspek,PS,'goPgProspek');
}
window.goPgProspek=p=>{pgProspek=p;loadProspek();};

function loadBayar() {
  let data=DB.get('pembayaran_rutin');
  const sr=document.getElementById('srBayar')?.value.toLowerCase()||'';
  const bulan=document.getElementById('flBulan')?.value||'';
  if(sr) data=data.filter(d=>d.nama_donatur?.toLowerCase().includes(sr));
  if(bulan) data=data.filter(d=>d.tgl_bayar?.startsWith(bulan));
  data.sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  const cnt=document.getElementById('cntBayar'); if(cnt) cnt.textContent=data.length;
  const {items,total}=paginate(data,pgBayar,PS);
  const tbody=document.getElementById('tblBayar'); if(!tbody) return;
  tbody.innerHTML=items.length?items.map(d=>`<tr>
    <td class="td-name">${d.nama_donatur||'-'}</td>
    <td style="font-size:12px">${tgl(d.tgl_bayar)}</td>
    <td class="rupiah" style="font-weight:600;color:var(--success)">${rupiah(d.nominal)}</td>
    <td style="font-size:12px">${d.metode||'-'}</td>
    <td style="font-size:12px">${d.petugas||'-'}</td>
    <td style="font-size:12px;color:var(--gray-500)">${d.catatan||'-'}</td>
    <td><button class="btn btn-ghost btn-sm btn-icon" onclick="hapusBayar('${d.id}')">🗑️</button></td></tr>`).join('')
  :`<tr><td colspan="7"><div class="empty"><div class="ei">💰</div><div class="et">Belum ada pembayaran</div></div></td></tr>`;
  renderPagination('pagBayar',total,pgBayar,PS,'goPgBayar');
}
window.goPgBayar=p=>{pgBayar=p;loadBayar();};

// ---- MODAL DONATUR ----
window.openModalDonatur=function(id=null){
  const d=id?DB.get('donatur_rutin').find(x=>x.id===id):null;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovDonatur">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>${d?'Edit':'Tambah'} Donatur Rutin</h3><button class="modal-close" onclick="closeModal('ovDonatur')">✕</button></div>
      <div class="modal-body">
        <div class="sec-div">Data Pribadi</div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Nama *</label><input id="dNama" class="fctrl" value="${d?.nama||''}"></div>
          <div class="fg"><label class="flabel">No. HP *</label><input id="dHP" class="fctrl" value="${d?.hp||''}"></div>
          <div class="fg fcol2"><label class="flabel">Alamat</label><input id="dAlamat" class="fctrl" value="${d?.alamat||''}"></div>
          <div class="fg"><label class="flabel">Kota</label><input id="dKota" class="fctrl" value="${d?.kota||''}"></div>
          <div class="fg"><label class="flabel">Petugas</label><input id="dPetugas" class="fctrl" value="${d?.petugas||''}"></div>
        </div>
        <div class="sec-div">Data Donasi</div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Program</label>
            <input id="dProgram" class="fctrl" list="progList" value="${d?.program||''}">
            <datalist id="progList"><option>Beasiswa Anak Yatim</option><option>Pangan & Gizi</option><option>Kesehatan Masyarakat</option><option>Pemberdayaan Ekonomi</option><option>Rumah Tahfidz</option></datalist>
          </div>
          <div class="fg"><label class="flabel">Nominal/Bulan (Rp) *</label><input type="number" id="dNominal" class="fctrl" value="${d?.nominal||''}"></div>
          <div class="fg"><label class="flabel">Metode</label>
            <select id="dMetode" class="fctrl">${['transfer','tunai','qris','auto_debit'].map(m=>`<option value="${m}" ${d?.metode===m?'selected':''}>${m}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Tgl Mulai</label><input type="date" id="dMulai" class="fctrl" value="${tglInput(d?.tgl_mulai)||new Date().toISOString().split('T')[0]}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="dStatus" class="fctrl">${['aktif','tidak_aktif','berhenti'].map(s=>`<option value="${s}" ${d?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="dCatatan" class="fctrl">${d?.catatan||''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovDonatur')">Batal</button>
        <button class="btn btn-primary" onclick="saveDonatur('${id||''}')">Simpan</button>
      </div>
    </div></div>`);
};

window.saveDonatur=async function(id){
  const nama=document.getElementById('dNama').value.trim();
  const hp=document.getElementById('dHP').value.trim();
  const nominal=+document.getElementById('dNominal').value;
  if(!nama||!hp||!nominal){toast('Nama, HP, dan nominal wajib diisi','warn');return;}
  if(!await confirmSave(`Simpan donatur <strong>${nama}</strong>?`)) return;
  const payload={nama,hp,alamat:document.getElementById('dAlamat').value.trim(),
    kota:document.getElementById('dKota').value.trim(),petugas:document.getElementById('dPetugas').value.trim(),
    program:document.getElementById('dProgram').value.trim(),nominal,metode:document.getElementById('dMetode').value,
    tgl_mulai:document.getElementById('dMulai').value,status:document.getElementById('dStatus').value,
    catatan:document.getElementById('dCatatan').value.trim()};
  const r=id?await DB.update('donatur_rutin',id,payload):await DB.insert('donatur_rutin',payload);
  if(!r){toast('Gagal menyimpan','err');return;}
  await DB.sync('donatur_rutin');
  toast(id?'Data diperbarui':'Donatur ditambahkan','ok');
  closeModal('ovDonatur');loadStats();loadSemua();loadAktif();loadProgramFilter();
};

window.hapusDonatur=async function(id){
  if(!await confirmDel()) return;
  if(!await DB.delete('donatur_rutin',id)){toast('Gagal menghapus','err');return;}
  await DB.sync('donatur_rutin');
  toast('Dihapus','ok');loadStats();loadSemua();loadAktif();
};

// ---- DETAIL ----
window.detailDonatur=function(id){
  const d=DB.get('donatur_rutin').find(x=>x.id===id); if(!d) return;
  const bayar=DB.get('pembayaran_rutin').filter(p=>p.donatur_id===id).sort((a,b)=>new Date(b.tgl_bayar)-new Date(a.tgl_bayar));
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovDetail">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>Detail: ${d.nama}</h3><button class="modal-close" onclick="closeModal('ovDetail')">✕</button></div>
      <div class="modal-body">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--gray-100)">
          <div style="width:46px;height:46px;border-radius:50%;background:var(--success);color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800">${d.nama[0]}</div>
          <div><div style="font-size:16px;font-weight:800">${d.nama}</div><div style="font-size:13px;color:var(--gray-500)">${d.hp||'-'}</div></div>
          <div style="margin-left:auto;text-align:right"><div style="font-size:11px;color:var(--gray-400)">Donasi/Bulan</div><div class="rupiah" style="font-size:18px;font-weight:800;color:var(--success)">${rupiah(d.nominal)}</div></div>
        </div>
        <div class="detail-grid" style="margin-bottom:14px">
          <div class="detail-item"><div class="dl">Program</div><div class="dv">${d.program||'-'}</div></div>
          <div class="detail-item"><div class="dl">Metode</div><div class="dv">${d.metode||'-'}</div></div>
          <div class="detail-item"><div class="dl">Mulai</div><div class="dv">${tgl(d.tgl_mulai)}</div></div>
          <div class="detail-item"><div class="dl">Petugas</div><div class="dv">${d.petugas||'-'}</div></div>
          <div class="detail-item"><div class="dl">Alamat</div><div class="dv">${d.alamat||'-'}</div></div>
          <div class="detail-item"><div class="dl">Kota</div><div class="dv">${d.kota||'-'}</div></div>
        </div>
        <div style="font-weight:700;font-size:13px;margin-bottom:10px">💰 Riwayat Bayar (${bayar.length})</div>
        ${bayar.length?bayar.map(p=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--gray-100);font-size:13px">
          <div><span style="font-weight:600">${tgl(p.tgl_bayar)}</span><span style="color:var(--gray-400);margin-left:8px">${p.metode||''} ${p.petugas?'· '+p.petugas:''}</span></div>
          <span class="rupiah" style="font-weight:700;color:var(--success)">${rupiah(p.nominal)}</span>
        </div>`).join(''):'<div class="text-muted text-sm">Belum ada pembayaran</div>'}
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovDetail')">Tutup</button>
        <button class="btn btn-primary" onclick="closeModal('ovDetail');openModalBayar('${id}')">💰 Catat Bayar</button>
      </div>
    </div></div>`);
};

// ---- CATAT BAYAR ----
window.openModalBayar=function(donaturId=null){
  const dr=DB.get('donatur_rutin').filter(d=>d.status==='aktif');
  const sel=dr.find(d=>d.id===donaturId);
  const opsi=dr.map(d=>`<option value="${d.id}" ${d.id===donaturId?'selected':''}>${d.nama} — ${rupiah(d.nominal)}/bln</option>`).join('');
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovBayar">
    <div class="modal" style="max-width:500px">
      <div class="modal-head"><h3>💰 Catat Pembayaran</h3><button class="modal-close" onclick="closeModal('ovBayar')">✕</button></div>
      <div class="modal-body">
        <div class="fg" style="margin-bottom:16px"><label class="flabel">Donatur *</label>
          <select id="bDonatur" class="fctrl" onchange="onPilihDonatur(this)"><option value="">-- Pilih --</option>${opsi}</select>
        </div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Tanggal *</label><input type="date" id="bTgl" class="fctrl" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="fg"><label class="flabel">Nominal (Rp) *</label><input type="number" id="bNominal" class="fctrl" value="${sel?.nominal||''}"></div>
          <div class="fg"><label class="flabel">Petugas</label><input id="bPetugas" class="fctrl" value="${sel?.petugas||''}"></div>
          <div class="fg"><label class="flabel">Catatan</label><input id="bCatatan" class="fctrl" placeholder="Opsional"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovBayar')">Batal</button>
        <button class="btn btn-success" onclick="saveBayar()">Simpan</button>
      </div>
    </div></div>`);
};

window.onPilihDonatur=function(sel){
  const d=DB.get('donatur_rutin').find(x=>x.id===sel.value); if(!d) return;
  const n=document.getElementById('bNominal'); if(n) n.value=d.nominal||'';
  const p=document.getElementById('bPetugas'); if(p&&!p.value) p.value=d.petugas||'';
};

window.saveBayar=async function(){
  const donaturId=document.getElementById('bDonatur').value;
  const tglBayar=document.getElementById('bTgl').value;
  const nominal=+document.getElementById('bNominal').value;
  if(!donaturId||!tglBayar||!nominal){toast('Semua field wajib diisi','warn');return;}
  const donatur=DB.get('donatur_rutin').find(d=>d.id===donaturId);
  if(!await confirmSave(`Catat pembayaran <strong>${rupiah(nominal)}</strong> untuk <strong>${donatur?.nama}</strong>?`)) return;
  const r=await DB.insert('pembayaran_rutin',{donatur_id:donaturId,nama_donatur:donatur?.nama,
    nominal,tgl_bayar:tglBayar,metode:donatur?.metode||'transfer',
    petugas:document.getElementById('bPetugas').value.trim(),
    catatan:document.getElementById('bCatatan').value.trim()});
  if(!r){toast('Gagal menyimpan','err');return;}
  await DB.sync('pembayaran_rutin');
  toast('Pembayaran dicatat','ok');closeModal('ovBayar');loadBayar();
};

window.hapusBayar=async function(id){
  if(!await confirmDel('Hapus riwayat pembayaran?')) return;
  await DB.delete('pembayaran_rutin',id);
  await DB.sync('pembayaran_rutin');
  toast('Dihapus','ok');loadBayar();
};

// ---- PROSPEK ----
window.openModalProspek=function(id=null){
  const d=id?DB.get('prospek_rutin').find(x=>x.id===id):null;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovProspek">
    <div class="modal"><div class="modal-head"><h3>${d?'Edit':'Tambah'} Calon Donatur</h3><button class="modal-close" onclick="closeModal('ovProspek')">✕</button></div>
      <div class="modal-body"><div class="fgrid">
        <div class="fg"><label class="flabel">Nama *</label><input id="pNama" class="fctrl" value="${d?.nama||''}"></div>
        <div class="fg"><label class="flabel">No. HP *</label><input id="pHP" class="fctrl" value="${d?.hp||''}"></div>
        <div class="fg"><label class="flabel">Alamat</label><input id="pAlamat" class="fctrl" value="${d?.alamat||''}"></div>
        <div class="fg"><label class="flabel">Kota</label><input id="pKota" class="fctrl" value="${d?.kota||''}"></div>
        <div class="fg"><label class="flabel">Potensi Donasi (Rp)</label><input type="number" id="pPotensi" class="fctrl" value="${d?.nominal_potensi||''}"></div>
        <div class="fg"><label class="flabel">Status</label>
          <select id="pStatus" class="fctrl">${['baru','dihubungi','survei'].map(s=>`<option value="${s}" ${d?.status===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
        <div class="fg"><label class="flabel">Petugas</label><input id="pPetugas" class="fctrl" value="${d?.petugas||''}"></div>
        <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="pCatatan" class="fctrl">${d?.catatan||''}</textarea></div>
      </div></div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovProspek')">Batal</button>
        <button class="btn btn-primary" onclick="saveProspek('${id||''}')">Simpan</button>
      </div>
    </div></div>`);
};

window.saveProspek=async function(id){
  const nama=document.getElementById('pNama').value.trim();
  const hp=document.getElementById('pHP').value.trim();
  if(!nama||!hp){toast('Nama dan HP wajib diisi','warn');return;}
  if(!await confirmSave(`Simpan calon donatur <strong>${nama}</strong>?`)) return;
  const payload={nama,hp,alamat:document.getElementById('pAlamat').value.trim(),
    kota:document.getElementById('pKota').value.trim(),
    nominal_potensi:+document.getElementById('pPotensi').value||0,
    status:document.getElementById('pStatus').value,
    petugas:document.getElementById('pPetugas').value.trim(),
    catatan:document.getElementById('pCatatan').value.trim()};
  const r=id?await DB.update('prospek_rutin',id,payload):await DB.insert('prospek_rutin',payload);
  if(!r){toast('Gagal menyimpan','err');return;}
  await DB.sync('prospek_rutin');
  toast('Data calon donatur tersimpan','ok');closeModal('ovProspek');loadStats();loadProspek();loadSemua();
};

window.hapusProspek=async function(id){
  if(!await confirmDel()) return;
  await DB.delete('prospek_rutin',id);
  await DB.sync('prospek_rutin');
  toast('Dihapus','ok');loadStats();loadProspek();loadSemua();
};

window.jadikanDonatur=async function(id){
  const p=DB.get('prospek_rutin').find(x=>x.id===id); if(!p) return;
  if(!await confirmAction('✅','Jadikan Donatur Aktif?',`<strong>${p.nama}</strong> akan dipindahkan menjadi donatur aktif.`,'Ya, Aktifkan','btn-success')) return;
  const r=await DB.insert('donatur_rutin',{nama:p.nama,hp:p.hp,alamat:p.alamat||'',kota:p.kota||'',
    petugas:p.petugas||'',program:'',nominal:p.nominal_potensi||0,metode:'transfer',
    tgl_mulai:new Date().toISOString().split('T')[0],status:'aktif',catatan:p.catatan||''});
  if(!r){toast('Gagal','err');return;}
  await DB.delete('prospek_rutin',id);
  await Promise.all([DB.sync('donatur_rutin'),DB.sync('prospek_rutin')]);
  toast(`${p.nama} jadi donatur aktif!`,'ok');loadStats();loadSemua();loadAktif();loadProspek();
};

// ---- EXPORT ----
function exportDR(){
  exportExcel(DB.get('donatur_rutin').map(d=>({nama:d.nama,hp:d.hp||'',alamat:d.alamat||'',
    kota:d.kota||'',program:d.program||'',nominal_per_bulan:d.nominal,
    metode:d.metode||'',tgl_mulai:d.tgl_mulai||'',status:d.status||'',petugas:d.petugas||''})),
    'DonaturRutin','Donatur Rutin');
}

// ---- IMPORT ----
window.triggerImport=function(){
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="ovImport">
    <div class="modal" style="max-width:460px">
      <div class="modal-head"><h3>⬆️ Import Excel/CSV</h3><button class="modal-close" onclick="closeModal('ovImport')">✕</button></div>
      <div class="modal-body">
        <div class="fg mb3"><label class="flabel">Masukkan sebagai *</label>
          <select id="importType" class="fctrl"><option value="donatur_rutin">Donatur Aktif</option><option value="prospek_rutin">Calon Donatur</option></select>
        </div>
        <div onclick="document.getElementById('impFile').click()"
          style="border:2px dashed var(--gray-300);border-radius:10px;padding:28px;text-align:center;cursor:pointer;background:var(--gray-50)"
          ondragover="event.preventDefault()" ondrop="event.preventDefault();handleImpDrop(event)">
          <div style="font-size:32px;margin-bottom:6px">📂</div>
          <div style="font-weight:700">Klik atau drag & drop</div>
          <div style="font-size:12px;color:var(--gray-400)">.xlsx .xls .csv</div>
        </div>
        <input type="file" id="impFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="handleImpFile(this.files[0])">
        <div id="impProg" style="display:none;margin-top:12px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovImport')">Batal</button>
        <button class="btn btn-outline btn-sm" onclick="downloadImportTemplate()">⬇️ Template</button>
      </div>
    </div></div>`);
};

window.handleImpDrop=e=>{const f=e.dataTransfer.files[0];if(f)handleImpFile(f);};

window.handleImpFile=function(file){
  if(!file) return;
  const prog=document.getElementById('impProg');
  if(prog){prog.style.display='block';prog.innerHTML=`<div style="color:var(--primary);font-size:13px">⏳ Membaca ${file.name}...</div>`;}
  const ext=file.name.split('.').pop().toLowerCase();
  const reader=new FileReader();
  const parse=async csv=>{
    const lines=csv.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<2) return;
    const headers=lines[0].split(/,|\t/).map(h=>h.replace(/^"|"$/g,'').trim().toLowerCase().replace(/\s+/g,'_'));
    const rows=lines.slice(1).map(line=>{
      const vals=[]; let inQ=false,cur='';
      for(const ch of line){if(ch==='"') inQ=!inQ; else if((ch===','||ch==='\t')&&!inQ){vals.push(cur.trim());cur='';}else cur+=ch;}
      vals.push(cur.trim());
      const obj={}; headers.forEach((h,i)=>obj[h]=(vals[i]||'').replace(/^"|"$/g,'').trim()); return obj;
    }).filter(r=>r.nama);
    const type=document.getElementById('importType')?.value||'donatur_rutin';
    let ok=0,gagal=0;
    for(const row of rows){
      const payload={nama:row.nama,hp:row.hp||'',alamat:row.alamat||'',kota:row.kota||'',
        program:row.program||'',nominal:parseInt((row.nominal||'0').replace(/[^0-9]/g,''))||0,
        metode:row.metode||'transfer',tgl_mulai:row.tgl_mulai||new Date().toISOString().split('T')[0],
        status:type==='donatur_rutin'?'aktif':'baru',
        nominal_potensi:parseInt((row.nominal||'0').replace(/[^0-9]/g,''))||0,
        petugas:row.petugas||'',catatan:row.catatan||''};
      const r=await DB.insert(type,payload);
      if(r) ok++; else gagal++;
    }
    await DB.sync(type);
    if(prog) prog.innerHTML=`<div style="background:var(--success-light);border-radius:8px;padding:12px;color:var(--success)">
      ✅ <strong>${ok}</strong> berhasil · <strong>${gagal}</strong> gagal</div>`;
    loadStats();loadSemua();loadAktif();loadProspek();
    toast(`Import selesai: ${ok} data masuk`,'ok');
  };
  if(ext==='csv'){reader.onload=e=>parse(e.target.result);reader.readAsText(file,'UTF-8');}
  else{reader.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array'});parse(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]));}catch(err){if(prog)prog.innerHTML=`<div style="color:var(--danger)">❌ ${err.message}</div>`;}}; reader.readAsArrayBuffer(file);}
};

window.downloadImportTemplate=function(){
  const type=document.getElementById('importType')?.value||'donatur_rutin';
  const isDonatur=type==='donatur_rutin';
  buildTemplateExcel(isDonatur?'Template Import Donatur Rutin':'Template Import Calon Donatur',
    isDonatur?['Nama Lengkap','No. HP','Alamat','Kota','Program Donasi','Nominal/Bulan','Metode','Tgl Mulai','Petugas','Catatan']:['Nama Lengkap','No. HP','Alamat','Kota','Potensi Donasi','Petugas','Catatan'],
    isDonatur?['nama','hp','alamat','kota','program','nominal','metode','tgl_mulai','petugas','catatan']:['nama','hp','alamat','kota','nominal_potensi','petugas','catatan'],
    isDonatur?[['Budi Santoso','081234567890','Jl. Merdeka No.1','Jakarta','Beasiswa Anak Yatim','500000','transfer','2026-01-01','Ahmad','']]:
    [['Siti Rahayu','082345678901','Jl. Sudirman','Bandung','300000','Budi','']],type);
};
