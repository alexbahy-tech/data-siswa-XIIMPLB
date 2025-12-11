// ============================================
// 👇 TEMPEL URL DEPLOYMENT BARU DI SINI 👇
const scriptURL = 'https://script.google.com/macros/s/AKfycbyEKRrBgY7Bzo7aOKyPykmrIEjMRJlroxurYU3dZhxS6Fj8VHLHU2v9Rn_kFDW6J6fwFQ/exec'; 
// ============================================

const form = document.getElementById('formSiswa');
const btnKirim = document.getElementById('btnKirim');
let globalDataSiswa = []; 

// 1. FUNGSI LOAD DATA
function loadDataSiswa() {
    const tbody = document.getElementById('tableBody');
    const spinner = document.getElementById('loadingSpinner');
    
    spinner.style.display = 'block';
    
    if ($.fn.DataTable.isDataTable('#tabelSiswa')) {
        $('#tabelSiswa').DataTable().destroy();
    }
    tbody.innerHTML = "";

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ action: "read_data" })
    })
    .then(response => response.json())
    .then(result => {
        if(result.result === 'success') {
            globalDataSiswa = result.data;
            let html = "";
            
            globalDataSiswa.forEach((row, index) => {
                html += `
                <tr>
                    <td class="text-center">
                        <button class="btn btn-info btn-action text-white me-1 shadow-sm" onclick="viewDetail(${index})" title="Detail"><i class="bi bi-eye-fill"></i></button>
                        <button class="btn btn-danger btn-action shadow-sm" onclick="confirmDelete('${row[2]}', '${row[1]}')" title="Hapus"><i class="bi bi-trash-fill"></i></button>
                    </td>
                    <td class="text-center fw-bold text-muted d-none d-md-table-cell">${index + 1}</td>
                    <td class="fw-bold text-dark text-truncate" style="max-width: 150px;">${row[1]}</td>
                    <td class="text-center d-none d-md-table-cell"><span class="badge-nis">${row[2]}</span></td>
                    <td class="text-center d-none d-md-table-cell">${row[3]}</td>
                    <td class="d-none d-md-table-cell">${row[4]}, ${formatTanggal(row[5])}</td>
                    <td class="d-none d-md-table-cell">${row[9]}</td>
                </tr>`;
            });

            tbody.innerHTML = html;
            spinner.style.display = 'none';

            $('#tabelSiswa').DataTable({
                scrollY: '60vh', scrollCollapse: true, paging: true,
                language: { search: "", searchPlaceholder: "Cari Siswa...", lengthMenu: "_MENU_", info: "_START_-_END_ / _TOTAL_", paginate: { first: "<<", last: ">>", next: ">", previous: "<" }, emptyTable: "Data kosong" },
                columnDefs: [{ width: '80px', targets: 0 }],
                dom: '<"d-flex justify-content-between mb-2"lf>rt<"d-flex justify-content-between mt-2"ip>'
            });

        } else { throw new Error(result.error); }
    })
    .catch(error => { spinner.style.display = 'none'; tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${error.message}</td></tr>`; });
}

// 2. FUNGSI VIEW DETAIL POPUP
function viewDetail(index) {
    const data = globalDataSiswa[index];
    document.getElementById('detailNama').innerText = data[1];
    document.getElementById('detailNIS').innerText = data[2];
    document.getElementById('detailNISN').innerText = data[3];
    document.getElementById('detailTTL').innerText = `${data[4]}, ${formatTanggal(data[5])}`;
    document.getElementById('detailAgama').innerText = data[6];
    document.getElementById('detailAlamat').innerText = data[7];
    document.getElementById('detailKontak').innerText = data[8];
    document.getElementById('detailAyah').innerText = data[9];
    document.getElementById('detailPekAyah').innerText = `(${data[11]})`;
    document.getElementById('detailIbu').innerText = data[10];
    document.getElementById('detailPekIbu').innerText = `(${data[12]})`;
    var myModal = new bootstrap.Modal(document.getElementById('modalDetail'));
    myModal.show();
}

// 3. FUNGSI HAPUS
function confirmDelete(nis, nama) {
    Swal.fire({
        title: 'Hapus?', html: `Hapus <b>${nama}</b> (NIS: ${nis})?`, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus'
    }).then((result) => { if (result.isConfirmed) deleteSiswa(nis); });
}

function deleteSiswa(nis) {
    Swal.fire({ title: 'Menghapus...', didOpen: () => Swal.showLoading() });
    fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: "delete_siswa", nis: nis }) })
    .then(res => res.json())
    .then(res => {
        if(res.result === 'success') { Swal.fire('Terhapus!', 'Siswa dihapus.', 'success'); loadDataSiswa(); }
        else if(res.result === 'not_found') Swal.fire('Gagal', 'NIS tidak ada.', 'error');
        else throw new Error(res.error);
    })
    .catch(err => Swal.fire('Error', err.message, 'error'));
}

// 4. UTILITIES (Upload, Format Tanggal, Manual Input)
function formatTanggal(d) { if(!d) return "-"; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString('id-ID'); }

function handleFileUpload() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) { Swal.fire('Ups', 'Pilih file CSV dulu.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        const rows = e.target.result.split("\n");
        let pemisah = rows[0] && rows[0].includes(";") ? ";" : ",";
        let data = [];
        for (let i=1; i<rows.length; i++) {
            const clean = rows[i].replace(/\r/g, "").trim();
            if (clean) { const c = clean.split(pemisah); if (c.length>3 && c[1]) data.push(c); }
        }
        if (data.length===0) { Swal.fire('Gagal', 'File kosong.', 'error'); return; }
        Swal.fire({ title: 'Mengupload...', didOpen: () => Swal.showLoading() });
        fetch(scriptURL, { method: 'POST', body: JSON.stringify({ action: "bulk_upload", data: data }) })
        .then(res => res.json()).then(res => {
            if(res.result === 'success') { Swal.fire('Sukses', res.count+' data masuk.', 'success'); document.getElementById('fileInput').value=""; if(document.getElementById('pills-view-tab').classList.contains('active')) loadDataSiswa(); }
            else throw new Error(res.error);
        }).catch(err => Swal.fire('Error', err.message, 'error'));
    };
    reader.readAsText(file);
}

if(form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        btnKirim.innerHTML = 'Menyimpan...'; btnKirim.disabled = true;
        fetch(scriptURL, { method: 'POST', body: new FormData(form) })
        .then(res => res.json()).then(res => {
            if(res.result === 'success') { Swal.fire('Berhasil', 'Tersimpan.', 'success'); form.reset(); if(document.getElementById('pills-view-tab').classList.contains('active')) loadDataSiswa(); }
            else throw new Error(res.error);
        }).catch(err => Swal.fire('Gagal', err.message, 'error')).finally(() => { btnKirim.innerHTML = 'SIMPAN DATA'; btnKirim.disabled = false; });
    });
}

function downloadTemplate() {
    const h = ["No","Nama Siswa","NIS","NISN","Tempat Lahir","Tanggal Lahir","Agama","Alamat","Nomor Kontak","Nama Ayah","Nama Ibu","Pekerjaan Ayah","Pekerjaan Ibu"];
    const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + h.join(";") + "\n");
    link.download = "Template_Data_Siswa.csv"; document.body.appendChild(link); link.click();
}