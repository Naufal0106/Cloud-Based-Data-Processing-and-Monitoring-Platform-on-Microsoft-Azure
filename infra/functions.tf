# ================================================================
# 9. COMPUTE #2 - Azure Functions (Serverless Backend)
# ================================================================

# 1. Storage Account khusus untuk kebutuhan internal Function App
# Nama harus unik secara global (gunakan huruf kecil dan angka saja)
resource "azurerm_storage_account" "func_storage" {
  name                     = "stfuncmonitoringk11" # Silakan ganti jika nama ini sudah terpakai
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = local.common_tags
}

# 2. Service Plan dengan mode Consumption (Serverless)
resource "azurerm_service_plan" "func_plan" {
  name                = "ASP-Serverless-Kelompok11"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "Y1" # Y1 adalah SKU untuk mode Serverless/Consumption
  tags                = local.common_tags
}

# 3. Azure Linux Function App
resource "azurerm_linux_function_app" "func_app" {
  name                = "func-backend-monitoring-k11"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  storage_account_name       = azurerm_storage_account.func_storage.name
  storage_account_access_key = azurerm_storage_account.func_storage.primary_access_key
  service_plan_id            = azurerm_service_plan.func_plan.id

  site_config {
    application_stack {
      python_version = "3.9" # Sesuaikan jika ingin menggunakan Node.js atau bahasa lain
    }
  }

  # Pengaturan Aplikasi (Environment Variables)
  app_settings = {
    # Otomatis mengambil connection string dari database yang dibuat di database.tf
    "COSMOSDB_CONNECTION_STRING" = azurerm_cosmosdb_account.cosmos_acc.primary_sql_connection_string
    "FUNCTIONS_WORKER_RUNTIME"   = "python"
  }

  tags = local.common_tags
}