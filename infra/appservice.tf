# ================================================================
# COMPUTE #2 - Azure App Service Backup Backend
# Digunakan sebagai secondary/backup endpoint untuk Traffic Manager
# agar arsitektur punya 2 compute engine tanpa menyalakan VM terus.
# ================================================================

resource "azurerm_service_plan" "backup_app_plan" {
  name                = "ASP-BackupBackend-Kelompok11"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  # Windows F1 dipilih agar low cost/free tier.
  # Jika F1 tidak tersedia di subscription/region, ganti ke B1.
  os_type  = "Windows"
  sku_name = var.backup_app_service_sku

  tags = local.common_tags
}

resource "azurerm_windows_web_app" "backup_backend" {
  name                = var.backup_app_service_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.backup_app_plan.id

  https_only = true

  identity {
    type = "SystemAssigned"
  }

  lifecycle {
    ignore_changes = [
      site_config[0].virtual_application,
      zip_deploy_file
    ]
  }

  site_config {
    always_on  = false
    ftps_state = "Disabled"

    application_stack {
      current_stack = "node"
      node_version  = "~20"
    }
  }

  app_settings = {
    # Identitas service
    "SERVICE_NAME" = "K11 Backup Backend"
    "APP_ROLE"     = "secondary-backend"

    # Konfigurasi database dan secret management.
    # Dipakai nanti jika backup backend dibuat membaca Cosmos DB.
    "COSMOS_DATABASE"        = azurerm_cosmosdb_sql_database.main_db.name
    "COSMOS_CONTAINER"       = azurerm_cosmosdb_sql_container.container_telemetry.name
    "COSMOS_USERS_CONTAINER" = azurerm_cosmosdb_sql_container.container_users.name
    "KEY_VAULT_URL"          = azurerm_key_vault.kv.vault_uri
    "AUTH_TOKEN_SECRET"      = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.auth_token_secret.id})"

    # Monitoring
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
  }

  tags = local.common_tags
}

# App Service backup diberi akses baca secret Key Vault.
# Ini membuat backup backend tetap mengikuti prinsip secret management,
# bukan menyimpan connection string langsung di source code.
resource "azurerm_key_vault_access_policy" "backup_app_access" {
  key_vault_id = azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_windows_web_app.backup_backend.identity[0].principal_id

  secret_permissions = ["Get", "List"]
}