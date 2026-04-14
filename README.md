# Cloud-Based Data Processing & Monitoring Platform
**Final Project Cloud Computing - Teknik Informatika UPR**

## Tim Proyek
* Naufal Ihsan Sriyanto (DevOps Engineer)
* Zhykwa Ceryl (Cloud Architect)
* Arifin (Backend Developer)
* Rendy Saputra (Security Engineer)

## Deskripsi Singkat
Platform pemrosesan data otomatis (Event-Driven) menggunakan layanan Azure: VM, Functions, CosmosDB, Blob Storage, CDN, dan Key Vault.

## Arsitektur
<img width="2800" height="4749" alt="Arsitektur Diagram drawio (1)" src="https://github.com/user-attachments/assets/076b279b-7623-4eef-804c-74d557d0081a" />

## Tech Stack (Layanan Azure)
| Komponen | Layanan Azure | Peran |
| :--- | :--- | :--- |
| **Compute** | Virtual Machines (B2als v2) & Azure Functions | Dashboard management & serverless data processing. |
| **Database** | Azure Cosmos DB (NoSQL) | Penyimpanan metadata dan hasil olah data. |
| **Storage** | Azure Blob Storage | Penyimpanan file mentah (Raw Data). |
| **Security** | Azure Key Vault & NSG | Manajemen rahasia (secrets) & firewall jaringan. |
| **Networking** | Load Balancer & CDN | Distribusi trafik dan akselerasi konten. |
| **Observability**| Azure Monitor & Log Analytics | Health monitoring & Budget alerting. |

## Struktur Repositori
Repositori ini dikelola dengan standar operasional DevOps untuk memudahkan kolaborasi tim:
* `arch/` : Berisi diagram arsitektur sistem dan file mentah desain.
* `docs/` : Dokumen perencanaan proyek dan laporan estimasi biaya (RAB).
* `infra/`: (Placeholder) Skrip automasi infrastruktur dan konfigurasi cloud.
* `src/`  : Folder utama untuk kode sumber aplikasi (Backend & Dashboard).

## Estimasi Biaya (Cost Awareness)
Berdasarkan perhitungan menggunakan *Azure Pricing Calculator*, estimasi biaya operasional bulanan adalah:
**Total: $37.60 / bulan (± Rp 601.600,-)**
