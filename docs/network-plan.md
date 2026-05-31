# Perencanaan Jaringan Cloud

Final Project Cloud Computing - Kelompok 11

## Tujuan

Dokumen ini menjelaskan rancangan jaringan dan koneksi publik platform final: Cloudflare sebagai edge/frontend/proxy, Azure sebagai backend/failover/data layer, serta VNet/NSG sebagai fondasi eksplorasi infrastruktur Minggu 2.

## Topologi Ringkas

```text
Internet
  |
  v
Cloudflare DNS + CDN
  |
  v
Cloudflare Pages Dashboard
  |
  v
Cloudflare Pages Function Proxy /api/*
  |
  v
Azure Traffic Manager (backend failover)
  |
  +-- Priority 1: Azure Functions primary backend
  |
  +-- Priority 2: Azure App Service backup backend

Azure Data Layer:
  +-- Blob Storage raw-data
  +-- Cosmos DB db-platform-monitoring
  +-- Key Vault
  +-- Application Insights / Azure Monitor

Azure VNet baseline Minggu 2:
  +-- VNet-Utama-Kelompok11 10.0.0.0/16
      +-- Subnet-Publik 10.0.1.0/24
      +-- Subnet-Privat 10.0.2.0/24
      +-- VM-Web-Kelompok11 untuk eksplorasi M2, bukan runtime final
```

## Virtual Network

| Nama | Address Space | Region | Peran |
| --- | --- | --- | --- |
| VNet-Utama-Kelompok11 | 10.0.0.0/16 | southeastasia | Fondasi jaringan eksplorasi Minggu 2 dan baseline jika private endpoint ditambahkan |

## Subnet

| Nama | CIDR | Fungsi |
| --- | --- | --- |
| Subnet-Publik | 10.0.1.0/24 | Subnet eksplorasi resource publik/VM Minggu 2 |
| Subnet-Privat | 10.0.2.0/24 | Reserved untuk resource internal atau private endpoint jika proyek dikembangkan |

Catatan: Azure Functions, Cosmos DB, Key Vault, dan Storage pada arsitektur final saat ini tidak diklaim berjalan di private subnet. Koneksi aplikasi berjalan melalui endpoint layanan Azure dan proxy Cloudflare.

## Network Security Group

### NSG Publik

| Rule | Port | Source | Fungsi |
| --- | --- | --- | --- |
| Allow-HTTP | 80 | Internet | Baseline akses HTTP untuk resource eksplorasi |
| Allow-HTTPS | 443 | Internet | Baseline akses HTTPS untuk resource eksplorasi |
| Allow-SSH-AdminOnly | 22 | Admin IP | Akses SSH VM eksplorasi M2 jika masih aktif |
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

Nameserver domain diarahkan ke Cloudflare. Detail nameserver tidak dicantumkan di repository publik.

Frontend mengakses backend melalui proxy same-origin:

```text
/api/*
```

Cloudflare Pages Function meneruskan request ke backend Azure dan menambahkan function key di sisi server. Dengan pola ini, Azure Function URL dan function key tidak terlihat di browser.

Traffic Manager digunakan sebagai lapisan backend failover. Dalam dokumentasi final, Azure Functions adalah primary backend dan Azure App Service adalah secondary/backup backend minimal. App Service backup hanya menyediakan endpoint status/fallback, bukan API data processing penuh.

Karena request browser menuju domain Cloudflare yang sama, CORS browser menjadi lebih sederhana. Jika pengujian memanggil Azure Functions langsung, Azure Function App perlu mengizinkan origin domain Cloudflare Pages.

Contoh origin:

```text
https://kelompok11cc.my.id
https://www.kelompok11cc.my.id
```

## Rekomendasi Lanjutan

- Jika VM eksplorasi M2 masih dinyalakan, batasi SSH hanya dari IP admin dan gunakan SSH key.
- Tambahkan private endpoint untuk Cosmos DB, Key Vault, dan Storage jika proyek dikembangkan ke production.
- Perluas App Service backup jika kebutuhan failover berubah dari health/fallback menjadi full API failover.
