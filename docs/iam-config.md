# iam-config.md

# KONFIGURASI IAM
## Identity & Access Management
### Minggu 2 – Kelompok 11

## Tujuan
Mengatur hak akses anggota tim terhadap resource Microsoft Azure berdasarkan prinsip Least Privilege dan Role-Based Access Control (RBAC).

## Scope Akses

Seluruh akses diberikan pada:

- Resource Group: RG-Kelompok11

## Daftar Role Anggota

| Nama Anggota | Peran | Role Azure |
|-------------|------|-----------|
| Naufal Ihsan Sriyanto | DevOps Engineer | Owner |
| Zhykwa Ceryl Mavanudin | Cloud Architect | Contributor |
| Muhammad Arifin Ilham | Backend Developer | Contributor |
| Rendy Saputra | Security Engineer | Contributor |

## Penjelasan Tugas

### DevOps Engineer
- Menjalankan Terraform
- Deploy resource cloud
- Monitoring deployment
- Integrasi GitHub

### Cloud Architect
- Mendesain arsitektur cloud
- Mengatur jaringan VNet
- Menentukan subnet dan struktur resource

### Backend Developer
- Integrasi database
- Azure Function
- Backend service

### Security Engineer
- Audit keamanan
- Review IAM
- Security policy
- Least privilege access

## Prinsip Keamanan

- Akses hanya sesuai kebutuhan pekerjaan
- Role dikelola terpusat
- Tidak menggunakan akun bersama
- Mudah diaudit

## Status

| Item                  | Status |
|-----------------------|--------|
| Role Assignment       |   ✅  |
| Scope Resource Group  |   ✅  |
| Least Privilege       |   ✅  |

## Kesimpulan

Konfigurasi IAM berhasil diterapkan untuk seluruh anggota tim agar pengelolaan resource Azure lebih aman, terstruktur, dan sesuai tanggung jawab masing-masing.