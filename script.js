// ============================================
// 👇 TEMPEL URL DARI GOOGLE APPS SCRIPT DI SINI 👇
const scriptURL = 'https://script.google.com/macros/s/AKfycbz8eP30Uy6_HhF5G15MKxzzMHcJLTUwQi1Tr6EeT6rP5TeUoSDEgid4kmQ6j0W9E-oMiw/exec'; 
// ============================================

const form = document.getElementById('formSiswa');
const btnKirim = document.getElementById('btnKirim');
const btnDelete = document.getElementById('btnDelete');

// 1. FUNGSI LOAD DATA (KOLOM A - M)
function loadDataSiswa() {
    const tbody = document.getElementById('tableBody');
    const spinner = document.getElementById('loadingSpinner');
    
    spinner.style.display = 'block';
    
    // Reset DataTable agar tidak error saat reload
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
            const data = result.data;
            let html = "";
            
            data.forEach((row, index) => {
                // row[1] = Nama, row[2] = NIS ... row[12] = Pek. Ibu
                html += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="fw-bold text-nowrap">${row[1]}</td>
                    <td class="text-center"><span class="badge bg-primary">${row[2]}</span></td>
                    <td class="text-center">${row[3]}</td>
                    <td style="min-width: 180px;">${row[4]}, ${formatTanggal(row[5])}</td>
                    <td>${row[6]}</td>
                    <td style="min-width: 200px;">${row[7]}</td>
                    <td>${row[8]}</td>
                    <td>${row[9]}</td>
                    <td>${row[10]}</td>
                    <td>${row[11]}</td>
                    <td>${row[12]}</td>
                </tr>`;
            });

            tbody.innerHTML = html;
            spinner.style.display = 'none';

            // Aktifkan DataTable dengan Scroll ke Samping
            $('#tabelSiswa').DataTable({
                scrollX: true, 
                language: {
                    search: "Cari:",
                    lengthMenu: "Tampil _MENU_",
                    info: "_START_ - _END_ dari _TOTAL_",
                    paginate: { first: "<<", last: ">>", next: ">", previous: "<" }
                }
            });

        } else {
            throw new Error(result.error);
        }
    })
    .catch(error => {
        spinner.style.display = 'none';
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    });
}

function formatTanggal(dateString) {
    if(!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString('id-ID');
}

// 2. LOGIKA UPLOAD (AUTO DETECT FORMAT INDONESIA)
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) { Swal.fire('Peringatan', 'Pilih file CSV dulu.', 'warning'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split("\n");
        // Deteksi pemisah (Koma atau Titik Koma)
        let pemisah = rows[0] && rows[0].includes(";") ? ";" : ",";

        let dataSiswa = [];
        for (let i = 1; i < rows.length; i++) {
            const cleanRow = rows[i].replace(/\r/g, "").trim();
            if (cleanRow) {
                const cols = cleanRow.split(pemisah);
                // Validasi minimal ada Nama (index 1)
                if (cols.length > 3 && cols[1]) {
                    dataSiswa.push(cols);
                }
            }
        }

        if (dataSiswa.length === 0) { Swal.fire('Gagal', 'File kosong atau format salah.', 'error'); return; }

        Swal.fire({ title: 'Mengupload...', didOpen: () => Swal.showLoading() });

        fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify({ action: "bulk_upload", data: dataSiswa })
        })
        .then(res => res.json())
        .then(res => {
            if(res.result === 'success') {
                Swal.fire('Sukses', res.count + ' data berhasil masuk!', 'success');
                fileInput.value = "";
                // Jika sedang di tab database, refresh
                if(document.getElementById('pills-view-tab').classList.contains('active')) loadDataSiswa();
            } else throw new Error(res.error);
        })
        .catch(err => Swal.fire('Error', err.message, 'error'));
    };
    reader.readAsText(file);
}

// 3. LOGIKA INPUT MANUAL
if(form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        btnKirim.innerHTML = 'Sedang Menyimpan...'; btnKirim.disabled = true;
        const data = new FormData(form);
        fetch(scriptURL, { method: 'POST', body: data })
            .then(res => res.json())
            .then(res => {
                if(res.result === 'success') {
                    Swal.fire('Berhasil', 'Data tersimpan.', 'success');
                    form.reset();
                    if(document.getElementById('pills-view-tab').classList.contains('active')) loadDataSiswa();
                } else throw new Error(res.error);
            })
            .catch(err => Swal.fire('Gagal', err.message, 'error'))
            .finally(() => { btnKirim.innerHTML = 'SIMPAN DATA'; btnKirim.disabled = false; });
    });
}

// 4. LOGIKA HAPUS DATA
function handleDelete() {
    const nis = document.getElementById('deleteNIS').value;
    if (!nis) { Swal.fire('Peringatan', 'Isi NIS dulu.', 'warning'); return; }

    Swal.fire({
        title: 'Yakin Hapus?', text: "NIS " + nis + " akan dihapus permanen!", icon: 'warning',
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
                    loadDataSiswa(); 
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
    // Template pakai Titik Koma (;) agar aman di Excel Indonesia
    const headers = ["No","Nama Siswa","NIS","NISN","Tempat Lahir","Tanggal Lahir","Agama","Alamat","Nomor Kontak","Nama Ayah","Nama Ibu","Pekerjaan Ayah","Pekerjaan Ibu"];
    let csv = "data:text/csv;charset=utf-8," + headers.join(";") + "\n";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "Template_Data_Siswa.csv");
    document.body.appendChild(link);
    link.click();
}