# ================================================================
# TERRAFORM EVIDENCE MAP
# ================================================================
# File ini menjadi bukti program bahwa perubahan Azure proyek
# Kelompok 11 direpresentasikan dalam Infrastructure as Code.
# Tidak ada API key, token, connection string literal, atau password
# yang ditulis di sini.

locals {
  azure_change_evidence = {
    minggu_1 = {
      fokus = "Perencanaan arsitektur cloud dan desain platform"
      file_tf = [
        "locals.tf",
        "backend.tf"
      ]
      resource_azure = [
        "Resource Group RG-Kelompok11 sebagai wadah utama proyek",
        "Konfigurasi backend Terraform remote state di Azure Storage"
      ]
    }

    minggu_2 = {
      fokus = "Infrastruktur dasar, jaringan, akses, dan keamanan awal"
      file_tf = [
        "main.tf",
        "security.tf",
        "iam.tf"
      ]
      resource_azure = [
        "Virtual Network VNet-Utama-Kelompok11",
        "Subnet-Publik dan Subnet-Privat",
        "Public IP dan Network Interface untuk VM",
        "Linux VM VM-Web-Kelompok11 sebagai eksplorasi target Minggu 2",
        "Network Security Group publik dan privat",
        "Role assignment IAM untuk anggota tim"
      ]
    }

    minggu_3 = {
      fokus = "Layanan inti backend, database, storage, dan secret management"
      file_tf = [
        "database.tf",
        "functions.tf",
        "security.tf",
        "storage.tf",
        "network.tf"
      ]
      resource_azure = [
        "Azure Function App func-backend-monitoring-k11",
        "Azure Service Plan serverless ASP-Serverless-Kelompok11",
        "Storage Account stfuncmonitoringk11 untuk Function App dan raw-data",
        "Blob container raw-data untuk upload JSON, CSV, XLSX, dan XLS",
        "Cosmos DB account cosmos-kelompok11-monitoring",
        "Cosmos DB database db-platform-monitoring",
        "Cosmos DB container telemetry-data dan users",
        "Azure Key Vault kv-monitoring-k11-naufal",
        "Static website storage stwebdashboardk11",
        "Traffic Manager profile tm-monitoring-k11",
        "Azure App Service backup app-backend-backup-k11"
      ]
    }

    minggu_4 = {
      fokus = "Monitoring, alerting, backup, keamanan, dan optimasi biaya"
      file_tf = [
        "main.tf",
        "monitoring.tf",
        "security.tf",
        "network.tf"
      ]
      resource_azure = [
        "Application Insights func-backend-monitoring-k11",
        "Azure Monitor action group ag-kelompok11-ops",
        "Metric alert alert-function-5xx-errors",
        "Metric alert alert-function-latency",
        "Metric alert alert-vm-cpu-high",
        "Diagnostic settings terpusat ke Log Analytics untuk Function App, Cosmos DB, dan Blob Storage",
        "Storage lifecycle policy raw-data-retention untuk retensi file mentah",
        "Key Vault secret reference untuk AUTH_TOKEN_SECRET",
        "Traffic Manager endpoint failover untuk Azure Functions primary dan App Service backup"
      ]
    }
  }
}

output "azure_change_evidence" {
  description = "Ringkasan bukti perubahan Azure per minggu dalam format Terraform tanpa nilai secret."
  value       = local.azure_change_evidence
}
