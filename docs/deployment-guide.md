# Deployment Guide

Kelompok 11 - Cloud-Based Data Processing and Monitoring Platform

## Tujuan

Dokumen ini berisi langkah ringkas untuk menjalankan frontend dashboard, mengonfigurasi backend Azure Functions, menyiapkan Cloudflare Pages, dan memahami jalur failover backend.

## Menjalankan Frontend Lokal

Dari root repository:

```powershell
python -m http.server 4173 --directory src/dashboard
```

Buka:

```text
http://127.0.0.1:4173/
```

Jika backend proxy belum tersedia, gunakan preview lokal role di bagian test UI. Production UI tetap dirancang memakai proxy `/api/*`.

## Konfigurasi Frontend Lokal

Salin file contoh:

```powershell
Copy-Item src/dashboard/env.example.js src/dashboard/env.js
```

Edit `src/dashboard/env.js`:

```js
window.DATA_API_BASE = "/api";
```

Catatan:

- `src/dashboard/env.js` sudah masuk `.gitignore`.
- Frontend hanya memanggil proxy `/api`, bukan Azure Functions langsung.
- Nilai `DATA_API_BASE` harus path same-origin seperti `/api`; URL eksternal akan diabaikan oleh dashboard.

## Deployment Frontend ke Cloudflare Pages

Konfigurasi Cloudflare Pages:

```text
Build command: kosong
Build output directory: src/dashboard
Functions directory: functions
```

Cloudflare Pages Function pada `functions/api/[[path]].js` membutuhkan environment variable server-side untuk backend Azure dan function key. Isi nilainya langsung di dashboard Cloudflare Pages, bukan di file repository atau frontend. Browser hanya melihat request ke `/api/*`.

## Konfigurasi Auth Backend

Azure Functions membutuhkan secret untuk menandatangani token login:

```text
AUTH_TOKEN_SECRET=***REMOVED***
```

Pada Terraform, nilai tersebut diambil dari variable sensitif:

```text
auth_token_secret
```

Secret ini disimpan ke Key Vault sebagai `auth-token-secret`, lalu dibaca Function App melalui Key Vault reference.

Database login/register dibuat di Cosmos DB sebagai container terpisah:

```text
Database: db-platform-monitoring
Container: users
Partition key: /email
Unique key: /email
```

## Custom Domain

Domain production proyek:

```text
kelompok11cc.my.id
```

Nameserver domain diarahkan ke Cloudflare. Detail nameserver sengaja tidak dicantumkan di repository publik.

Langkah di Cloudflare Pages:

1. Buka project Cloudflare Pages.
2. Masuk ke menu **Custom domains**.
3. Tambahkan domain `kelompok11cc.my.id`.
4. Jika ingin memakai `www`, tambahkan juga `www.kelompok11cc.my.id`.
5. Pastikan DNS record yang dibuat Cloudflare aktif.
6. Pastikan SSL/TLS status sudah aktif sebelum demo publik.

Catatan:

- Dashboard tetap memanggil `/api`, jadi API URL dan function key tidak terlihat di browser.
- Secret `AZURE_FUNCTION_URL` dan `AZURE_FUNCTION_KEY` hanya disimpan di environment Cloudflare Pages Function.

## Routing Backend dan Failover

Jalur aktif aplikasi:

```text
Cloudflare Pages -> Cloudflare Pages Function /api/* -> Azure Functions
```

Terraform juga menyiapkan Azure Traffic Manager untuk backend failover:

```text
Priority 1: Azure Functions primary backend
Priority 2: Azure App Service backup backend
```

Jika ingin memakai failover backend melalui Traffic Manager, nilai `AZURE_FUNCTION_URL` di Cloudflare dapat diarahkan ke endpoint Traffic Manager. Jika nilai tersebut tetap diarahkan langsung ke Azure Functions, aplikasi tetap berjalan pada jalur primary aktif tanpa melewati Traffic Manager.

App Service backup saat ini hanya menyediakan endpoint minimal seperti `/api/hello` dan `/api/fallback-status`. Endpoint data processing utama tetap berada di Azure Functions.

## Deployment Backend ke Azure Functions

Backend berada di:

```text
src/backend
```

Deployment otomatis menggunakan workflow:

```text
.github/workflows/deploy-backend.yaml
```

Workflow berjalan ketika ada push ke branch `main`.

Secret GitHub yang diperlukan:

```text
AZURE_CREDENTIALS
```

## Konfigurasi CORS Azure Functions

Tambahkan domain Cloudflare Pages ke CORS Azure Function App.

Contoh:

```text
https://kelompok11cc.my.id
https://www.kelompok11cc.my.id
```

Tambahkan juga domain `pages.dev` jika masih digunakan untuk preview Cloudflare Pages.

Untuk uji lokal, tambahkan:

```text
http://127.0.0.1:4173
```

## Validasi Cepat

Backend:

```powershell
python -m py_compile src/backend/function_app.py
```

Frontend JavaScript:

```powershell
node --check src/dashboard/script.js
```

Static web:

```powershell
python -m http.server 4173 --directory src/dashboard
```

## Test UI dan Database

### Test UI lokal

Jalankan static server:

```powershell
python -m http.server 4173 --directory src/dashboard
```

Buka:

```text
http://127.0.0.1:4173/
```

Preview role lokal tanpa backend:

```text
http://127.0.0.1:4173/?preview=user
http://127.0.0.1:4173/?preview=admin
```

Mode preview ini hanya aktif pada `localhost` atau `127.0.0.1`, sehingga tidak membuka akses admin di domain production.

### Test login/register dan database

Setelah Cloudflare Pages Function aktif dan SSL custom domain sudah valid, uji endpoint proxy:

```text
https://kelompok11cc.my.id/api
```

Yang diuji:

- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `GET /api/stats`
- `GET /api/data`
- `POST /api/analyze`
- `POST /api/upload` memakai file CSV/Excel/JSON lokal
- `GET /api/analytics`

Jika ingin memakai base URL lain:

```text
https://<cloudflare-pages-preview>.pages.dev/api
```

Jika muncul error SSL/TLS, pastikan custom domain Cloudflare Pages sudah aktif dan sertifikat SSL sudah selesai provisioning.

## Endpoint Utama

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/hello` | Health check |
| POST | `/api/register` | Registrasi user |
| POST | `/api/login` | Login user |
| GET | `/api/me` | Profil user aktif |
| GET | `/api/stats` | Statistik data |
| GET | `/api/data?limit=50` | Data terbaru |
| POST | `/api/analyze` | Analisis file tanpa menyimpan |
| GET | `/api/analytics?limit=200` | Profiling dan chart dari data tersimpan |
| POST | `/api/upload` | Upload JSON, CSV, XLSX, atau XLS |
| POST | `/api/upload?clean=true` | Upload dengan cleaning otomatis |
| GET | `/api/management/summary` | Admin-only ringkasan role dan telemetry |
| GET | `/api/management/users` | Admin-only daftar user |
| PATCH/POST | `/api/management/users/{user_id}/role` | Admin-only update role user |
| GET | `/api/dev/ops-summary` | Dev/admin-only monitoring Azure dan Cloudflare |
| GET | `/api/management/ops-summary` | Dev/admin-only alias monitoring |
| GET | `/api/fallback-status` | Status App Service backup minimal |

## Role Admin

Domain admin tidak wajib dipisah. Dashboard tetap memakai `kelompok11cc.my.id`; akses admin dibedakan dari token login yang memiliki role `admin`.

Register publik hanya membuat role `user`. Akses admin tidak disediakan melalui form publik dan harus dikelola melalui kontrol internal yang dilindungi role.

## Troubleshooting

| Masalah | Penyebab Umum | Solusi |
| --- | --- | --- |
| Dashboard tidak bisa memuat data | Backend proxy belum aktif | Jalankan Cloudflare Pages Function dan pastikan environment Cloudflare terisi |
| Login gagal 500 | `AUTH_TOKEN_SECRET` belum ada | Isi variable Terraform atau app setting Azure |
| CORS error | Origin belum diizinkan | Tambahkan origin Cloudflare/localhost di Azure Function App |
| Upload gagal 401/403 | Secret Cloudflare salah | Periksa `AZURE_FUNCTION_URL` dan `AZURE_FUNCTION_KEY` di Cloudflare |
| Data tidak tersimpan | Cosmos DB atau Key Vault bermasalah | Cek Application Insights dan akses managed identity |
| Failover hanya mengembalikan fallback | App Service backup memang minimal | Gunakan Azure Functions untuk fitur API utama atau kembangkan backup backend jika butuh failover penuh |

## Catatan PDF/ODT Laporan

Sumber kebenaran dokumentasi berada pada file Markdown. PDF/ODT laporan akhir perlu diekspor ulang dari Markdown final jika dibutuhkan untuk pengumpulan.
