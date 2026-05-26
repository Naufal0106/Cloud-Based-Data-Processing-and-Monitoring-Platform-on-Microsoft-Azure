# ================================================================
# 9. COMPUTE #2 - Azure Functions (Serverless Backend)
# ================================================================

# 1. Storage Account khusus untuk kebutuhan internal Function App
resource "azurerm_storage_account" "func_storage" {
  name                     = "stfuncmonitoringk11"
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
  sku_name            = "Y1"
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

  identity {
    type = "SystemAssigned"
  }

  lifecycle {
    ignore_changes = [
      app_settings,
      site_config[0].application_insights_connection_string,
      site_config[0].app_service_logs,
      site_config[0].cors,
      tags["hidden-link: /app-insights-resource-id"],
      storage_account_access_key
    ]
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
    ftps_state = "Disabled"
  }

  # Pengaturan Aplikasi (Environment Variables)
  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"    = "python"
    "FUNCTIONS_EXTENSION_VERSION" = "~4"

    # Syarat agar Azure nginstal library via Oryx
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    "ENABLE_ORYX_BUILD"              = "true"

    # Buat Minggu 4: Biar Application Map & Monitoring Jalan
    "PYTHON_ENABLE_WORKER_EXTENSIONS" = "1"
    "APPINSIGHTS_SAMPLING_PERCENTAGE" = "100"

    # Konfigurasi Database & Vault
    "COSMOS_DATABASE"        = azurerm_cosmosdb_sql_database.main_db.name
    "COSMOS_CONTAINER"       = azurerm_cosmosdb_sql_container.container_telemetry.name
    "COSMOS_USERS_CONTAINER" = azurerm_cosmosdb_sql_container.container_users.name
    "KEY_VAULT_URL"          = azurerm_key_vault.kv.vault_uri
    "AUTH_TOKEN_SECRET"      = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.auth_token_secret.id})"

    # Konfigurasi Admin Operations Dashboard
    "AZURE_SUBSCRIPTION_ID"      = var.azure_subscription_id
    "AZURE_RESOURCE_GROUP"       = azurerm_resource_group.rg.name
    "AZURE_FUNCTION_APP_NAME"    = "func-backend-monitoring-k11"
    "AZURE_STORAGE_ACCOUNT_NAME" = azurerm_storage_account.func_storage.name
    "AZURE_COSMOS_ACCOUNT_NAME"  = azurerm_cosmosdb_account.cosmos_acc.name
    "AZURE_VM_NAME"              = var.azure_vm_name
    "CLOUDFLARE_ZONE_ID"         = var.cloudflare_zone_id

    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
  }

  tags = local.common_tags
}

# Container untuk trigger blob
resource "azurerm_storage_container" "raw_data" {
  name                  = "raw-data"
  storage_account_name  = azurerm_storage_account.func_storage.name
  container_access_type = "private"
}
