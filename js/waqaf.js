let pgProg=1, pgDonWQ=1, pgProsWQ=1;
const PS=12;

document.addEventListener('DOMContentLoaded', () => {
  initTabs('wqTabs', (target) => {
    if (target === 'paneProgram') loadProgram();
    else if (target === 'paneDonaturWQ') loadDonaturWQ();
    else if (target === 'paneProspekWQ') loadProspekWQ();
  });
  loadWqStats();
  loadProgram();
  loadDonaturWQ();
  loadProspekWQ();
  loadProgramFilter();

  document.getElementById('btnTambahWQ').addEventListener('click', () => {
    const tab = document.querySelector('#wqTabs .tab.active').dataset.target;
    if (tab === 'paneProgram') openModalProgram();
    else if (tab === 'paneDonaturWQ') openModalDonWQ();
    else openModalProsWQ();
  });

  ['srProg','flKatProg','flStProg'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { pgProg=1; loadProgram(); });
    document.getElementById(id)?.addEventListener('change', () => { pgProg=1; loadProgram(); });
  });
  ['srDonWQ','flProgDon','flStDon'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { pgDonWQ=1; loadDonaturWQ(); });
    document.getElementById(id)?.addEventListener('change', () => { pgDonWQ=1; loadDonaturWQ(); });
  });
  ['srProsWQ','flProgPros'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { pgProsWQ=1; loadProspekWQ(); });
    document.getElementById(id)?.addEventListener('change', () => { pgProsWQ=1; loadProspekWQ(); });
  });
});

function loadWqStats() {
  const wp = DB.get('waqaf_program');
  const dw = DB.get('donatur_waqaf');
  const pw = DB.get('prospek_waqaf');
  const totalTarget = wp.reduce((s,w)=>s+(+w.target||0),0);
  const totalTerkumpul = wp.reduce((s,w)=>s+(+w.terkumpul||0),0);
  const totalDonasi = dw.reduce((s,d)=>s+(+d.nominal||0),0);
  document.getElementById('wqStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-purple">🕌</div><div class="stat-body"><div class="lbl">Program Aktif</div><div class="val">${wp.filter(w=>w.status==='aktif').length}</div><div class="sub">${wp.length} total program</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">💚</div><div class="stat-body"><div class="lbl">Donatur Waqaf</div><div class="val">${dw.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-blue">👤</div><div class="stat-body"><div class="lbl">Prospek</div><div class="val">${pw.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-teal">🎯</div><div class="stat-body"><div class="lbl">Terkumpul</div><div class="val rupiah" style="font-size:14px">${rupiah(totalTerkumpul)}</div><div class="sub">Target: ${rupiah(totalTarget)}</div></div></div>
    <div class="stat"><div class="stat-ico ic-orange">💰</div><div class="stat-body"><div class="lbl">Total Donasi</div><div class="val rupiah" style="font-size:14px">${rupiah(totalDonasi)}</div></div></div>
  `;
}

function loadProgramFilter() {
  const wp = DB.get('waqaf_program');
  const opts = '<option value="">Semua Program</option>' + wp.map(w=>`<option value="${w.id}">${w.nama}</option>`).join('');
  document.getElementById('flProgDon').innerHTML = opts;
  document.getElementById('flProgPros').innerHTML = opts;
}

// ============ PROGRAM WAQAF ============
function loadProgram() {
  let data = DB.get('waqaf_program');
  const sr = document.getElementById('srProg').value.toLowerCase();
  const kat = document.getElementById('flKatProg').value;
  const st = document.getElementById('flStProg').value;
  if (sr) data = data.filter(w=>w.nama.toLowerCase().includes(sr));
  if (kat) data = data.filter(w=>w.kategori===kat);
  if (st) data = data.filter(w=>w.status===st);
  document.getElementById('cntProg').textContent = data.length;
  const { items, total } = paginate(data, pgProg, PS);

  document.getElementById('progGrid').innerHTML = items.length ? items.map(w => {
    const donaturCount = DB.get('donatur_waqaf').filter(d=>d.program_id===w.id).length;
    return `<div class="prog-card">
      <div class="pc-icon">${{masjid:'🕌',pendidikan:'📚',kesehatan:'🏥',sosial:'🤝'}[w.kategori]||'🌟'}</div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
        <div class="pc-name">${w.nama}</div>
        ${badge(w.status)}
      </div>
      <div class="pc-desc">${w.deskripsi||''}</div>
      ${progressBar(w.terkumpul, w.target)}
      <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        ${badge(w.kategori)}
        <span class="badge b-gray">${donaturCount} donatur</span>
        <span class="badge b-gray">s/d ${tgl(w.tgl_target)}</span>
      </div>
      <div class="pc-foot">
        <button class="btn btn-primary btn-sm" onclick="openModalDonWQ(null,'${w.id}')">+ Catat Donasi</button>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalProgram('${w.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusProgram('${w.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('') : `<div class="empty" style="grid-column:1/-1"><div class="ei">🕌</div><div class="et">Belum ada program waqaf</div></div>`;
  renderPagination('pagProg', total, pgProg, PS, 'goPgProg');
}
window.goPgProg = p => { pgProg=p; loadProgram(); };

window.openModalProgram = function(id=null) {
  const w = id ? DB.get('waqaf_program').find(x=>x.id===id) : null;
  const html = `<div class="overlay" id="ovProgram">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>${w?'Edit':'Tambah'} Program Waqaf</h3><button class="modal-close" onclick="closeModal('ovProgram')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Nama Program *</label><input id="wpNama" class="fctrl" value="${w?.nama||''}" placeholder="Nama program waqaf"></div>
          <div class="fg fcol2"><label class="flabel">Deskripsi</label><textarea id="wpDesc" class="fctrl">${w?.deskripsi||''}</textarea></div>
          <div class="fg"><label class="flabel">Kategori</label>
            <select id="wpKat" class="fctrl">${['masjid','pendidikan','kesehatan','sosial'].map(k=>`<option value="${k}" ${w?.kategori===k?'selected':''}>${k}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Target (Rp) *</label><input type="number" id="wpTarget" class="fctrl" value="${w?.target||''}"></div>
          <div class="fg"><label class="flabel">Terkumpul (Rp)</label><input type="number" id="wpTerkumpul" class="fctrl" value="${w?.terkumpul||0}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="wpStatus" class="fctrl">${['aktif','selesai','ditangguhkan'].map(s=>`<option value="${s}" ${w?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Tanggal Mulai</label><input type="date" id="wpMulai" class="fctrl" value="${tglInput(w?.tgl_mulai)||''}"></div>
          <div class="fg"><label class="flabel">Tanggal Target</label><input type="date" id="wpTarget2" class="fctrl" value="${tglInput(w?.tgl_target)||''}"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovProgram')">Batal</button>
        <button class="btn btn-primary" onclick="saveProgram('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveProgram = async function(id) {
  const nama = document.getElementById('wpNama').value.trim();
  const target = +document.getElementById('wpTarget').value;
  if (!nama || !target) { toast('Nama dan target wajib diisi','warn'); return; }
  const ok = await confirmSave(`Simpan program waqaf <strong>${nama}</strong>?`);
  if (!ok) return;
  const data = DB.get('waqaf_program');
  const payload = { id:id||uid(), nama, deskripsi:document.getElementById('wpDesc').value.trim(), kategori:document.getElementById('wpKat').value, target, terkumpul:+document.getElementById('wpTerkumpul').value||0, status:document.getElementById('wpStatus').value, tgl_mulai:document.getElementById('wpMulai').value||null, tgl_target:document.getElementById('wpTarget2').value||null, created_at:id?(data.find(x=>x.id===id)?.created_at||new Date().toISOString()):new Date().toISOString() };
  if (id) { const i=data.findIndex(x=>x.id===id); data[i]=payload; } else data.unshift(payload);
  DB.set('waqaf_program', data);
  toast(id?'Program diperbarui':'Program berhasil ditambahkan','ok');
  closeModal('ovProgram'); loadWqStats(); loadProgram(); loadProgramFilter();
};

window.hapusProgram = async function(id) {
  if (!await confirmDel('Hapus program waqaf ini?')) return;
  DB.set('waqaf_program', DB.get('waqaf_program').filter(x=>x.id!==id));
  toast('Dihapus','ok'); loadWqStats(); loadProgram();
};

// ============ DONATUR WAQAF ============
function loadDonaturWQ() {
  let data = DB.get('donatur_waqaf');
  const wp = DB.get('waqaf_program');
  const sr = document.getElementById('srDonWQ').value.toLowerCase();
  const prog = document.getElementById('flProgDon').value;
  const st = document.getElementById('flStDon').value;
  if (sr) data = data.filter(d=>d.nama.toLowerCase().includes(sr));
  if (prog) data = data.filter(d=>d.program_id===prog);
  if (st) data = data.filter(d=>d.status===st);
  data.sort((a,b)=>new Date(b.tgl_donasi)-new Date(a.tgl_donasi));
  document.getElementById('cntDonWQ').textContent = data.length;
  const { items, total } = paginate(data, pgDonWQ, PS);
  document.getElementById('tblDonWQ').innerHTML = items.length ? items.map(d => {
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
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalDonWQ('${d.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusDonWQ('${d.id}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="9"><div class="empty"><div class="ei">💚</div><div class="et">Belum ada donatur waqaf</div></div></td></tr>`;
  renderPagination('pagDonWQ', total, pgDonWQ, PS, 'goPgDonWQ');
}
window.goPgDonWQ = p => { pgDonWQ=p; loadDonaturWQ(); };

window.openModalDonWQ = function(id=null, programId=null) {
  const d = id ? DB.get('donatur_waqaf').find(x=>x.id===id) : null;
  const wp = DB.get('waqaf_program');
  const progOpts = wp.map(w=>`<option value="${w.id}" ${(d?.program_id||programId)===w.id?'selected':''}>${w.nama}</option>`).join('');
  const html = `<div class="overlay" id="ovDonWQ">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>${d?'Edit':'Catat'} Donatur Waqaf</h3><button class="modal-close" onclick="closeModal('ovDonWQ')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg"><label class="flabel">Nama *</label><input id="dwNama" class="fctrl" value="${d?.nama||''}"></div>
          <div class="fg"><label class="flabel">No. HP</label><input id="dwHP" class="fctrl" value="${d?.hp||''}"></div>
          <div class="fg fcol2"><label class="flabel">Alamat</label><input id="dwAlamat" class="fctrl" value="${d?.alamat||''}"></div>
          <div class="fg"><label class="flabel">Kota</label><input id="dwKota" class="fctrl" value="${d?.kota||''}"></div>
          <div class="fg"><label class="flabel">Petugas</label><input id="dwPetugas" class="fctrl" value="${d?.petugas||''}"></div>
          <div class="fg fcol2"><label class="flabel">Program Waqaf *</label><select id="dwProgram" class="fctrl"><option value="">-- Pilih Program --</option>${progOpts}</select></div>
          <div class="fg"><label class="flabel">Nominal Donasi (Rp) *</label><input type="number" id="dwNominal" class="fctrl" value="${d?.nominal||''}"></div>
          <div class="fg"><label class="flabel">Tanggal Donasi</label><input type="date" id="dwTgl" class="fctrl" value="${tglInput(d?.tgl_donasi)||new Date().toISOString().split('T')[0]}"></div>
          <div class="fg"><label class="flabel">Metode</label>
            <select id="dwMetode" class="fctrl">${['transfer','tunai','qris','cek','lainnya'].map(m=>`<option value="${m}" ${d?.metode===m?'selected':''}>${m}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="dwStatus" class="fctrl">${['lunas','cicilan','pending'].map(s=>`<option value="${s}" ${d?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="dwCatatan" class="fctrl">${d?.catatan||''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovDonWQ')">Batal</button>
        <button class="btn btn-primary" onclick="saveDonWQ('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveDonWQ = async function(id) {
  const nama = document.getElementById('dwNama').value.trim();
  const nominal = +document.getElementById('dwNominal').value;
  const programId = document.getElementById('dwProgram').value;
  if (!nama || !nominal || !programId) { toast('Nama, program, dan nominal wajib diisi','warn'); return; }
  const ok = await confirmSave(`Catat donasi waqaf <strong>${rupiah(nominal)}</strong> dari <strong>${nama}</strong>?`);
  if (!ok) return;
  const data = DB.get('donatur_waqaf');
  const payload = { id:id||uid(), nama, hp:document.getElementById('dwHP').value.trim(), alamat:document.getElementById('dwAlamat').value.trim(), kota:document.getElementById('dwKota').value.trim(), petugas:document.getElementById('dwPetugas').value.trim(), program_id:programId, nominal, tgl_donasi:document.getElementById('dwTgl').value, metode:document.getElementById('dwMetode').value, status:document.getElementById('dwStatus').value, catatan:document.getElementById('dwCatatan').value.trim(), created_at:id?(data.find(x=>x.id===id)?.created_at||new Date().toISOString()):new Date().toISOString() };
  if (id) { const i=data.findIndex(x=>x.id===id); data[i]=payload; } else data.unshift(payload);
  DB.set('donatur_waqaf', data);
  // Update terkumpul di program
  const wp = DB.get('waqaf_program');
  const prog = wp.find(w=>w.id===programId);
  if (prog) {
    const totalProg = data.filter(d=>d.program_id===programId && d.status==='lunas').reduce((s,d)=>s+(+d.nominal||0),0);
    prog.terkumpul = totalProg;
    DB.set('waqaf_program', wp);
  }
  toast(id?'Data diperbarui':'Donasi waqaf berhasil dicatat','ok');
  closeModal('ovDonWQ'); loadWqStats(); loadProgram(); loadDonaturWQ();
};

window.hapusDonWQ = async function(id) {
  if (!await confirmDel()) return;
  DB.set('donatur_waqaf', DB.get('donatur_waqaf').filter(x=>x.id!==id));
  toast('Dihapus','ok'); loadWqStats(); loadDonaturWQ();
};

// ============ PROSPEK WAQAF ============
function loadProspekWQ() {
  let data = DB.get('prospek_waqaf');
  const wp = DB.get('waqaf_program');
  const sr = document.getElementById('srProsWQ').value.toLowerCase();
  const prog = document.getElementById('flProgPros').value;
  if (sr) data = data.filter(d=>d.nama.toLowerCase().includes(sr));
  if (prog) data = data.filter(d=>d.program_id===prog);
  document.getElementById('cntProsWQ').textContent = data.length;
  const { items, total } = paginate(data, pgProsWQ, PS);
  document.getElementById('tblProsWQ').innerHTML = items.length ? items.map(d => {
    const prog = wp.find(w=>w.id===d.program_id);
    return `<tr>
      <td class="td-name">${d.nama}</td>
      <td class="td-mono">${d.hp||'-'}</td>
      <td style="font-size:12px">${d.kota||'-'}</td>
      <td style="font-size:12px">${prog?.nama||'-'}</td>
      <td class="rupiah">${rupiah(d.nominal_potensi)}</td>
      <td>${badge(d.status)}</td>
      <td style="font-size:12px">${d.petugas||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500);max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.catatan||'-'}</td>
      <td><div class="td-actions">
        <button class="btn btn-success btn-sm" onclick="jadikanDonaturWQ('${d.id}')">✓ Aktifkan</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalProsWQ('${d.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusProsWQ('${d.id}')">🗑️</button>
      </div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="9"><div class="empty"><div class="ei">👤</div><div class="et">Belum ada prospek waqaf</div></div></td></tr>`;
  renderPagination('pagProsWQ', total, pgProsWQ, PS, 'goPgProsWQ');
}
window.goPgProsWQ = p => { pgProsWQ=p; loadProspekWQ(); };

window.openModalProsWQ = function(id=null) {
  const d = id ? DB.get('prospek_waqaf').find(x=>x.id===id) : null;
  const wp = DB.get('waqaf_program');
  const progOpts = wp.map(w=>`<option value="${w.id}" ${d?.program_id===w.id?'selected':''}>${w.nama}</option>`).join('');
  const html = `<div class="overlay" id="ovProsWQ">
    <div class="modal">
      <div class="modal-head"><h3>${d?'Edit':'Tambah'} Prospek Waqaf</h3><button class="modal-close" onclick="closeModal('ovProsWQ')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg"><label class="flabel">Nama *</label><input id="pwNama" class="fctrl" value="${d?.nama||''}"></div>
          <div class="fg"><label class="flabel">No. HP</label><input id="pwHP" class="fctrl" value="${d?.hp||''}"></div>
          <div class="fg"><label class="flabel">Kota</label><input id="pwKota" class="fctrl" value="${d?.kota||''}"></div>
          <div class="fg"><label class="flabel">Program Minat</label><select id="pwProgram" class="fctrl"><option value="">-- Pilih --</option>${progOpts}</select></div>
          <div class="fg"><label class="flabel">Potensi Donasi (Rp)</label><input type="number" id="pwPotensi" class="fctrl" value="${d?.nominal_potensi||''}"></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="pwStatus" class="fctrl">${['baru','dihubungi','survei'].map(s=>`<option value="${s}" ${d?.status===s?'selected':''}>${s}</option>`).join('')}</select>
          </div>
          <div class="fg"><label class="flabel">Petugas</label><input id="pwPetugas" class="fctrl" value="${d?.petugas||''}"></div>
          <div class="fg fcol2"><label class="flabel">Catatan</label><textarea id="pwCatatan" class="fctrl">${d?.catatan||''}</textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovProsWQ')">Batal</button>
        <button class="btn btn-primary" onclick="saveProsWQ('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
};

window.saveProsWQ = function(id) {
  const nama = document.getElementById('pwNama').value.trim();
  if (!nama) { toast('Nama wajib diisi','warn'); return; }
  const data = DB.get('prospek_waqaf');
  const payload = { id:id||uid(), nama, hp:document.getElementById('pwHP').value.trim(), kota:document.getElementById('pwKota').value.trim(), program_id:document.getElementById('pwProgram').value||null, nominal_potensi:+document.getElementById('pwPotensi').value||0, status:document.getElementById('pwStatus').value, petugas:document.getElementById('pwPetugas').value.trim(), catatan:document.getElementById('pwCatatan').value.trim(), created_at:id?(data.find(x=>x.id===id)?.created_at||new Date().toISOString()):new Date().toISOString() };
  if (id) { const i=data.findIndex(x=>x.id===id); data[i]=payload; } else data.unshift(payload);
  DB.set('prospek_waqaf', data);
  toast('Data prospek tersimpan','ok'); closeModal('ovProsWQ'); loadWqStats(); loadProspekWQ();
};

window.hapusProsWQ = async function(id) {
  if (!await confirmDel()) return;
  DB.set('prospek_waqaf', DB.get('prospek_waqaf').filter(x=>x.id!==id));
  toast('Dihapus','ok'); loadWqStats(); loadProspekWQ();
};

window.jadikanDonaturWQ = function(id) {
  const p = DB.get('prospek_waqaf').find(x=>x.id===id);
  if (!p) return;
  closeModal('ovProsWQ');
  openModalDonWQ(null, p.program_id);
  // Pre-fill nama
  setTimeout(()=>{
    if(document.getElementById('dwNama')) document.getElementById('dwNama').value = p.nama;
    if(document.getElementById('dwHP')) document.getElementById('dwHP').value = p.hp||'';
    if(document.getElementById('dwKota')) document.getElementById('dwKota').value = p.kota||'';
    if(document.getElementById('dwNominal')) document.getElementById('dwNominal').value = p.nominal_potensi||'';
    if(document.getElementById('dwPetugas')) document.getElementById('dwPetugas').value = p.petugas||'';
  }, 100);
  // Hapus dari prospek setelah save
  const origSave = window.saveDonWQ;
  window.saveDonWQ = function(saveId) {
    origSave(saveId);
    DB.set('prospek_waqaf', DB.get('prospek_waqaf').filter(x=>x.id!==id));
    loadProspekWQ();
    window.saveDonWQ = origSave;
  };
};

function exportWQ() {
  const wp = DB.get('waqaf_program');
  const data = DB.get('donatur_waqaf').map(d => ({
    nama: d.nama,
    hp: d.hp || '',
    kota: d.kota || '',
    program: wp.find(w => w.id === d.program_id)?.nama || '',
    nominal: d.nominal,
    tgl_donasi: d.tgl_donasi || '',
    metode: d.metode || '',
    status: d.status || '',
    petugas: d.petugas || ''
  }));
  exportExcel(data, 'DonaturWaqaf', 'Donatur Waqaf');
}
