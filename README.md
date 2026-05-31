# Cloud-Based Data Processing & Monitoring Platform

**Final Project Cloud Computing - Teknik Informatika UPR**

Platform ini adalah sistem pemrosesan dan monitoring data berbasis cloud. Frontend dashboard dideploy di **Cloudflare Pages**, sedangkan backend, database, storage, secrets, dan observability berjalan di **Microsoft Azure**.

Domain production proyek:

```text
https://kelompok11cc.my.id
```

## Tim Proyek

| Nama | Peran |
| --- | --- |
| Naufal Ihsan Sriyanto | DevOps Engineer |
| Zhykwa Ceryl Mavanudin | Cloud Architect |
| Muhammad Arifin Ilham | Backend Developer |
| Rendy Saputra | Security Engineer |

## Ringkasan Arsitektur

Proyek ini menggunakan pendekatan hybrid deployment:

- **Cloudflare DNS + CDN** untuk routing domain dan caching dashboard.
- **Cloudflare Pages** untuk hosting dashboard statis.
- **Cloudflare Pages Function** untuk proxy same-origin `/api/*` agar function key tidak terlihat di browser.
- **Azure Functions** untuk API dan pemrosesan data serverless.
- **Azure Traffic Manager** untuk routing/failover backend ke primary Azure Functions dan secondary Azure App Service.
- **Azure App Service** sebagai backend cadangan minimal untuk health/fallback.
- **Azure Blob Storage** untuk file mentah JSON, CSV, dan Excel pada container `raw-data`.
- **Azure Cosmos DB for NoSQL** untuk menyimpan hasil data yang sudah diproses dan data user dashboard.
- **Azure Key Vault** untuk menyimpan secret Cosmos DB connection string.
- **Azure Application Insights** untuk observability backend.
- **Azure Monitor, diagnostic settings, action group, dan lifecycle policy** untuk monitoring, log terpusat, alert, dan optimasi retensi.
- **Terraform** untuk provisioning infrastruktur Azure.
- **GitHub Actions** untuk deployment backend ke Azure Functions.

```text
User
  |
  v
Cloudflare DNS + CDN
  |
  v
Cloudflare Pages Dashboard
  |
  v
Cloudflare Pages Function Proxy /api/*
  |
  v
Azure Traffic Manager (failover backend)
  |
  +--> Priority 1: Azure Functions API
  |       +--> Azure Blob Storage raw-data
  |       +--> Azure Cosmos DB
  |       +--> Azure Key Vault
  |       +--> Application Insights / Azure Monitor
  |
  +--> Priority 2: Azure App Service backup
          +--> /api/hello
          +--> /api/fallback-status
```

## Alur Data

1. User membuka dashboard dari Cloudflare Pages.
2. Dashboard memanggil proxy same-origin `/api/*` pada Cloudflare Pages Function.
3. Proxy meneruskan request ke backend Azure. Jalur aktif mengarah ke Azure Functions; Traffic Manager mendukung failover ke App Service backup.
4. Data batch dapat diproses melalui:
   - upload langsung ke endpoint `POST /api/upload`, atau
   - file baru pada Blob Storage container `raw-data`.
5. Azure Functions melakukan parsing, enrichment, cleaning jika diminta, klasifikasi data, dan penyimpanan hasil.
6. Hasil proses disimpan ke Cosmos DB container `telemetry-data`; data user login/register berada di container `users`.
7. Dashboard membaca data, statistik, analytics, dan chart melalui endpoint API.

## Fitur Utama

- Dashboard monitoring data berbasis HTML, CSS, dan JavaScript.
- Login dan register user sebelum mengakses dashboard.
- Upload file JSON, CSV, XLSX, dan XLS dari dashboard.
- Data science processing untuk profiling data, quality check, cleaning otomatis, statistik kolom, dan chart eksplorasi.
- Blob trigger untuk pemrosesan otomatis file JSON, CSV, XLSX, dan XLS.
- HTTP API untuk data, statistik, upload, dan health check.
- Deteksi kategori data:
  - `sensor` jika record memiliki field `temperature`.
  - `log` jika record memiliki field `level` dan `message`.
  - `generic` untuk format lain.
- Deteksi anomali suhu di atas 80 derajat Celsius.
- Deteksi error log untuk level `ERROR` dan `CRITICAL`.

## Endpoint Backend

Frontend tidak memanggil Azure Functions secara langsung. Dashboard memanggil endpoint proxy same-origin `/api`, lalu Cloudflare Pages Function meneruskan request ke Azure Functions menggunakan secret environment Cloudflare.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/hello` | Health check backend tanpa function key |
| POST | `/api/register` | Registrasi user baru |
| POST | `/api/login` | Login dan mendapatkan token sesi |
| GET | `/api/me` | Mengambil profil user dari token sesi |
| GET | `/api/stats` | Mengambil statistik total record, processed, anomaly, dan error |
| GET | `/api/data?limit=50` | Mengambil data terbaru |
| GET | `/api/data?status=processed&limit=50` | Mengambil data berdasarkan status |
| GET | `/api/analytics?limit=200` | Mengambil profil, kualitas, dan chart dari data tersimpan |
| POST | `/api/analyze` | Menganalisis file upload tanpa menyimpan data |
| POST | `/api/upload` | Upload JSON, CSV, XLSX, atau XLS langsung untuk diproses |
| POST | `/api/upload?clean=true` | Membersihkan data otomatis sebelum diproses dan disimpan |
| GET | `/api/management/summary` | Admin-only: ringkasan user, role, dan telemetry |
| GET | `/api/management/users` | Admin-only: melihat daftar user |
| PATCH/POST | `/api/management/users/{user_id}/role` | Admin-only: mengubah role user |
| GET | `/api/dev/ops-summary` | Dev/admin-only: ringkasan Azure Monitor dan Cloudflare workload |
| GET | `/api/management/ops-summary` | Dev/admin-only: alias ringkasan monitoring |

Endpoint `stats`, `data`, dan `upload` di Azure tetap menggunakan `auth_level=FUNCTION`, tetapi function key tidak disimpan di frontend.

## Role User, Developer, dan Admin

Dashboard memakai satu domain yang sama, yaitu `kelompok11cc.my.id`. Domain admin atau developer tidak wajib dibuat terpisah karena akses dibedakan lewat role login.

Role yang digunakan:

| Role | Akses |
| --- | --- |
| `user` | Login, melihat dashboard, membaca data/statistik, dan upload data |
| `dev` | Melihat dashboard developer monitoring: CPU, memory, request rate, latency, error rate, dan centralized logging |
| `admin` | Mengelola daftar user dan mengubah role `user`, `dev`, atau `admin` |

Register publik selalu membuat akun dengan role `user`. Akun `dev` dan `admin` tidak bisa dibuat dari form register publik agar tidak disalahgunakan.

Dashboard developer digunakan sebagai dashboard monitoring:

- CPU usage dari Azure Monitor,
- memory/working set,
- request rate backend,
- latency rata-rata,
- error rate HTTP 5xx,
- transaksi Blob Storage,
- request dan availability Cosmos DB.

Data operasional ini diambil oleh backend admin endpoint. Token Cloudflare, subscription Azure, dan identifier resource tidak ditaruh di frontend.

## Format Upload

Dashboard menerima file:

- `.json`: object tunggal atau array record.
- `.csv`: baris pertama wajib berisi header kolom.
- `.xlsx` dan `.xls`: sheet pertama dipakai, baris pertama wajib berisi header kolom.

Batas upload saat ini adalah 100 MB dan 1,000,000 baris data per file. Kolom yang disarankan:

| Kolom | Fungsi |
| --- | --- |
| `deviceId` / `device_id` / `device` | Identitas perangkat atau sumber data |
| `temperature` | Dipakai untuk kategori `sensor` dan deteksi anomali suhu |
| `level` + `message` | Dipakai untuk kategori `log` dan deteksi error |

Repo tidak menyertakan sample data bawaan agar akun baru mulai dari dashboard kosong. Untuk uji upload, gunakan file JSON/CSV/Excel lokal dengan format di atas.

## Data Science Processing

Dashboard menyediakan panel **Data Science Processing** untuk melihat kualitas data sebelum dan sesudah upload. Fitur yang tersedia:

- Profiling kolom: tipe data, jumlah nilai kosong, unique value, dan top values.
- Quality score untuk mendeteksi missing value, duplikat, tipe campuran, dan nilai suhu tidak valid.
- Cleaning otomatis: trim spasi, mengubah cell kosong menjadi null, konversi angka berbentuk teks, dan hapus duplikat.
- Chart eksplorasi: distribusi status, missing value per kolom, histogram numerik, distribusi kategori, dan korelasi numerik dari backend.

Alur upload yang direkomendasikan:

1. Pilih file JSON, CSV, XLSX, atau XLS.
2. Klik **Analisis Data**.
3. Jika quality issue muncul, pilih **Bersihkan & Proses**.
4. Jika data sudah siap atau ingin menyimpan apa adanya, pilih **Proses Apa Adanya**.

Data telemetry di dashboard dibatasi berdasarkan akun login. Role `user` hanya melihat data yang ia upload sendiri, sehingga akun baru mulai dari statistik dan tabel kosong. Role `admin` dapat melihat seluruh telemetry untuk kebutuhan monitoring.

## Tech Stack

| Layer | Teknologi | Peran |
| --- | --- | --- |
| Frontend | Cloudflare Pages, HTML, CSS, JavaScript, Chart.js | Dashboard monitoring |
| Backend | Azure Functions Python 3.11 | API dan serverless data processing |
| Storage | Azure Blob Storage | Penyimpanan file mentah JSON, CSV, dan Excel |
| Database | Azure Cosmos DB for NoSQL | Penyimpanan hasil olah data |
| Secrets | Azure Key Vault | Penyimpanan connection string |
| Monitoring | Azure Application Insights | Log dan observability backend |
| Failover | Azure Traffic Manager, Azure App Service | Routing backend dan endpoint cadangan minimal |
| Infrastructure | Terraform AzureRM | Provisioning resource Azure |
| CI/CD | GitHub Actions | Deploy backend ke Azure Functions |

## Struktur Repositori

```text
.
|-- .github/
|   `-- workflows/
|       `-- deploy-backend.yaml
|-- docs/
|   |-- evidence/
|   |   |-- arsitektur-final.png
|   |   `-- architecture-final-target.png
|   |-- architecture-notes.md
|   |-- deployment-guide.md
|   |-- iam-config.md
|   |-- network-plan.md
|   |-- progress-report.md
|   |-- resource-inventory.md
|   |-- week1-planning.md
|   |-- week2-infrastructure.md
|   |-- week3-core-services.md
|   `-- week4-monitoring-security-optimization.md
|-- infra/
|   |-- README.md
|   |-- backend.tf
|   |-- database.tf
|   |-- evidence.tf
|   |-- functions.tf
|   |-- iam.tf
|   |-- locals.tf
|   |-- main.tf
|   |-- monitoring.tf
|   |-- network.tf
|   |-- security.tf
|   |-- storage.tf
|   `-- variables.tf
|-- src/
|   |-- backend/
|   |   |-- function_app.py
|   |   |-- host.json
|   |   `-- requirements.txt
|   `-- dashboard/
|       |-- env.example.js
|       |-- index.html
|       |-- script.js
|       `-- style.css
|-- functions/
|   `-- api/
|       `-- [[path]].js
|-- .gitignore
`-- README.md
```

## Backend

Backend berada di `src/backend` dan menggunakan Azure Functions Python programming model.

File utama:

- `function_app.py`: definisi semua trigger dan logic pemrosesan.
- `requirements.txt`: dependency Python Azure SDK.
- `host.json`: konfigurasi runtime Azure Functions.

Function yang tersedia:

- `process_blob`: Blob trigger untuk container `raw-data`.
- `register_user`: HTTP POST untuk registrasi user.
- `login_user`: HTTP POST untuk login user.
- `get_current_user`: HTTP GET untuk validasi token user.
- `get_data`: HTTP GET untuk mengambil data dari Cosmos DB.
- `get_stats`: HTTP GET untuk statistik record.
- `get_analytics`: HTTP GET untuk profiling, quality report, dan chart dari data tersimpan.
- `analyze_upload`: HTTP POST untuk analisis file tanpa menyimpan data.
- `upload_data`: HTTP POST untuk upload JSON, CSV, XLSX, dan XLS langsung.
- `get_management_summary`: HTTP GET admin-only untuk ringkasan role dan telemetry.
- `list_admin_users`: HTTP GET admin-only untuk daftar user.
- `update_admin_user_role`: HTTP PATCH/POST admin-only untuk mengubah role.
- `get_developer_ops_summary`: HTTP GET dev/admin untuk Azure Monitor dan Cloudflare analytics.
- `hello`: health check sederhana.

## Frontend

Frontend berada di `src/dashboard` dan berupa static dashboard.

File utama:

- `index.html`: struktur halaman dashboard.
- `style.css`: styling dashboard.
- `script.js`: konfigurasi API, auth, fetch data, upload file, data science processing, dan chart.
- `env.example.js`: contoh konfigurasi frontend agar memanggil proxy `/api`.

Konfigurasi API frontend dibaca dari variable global browser:

```js
window.DATA_API_BASE = "/api";
```

Untuk local deployment, salin `src/dashboard/env.example.js` menjadi `src/dashboard/env.js` jika ingin override path proxy. File `env.js` sudah masuk `.gitignore`. Nilai `DATA_API_BASE` harus path same-origin seperti `/api`; URL eksternal akan diabaikan oleh dashboard agar token tidak terkirim ke domain lain.

Untuk deployment publik, simpan `AZURE_FUNCTION_URL` dan `AZURE_FUNCTION_KEY` sebagai environment variable Cloudflare Pages Function, bukan di frontend.

Untuk mengaktifkan data real pada dashboard admin, set environment variable berikut di Azure Function App:

```text
AZURE_SUBSCRIPTION_ID
AZURE_RESOURCE_GROUP
AZURE_FUNCTION_APP_NAME
AZURE_STORAGE_ACCOUNT_NAME
AZURE_COSMOS_ACCOUNT_NAME
AZURE_VM_NAME
CLOUDFLARE_ZONE_ID
CLOUDFLARE_API_TOKEN
```

`AZURE_VM_NAME` hanya relevan jika metrik VM eksplorasi Minggu 2 masih ingin ditampilkan pada dashboard developer. VM bukan jalur runtime aplikasi final.

`CLOUDFLARE_API_TOKEN` harus disimpan sebagai secret backend/Azure App Setting atau Key Vault reference, bukan di repository dan bukan di frontend.

Managed identity Azure Function App diberi role `Monitoring Reader` pada resource group agar endpoint admin dapat membaca Azure Monitor metrics tanpa menyimpan Azure credential manual.

Logging terpusat Minggu 4 direpresentasikan di Terraform melalui diagnostic settings pada Azure Function App, Cosmos DB, dan Blob Storage ke Log Analytics/Azure Monitor.

Catatan lokal: `AGENTS.md` dipakai sebagai catatan kerja agent di mesin developer dan sengaja masuk `.gitignore`, sehingga tidak menjadi bagian dari dokumentasi publik repository.

## Infrastruktur Azure

Folder `infra` berisi konfigurasi Terraform untuk resource Azure:

- Resource Group: `RG-Kelompok11`
- Region: `southeastasia`
- Virtual Network: `VNet-Utama-Kelompok11`
- Subnet publik dan privat sebagai fondasi jaringan Minggu 2
- Linux VM untuk eksplorasi target Minggu 2, bukan workload runtime final
- Azure Function App: `func-backend-monitoring-k11`
- Azure App Service backup: `app-backend-backup-k11`
- Azure Storage Account untuk Function App dan Blob trigger
- Cosmos DB account, database, container `telemetry-data`, dan container `users`
- Key Vault untuk secret Cosmos DB
- Key Vault secret `auth-token-secret` untuk tanda tangan token login
- Application Insights untuk monitoring
- Azure Monitor action group dan 3 alert rule operasional
- Azure Monitor diagnostic settings untuk centralized logging ke Log Analytics
- Storage lifecycle policy untuk optimasi retensi file mentah
- Traffic Manager untuk backend routing/failover ke Azure Functions dan App Service backup
- NSG untuk subnet publik dan privat
- RBAC/IAM untuk anggota tim

File Terraform di folder `infra` ikut dicommit sebagai bukti program/IaC. Nilai sensitif tetap tidak dicommit; gunakan `.tfvars` lokal atau environment variable saat menjalankan Terraform.

## Kesesuaian Roadmap Minggu 1-4

| Minggu | Fokus Roadmap | Bukti di Project | Status |
| --- | --- | --- | --- |
| 1 | Perencanaan dan arsitektur | `docs/week1-planning.md`, `docs/architecture-notes.md`, `docs/evidence/arsitektur-final.png` | Selesai |
| 2 | Infrastruktur dasar, jaringan, IAM, IaC | `infra/`, `docs/week2-infrastructure.md`, `docs/iam-config.md`, `docs/resource-inventory.md` | Selesai |
| 3 | Layanan inti end-to-end | `src/backend/`, `src/dashboard/`, `functions/api/`, `docs/week3-core-services.md` | Selesai |
| 4 | Monitoring, keamanan, backup, optimasi biaya | `infra/monitoring.tf`, `infra/evidence.tf`, `docs/week4-monitoring-security-optimization.md`, `docs/evidence/` | Selesai |

Bukti screenshot yang aman untuk laporan disimpan di `docs/evidence/`. Screenshot dari Azure Portal dan Cloudflare Portal perlu dicek ulang sebelum commit agar tidak memuat function key, token, access key, atau connection string.

Diagram arsitektur final utama berada di `docs/evidence/arsitektur-final.png`. File `docs/evidence/architecture-final-target.png` dipertahankan sebagai path kompatibilitas dengan isi diagram yang sama.

Laporan PDF rinci untuk roadmap Minggu 1-4 tersedia di `docs/Laporan_Minggu_1-4_Kelompok_11.pdf`.

Versi laporan yang dipisah per minggu tersedia di folder `docs/laporan-mingguan/`.

## Deployment

### Backend ke Azure Functions

Deployment backend dijalankan melalui GitHub Actions pada workflow:

```text
.github/workflows/deploy-backend.yaml
```

Workflow ini berjalan saat push ke branch `main`, lalu:

1. checkout repository,
2. setup Python 3.11,
3. login ke Azure menggunakan secret `AZURE_CREDENTIALS`,
4. deploy folder `src/backend` ke Azure Function App.

### Frontend ke Cloudflare Pages

Frontend dapat dideploy ke Cloudflare Pages dengan konfigurasi:

```text
Build command: kosong
Build output directory: src/dashboard
Functions directory: functions
```

Jika Cloudflare Pages membaca dari root repository, pastikan output directory diarahkan ke folder `src/dashboard`.

Custom domain:

```text
kelompok11cc.my.id
```

Nameserver domain sudah diarahkan ke Cloudflare. Detail nameserver tidak dicantumkan di repository publik.

Simpan `AZURE_FUNCTION_URL` dan `AZURE_FUNCTION_KEY` sebagai environment variable Cloudflare Pages Function agar URL Azure dan function key tidak terlihat di browser.

## Konfigurasi CORS

Karena browser memanggil proxy `/api` pada domain yang sama, CORS browser menjadi lebih sederhana. Jika ada pengujian yang memanggil Azure Functions langsung, backend perlu mengizinkan origin Cloudflare Pages.

Origin production:

```text
https://kelompok11cc.my.id
https://www.kelompok11cc.my.id
```

Tambahkan juga domain `pages.dev` jika masih dipakai untuk preview deployment.

## Catatan Keamanan

- Function key tidak boleh ditaruh di frontend publik. Dashboard memakai proxy `/api` agar key tetap berada di server-side Cloudflare Pages Function.
- Cloudflare API token untuk admin analytics hanya boleh berada di backend Azure, bukan di browser.
- Password user disimpan dengan hash PBKDF2, bukan plaintext.
- Token login ditandatangani memakai `AUTH_TOKEN_SECRET` di Azure Function App.
- VM eksplorasi Minggu 2 bukan bagian runtime final; jika masih dinyalakan, SSH harus dibatasi hanya dari IP admin.
- VM eksplorasi sebaiknya memakai SSH key dan menonaktifkan password authentication.
- Secret database sudah diarahkan melalui Azure Key Vault.
- Terraform variable sensitif seperti `admin_password` tidak boleh dicommit dalam file `.tfvars`.

## Catatan Teknis Saat Ini

- Dashboard tidak menyimpan function key di browser dan tidak memakai mode demo pada production UI.
- Record backend sudah menambahkan `deviceId` agar sesuai dengan partition key Cosmos DB `/deviceId`.
- Endpoint `GET /api/data` sudah memvalidasi parameter `limit` dan `status`.
- Beberapa file source lama masih memiliki karakter encoding rusak, tetapi README ini sudah ditulis ulang bersih.

## Estimasi Biaya

Estimasi biaya awal proyek berdasarkan Azure Pricing Calculator:

```text
Total: sekitar USD 37.60 per bulan
```

Biaya aktual dapat berubah sesuai pemakaian, region, traffic, jumlah request Azure Functions, konsumsi Cosmos DB, log Application Insights, dan resource yang aktif.

## Catatan PDF/ODT

Sumber kebenaran dokumentasi berada pada file Markdown. PDF/ODT laporan akhir perlu diekspor ulang dari Markdown final jika dibutuhkan untuk pengumpulan, karena tool konversi dokumen tidak tersedia di environment kerja saat pembaruan dokumentasi ini dilakukan.
