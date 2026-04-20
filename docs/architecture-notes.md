# architecture-notes.md

# CATATAN ARSITEKTUR SISTEM
## Final Project Cloud Computing – Kelompok 11

## Tujuan

Dokumen ini menjelaskan alasan pemilihan desain arsitektur cloud yang digunakan pada proyek Microsoft Azure.

---

## 1. Pemilihan Platform Cloud

Kelompok memilih **Microsoft Azure** karena:

- Tersedia region Indonesia Central
- Integrasi layanan lengkap
- Mendukung Terraform
- Cocok untuk pembelajaran cloud enterprise
- Memiliki layanan serverless, database, storage, dan monitoring

---

## 2. Desain Infrastruktur Jaringan

Arsitektur menggunakan model segmentasi jaringan:

- Public Subnet
- Private Subnet

Tujuan:

- Memisahkan resource publik dan internal
- Meningkatkan keamanan
- Memudahkan manajemen akses

---

## 3. Public Subnet

Digunakan untuk layanan yang membutuhkan akses internet.

Contoh penggunaan:

- Web Server
- Bastion Host
- Load Balancer

Alasan:

- Memudahkan akses pengguna
- Menjadi gerbang masuk trafik publik

---

## 4. Private Subnet

Digunakan untuk layanan internal.

Contoh penggunaan:

- Backend API
- Database
- Internal processing service

Alasan:

- Lebih aman
- Tidak dapat diakses langsung dari internet
- Cocok untuk data sensitif

---

## 5. Terraform sebagai IaC

Terraform dipilih karena:

- Otomatisasi deployment
- Mudah version control melalui GitHub
- Infrastruktur konsisten
- Mudah rollback dan maintenance

---

## 6. Strategi Keamanan

Prinsip keamanan yang digunakan:

- Least Privilege Access
- Role Based Access Control (RBAC)
- Segmentasi subnet
- Pemisahan resource publik dan privat

---

## 7. Skalabilitas

Arsitektur dirancang agar mudah dikembangkan dengan penambahan:

- Virtual Machine tambahan
- Load Balancer
- Auto Scaling
- Azure Functions
- Monitoring dashboard

---

## 8. Alur Sistem

```text
User
 |
Internet
 |
Public Subnet
 |
Web Layer
 |
Private Subnet
 |
Backend / Database