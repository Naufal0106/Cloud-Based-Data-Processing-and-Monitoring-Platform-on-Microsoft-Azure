# progress-report.md

# LAPORAN PROGRES MINGGU 2
## Final Project Cloud Computing – Kelompok 11

## Ringkasan Progress

Pada minggu ke-2, kelompok berhasil menyelesaikan implementasi fondasi infrastruktur cloud menggunakan Microsoft Azure dengan Terraform sebagai Infrastructure as Code (IaC).

Fokus pekerjaan berada pada pembangunan jaringan virtual, segmentasi subnet, serta pembagian hak akses anggota tim.

---

## Pekerjaan yang Berhasil Diselesaikan

### Infrastruktur

- Membuat Resource Group `RG-Kelompok11`
- Membuat Virtual Network `VNet-Utama-Kelompok11`
- Membuat Public Subnet `10.0.1.0/24`
- Membuat Private Subnet `10.0.2.0/24`

### Terraform

- Menyiapkan provider AzureRM
- Menulis konfigurasi Terraform
- Menjalankan inisialisasi dan deployment resource

### IAM

- Membuat Role Assignment anggota tim
- Mengatur akses berbasis peran (RBAC)

### Dokumentasi

- Menyusun network plan
- Menyusun inventaris resource
- Menyusun konfigurasi IAM

---

## Kendala yang Dihadapi

| Kendala | Solusi |
|--------|-------|
| Resource Group sudah ada | Menyesuaikan Terraform / import resource |
| Sinkronisasi tim | Menggunakan GitHub |
| Pembagian tugas | Menyesuaikan peran masing-masing |

---

## Kontribusi Tim

| Nama | Peran | Kontribusi |
|------|------|-----------|
| Naufal Ihsan Sriyanto | DevOps Engineer | Terraform deployment & GitHub |
| Zhykwa Ceryl Mavanudin | Cloud Architect | Network design & dokumentasi |
| Muhammad Arifin Ilham | Backend Developer | Persiapan backend infrastructure |
| Rendy Saputra | Security Engineer | IAM & security planning |

---

## Status Minggu 2

| Item | Status |
|------|--------|
| Resource Group | ✅ |
| VNet | ✅ |
| Public Subnet | ✅ |
| Private Subnet | ✅ |
| IAM | ✅ |
| Terraform | ✅ |
| Dokumentasi | ✅ |

---

## Rencana Minggu 3

- Deploy Virtual Machine
- Setup Azure Storage
- Setup Database
- Implementasi layanan inti
- Uji konektivitas sistem

---

## Kesimpulan

Minggu ke-2 berjalan dengan baik. Fondasi infrastruktur cloud telah selesai dibangun dan proyek siap melanjutkan implementasi layanan inti pada minggu ke-3.