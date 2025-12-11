// Ganti URL ini dengan URL Web App punya Bapak
const scriptURL = 'https://script.google.com/macros/s/AKfycbxnea_Npfl_xqAIwzaU6DZBTRVoyhJ1hetRdvvlH-6tr7TwZ_r7oOQkPSrTuNnrV1ssLw/exec'; 

const form = document.forms['submit-to-google-sheet'];
const btnKirim = document.getElementById('btnKirim');

// --- 1. LOGIKA INPUT MANUAL ---
form.addEventListener('submit', e => {
    e.preventDefault();
    btnKirim.innerHTML = 'Menyimpan...';
    btnKirim.disabled = true;
    fetch(scriptURL, { method: 'POST', body: new FormData(form) })
        .then(response => response.json())
        .then(result => {
            if(result.result === 'success') {
                Swal.fire('Berhasil!', 'Data tersimpan.', 'success');
                form.reset();
            } else { throw new Error(result.error); }
            btnKirim.innerHTML = 'SIMPAN DATA';
            btnKirim.disabled = false;
        })
        .catch(error => {
            Swal.fire('Gagal!', error.message, 'error');
            btnKirim.innerHTML = 'SIMPAN DATA';
            btnKirim.disabled = false;
        });
});

// --- 2. LOGIKA UPLOAD (DENGAN AUTO-DETECT TITIK KOMA) ---
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        Swal.fire('Ups!', 'Pilih file CSV dulu.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split("\n");
        
        // DETEKSI APAKAH PAKAI TITIK KOMA (Format Indonesia)
        let pemisah = ",";
        if (rows[0] && rows[0].includes(";")) {
            pemisah = ";";
        }

        let dataSiswa = [];
        for (let i = 1; i < rows.length; i++) {
            const cleanRow = rows[i].replace(/\r/g, "").trim();
            if (cleanRow) {
                const cols = cleanRow.split(pemisah);
                // Ambil data jika kolom Nama (index 1) ada isinya
                if (cols.length > 5 && cols[1] && cols[1].trim() !== "") {
                    dataSiswa.push(cols);
                }
            }
        }

        if (dataSiswa.length === 0) {
            Swal.fire('Gagal', 'File kosong atau format salah.', 'error');
            return;
        }

        Swal.fire({
            title: 'Sedang Upload...',
            text: 'Mengirim ' + dataSiswa.length + ' data...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        });

        fetch(scriptURL, { 
            method: 'POST', 
            body: JSON.stringify({ action: "bulk_upload", data: dataSiswa }) 
        })
        .then(response => response.json())
        .then(result => {
            if(result.result === 'success') {
                Swal.fire('Sukses!', result.count + ' data berhasil masuk!', 'success');
                fileInput.value = "";
            } else { throw new Error(result.error); }
        })
        .catch(error => { Swal.fire('Error', error.message, 'error'); });
    };
    reader.readAsText(file);
}

// --- 3. DOWNLOAD TEMPLATE (SESUAIKAN AGAR TITIK KOMA) ---
function downloadTemplate() {
    const headers = [
        "No", "Nama Siswa", "NIS", "NISN", "Tempat Lahir", "Tanggal Lahir (YYYY-MM-DD)", 
        "Agama", "Alamat", "Nomor Kontak", "Nama Ayah", "Nama Ibu", "Pekerjaan Ayah", "Pekerjaan Ibu"
    ];
    // Gunakan titik koma (;) agar saat dibuka di Excel Bapak langsung rapi
    let csv = "data:text/csv;charset=utf-8," + headers.join(";") + "\n";
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Data_Siswa.csv");
    document.body.appendChild(link);
    link.click();
}