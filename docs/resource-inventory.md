# Inventaris Resource Cloud

Final Project Cloud Computing - Kelompok 11

## Tujuan

Dokumen ini mendata resource yang digunakan pada platform data processing dan monitoring. Resource dibagi menjadi layanan Cloudflare untuk frontend/proxy dan layanan Azure untuk backend, failover, data layer, security, monitoring, serta resource eksplorasi Minggu 2.

## Resource Cloudflare

| Nama | Tipe | Fungsi | Status |
| --- | --- | --- | --- |
| Cloudflare DNS + CDN | Edge routing/CDN | Routing domain `kelompok11cc.my.id`, caching, dan proteksi akses frontend | Aktif |
| Cloudflare Pages Project | Static hosting | Hosting dashboard `src/dashboard` | Aktif/target deployment |
| Cloudflare Pages Function `/api/*` | Server-side proxy | Meneruskan request dashboard ke backend Azure dan menyimpan function key di sisi server | Aktif/target deployment |
| kelompok11cc.my.id | Custom domain | Domain production dashboard | Nameserver Cloudflare |

## Resource Azure

| No | Nama Resource | Tipe | Region | Fungsi | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | RG-Kelompok11 | Resource Group | southeastasia | Wadah seluruh resource Azure | Terraform |
| 2 | VNet-Utama-Kelompok11 | Virtual Network | southeastasia | Fondasi jaringan eksplorasi Minggu 2 | Terraform |
| 3 | Subnet-Publik | Subnet | southeastasia | Subnet eksplorasi resource publik Minggu 2 | Terraform |
| 4 | Subnet-Privat | Subnet | southeastasia | Subnet cadangan untuk resource internal/private endpoint jika dikembangkan | Terraform |
| 5 | NSG-Publik-Kelompok11 | Network Security Group | southeastasia | Baseline firewall subnet publik | Terraform |
| 6 | NSG-Privat-Kelompok11 | Network Security Group | southeastasia | Baseline firewall subnet privat | Terraform |
| 7 | IP-Publik-Web-Kelompok11 | Public IP | southeastasia | IP publik untuk VM eksplorasi Minggu 2 | Terraform |
| 8 | NIC-Web-Kelompok11 | Network Interface | southeastasia | NIC untuk VM eksplorasi Minggu 2 | Terraform |
| 9 | VM-Web-Kelompok11 | Linux Virtual Machine | southeastasia | Resource eksplorasi target Minggu 2; bukan runtime final | Terraform |
| 10 | stwebdashboardk11 | Storage Account | southeastasia | Static website backup/demo, bukan frontend utama | Terraform |
| 11 | stfuncmonitoringk11 | Storage Account | southeastasia | Storage internal Azure Functions dan Blob trigger | Terraform |
| 12 | raw-data | Storage Container | southeastasia | Container input file JSON, CSV, XLSX, dan XLS mentah | Terraform |
| 13 | ASP-Serverless-Kelompok11 | App Service Plan | southeastasia | Consumption plan Azure Functions | Terraform |
| 14 | func-backend-monitoring-k11 | Linux Function App | southeastasia | Primary backend API dan data processing | Terraform |
| 15 | ASP-BackupBackend-Kelompok11 | App Service Plan | southeastasia | Plan low-cost untuk secondary backend | Terraform |
| 16 | app-backend-backup-k11 | Windows Web App | southeastasia | Secondary/backup backend minimal untuk `/api/hello` dan `/api/fallback-status` | Terraform |
| 17 | cosmos-kelompok11-monitoring | Cosmos DB Account | southeastasia | Database account NoSQL serverless | Terraform |
| 18 | db-platform-monitoring | Cosmos DB Database | southeastasia | Database platform monitoring | Terraform |
| 19 | telemetry-data | Cosmos DB Container | southeastasia | Penyimpanan hasil pemrosesan data | Terraform |
| 20 | users | Cosmos DB Container | southeastasia | Penyimpanan user login/register | Terraform |
| 21 | kv-monitoring-k11-naufal | Key Vault | southeastasia | Penyimpanan secret Cosmos DB dan auth token | Terraform |
| 22 | cosmos-connection-string | Key Vault Secret | southeastasia | Secret connection string Cosmos DB | Terraform |
| 23 | auth-token-secret | Key Vault Secret | southeastasia | Secret tanda tangan token login | Terraform |
| 24 | func-backend-monitoring-k11 | Application Insights | southeastasia | Observability backend | Terraform |
| 25 | tm-monitoring-k11 | Traffic Manager Profile | Global | Backend failover routing ke Azure Functions dan App Service backup | Terraform |
| 26 | endpoint-backend-function | Traffic Manager External Endpoint | Global | Priority 1 ke Azure Functions | Terraform |
| 27 | secondary-backend-appservice | Traffic Manager External Endpoint | Global | Priority 2 ke Azure App Service backup | Terraform |
| 28 | ag-kelompok11-ops | Azure Monitor Action Group | southeastasia | Grup notifikasi alert operasional | Terraform |
| 29 | alert-function-5xx-errors | Azure Monitor Metric Alert | southeastasia | Alert error HTTP 5xx Azure Functions | Terraform |
| 30 | alert-function-latency | Azure Monitor Metric Alert | southeastasia | Alert latency Azure Functions | Terraform |
| 31 | alert-vm-cpu-high | Azure Monitor Metric Alert | southeastasia | Alert CPU VM eksplorasi Minggu 2 jika resource aktif | Terraform |
| 32 | diag-function-central-logs | Diagnostic Setting | southeastasia | Centralized log Azure Functions ke Log Analytics | Terraform |
| 33 | diag-cosmos-central-logs | Diagnostic Setting | southeastasia | Centralized log Cosmos DB ke Log Analytics | Terraform |
| 34 | diag-storage-blob-central-logs | Diagnostic Setting | southeastasia | Centralized log Blob Storage ke Log Analytics | Terraform |
| 35 | raw-data-retention | Storage Management Policy | southeastasia | Lifecycle policy file mentah | Terraform |

## Backend Runtime

| Komponen | Nilai |
| --- | --- |
| Primary runtime | Azure Functions Python 3.11 |
| Secondary runtime | Azure App Service Node.js 20 minimal fallback |
| Public frontend API path | `/api/*` melalui Cloudflare Pages Function |
| Backend failover | Azure Traffic Manager priority 1 Functions, priority 2 App Service |
| Production domain | `https://kelompok11cc.my.id` |
| Telemetry container | `telemetry-data`, partition key `/deviceId` |
| Users container | `users`, partition key `/email` |
| Blob trigger path | `raw-data/{name}` |
| Upload limit | 100 MB dan 1,000,000 record per file |
| Auth token TTL | 8 jam |

## Endpoint Aplikasi

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/api/hello` | Health check |
| POST | `/api/register` | Registrasi user |
| POST | `/api/login` | Login user |
| GET | `/api/me` | Profil user aktif |
| GET | `/api/stats` | Statistik total, processed, anomaly, dan error |
| GET | `/api/data` | Data terbaru |
| POST | `/api/analyze` | Analisis file tanpa menyimpan data |
| GET | `/api/analytics` | Profiling, quality report, dan chart dari data tersimpan |
| POST | `/api/upload` | Upload JSON, CSV, XLSX, atau XLS langsung |
| POST | `/api/upload?clean=true` | Upload dengan cleaning otomatis |
| GET | `/api/management/summary` | Admin-only ringkasan role dan telemetry |
| GET | `/api/management/users` | Admin-only daftar user |
| PATCH/POST | `/api/management/users/{user_id}/role` | Admin-only update role |
| GET | `/api/dev/ops-summary` | Dev/admin-only ringkasan Azure Monitor dan Cloudflare workload |
| GET | `/api/management/ops-summary` | Dev/admin-only alias ringkasan monitoring |
| GET | `/api/fallback-status` | Endpoint status pada App Service backup |

## Catatan Operasional

- Frontend utama berada di Cloudflare Pages.
- Domain production: `kelompok11cc.my.id`.
- Browser hanya memanggil `/api/*`; function key disimpan di Cloudflare Pages Function environment.
- Azure Functions adalah primary backend untuk fitur API utama.
- Azure App Service adalah secondary backend minimal. Ia tidak memproses login, upload, analytics, atau data utama.
- VM dan static website storage adalah artefak eksplorasi/backup, bukan jalur runtime final.
- Register publik hanya membuat role `user`; perubahan role admin/dev dilakukan melalui kontrol internal/panel admin yang dilindungi role.

## Kesimpulan

Resource utama proyek sudah mencakup frontend hosting, edge proxy, backend serverless, backend failover minimal, database, storage, secret management, monitoring, network baseline, dan IAM. Semua resource Azure utama dikelola menggunakan Terraform agar mudah direplikasi dan diaudit.
