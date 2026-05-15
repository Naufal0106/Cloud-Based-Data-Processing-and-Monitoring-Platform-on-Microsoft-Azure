# Implementasi Infrastruktur Dasar

Minggu 2 - Kelompok 11

## Tujuan

Membangun fondasi infrastruktur cloud menggunakan Microsoft Azure dan Terraform.

## Infrastruktur yang Dibuat

### Resource Group

| Nama | Region |
| --- | --- |
| RG-Kelompok11 | southeastasia |

### Virtual Network

| Nama | Address Space |
| --- | --- |
| VNet-Utama-Kelompok11 | 10.0.0.0/16 |

### Subnet

| Nama | CIDR | Fungsi |
| --- | --- | --- |
| Subnet-Publik | 10.0.1.0/24 | Resource publik dan VM web |
| Subnet-Privat | 10.0.2.0/24 | Resource internal atau private endpoint |

### IAM

Role assignment dibuat berdasarkan peran anggota tim. Scope utama adalah Resource Group `RG-Kelompok11`.

### Terraform Resource

- `azurerm_resource_group`
- `azurerm_virtual_network`
- `azurerm_subnet`
- `azurerm_public_ip`
- `azurerm_network_interface`
- `azurerm_linux_virtual_machine`
- `azurerm_network_security_group`
- `azurerm_role_assignment`

## Status Progress

| Infrastruktur | Status |
| --- | --- |
| Resource Group | Selesai |
| Virtual Network | Selesai |
| Public Subnet | Selesai |
| Private Subnet | Selesai |
| Network Security Group | Selesai |
| IAM/RBAC | Selesai |
| Terraform base configuration | Selesai |

## Penanggung Jawab

| Peran | Nama |
| --- | --- |
| Cloud Architect | Zhykwa Ceryl Mavanudin |
| DevOps Engineer | Naufal Ihsan Sriyanto |
| Security Engineer | Rendy Saputra |

## Catatan

Dokumen ini berfokus pada fondasi awal. Layanan aplikasi seperti Azure Functions, Cosmos DB, Key Vault, dan Cloudflare Pages dijelaskan lebih lanjut pada dokumen arsitektur dan resource inventory.

## Kesimpulan

Fondasi infrastruktur Azure berhasil disiapkan dan dapat digunakan untuk deployment layanan backend, storage, database, dan monitoring.
