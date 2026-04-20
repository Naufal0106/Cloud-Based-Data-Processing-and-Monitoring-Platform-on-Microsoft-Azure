# week2-infrastructure.md

# IMPLEMENTASI INFRASTRUKTUR DASAR
## Minggu 2 – Kelompok 11

## Tujuan
Membangun fondasi infrastruktur cloud menggunakan Microsoft Azure dan Terraform.

## Infrastruktur yang Dibuat

### Resource Group
- RG-Kelompok11

### Virtual Network
- VNet-Utama-Kelompok11
- Address Space: 10.0.0.0/16

### Public Subnet
- Subnet-Publik
- CIDR: 10.0.1.0/24

### Private Subnet
- Subnet-Privat
- CIDR: 10.0.2.0/24

## Terraform Resource
- azurerm_resource_group
- azurerm_virtual_network
- azurerm_subnet
- azurerm_role_assignment

## IAM
Role assignment diberikan kepada anggota tim sesuai tugas masing-masing.

## Status Progress

| Infrastruktur  | Status |
|--------------  |--------|
| Resource Group | ✅    |
| VNet           | ✅    |
| Public Subnet  | ✅    |
| Private Subnet | ✅    |
| IAM            | ✅    |
| Terraform      | ✅    |

## Penanggung Jawab
- Cloud Architect: Zhykwa Ceryl Mavanudin
- DevOps Engineer: Naufal Ihsan Sriyanto

## Kesimpulan
Fondasi infrastruktur cloud berhasil dibangun dan siap digunakan pada minggu berikutnya.