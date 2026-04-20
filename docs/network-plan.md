# network-plan.md

# PERENCANAAN JARINGAN CLOUD
## Minggu 2 – Cloud Architect

## Tujuan
Menyusun struktur jaringan cloud yang aman, terpisah, dan siap dikembangkan.

## Virtual Network

| Nama VNet | Address Space |
|----------|---------------|
| VNet-Utama-Kelompok11 | 10.0.0.0/16 |

## Subnet

### Public Subnet

| Nama | CIDR |
|------|------|
| Subnet-Publik | 10.0.1.0/24 |

Digunakan untuk:
- Web Server
- Bastion Host
- Public VM

### Private Subnet

| Nama | CIDR |
|------|------|
| Subnet-Privat | 10.0.2.0/24 |

Digunakan untuk:
- Backend Server
- Database
- Internal Service

## Topologi

```text
Internet
   |
Public Subnet
   |
Web Server
   |
Private Subnet
   |
Backend / Database