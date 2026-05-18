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

  # Mengaktifkan mode Serverless
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

  # Partition Key (Gunakan versi jamak agar cocok dengan tipe data list/tuple [])
  partition_key_paths = ["/deviceId"]

  # Indexing policy didefinisikan eksplisit agar sinkron dengan state Azure
  indexing_policy {
    indexing_mode = "consistent"

    # Mengindeks seluruh properti JSON agar query pencarian lancar
    included_path {
      path = "/*"
    }

    # (Opsional) Mengecualikan properti internal Azure untuk efisiensi
    excluded_path {
      path = "/\"_etag\"/?"
    }
  }
}

# Container khusus untuk data login/register user dashboard
resource "azurerm_cosmosdb_sql_container" "container_users" {
  name                = "users"
  resource_group_name = azurerm_cosmosdb_account.cosmos_acc.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos_acc.name
  database_name       = azurerm_cosmosdb_sql_database.main_db.name

  partition_key_paths = ["/email"]

  unique_key {
    paths = ["/email"]
  }

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }
  }
}
