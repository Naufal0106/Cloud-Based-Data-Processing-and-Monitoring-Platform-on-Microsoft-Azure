# Bukti Screenshot Roadmap Minggu 1-4

Folder ini menyimpan bukti visual yang aman untuk dilampirkan pada laporan atau presentasi. Screenshot yang berisi secret, token, function key, connection string, atau detail nameserver tidak boleh dimasukkan ke repository.

## Bukti Yang Sudah Ada

| Minggu | Bukti | File |
| --- | --- | --- |
| Minggu 1 | Diagram arsitektur target | `architecture-final-target.png` |
| Minggu 3 | Halaman login kosong untuk akun baru | `ui-login.png` |
| Minggu 3 | Halaman register | `ui-register.png` |
| Minggu 3 | Preview dashboard role user | `ui-user-preview.png` |
| Minggu 3 | Preview dashboard role admin | `ui-admin-preview.png` |

## Bukti Console Yang Perlu Diambil Manual

Beberapa bukti harus diambil dari Azure Portal atau Cloudflare dashboard karena membutuhkan sesi login dan state resource cloud yang aktif.

| Minggu | Screenshot Yang Disarankan | Lokasi Portal | Catatan Sensor |
| --- | --- | --- | --- |
| Minggu 2 | Resource Group `RG-Kelompok11` berisi resource project | Azure Portal > Resource groups | Jangan tampilkan subscription ID penuh jika tidak perlu |
| Minggu 2 | VNet, public subnet, private subnet | Azure Portal > Virtual networks | Aman ditampilkan |
| Minggu 2 | NSG rules publik/privat | Azure Portal > Network security groups | Mask IP admin jika ada |
| Minggu 2 | IAM role assignment tim | Azure Portal > Access control (IAM) | Tampilkan role, sembunyikan email bila perlu |
| Minggu 3 | Cosmos DB database dan container `telemetry-data`, `users` | Azure Portal > Cosmos DB | Jangan tampilkan connection string/key |
| Minggu 3 | Blob container `raw-data` | Azure Portal > Storage Account > Containers | Jangan buka access key |
| Minggu 3 | Azure Function App endpoint/status | Azure Portal > Function App | Jangan tampilkan function key |
| Minggu 3 | Cloudflare Pages custom domain aktif | Cloudflare Pages > Custom domains | Jangan tampilkan token/API key |
| Minggu 4 | Application Insights overview/request metrics | Azure Portal > Application Insights | Aman ditampilkan |
| Minggu 4 | Alert rules dan action group | Azure Monitor > Alerts | Mask email notifikasi jika perlu |
| Minggu 4 | Cost Management breakdown | Azure Portal > Cost Management | Aman jika nominal boleh dibagikan |
| Minggu 4 | Defender for Cloud/Security recommendations | Azure Portal > Defender for Cloud | Hindari menampilkan ID tenant/subscription penuh |
| Minggu 4 | Backup/recovery evidence | Cosmos DB/Storage export atau restore evidence | Jangan tampilkan secret |

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
