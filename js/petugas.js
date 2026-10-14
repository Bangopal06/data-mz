document.addEventListener('DOMContentLoaded', async () => {
  await DB.sync('petugas');
  loadPetugas();
  document.getElementById('btnTambahPetugas').addEventListener('click', () => openModalPetugas());
});

function loadPetugas() {
  const data = DB.get('petugas');
  document.getElementById('tblPetugas').innerHTML = data.length ? data.map(p => `
    <tr>
      <td style="font-weight:600">${p.nama}</td>
      <td style="font-size:12px">${p.jabatan||'-'}</td>
      <td>${badge(p.status)}</td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openModalPetugas('${p.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="hapusPetugas('${p.id}')">🗑️</button>
      </div></td>
    </tr>`).join('')
  : `<tr><td colspan="4"><div class="empty"><div class="ei">👷</div><div class="et">Belum ada petugas</div></div></td></tr>`;
}

window.openModalPetugas = function(id = null) {
  const p = id ? DB.get('petugas').find(x => x.id === id) : null;
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ovPetugas">
    <div class="modal" style="max-width:420px">
      <div class="modal-head"><h3>${p ? 'Edit' : 'Tambah'} Petugas</h3><button class="modal-close" onclick="closeModal('ovPetugas')">✕</button></div>
      <div class="modal-body">
        <div class="fgrid">
          <div class="fg fcol2"><label class="flabel">Nama *</label><input id="ptNama" class="fctrl" value="${p?.nama||''}"></div>
          <div class="fg fcol2"><label class="flabel">Jabatan</label><input id="ptJabatan" class="fctrl" value="${p?.jabatan||''}" placeholder="Contoh: Koordinator Lapangan"></div>
          <div class="fg fcol2"><label class="flabel">Status</label>
            <select id="ptStatus" class="fctrl">
              <option value="aktif" ${p?.status==='aktif'||!p?'selected':''}>Aktif</option>
              <option value="tidak_aktif" ${p?.status==='tidak_aktif'?'selected':''}>Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-outline" onclick="closeModal('ovPetugas')">Batal</button>
        <button class="btn btn-primary" onclick="savePetugas('${id||''}')">Simpan</button>
      </div>
    </div>
  </div>`);
};

window.savePetugas = async function(id) {
  const nama = document.getElementById('ptNama').value.trim();
  if (!nama) { toast('Nama wajib diisi', 'warn'); return; }
  const payload = {
    nama,
    jabatan: document.getElementById('ptJabatan').value.trim(),
    status: document.getElementById('ptStatus').value
  };
  const r = id ? await DB.update('petugas', id, payload) : await DB.insert('petugas', payload);
  if (!r) { toast('Gagal menyimpan', 'err'); return; }
  await DB.sync('petugas', { force: true });
  toast(id ? 'Petugas diperbarui' : 'Petugas ditambahkan', 'ok');
  closeModal('ovPetugas');
  loadPetugas();
};

window.hapusPetugas = async function(id) {
  if (!await confirmDel('Hapus petugas ini?')) return;
  if (!await DB.delete('petugas', id)) { toast('Gagal menghapus', 'err'); return; }
  await DB.sync('petugas', { force: true });
  toast('Dihapus', 'ok');
  loadPetugas();
};
