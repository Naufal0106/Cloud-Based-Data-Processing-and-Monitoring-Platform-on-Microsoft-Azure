# Terraform Infrastructure Evidence

Folder ini berisi bukti program Infrastructure as Code untuk resource Azure proyek Kelompok 11. File `.tf` merepresentasikan perubahan yang sudah dibuat di Azure untuk roadmap Minggu 1 sampai Minggu 4.

## Keamanan

- File `.tf` tidak menyimpan API key, function key, password asli, token, atau connection string literal.
- Nilai sensitif diisi lewat variable lokal seperti `admin_password`, `auth_token_secret`, dan file `.tfvars` yang tetap masuk `.gitignore`.
- File state, plan, crash log, dan folder `.terraform/` tidak boleh dicommit karena dapat berisi data sensitif.
- Secret aplikasi diarahkan melalui Azure Key Vault dan App Settings, bukan ditulis di frontend.

## Pemetaan File

| File | Bukti Azure |
| --- | --- |
| `backend.tf` | Remote backend Terraform di Azure Storage |
| `locals.tf` | Tag standar proyek |
| `main.tf` | Resource group, VNet, subnet, VM, public IP, NIC, Application Insights |
| `security.tf` | NSG publik/privat, Key Vault, access policy, secret reference |
| `iam.tf` | Role assignment tim berdasarkan prinsip least privilege |
| `database.tf` | Cosmos DB account, database, container telemetry, container user |
| `functions.tf` | Storage Function App, service plan serverless, Function App, raw-data container |
| `storage.tf` | Storage static website sebagai backup hosting dashboard |
| `network.tf` | Traffic Manager dan endpoint failover |
| `monitoring.tf` | Action group, metric alert, diagnostic settings terpusat, dan storage lifecycle policy |
| `evidence.tf` | Ringkasan perubahan Azure per minggu dalam format Terraform |

## Resource yang Dibuat Manual di Azure

Beberapa resource monitoring Minggu 4 pernah dibuat langsung melalui Azure CLI atau Azure Portal untuk kebutuhan screenshot laporan. Jika resource tersebut sudah ada di Azure tetapi belum masuk state Terraform, jalankan `terraform import` sebelum `terraform apply`.

Gunakan placeholder `<SUBSCRIPTION_ID>` sesuai subscription aktif:

```powershell
terraform -chdir=infra import azurerm_monitor_action_group.ops "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/RG-Kelompok11/providers/Microsoft.Insights/actionGroups/ag-kelompok11-ops"
terraform -chdir=infra import azurerm_monitor_metric_alert.function_5xx_errors "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/RG-Kelompok11/providers/Microsoft.Insights/metricAlerts/alert-function-5xx-errors"
terraform -chdir=infra import azurerm_monitor_metric_alert.function_latency "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/RG-Kelompok11/providers/Microsoft.Insights/metricAlerts/alert-function-latency"
terraform -chdir=infra import azurerm_monitor_metric_alert.vm_cpu_high "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/RG-Kelompok11/providers/Microsoft.Insights/metricAlerts/alert-vm-cpu-high"
```

Jika lifecycle policy storage `raw-data-retention` juga sudah ada di Azure, import dengan:

```powershell
terraform -chdir=infra import azurerm_storage_management_policy.raw_data_lifecycle "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/RG-Kelompok11/providers/Microsoft.Storage/storageAccounts/stfuncmonitoringk11/managementPolicies/default"
```

## Validasi Lokal

Validasi tanpa menyentuh remote state:

```powershell
terraform -chdir=infra init -backend=false
terraform -chdir=infra fmt
terraform -chdir=infra validate
```
