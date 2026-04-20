# resource-inventory.md

# INVENTARIS RESOURCE CLOUD
## Minggu 2 – Kelompok 11

## Tujuan
Mendokumentasikan seluruh resource cloud yang dibuat pada tahap implementasi infrastruktur dasar.

## Daftar Resource

| No | Nama Resource | Tipe Resource | Region | Fungsi |
|----|--------------|--------------|--------|--------|
| 1 | RG-Kelompok11 | Resource Group | Indonesia Central | Wadah seluruh resource proyek |
| 2 | VNet-Utama-Kelompok11 | Virtual Network | Indonesia Central | Jaringan utama cloud |
| 3 | Subnet-Publik | Subnet | Indonesia Central | Jalur resource publik |
| 4 | Subnet-Privat | Subnet | Indonesia Central | Jalur resource internal |
| 5 | IAM Role Assignment | Identity Access | Indonesia Central | Hak akses anggota tim |

## Resource yang Direncanakan Minggu Berikutnya

| No | Nama Resource | Tipe | Fungsi |
|----|--------------|------|--------|
| 1 | VM-Web01 | Virtual Machine | Web server |
| 2 | VM-App01 | Virtual Machine | Backend server |
| 3 | Azure Blob Storage | Storage | Penyimpanan file |
| 4 | Azure Cosmos DB | Database | Penyimpanan data |
| 5 | Azure Monitor | Monitoring | Monitoring sistem |

## Status Resource

| Resource | Status |
|---------|--------|
| Resource Group | ✅ |
| VNet | ✅ |
| Public Subnet | ✅ |
| Private Subnet | ✅ |
| IAM | ✅ |

## Catatan

- Semua resource dibuat menggunakan Terraform.
- Penamaan resource dibuat konsisten.
- Infrastruktur siap dikembangkan pada minggu berikutnya.

## Kesimpulan

Inventaris resource berhasil dibuat untuk mempermudah monitoring, dokumentasi, dan pengelolaan cloud infrastructure proyek.