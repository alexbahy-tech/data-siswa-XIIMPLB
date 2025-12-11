// ============================================
// 👇 TEMPEL URL GOOGLE APPS SCRIPT BAPAK DI SINI 👇
const scriptURL = 'https://script.google.com/macros/s/AKfycbyZFJjmtc-kwegUP-EVfU5utGC20l-yIUId5GsQswyTGX6snaqkDQ2RE1kT1WYhUr5Ifg/exec'; 
// ============================================

const form = document.getElementById('formSiswa');
const btnKirim = document.getElementById('btnKirim');

// 1. FUNGSI LOAD DATA (DENGAN TOMBOL HAPUS DI SETIAP BARIS)
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
            const data = result.data;
            let html = "";
            
            data.forEach((row, index) => {
                // row[1] = Nama, row[2] = NIS
                // Kita tambahkan tombol hapus di kolom pertama
                // Perhatikan tanda petik di onclick="confirmDelete(...)"
                
                html += `
                <tr>
                    <td class="text-center">
                        <button class="btn btn-danger btn-sm shadow-sm" onclick="confirmDelete('${row[2]}', '${row[1]}')">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </td>
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

            $('#tabelSiswa').DataTable({
                scrollX: true, 
                language: {
                    search: "Cari Siswa:",
                    lengthMenu: "Tampil _MENU_",
                    info: "_START_ - _END_ dari _TOTAL_",
                    paginate: { first: "<<", last: ">>", next: ">", previous: "<" }
                },
                columnDefs: [
                    { width: '50px', targets: 0 } // Mengunci lebar kolom tombol
                ]
            });

        } else {
            throw new Error(result.error);
        }
    })
    .catch(error => {
        spinner.style.display = 'none';
        tbody.innerHTML = `<tr><td colspan="13" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>`;
    });
}

// 2. FUNGSI KONFIRMASI HAPUS (BARU)
function confirmDelete(nis, nama) {
    Swal.fire({
        title: 'Hapus Data?',
        html: `Apakah Anda yakin ingin menghapus data siswa:<br><b>${nama}</b> (NIS: ${nis})?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteSiswa(nis); // Panggil fungsi hapus
        }
    });
}

// 3. FUNGSI EKSEKUSI HAPUS KE SERVER
function deleteSiswa(nis) {
    // Tampilkan loading saat proses hapus
    Swal.fire({
        title: 'Menghapus...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ action: "delete_siswa", nis: nis })
    })
    .then(res => res.json())
    .then(res => {
        if(res.result === 'success') {
            Swal.fire('Terhapus!', `Siswa ${res.nama} telah dihapus.`, 'success');
            loadDataSiswa(); // Refresh tabel otomatis
        } else if(res.result === 'not_found') {
            Swal.fire('Gagal', 'NIS tidak ditemukan di database.', 'error');
        } else throw new Error(res.error);
    })
    .catch(err => Swal.fire('Error', err.message, 'error'));
}

function formatTanggal(dateString) {
    if(!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString('id-ID');
}

// 4. LOGIKA INPUT MANUAL
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

// 5. LOGIKA UPLOAD
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
                if(document.getElementById('pills-view-tab').classList.contains('active')) loadDataSiswa();
            } else throw new Error(res.error);
        })
        .catch(err => Swal.fire('Error', err.message, 'error'));
    };
    reader.readAsText(file);
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