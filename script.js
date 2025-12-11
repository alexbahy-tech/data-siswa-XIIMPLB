// ============================================================
// KONFIGURASI PENTING
// ============================================================
// Tempel URL Web App Google Script Bapak di sini:
const scriptURL = 'https://script.google.com/macros/s/AKfycbzzzSAsovJ_5SXoxq6Uk870RMBNLj0QPJrkzvXjQQncZ86wD-KlsHzzK4sjrJKVwbx5dw/exec'; 
// ============================================================


const form = document.forms['submit-to-google-sheet'];
const btnKirim = document.getElementById('btnKirim');

// ------------------------------------------------------------
// 1. LOGIKA INPUT MANUAL (TETAP SAMA)
// ------------------------------------------------------------
form.addEventListener('submit', e => {
    e.preventDefault();
    
    // Validasi URL dulu
    if (scriptURL.includes('TEMPEL_URL')) {
        Swal.fire('Error', 'Pak Wakasek, URL Google Script belum dipasang di script.js', 'error');
        return;
    }

    const textAsli = btnKirim.innerHTML;
    btnKirim.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';
    btnKirim.disabled = true;

    const data = new FormData(form);
    
    fetch(scriptURL, { method: 'POST', body: data })
        .then(response => response.json())
        .then(result => {
            if(result.result === 'success') {
                Swal.fire('Berhasil!', 'Data siswa ' + result.nama + ' tersimpan.', 'success');
                form.reset();
            } else { throw new Error(result.error); }
            btnKirim.innerHTML = textAsli;
            btnKirim.disabled = false;
        })
        .catch(error => {
            Swal.fire('Gagal!', 'Cek internet/URL. ' + error.message, 'error');
            btnKirim.innerHTML = textAsli;
            btnKirim.disabled = false;
        });
});

// ------------------------------------------------------------
// 2. LOGIKA UPLOAD FILE (SUDAH DIPERBAIKI UNTUK EXCEL INDONESIA)
// ------------------------------------------------------------
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    // Validasi URL dulu
    if (scriptURL.includes('TEMPEL_URL')) {
        Swal.fire('Error', 'Pak Wakasek, URL Google Script belum dipasang di script.js', 'error');
        return;
    }

    if (!file) {
        Swal.fire('Ups!', 'Pilih file CSV dulu ya pak.', 'warning');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split("\n"); // Pisah per baris
        
        // --- FITUR BARU: AUTO DETECT PEMISAH (KOMA ATAU TITIK KOMA) ---
        // Kita cek baris pertama (Header). Jika ada ";", berarti format Indonesia.
        let pemisah = ","; 
        if (rows[0] && rows[0].includes(";")) {
            pemisah = ";";
        }
        // --------------------------------------------------------------

        let dataSiswa = [];
        
        // Loop mulai index 1 (karena index 0 adalah Header Judul)
        for (let i = 1; i < rows.length; i++) {
            // Bersihkan baris dari karakter aneh
            const cleanRow = rows[i].replace(/\r/g, "").trim(); 
            
            if (cleanRow) {
                // Pisahkan kolom menggunakan pemisah yang sudah dideteksi tadi
                const cols = cleanRow.split(pemisah); 
                
                // Validasi: Pastikan baris punya cukup kolom & Nama (index 1) tidak kosong
                // cols[1] adalah Nama Siswa
                if (cols.length > 5 && cols[1] && cols[1].trim() !== "") { 
                    dataSiswa.push(cols);
                }
            }
        }

        if (dataSiswa.length === 0) {
            Swal.fire('Gagal Membaca', 'File kosong atau format salah. Pastikan Save As CSV.', 'error');
            return;
        }

        // Tampilkan loading & Konfirmasi jumlah data
        Swal.fire({
            title: 'Sedang Upload...',
            text: 'Mengirim ' + dataSiswa.length + ' data siswa...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        const payload = JSON.stringify({
            action: "bulk_upload",
            data: dataSiswa
        });

        fetch(scriptURL, { 
            method: 'POST', 
            body: payload 
        })
        .then(response => response.json())
        .then(result => {
            if(result.result === 'success') {
                Swal.fire('Selesai!', result.count + ' data siswa berhasil masuk Database!', 'success');
                fileInput.value = ""; // Reset input file
            } else {
                throw new Error(result.error);
            }
        })
        .catch(error => {
            Swal.fire('Error Upload', error.message, 'error');
        });
    };

    reader.readAsText(file);
}

// ------------------------------------------------------------
// 3. DOWNLOAD TEMPLATE
// ------------------------------------------------------------
function downloadTemplate() {
    const headers = [
        "No", "Nama Siswa", "NIS", "NISN", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", 
        "Agama", "Alamat", "Nomor Kontak", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu"
    ];
    // Data dummy contoh
    const dummy = ["1","Siswa Contoh","2401","00123","Ambon","2008-01-01","Islam","Jl. Baru","08123","Ayah","Ibu","Wiraswasta","IRT"];
    
    // Gabungkan dengan titik koma (;) agar aman dibuka di Excel Indonesia
    let csv = "data:text/csv;charset=utf-8," + headers.join(";") + "\n" + dummy.join(";");
    
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Data_Siswa.csv");
    document.body.appendChild(link);
    link.click();
}