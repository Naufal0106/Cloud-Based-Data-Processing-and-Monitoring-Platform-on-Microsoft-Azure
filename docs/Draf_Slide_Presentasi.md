# Draf Slide Presentasi Proyek Akhir
**Kelompok 11: Cloud-Based Data Processing & Monitoring Platform on Microsoft Azure**

Gunakan draf ini untuk memindahkan konten secara langsung ke Microsoft PowerPoint, Google Slides, atau Canva. Struktur ini dirancang sebanyak **15 slide** yang komprehensif sesuai dengan rubrik penilaian dosen.

---

### **Slide 1: Halaman Judul (Pembuka)**
*   **Judul Utama:** Cloud-Based Data Processing & Monitoring Platform on Microsoft Azure
*   **Sub-Judul:** Proyek Akhir Kuliah - Cloud Computing (Minggu 1 s.d. Minggu 5)
*   **Identitas:** Program Studi Teknik Informatika, Universitas Palangka Raya
*   **Nama Anggota Kelompok 11:**
    1.  Naufal Ihsan Sriyanto (DevOps Engineer)
    2.  Muhammad Arifin Ilham (Backend Developer)
    3.  Zhykwa Ceryl Mavanudin (Cloud Architect)
    4.  Rendy Saputra (Security Engineer)

---

### **Slide 2: Latar Belakang Proyek**
*   **Poin Utama:**
    *   Tingginya volume data telemetri (IoT/Sensor/Logging) yang masuk secara real-time.
    *   Kebutuhan akan pipeline pemrosesan data (ETL) yang cepat, aman, dan toleran terhadap kesalahan.
    *   Tantangan akurasi data akibat adanya *missing values* dan *outliers* (data pencilan).
*   **Solusi:** Membangun platform pemrosesan data serverless dengan visualisasi dashboard berbasis *Hybrid Cloud*.

---

### **Slide 3: Tujuan Proyek**
*   **Poin Utama:**
    *   Membangun pipeline data skala besar yang aman dan handal di awan.
    *   Mengotomatisasi pembersihan data science (*missing values* dan *outliers* menggunakan IQR).
    *   Mengimplementasikan konsep *Infrastructure as Code* (IaC) untuk replikasi infrastruktur yang instan.
    *   Menerapkan *least privilege access control* dan pengamanan kredensial (*secret management*).

---

### **Slide 4: Ringkasan Arsitektur Hybrid**
*   **Visualisasi:** (Tampilkan diagram arsitektur `docs/evidence/arsitektur-final.png`)
*   **Komponen Edge & Frontend:**
    *   **Cloudflare DNS + CDN:** Proxy aman HTTPS & caching dashboard statis.
    *   **Cloudflare Pages:** Hosting dashboard statis yang responsif.
    *   **Cloudflare Pages Functions:** Proxy API server-side untuk menyembunyikan kredensial Azure.

---

### **Slide 5: Infrastruktur Backend & Data Layer**
*   **Komponen Azure:**
    *   **Azure Functions (Python 3.11):** Backend serverless dengan konsumsi daya berbasis event/request.
    *   **Azure Traffic Manager:** Failover otomatis ke secondary backend (**Azure App Service**).
    *   **Azure Blob Storage:** Penyimpanan berkas mentah (raw-data) dengan pemicu blob trigger.
    *   **Azure Cosmos DB NoSQL:** Penyimpanan data terstruktur (users & telemetry-data) dengan skema dinamis.

---

### **Slide 6: Penerapan Infrastructure as Code (IaC)**
*   **Poin Utama:**
    *   Seluruh infrastruktur dideklarasikan secara modular di Terraform:
        *   `main.tf` & `network.tf` (VNet, Subnet, VM)
        *   `database.tf` & `storage.tf` (Cosmos DB, Blob)
        *   `functions.tf` (Function App)
        *   `security.tf` (NSG & Key Vault)
        *   `monitoring.tf` (App Insights & Alerts)
    *   **Manfaat:** Replikasi infrastruktur secara instan, bebas dari kesalahan manual *human-error*.

---

### **Slide 7: Keamanan & Pengolahan Secret Kredensial**
*   **Poin Utama:**
    *   **Azure Key Vault:** Menyimpan data sensitif (Cosmos DB Connection String & JWT Secret token).
    *   **Managed Identity:** Azure Functions mengakses Key Vault tanpa membutuhkan hardcoded password/kunci di kode program.
    *   **CORS Restriction:** API Azure Functions dikunci agar hanya dapat dipanggil dari origin tepercaya (`kelompok11cc.my.id`).

---

### **Slide 8: Hardening Port SSH 22**
*   **Poin Utama:**
    *   **Temuan Awal:** Port SSH 22 pada VM terbuka secara publik untuk seluruh internet.
    *   **Mitigasi (Hardening):** Konfigurasi ulang Network Security Group (NSG) di `security.tf` dengan membatasi port 22 hanya untuk alamat IP administrator tepercaya (`var.admin_ssh_allowed_ip`).
    *   **Hasil:** Mengurangi risiko serangan brute-force secara drastis pada manajemen mesin virtual.

---

### **Slide 9: Logika Pembersihan Data Science**
*   **Algoritma Pembersihan Otomatis:**
    1.  **Missing Values:** Baris yang kosong secara otomatis dieliminasi agar tidak merusak model analisis.
    2.  **Outliers (Metode IQR):**
        *   $IQR = Q3 - Q1$
        *   Batas Bawah = $Q1 - 1.5 \times IQR$
        *   Batas Atas = $Q3 + 1.5 \times IQR$
        *   Nilai di luar batas ini dibuang sebelum dimasukkan ke database Cosmos DB.

---

### **Slide 10: Pengujian Fungsional End-to-End**
*   **5 Skenario Pengujian Utama:**
    1.  Health Check (`GET /api/hello`) -> Response 200 OK
    2.  User Registration (`POST /api/register`) -> Default Role `user`
    3.  User Login (`POST /api/login`) -> Menerbitkan Token JWT (TTL 8 Jam)
    4.  Data Upload (`POST /api/upload`) -> Parsing & pembersihan otomatis
    5.  Role-Based Access Control (RBAC) -> Melarang user biasa mengakses panel admin

---

### **Slide 11: Observability & Alerting**
*   **Poin Utama:**
    *   **Application Insights:** Melacak waktu respon, kegagalan request, dan dependensi sistem.
    *   **Azure Monitor Alerts:**
        *   Alert HTTP 5xx: Memicu notifikasi email tim jika serverless backend mengalami error > 5 kali dalam 5 menit.
        *   Alert Latency: Memicu peringatan jika rata-rata respons > 2 detik.
        *   Alert VM CPU: Peringatan jika utilisasi CPU VM > 80%.

---

### **Slide 12: Analisis & Optimasi Biaya**
*   **Pengeluaran Tetap (CapEx):**
    *   Sewa domain kustom `kelompok11cc.my.id` melalui registrar **Domainesia** seharga **Rp 15.000,- / tahun** (Sangat efisien).
*   **Pengeluaran Operasional (OpEx):**
    *   Penerapan Azure Functions Consumption Plan (biaya per eksekusi).
    *   Cosmos DB Serverless Mode (biaya per 1 juta RU).
    *   Kebijakan Auto-Shutdown VM admin di luar jam demo.
    *   Storage Lifecycle Policy (penghapusan otomatis berkas mentah berumur tua).

---

### **Slide 13: Demo Sistem (Live Show)**
*   **Agenda Demo Live:**
    1.  Proses Registrasi Akun baru dan Login.
    2.  Pengunggahan berkas telemetri (JSON/CSV) tanpa pembersihan.
    3.  Pengunggahan berkas telemetri dengan opsi "Bersihkan" (Menunjukkan diagram IQR).
    4.  Pemeriksaan Panel Admin (User Management & Role Assignment).
    5.  Pemeriksaan Panel Developer (Grafik Monitoring & Metrik CPU/Latency/Error).

---

### **Slide 14: Keterbatasan & Saran Pengembangan**
*   **Keterbatasan:**
    *   Adanya masalah *cold start* beberapa detik saat Azure Functions pertama kali dipanggil setelah idle.
    *   Visualisasi koefisien korelasi saat ini dibatasi hanya untuk kolom numerik utama.
*   **Saran:**
    *   Implementasi **Azure Event Hubs** untuk pengolahan data streaming kontinu (real-time IoT).
    *   Penerapan model deteksi anomali berbasis Machine Learning secara embedded.

---

### **Slide 15: Penutup & Tanya Jawab**
*   **Poin Utama:**
    *   Kesimpulan: Sistem hybrid cloud berhasil diimplementasikan secara aman, andal, terdokumentasi, dan hemat biaya.
    *   Ucapkan Terima Kasih kepada Dosen Penguji dan Teman Sekelas.
    *   Sesi Diskusi & Tanya Jawab dibuka.
