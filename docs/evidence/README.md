# Bukti Screenshot Roadmap Minggu 1-4

Folder ini menyimpan bukti visual yang aman untuk dilampirkan pada laporan atau presentasi. Screenshot yang berisi secret, token, function key, connection string, atau detail nameserver tidak boleh dimasukkan ke repository.

Laporan PDF rinci Minggu 1-4 tersedia di:

```text
docs/Laporan_Minggu_1-4_Kelompok_11.pdf
```

Laporan yang dipisah per minggu tersedia di:

```text
docs/laporan-mingguan/
```

## Bukti Yang Sudah Ada

| Minggu | Bukti | File |
| --- | --- | --- |
| Minggu 1 | Diagram arsitektur final | `arsitektur-final.png` |
| Minggu 1 | Alias kompatibilitas diagram final | `architecture-final-target.png` |
| Minggu 3 | Halaman login kosong untuk akun baru | `ui-login.png` |
| Minggu 3 | Halaman register | `ui-register.png` |
| Minggu 3 | Preview dashboard role user | `ui-user-preview.png` |
| Minggu 3 | Preview dashboard role admin | `ui-admin-preview.png` |
| Minggu 4 | Application Insights dan metrik Azure | `week4-application-insights-metrics.png` |
| Minggu 4 | Azure Monitor alert rules dan action group | `week4-alert-rules-action-group.png` |
| Minggu 4 | Cosmos DB backup policy dan Blob Storage | `week4-cosmos-storage-backup.png` |
| Minggu 4 | Defender/Security pricing dan Cost Management usage | `week4-security-cost-management.png` |

## Bukti Console Yang Perlu Diambil Manual

Beberapa bukti harus diambil dari Azure Portal atau Cloudflare dashboard karena membutuhkan sesi login dan state resource cloud yang aktif.

| Minggu | Screenshot Yang Disarankan | Lokasi Portal | Catatan Sensor |
| --- | --- | --- | --- |
| Minggu 2 | Resource Group `RG-Kelompok11` berisi resource project | Azure Portal > Resource groups | Jangan tampilkan subscription ID penuh jika tidak perlu |
| Minggu 2 | VNet, public subnet, private subnet | Azure Portal > Virtual networks | Fondasi eksplorasi M2, bukan klaim runtime final |
| Minggu 2 | NSG rules publik/privat | Azure Portal > Network security groups | Mask IP admin jika ada |
| Minggu 2 | VM eksplorasi M2 jika masih ada | Azure Portal > Virtual machines | VM bukan jalur runtime final |
| Minggu 2 | IAM role assignment tim | Azure Portal > Access control (IAM) | Tampilkan role, sembunyikan email bila perlu |
| Minggu 3 | Traffic Manager backend failover | Azure Portal > Traffic Manager profiles | Tampilkan endpoint primary Functions dan secondary App Service |
| Minggu 3 | App Service backup minimal | Azure Portal > App Services | Jangan tampilkan secret/app setting |
| Minggu 3 | Cosmos DB database dan container `telemetry-data`, `users` | Azure Portal > Cosmos DB | Jangan tampilkan connection string/key |
| Minggu 3 | Blob container `raw-data` | Azure Portal > Storage Account > Containers | Jangan buka access key |
| Minggu 3 | Azure Function App endpoint/status | Azure Portal > Function App | Jangan tampilkan function key |
| Minggu 3 | Cloudflare Pages custom domain aktif | Cloudflare Pages > Custom domains | Jangan tampilkan token/API key |
| Minggu 4 | Application Insights overview/request metrics | Azure Portal > Application Insights | Bukti CLI sudah tersedia, screenshot portal opsional |
| Minggu 4 | Alert rules dan action group | Azure Monitor > Alerts | Bukti CLI sudah tersedia, mask email jika ambil portal |
| Minggu 4 | Cost Management breakdown | Azure Portal > Cost Management | Bukti CLI usage tersedia, screenshot portal opsional |
| Minggu 4 | Defender for Cloud/Security recommendations | Azure Portal > Defender for Cloud | Bukti CLI pricing tersedia, hindari ID tenant/subscription penuh |
| Minggu 4 | Backup/recovery evidence | Cosmos DB/Storage export atau restore evidence | Bukti Cosmos backup policy dan Blob container sudah tersedia |

## Cara Menyimpan Screenshot Tambahan

Gunakan pola nama berikut agar rapi:

```text
docs/evidence/week2-resource-group.png
docs/evidence/week2-vnet-subnets.png
docs/evidence/week2-nsg-rules.png
docs/evidence/week3-cosmos-containers.png
docs/evidence/week3-blob-raw-data.png
docs/evidence/week3-function-app.png
docs/evidence/week3-cloudflare-domain.png
docs/evidence/week4-application-insights.png
docs/evidence/week4-alert-rules.png
docs/evidence/week4-cost-management.png
docs/evidence/week4-security-recommendations.png
docs/evidence/week4-backup-recovery.png
```

Sebelum commit, cek ulang screenshot dan crop bagian yang memuat:

- Azure Function key.
- Cloudflare API token.
- connection string.
- access key.
- password.
- file `.tfvars`.
- tenant/subscription ID jika tidak diperlukan.
