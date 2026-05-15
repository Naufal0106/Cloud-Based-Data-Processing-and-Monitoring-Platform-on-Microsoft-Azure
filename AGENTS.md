# AGENTS.md

Panduan kerja untuk agent/Codex yang membantu di repository ini.

## Ringkasan Proyek

Project ini adalah platform pemrosesan dan monitoring data untuk Final Project Cloud Computing Kelompok 11.

- Frontend utama berjalan di Cloudflare Pages pada domain `kelompok11cc.my.id`.
- Backend berjalan di Azure Functions Python.
- Database memakai Azure Cosmos DB for NoSQL.
- File mentah masuk melalui Azure Blob Storage container `raw-data`.
- Secret disimpan di Azure Key Vault dan environment Cloudflare Pages Function.
- Infrastruktur Azure dikelola dengan Terraform di folder `infra`.

## Struktur Penting

```text
src/dashboard/        Frontend static dashboard
src/backend/          Azure Functions backend
functions/api/        Cloudflare Pages Function proxy ke Azure
infra/                Terraform Azure infrastructure
docs/                 Catatan arsitektur dan deployment
samples/              Contoh file data untuk uji upload
scripts/              Script pengujian lokal/API
```

## Aturan Keamanan

- Jangan menaruh Azure Function key, connection string, token, password, atau secret asli di frontend.
- Frontend harus memanggil `/api` same-origin proxy, bukan URL Azure Functions langsung.
- Cloudflare Pages Function membaca `AZURE_FUNCTION_URL` dan `AZURE_FUNCTION_KEY` dari environment variable server-side.
- Azure Function App membaca `AUTH_TOKEN_SECRET`, `KEY_VAULT_URL`, `COSMOS_DATABASE`, `COSMOS_CONTAINER`, dan `COSMOS_USERS_CONTAINER` dari app settings.
- Jangan commit `local.settings.json`, `.env`, `.dev.vars`, `.tfvars`, state Terraform, atau private key.

## Backend

File utama backend: `src/backend/function_app.py`.

Endpoint utama:

- `GET /api/hello`
- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `GET /api/stats`
- `GET /api/data`
- `POST /api/upload`

Upload menerima format:

- `.json`: object atau array record.
- `.csv`: baris pertama wajib header.
- `.xlsx` dan `.xls`: sheet pertama dipakai, baris pertama wajib header.

Batas upload saat ini 5 MB dan 1.000 record/baris per file.

## Frontend

File utama frontend:

- `src/dashboard/index.html`
- `src/dashboard/style.css`
- `src/dashboard/script.js`
- `src/dashboard/env.example.js`

Untuk pengujian lokal static UI, jalankan server dari folder `src/dashboard` atau gunakan server lokal yang sudah tersedia. Saat proxy belum aktif, tombol **Masuk Demo** dipakai untuk mengecek tampilan.

## Terraform

Folder Terraform ada di `infra`.

Perintah umum:

```powershell
terraform -chdir=infra fmt
terraform -chdir=infra init
terraform -chdir=infra validate
```

Jika validasi gagal karena cache provider tidak cocok dengan lock file, jalankan:

```powershell
terraform -chdir=infra init -upgrade
```

Jangan commit file state, plan, atau tfvars berisi secret.

## Validasi Yang Disarankan

Setelah mengubah backend atau frontend, jalankan:

```powershell
python -m py_compile src\backend\function_app.py
node --check src\dashboard\script.js
node --check "functions\api\[[path]].js"
```

Untuk test API produksi/preview setelah Cloudflare Pages Function aktif:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\test-auth-db.ps1
```

Gunakan `samples/sample-telemetry.csv` untuk uji upload CSV dari UI.

## Gaya Perubahan

- Ikuti pola file yang sudah ada.
- Jaga dokumentasi README dan `docs/` tetap sinkron dengan perubahan arsitektur.
- Hindari refactor besar yang tidak terkait langsung dengan permintaan.
- Jika menambah secret baru, update `.gitignore`, README/docs, dan Terraform/app settings terkait.
