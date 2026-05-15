# Konfigurasi IAM

Identity and Access Management - Kelompok 11

## Tujuan

Dokumen ini menjelaskan pembagian akses anggota tim terhadap resource Azure berdasarkan prinsip least privilege dan Role-Based Access Control (RBAC).

## Scope Akses

Scope utama role assignment:

```text
Resource Group: RG-Kelompok11
```

## Role Assignment Berdasarkan Terraform

| Nama Anggota | Peran Tim | Role Azure | Tujuan |
| --- | --- | --- | --- |
| Naufal Ihsan Sriyanto | DevOps Engineer | Owner | Mengelola deployment dan administrasi resource |
| Naufal Ihsan Sriyanto | DevOps Engineer | Monitoring Contributor | Mengelola monitoring dan observability |
| Naufal Ihsan Sriyanto | DevOps Engineer | Cost Management Contributor | Mengelola budget dan optimasi biaya |
| Rendy Saputra | Security Engineer | Security Admin | Mengelola konfigurasi keamanan dan audit |
| Muhammad Arifin Ilham | Backend Developer | DocumentDB Account Contributor | Mengelola Cosmos DB |
| Muhammad Arifin Ilham | Backend Developer | Website Contributor | Mengelola Azure Functions atau web app |
| Zhykwa Ceryl Mavanudin | Cloud Architect | Network Contributor | Mengelola VNet, subnet, NSG, dan resource jaringan |

## Akses Key Vault

| Principal | Permission | Tujuan |
| --- | --- | --- |
| Current Terraform principal | Get, List, Set, Delete, Purge, Recover | Administrasi secret saat provisioning |
| Managed Identity Function App | Get, List | Membaca secret Cosmos DB connection string |

## Prinsip Keamanan

- Tidak menggunakan akun bersama.
- Akses diberikan sesuai tanggung jawab tim.
- Secret database disimpan di Key Vault.
- Function App menggunakan managed identity untuk membaca secret.
- File lokal yang berisi credential, seperti `.tfvars`, `.env`, dan `src/dashboard/env.js`, tidak boleh dicommit.

## Rekomendasi Perbaikan

- Gunakan Privileged Identity Management untuk role dengan privilege tinggi jika tersedia.
- Batasi akses `Owner` hanya untuk kebutuhan deployment.
- Audit role assignment secara berkala.
- Gunakan federated credentials/OIDC untuk GitHub Actions jika memungkinkan.

## Kesimpulan

Konfigurasi IAM sudah dibagi sesuai peran utama tim. Model ini mendukung kolaborasi sekaligus menjaga akses tetap terkontrol.
