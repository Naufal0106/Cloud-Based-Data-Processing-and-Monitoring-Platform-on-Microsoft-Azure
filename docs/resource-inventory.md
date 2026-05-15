# Inventaris Resource Cloud

Final Project Cloud Computing - Kelompok 11

## Tujuan

Dokumen ini mendata resource yang digunakan pada platform data processing dan monitoring. Resource dibagi menjadi layanan Cloudflare untuk frontend dan layanan Azure untuk backend serta infrastruktur pendukung.

## Resource Cloudflare

| Nama | Tipe | Fungsi | Status |
| --- | --- | --- | --- |
| Cloudflare Pages Project | Static hosting | Hosting dashboard `src/dashboard` | Aktif/target deployment |
| kelompok11cc.my.id | Custom domain | Domain production dashboard | Nameserver Cloudflare |

## Resource Azure

| No | Nama Resource | Tipe | Region | Fungsi | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | RG-Kelompok11 | Resource Group | southeastasia | Wadah seluruh resource Azure | Terraform |
| 2 | VNet-Utama-Kelompok11 | Virtual Network | southeastasia | Jaringan utama | Terraform |
| 3 | Subnet-Publik | Subnet | southeastasia | Subnet untuk resource publik | Terraform |
| 4 | Subnet-Privat | Subnet | southeastasia | Subnet untuk resource internal | Terraform |
| 5 | NSG-Publik-Kelompok11 | Network Security Group | southeastasia | Firewall subnet publik | Terraform |
| 6 | NSG-Privat-Kelompok11 | Network Security Group | southeastasia | Firewall subnet privat | Terraform |
| 7 | IP-Publik-Web-Kelompok11 | Public IP | southeastasia | IP publik untuk VM web | Terraform |
| 8 | NIC-Web-Kelompok11 | Network Interface | southeastasia | NIC untuk VM web | Terraform |
| 9 | VM-Web-Kelompok11 | Linux Virtual Machine | southeastasia | Web atau management server opsional | Terraform |
| 10 | stwebdashboardk11 | Storage Account | southeastasia | Static website backup/opsional | Terraform |
| 11 | stfuncmonitoringk11 | Storage Account | southeastasia | Storage internal Azure Functions dan Blob trigger | Terraform |
| 12 | raw-data | Storage Container | southeastasia | Container input file JSON, CSV, dan Excel mentah | Terraform |
| 13 | ASP-Serverless-Kelompok11 | App Service Plan | southeastasia | Consumption plan Azure Functions | Terraform |
| 14 | func-backend-monitoring-k11 | Linux Function App | southeastasia | Backend API dan data processing | Terraform |
| 15 | cosmos-kelompok11-monitoring | Cosmos DB Account | southeastasia | Database account NoSQL serverless | Terraform |
| 16 | db-platform-monitoring | Cosmos DB Database | southeastasia | Database platform monitoring | Terraform |
| 17 | telemetry-data | Cosmos DB Container | southeastasia | Penyimpanan hasil pemrosesan data | Terraform |
| 18 | users | Cosmos DB Container | southeastasia | Penyimpanan user login/register | Terraform |
| 19 | kv-monitoring-k11-naufal | Key Vault | southeastasia | Penyimpanan secret Cosmos DB | Terraform |
| 20 | cosmos-connection-string | Key Vault Secret | southeastasia | Secret connection string Cosmos DB | Terraform |
| 21 | auth-token-secret | Key Vault Secret | southeastasia | Secret tanda tangan token login | Terraform |
| 22 | func-backend-monitoring-k11 | Application Insights | southeastasia | Observability backend | Terraform |
| 23 | tm-monitoring-k11 | Traffic Manager Profile | Global | Routing atau endpoint failover | Terraform |

## Backend Runtime

| Komponen | Nilai |
| --- | --- |
| Runtime | Python |
| Python version | 3.11 |
| Public frontend API path | `/api` melalui Cloudflare Pages Function |
| Production domain | `https://kelompok11cc.my.id` |
| Telemetry container | `telemetry-data`, partition key `/deviceId` |
| Users container | `users`, partition key `/email`, unique key `/email` |
| Blob trigger path | `raw-data/{name}` |
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
| POST | `/api/upload` | Upload JSON, CSV, XLSX, atau XLS langsung |

## Catatan Operasional

- Frontend utama berada di Cloudflare Pages.
- Domain production: `kelompok11cc.my.id`.
- Azure Storage static website masih dapat digunakan sebagai backup atau demo.
- Function key harus dikonfigurasi sebagai environment variable Cloudflare Pages Function, bukan melalui `env.js`.
- File `env.js` tidak boleh dicommit karena dapat berisi secret.

## Kesimpulan

Resource utama proyek sudah mencakup frontend hosting, backend serverless, database, storage, secret management, monitoring, network, dan IAM. Semua resource Azure utama dikelola menggunakan Terraform agar mudah direplikasi dan diaudit.
