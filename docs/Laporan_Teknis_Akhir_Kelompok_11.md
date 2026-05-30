# LAPORAN TEKNIS AKHIR
## PROYEK KELOMPOK 11: CLOUD-BASED DATA PROCESSING AND MONITORING PLATFORM ON MICROSOFT AZURE

---

### **DAFTAR ISI**
1. [BAB I: Pendahuluan](#bab-i-pendahuluan)
2. [BAB II: Landasan Teori](#bab-ii-landasan-teori)
3. [BAB III: Arsitektur & Desain Sistem](#bab-iii-arsitektur-desain-sistem)
4. [BAB IV: Implementasi Sistem](#bab-iv-implementasi-sistem)
5. [BAB V: Pengujian Fungsional & Pemrosesan Data Science](#bab-v-pengujian-fungsional-pemrosesan-data-science)
6. [BAB VI: Monitoring, Keamanan, & Cost Management](#bab-vi-monitoring-keamanan-cost-management)
7. [BAB VII: Penutup & Kesimpulan](#bab-vii-penutup-kesimpulan)
8. [Daftar Pustaka](#daftar-pustaka)
9. [Lampiran](#lampiran)

---

## **BAB I: Pendahuluan**

### **1.1 Latar Belakang**
Perkembangan teknologi *cloud computing* (komputasi awan) telah merevolusi cara organisasi mengelola data skala besar secara realtime. Kecepatan pengumpulan data dari berbagai modul sensor, sistem logging aplikasi, dan aktivitas pengguna menuntut infrastruktur yang tidak hanya cepat namun juga aman, scalable (dapat diskalakan), serta memiliki ketersediaan tinggi (*high availability*). 

Dalam proyek ini, Kelompok 11 merancang dan mengimplementasikan **Cloud-Based Data Processing & Monitoring Platform**. Sistem ini memproses unggahan file data berukuran besar (hingga 100 MB) dalam berbagai format (CSV, JSON, XLSX, XLS), menerapkan pembersihan data secara otomatis dari nilai kosong (*missing values*) serta anomali ekstrim (*outliers*), dan memvisualisasikan hasilnya secara realtime ke dashboard interaktif. 

Pendekatan *Hybrid Cloud* dipilih dengan menempatkan static frontend pada **Cloudflare Pages** demi efisiensi biaya dan performa distribusi global, sementara backend serverless serta database NoSQL dijalankan di atas **Microsoft Azure** untuk integrasi secret management, storage, dan monitoring yang handal.

### **1.2 Tujuan Proyek**
1. Membangun platform pemrosesan data (ETL pipeline) berbasis cloud yang dapat menangani file hingga 100 MB secara aman dan realtime.
2. Menerapkan prinsip *Infrastructure as Code* (IaC) menggunakan **Terraform** untuk mereproduksi seluruh infrastruktur cloud Azure secara instan dan konsisten.
3. Menyediakan dashboard monitoring *observability* (CPU, Latency, API request rate, error rate) serta notifikasi peringatan otomatis (*alerting rules*).
4. Melakukan pengamanan data menggunakan *least privilege access control*, isolasi data per akun, enkripsi *at-rest* dan *in-transit*, serta perlindungan secret dengan **Azure Key Vault**.

### **1.3 Ruang Lingkup Proyek**
* **Frontend:** Dashboard responsif berbasis HTML, CSS Vanilla, dan Javascript dengan pustaka visualisasi Chart.js, dideploy di Cloudflare Pages.
* **Backend:** Azure Functions berbasis Python 3.11 dengan skema serverless consumption plan.
* **Database:** Azure Cosmos DB dengan model NoSQL (SQL API) untuk penyimpanan telemetri dan akun pengguna.
* **Keamanan:** HTTPS terenkripsi penuh melalui proxy Cloudflare, Azure Key Vault untuk penyimpanan data rahasia, serta Network Security Group (NSG) dengan konfigurasi port SSH 22 terbatas.

---

## **BAB II: Landasan Teori**

### **2.1 Cloud Computing & Hybrid Architecture**
Komputasi awan adalah penyediaan layanan komputasi (server, penyimpanan, database, jaringan, perangkat lunak) melalui internet. Proyek ini mengimplementasikan model *Hybrid Cloud* yang memadukan keunggulan **Cloudflare Pages** (distribusi CDN edge statis global) dengan **Microsoft Azure** (layanan komputasi backend, database NoSQL, dan monitoring operasional).

### **2.2 Infrastructure as Code (IaC) & Terraform**
IaC adalah metode mengelola dan menyediakan infrastruktur IT melalui file definisi mesin yang dapat dibaca, bukan konfigurasi fisik manual. **Terraform** digunakan karena portabilitasnya yang tinggi dan dukungannya yang luas terhadap provider Microsoft Azure (`azurerm`).

### **2.3 Serverless Compute (Azure Functions)**
Azure Functions adalah layanan komputasi serverless berbasis *event-driven* yang memungkinkan pengembang menjalankan potongan kecil kode tanpa harus mengelola infrastruktur server virtual secara manual. Mode *Consumption Plan (Y1)* digunakan untuk meminimalkan biaya karena tagihan hanya dihitung berdasarkan lama eksekusi kode backend.

### **2.4 NoSQL Database (Azure Cosmos DB)**
Azure Cosmos DB adalah database terdistribusi secara global yang mendukung model data NoSQL. SQL API (Core) digunakan untuk menyimpan objek JSON sensor/log telemetri secara fleksibel tanpa memerlukan skema tabel SQL yang statis.

### **2.5 Edge Proxy & Secret Management**
Keamanan merupakan aspek vital. **Azure Key Vault** memisahkan secret (seperti koneksi database dan kunci JWT) dari kode program. **Cloudflare Page Functions** bertindak sebagai proxy `/api` yang menyisipkan autentikasi internal Azure secara aman tanpa mengeksposnya ke browser klien.

---

## **BAB III: Arsitektur & Desain Sistem**

### **3.1 Diagram Topologi Jaringan & Arsitektur**
Berikut adalah desain arsitektur jaringan end-to-end yang dibangun di Microsoft Azure dan Cloudflare:

```text
  [ Browser Klien ]
         │
         ▼  (HTTPS / TLS)
  [ Cloudflare Pages / kelompok11cc.my.id ]
         │
         ▼  (Proxy /api dengan Azure Key)
  [ Cloudflare Pages Function Proxy ]
         │
         ▼  (Jalur Aman HTTPS)
  [ Azure Traffic Manager ]
         │
         ├───────►  [ Serverless Azure Functions (Primary) ]
         │               │  (Managed Identity)
         │               ├─────► Azure Key Vault
         │               ├─────► Azure Cosmos DB (users & telemetry-data)
         │               ├─────► Azure Storage Account (func_storage)
         │               └─────► Application Insights (Monitoring)
         │
         └───────►  [ Azure App Service (Secondary/Backup) ]
```

### **3.2 Pembagian Subnet & Keamanan Jaringan**
1. **Virtual Network (VNet):** `10.0.0.0/16`
2. **Subnet Publik:** `10.0.1.0/24` (Untuk VM Command Center/Admin portal).
3. **Subnet Privat:** `10.0.2.0/24` (Untuk database Cosmos DB dan backend API).
4. **Network Security Group (NSG):**
   * **NSG Publik:** Membuka port 80 (HTTP) dan port 443 (HTTPS) untuk umum, serta port 22 (SSH) dibatasi hanya untuk IP publik administrator tepercaya (`var.admin_ssh_allowed_ip`).
   * **NSG Privat:** Hanya menerima koneksi inbound dari Subnet Publik (`10.0.1.0/24`) dan menolak semua lalu lintas langsung dari internet (Default Deny).

---

## **BAB IV: Implementasi Sistem**

### **4.1 Konfigurasi Terraform (IaC)**
Seluruh infrastruktur dideklarasikan dalam format Terraform. Konfigurasi dibagi menjadi berkas-berkas modular:

* [main.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/main.tf): Deklarasi provider Azure, Resource Group, dan Virtual Machine.
* [network.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/network.tf): Mengatur VNet, Subnet, dan profil Azure Traffic Manager.
* [security.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/security.tf): Mengatur NSG, IP rules, dan instans Azure Key Vault.
* [database.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/database.tf): Mengatur Cosmos DB account, database `db-platform-monitoring`, serta container `users` dan `telemetry-data`.
* [functions.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/functions.tf): Mengatur Azure Linux Function App dengan environment variables.
* [monitoring.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/monitoring.tf): Konfigurasi Application Insights dan Alert Rules otomatis.

### **4.2 Skema Cosmos DB & Desain Dokumen JSON**
1. **Container `users`** (Partition Key: `/email`):
   ```json
   {
     "id": "guid-user-id",
     "doc_type": "user",
     "name": "Naufal",
     "email": "naufal@gmail.com",
     "role": "user",
     "password_hash": "pbkdf2_sha256$160000$salt$hash",
     "created_at": "ISO-Timestamp",
     "last_login_at": "ISO-Timestamp"
   }
   ```
2. **Container `telemetry-data`** (Partition Key: `/deviceId`):
   ```json
   {
     "id": "guid-record-id",
     "doc_type": "telemetry",
     "deviceId": "device-01",
     "source_file": "data.csv",
     "processed_at": "ISO-Timestamp",
     "status": "processed",
     "category": "sensor",
     "owner_user_id": "guid-user-id",
     "raw": {
       "deviceId": "device-01",
       "temperature": 25.5,
       "level": "info",
       "message": "System check"
     }
   }
   ```

### **4.3 Implementasi Backend API**
Backend dibangun menggunakan pustaka bawaan python tanpa framework eksternal besar untuk mempercepat *cold start*. Pemrosesan JSON dan kompilasi parsing CSV/Excel diimplementasikan pada `src/backend/function_app.py`. Autentikasi didukung token JWT custom dengan masa berlaku (TTL) selama 8 jam.

---

## **BAB V: Pengujian Fungsional & Pemrosesan Data Science**

### **5.1 Skenario Pengujian API & Hasil**
Pengujian otomatis dilakukan untuk 5 skenario utama:
1. **Health Check (`GET /api/hello`):** Memastikan response `200 OK` dan status "online".
2. **User Registration (`POST /api/register`):** Membuat akun baru dengan role default `user`.
3. **User Authentication (`POST /api/login`):** Validasi password dan menerbitkan JWT token.
4. **Data Upload (`POST /api/upload`):** Mengunggah dataset dan menyimpannya di bawah lisensi isolasi user.
5. **Role-Based Access Control:** Memastikan user biasa tidak bisa membuka `/api/management/users` (hanya role `admin`).

### **5.2 Pembersihan Data Science secara Otomatis**
Ketika pengguna menekan tombol **"Bersihkan"** di UI, backend akan menjalankan algoritma pembersihan data secara berurutan:
1. **Pembersihan String:** Spasi di awal dan akhir dihapus (*trimmed*).
2. **Pembersihan Nilai Kosong (*Missing Value*):** Baris data yang memiliki nilai kosong pada kolom mana pun akan otomatis dilewati/dihapus agar tidak merusak akurasi pemodelan.
3. **Pembersihan Nilai Pencilan (*Outliers*):** 
   * Menggunakan metode matematis **Interquartile Range (IQR)**:
     $$IQR = Q_3 - Q_1$$
     $$\text{Batas Bawah} = Q_1 - 1.5 \times IQR$$
     $$\text{Batas Atas} = Q_3 + 1.5 \times IQR$$
   * Semua baris data dengan nilai numerik di luar batas bawah dan batas atas akan disaring dan dibuang dari database.
4. **Visualisasi Histogram Bersih:** Hasil visualisasi grafik histogram dan koefisien korelasi Pearson di dashboard akan secara langsung menggambarkan data bersih tersebut.

---

## **BAB VI: Monitoring, Keamanan, & Cost Management**

### **6.1 Konfigurasi Observability (Application Insights)**
Azure Application Insights digunakan untuk mencatat dan melacak performa sistem. Log dikelompokkan secara terpusat di Log Analytics Workspace.
* Peringatan Latensi tinggi (> 2 detik) akan memicu Azure Monitor Alert.
* Kegagalan HTTP 5xx pada serverless backend akan mengirim notifikasi email otomatis ke tim operasional (`alert_email`).

### **6.2 Security Audit & Hardening SSH Port 22**
Audit keamanan awal mendeteksi port SSH 22 VM terbuka untuk internet publik. Tim segera mengimplementasikan perbaikan pada [security.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/security.tf) dengan membatasi akses SSH inbound hanya untuk IP publik spesifik administrator via parameter `var.admin_ssh_allowed_ip`.

### **6.3 Cost Analysis & Optimasi Biaya**
Untuk mengontrol pengeluaran cloud agar tetap di dalam skema gratis/murah untuk tugas kuliah, kami menerapkan:
1. **Azure Functions Consumption Plan:** Biaya hanya dihitung per eksekusi (menghilangkan biaya server idle).
2. **Cosmos DB Serverless Mode:** Biaya per 1 juta Request Unit (RU), sangat murah dibandingkan model *provisioned throughput*.
3. **Penjadwalan Matikan VM:** Virtual Machine admin dimatikan secara otomatis saat tidak digunakan untuk uji coba atau demo.

---

## **BAB VII: Penutup & Kesimpulan**

### **7.1 Kesimpulan**
Layanan pengolahan data telemetri berbasis cloud ini berhasil dibangun menggunakan arsitektur hybrid Microsoft Azure dan Cloudflare. Penerapan pembersihan data science (*missing values* dan *outliers* via IQR) berjalan dengan akurat di backend serverless. Infrastruktur IaC Terraform terbukti dapat mereproduksi seluruh jaringan dan server secara konsisten dan aman.

### **7.2 Keterbatasan Proyek**
* Pemrosesan data berukuran 100 MB memerlukan waktu beberapa detik pada mode cold start Azure Functions Serverless.
* Visualisasi grafik korelasi dibatasi hanya untuk kolom numerik utama demi kenyamanan tampilan visual dashboard.

### **7.3 Saran Pengembangan**
* Implementasi integrasi Azure Event Hubs untuk menangani antrean data jika data yang masuk berupa data streaming kontinu (realtime IoT).
* Penggunaan model machine learning tersemat untuk mendeteksi anomali telemetri secara prediktif.

---

## **Daftar Pustaka**
1. Microsoft. (2025). *Azure Functions Documentation*. https://learn.microsoft.com/en-us/azure/azure-functions/
2. HashiCorp. (2025). *Terraform Provider for Azure*. https://registry.terraform.io/providers/hashicorp/azurerm/latest
3. Cloudflare. (2025). *Cloudflare Pages & Functions Documentation*. https://developers.cloudflare.com/pages/
4. Han, J., Kamber, M., & Jian, P. (2012). *Data Mining: Concepts and Techniques Third Edition*. Morgan Kaufmann.

---

## **Lampiran**

### **Lampiran 1: Form Refleksi Kelompok 11**
* **Naufal Ihsan Sriyanto (DevOps Engineer / Owner):** Mengelola konfigurasi deployment Terraform, GitHub Actions CI/CD, konfigurasi domain Cloudflare, dan integrasi Key Vault.
* **Arifin (Backend Dev):** Mengembangkan REST API di Azure Functions, logika autentikasi JWT, database Cosmos DB, dan algoritma pembersihan IQR.
* **Anggota 3 & 4:** Membantu penyusunan UI dashboard statis dan penyusunan dokumen laporan mingguan.

### **Lampiran 2: Daftar Berkas Pendukung (Evidence)**
* Portal Dashboard Screenshot: [ui-user-preview.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/ui-user-preview.png)
* Portal Admin Screenshot: [ui-admin-preview.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/ui-admin-preview.png)
* Bukti Metrik App Insights: [week4-application-insights-metrics.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/week4-application-insights-metrics.png)
* Bukti Notifikasi Alert: [week4-alert-rules-action-group.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/week4-alert-rules-action-group.png)
