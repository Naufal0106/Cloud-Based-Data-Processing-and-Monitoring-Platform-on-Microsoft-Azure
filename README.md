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

- **Cloudflare Pages** untuk hosting dashboard statis.
- **Azure Functions** untuk API dan pemrosesan data serverless.
- **Azure Blob Storage** untuk file mentah JSON, CSV, dan Excel pada container `raw-data`.
- **Azure Cosmos DB for NoSQL** untuk menyimpan hasil data yang sudah diproses dan data user dashboard.
- **Azure Key Vault** untuk menyimpan secret Cosmos DB connection string.
- **Azure Application Insights** untuk observability backend.
- **Terraform** untuk provisioning infrastruktur Azure.
- **GitHub Actions** untuk deployment backend ke Azure Functions.

```text
User
  |
  v
Cloudflare Pages
  |
  v
Dashboard Frontend
  |
  v
Azure Functions API
  |
  +--> Azure Key Vault
  +--> Azure Blob Storage
  +--> Azure Cosmos DB
  +--> Application Insights
```

## Alur Data

1. User membuka dashboard dari Cloudflare Pages.
2. Dashboard memanggil endpoint Azure Functions.
3. Data batch dapat diproses melalui:
   - upload langsung ke endpoint `POST /api/upload`, atau
   - file baru pada Blob Storage container `raw-data`.
4. Azure Functions melakukan parsing, enrichment, dan klasifikasi data.
5. Hasil proses disimpan ke Cosmos DB.
6. Dashboard membaca data dan statistik melalui endpoint `GET /api/data` dan `GET /api/stats`.

## Fitur Utama

- Dashboard monitoring data berbasis HTML, CSS, dan JavaScript.
- Login dan register user sebelum mengakses dashboard.
- Upload file JSON, CSV, XLSX, dan XLS dari dashboard.
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
| POST | `/api/upload` | Upload JSON, CSV, XLSX, atau XLS langsung untuk diproses |
| GET | `/api/admin/users` | Admin-only: melihat daftar user |
| PATCH/POST | `/api/admin/users/{user_id}/role` | Admin-only: mengubah role user |

Endpoint `stats`, `data`, dan `upload` di Azure tetap menggunakan `auth_level=FUNCTION`, tetapi function key tidak disimpan di frontend.

## Role User dan Admin

Dashboard memakai satu domain yang sama, yaitu `kelompok11cc.my.id`. Domain admin tidak wajib dibuat terpisah karena akses dibedakan lewat role login.

Role yang digunakan:

| Role | Akses |
| --- | --- |
| `user` | Login, melihat dashboard, membaca data/statistik, dan upload data |
| `admin` | Semua akses user, ditambah melihat daftar user dan mengubah role |

Register publik selalu membuat akun dengan role `user`. Admin tidak bisa dibuat dari form register publik agar tidak disalahgunakan.

Untuk membuat admin pertama, generate dokumen user admin:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-admin-user.ps1 -Name "Admin Kelompok 11" -Email "admin@kelompok11cc.my.id"
```

Salin JSON yang dihasilkan ke Cosmos DB container `users` dengan partition key email. Setelah admin pertama bisa login, role user lain dapat dikelola dari panel **Admin Users** di dashboard.

## Format Upload

Dashboard menerima file:

- `.json`: object tunggal atau array record.
- `.csv`: baris pertama wajib berisi header kolom.
- `.xlsx` dan `.xls`: sheet pertama dipakai, baris pertama wajib berisi header kolom.

Batas upload saat ini adalah 5 MB dan 1.000 baris data per file. Kolom yang disarankan:

| Kolom | Fungsi |
| --- | --- |
| `deviceId` / `device_id` / `device` | Identitas perangkat atau sumber data |
| `temperature` | Dipakai untuk kategori `sensor` dan deteksi anomali suhu |
| `level` + `message` | Dipakai untuk kategori `log` dan deteksi error |

Contoh CSV untuk uji UI tersedia di `samples/sample-telemetry.csv`.

## Tech Stack

| Layer | Teknologi | Peran |
| --- | --- | --- |
| Frontend | Cloudflare Pages, HTML, CSS, JavaScript, Chart.js | Dashboard monitoring |
| Backend | Azure Functions Python 3.11 | API dan serverless data processing |
| Storage | Azure Blob Storage | Penyimpanan file mentah JSON, CSV, dan Excel |
| Database | Azure Cosmos DB for NoSQL | Penyimpanan hasil olah data |
| Secrets | Azure Key Vault | Penyimpanan connection string |
| Monitoring | Azure Application Insights | Log dan observability backend |
| Infrastructure | Terraform AzureRM | Provisioning resource Azure |
| CI/CD | GitHub Actions | Deploy backend ke Azure Functions |

## Struktur Repositori

```text
.
|-- .github/
|   `-- workflows/
|       `-- deploy-backend.yaml
|-- arch/
|   |-- arsitektur_final-target.png
|   `-- temp
|-- docs/
|   |-- architecture-notes.md
|   |-- deployment-guide.md
|   |-- iam-config.md
|   |-- network-plan.md
|   |-- progress-report.md
|   |-- resource-inventory.md
|   |-- week1-planning.md
|   `-- week2-infrastructure.md
|-- infra/
|   |-- backend.tf
|   |-- database.tf
|   |-- functions.tf
|   |-- iam.tf
|   |-- locals.tf
|   |-- main.tf
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
|-- samples/
|   `-- sample-telemetry.csv
|-- scripts/
|   |-- generate-admin-user.ps1
|   `-- test-auth-db.ps1
|-- AGENTS.md
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
- `upload_data`: HTTP POST untuk upload JSON, CSV, XLSX, dan XLS langsung.
- `hello`: health check sederhana.

## Frontend

Frontend berada di `src/dashboard` dan berupa static dashboard.

File utama:

- `index.html`: struktur halaman dashboard.
- `style.css`: styling dashboard.
- `script.js`: konfigurasi API, fetch data, upload file data, chart, dan demo mode.
- `env.example.js`: contoh konfigurasi frontend agar memanggil proxy `/api`.

Konfigurasi API frontend dibaca dari variable global browser:

```js
window.DATA_API_BASE = "/api";
```

Untuk local/demo deployment, salin `src/dashboard/env.example.js` menjadi `src/dashboard/env.js` jika ingin override path proxy. File `env.js` sudah masuk `.gitignore`.

Untuk deployment publik, simpan `AZURE_FUNCTION_URL` dan `AZURE_FUNCTION_KEY` sebagai environment variable Cloudflare Pages Function, bukan di frontend.

## Infrastruktur Azure

Folder `infra` berisi konfigurasi Terraform untuk resource Azure:

- Resource Group: `RG-Kelompok11`
- Region: `southeastasia`
- Virtual Network: `VNet-Utama-Kelompok11`
- Subnet publik dan privat
- Linux VM untuk web/server management
- Azure Function App: `func-backend-monitoring-k11`
- Azure Storage Account untuk Function App dan Blob trigger
- Cosmos DB account, database, container `telemetry-data`, dan container `users`
- Key Vault untuk secret Cosmos DB
- Key Vault secret `auth-token-secret` untuk tanda tangan token login
- Application Insights untuk monitoring
- Traffic Manager untuk endpoint routing/failover
- NSG untuk subnet publik dan privat
- RBAC/IAM untuk anggota tim

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
- Password user disimpan dengan hash PBKDF2, bukan plaintext.
- Token login ditandatangani memakai `AUTH_TOKEN_SECRET` di Azure Function App.
- SSH VM sebaiknya dibatasi hanya dari IP admin, bukan `*`.
- VM sebaiknya memakai SSH key dan menonaktifkan password authentication.
- Secret database sudah diarahkan melalui Azure Key Vault.
- Terraform variable sensitif seperti `admin_password` tidak boleh dicommit dalam file `.tfvars`.

## Catatan Teknis Saat Ini

- Dashboard masih memiliki fallback demo data jika API tidak dapat diakses.
- Record backend sudah menambahkan `deviceId` agar sesuai dengan partition key Cosmos DB `/deviceId`.
- Endpoint `GET /api/data` sudah memvalidasi parameter `limit` dan `status`.
- Beberapa file source lama masih memiliki karakter encoding rusak, tetapi README ini sudah ditulis ulang bersih.

## Estimasi Biaya

Estimasi biaya awal proyek berdasarkan Azure Pricing Calculator:

```text
Total: sekitar USD 37.60 per bulan
```

Biaya aktual dapat berubah sesuai pemakaian, region, traffic, jumlah request Azure Functions, konsumsi Cosmos DB, log Application Insights, dan resource yang aktif.
