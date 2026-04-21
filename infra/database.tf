# ================================================================
# 8. DATABASE - Azure Cosmos DB (Serverless)
#    Dipilih karena sangat fleksibel untuk data monitoring/JSON
# ================================================================

resource "azurerm_cosmosdb_account" "cosmos_acc" {
  name                = "cosmos-kelompok11-monitoring"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  # Mengaktifkan mode Serverless (Tanpa biaya bulanan flat)
  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.rg.location
    failover_priority = 0
  }

  tags = local.common_tags
}

# Membuat Database di dalam Cosmos DB Account
resource "azurerm_cosmosdb_sql_database" "main_db" {
  name                = "db-platform-monitoring"
  resource_group_name = azurerm_cosmosdb_account.cosmos_acc.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos_acc.name
}

# Membuat Container (Tabel) untuk menyimpan data sensor/telemetri
resource "azurerm_cosmosdb_sql_container" "container_telemetry" {
  name                = "telemetry-data"
  resource_group_name = azurerm_cosmosdb_account.cosmos_acc.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos_acc.name
  database_name       = azurerm_cosmosdb_sql_database.main_db.name
  
  # Partition Key sangat penting untuk performa query monitoring
  partition_key_path  = "/deviceId"
  
  # Indexing policy default sudah cukup untuk awal
  indexing_policy {
    indexing_mode = "consistent"
  }
}