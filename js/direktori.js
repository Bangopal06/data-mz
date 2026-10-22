let pgDir = 1;
const PS = 15;

// Kategori default — bisa ditambah user
const KAT_KEY = 'dir_kategori';
function getKategori() {
  try {
    const saved = localStorage.getItem(KAT_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return ['Wali Murid', 'Donatur Isidental', 'Mitra Bisnis', 'Relawan', 'Lainnya'];
}
function saveKategori(list) {
  localStorage.setItem(KAT_KEY, JSON.stringify(list));
}

document.addEventListener('DOMContentLoaded', async () => {
  loadKategoriFilter();
  loadDir();

  document.getElementById('btnTambahDir').addEventListener('click', () => openModalDir());
  document.getElementById('btnKelolaKat').addEventListener('click', openModalKategori);
  document.getElementById('srDir').addEventListener('input', debounce(() => { pgDir=1; loadDir(); }));
  document.getElementById('flKatDir').addEventListener('change', () => { pgDir=1; loadDir(); });
  document.getElementById('flStDir').addEventListener('change', () => { pgDir=1; loadDir(); });

  await DB.sync('direktori');
  loadDirStats();
  loadDir();
});

function loadKategoriFilter() {
  const list = getKategori();
  const sel = document.getElementById('flKatDir');
  sel.innerHTML = '<option value="">Semua Kategori</option>' +
    list.map(k => `<option value="${k}">${k}</option>`).join('');
}

function loadDirStats() {
  const data = DB.get('direktori');
  const perKat = {};
  data.forEach(d => { perKat[d.kategori] = (perKat[d.kategori]||0) + 1; });
  const topKat = Object.entries(perKat).sort((a,b)=>b[1]-a[1]).slice(0,4);
  document.getElementById('dirStats').innerHTML = `
    <div class="stat"><div class="stat-ico ic-blue">📂</div><div class="stat-body"><div class="lbl">Total Data</div><div class="val">${data.length}</div></div></div>
    <div class="stat"><div class="stat-ico ic-green">✅</div><div class="stat-body"><div class="lbl">Aktif</div><div class="val">${data.filter(d=>d.status==='aktif').length}</div></div></div>
    ${topKat.map(([k,v])=>`<div class="stat"><div class="stat-ico ic-orange">🏷️</div><div class="stat-body"><div class="lbl">${k}</div><div class="val">${v}</div></div></div>`).join('')}
  `;
}

function loadDir() {
  let data = DB.get('direktori');
  const sr = document.getElementById('srDir').value.toLowerCase();
  const kat = document.getElementById('flKatDir').value;
  const st = document.getElementById('flStDir').value;
  if (sr) data = data.filter(d => d.nama.toLowerCase().includes(sr) || (d.hp||'').includes(sr) || (d.keterangan||'').toLowerCase().includes(sr));
  if (kat) data = data.filter(d => d.kategori === kat);
  if (st) data = data.filter(d => d.status === st);
  data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const { items, total } = paginate(data, pgDir, PS);
  document.getElementById('tblDir').innerHTML = items.length ? items.map(d => `
    <tr>
      <td style="font-weight:600">${d.nama}</td>
      <td><span class="badge b-blue" style="font-size:11px">${d.kategori}</span></td>
      <td class="td-mono">${d.hp||'-'}</td>
      <td style="font-size:12px">${[d.alamat, d.kota].filter(Boolean).join(', ')||'-'}</td>
      <td style="font-size:12px;color:var(--gray-500);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.keterangan||'-'}</td>
      <td>${badge(d.status)}</td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalDir('${d.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusDir('${d.id}')">🗑️</button>
      </div></td>
    </tr>`).join('')
  : `<tr><td colspan="7"><div class="empty"><div class="ei">📂</div><div class="et">Belum ada data</div></div></td></tr>`;
  renderPagination('pagDir', total, pgDir, PS, 'goPgDir');
}
window.goPgDir = p => { pgDir=p; loadDir(); };

window.openModalDir = function(id=null) {
  const d = id ? DB.get('direktori').find(x=>x.id===id) : null;
  const katList = getKategori();
  const katOpts = katList.map(k=>`<option value="${k}" ${d?.kategori===k?'selected':''}>${k}</option>`).join('');

  // Extra fields (dari JSON)
  const extra = d?.extra || {};

  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovDir">
    <div class="modal modal-lg">
      <div class="modal-head"><h3>${d?'Edit':'Tambah'} Data</h3><button class="modal-close" onclick="closeModal('ovDir')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg"><label class="flabel">Nama *</label><input id="dNamaDir" class="fctrl" value="${d?.nama||''}"></div>
          <div class="fg"><label class="flabel">Kategori *</label>
            <select id="dKatDir" class="fctrl">${katOpts}</select>
          </div>
          <div class="fg"><label class="flabel">No. HP</label><input id="dHPDir" class="fctrl" value="${d?.hp||''}"></div>
          <div class="fg"><label class="flabel">Kota</label><input id="dKotaDir" class="fctrl" value="${d?.kota||''}"></div>
          <div class="fg fcol2"><label class="flabel">Alamat</label><input id="dAlamatDir" class="fctrl" value="${d?.alamat||''}"></div>
          <div class="fg fcol2"><label class="flabel">Keterangan</label><textarea id="dKetDir" class="fctrl" rows="3">${d?.keterangan||''}</textarea></div>
          <div class="fg"><label class="flabel">Status</label>
            <select id="dStDir" class="fctrl">
              <option value="aktif" ${d?.status==='aktif'||!d?'selected':''}>Aktif</option>
              <option value="tidak_aktif" ${d?.status==='tidak_aktif'?'selected':''}>Tidak Aktif</option>
            </select>
          </div>
        </div>
        <div class="sec-div" style="margin-top:8px">Data Tambahan (opsional)</div>
        <div class="fgrid">
          <div class="fg"><label class="flabel">Field 1 (Label)</label><input id="dEx1L" class="fctrl" value="${Object.keys(extra)[0]||''}" placeholder="cth: Kelas"></div>
          <div class="fg"><label class="flabel">Field 1 (Nilai)</label><input id="dEx1V" class="fctrl" value="${Object.values(extra)[0]||''}" placeholder="cth: 5A"></div>
          <div class="fg"><label class="flabel">Field 2 (Label)</label><input id="dEx2L" class="fctrl" value="${Object.keys(extra)[1]||''}" placeholder="cth: Pekerjaan"></div>
          <div class="fg"><label class="flabel">Field 2 (Nilai)</label><input id="dEx2V" class="fctrl" value="${Object.values(extra)[1]||''}" placeholder="cth: Guru"></div>
          <div class="fg"><label class="flabel">Field 3 (Label)</label><input id="dEx3L" class="fctrl" value="${Object.keys(extra)[2]||''}" placeholder="cth: Email"></div>
          <div class="fg"><label class="flabel">Field 3 (Nilai)</label><input id="dEx3V" class="fctrl" value="${Object.values(extra)[2]||''}" placeholder="cth: ..."></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovDir')">Batal</button>
        <button class="btn btn-primary" onclick="saveDir('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.saveDir = async function(id) {
  const nama = document.getElementById('dNamaDir').value.trim();
  const kat = document.getElementById('dKatDir').value;
  if (!nama) { toast('Nama wajib diisi','warn'); return; }

  // Kumpulkan extra fields
  const extra = {};
  [[document.getElementById('dEx1L').value.trim(), document.getElementById('dEx1V').value.trim()],
   [document.getElementById('dEx2L').value.trim(), document.getElementById('dEx2V').value.trim()],
   [document.getElementById('dEx3L').value.trim(), document.getElementById('dEx3V').value.trim()]]
  .forEach(([l,v]) => { if (l && v) extra[l] = v; });

  const payload = {
    nama, kategori: kat,
    hp: document.getElementById('dHPDir').value.trim(),
    kota: document.getElementById('dKotaDir').value.trim(),
    alamat: document.getElementById('dAlamatDir').value.trim(),
    keterangan: document.getElementById('dKetDir').value.trim(),
    status: document.getElementById('dStDir').value,
    extra
  };
  const btn = document.querySelector('#ovDir .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  const r = id ? await DB.update('direktori', id, payload) : await DB.insert('direktori', payload);
  if (!r) { toast('Gagal menyimpan','err'); return; }
  await DB.sync('direktori', { force: true });
  toast(id ? 'Data diperbarui' : 'Data berhasil ditambahkan','ok');
  closeModal('ovDir');
  loadDirStats(); loadDir();
};

window.hapusDir = async function(id) {
  if (!await confirmDel('Hapus data ini?')) return;
  if (!await DB.delete('direktori', id)) { toast('Gagal menghapus','err'); return; }
  await DB.sync('direktori', { force: true });
  toast('Dihapus','ok');
  loadDirStats(); loadDir();
};

// Kelola Kategori
function openModalKategori() {
  const list = getKategori();
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovKat">
    <div class="modal" style="max-width:420px">
      <div class="modal-head"><h3>⚙️ Kelola Kategori</h3><button class="modal-close" onclick="closeModal('ovKat')">✕</button></div>
      <div class="modal-body">
        <div id="katList" style="margin-bottom:16px">
          ${list.map((k,i) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <input class="fctrl kat-item" value="${k}" style="flex:1">
              <button class="btn btn-ghost btn-sm btn-icon" onclick="this.parentElement.remove()">🗑️</button>
            </div>`).join('')}
        </div>
        <button class="btn btn-outline btn-sm" onclick="tambahKatInput()">+ Tambah Kategori</button>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovKat')">Batal</button>
        <button class="btn btn-primary" onclick="simpanKategori()">Simpan</button>
      </div>
    </div>
  </div>`);
}

window.tambahKatInput = function() {
  const list = document.getElementById('katList');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
  div.innerHTML = `<input class="fctrl kat-item" placeholder="Nama kategori baru" style="flex:1"><button class="btn btn-ghost btn-sm btn-icon" onclick="this.parentElement.remove()">🗑️</button>`;
  list.appendChild(div);
  div.querySelector('input').focus();
};

window.simpanKategori = function() {
  const inputs = document.querySelectorAll('.kat-item');
  const list = [...inputs].map(i=>i.value.trim()).filter(Boolean);
  if (!list.length) { toast('Minimal 1 kategori','warn'); return; }
  saveKategori(list);
  toast('Kategori tersimpan','ok');
  closeModal('ovKat');
  loadKategoriFilter();
};

function exportDir() {
  const data = DB.get('direktori').map(d => ({
    nama: d.nama, kategori: d.kategori, hp: d.hp||'',
    kota: d.kota||'', alamat: d.alamat||'',
    keterangan: d.keterangan||'', status: d.status,
    ...(d.extra||{})
  }));
  if (!data.length) { toast('Tidak ada data','warn'); return; }
  exportExcel(data, 'DirektoriData', 'Direktori');
}
