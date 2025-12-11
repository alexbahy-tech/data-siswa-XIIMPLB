// ============================================
// PASTE URL DEPLOYMENT BARU DI SINI
const scriptURL = 'https://script.google.com/macros/s/AKfycbxKF4E5RfHMXDEZMWm-oG2lNu65SU9g8aFBMSLxoTQrvkultfpl5-2rAQdp-jH-dhd5Ig/exec'; 
// ============================================

const form = document.getElementById('formSiswa');
const btnKirim = document.getElementById('btnKirim');
const btnDelete = document.getElementById('btnDelete');

// 1. FUNGSI LOAD DATA (MENAMPILKAN DATA DI UI)
function loadDataSiswa() {
    const tbody = document.getElementById('tableBody');
    const spinner = document.getElementById('loadingSpinner');
    const tableEl = document.getElementById('tabelSiswa');

    // Tampilkan spinner, sembunyikan tabel dulu
    spinner.style.display = 'block';
    
    // Kirim permintaan 'read_data' ke Google Script
    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ action: "read_data" })
    })
    .then(response => response.json())
    .then(result => {
        if(result.result === 'success') {
            const data = result.data;
            let html = "";
            
            // Loop data dari server (Kolom: 0=No, 1=Nama, 2=NIS, 3=NISN, 5=Lahir, 6=Agama, 8=Kontak)
            data.forEach((row, index) => {
                html += `
                <tr>
                    <td>${index + 1}</td>
                    <td class="fw-bold">${row[1]}</td>
                    <td><span class="badge bg-primary">${row[2]}</span></td>
                    <td>${row[3]}</td>
                    <td>${row[4]}, ${formatTanggal(row[5])}</td>
                    <td>${row[6]}</td>
                    <td>${row[8]}</td>
                </tr>`;
            });

            // Hancurkan datatable lama jika ada (biar gak error saat reload)
            if ($.fn.DataTable.isDataTable('#tabelSiswa')) {
                $('#tabelSiswa').DataTable().destroy();
            }

            tbody.innerHTML = html;
            spinner.style.display = 'none';

            // Aktifkan fitur canggih DataTables (Search, Sort, Pagination)
            $('#tabelSiswa').DataTable({
                language: {
                    search: "Cari Siswa:",
                    lengthMenu: "Tampil _MENU_ data",
                    info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ siswa",
                    paginate: { first: "Aw", last: "Ak", next: ">", previous: "<" }
                }
            });

        } else {
            throw new Error(result.error);
        }
    })
    .catch(error => {
        spinner.style.display = 'none';
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    });
}

function formatTanggal(dateString) {
    if(!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString('id-ID');
}

// 2. LOGIKA INPUT MANUAL
if(form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        btnKirim.innerHTML = 'Sedang Menyimpan...';
        btnKirim.disabled = true;
        
        const data = new FormData(form);
        fetch(scriptURL, { method: 'POST', body: data })
            .then(res => res.json())
            .then(res => {
                if(res.result === 'success') {
                    Swal.fire('Berhasil', 'Siswa tersimpan.', 'success');
                    form.reset();
                    // Jika sedang di tab view, refresh data
                    if(document.getElementById('pills-view-tab').classList.contains('active')){
                        loadDataSiswa(); 
                    }
                } else throw new Error(res.error);
            })
            .catch(err => Swal.fire('Gagal', err.message, 'error'))
            .finally(() => { btnKirim.innerHTML = 'SIMPAN DATA'; btnKirim.disabled = false; });
    });
}

// 3. LOGIKA UPLOAD
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) { Swal.fire('Peringatan', 'Pilih file CSV dulu.', 'warning'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split("\n");
        let pemisah = rows[0] && rows[0].includes(";") ? ";" : ",";

        let dataSiswa = [];
        for (let i = 1; i < rows.length; i++) {
            const cleanRow = rows[i].replace(/\r/g, "").trim();
            if (cleanRow) {
                const cols = cleanRow.split(pemisah);
                if (cols.length > 3 && cols[1]) dataSiswa.push(cols);
            }
        }

        if (dataSiswa.length === 0) { Swal.fire('Gagal', 'File kosong.', 'error'); return; }

        Swal.fire({ title: 'Mengupload...', didOpen: () => Swal.showLoading() });

        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({ action: "bulk_upload", data: dataSiswa })
        })
        .then(res => res.json())
        .then(res => {
            if(res.result === 'success') {
                Swal.fire('Sukses', res.count + ' data masuk!', 'success');
                fileInput.value = "";
            } else throw new Error(res.error);
        })
        .catch(err => Swal.fire('Error', err.message, 'error'));
    };
    reader.readAsText(file);
}

// 4. LOGIKA HAPUS
function handleDelete() {
    const nis = document.getElementById('deleteNIS').value;
    if (!nis) { Swal.fire('Peringatan', 'Isi NIS dulu.', 'warning'); return; }

    Swal.fire({
        title: 'Hapus Data?', text: "NIS " + nis + " akan dihapus!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus'
    }).then((result) => {
        if (result.isConfirmed) {
            btnDelete.innerHTML = 'Menghapus...'; btnDelete.disabled = true;
            fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify({ action: "delete_siswa", nis: nis })
            })
            .then(res => res.json())
            .then(res => {
                if(res.result === 'success') {
                    Swal.fire('Terhapus!', 'Siswa ' + res.nama + ' dihapus.', 'success');
                    document.getElementById('deleteNIS').value = "";
                    loadDataSiswa(); // Refresh tabel
                } else if(res.result === 'not_found') {
                    Swal.fire('Gagal', 'NIS tidak ditemukan.', 'error');
                } else throw new Error(res.error);
            })
            .catch(err => Swal.fire('Error', err.message, 'error'))
            .finally(() => { btnDelete.innerHTML = 'HAPUS PERMANEN'; btnDelete.disabled = false; });
        }
    });
}

function downloadTemplate() {
    const headers = ["No","Nama Siswa","NIS","NISN","Tempat Lahir","Tanggal Lahir","Agama","Alamat","Nomor Kontak","Nama Ayah","Nama Ibu","Pekerjaan Ayah","Pekerjaan Ibu"];
    let csv = "data:text/csv;charset=utf-8," + headers.join(";") + "\n";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "Template_Data_Siswa.csv");
    document.body.appendChild(link);
    link.click();
}