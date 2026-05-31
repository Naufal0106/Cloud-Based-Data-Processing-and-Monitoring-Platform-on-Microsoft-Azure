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
Perkembangan teknologi *cloud computing* telah mengubah cara organisasi mengelola data skala besar secara realtime. Kecepatan pengumpulan data dari sensor, log aplikasi, dan aktivitas pengguna menuntut infrastruktur yang cepat, aman, scalable, serta mudah dimonitor.

Dalam proyek ini, Kelompok 11 merancang dan mengimplementasikan **Cloud-Based Data Processing & Monitoring Platform**. Sistem ini memproses unggahan file data hingga 100 MB dalam format CSV, JSON, XLSX, dan XLS, menjalankan analisis kualitas data, melakukan cleaning otomatis jika diminta, dan memvisualisasikan hasilnya ke dashboard interaktif.

Pendekatan *Hybrid Cloud* dipilih dengan menempatkan static frontend pada **Cloudflare Pages** untuk efisiensi biaya dan distribusi global, sementara backend serverless, failover backend, database NoSQL, storage, secret management, dan observability dijalankan di atas **Microsoft Azure**.

### **1.2 Tujuan Proyek**
1. Membangun platform pemrosesan data berbasis cloud yang dapat menangani file hingga 100 MB secara aman.
2. Menerapkan prinsip *Infrastructure as Code* menggunakan **Terraform** untuk mendokumentasikan dan mereproduksi resource Azure.
3. Menyediakan dashboard monitoring untuk CPU/memory, request rate, latency, error rate, storage transactions, dan metrik Cosmos DB.
4. Mengamankan data menggunakan role-based access control, isolasi data per akun, Cloudflare proxy, Azure Key Vault, dan managed identity.

### **1.3 Ruang Lingkup Proyek**
* **Frontend:** Dashboard responsif berbasis HTML, CSS, JavaScript, dan Chart.js, dideploy di Cloudflare Pages.
* **Edge Proxy:** Cloudflare Pages Function `/api/*` sebagai proxy same-origin yang menyimpan Azure Function key di sisi server.
* **Backend Primary:** Azure Functions Python 3.11 dengan skema serverless consumption plan.
* **Backend Failover:** Azure Traffic Manager dengan Azure Functions sebagai priority 1 dan Azure App Service backup minimal sebagai priority 2.
* **Database:** Azure Cosmos DB for NoSQL untuk penyimpanan telemetry dan akun pengguna.
* **Keamanan dan Monitoring:** Azure Key Vault, Application Insights, Azure Monitor, diagnostic settings, action group, dan lifecycle policy.

---

## **BAB II: Landasan Teori**

### **2.1 Cloud Computing & Hybrid Architecture**
Komputasi awan adalah penyediaan layanan komputasi melalui internet. Proyek ini mengimplementasikan model *Hybrid Cloud* yang memadukan Cloudflare Pages untuk frontend/edge delivery dan Microsoft Azure untuk backend, data layer, security, monitoring, dan failover.

### **2.2 Infrastructure as Code (IaC) & Terraform**
IaC adalah metode mengelola infrastruktur melalui file deklaratif. Terraform digunakan karena mendukung provider Microsoft Azure (`azurerm`) dan memudahkan audit resource yang dibuat.

### **2.3 Serverless Compute (Azure Functions)**
Azure Functions adalah layanan komputasi serverless berbasis event-driven. Mode Consumption Plan (Y1) digunakan agar biaya mengikuti jumlah eksekusi API dan proses data.

### **2.4 NoSQL Database (Azure Cosmos DB)**
Azure Cosmos DB mendukung model data NoSQL berbentuk JSON. SQL API digunakan untuk menyimpan telemetry hasil pemrosesan dan data user login/register.

### **2.5 Edge Proxy & Secret Management**
Cloudflare Pages Function bertindak sebagai proxy `/api/*` agar browser tidak melihat Azure Function URL dan function key. Azure Key Vault memisahkan secret seperti connection string Cosmos DB dan `AUTH_TOKEN_SECRET` dari source code.

---

## **BAB III: Arsitektur & Desain Sistem**

### **3.1 Diagram Topologi dan Arsitektur**
Diagram visual final tersedia pada:

```text
docs/evidence/arsitektur-final.png
```

Path lama berikut dipertahankan sebagai kompatibilitas dan berisi diagram yang sama:

```text
docs/evidence/architecture-final-target.png
```

Topologi final:

```text
[External Users]
       |
       v
[Cloudflare DNS + CDN]
       |
       v
[Cloudflare Pages Dashboard]
       |
       v
[Cloudflare Pages Function Proxy /api/*]
       |
       v
[Azure Traffic Manager - backend failover]
       |
       +--> Priority 1: Azure Functions primary backend
       |        +--> /api/upload, /api/analyze, /api/data, /api/analytics
       |        +--> auth/login/register
       |        +--> Blob trigger process_blob
       |        +--> Azure Blob Storage raw-data
       |        +--> Azure Cosmos DB db-platform-monitoring
       |        |      +-- telemetry-data
       |        |      +-- users
       |        +--> Azure Key Vault
       |        +--> Application Insights / Azure Monitor
       |
       +--> Priority 2: Azure App Service backup minimal
                +--> /api/hello
                +--> /api/fallback-status
```

### **3.2 Jaringan dan Resource Eksplorasi Minggu 2**
1. **Virtual Network (VNet):** `10.0.0.0/16`.
2. **Subnet Publik:** `10.0.1.0/24`, digunakan untuk resource eksplorasi Minggu 2 seperti VM.
3. **Subnet Privat:** `10.0.2.0/24`, disiapkan sebagai cadangan untuk private endpoint/resource internal jika proyek dikembangkan.
4. **NSG:** Menjadi baseline kontrol inbound untuk subnet publik dan privat.

Catatan penting: VM, Public IP, dan NIC dipakai untuk eksplorasi target Minggu 2 saja. Runtime final aplikasi tidak bergantung pada VM. Azure Functions, Cosmos DB, Blob Storage, dan Key Vault pada implementasi final saat ini tidak diklaim berjalan di subnet privat.

---

## **BAB IV: Implementasi Sistem**

### **4.1 Konfigurasi Terraform (IaC)**
Seluruh infrastruktur Azure dideklarasikan dalam Terraform:

* [main.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/main.tf): Provider Azure, Resource Group, VNet, subnet, VM eksplorasi M2, dan Application Insights.
* [network.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/network.tf): Azure Traffic Manager dan endpoint failover backend.
* [security.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/security.tf): NSG, Azure Key Vault, access policy, dan secret.
* [database.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/database.tf): Cosmos DB account, database `db-platform-monitoring`, container `users`, dan container `telemetry-data`.
* [functions.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/functions.tf): Azure Linux Function App, Consumption Plan, app settings, dan container `raw-data`.
* [appservice.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/appservice.tf): Azure App Service backup minimal sebagai secondary backend.
* [monitoring.tf](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/infra/monitoring.tf): Action group, alert rules, diagnostic settings, dan storage lifecycle policy.

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
Backend dibangun pada `src/backend/function_app.py` menggunakan Azure Functions Python programming model. Endpoint utama meliputi:

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/hello` | Health check |
| POST | `/api/register` | Registrasi user role `user` |
| POST | `/api/login` | Login dan penerbitan token sesi |
| GET | `/api/me` | Profil user aktif |
| GET | `/api/stats` | Statistik data |
| GET | `/api/data` | Data terbaru |
| POST | `/api/analyze` | Analisis file tanpa menyimpan |
| GET | `/api/analytics` | Profiling, quality report, dan chart |
| POST | `/api/upload` | Upload file JSON, CSV, XLSX, atau XLS |
| GET | `/api/management/summary` | Ringkasan admin |
| GET | `/api/management/users` | Admin-only daftar user |
| PATCH/POST | `/api/management/users/{user_id}/role` | Admin-only update role |
| GET | `/api/dev/ops-summary` | Dev/admin-only monitoring Azure dan Cloudflare |
| GET | `/api/management/ops-summary` | Alias monitoring dev/admin |

---

## **BAB V: Pengujian Fungsional & Pemrosesan Data Science**

### **5.1 Skenario Pengujian API & Hasil**
Pengujian dilakukan untuk skenario utama:

1. **Health Check (`GET /api/hello`):** Memastikan response sukses.
2. **User Registration (`POST /api/register`):** Membuat akun baru dengan role default `user`.
3. **User Authentication (`POST /api/login`):** Validasi password dan menerbitkan token sesi.
4. **Data Analysis (`POST /api/analyze`):** Menganalisis kualitas file tanpa menyimpan data.
5. **Data Upload (`POST /api/upload`):** Mengunggah dataset dan menyimpannya dengan metadata pemilik akun.
6. **Analytics (`GET /api/analytics`):** Menghasilkan profiling, quality report, dan chart dari data tersimpan.
7. **Role-Based Access Control:** Memastikan user biasa tidak bisa membuka `/api/management/users`.
8. **Fallback Backend:** Memastikan App Service backup menjawab `/api/hello` dan `/api/fallback-status`.

### **5.2 Pembersihan Data Science secara Otomatis**
Ketika pengguna memilih proses cleaning, backend menjalankan:

1. **Pembersihan String:** Spasi di awal dan akhir dihapus.
2. **Pembersihan Nilai Kosong:** Cell kosong dikonversi menjadi `null`; record dengan missing value dapat disaring saat cleaning.
3. **Pembersihan Duplikat:** Record duplikat dihapus berdasarkan representasi canonical.
4. **Deteksi Outlier Numerik:** Kolom numerik menggunakan batas Interquartile Range (IQR) untuk menyaring nilai pencilan.
5. **Visualisasi:** Dashboard menampilkan distribusi status, kategori, missing value per kolom, histogram numerik, top values, dan korelasi numerik.

---

## **BAB VI: Monitoring, Keamanan, & Cost Management**

### **6.1 Konfigurasi Observability**
Application Insights dan Azure Monitor digunakan untuk mencatat request, latency, error, storage transactions, Cosmos DB metrics, serta metrik resource lain. Diagnostic settings mengirim log Function App, Cosmos DB, dan Blob Storage ke Log Analytics Workspace.

Alert utama:

| Alert | Target | Tujuan |
| --- | --- | --- |
| Function 5xx Error | Azure Functions | Deteksi error backend |
| Function Latency | Azure Functions | Deteksi penurunan performa |
| VM CPU High | VM eksplorasi M2 | Bukti alert resource eksplorasi jika VM aktif |

### **6.2 Security Audit**
Baseline keamanan yang diterapkan:

* Browser hanya memanggil `/api/*`; function key berada di Cloudflare environment variable.
* Cosmos connection string dan auth token secret berada di Key Vault.
* Password disimpan dengan hash PBKDF2.
* Token login ditandatangani dengan `AUTH_TOKEN_SECRET`.
* Register publik hanya membuat role `user`; role `dev` dan `admin` dikelola lewat kontrol internal.
* User biasa hanya membaca data miliknya sendiri.
* Managed identity Function App digunakan untuk Key Vault dan Azure Monitor metrics.
* VM hanya resource eksplorasi M2. Jika masih dinyalakan, SSH harus dibatasi ke IP admin dan sebaiknya memakai SSH key.

### **6.3 Cost Analysis & Optimasi Biaya**
1. **Domain:** Custom domain `kelompok11cc.my.id` menjadi biaya tetap tahunan.
2. **Cloudflare Pages:** Mengurangi kebutuhan compute Azure untuk frontend.
3. **Azure Functions Consumption Plan:** Biaya mengikuti eksekusi API.
4. **Cosmos DB Serverless:** Cocok untuk traffic kecil/proyek.
5. **Azure App Service Backup Minimal:** Memberikan endpoint fallback tanpa menjalankan VM sebagai backend aktif.
6. **Storage Lifecycle Policy:** Mengontrol retensi file mentah pada Blob Storage.
7. **VM Eksplorasi M2:** Dapat dimatikan saat tidak diperlukan karena bukan runtime final.

---

## **BAB VII: Penutup & Kesimpulan**

### **7.1 Kesimpulan**
Platform berhasil dibangun menggunakan arsitektur hybrid Cloudflare dan Microsoft Azure. Jalur final menggunakan Cloudflare DNS/CDN, Cloudflare Pages, Cloudflare Pages Function proxy, Azure Functions, Azure Traffic Manager, Azure App Service backup minimal, Blob Storage, Cosmos DB, Key Vault, dan Application Insights/Azure Monitor.

### **7.2 Keterbatasan Proyek**
* Pemrosesan data berukuran 100 MB dapat terdampak cold start Azure Functions.
* Visualisasi grafik korelasi dibatasi pada kolom numerik utama.
* App Service backup saat ini hanya menyediakan endpoint health/fallback minimal, bukan failover penuh untuk semua API data processing.
* PDF/ODT laporan perlu diekspor ulang dari Markdown final jika dibutuhkan untuk pengumpulan.

### **7.3 Saran Pengembangan**
* Perluas App Service backup jika failover penuh dibutuhkan.
* Tambahkan private endpoint dan VNet integration untuk production.
* Gunakan queue/event streaming jika data masuk menjadi realtime dan kontinu.
* Tambahkan model machine learning untuk deteksi anomali prediktif.

---

## **Daftar Pustaka**
1. Microsoft. (2025). *Azure Functions Documentation*. https://learn.microsoft.com/en-us/azure/azure-functions/
2. HashiCorp. (2025). *Terraform Provider for Azure*. https://registry.terraform.io/providers/hashicorp/azurerm/latest
3. Cloudflare. (2025). *Cloudflare Pages & Functions Documentation*. https://developers.cloudflare.com/pages/
4. Microsoft. (2025). *Azure Traffic Manager Documentation*. https://learn.microsoft.com/en-us/azure/traffic-manager/
5. Han, J., Kamber, M., & Jian, P. (2012). *Data Mining: Concepts and Techniques Third Edition*. Morgan Kaufmann.

---

## **Lampiran**

### **Lampiran 1: Form Refleksi Kelompok 11**
* **Naufal Ihsan Sriyanto (DevOps Engineer / Owner):** Mengelola konfigurasi deployment Terraform, GitHub Actions CI/CD, konfigurasi domain Cloudflare, dan integrasi Key Vault.
* **Zhykwa Ceryl Mavanudin (Cloud Architect):** Menyusun arsitektur cloud, network baseline, dan desain failover.
* **Muhammad Arifin Ilham (Backend Developer):** Mengembangkan REST API Azure Functions, autentikasi, integrasi Cosmos DB, upload, analytics, dan processing data.
* **Rendy Saputra (Security Engineer):** Menyusun IAM, Key Vault, NSG, dan security review.

### **Lampiran 2: Daftar Berkas Pendukung (Evidence)**
* Diagram Arsitektur Final: [arsitektur-final.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/arsitektur-final.png)
* Portal Dashboard Screenshot: [ui-user-preview.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/ui-user-preview.png)
* Portal Admin Screenshot: [ui-admin-preview.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/ui-admin-preview.png)
* Bukti Metrik App Insights: [week4-application-insights-metrics.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/week4-application-insights-metrics.png)
* Bukti Notifikasi Alert: [week4-alert-rules-action-group.png](file:///e:/semester%206/Cloud-Based-Data-Processing-and-Monitoring-Platform-on-Microsoft-Azure/docs/evidence/week4-alert-rules-action-group.png)

### **Lampiran 3: Catatan Ekspor PDF/ODT**
Sumber kebenaran laporan berada pada file Markdown ini. File `docs/Laporan_Teknis_Akhir_Kelompok_11.pdf` dan `docs/Laporan_Teknis_Akhir_Kelompok_11.odt` perlu diekspor ulang dari Markdown final jika dibutuhkan untuk pengumpulan.
