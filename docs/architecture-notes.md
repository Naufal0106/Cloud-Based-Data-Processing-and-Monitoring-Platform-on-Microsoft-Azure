# Catatan Arsitektur Sistem

Final Project Cloud Computing - Kelompok 11

## Tujuan

Dokumen ini menjelaskan desain arsitektur akhir untuk platform data processing dan monitoring. Arsitektur yang digunakan adalah hybrid deployment: frontend berada di Cloudflare Pages, sedangkan backend dan layanan data berjalan di Microsoft Azure.

## Ringkasan Arsitektur

Domain production:

```text
https://kelompok11cc.my.id
```

```text
User
  |
  v
Cloudflare Pages / kelompok11cc.my.id
  |
  v
Dashboard Frontend
  |
  v
Azure Functions API
  |
  +-- Azure Key Vault
  +-- Azure Blob Storage
  +-- Azure Cosmos DB
  +-- Azure Application Insights
```

## Komponen Utama

| Layer | Layanan | Peran |
| --- | --- | --- |
| Frontend | Cloudflare Pages + `kelompok11cc.my.id` | Hosting dashboard statis |
| Backend | Azure Functions | API, upload data, blob trigger, data enrichment |
| Storage | Azure Blob Storage | Penyimpanan file mentah JSON, CSV, dan Excel pada container `raw-data` |
| Database | Azure Cosmos DB for NoSQL | Penyimpanan hasil pemrosesan data dan data user |
| Secrets | Azure Key Vault | Penyimpanan Cosmos DB connection string dan auth token secret |
| Monitoring | Azure Application Insights | Observability, request log, dan error monitoring |
| IaC | Terraform | Provisioning resource Azure |
| CI/CD | GitHub Actions | Deployment backend ke Azure Functions |

## Alasan Pemilihan Desain

Cloudflare Pages dipilih untuk frontend karena cocok untuk dashboard statis, mudah dideploy dari repository, dan memberikan distribusi konten yang cepat. Azure tetap digunakan untuk backend karena menyediakan layanan serverless, database NoSQL, storage, secret management, dan observability yang terintegrasi.

Azure Functions dipakai karena workload pemrosesan data bersifat event-driven. Function dapat menerima upload JSON, CSV, dan Excel melalui HTTP dan juga memproses file baru dari Blob Storage secara otomatis.

Cosmos DB dipilih karena data monitoring dan data user berbentuk JSON dan skemanya fleksibel. Container `telemetry-data` menggunakan partition key `/deviceId`, sehingga setiap record telemetry harus memiliki field `deviceId`. Container `users` digunakan khusus untuk login/register dan memakai partition key `/email`.

## Alur Data

1. User membuka dashboard dari Cloudflare Pages.
2. User melakukan login atau register melalui proxy `/api`.
3. Backend mengembalikan token sesi jika kredensial valid.
4. Dashboard mengirim token melalui header `Authorization` saat membaca data atau upload.
5. User dapat upload JSON, CSV, XLSX, atau XLS melalui endpoint `POST /api/upload`.
6. File dengan format yang sama juga dapat masuk melalui Blob Storage container `raw-data`.
7. Azure Functions melakukan parsing, enrichment, status classification, dan penyimpanan data.
8. Hasil proses disimpan di Azure Cosmos DB.
9. Dashboard membaca statistik dan record terbaru melalui endpoint `GET /api/stats` dan `GET /api/data`.

## Strategi Keamanan

- Function key digunakan di sisi server proxy untuk endpoint Azure `stats`, `data`, dan `upload`.
- User dashboard harus login sebelum mengakses data dan upload.
- Password disimpan dengan hash PBKDF2.
- Token login ditandatangani dengan `AUTH_TOKEN_SECRET`.
- Secret Cosmos DB disimpan di Azure Key Vault.
- Function App menggunakan managed identity untuk akses ke Key Vault.
- Network Security Group membatasi inbound traffic pada subnet publik dan privat.
- SSH ke VM sebaiknya dibatasi ke IP admin.
- Function key tidak boleh di-hardcode di repository atau frontend.

## Skalabilitas

Arsitektur ini dapat dikembangkan dengan:

- API Management atau Cloudflare Pages Function untuk lapisan proxy API.
- Custom domain Cloudflare Pages: `kelompok11cc.my.id`.
- Private endpoint untuk resource Azure.
- Alerting di Azure Monitor atau Application Insights.
- Queue-based processing jika volume data meningkat.

## Catatan Implementasi

- Region Azure pada Terraform saat ini: `southeastasia`.
- Frontend utama: Cloudflare Pages.
- VM dan Azure Static Website masih dapat digunakan sebagai opsi backup atau kebutuhan demonstrasi, tetapi bukan jalur utama frontend.
