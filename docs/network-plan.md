# Perencanaan Jaringan Cloud

Final Project Cloud Computing - Kelompok 11

## Tujuan

Dokumen ini menjelaskan rancangan jaringan untuk resource Azure dan hubungan antara frontend Cloudflare Pages dengan backend Azure.

## Topologi Ringkas

```text
Internet
  |
  +-- Cloudflare Pages
  |     |
  |     v
  |   Dashboard Frontend
  |     |
  |     v
  |   Azure Functions HTTPS Endpoint
  |
  +-- Azure Public IP / VM Web

Azure VNet: 10.0.0.0/16
  |
  +-- Public Subnet: 10.0.1.0/24
  |     +-- VM Web / management endpoint
  |
  +-- Private Subnet: 10.0.2.0/24
        +-- Reserved untuk resource internal
```

## Virtual Network

| Nama | Address Space | Region |
| --- | --- | --- |
| VNet-Utama-Kelompok11 | 10.0.0.0/16 | southeastasia |

## Subnet

| Nama | CIDR | Fungsi |
| --- | --- | --- |
| Subnet-Publik | 10.0.1.0/24 | VM web, public management, endpoint yang perlu akses internet |
| Subnet-Privat | 10.0.2.0/24 | Reserved untuk backend internal atau database jika private endpoint ditambahkan |

## Network Security Group

### NSG Publik

| Rule | Port | Source | Fungsi |
| --- | --- | --- | --- |
| Allow-HTTP | 80 | Internet | Akses HTTP ke web endpoint |
| Allow-HTTPS | 443 | Internet | Akses HTTPS ke web endpoint |
| Allow-SSH-AdminOnly | 22 | Admin IP | Akses SSH, sebaiknya tidak menggunakan `*` |
| Deny-All-Inbound | All | Any | Menolak traffic lain |

### NSG Privat

| Rule | Source | Fungsi |
| --- | --- | --- |
| Allow-Internal-Only | 10.0.1.0/24 | Mengizinkan traffic internal dari subnet publik |
| Deny-Internet-To-Private | Internet | Menolak akses langsung dari internet |

## Koneksi Frontend dan Backend

Frontend di Cloudflare Pages menggunakan custom domain:

```text
https://kelompok11cc.my.id
```

Nameserver domain:

```text
***REMOVED_NAMESERVER***
***REMOVED_NAMESERVER***
```

Frontend mengakses backend melalui proxy same-origin:

```text
/api
```

Proxy Cloudflare Pages Function meneruskan request ke Azure Functions dan menambahkan function key di sisi server. Dengan pola ini, Azure Function URL dan function key tidak terlihat di browser.

Karena request browser menuju domain Cloudflare yang sama, CORS untuk browser menjadi lebih sederhana. Jika frontend memanggil Azure Functions langsung untuk pengujian tertentu, Azure Function App perlu mengizinkan origin domain Cloudflare Pages.

Contoh origin:

```text
https://kelompok11cc.my.id
https://www.kelompok11cc.my.id
```

## Rekomendasi Lanjutan

- Batasi SSH hanya dari IP admin.
- Gunakan SSH key, bukan password VM.
- Tambahkan private endpoint untuk Cosmos DB dan Key Vault jika proyek dikembangkan ke production.
- Gunakan Cloudflare Pages Function atau API Management sebagai proxy agar function key tidak terekspos ke browser publik.
