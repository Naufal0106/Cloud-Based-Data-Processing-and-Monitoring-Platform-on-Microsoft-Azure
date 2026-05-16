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
- Backend API dan data processing berjalan di Azure Functions.
- Data hasil proses disimpan di Azure Cosmos DB.
- File mentah dapat diproses dari Azure Blob Storage.
- Secret disimpan di Azure Key Vault dan environment Cloudflare, bukan di frontend.

## 2. Yang Sudah Dibuat

### Frontend Dashboard

Frontend berada di folder `src/dashboard`.

Fitur yang sudah dibuat:

- Tampilan dashboard diperbarui agar lebih rapi dan siap presentasi.
- Login dan register ditambahkan sebelum user masuk dashboard.
- Mode demo tersedia untuk test UI ketika backend/proxy belum aktif.
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
- Endpoint upload data.
- Endpoint admin-only untuk melihat user dan mengubah role.
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
| POST | `/api/upload` | Upload file data |
| GET | `/api/admin/users` | Admin-only daftar user |
| PATCH/POST | `/api/admin/users/{user_id}/role` | Admin-only update role |

### Upload CSV dan Excel

Upload awalnya JSON-only, sekarang sudah dibuat menerima:

- `.json`
- `.csv`
- `.xlsx`
- `.xls`

Aturan upload:

- Maksimal 5 MB per file.
- Maksimal 1.000 record/baris per upload.
- CSV dan Excel wajib punya header pada baris pertama.
- Excel memakai sheet pertama.

Kolom yang disarankan:

| Kolom | Fungsi |
| --- | --- |
| `deviceId`, `device_id`, atau `device` | Identitas perangkat/sumber data |
| `temperature` | Dipakai untuk kategori sensor |
| `level` dan `message` | Dipakai untuk kategori log |

Contoh file test:

```text
samples/sample-telemetry.csv
```

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
- `admin`: semua akses user, ditambah panel Admin Users untuk melihat user dan mengubah role.

Register publik selalu membuat role `user`. Admin pertama dibuat manual/internal dengan script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-admin-user.ps1 -Name "Admin Kelompok 11" -Email "admin@kelompok11cc.my.id"
```

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
- Key Vault secret untuk Cosmos connection string.
- Key Vault secret untuk auth token.
- Application Insights.
- Network, security group, dan konfigurasi pendukung.

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
Cloudflare Pages
kelompok11cc.my.id
  |
  v
Frontend Dashboard
  |
  v
Cloudflare Pages Function Proxy
/api
  |
  v
Azure Functions Backend
  |
  +--> Azure Key Vault
  |
  +--> Azure Cosmos DB
  |     +-- telemetry-data
  |     +-- users
  |
  +--> Azure Blob Storage
  |     +-- raw-data
  |
  +--> Application Insights
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

Jika backend belum aktif, gunakan tombol:

```text
Masuk Demo
```

Untuk test upload UI, gunakan:

```text
samples/sample-telemetry.csv
```

### Test Backend dan Database

Setelah Cloudflare Pages Function aktif dan domain SSL sudah valid, jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\test-auth-db.ps1
```

Script ini mengetes:

- Register user.
- Login user.
- Ambil profil user.
- Ambil statistik.
- Upload sample CSV.
- Simpan data ke Cosmos DB.

Jika ingin test lewat preview Cloudflare:

```powershell
$env:APP_API_BASE="https://<cloudflare-pages-preview>.pages.dev/api"
powershell -ExecutionPolicy Bypass -File scripts\test-auth-db.ps1
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
docs/ringkasan-untuk-rekan.md
functions/api/[[path]].js
samples/sample-telemetry.csv
scripts/test-auth-db.ps1
src/dashboard/env.example.js
```

## 10. Status Terakhir

Yang sudah valid secara lokal:

- Python backend lolos compile check.
- JavaScript dashboard lolos syntax check.
- Cloudflare proxy JavaScript lolos syntax check.
- Parser CSV sudah dites memakai `samples/sample-telemetry.csv`.
- UI lokal bisa dibuka di browser.

Yang masih perlu dipastikan saat deployment:

- Cloudflare Pages Function sudah aktif.
- Environment variable Cloudflare sudah diisi.
- Azure Function App sudah redeploy dengan dependency terbaru.
- SSL custom domain `kelompok11cc.my.id` sudah aktif.
- Terraform provider cache bisa diperbaiki dengan `terraform -chdir=infra init -upgrade` jika validasi lokal gagal karena lock/cache provider.
