# Deployment Guide

Kelompok 11 - Cloud-Based Data Processing and Monitoring Platform

## Tujuan

Dokumen ini berisi langkah ringkas untuk menjalankan frontend dashboard, mengonfigurasi backend Azure Functions, dan menyiapkan deployment Cloudflare Pages.

## Menjalankan Frontend Lokal

Dari root repository:

```powershell
python -m http.server 4173 --directory src/dashboard
```

Buka:

```text
http://127.0.0.1:4173/
```

Jika backend proxy belum tersedia, dashboard akan berjalan dalam demo mode.

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

## Deployment Frontend ke Cloudflare Pages

Konfigurasi Cloudflare Pages:

```text
Build command: kosong
Build output directory: src/dashboard
Functions directory: functions
```

Cloudflare Pages Function pada `functions/api/[[path]].js` membutuhkan environment variable berikut:

```text
AZURE_FUNCTION_URL=<azure-function-base-url>
AZURE_FUNCTION_KEY=***REMOVED***
```

Nilai tersebut disimpan di Cloudflare environment, bukan di file frontend. Browser hanya melihat request ke `/api`.

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

Nameserver yang dipakai:

```text
***REMOVED_NAMESERVER***
***REMOVED_NAMESERVER***
```

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

Jika backend proxy belum aktif, gunakan tombol **Masuk Demo** untuk mengecek tampilan dashboard.

### Test login/register dan database

Setelah Cloudflare Pages Function aktif dan SSL custom domain sudah valid, jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-auth-db.ps1
```

Default script akan menguji:

```text
https://kelompok11cc.my.id/api
```

Yang diuji:

- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `GET /api/stats`
- `POST /api/upload` memakai sample CSV multipart

Jika ingin memakai base URL lain:

```powershell
$env:APP_API_BASE="https://<cloudflare-pages-preview>.pages.dev/api"
powershell -ExecutionPolicy Bypass -File scripts/test-auth-db.ps1
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
| POST | `/api/upload` | Upload JSON, CSV, XLSX, atau XLS |

## Troubleshooting

| Masalah | Penyebab Umum | Solusi |
| --- | --- | --- |
| Dashboard masuk demo mode | Backend proxy belum aktif | Jalankan Cloudflare Pages Function atau gunakan demo mode lokal |
| Login gagal 500 | `AUTH_TOKEN_SECRET` belum ada | Isi variable Terraform atau app setting Azure |
| CORS error | Origin belum diizinkan | Tambahkan origin Cloudflare/localhost di Azure Function App |
| Upload gagal 401/403 | Secret Cloudflare salah | Periksa `AZURE_FUNCTION_URL` dan `AZURE_FUNCTION_KEY` di Cloudflare |
| Data tidak tersimpan | Cosmos DB atau Key Vault bermasalah | Cek Application Insights dan akses managed identity |
