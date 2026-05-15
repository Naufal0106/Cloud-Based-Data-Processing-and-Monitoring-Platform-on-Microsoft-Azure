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
- Public IP, NIC, dan VM web opsional.
- Storage Account untuk Azure Functions dan Blob Storage.
- Azure Cosmos DB serverless.
- Azure Key Vault.
- Application Insights.
- Traffic Manager.

### Backend

- Azure Functions menggunakan Python 3.11.
- HTTP endpoint untuk `hello`, `register`, `login`, `me`, `stats`, `data`, dan `upload`.
- Login/register user dengan password hash PBKDF2 dan token sesi.
- Database user dipisahkan ke Cosmos DB container `users`.
- Blob trigger untuk container `raw-data`.
- Validasi parameter `limit` dan `status`.
- Query Cosmos DB untuk filter status menggunakan parameter.
- Record hasil proses memiliki `deviceId` agar sesuai partition key Cosmos DB.
- Statistik menampilkan total, processed, anomaly, dan error.

### Frontend

- Dashboard statis di `src/dashboard`.
- UI dashboard sudah diperbarui agar lebih rapi dan responsive.
- Layar login/register ditambahkan sebelum dashboard.
- Mode demo tersedia jika backend proxy belum dikonfigurasi.
- Upload JSON, CSV, XLSX, dan XLS divalidasi di sisi browser lalu diproses di backend.
- Konfigurasi frontend menggunakan `env.js` lokal atau environment Cloudflare Pages.

### DevOps

- Terraform digunakan untuk provisioning Azure.
- GitHub Actions digunakan untuk deploy backend ke Azure Functions.
- `.gitignore` menjaga file secret dan local config agar tidak masuk repository.

### Dokumentasi

- README diperbarui sesuai arsitektur Cloudflare + Azure.
- Dokumen arsitektur, network plan, IAM, resource inventory, dan progress report diselaraskan.

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

## Status Saat Ini

| Area | Status |
| --- | --- |
| Frontend dashboard | Siap uji lokal dan deploy Cloudflare Pages |
| Backend Azure Functions | Siap deploy melalui GitHub Actions |
| Infrastruktur Azure | Dikelola Terraform |
| Dokumentasi | Diperbarui |
| Security baseline | Ada, perlu hardening lanjutan untuk production |

## Rekomendasi Lanjutan

- Gunakan Cloudflare Pages Function atau API Management agar function key tidak terekspos di browser publik.
- Batasi SSH VM hanya dari IP admin.
- Gunakan SSH key dan nonaktifkan password authentication VM.
- Tambahkan alert Application Insights untuk error rate dan latency.
- Jalankan `terraform validate` setelah provider lock/cache lokal tersinkron.

## Kesimpulan

Platform sudah memiliki pondasi lengkap: frontend statis, backend serverless, storage, database, secret management, observability, IaC, dan CI/CD. Proyek siap untuk uji demo dan penyempurnaan deployment.
