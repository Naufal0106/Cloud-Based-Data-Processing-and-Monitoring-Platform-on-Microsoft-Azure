# Ringkasan Proyek Untuk Rekan Tim

Project: Cloud-Based Data Processing & Monitoring Platform  
Tim: Kelompok 11  
Frontend: Cloudflare Pages  
Backend: Microsoft Azure  
Domain: `https://kelompok11cc.my.id`

## 1. Tujuan Proyek

Proyek ini adalah platform untuk upload, pemrosesan, penyimpanan, dan monitoring data berbasis cloud. User dapat login/register, upload data dalam format JSON, CSV, atau Excel, lalu melihat statistik dan record hasil pemrosesan melalui dashboard web.

Arsitektur akhirnya dibuat hybrid:

- Frontend dashboard dideploy di Cloudflare Pages.
- Cloudflare DNS/CDN mengarahkan domain dan Cloudflare Pages Function menjadi proxy `/api/*`.
- Backend API dan data processing berjalan di Azure Functions.
- Azure Traffic Manager menyiapkan failover backend dari Azure Functions ke Azure App Service backup minimal.
- Data hasil proses disimpan di Azure Cosmos DB.
- File mentah dapat diproses dari Azure Blob Storage.
- Secret disimpan di Azure Key Vault dan environment Cloudflare, bukan di frontend.

## 2. Yang Sudah Dibuat

### Frontend Dashboard

Frontend berada di folder `src/dashboard`.

Fitur yang sudah dibuat:

- Tampilan dashboard diperbarui agar lebih rapi dan siap presentasi.
- Login dan register ditambahkan sebelum user masuk dashboard.
- Statistik data tampil dalam kartu ringkasan.
- Chart distribusi status data menggunakan Chart.js.
- Tabel record terbaru dari Cosmos DB atau data demo.
- Filter data berdasarkan status dan kategori.
- Activity log di sisi dashboard.
- Upload file dari UI.
- Frontend tidak menyimpan Azure Function URL atau function key.

File penting:

- `src/dashboard/index.html`
- `src/dashboard/style.css`
- `src/dashboard/script.js`
- `src/dashboard/env.example.js`

### Backend Azure Functions

Backend berada di folder `src/backend`.

Fitur yang sudah dibuat:

- Endpoint health check.
- Endpoint register user.
- Endpoint login user.
- Endpoint validasi profil user aktif.
- Endpoint statistik data.
- Endpoint list data terbaru.
- Endpoint analisis data tanpa menyimpan.
- Endpoint analytics untuk profiling dan chart.
- Endpoint upload data.
- Endpoint admin-only untuk ringkasan, melihat user, dan mengubah role.
- Endpoint developer/admin untuk Azure Monitor dan Cloudflare workload.
- Blob trigger untuk memproses file baru di container `raw-data`.
- Parsing dan klasifikasi data.
- Penyimpanan hasil proses ke Cosmos DB.
- Password user disimpan sebagai hash PBKDF2.
- Token login ditandatangani dengan secret `AUTH_TOKEN_SECRET`.

Endpoint utama:

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/hello` | Health check backend |
| POST | `/api/register` | Register user |
| POST | `/api/login` | Login user |
| GET | `/api/me` | Profil user aktif |
| GET | `/api/stats` | Statistik data |
| GET | `/api/data` | Data terbaru |
| POST | `/api/analyze` | Analisis file tanpa menyimpan |
| GET | `/api/analytics` | Profiling dan chart dari data tersimpan |
| POST | `/api/upload` | Upload file data |
| POST | `/api/upload?clean=true` | Upload dengan cleaning otomatis |
| GET | `/api/management/summary` | Admin-only ringkasan role dan telemetry |
| GET | `/api/management/users` | Admin-only daftar user |
| PATCH/POST | `/api/management/users/{user_id}/role` | Admin-only update role |
| GET | `/api/dev/ops-summary` | Dev/admin-only monitoring Azure dan Cloudflare |
| GET | `/api/management/ops-summary` | Dev/admin-only alias monitoring |

### Upload CSV dan Excel

Upload awalnya JSON-only, sekarang sudah dibuat menerima:

- `.json`
- `.csv`
- `.xlsx`
- `.xls`

Aturan upload:

- Maksimal 100 MB per file.
- Maksimal 1,000,000 record/baris per upload.
- CSV dan Excel wajib punya header pada baris pertama.
- Excel memakai sheet pertama.

Kolom yang disarankan:

| Kolom | Fungsi |
| --- | --- |
| `deviceId`, `device_id`, atau `device` | Identitas perangkat/sumber data |
| `temperature` | Dipakai untuk kategori sensor |
| `level` dan `message` | Dipakai untuk kategori log |

Repo tidak menyertakan sample data bawaan agar akun baru mulai dari dashboard kosong. Untuk uji upload, gunakan file JSON/CSV/Excel lokal dengan format di atas.

Aturan klasifikasi:

- Jika record memiliki `temperature`, data masuk kategori `sensor`.
- Jika `temperature` lebih dari 80, status menjadi `anomaly`.
- Jika record memiliki `level` dan `message`, data masuk kategori `log`.
- Jika `level` adalah `ERROR` atau `CRITICAL`, status menjadi `error`.
- Format lain masuk kategori `generic`.

### Database Login/Register

Cosmos DB dipakai untuk dua jenis data:

| Container | Fungsi | Partition Key |
| --- | --- | --- |
| `telemetry-data` | Menyimpan hasil pemrosesan data | `/deviceId` |
| `users` | Menyimpan user login/register | `/email` |

Data user tidak menyimpan password plaintext. Yang disimpan adalah hash password.

Role user:

- `user`: login, melihat dashboard, membaca data/statistik, dan upload data.
- `dev`: melihat dashboard developer monitoring untuk Azure Monitor dan Cloudflare workload.
- `admin`: mengelola user, role, dan ringkasan operasional.

Domain admin tidak perlu dipisah. Dashboard tetap memakai `kelompok11cc.my.id`, sedangkan akses admin dibedakan melalui role pada token login.

### Cloudflare Proxy

File proxy berada di:

```text
functions/api/[[path]].js
```

Fungsinya:

- Browser hanya memanggil `/api`.
- Cloudflare Pages Function meneruskan request ke Azure Functions.
- Azure Function URL dan function key disimpan sebagai environment variable Cloudflare.
- API key tidak terlihat di browser.
- Jika `AZURE_FUNCTION_URL` diarahkan ke Azure Traffic Manager, backend dapat failover ke App Service backup.

Environment variable Cloudflare yang dibutuhkan:

```text
AZURE_FUNCTION_URL
AZURE_FUNCTION_KEY
```

### Terraform Infrastruktur

Folder Terraform berada di `infra`.

Yang sudah disiapkan:

- Azure Resource Group.
- Azure Storage Account.
- Azure Blob Storage container `raw-data`.
- Azure Cosmos DB database dan container.
- Container `telemetry-data`.
- Container `users`.
- Azure Function App.
- Azure Traffic Manager untuk failover backend.
- Azure App Service backup minimal.
- Key Vault secret untuk Cosmos connection string.
- Key Vault secret untuk auth token.
- Application Insights.
- Network, security group, alert monitoring, lifecycle policy, dan konfigurasi pendukung.

Secret penting untuk backend:

```text
KEY_VAULT_URL
COSMOS_DATABASE
COSMOS_CONTAINER
COSMOS_USERS_CONTAINER
AUTH_TOKEN_SECRET
```

## 3. Arsitektur Sistem

Diagram sederhana:

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
Azure Traffic Manager (backend failover)
  |
  +--> Priority 1: Azure Functions Backend
  |     +--> Azure Key Vault
  |     +--> Azure Cosmos DB
  |     |     +-- telemetry-data
  |     |     +-- users
  |     +--> Azure Blob Storage
  |     |     +-- raw-data
  |     +--> Application Insights / Azure Monitor
  |
  +--> Priority 2: Azure App Service Backup
        +-- /api/hello
        +-- /api/fallback-status
```

## 4. Alur Login/Register

```text
User
  |
  v
Dashboard Login/Register
  |
  v
/api/register atau /api/login
  |
  v
Cloudflare Proxy
  |
  v
Azure Functions
  |
  v
Cosmos DB container users
```

Jika login berhasil:

1. Backend mengembalikan token sesi.
2. Dashboard menyimpan token di `sessionStorage`, sehingga token tidak bertahan permanen setelah sesi browser ditutup.
3. Request ke `/api/stats`, `/api/data`, `/api/upload`, dan endpoint admin mengirim header:

```text
Authorization: Bearer <token>
```

## 5. Alur Upload Data

```text
User pilih file JSON/CSV/Excel
  |
  v
Dashboard mengirim multipart FormData ke /api/upload
  |
  v
Cloudflare Proxy meneruskan ke Azure Functions
  |
  v
Backend parsing file
  |
  v
Backend enrichment dan klasifikasi record
  |
  v
Record disimpan ke Cosmos DB telemetry-data
  |
  v
Dashboard refresh statistik dan tabel
```

Data upload diberi metadata pemilik akun. Role `user` hanya membaca data yang dia upload sendiri, sedangkan role `admin` bisa membaca seluruh telemetry untuk monitoring.

Blob Storage juga dapat memicu proses otomatis:

```text
File masuk ke Azure Blob Storage raw-data
  |
  v
Blob Trigger Azure Functions
  |
  v
Parsing + klasifikasi
  |
  v
Simpan ke Cosmos DB
```

## 6. Strategi Keamanan

Keamanan yang sudah diterapkan:

- Azure Function key tidak disimpan di frontend.
- Frontend hanya memanggil proxy `/api`.
- Function key disimpan di Cloudflare environment variable.
- Cosmos connection string disimpan di Azure Key Vault.
- Password user disimpan dengan PBKDF2 hash.
- Token login ditandatangani dengan `AUTH_TOKEN_SECRET`.
- VM hanya resource eksplorasi Target/Minggu 2 dan bukan runtime final. Jika masih aktif, SSH harus dibatasi ke IP admin.
- `.gitignore` diperbarui agar file secret tidak ikut commit.

File yang tidak boleh dicommit:

- `.env`
- `.dev.vars`
- `local.settings.json`
- `src/dashboard/env.js`
- `*.tfvars`
- Terraform state file
- private key
- credentials JSON

## 7. Cara Test

### Test UI Lokal

Server lokal yang sebelumnya dipakai:

```text
http://127.0.0.1:4173/
```

Untuk test upload UI, gunakan file JSON/CSV/Excel lokal. Sample data bawaan sengaja tidak disimpan di repository.

### Test Backend dan Database

Setelah Cloudflare Pages Function aktif dan domain SSL sudah valid, uji endpoint proxy `/api` melalui dashboard, Postman, atau PowerShell `Invoke-RestMethod`.

Yang perlu dites:

- Register user.
- Login user.
- Ambil profil user.
- Ambil statistik.
- Analisis file tanpa menyimpan.
- Upload file CSV/Excel/JSON lokal.
- Ambil analytics/chart.
- Simpan data ke Cosmos DB.

Jika ingin test lewat preview Cloudflare:

```text
https://<cloudflare-pages-preview>.pages.dev/api
```

## 8. Catatan Deployment

Cloudflare Pages:

```text
Build command: kosong
Build output directory: src/dashboard
Functions directory: functions
```

Custom domain:

```text
kelompok11cc.my.id
```

Nameserver domain diarahkan ke Cloudflare. Detail nameserver tidak dicantumkan di dokumen yang dibagikan.

Azure Functions perlu redeploy setelah perubahan backend, terutama karena dependency Excel ditambahkan:

```text
openpyxl
xlrd
```

## 9. File Baru/Penting Yang Ditambahkan

```text
AGENTS.md
docs/deployment-guide.md
docs/evidence/arsitektur-final.png
docs/ringkasan-untuk-rekan.md
functions/api/[[path]].js
src/dashboard/env.example.js
```

## 10. Status Terakhir

Yang sudah valid secara lokal:

- Python backend lolos compile check.
- JavaScript dashboard lolos syntax check.
- Cloudflare proxy JavaScript lolos syntax check.
- Parser CSV sudah dites memakai file CSV lokal.
- UI lokal bisa dibuka di browser.

Yang masih perlu dipastikan saat deployment:

- Cloudflare Pages Function sudah aktif.
- Environment variable Cloudflare sudah diisi.
- Azure Function App sudah redeploy dengan dependency terbaru.
- Jika ingin failover backend aktif, `AZURE_FUNCTION_URL` Cloudflare diarahkan ke endpoint Traffic Manager.
- SSL custom domain `kelompok11cc.my.id` sudah aktif.
- Terraform provider cache bisa diperbaiki dengan `terraform -chdir=infra init -upgrade` jika validasi lokal gagal karena lock/cache provider.

Catatan laporan: sumber kebenaran dokumentasi berada pada Markdown. PDF/ODT perlu diekspor ulang dari Markdown final jika dibutuhkan untuk pengumpulan.
