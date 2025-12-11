// GANTI DENGAN URL APPS SCRIPT BAPAK
const scriptURL = 'https://script.google.com/macros/s/AKfycbw_oEj1cLG8JiK_7vstmoSKCb1Ij-oxiTP6fdFRMiidp2Om6c_t3SzudPVLdlEPvS-SOA/exec';

const form = document.forms['submit-to-google-sheet'];
const btnKirim = document.getElementById('btnKirim');

// --- 1. LOGIKA INPUT MANUAL (TETAP SAMA) ---
form.addEventListener('submit', e => {
    e.preventDefault();
    const textAsli = btnKirim.innerHTML;
    btnKirim.innerHTML = 'Sedang Menyimpan...';
    btnKirim.disabled = true;

    // Gunakan FormData untuk input manual
    const data = new FormData(form);
    
    // Kirim biasa
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
            Swal.fire('Gagal!', error.message, 'error');
            btnKirim.innerHTML = textAsli;
            btnKirim.disabled = false;
        });
});

// --- 2. LOGIKA UPLOAD FILE (BARU) ---
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        Swal.fire('Ups!', 'Pilih file CSV dulu ya pak.', 'warning');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split("\n"); // Pisah per baris
        
        let dataSiswa = [];
        
        // Loop mulai index 1 (karena index 0 adalah Header Judul)
        for (let i = 1; i < rows.length; i++) {
            // Bersihkan tanda "carriage return" (\r) jika ada
            const cleanRow = rows[i].replace(/\r/g, ""); 
            
            // Pisahkan kolom berdasarkan koma
            const cols = cleanRow.split(","); 
            
            // Cek validasi sederhana: minimal ada 3 kolom (No, Nama, NIS)
            if (cols.length > 5 && cols[1] !== "") { 
                dataSiswa.push(cols);
            }
        }

        if (dataSiswa.length === 0) {
            Swal.fire('Gagal', 'File kosong atau format salah.', 'error');
            return;
        }

        // Tampilkan loading
        Swal.fire({
            title: 'Sedang Upload...',
            text: 'Mengirim ' + dataSiswa.length + ' data siswa...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        // Kirim data JSON ke Google Script
        const payload = JSON.stringify({
            action: "bulk_upload",
            data: dataSiswa
        });

        // Khusus upload file, kita kirim string JSON, bukan FormData
        fetch(scriptURL, { 
            method: 'POST', 
            body: payload // Kirim String JSON
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

// --- 3. DOWNLOAD TEMPLATE ---
function downloadTemplate() {
    const headers = [
        "No", "Nama Siswa", "NIS", "NISN", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", 
        "Agama", "Alamat", "Nomor Kontak", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu"
    ];
    // Contoh Data
    const dummy = ["1","Contoh Siswa","2401","00123","Ambon","2008-01-01","Islam","Jl. Mawar","08123","Budi","Siti","Wiraswasta","IRT"];
    
    let csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + dummy.join(",");
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Data_Siswa.csv");
    document.body.appendChild(link);
    link.click();
}