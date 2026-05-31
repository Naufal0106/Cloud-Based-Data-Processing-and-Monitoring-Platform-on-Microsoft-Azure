# Implementasi Layanan Inti

Minggu 3 - Kelompok 11

## Tujuan

Minggu 3 berfokus pada layanan utama yang membuat sistem dapat berjalan end-to-end: database, object storage, backend API, frontend dashboard, secret management, dan jalur akses publik.

## Layanan Inti Yang Diimplementasikan

| Komponen | Layanan | Fungsi | Status |
| --- | --- | --- | --- |
| Frontend | Cloudflare Pages | Hosting dashboard statis pada domain `kelompok11cc.my.id` | Selesai |
| Edge Proxy | Cloudflare Pages Function | Proxy `/api/*` agar function key tidak terekspos di browser | Selesai |
| API Backend | Azure Functions Python | Endpoint auth, data, statistik, upload, analytics, dan admin | Selesai |
| Backup Backend | Azure App Service | Secondary backend minimal untuk health/fallback | Selesai |
| Database | Azure Cosmos DB for NoSQL | Menyimpan telemetry dan user login/register | Selesai |
| Object Storage | Azure Blob Storage | Container `raw-data` untuk file mentah JSON, CSV, dan Excel | Selesai |
| Secret Management | Azure Key Vault | Menyimpan Cosmos connection string dan auth token secret | Selesai |
| Routing/Fallback | Azure Traffic Manager | Backend failover dari Azure Functions ke App Service backup | Selesai |
| CDN/Edge | Cloudflare Pages | Distribusi frontend statis dan proxy `/api` | Selesai |

## Database

Cosmos DB menggunakan database:

```text
db-platform-monitoring
```

Container yang dipakai:

| Container | Partition Key | Fungsi |
| --- | --- | --- |
| `telemetry-data` | `/deviceId` | Menyimpan hasil pemrosesan data upload dan blob trigger |
| `users` | `/email` | Menyimpan user dashboard, hash password, role, dan metadata login |

Desain data telemetry bersifat fleksibel karena input dapat berasal dari JSON, CSV, XLSX, atau XLS. Setiap record hasil proses memiliki field utama:

| Field | Fungsi |
| --- | --- |
| `id` | ID unik record |
| `doc_type` | Penanda jenis dokumen, misalnya `telemetry` |
| `deviceId` | Partition key dan identitas sumber data |
| `source_file` | Nama file sumber |
| `processed_at` | Timestamp pemrosesan |
| `status` | `processed`, `anomaly`, atau `error` |
| `category` | `sensor`, `log`, atau `generic` |
| `owner_user_id` | Pemilik data untuk isolasi per user |
| `raw` | Data asli dari file |

## API dan Endpoint

Backend berada di `src/backend/function_app.py` dan berjalan sebagai Azure Functions.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/hello` | Health check |
| POST | `/api/register` | Registrasi user role `user` |
| POST | `/api/login` | Login dan penerbitan token sesi |
| GET | `/api/me` | Validasi token dan profil user |
| GET | `/api/stats` | Statistik data sesuai role login |
| GET | `/api/data` | Data terbaru sesuai role login |
| POST | `/api/analyze` | Analisis kualitas data tanpa menyimpan |
| POST | `/api/upload` | Upload JSON, CSV, XLSX, atau XLS |
| POST | `/api/upload?clean=true` | Cleaning otomatis sebelum simpan |
| GET | `/api/analytics` | Profiling, quality report, dan chart dari data tersimpan |
| GET | `/api/management/summary` | Admin-only ringkasan user, role, dan telemetry |
| GET | `/api/management/users` | Admin-only daftar user |
| PATCH/POST | `/api/management/users/{user_id}/role` | Admin-only update role user |
| GET | `/api/dev/ops-summary` | Dev/admin-only monitoring Azure dan Cloudflare |
| GET | `/api/management/ops-summary` | Dev/admin-only alias monitoring |

## Alur End-to-End

```text
User
  |
  v
Cloudflare DNS + CDN
  |
  v
Cloudflare Pages / kelompok11cc.my.id
  |
  v
Cloudflare Pages Function Proxy /api
  |
  v
Azure Traffic Manager
  |
  +--> Priority 1: Azure Functions
  |     +--> Azure Key Vault
  |     +--> Azure Cosmos DB
  |     +--> Azure Blob Storage raw-data
  |     +--> Application Insights / Azure Monitor
  |
  +--> Priority 2: Azure App Service backup
        +--> /api/hello
        +--> /api/fallback-status
```

Alur utama:

1. User membuka dashboard dari Cloudflare Pages.
2. User register/login melalui proxy `/api`.
3. Cloudflare Pages Function meneruskan request ke backend Azure dengan function key server-side.
4. Backend memvalidasi user pada Cosmos DB container `users`.
5. User memilih file JSON, CSV, XLSX, atau XLS.
6. Dashboard dapat menjalankan analisis kualitas data terlebih dahulu lewat `/api/analyze`.
7. Backend parsing file, melakukan cleaning jika diminta, lalu melakukan klasifikasi record.
8. Data hasil proses disimpan ke Cosmos DB container `telemetry-data`.
9. Dashboard memuat statistik, tabel record, dan chart analitik dari API.

## Uji Fungsional

| No | Skenario | Hasil Yang Diharapkan | Status |
| --- | --- | --- | --- |
| 1 | Health check `/api/hello` | API mengembalikan response sukses | Siap uji |
| 2 | Register user baru | User tersimpan di container `users` dengan role `user` | Siap uji |
| 3 | Login user | Token sesi diterbitkan dan dapat dipakai untuk `/api/me` | Siap uji |
| 4 | Upload CSV/Excel/JSON | Data tersimpan di `telemetry-data` dengan owner user | Siap uji |
| 5 | Analisis data | Quality score, profiling, dan chart dikembalikan tanpa menyimpan | Siap uji |
| 6 | Admin melihat user | Hanya role `admin` yang dapat membuka endpoint admin | Siap uji |
| 7 | Developer monitoring | Role `dev` atau `admin` dapat membuka ops summary | Siap uji |
| 8 | Fallback backend | App Service backup menjawab `/api/hello` dan `/api/fallback-status` | Siap uji |

Pengujian API dilakukan melalui endpoint Cloudflare Pages proxy `/api` menggunakan UI dashboard, Postman, atau PowerShell `Invoke-RestMethod`. Helper script lokal tidak disimpan di repository publik.

## Bukti Screenshot

Screenshot yang sudah tersedia:

| Bukti | File |
| --- | --- |
| Halaman login kosong | `docs/evidence/ui-login.png` |
| Halaman register | `docs/evidence/ui-register.png` |
| Preview dashboard user | `docs/evidence/ui-user-preview.png` |
| Preview dashboard admin | `docs/evidence/ui-admin-preview.png` |

Screenshot tambahan yang disarankan dari portal:

- Azure Function App aktif dan endpoint health check.
- Azure Traffic Manager dengan endpoint primary Functions dan secondary App Service.
- App Service backup endpoint fallback.
- Cosmos DB database `db-platform-monitoring` dengan container `telemetry-data` dan `users`.
- Blob Storage container `raw-data`.
- Cloudflare Pages custom domain aktif.

## Catatan Kesesuaian Roadmap

- Database terkelola: Azure Cosmos DB.
- Object storage: Azure Blob Storage container `raw-data`.
- API pada compute layer: Azure Functions Python.
- CDN/edge static hosting: Cloudflare Pages.
- Backend failover: Azure Traffic Manager sebagai routing ke Azure Functions dan App Service backup minimal.
- Secret management: Azure Key Vault dan Cloudflare environment variable.
- Uji fungsional: disiapkan melalui script dan endpoint test.

## Kesimpulan

Minggu 3 telah memenuhi inti sistem end-to-end. Aplikasi dapat dijelaskan sebagai platform upload, processing, penyimpanan, dan monitoring data berbasis Cloudflare dan Azure.
