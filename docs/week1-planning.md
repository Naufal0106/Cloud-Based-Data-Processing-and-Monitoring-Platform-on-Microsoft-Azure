# Perencanaan Proyek Cloud Computing

Kelompok 11

## Tema Proyek

Cloud-Based Data Processing and Monitoring Platform on Microsoft Azure

## Tujuan

Membangun platform cloud untuk pemrosesan data otomatis, penyimpanan data JSON/CSV/Excel, dan monitoring hasil pemrosesan melalui dashboard web.

## Arsitektur Target

Arsitektur akhir menggunakan dua platform:

- Cloudflare Pages untuk frontend dashboard.
- Microsoft Azure untuk backend, database, storage, secret management, monitoring, dan infrastruktur pendukung.

## Layanan yang Digunakan

| Platform | Layanan | Fungsi |
| --- | --- | --- |
| Cloudflare | Cloudflare Pages | Hosting dashboard statis |
| Azure | Azure Functions | Serverless API dan pemrosesan data |
| Azure | Azure Blob Storage | Penyimpanan file JSON, CSV, dan Excel mentah |
| Azure | Azure Cosmos DB | Database NoSQL untuk hasil pemrosesan |
| Azure | Azure Key Vault | Penyimpanan secret |
| Azure | Application Insights | Observability backend |
| Azure | Virtual Network dan NSG | Segmentasi dan kontrol jaringan |
| Azure | Virtual Machine | Web atau management server opsional |
| Azure | Traffic Manager | Endpoint routing atau backup |

## Pembagian Tugas

| Nama | Peran | Fokus |
| --- | --- | --- |
| Naufal Ihsan Sriyanto | DevOps Engineer | Terraform, GitHub Actions, deployment |
| Zhykwa Ceryl Mavanudin | Cloud Architect | Arsitektur cloud, network design |
| Muhammad Arifin Ilham | Backend Developer | Azure Functions, Cosmos DB integration |
| Rendy Saputra | Security Engineer | IAM, Key Vault, NSG, security review |

## Deliverable

- Source code backend Azure Functions.
- Source code dashboard frontend.
- Terraform infrastructure code.
- Dokumentasi arsitektur, jaringan, IAM, dan resource.
- CI/CD backend melalui GitHub Actions.
- Frontend statis yang siap dideploy ke Cloudflare Pages.

## Status

Tahap perencanaan selesai dan dilanjutkan ke implementasi infrastruktur dasar.
