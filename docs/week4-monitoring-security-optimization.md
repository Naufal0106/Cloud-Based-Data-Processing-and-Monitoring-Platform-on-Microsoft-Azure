# Monitoring, Keamanan, dan Optimasi

Minggu 4 - Kelompok 11

## Tujuan

Minggu 4 berfokus pada kesiapan operasional sistem: observability, alerting, hardening keamanan, backup, dan cost-awareness. Dokumen ini merangkum konfigurasi yang tersedia di project serta bukti yang perlu disiapkan dari Azure Portal saat demo atau pengumpulan.

## Monitoring dan Logging

Monitoring backend menggunakan Azure Application Insights yang terhubung ke Azure Functions melalui app setting:

```text
APPLICATIONINSIGHTS_CONNECTION_STRING
APPINSIGHTS_SAMPLING_PERCENTAGE=100
PYTHON_ENABLE_WORKER_EXTENSIONS=1
```

Metrik yang dipantau:

| Metrik | Sumber | Tujuan |
| --- | --- | --- |
| Request count | Azure Functions / Application Insights | Melihat traffic API |
| Response time / latency | Azure Functions / Application Insights | Menilai performa endpoint |
| HTTP 5xx | Azure Functions / Application Insights | Deteksi error backend |
| CPU VM eksplorasi M2 | Azure Monitor VM metric | Bukti monitoring resource VM jika resource eksplorasi masih aktif |
| Storage transactions | Azure Storage metric | Memantau aktivitas Blob Storage `raw-data` |
| Cosmos DB requests/availability | Azure Monitor metric | Memantau beban dan availability database |
| Storage capacity | Azure Storage metric | Deteksi pertumbuhan file mentah |

## Alert Rule

Terraform lokal menyiapkan alert rule pada `infra/monitoring.tf`.

| Alert | Target | Threshold | Alasan |
| --- | --- | --- | --- |
| Function 5xx Error | Azure Function App | HTTP 5xx lebih dari 5 dalam 5 menit | Menangkap error API |
| Function Latency | Azure Function App | Average response time lebih dari 2 detik | Menangkap penurunan performa |
| VM CPU High | VM eksplorasi M2 | CPU rata-rata lebih dari 80% selama 5 menit | Bukti alert untuk resource eksplorasi, bukan workload runtime final |

Action group:

```text
ag-kelompok11-ops
```

Email notifikasi dikonfigurasi melalui variable Terraform:

```text
alert_email
```

## Centralized Logging

Log aplikasi masuk ke Application Insights dari Azure Functions. Log tersebut dapat dipakai untuk:

- melihat request yang gagal,
- melihat exception backend,
- memeriksa latency endpoint,
- membuat query investigasi pada Log Analytics Workspace.

Query contoh untuk investigasi error:

```kusto
exceptions
| order by timestamp desc
| take 20
```

Query contoh untuk latency request:

```kusto
requests
| summarize avg(duration), percentile(duration, 95) by name
| order by avg_duration desc
```

## Security Audit

Baseline keamanan yang sudah diterapkan:

| Area | Implementasi | Status |
| --- | --- | --- |
| Secret frontend | Browser hanya memanggil `/api`; function key berada di Cloudflare environment variable | Selesai |
| Secret backend | Cosmos connection string dan auth token secret berada di Key Vault | Selesai |
| Auth user | Password disimpan dengan PBKDF2 hash | Selesai |
| Role access | Register publik hanya role `user`; admin endpoint butuh role `admin` | Selesai |
| Data isolation | User biasa hanya membaca data upload miliknya sendiri | Selesai |
| Network | NSG publik dan privat tersedia di Terraform | Selesai |
| VM access | VM hanya resource eksplorasi M2; jika masih aktif, SSH sebaiknya dibatasi ke IP admin | Perlu hardening jika VM dinyalakan |
| Repo hygiene | `.env`, `.tfvars`, state, key, dan local config diabaikan `.gitignore` | Selesai |

Temuan dan mitigasi:

| Temuan | Risiko | Mitigasi |
| --- | --- | --- |
| Function key pernah berisiko terekspos jika dipanggil langsung dari frontend | Penyalahgunaan API backend | Proxy `/api` Cloudflare dan secret server-side |
| Data lama bisa terlihat lintas user jika query global | Privasi data dashboard | Query telemetry dibatasi `owner_user_id` untuk role `user` |
| SSH VM eksplorasi dapat berisiko jika dibuka luas | Akses brute force ke VM non-runtime | Batasi `source_address_prefix` ke IP admin jika VM masih digunakan |
| File lokal agent dan arsip zip dapat masuk repo | Kebocoran catatan/internal artifact | `AGENTS.md` dan `*.zip` masuk `.gitignore` |

## Backup dan Recovery

Strategi backup proyek:

| Komponen | Strategi |
| --- | --- |
| Cosmos DB | Backup otomatis platform Cosmos DB; recovery mengikuti fitur restore Azure Portal sesuai konfigurasi account |
| Blob Storage `raw-data` | Lifecycle policy Terraform untuk mempertahankan data dan menghapus versi lama sesuai kebutuhan biaya |
| Source code | GitHub sebagai version control dan audit history |
| Secret | Key Vault sebagai sumber secret backend |

Simulasi recovery yang disarankan untuk bukti Minggu 4:

1. Upload file kecil ke dashboard.
2. Pastikan record masuk ke Cosmos DB.
3. Export satu sample record dari Cosmos DB sebagai bukti recovery data.
4. Upload ulang file yang sama dari backup lokal/blob untuk membuktikan pipeline bisa memproses ulang.
5. Lampirkan screenshot Cosmos DB dan Application Insights.

## Cost Analysis dan Optimasi

Estimasi awal menggunakan pendekatan hemat biaya:

| Layanan | Mode Hemat |
| --- | --- |
| Azure Functions | Consumption plan `Y1`, bayar sesuai eksekusi |
| Cosmos DB | Serverless, cocok untuk traffic kecil/proyek |
| Storage Account | Standard LRS |
| Cloudflare Pages | Static hosting untuk mengurangi beban Azure frontend |
| Application Insights | Sampling 100% untuk demo; dapat diturunkan jika traffic tinggi |
| Custom Domain (Domainesia) | Domain `.my.id` dengan sewa tetap Rp 15.000/tahun |

Rekomendasi optimasi yang diterapkan/direncanakan:

| Optimasi | Dampak |
| --- | --- |
| Cloudflare Pages untuk frontend | Mengurangi kebutuhan VM aktif sebagai frontend utama |
| Azure App Service backup minimal | Memberi endpoint fallback tanpa menjalankan VM aktif |
| Azure Functions Consumption Plan | Menghindari biaya compute idle backend |
| Cosmos DB Serverless | Menghindari throughput provisioned yang tidak terpakai |
| Storage lifecycle policy | Mengontrol pertumbuhan file mentah lama |
| Matikan VM eksplorasi M2 saat tidak dipakai | Mengurangi biaya compute non-esensial karena VM bukan runtime final |

## Bukti Yang Perlu Diambil Dari Console

Beberapa deliverable Minggu 4 tetap membutuhkan screenshot dari Azure Portal:

- Application Insights overview atau live metrics.
- Azure Monitor alert rules.
- Action group alert.
- Cosmos DB backup/restore settings atau bukti export/recovery test.
- Cost Management breakdown untuk resource group `RG-Kelompok11`.
- Microsoft Defender for Cloud/Security posture atau rekomendasi keamanan.

Daftar nama file screenshot yang disarankan tersedia di `docs/evidence/README.md`.

## Bukti Azure Yang Sudah Diambil

| Bukti | File |
| --- | --- |
| Application Insights dan metrik Azure | `docs/evidence/week4-application-insights-metrics.png` |
| Azure Monitor alert rules dan action group | `docs/evidence/week4-alert-rules-action-group.png` |
| Cosmos DB backup policy dan Blob Storage | `docs/evidence/week4-cosmos-storage-backup.png` |
| Defender/Security pricing dan Cost Management usage | `docs/evidence/week4-security-cost-management.png` |

## Status Minggu 4

| Deliverable | Status |
| --- | --- |
| Dashboard monitoring | Application Insights tersedia dan bukti metrik sudah dilampirkan |
| Alerting minimal 3 rule | 3 Azure Monitor alert rule sudah dibuat dan bukti sudah dilampirkan |
| Security audit | Baseline ditulis dan bukti Defender/Security pricing sudah dilampirkan |
| Backup dan recovery | Cosmos backup policy dan Blob container sudah dilampirkan |
| Cost analysis | Cost usage CLI sudah dilampirkan; screenshot portal opsional jika butuh nominal |

## Catatan Runtime Final

Runtime aplikasi final tidak bergantung pada VM. Jalur aktif adalah Cloudflare Pages, Cloudflare Pages Function proxy, Azure Functions, Blob Storage, Cosmos DB, Key Vault, dan Application Insights/Azure Monitor. VM dipertahankan dalam dokumentasi Minggu 2 sebagai bukti eksplorasi target infrastruktur.

## Kesimpulan

Minggu 4 sudah memiliki baseline operasional di project. Bagian yang perlu dilengkapi sebelum pengumpulan adalah screenshot dari Azure Portal untuk membuktikan monitoring, alerting, security posture, backup/recovery, dan cost analysis benar-benar aktif pada environment cloud.
