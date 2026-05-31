# Laporan Progres Proyek

Final Project Cloud Computing - Kelompok 11

## Ringkasan

Proyek telah berkembang dari perencanaan infrastruktur Azure menjadi platform hybrid-cloud. Frontend dashboard dideploy melalui Cloudflare Pages, sedangkan backend dan pipeline data berjalan di Azure.

## Pekerjaan yang Telah Diselesaikan

### Infrastruktur Azure

- Resource Group `RG-Kelompok11`.
- Virtual Network `VNet-Utama-Kelompok11`.
- Public subnet `10.0.1.0/24`.
- Private subnet `10.0.2.0/24`.
- Network Security Group untuk subnet publik dan privat.
- Public IP, NIC, dan VM eksplorasi target Minggu 2. VM bukan runtime final setelah M2.
- Storage Account untuk Azure Functions dan Blob Storage.
- Azure Cosmos DB serverless.
- Azure Key Vault.
- Application Insights.
- Traffic Manager untuk failover backend.
- Azure App Service backup minimal sebagai endpoint secondary/fallback.
- Diagnostic settings untuk Function App, Cosmos DB, dan Blob Storage.
- Storage lifecycle policy untuk `raw-data`.

### Backend

- Azure Functions menggunakan Python 3.11.
- HTTP endpoint untuk `hello`, `register`, `login`, `me`, `stats`, `data`, `analyze`, `analytics`, `upload`, admin management, dan developer ops summary.
- Login/register user dengan password hash PBKDF2 dan token sesi.
- Role `user`, `dev`, dan `admin` sudah dipisahkan; register publik selalu membuat role `user`.
- Database user dipisahkan ke Cosmos DB container `users`.
- Blob trigger untuk container `raw-data`.
- Validasi parameter `limit` dan `status`.
- Query Cosmos DB untuk filter status menggunakan parameter.
- Record hasil proses memiliki `deviceId` agar sesuai partition key Cosmos DB.
- Statistik menampilkan total, processed, anomaly, dan error.
- Upload limit saat ini 100 MB dan 1,000,000 record per file.

### Frontend

- Dashboard statis di `src/dashboard`.
- Dashboard dipublikasikan melalui Cloudflare DNS/CDN dan Cloudflare Pages.
- UI dashboard sudah diperbarui agar lebih rapi dan responsive.
- Layar login/register ditambahkan sebelum dashboard.
- Panel **Admin Users** tampil hanya untuk role `admin`.
- Upload JSON, CSV, XLSX, dan XLS divalidasi di sisi browser lalu diproses di backend.
- Konfigurasi frontend menggunakan `env.js` lokal atau environment Cloudflare Pages.
- Cloudflare Pages Function `/api/*` menyimpan Azure Function URL dan function key di sisi server.

### DevOps

- Terraform digunakan untuk provisioning Azure.
- GitHub Actions digunakan untuk deploy backend ke Azure Functions.
- `.gitignore` menjaga file secret dan local config agar tidak masuk repository.
- Azure Monitor alert dan storage lifecycle policy disiapkan untuk deliverable Minggu 4.

### Dokumentasi

- README diperbarui sesuai arsitektur Cloudflare + Azure.
- Dokumen arsitektur, network plan, IAM, resource inventory, week 3, week 4, dan progress report diselaraskan.

## Kontribusi Tim

| Nama | Peran | Kontribusi |
| --- | --- | --- |
| Naufal Ihsan Sriyanto | DevOps Engineer | Terraform, CI/CD, deployment |
| Zhykwa Ceryl Mavanudin | Cloud Architect | Arsitektur dan network design |
| Muhammad Arifin Ilham | Backend Developer | Azure Functions dan integrasi Cosmos DB |
| Rendy Saputra | Security Engineer | IAM, Key Vault, NSG, security review |

## Kendala dan Solusi

| Kendala | Solusi |
| --- | --- |
| Frontend dan backend beda origin | Konfigurasi CORS di Azure Function App |
| Function key tidak aman jika hardcoded | Simpan key di Cloudflare Pages Function environment |
| Cosmos DB memakai partition key `/deviceId` | Backend menambahkan field `deviceId` pada setiap record |
| File dokumentasi lama tidak sesuai arsitektur terbaru | Dokumentasi diperbarui sesuai kondisi final |
| Kebutuhan failover backend | Traffic Manager mengarah ke Azure Functions sebagai primary dan App Service backup sebagai secondary minimal |

## Status Saat Ini

| Area | Status |
| --- | --- |
| Frontend dashboard | Siap uji lokal dan deploy Cloudflare Pages |
| Backend Azure Functions | Siap deploy melalui GitHub Actions |
| Backup backend App Service | Tersedia sebagai fallback minimal |
| Infrastruktur Azure | Dikelola Terraform |
| Dokumentasi | Diperbarui |
| Monitoring dan alerting | Baseline Terraform dan evidence tersedia |
| Security baseline | Ada; VM hanya resource eksplorasi M2 dan SSH perlu dibatasi jika masih aktif |

## Rekomendasi Lanjutan

- Pertahankan Cloudflare Pages Function sebagai proxy `/api/*` agar function key tidak terekspos di browser publik.
- Jika VM eksplorasi M2 masih dinyalakan, batasi SSH hanya dari IP admin dan gunakan SSH key.
- Lampirkan screenshot Azure Monitor alert, Application Insights, Cost Management, dan Defender for Cloud untuk laporan Minggu 4.
- Jalankan `terraform validate` setelah provider lock/cache lokal tersinkron.

## Kesimpulan

Platform sudah memiliki pondasi lengkap: frontend statis, edge proxy, backend serverless, backend fallback minimal, storage, database, secret management, observability, IaC, dan CI/CD. Proyek siap untuk uji demo dan penyempurnaan deployment.
