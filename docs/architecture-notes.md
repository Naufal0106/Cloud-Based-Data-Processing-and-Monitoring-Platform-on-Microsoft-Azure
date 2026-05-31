# Catatan Arsitektur Sistem

Final Project Cloud Computing - Kelompok 11

## Tujuan

Dokumen ini menjelaskan desain arsitektur final platform data processing dan monitoring. Arsitektur final memakai pendekatan hybrid: frontend dan edge proxy berada di Cloudflare, sedangkan backend, failover, data layer, secret management, dan observability berjalan di Microsoft Azure.

Diagram arsitektur final utama:

```text
docs/evidence/arsitektur-final.png
```

Path lama berikut dipertahankan sebagai kompatibilitas dan berisi diagram yang sama:

```text
docs/evidence/architecture-final-target.png
```

## Ringkasan Arsitektur

Domain production:

```text
https://kelompok11cc.my.id
```

```text
External Users
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
  +-- Priority 1: Azure Functions primary backend
  |     +-- /api/upload, /api/analyze, /api/data, /api/analytics
  |     +-- auth/login/register
  |     +-- Blob trigger process_blob
  |     +-- Azure Blob Storage raw-data
  |     +-- Azure Cosmos DB db-platform-monitoring
  |     +-- Azure Key Vault
  |     +-- Application Insights / Azure Monitor
  |
  +-- Priority 2: Azure App Service secondary backend
        +-- /api/hello
        +-- /api/fallback-status
```

## Komponen Utama

| Layer | Layanan | Peran |
| --- | --- | --- |
| Edge | Cloudflare DNS + CDN | Routing domain, caching, dan akses publik dashboard |
| Frontend | Cloudflare Pages + `kelompok11cc.my.id` | Hosting dashboard statis |
| API Proxy | Cloudflare Pages Function `/api/*` | Proxy same-origin dan penyimpanan function key di server-side Cloudflare |
| Primary Backend | Azure Functions Python 3.11 | API utama, upload data, instant analysis, blob trigger, data enrichment |
| Backend Failover | Azure Traffic Manager | Routing/failover backend antara primary dan secondary endpoint |
| Secondary Backend | Azure App Service | Backup backend minimal untuk health/fallback, bukan pengganti API utama penuh |
| Storage | Azure Blob Storage | Penyimpanan file mentah pada container `raw-data` |
| Database | Azure Cosmos DB for NoSQL | Penyimpanan telemetry pada `telemetry-data` dan user pada `users` |
| Secrets | Azure Key Vault | Penyimpanan Cosmos DB connection string dan auth token secret |
| Monitoring | Application Insights, Azure Monitor, diagnostic settings | Telemetry aplikasi, metrics, logs, alerting, dan centralized logging |
| Optimization | Storage lifecycle policy | Retensi dan optimasi biaya file mentah |
| IaC | Terraform | Provisioning resource Azure |
| CI/CD | GitHub Actions | Deployment backend ke Azure Functions |

## Alasan Pemilihan Desain

Cloudflare Pages dipilih untuk frontend karena dashboard bersifat statis, mudah dideploy dari repository, dan mendapat distribusi global melalui Cloudflare DNS/CDN. Browser hanya memanggil path same-origin `/api/*`; Cloudflare Pages Function meneruskan request ke backend Azure dan menyisipkan function key di sisi server.

Azure Functions dipakai sebagai primary backend karena workload pemrosesan data bersifat event-driven. Function menerima upload JSON, CSV, XLSX, dan XLS melalui HTTP, menyediakan instant analysis melalui `/api/analyze`, serta memproses file baru dari Blob Storage melalui blob trigger `process_blob`.

Azure Traffic Manager dipakai untuk backend failover. Endpoint prioritas pertama adalah Azure Functions. Endpoint prioritas kedua adalah Azure App Service backup yang menyediakan endpoint minimal seperti `/api/hello` dan `/api/fallback-status`. App Service backup tidak menjalankan seluruh fitur API utama.

Cosmos DB dipilih karena data monitoring dan data user berbentuk JSON dan skemanya fleksibel. Container `telemetry-data` menggunakan partition key `/deviceId`; container `users` digunakan untuk login/register dan memakai partition key `/email`.

## Alur Data

1. User membuka dashboard melalui Cloudflare DNS/CDN dan Cloudflare Pages.
2. User login/register melalui proxy `/api/*`.
3. Cloudflare Pages Function meneruskan request ke backend Azure dengan function key dari environment Cloudflare.
4. Azure Functions memvalidasi user pada Cosmos DB container `users`.
5. User biasa dapat upload JSON, CSV, XLSX, atau XLS melalui `POST /api/upload`.
6. User dapat menjalankan instant analysis lewat `POST /api/analyze`; proses ini berjalan in-memory dan mengembalikan JSON response tanpa menyimpan record.
7. Upload yang disimpan masuk ke Blob Storage `raw-data`, lalu diproses oleh blob trigger `process_blob`.
8. Azure Functions melakukan parsing, cleaning jika diminta, enrichment, status classification, dan penyimpanan data.
9. Hasil proses disimpan ke Cosmos DB container `telemetry-data`.
10. Dashboard membaca statistik, data, analytics, dan chart melalui API.
11. Admin mengelola user melalui `/api/management/*`; developer/admin membaca monitoring melalui `/api/dev/ops-summary` atau `/api/management/ops-summary`.

## Strategi Keamanan

- Function key berada di environment Cloudflare Pages Function, bukan di browser.
- User dashboard harus login sebelum membaca data atau upload.
- Register publik hanya membuat role `user`; role `dev` dan `admin` dikelola lewat kontrol internal yang dilindungi role.
- Panel admin dan developer memakai domain yang sama dan dipisahkan dengan role-based access control.
- Password disimpan dengan hash PBKDF2.
- Token login ditandatangani dengan `AUTH_TOKEN_SECRET`.
- Secret Cosmos DB disimpan di Azure Key Vault.
- Function App menggunakan managed identity untuk akses Key Vault dan role `Monitoring Reader` untuk membaca Azure Monitor metrics.
- NSG publik/privat dibuat sebagai baseline jaringan Minggu 2.
- VM hanya resource eksplorasi Target/Minggu 2 dan bukan bagian runtime final. Jika masih dinyalakan, SSH harus dibatasi ke IP admin dan sebaiknya memakai SSH key.

## Skalabilitas

Arsitektur ini dapat dikembangkan dengan:

- Menambah fitur pada Azure App Service backup jika failover penuh dibutuhkan.
- Menambahkan private endpoint atau VNet integration untuk resource Azure jika proyek dikembangkan ke production.
- Menambahkan queue/event streaming jika volume data meningkat.
- Menyesuaikan sampling Application Insights dan lifecycle policy sesuai traffic dan biaya.

## Catatan Implementasi

- Region Azure pada Terraform saat ini: `southeastasia`.
- Frontend utama: Cloudflare Pages.
- Jalur API publik: `/api/*` melalui Cloudflare Pages Function.
- Primary backend: Azure Functions.
- Secondary backend: Azure App Service backup minimal.
- VM dan Azure Storage static website adalah artefak eksplorasi/backup, bukan jalur utama aplikasi final.
